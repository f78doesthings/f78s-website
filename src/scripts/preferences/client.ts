/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

// Client-side functions for preferences (such as loading and saving)
import { PresetPreference } from "./types/PresetPreference.ts";
import { type PreferenceID, preferences } from "./index.ts";

const PREFERENCES_KEY = "preferences";

export function loadPreferences() {
	try {
		for (const preference of preferences) {
			if (preference instanceof PresetPreference || preference.get() === undefined) {
				preference.set(preference.defaultValue());
			}
		}

		const json = localStorage.getItem(PREFERENCES_KEY);
		if (!json) {
			return;
		}

		const data = JSON.parse(json);
		for (const [key, value] of Object.entries(data)) {
			if (key in preferences) {
				preferences[key as PreferenceID].set(value);
			}
		}
	} catch (e) {
		console.warn("Failed to load preferences:", e);
		alert("Your preferences could not be loaded. Reverting to defaults.");
	} finally {
		document.dispatchEvent(new Event("custom:preferences-updated"));
	}
}

export function savePreferences() {
	try {
		const json = JSON.stringify(preferences);
		localStorage.setItem(PREFERENCES_KEY, json);
		document.dispatchEvent(new Event("custom:preferences-updated"));
	} catch (e) {
		console.warn("Failed to save preferences:", e);
		alert("Failed to save preferences. You may need to give permission.");
	}
}

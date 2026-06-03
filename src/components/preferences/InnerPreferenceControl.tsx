/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { ComponentChildren } from "preact";
import { useEffect, useState } from "preact/hooks";

import { savePreferences } from "../../scripts/preferences/client.ts";
import { type PreferenceID, preferences } from "../../scripts/preferences/index.tsx";
import type { Preference } from "../../scripts/preferences/types/Preference.ts";
import type { NotUndefined } from "../../types.ts";

interface Props {
	preference: PreferenceID;

	[cid: string]: unknown;
}

export interface PreferenceControlState<T extends NotUndefined = NotUndefined> {
	onInput: (value: unknown) => void;
	value: T;
	hidden: boolean;
	cid: Record<string, unknown>;
}

/** A helper component containing the actual control part of the PreferenceControl component. */
export function InnerPreferenceControl({ preference: id, ...cid }: Props) {
	const preference: Preference = preferences[id];
	const [value, setValue] = useState(preference.fallbackValue);
	const [hidden, setHidden] = useState(true);

	const onInput = (input: unknown) => {
		const result = preference.set(input);
		if (result !== undefined) {
			savePreferences();
		}
	};

	const update = () => {
		setValue(preference.get());
		setHidden(preference.isAvailable());
		console.debug(preference.id, value, hidden);
	};
	useEffect(() => {
		document.addEventListener("custom:preferences-updated", update);
		update();
		return () => document.removeEventListener("custom:preferences-updated", update);
	});

	const state: PreferenceControlState = {
		onInput,
		value,
		hidden,
		cid,
	};
	return preference.toComponent(state);
}

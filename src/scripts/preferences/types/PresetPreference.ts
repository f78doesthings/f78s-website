/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { Preference } from "./Preference.ts";
import { type PreferenceKeys, type PreferenceValues } from "../utils.ts";
import { EnumPreference, type EnumPreferenceConfig, type EnumPreferenceValue } from "./EnumPreference.tsx";

interface PresetValue<T extends Preference[]> extends EnumPreferenceValue {
	/**
	 * The settings for this preset.
	 *
	 * If this is unspecified, this preset is treated as the "Custom" option.
	 * As such, you should have exactly one preset without settings; no more, no less.
	 */
	settings?: PreferenceValues<T>;
}

interface PresetPreferenceConfig<T extends string, P extends Preference[]>
	extends EnumPreferenceConfig<T, PresetValue<P>> {

	/** The list of preferences this preset setting affects. */
	preferences: P;
}

/** A setting that allows the user to choose from a list of presets that affect some preferences. */
export class PresetPreference<K extends string, T extends string, P extends Preference[]>
	extends EnumPreference<K, T, PresetValue<P>> implements PresetPreferenceConfig<T, P> {

	readonly preferences: P;

	constructor(id: K, config: PresetPreferenceConfig<T, P>) {
		let customValue: T | undefined;
		for (const presetName in config.options) {
			if (config.options[presetName].settings === undefined) {
				if (customValue !== undefined) {
					console.warn(`Preset preference ${id} has more than 1 custom value, using ${customValue}:`, presetName);
				} else {
					customValue = presetName;
				}
			}
		}

		if (!customValue) {
			console.warn(`Preset preference ${id} has no custom value`);
		}

		super(id, config, customValue);
		this.preferences = config.preferences;
		this._customValue = customValue;
	}

	/** Creates a new preset setting for the given preferences and returns all of them. */
	static create<K extends string, const T extends string, P extends Preference[]>(
		id: K, config: EnumPreferenceConfig<T, PresetValue<P>>, ...preferences: P
	) {
		return [new PresetPreference(id, { ...config, preferences }), ...preferences] as const;
	}

	override get(): T {
		for (const presetName in this.options) {
			const preset = this.options[presetName];
			if (!preset.settings) {
				continue;
			}

			let matches = true;
			for (const preference of this.preferences) {
				if (
					preference.id in preset.settings &&
					!preference.equals(preset.settings[preference.id as PreferenceKeys<P>])
				) {
					matches = false;
					break;
				}
			}

			if (matches) {
				return presetName;
			}
		}

		return this.fallbackValue;
	}

	override set(value: unknown) {
		const transformedValue = super.set(value);
		if (transformedValue !== undefined) {
			const preset = this.options[transformedValue];
			if (!preset.settings) {
				return transformedValue;
			}

			for (const preference of this.preferences) {
				if (preference.id in preset.settings) {
					preference.set(preset.settings[preference.id as PreferenceKeys<P>]);
				}
			}
		}

		return transformedValue;
	}
}

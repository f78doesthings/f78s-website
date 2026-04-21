import { Preference } from "./Preference.ts";
import type { PreferenceKeys, PreferenceValues } from "../utils.ts";
import { EnumPreference, type EnumPreferenceConfig, type EnumPreferenceValue } from "./EnumPreference.ts";

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
		let fallbackValue: T | undefined;
		for (const presetName in config.options) {
			if (config.options[presetName].settings === undefined) {
				fallbackValue = presetName;
				break;
			}
		}

		super(id, config, fallbackValue);
		this.preferences = config.preferences;
	}

	/** Creates a new preset setting for the given preferences and returns all of them. */
	static create<K extends string, P extends Preference[], T extends string>
	(id: K, config: EnumPreferenceConfig<T, PresetValue<P>>, ...preferences: P) {

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
					preference.get() !== preset.settings[preference.id as PreferenceKeys<P>]
				) {
					matches = false;
					break;
				}
			}

			if (matches) {
				return presetName;
			}
		}

		return this._fallbackValue;
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

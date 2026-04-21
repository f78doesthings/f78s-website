import { Preference, type PreferenceConfig } from "./Preference.ts";

export interface EnumPreferenceValue {
	/** The display name of this option. */
	displayName?: string;

	/** The icon displayed when this option is selected. */
	icon?: string;
}

export interface EnumPreferenceConfig<T extends string, V extends EnumPreferenceValue = EnumPreferenceValue>
	extends PreferenceConfig<T> {

	/** The possible options. */
	options: Record<T, V>;
}

/** A setting with several options to choose from. */
export class EnumPreference<K extends string, T extends string, V extends EnumPreferenceValue = EnumPreferenceValue>
	extends Preference<K, T>
	implements EnumPreferenceConfig<T, V> {

	readonly options: Record<T, V>;
	protected _valueNames: T[];

	constructor(id: K, config: EnumPreferenceConfig<T, V>, fallbackValue?: T) {
		const valueNames = Object.keys(config.options) as T[];
		super(id, config, fallbackValue ?? valueNames[0]);
		this.options = config.options;
		this._valueNames = valueNames;
	}

	override validate(value: unknown): T | undefined {
		return this._valueNames.find(x => x === value);
	}
}

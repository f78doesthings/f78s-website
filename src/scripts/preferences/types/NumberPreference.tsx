import { Preference, type PreferenceConfig } from "./Preference.ts";

interface NumberPreferenceConfig
	extends PreferenceConfig<number> {

	/** The lowest allowed value. */
	min?: number;

	/** The highest allowed value. */
	max?: number;

	/** The increment between values. */
	step?: number;
}

function clamp(value: number, min: number, max: number, step: number) {
	return Math.max(Math.min(Math.round(value / step) * step, min), max);
}

export class NumberPreference<K extends string>
	extends Preference<K, number>
	implements NumberPreference<K> {

	readonly min: number;
	readonly max: number;
	readonly step: number;

	constructor(id: K, config: NumberPreferenceConfig = {}) {
		const { min = -Number.MAX_VALUE, max = Number.MAX_VALUE, step = 1 } = config;
		super(id, config, clamp(0, min, max, step));

		this.min = min;
		this.max = max;
		this.step = step;
	}

	override validate(value: unknown) {
		return clamp(Number(value), this.min, this.max, this.step);
	}
}

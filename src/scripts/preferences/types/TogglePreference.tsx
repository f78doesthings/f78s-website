import { Preference, type PreferenceConfig } from "./Preference.ts";

export type TriState<I extends boolean = true> = I extends true ? boolean | null : boolean;

interface TogglePreferenceConfig<I extends boolean = false>
	extends PreferenceConfig<TriState<I>> {

	/** Allows the user to choose a third indeterminate state for this preference, presented by the value `null`. */
	triState?: I;
}

/** An on-off setting that can optionally have a third indeterminate state. */
export class TogglePreference<K extends string = string, I extends boolean = false>
	extends Preference<K, TriState<I>>
	implements TogglePreferenceConfig<I> {

	readonly triState: I;

	constructor(id: K, config: TogglePreferenceConfig<I> = {}) {
		super(id, config, false);
		this.triState = config.triState ?? false as I;
	}

	override validate(value: TriState<I>): TriState<I> {
		return this.triState && value === null
			? null as TriState<I>
			: !!value;
	}
}

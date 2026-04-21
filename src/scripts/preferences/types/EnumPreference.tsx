import { Preference, type PreferenceConfig } from "./Preference.ts";
import { useEffect, useRef } from "preact/hooks";
import type { PreferenceControlState } from "../../../components/preferences/InnerPreferenceControl.tsx";

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
	protected _customValue?: T;

	constructor(id: K, config: EnumPreferenceConfig<T, V>, fallbackValue?: T) {
		const valueNames = Object.keys(config.options) as T[];
		super(id, config, fallbackValue ?? valueNames[0]);
		this.options = config.options;
		this._valueNames = valueNames;
	}

	override validate(value: unknown): T | undefined {
		return this._valueNames.find(x => x === value);
	}

	override toComponent({ onInput, value, children, cid }: PreferenceControlState<T>) {
		const ref = useRef<HTMLSelectElement>(null);
		useEffect(() => {
			const icons = ref.current?.parentElement?.querySelectorAll<SVGElement>("[data-option-icon]");
			icons?.forEach(icon => icon.classList.toggle("hidden", value !== icon.dataset.optionIcon));
		});

		return <>
			{children}
			<select ref={ref} name={this.id} {...cid} onInput={e => onInput(e.currentTarget.value)}>
				{this._valueNames.map(name => (
					<option key={name} value={name} selected={value === name} {...cid}
					        disabled={this._customValue && name === this._customValue}>

						{this.options[name].displayName ?? name}
					</option>
				))}
			</select>
		</>;
	}
}

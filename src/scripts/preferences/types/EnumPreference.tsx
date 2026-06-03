/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { useEffect, useRef } from "preact/hooks";

import type { PreferenceControlState } from "../../../components/preferences/InnerPreferenceControl.tsx";
import type { IconComponent } from "../../../types.ts";
import { Preference, type PreferenceConfig } from "./Preference.ts";

export interface EnumPreferenceValue {
	/** The display name of this option. */
	displayName?: string;

	/** The icon displayed when this option is selected. */
	icon?: IconComponent;
}

export interface EnumPreferenceConfig<
	T extends string,
	V extends EnumPreferenceValue = EnumPreferenceValue,
> extends PreferenceConfig<T> {
	/** The possible options. */
	options: Record<T, V>;
}

/** A setting with several options to choose from. */
export class EnumPreference<
	K extends string,
	T extends string,
	V extends EnumPreferenceValue = EnumPreferenceValue,
>
	extends Preference<K, T>
	implements EnumPreferenceConfig<T, V>
{
	readonly options: Record<T, V>;
	protected valueNames: T[];
	protected customValue?: T;

	constructor(id: K, config: EnumPreferenceConfig<T, V>, fallbackValue?: T) {
		// oxlint-disable-next-line typescript/no-unsafe-type-assertion
		const valueNames = Object.keys(config.options) as T[];
		super(id, config, fallbackValue ?? valueNames[0]);
		this.options = config.options;
		this.valueNames = valueNames;
	}

	override validate(value: unknown): T | undefined {
		return this.valueNames.find((x) => x === value);
	}

	override toComponent({ onInput, value, cid }: PreferenceControlState<T>) {
		const ref = useRef<HTMLSelectElement>(null);
		useEffect(() => {
			const icons = ref.current?.parentElement?.querySelectorAll<SVGElement>("[data-option-icon]");
			icons?.forEach((icon) => icon.classList.toggle("hidden", value !== icon.dataset.optionIcon));
		});

		return (
			<>
				{this.valueNames.map((name) => {
					const Icon = this.options[name].icon ?? (() => undefined);
					return (
						<Icon
							key={name}
							class="before-input"
							hidden={value !== name}
							width={20}
							height={20}
							{...cid}
						/>
					);
				})}
				<select ref={ref} name={this.id} {...cid} onInput={(e) => onInput(e.currentTarget.value)}>
					{this.valueNames.map((name) => (
						<option
							key={name}
							value={name}
							selected={value === name}
							{...cid}
							disabled={this.customValue && name === this.customValue}
						>
							{this.options[name].displayName ?? name}
						</option>
					))}
				</select>
			</>
		);
	}
}

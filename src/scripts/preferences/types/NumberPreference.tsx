/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { Preference, type PreferenceConfig } from "./Preference.ts";
import type { PreferenceControlState } from "../../../components/preferences/InnerPreferenceControl.tsx";
import { SITE_LANGUAGE } from "../../../consts.ts";

import { clampStepped } from "../../utils";

interface NumberPreferenceConfig
	extends PreferenceConfig<number> {

	/**
	 * The lowest allowed value.
	 * @default 0
	 */
	min?: number;

	/**
	 * The highest allowed value.
	 * @default Number.MAX_VALUE
	 */
	max?: number;

	/**
	 * The increment between values.
	 * @default 1
	 */
	step?: number;

	/**
	 * If true, uses a slider if a minimum and maximum value are given.
	 * @default true
	 */
	useSlider?: boolean;

	/** A function that formats the given number. */
	format?: (value: number) => string;
}

export class NumberPreference<K extends string>
	extends Preference<K, number>
	implements NumberPreference<K> {

	readonly min: number;
	readonly max: number;
	readonly step: number;
	readonly useSlider: boolean;
	readonly format;

	constructor(id: K, config: NumberPreferenceConfig = {}) {
		const { min = 0, max = Number.MAX_VALUE, step = 1, useSlider = true } = config;
		super(id, config, 0);

		this.min = min;
		this.max = max;
		this.step = step;
		this.useSlider = useSlider && min >= -Number.MAX_VALUE && max <= Number.MAX_VALUE;
		this.format = config.format ?? ((value) => value.toLocaleString(SITE_LANGUAGE));
	}

	override validate(value: unknown) {
		const number = clampStepped(Number(value), this.min, this.max, this.step);
		return isFinite(number) ? number : undefined;
	}

	override equals(other: unknown) {
		return Math.abs(this.get() - Number(other)) < Math.max(this.step / 10, Number.EPSILON);
	}

	override toComponent({ onInput, value, cid }: PreferenceControlState<number>) {
		//console.debug("initial:", this.id, value);
		return <>
			{this.useSlider && <span class="before-input number-display" {...cid}>{this.format(value)}</span>}
			<input name={this.id} type={this.useSlider ? "range" : "number"} {...cid}
			       min={this.min} max={this.max} step={this.step} value={value}
			       onInput={e => onInput(e.currentTarget.valueAsNumber)} />
		</>;
	}
}

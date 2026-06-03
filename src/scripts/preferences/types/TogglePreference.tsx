/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { useEffect, useRef } from "preact/hooks";

import type { PreferenceControlState } from "../../../components/preferences/InnerPreferenceControl.tsx";
import { Preference, type PreferenceConfig } from "./Preference.ts";

export type TriState<I extends boolean = true> = I extends true ? boolean | null : boolean;

interface TogglePreferenceConfig<I extends boolean = false> extends PreferenceConfig<TriState<I>> {
	/**
	 * Allows the user to choose a third indeterminate state for this preference, presented by the
	 * value `null`.
	 */
	triState?: I;
}

/** An on-off setting that can optionally have a third indeterminate state. */
export class TogglePreference<K extends string = string, I extends boolean = false>
	extends Preference<K, TriState<I>>
	implements TogglePreferenceConfig<I>
{
	readonly triState: I;

	constructor(id: K, config: TogglePreferenceConfig<I> = {}) {
		super(id, config, false);
		// oxlint-disable-next-line typescript/no-unsafe-type-assertion - not ideal
		this.triState = config.triState ?? (false as I);
	}

	/** Returns whether this preference is both visible and enabled. */
	isEnabled(): TriState<I> {
		return this.isAvailable() && this.get();
	}

	override validate(value: TriState<I>): TriState<I> {
		// oxlint-disable-next-line typescript/no-unsafe-type-assertion - this.triState is checked here
		return this.triState && value === null ? (null as TriState<I>) : !!value;
	}

	override toComponent({ onInput, value, cid }: PreferenceControlState<TriState<I>>) {
		const ref = useRef<HTMLInputElement>(null);
		useEffect(() => {
			if (ref.current) {
				ref.current.checked = value === true;
				ref.current.indeterminate = value === null;
			}
		});

		return (
			<input
				name={this.id}
				type="checkbox"
				ref={ref}
				{...cid}
				onChange={(e) => {
					if (this.triState) {
						e.currentTarget.checked = value === false;
						e.currentTarget.indeterminate = value === true;
					}
					onInput(e.currentTarget.indeterminate && this.triState ? null : e.currentTarget.checked);
				}}
			/>
		);
	}
}

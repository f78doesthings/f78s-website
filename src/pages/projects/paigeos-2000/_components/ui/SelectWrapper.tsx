/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import clsx from "clsx";
import type { SelectHTMLAttributes } from "preact";
import { useRef } from "preact/hooks";
import CaretDownIcon from "~icons/fluent-mdl2/caret-down-solid-8";

import styles from "./SelectWrapper.module.scss";

export function SelectWrapper(props: SelectHTMLAttributes) {
	const ref = useRef<HTMLSelectElement>(null);
	return (
		<label class={styles["select-wrapper"]}>
			<select ref={ref} {...props} />
			<div class={styles["overlay"]}>
				<div class={styles["select-outline"]} />
				<div class={clsx("button", styles.button, props.disabled && "disabled")}>
					<CaretDownIcon />
				</div>
			</div>
		</label>
	);
}

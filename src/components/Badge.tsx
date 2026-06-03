/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { BADGES } from "../consts.tsx";
import type { BadgeType } from "../types.ts";

import styles from "./Badge.module.scss";

interface Props {
	type: BadgeType;
	class?: string;
}

/** Displays a badge. */
export default function Badge({ type, class: className, ...cid }: Props) {
	const badge = BADGES[type];
	return (
		<div
			class={`${className ?? ""} badge ${styles.badge} ${styles[`badge-${type}`]}`}
			title={badge.description}
			{...cid}
		>
			<badge.icon />
			{badge.title}
		</div>
	);
}

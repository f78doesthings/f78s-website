/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import styles from "./DesktopIcon.module.scss";

export interface DesktopIconProps {
	icon?: ImageMetadata;
	title?: string;
	description?: string;
	onClick?: () => void;
}

export function DesktopIcon({ icon, title, description, onClick }: DesktopIconProps) {
	return (
		<button class={styles["desktop-icon"]} title={description} onDblClick={onClick}>
			<img alt="" class={styles.icon} {...icon} />
			<span class={styles.title}>{title}</span>
		</button>
	);
}

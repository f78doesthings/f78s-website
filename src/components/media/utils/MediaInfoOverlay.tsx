/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { ComponentChildren } from "preact";

import { getFileName } from "../../../scripts/utils";
import type { CopyrightInfo } from "../../../types";
import Badge from "../../Badge";
import LicenseNotice from "./LicenseNotice";

import styles from "./MediaInfoOverlay.module.scss";

interface Props extends CopyrightInfo {
	class?: string;
	src: string;
	children?: ComponentChildren;
}

export function MediaInfoOverlay({ src, class: className = "", children, ...props }: Props) {
	const [fileName, extName] = getFileName(src).split(".");
	return (
		<div class={`${styles["media-info"]} ${className}`}>
			<h2 class={styles.title}>
				<span>
					{fileName}
					<span class={styles["file-type"]}>.{extName}</span>
				</span>
				<Badge type="alpha" class={styles.badge} />
			</h2>
			{children && <div class={styles.caption}>{children}</div>}
			<LicenseNotice {...props} />
		</div>
	);
}

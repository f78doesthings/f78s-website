/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import clsx from "clsx";
import type { ImgHTMLAttributes } from "preact";

export function Icon({ alt = "", ...props }: ImgHTMLAttributes) {
	return (
		<img
			{...props}
			class={clsx("icon", props.class, props.className)}
			alt={alt}
			onContextMenu={(ev) => {
				ev.preventDefault();
				props.onContextMenu?.(ev);
			}}
		/>
	);
}

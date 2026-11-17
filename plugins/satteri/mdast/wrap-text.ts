/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { defineMdastPlugin } from "satteri";

export function satteriMdastWrapText() {
	return () => {
		return defineMdastPlugin({
			name: "wrap-text",
			text(target, ctx) {
				if (ctx.data.astro?.frontmatter?.layout?.endsWith("OSPage.astro")) {
					// Wrap text content in a <span> so we can properly define a custom text selection cursor
					ctx.replaceNode(target, [
						{ type: "html", value: '<span class="text">' },
						target,
						{ type: "html", value: "</span>" },
					]);
				}
			},
		});
	};
}

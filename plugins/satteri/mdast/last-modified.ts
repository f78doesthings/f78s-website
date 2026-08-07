/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { defineMdastPlugin } from "satteri";

import { getModifiedTime } from "../../utils";

export function satteriMdastLastModified() {
	return () => {
		let lastModified: string | undefined;

		return defineMdastPlugin({
			name: "last-modified",
			text(_, ctx) {
				if (!lastModified && ctx.fileURL) {
					lastModified = getModifiedTime(ctx.fileURL);
				}

				const frontmatter = ctx.data.astro?.frontmatter;
				if (frontmatter) {
					frontmatter.lastModified = lastModified;
				}
			},
		});
	};
}

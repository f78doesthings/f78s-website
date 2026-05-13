/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { RemarkPlugin } from "@astrojs/markdown-remark";
import { getModifiedTime } from "../src/server-utils.ts";

export function remarkLastModified() {
	return ((_tree, file) => {
		const filePath = file.history[0];
		file.data.astro.frontmatter.lastModified = getModifiedTime(filePath);
	}) satisfies RemarkPlugin;
}

/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { RemarkPlugin } from "@astrojs/markdown-remark";
import { toString } from "mdast-util-to-string";
import getReadingTime from "reading-time";

export function remarkReadingTime() {
	return ((tree, { data }) => {
		const textOnPage = toString(tree);
		const readingTime = getReadingTime(textOnPage);
		data.astro.frontmatter.readingTime = readingTime.text;
	}) satisfies RemarkPlugin;
}

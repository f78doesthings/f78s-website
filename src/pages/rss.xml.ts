/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { getCollection } from 'astro:content';
import rss from '@astrojs/rss';
import { BLOG_TITLE, SITE_DESCRIPTION } from '../consts';
import type { APIContext } from "astro";

export async function GET(context: APIContext) {
	const posts = await getCollection('blog', post => !post.data.draft);
	return rss({
		title: BLOG_TITLE,
		description: SITE_DESCRIPTION,
		site: context.site!,
		items: posts.map((post) => ({
			...post.data,
			link: `/blog/${post.id}`,
		})),
	});
}

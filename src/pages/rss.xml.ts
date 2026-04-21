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
			link: `/blog/${post.id}/`,
		})),
	});
}

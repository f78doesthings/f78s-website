/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { BADGE_TYPES, KNOWN_LICENSES } from "./consts.ts";

const blog = defineCollection({
	loader: glob({ base: "./src/content/blog", pattern: "**/*.{md,mdx}" }),
	schema: ({ image }) => z.object({
		// Required for RSS (do not rename)
		/** The title of the blog post. */
		title: z.string(),

		/** A brief summary of the blog post. */
		description: z.string(),

		/** The date the blog post was published. */
		pubDate: z.coerce.date(),

		// Development
		/** Whether this post is a draft and should not be published yet. */
		draft: z.boolean().default(false),

		// Cover / hero image
		/** An optional cover image for the blog post. */
		heroImage: image().optional(),

		/** The alt text for the cover image. This is also used as the title in the image viewer. */
		heroAlt: z.string().default(""),

		/** The description of the cover image. This is only shown in the image viewer. */
		heroDescription: z.string().default(""),

		/** The licence of the cover image. Defaults to the standard licence for this website's content (CC-BY-SA-4.0). */
		heroLicense: z.enum(KNOWN_LICENSES).nullable().default("CC-BY-SA-4.0"),

		/** The year the cover image was copyrighted under, if applicable. */
		heroCreatedIn: z.string().optional(),

		/** The copyright owner of the cover image, if applicable. */
		heroCreatedBy: z.string().optional(),

		/** The source of the cover image, if applicable. */
		heroSource: z.url().optional(),
	}),
});

const links = defineCollection({
	loader: glob({ base: "./src/content/links", pattern: "**/*.json" }),
	schema: () => z.object({
		/** The name of the link. */
		title: z.string(),

		/** Some flavour text to display on the home page. */
		description: z.string(),

		/** The URL to redirect to. */
		url: z.url(),

		/** The icon for this link. */
		icon: z.string(),

		/** The sort order for this link on the home page. */
		order: z.number().default(0),

		/** An optional tag to display on the home page. */
		tags: z.enum(BADGE_TYPES).array().optional(),

		/** A list of aliases for redirecting URLs. */
		aliases: z.string().array().optional(),
	}),
});

export const collections = { blog, links };

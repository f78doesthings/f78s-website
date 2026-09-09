/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { defineCollection } from "astro:content";
import consola from "consola";
import type { DefaultLogFields, LogOptions } from "simple-git";

import { BADGE_TYPES, KNOWN_LICENSES } from "./consts.tsx";
import { git } from "./server-utils.ts";
import type { VersionInfo } from "./types.ts";

const blog = defineCollection({
	loader: glob({ base: "./src/content/blog", pattern: "**/*.{md,mdx}" }),
	schema: ({ image }) =>
		z.object({
			// Required for RSS (do not rename)
			/** The title of the blog post. */
			title: z.string(),

			/** A brief summary of the blog post. */
			description: z.string(),

			/** The date the blog post was published. */
			pubDate: z.coerce.date(),

			// Extra
			/** Whether this post is a draft and should not be published yet. */
			draft: z.boolean().default(false),

			/** A unique, persistent ID that is used to display a GitHub discussion using `giscus`. */
			discussionId: z.string().optional(),

			// Cover / hero image
			/** An optional cover image for the blog post. */
			heroImage: image().optional(),

			/** The alt text for the cover image. This is also used as the title in the image viewer. */
			heroAlt: z.string().default(""),

			/** The description of the cover image. This is only shown in the image viewer. */
			heroDescription: z.string().default(""),

			/**
			 * The licence of the cover image. Defaults to the standard licence for this website's content
			 * (CC-BY-SA-4.0).
			 */
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
	schema: () =>
		z.object({
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

//#region Versions

const semverRegex =
	/^v?(?<major>0|[1-9]\d*)\.(?<minor>0|[1-9]\d*)\.(?<patch>0|[1-9]\d*)(?:-(?<prerelease>(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+(?<buildmetadata>[0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

const isPrerelease = (version: string) => {
	const result = semverRegex.exec(version);
	return result?.groups?.["prerelease"] !== undefined;
};

const jsonifyCommit = (commit: DefaultLogFields) => {
	return { ...commit };
};

function removeTagPrefix(tag: string): string;
function removeTagPrefix(tag?: string): string | undefined;
function removeTagPrefix(tag?: string) {
	return tag?.replace(/^v/, "");
}

const baseLogOptions: LogOptions = {
	strictDate: true,
	symmetric: false,
	multiLine: true,
};

// TODO: this collection can take a while to load (good thing it's only at build time)
const versions = defineCollection({
	loader: async () => {
		consola.info("Reloading the version content collection. This may take a bit...");

		const result: VersionInfo[] = [];
		const firstCommit = await git.firstCommit();
		const tags = (await git.tags()).all;
		tags.sort();

		for (let i = 0; i < tags.length; i++) {
			const tag = tags[i];
			const prerelease = isPrerelease(tag);
			const prevStable = tags.findLast((version, index) => index < i && !isPrerelease(version));
			const prevPrerelease = tags.findLast((version, index) => index < i && isPrerelease(version));
			const nextStableIndex = tags.findIndex(
				(version, index) => index > i && !isPrerelease(version),
			);
			const nextStable = tags[nextStableIndex];
			const nextPrerelease = tags.find(
				(version, index) =>
					index > i && (nextStableIndex < 0 || index < nextStableIndex) && isPrerelease(version),
			);

			const commits = await git.log({
				...baseLogOptions,
				from: prevStable ?? firstCommit,
				to: tag,
			});
			const devCommits = prerelease
				? await git.log({
						...baseLogOptions,
						from: prevPrerelease ?? prevStable ?? firstCommit,
						to: tag,
					})
				: undefined;

			result.push({
				id: removeTagPrefix(tag),
				prerelease,
				prevStable: removeTagPrefix(prevStable),
				prevPrerelease: removeTagPrefix(prevPrerelease),
				nextStable: removeTagPrefix(nextStable),
				nextPrerelease: removeTagPrefix(nextPrerelease),
				date: devCommits?.latest?.date ?? commits.latest?.date,
				stableCommits: commits.all.map(jsonifyCommit),
				prereleaseCommits: devCommits?.all.map(jsonifyCommit),
			});
		}

		return result;
	},
});

//#endregion

export const collections = { blog, links, versions };

/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { unified } from "@astrojs/markdown-remark";
import mdx from "@astrojs/mdx";
import preact from "@astrojs/preact";
import sitemap from "@astrojs/sitemap";
import { defineConfig, fontProviders, sharpImageService } from "astro/config";
import type { Element } from "hast";
import { fromHtml } from "hast-util-from-html";
import rehypeExternalLinks, {
	type Options as RehypeExternalLinksOptions,
} from "rehype-external-links";
import Icons from "unplugin-icons/vite";

import { remarkLastModified } from "./plugins/remark-last-modified.ts";
import { remarkReadingTime } from "./plugins/remark-reading-time.ts";

/** Placeholder to make Oxfmt format an HTML snippet */
const html = String.raw;

// https://astro.build/config
export default defineConfig({
	site: "https://www.f78.be",
	redirects: {
		"/feed.xml": "/rss.xml",
	},
	experimental: {
		contentIntellisense: true,
	},
	integrations: [mdx(), sitemap(), preact()],
	image: {
		service: sharpImageService({
			kernel: "mks2021",
			avif: {
				// AVIF images take a while to make, so lower the effort during development where size doesn't matter
				// (the effort for production could be higher, but I also don't want builds to take ages)
				effort: import.meta.env.DEV ? 2 : 6,
			},
			webp: {
				// In contrast to AVIF, WebP images barely take any time to make, so this is fine
				effort: 6,
				smartDeblock: true,
				smartSubsample: true,
			},
			jpeg: {
				// Offers a bit better compression
				mozjpeg: true,
			},
			png: {
				// Not used right now, but maybe for the future
				compressionLevel: 9,
			},
		}),
	},
	vite: {
		server: {
			// Crash if port is in use
			strictPort: true,
		},
		plugins: [
			Icons({
				compiler: "astro",
				scale: 1,
				iconCustomizer(collection, icon, props) {
					props["data-icon"] = `${collection}:${icon}`;
				},
			}),
		],
	},
	markdown: {
		processor: unified({
			smartypants: {
				dashes: "oldschool",
			},
			remarkPlugins: [remarkReadingTime, remarkLastModified],
			rehypePlugins: [
				[
					rehypeExternalLinks,
					{
						contentProperties: { class: "external-icon" },
						rel: ["nofollow", "noopener", "noreferrer"],
						// HACK: is there a better way to do this?
						// oxlint-disable-next-line typescript/no-unsafe-type-assertion
						content: fromHtml(
							html`
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="16"
									height="16"
									viewBox="0 0 16 16"
									data-icon="fluent:open-16-regular"
								>
									<rect width="16" height="16" fill="none" />
									<path
										fill="currentColor"
										d="M4.5 3A1.5 1.5 0 0 0 3 4.5v7A1.5 1.5 0 0 0 4.5 13h7a1.5 1.5 0 0 0 1.5-1.5V9.27a.5.5 0 0 1 1 0v2.23a2.5 2.5 0 0 1-2.5 2.5h-7A2.5 2.5 0 0 1 2 11.5v-7A2.5 2.5 0 0 1 4.5 2h2.23a.5.5 0 0 1 0 1zm4.27-.5a.5.5 0 0 1 .5-.5h4.23a.5.5 0 0 1 .5.5v4.23a.5.5 0 0 1-1 0V3.708L9.623 7.084a.5.5 0 1 1-.707-.707L12.293 3H9.269a.5.5 0 0 1-.5-.5"
									/>
								</svg>
							`.trim(),
							{
								fragment: true,
							},
						).children[0] as Element,
					} satisfies RehypeExternalLinksOptions,
				],
			],
		}),
		shikiConfig: {
			themes: {
				light: "one-light",
				dark: "one-dark-pro",
			},
		},
	},
	fonts: [
		{
			provider: fontProviders.fontsource(),
			name: "Albert Sans",
			cssVariable: "--font-body",
			weights: ["300 700"],
		},
		{
			provider: fontProviders.fontsource(),
			name: "Outfit",
			cssVariable: "--font-heading",
			weights: ["400 800"],
		},
		{
			provider: fontProviders.fontsource(),
			name: "Cascadia Code",
			cssVariable: "--font-mono",
			weights: ["300 700"],
		},
		{
			// This is the default font in MuseScore, an open source notation app. It's used (appropriately) for some
			// musical-related stuff, like the chord progressions in the blog post for "gaze upon the stars".
			//
			// It's obtained from a submodule. Check the repository's README for more information.
			provider: fontProviders.local(),
			name: "Edwin",
			cssVariable: "--font-serif",
			options: {
				variants: [
					{
						weight: "normal",
						style: "normal",
						src: ["./src/assets/fonts/Edwin/Edwin-Roman.otf"],
					},
					{
						weight: "bold",
						style: "normal",
						src: ["./src/assets/fonts/Edwin/Edwin-Bold.otf"],
					},
					{
						weight: "normal",
						style: "italic",
						src: ["./src/assets/fonts/Edwin/Edwin-Italic.otf"],
					},
					{
						weight: "bold",
						style: "italic",
						src: ["./src/assets/fonts/Edwin/Edwin-BdIta.otf"],
					},
				],
			},
		},
	],
});

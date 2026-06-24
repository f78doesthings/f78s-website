/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { satteri } from "@astrojs/markdown-satteri";
import mdx from "@astrojs/mdx";
import preact from "@astrojs/preact";
import sitemap from "@astrojs/sitemap";
import { defineConfig, envField, fontProviders, sharpImageService } from "astro/config";
import Icons from "unplugin-icons/vite";

import { hastExternalLinks } from "./plugins/hast-external-links.ts";

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
	env: {
		schema: {
			SITE_BRANCH: envField.string({ context: "client", access: "public", default: "main" }),
		},
	},
	image: {
		service: sharpImageService({
			kernel: "mks2021",
			avif: {
				// AVIF images take a while to make, so lower the effort during development where size
				// doesn't matter (the effort for production could be higher, but I also don't want builds
				// to take ages)
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
				compiler: "jsx",
				jsx: "preact",
				scale: 1,
				iconCustomizer(collection, icon, props) {
					props["data-icon"] = `${collection}:${icon}`;
				},
			}),
		],
	},
	markdown: {
		processor: satteri({
			features: {
				directive: true,
				headingAttributes: true,
				smartPunctuation: true,
				superscript: true,
				subscript: true,
			},
			// TODO: port the 2 frontmatter recipes to Satteri if possible
			hastPlugins: [hastExternalLinks()],
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
			// This is the default font in MuseScore, an open source notation app. It's used
			// (appropriately) for some musical-related stuff, like the chord progressions in the
			// blog post for "gaze upon the stars".
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

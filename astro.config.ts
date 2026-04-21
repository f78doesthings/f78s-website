import { defineConfig, fontProviders } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import icon from "astro-icon";
import preact from "@astrojs/preact";
import { remarkReadingTime } from "./src/plugins/remark-reading-time.ts";
import { remarkLastModified } from "./src/plugins/remark-last-modified.ts";

// https://astro.build/config
export default defineConfig({
	site: "https://www.f78.be",
	integrations: [mdx(), sitemap(), icon(), preact()],
	redirects: {
		"/feed.xml": "/rss.xml",
	},
	experimental: {
		contentIntellisense: true,
	},
	markdown: {
		remarkPlugins: [remarkReadingTime, remarkLastModified],
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
			provider: fontProviders.google(),
			name: "Cascadia Code",
			cssVariable: "--font-mono",
			weights: ["300 700"],
		},
	],
});

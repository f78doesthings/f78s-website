import { defineConfig, fontProviders } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import icon from "astro-icon";

// https://astro.build/config
export default defineConfig({
	site: "https://www.f78.be",
	integrations: [mdx(), sitemap(), icon()],
	fonts: [
		{
			provider: fontProviders.fontsource(),
			name: "DM Sans",
			cssVariable: "--font-body",
			weights: [400, 700],
		},
		{
			provider: fontProviders.fontsource(),
			name: "Outfit",
			cssVariable: "--font-heading",
			weights: [600, 700],
		},
	],
});

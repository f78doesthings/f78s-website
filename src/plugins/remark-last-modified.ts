import type { RemarkPlugin } from "@astrojs/markdown-remark";
import { getModifiedTime } from "../utils.ts";

export function remarkLastModified() {
	return ((_tree, file) => {
		const filePath = file.history[0];
		file.data.astro.frontmatter.lastModified = getModifiedTime(filePath);
	}) satisfies RemarkPlugin;
}

/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

// A bunch of miscellaneous server-side utilities.
import * as child_process from "node:child_process";
import type { UnresolvedImageTransform } from "astro";
import type { MediaSource } from "./types.ts";
import * as path from "node:path";
import * as fs from "node:fs";

export function getFileName(src?: string) {
	if (!src) {
		return "";
	}

	const baseName = path.basename(src).replace(/\?.*$/, "");
	const firstDotIndex = baseName.indexOf(".");
	const lastDotIndex = baseName.lastIndexOf(".");
	const fileName = baseName.substring(0, firstDotIndex);
	const extName = baseName.substring(lastDotIndex);

	return fileName + extName;
}

export function getModifiedTime(filePath: string) {
	try {
		// Use file system modification date in a development environment
		if (import.meta.env.DEV) {
			const stats = fs.statSync(filePath);
			return stats.mtime.toISOString();
		}

		const result = child_process.execSync(`git log -1 --pretty="format:%cI" "${filePath}"`, { encoding: "utf-8" });
		return result || new Date().toISOString();
	} catch (e) {
		console.warn("Failed to get last modified time:\n ", e);
		return new Date().toISOString(); // Fall back to today
	}
}

export async function getImageMetadata(src: UnresolvedImageTransform["src"]) {
	if (src instanceof Promise) {
		return (await src).default;
	} else if (typeof src === "object" && src !== null && "src" in src) {
		return src;
	}

	return undefined;
}

export async function resolveMedia(src: MediaSource) {
	if (src instanceof Promise) {
		return (await src).default;
	} else if (typeof src === "string") {
		return src;
	}
}

/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

// A bunch of miscellaneous server-side utilities.

import * as child_process from "node:child_process";
import * as fs from "node:fs";

import type { UnresolvedImageTransform } from "astro";
import { getCollection } from "astro:content";
import simpleGit from "simple-git";

import type { MediaSource, VersionInfo } from "./types.ts";

export const git = simpleGit();

export async function getVersions() {
	const collection = await getCollection("versions");
	const versions: (VersionInfo & Record<string, never>)[] = collection.map((v) => v.data);

	versions.sort((a, b) => {
		// Handle undefined
		if (!a.date && !b.date) return 0;
		if (!a.date) return 1;
		if (!b.date) return -1;

		// Sort by date, newest first (this works because the ISO 8601 format is sortable)
		return b.date.localeCompare(a.date);
	});

	return versions;
}

export function getModifiedTime(filePath: string) {
	try {
		// Use file system modification date in a development environment, as executing `git`
		// inevitably takes some time
		if (import.meta.env.DEV) {
			const stats = fs.statSync(filePath);
			return stats.mtime.toISOString();
		}

		const result = child_process.execSync(`git log -1 --pretty="format:%cI" "${filePath}"`, {
			encoding: "utf-8",
		});
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

	return undefined;
}

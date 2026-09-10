/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import * as child_process from "node:child_process";
import * as fs from "node:fs";
import { fileURLToPath } from "node:url";

import { fromHtml } from "hast-util-from-html";

/** Converts the string to a hast {@linkcode Element}. */
export function html(...params: Parameters<typeof String.raw>) {
	// Might be a bit crude
	const text = String.raw(...params).trim();
	const tree = fromHtml(text, { fragment: true });
	const element = tree.children.find((child) => child.type === "element");
	if (!element) {
		throw new Error("Failed to parse HTML");
	}

	return element;
}

/** Returns the modification date of the given file as a string in ISO format. */
export function getModifiedTime(filePath: string | URL) {
	try {
		// Use file system modification date in a development environment, as executing `git`
		// inevitably takes some time
		if (import.meta.env.DEV) {
			const stats = fs.statSync(filePath);
			return stats.mtime.toISOString();
		}

		if (filePath instanceof URL) {
			filePath = fileURLToPath(filePath);
		}

		const result = child_process.execSync(
			`git log -1 --no-show-signature --pretty="format:%cI" "${filePath}"`,
			{
				encoding: "utf-8",
			},
		);
		return result || new Date().toISOString();
	} catch (e) {
		console.warn("Failed to get last modified time:\n ", e);
		return new Date().toISOString(); // Fall back to today
	}
}

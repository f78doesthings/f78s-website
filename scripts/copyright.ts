/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import * as fs from "node:fs/promises";
import * as path from "node:path";

import ignore from "ignore";
import pc from "picocolors";

const gitignore = ignore();
const gitignoreFile = await fs.readFile(".gitignore", "utf-8");
gitignore.add(gitignoreFile.split("\n"));

const files = await fs.readdir(".", { withFileTypes: true, recursive: true });
let count = 0;
let noHeader = 0;

for (const file of files) {
	if (!file.isFile() || ![".astro", ".scss", ".ts", ".tsx"].includes(path.extname(file.name))) {
		continue;
	}

	const filePath = path.join(file.parentPath, file.name);
	if (gitignore.ignores(filePath)) {
		continue;
	}
	count++;

	const contents = await fs.readFile(filePath, "utf-8");
	if (!/^(---\n)?\/\*!?\n \* Copyright \(c\)/.test(contents)) {
		console.log(pc.red(filePath));
		noHeader++;
	} else {
		//console.log(pc.green(filePath));
	}
}

console.log(`${noHeader} / ${count}`);

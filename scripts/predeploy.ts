/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

// Executed before the "npm run deploy" command. Performs a few checks before deploying.

import * as child_process from "node:child_process";
import * as fs from "node:fs/promises";
import * as path from "node:path";

import { consola } from "consola";
import ignore from "ignore";
import pc from "picocolors";

async function confirmExit() {
	const shouldContinue = await consola.prompt("Do you want to continue anyway?", {
		type: "confirm",
		initial: false,
	});
	if (!shouldContinue) {
		process.exit(1);
	}
}

// Make sure the deploy script matches the Git branch
// TODO: is there a better way to handle this?
const gitBranch =
	child_process.execSync("git branch --show-current", { encoding: "utf-8" }).trim() || "dev";
const deployBranch = process.env.DEPLOY_SCRIPT ?? "main";
if (gitBranch !== deployBranch) {
	consola.error(
		"The deploy script run does not match the Git branch.\n",
		`\tCurrent branch: ${pc.red(gitBranch)} ${pc.gray("|")} Expected: ${pc.yellow(deployBranch)}`,
	);
	await confirmExit();
} else {
	consola.success("Deploy script matches the current Git branch.");
}

// Check for uncommitted changes
const gitStatus = child_process.execSync("git status --porcelain", { encoding: "utf-8" }).trimEnd();
if (gitStatus) {
	consola.log("\n" + gitStatus);
	consola.warn(
		`There are ${pc.red(gitStatus.split("\n").length)} uncommitted changes.`,
		"The website may show incorrect version information if you don't commit them.",
	);
	await confirmExit();
} else {
	consola.success("All changes are committed.");
}

// Look for missing copyright headers
const gitignore = ignore();
const gitignoreFile = await fs.readFile(".gitignore", "utf-8");
gitignore.add([...gitignoreFile.split("\n"), "*.config.*"]);

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
		if (noHeader++ === 0) {
			consola.log("");
		}
		consola.fail(filePath);
	} else {
		consola.debug(filePath);
	}
}

if (noHeader > 0) {
	consola.warn(`${pc.red(noHeader)} / ${pc.white(count)} files are missing copyright headers.`);
	await confirmExit();
} else {
	consola.success(`Checked ${pc.green(count)} files for missing copyright headers.`);
}

// Update the Cloudflare Workers compatibility date
const oldConfig = await fs.readFile("wrangler.jsonc", "utf-8");
const today = new Date().toISOString().split("T")[0];

const newConfig = oldConfig.replace(
	/"compatibility_date": "\d{4}-\d{2}-\d{2}",/,
	`"compatibility_date": "${today}",`,
);
if (oldConfig !== newConfig) {
	consola.log("");
	consola.info(
		"The Cloudflare Workers compatibility date is behind.",
		"Make sure there are no compatibility issues before updating it:\n",
		"https://developers.cloudflare.com/workers/configuration/compatibility-flags/#flags-history",
	);
	const confirmed = await consola.prompt("Would you like to update this date? (Ctrl+C to abort)", {
		type: "confirm",
		cancel: "null",
		initial: true,
	});
	if (confirmed === true) {
		await fs.writeFile("wrangler.jsonc", newConfig, "utf-8");
		consola.success(`Changed the Workers compatibility date to ${today}.`);
	} else if (confirmed === null) {
		process.exit(1);
	}
} else {
	consola.success("The Cloudflare Workers compatibility date does not need to be changed.");
}

consola.log("");
consola.ready("All systems go! Continuing the deployment...");

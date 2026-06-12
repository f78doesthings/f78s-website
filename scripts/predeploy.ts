/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import * as fs from "node:fs";

// Changes the Workers compatibility date in the Wrangler config to today.

const oldConfig = fs.readFileSync("wrangler.jsonc", "utf-8");
const today = new Date().toISOString().split("T")[0];

const newConfig = oldConfig.replace(
	/"compatibility_date": "\d{4}-\d{2}-\d{2}",/,
	`"compatibility_date": "${today}",`,
);
if (oldConfig !== newConfig) {
	fs.writeFileSync("wrangler.jsonc", newConfig, "utf-8");
	console.log(`Changed Workers compatibility date to ${today}.`);
} else {
	console.log("The Workers compatibility date does not need to be changed.");
}

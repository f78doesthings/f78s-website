/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

// @ts-check
import { defineConfig } from "npm-check-updates";

export default defineConfig({
	// Check peer dependencies to avoid conflicts. Makes update checks take longer,
	// but it's tolerable with our dependency count, so it's worth it.
	//
	// More information: https://npmx.dev/package/npm-check-updates#user-content-peer
	peer: true,

	// Default to interactive mode (personal preference, I find it more convenient)
	//
	// More information: https://npmx.dev/package/npm-check-updates#user-content-interactive-mode
	interactive: true,
});

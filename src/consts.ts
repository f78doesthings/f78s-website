/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { Badge, BadgeType, KnownLicense, License } from "./types";

export const SITE_TITLE = "f78";
export const SITE_DESCRIPTION = "Hi! I'm f78, a 22-year-old guy from Belgium who does things.";
export const SITE_LANGUAGE = "en-GB-oxendict";
export const SITE_AUTHOR = "f78";
export const BLOG_TITLE = "f78's Blog of Things";

export const BADGE_TYPES = ["new", "inactive", "archived", "beta"] as const;
export const BADGES: Record<BadgeType, Badge> = {
	new: {
		title: "New!",
		description: "This was added fairly recently. Don't expect too much here.",
		icon: "fluent:new-20-regular",
	},
	beta: {
		title: "Beta",
		description: "This part of the website is still being worked on. Report any issues you find on GitHub.",
		icon: "fluent:beaker-20-regular",
	},
	inactive: {
		title: "Inactive",
		description: "I'm not currently planning to use this platform, but I might use it (again) in the future.",
		icon: "fluent:pause-circle-20-regular",
		inactive: true,
	},
	archived: {
		title: "Archived",
		description: "I will no longer be using this. If you want newer content, you'll have to go to a different platform.",
		icon: "fluent:archive-20-regular",
		inactive: true,
	},
};

export const KNOWN_LICENSES = ["CC-BY-4.0", "CC-BY-SA-4.0", "MIT", "CC0-1.0"] as const;
export const LICENSES: Record<KnownLicense, License> = {
	"CC-BY-4.0": {
		icons: ["cib:creative-commons", "cib:creative-commons-by"],
		title: "CC BY 4.0",
		url: "https://creativecommons.org/licenses/by/4.0/",
		type: "open",
	},
	"CC-BY-SA-4.0": {
		icons: ["cib:creative-commons", "cib:creative-commons-by", "cib:creative-commons-sa"],
		title: "CC BY-SA 4.0",
		url: "https://creativecommons.org/licenses/by-sa/4.0/",
		type: "open",
	},
	"MIT": {
		icons: [],
		title: "MIT",
		url: "https://spdx.org/licenses/MIT.html",
		type: "open",
	},
	"CC0-1.0": {
		icons: ["cib:creative-commons", "cib:creative-commons-zero"],
		title: "CC0-1.0",
		url: "https://creativecommons.org/publicdomain/zero/1.0/",
		type: "publicDomain",
	},
};

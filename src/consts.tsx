/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import CibCreativeCommons from "~icons/cib/creative-commons";
import CibCreativeCommonsBy from "~icons/cib/creative-commons-by";
import CibCreativeCommonsSa from "~icons/cib/creative-commons-sa";
import CibCreativeCommonsZero from "~icons/cib/creative-commons-zero";
import FluentArchive20Regular from "~icons/fluent/archive-20-regular";
import FluentBeaker20Regular from "~icons/fluent/beaker-20-regular";
import FluentNew20Regular from "~icons/fluent/new-20-regular";
import FluentPauseCircle20Regular from "~icons/fluent/pause-circle-20-regular";

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
		icon: FluentNew20Regular,
	},
	beta: {
		title: "Beta",
		description:
			"This part of the website is still being worked on. Report any issues you find on GitHub.",
		icon: FluentBeaker20Regular,
	},
	inactive: {
		title: "Inactive",
		description:
			"I'm not currently planning to use this platform, but I might use it (again) in the future.",
		icon: FluentPauseCircle20Regular,
		inactive: true,
	},
	archived: {
		title: "Archived",
		description:
			"I will no longer be using this. If you want newer content, you'll have to go to a different platform.",
		icon: FluentArchive20Regular,
		inactive: true,
	},
};

export const KNOWN_LICENSES = ["CC-BY-4.0", "CC-BY-SA-4.0", "MIT", "CC0-1.0"] as const;
export const LICENSES: Record<KnownLicense, License> = {
	"CC-BY-4.0": {
		icons: () => (
			<>
				<CibCreativeCommons />
				<CibCreativeCommonsBy />
			</>
		),
		title: "CC BY 4.0",
		url: "https://creativecommons.org/licenses/by/4.0/",
		type: "open",
	},
	"CC-BY-SA-4.0": {
		icons: () => (
			<>
				<CibCreativeCommons />
				<CibCreativeCommonsBy />
				<CibCreativeCommonsSa />
			</>
		),
		title: "CC BY-SA 4.0",
		url: "https://creativecommons.org/licenses/by-sa/4.0/",
		type: "open",
	},
	MIT: {
		title: "MIT",
		url: "https://spdx.org/licenses/MIT.html",
		type: "open",
	},
	"CC0-1.0": {
		icons: () => (
			<>
				<CibCreativeCommons />
				<CibCreativeCommonsZero />
			</>
		),
		title: "CC0-1.0",
		url: "https://creativecommons.org/publicdomain/zero/1.0/",
		type: "publicDomain",
	},
};

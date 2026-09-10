/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { GIT_BRANCH } from "astro:env/client";
import CibCreativeCommons from "~icons/cib/creative-commons";
import CibCreativeCommonsBy from "~icons/cib/creative-commons-by";
import CibCreativeCommonsSa from "~icons/cib/creative-commons-sa";
import CibCreativeCommonsZero from "~icons/cib/creative-commons-zero";
import ArchiveIcon from "~icons/fluent/archive-20-regular";
import BetaIconSmall from "~icons/fluent/beaker-16-regular";
import BetaIcon from "~icons/fluent/beaker-20-regular";
import AlphaIconSmall from "~icons/fluent/bug-16-regular";
import AlphaIcon from "~icons/fluent/bug-20-regular";
import ReleaseCandidateIconSmall from "~icons/fluent/checkmark-16-regular";
import ReleaseCandidateIcon from "~icons/fluent/checkmark-20-regular";
import NewIcon from "~icons/fluent/new-20-regular";
import PauseIcon from "~icons/fluent/pause-circle-20-regular";
import DevIconSmall from "~icons/fluent/warning-16-regular";
import DevIcon from "~icons/fluent/warning-20-regular";

import type {
	Badge,
	BadgeType,
	KnownLicense,
	License,
	PrereleaseInfo,
	PrereleaseType,
} from "./types";

/** Whether this is an in-development build of the website. */
export const IS_DEV = import.meta.env.DEV || GIT_BRANCH !== "main";

export const SITE_TITLE = "f78's website";
export const SITE_DESCRIPTION = "Hi! I'm f78, a 22-year-old guy from Belgium who does things.";
export const SITE_LANGUAGE = "en-GB-oxendict";
export const SITE_AUTHOR = "f78";
export const BLOG_TITLE = "f78's Blog of Things";

export const BADGE_TYPES = ["new", "inactive", "archived", "beta", "alpha"] as const;
export const BADGES: Record<BadgeType, Badge> = {
	new: {
		title: "New!",
		description: "This was added fairly recently. Don't expect too much here.",
		icon: NewIcon,
	},
	beta: {
		title: "Beta",
		description:
			"This part of the website is still being worked on. Report any issues you find on GitHub.",
		icon: BetaIcon,
	},
	alpha: {
		title: "Alpha",
		description:
			"This part of the website is especially experimental and unstable. Here be dragons.",
		icon: AlphaIcon,
	},
	inactive: {
		title: "Inactive",
		description:
			"I'm not currently planning to use this platform, but I might use it (again) in the future.",
		icon: PauseIcon,
		inactive: true,
	},
	archived: {
		title: "Archived",
		description:
			"I will no longer be using this. If you want newer content, you'll have to go to a different platform.",
		icon: ArchiveIcon,
		inactive: true,
	},
};

export const PRERELEASE_TYPES: Record<PrereleaseType, PrereleaseInfo> = {
	dev: {
		title: "Experimental test build",
		description:
			"Anything goes in these versions. Nothing is guaranteed to make it to the final website.",
		icon: DevIcon,
		iconSmall: DevIconSmall,
	},
	alpha: {
		title: "Alpha version",
		description:
			"In this early phase, new features are constantly being worked on. These can be unstable.",
		icon: AlphaIcon,
		iconSmall: AlphaIconSmall,
	},
	beta: {
		title: "Beta version",
		description:
			"Most features have been determined at this point, but they may still be expanded upon.",
		icon: BetaIcon,
		iconSmall: BetaIconSmall,
	},
	rc: {
		title: "Release candidate build",
		description:
			"This is the final stretch! If no major bugs arise, the version gets pushed to the main website.",
		icon: ReleaseCandidateIcon,
		iconSmall: ReleaseCandidateIconSmall,
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

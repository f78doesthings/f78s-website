import type { Badge, BadgeType } from "./types";

export const SITE_TITLE = "f78";
export const SITE_DESCRIPTION = "Hi! I'm f78, a 22-year-old guy from Belgium who does things.";
export const SITE_LANGUAGE = "en-GB-oxendict";
export const SITE_AUTHOR = "f78";
export const BLOG_TITLE = "f78's Blog of Things";

export const BADGE_TYPES = ["new", "inactive", "archived", "beta"] as const;
export const BADGES: Record<BadgeType, Badge> = {
	new: {
		title: "New!",
		description: "This was added fairly recently. Expect new links to not contain much content.",
		icon: "fluent:new-20-regular",
	},
	beta: {
		title: "Beta",
		description: "This part of the website is still being worked on. Report any bugs you find on GitHub.",
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

import type { BADGE_TYPES } from "./consts.ts";
import type { CollectionEntry } from "astro:content";

export type BadgeType = typeof BADGE_TYPES[number];

export interface Badge {
	icon: string;
	title: string;
	description: string;
	inactive?: boolean;
}

export type LinkData = CollectionEntry<"links">["data"] & {
	id: string;
};

declare global {
	// noinspection JSUnusedGlobalSymbols
	interface DocumentEventMap {
		/** Fired when a preference is changed. */
		"custom:preferences-updated": Event;
	}
}

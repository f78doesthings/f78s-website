/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { type BADGE_TYPES, KNOWN_LICENSES } from "./consts.ts";
import type { CollectionEntry } from "astro:content";

//#region Badges & tags

export type BadgeType = typeof BADGE_TYPES[number];

export interface Badge {
	icon: string;
	title: string;
	description: string;
	inactive?: boolean;
}

//#endregion

//#region Licensing & copyright

export type KnownLicense = typeof KNOWN_LICENSES[number];

export type LicenseType = "publicDomain" | "open";

/** Information about a licence. */
export interface License {
	icons: string[];
	title: string;
	url: string;
	type: LicenseType;
}

/** Information about the copyright and/or licence of a work. */
export interface CopyrightInfo {
	/**
	 * The licence this work is under. If `null`, the work is considered to be copyrighted (i.e. all rights reserved).
	 * @default CC-BY-SA-4.0
	 */
	license?: KnownLicense | null;

	/** The year(s) this work was created in. */
	createdIn?: string;

	/**
	 * The creator of this work.
	 * @default SITE_AUTHOR (f78)
	 */
	createdBy?: string;

	/** The source of this work. */
	source?: string;
}

//#endregion

//#region Media

export type MediaSource = string | Promise<{ default: string }> | null | undefined;

export interface MediaInfo extends CopyrightInfo {
	/**
	 * The media file to embed.
	 *
	 * You can pass `import(path)` to this like you would for images.
	 * This is the recommended approach for local media files.
	 */
	src?: MediaSource;
}

//#endregion

//#region Miscellaneous

export type Replace<T, U> = Omit<T, keyof U> & U;

// noinspection JSUnusedGlobalSymbols - Used implicitly
export enum ImageRotation {
	never,
	preferNo,
	preferYes
}

export type LinkData = CollectionEntry<"links">["data"] & {
	id: string;
};

//#endregion

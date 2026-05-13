/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

// A bunch of miscellaneous utilities.
import { BADGES, SITE_LANGUAGE } from "../../consts.ts";
import type { CollectionEntry } from "astro:content";

export function isLinkInactive(link: CollectionEntry<"links">["data"]) {
	return link.tags && link.tags.some(tag => BADGES[tag]?.inactive);
}

export function truncate(value: number, digits: number = 0, config: Intl.NumberFormatOptions = {}) {
	return value.toLocaleString(SITE_LANGUAGE, { maximumFractionDigits: digits, ...config });
}

export function isOnPage(url: URL, ...aliases: (string | URL | null | undefined)[]) {
	const pathname = url.pathname.replace(import.meta.env.BASE_URL, '');
	const subpath = pathname.match(/[^\/]+/g);

	for (const page of aliases) {
		const pagePathname = page?.toString()?.replace(/\?.*$/, "");
		if (pagePathname === pathname || pagePathname === '/' + (subpath?.[0] || '')) {
			return true;
		}
	}

	return false;
}

export function clamp(value: number, min: number, max: number) {
	return Math.min(Math.max(value, min), max);
}

export function clampStepped(value: number, min: number, max: number, step: number) {
	return clamp(Math.round(value / step) * step, min, max);
}

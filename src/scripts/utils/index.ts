/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

// A bunch of miscellaneous utilities.

import { DurationFormat } from "@formatjs/intl-durationformat";
import type { CollectionEntry } from "astro:content";

import { BADGES, SITE_LANGUAGE } from "../../consts.tsx";

const shortMinutesFormatter = new DurationFormat(SITE_LANGUAGE, {
	style: "digital",
	hours: "narrow",
	hoursDisplay: "auto",
});

const longMinutesFormatter = new DurationFormat(SITE_LANGUAGE, {
	style: "digital",
	hoursDisplay: "auto",
});

const hoursFormatter = new DurationFormat(SITE_LANGUAGE, {
	style: "digital",
	hoursDisplay: "always",
});

export function clamp(value: number, min: number, max: number, step = 0) {
	if (step > 0) {
		value = Math.round(value / step) * step;
	}

	return Math.min(Math.max(value, min), max);
}

export function truncate(value: number, digits = 0, config: Intl.NumberFormatOptions = {}) {
	return value.toLocaleString(SITE_LANGUAGE, {
		maximumFractionDigits: digits,
		...config,
	});
}

/** Formats a duration in seconds. */
export function formatDuration(duration: number, maxDuration = duration) {
	const resolvedDuration = isFinite(duration)
		? {
				hours: Math.floor(duration / 3600),
				minutes: Math.floor((duration / 60) % 60),
				seconds: Math.floor(duration % 60),
			}
		: { seconds: 0 };

	if (maxDuration >= 3600) {
		return hoursFormatter.format(resolvedDuration);
	} else if (maxDuration >= 600) {
		return longMinutesFormatter.format(resolvedDuration);
	} else {
		return shortMinutesFormatter.format(resolvedDuration);
	}
}

export function asDate(value: unknown) {
	if (value instanceof Date || typeof value === "string" || typeof value === "number") {
		return new Date(value);
	}

	return undefined;
}

/** Extracts the file name from a media URL. */
export function getFileName(src?: string) {
	if (!src) {
		return "";
	}

	const lastSlashIndex = src.lastIndexOf("/");
	const baseName = src.substring(lastSlashIndex + 1).replace(/\?.*$/, "");
	const firstDotIndex = baseName.indexOf(".");
	const lastDotIndex = baseName.lastIndexOf(".");
	const fileName = baseName.substring(0, firstDotIndex);
	const extName = baseName.substring(lastDotIndex);

	return fileName + extName;
}

export function isLinkInactive(link: CollectionEntry<"links">["data"]) {
	return link.tags && link.tags.some((tag) => BADGES[tag]?.inactive);
}

export function isOnPage(url: URL, ...aliases: (string | URL | null | undefined)[]) {
	const pathname = url.pathname.replace(import.meta.env.BASE_URL, "");
	const subpath = pathname.match(/[^/]+/g);

	for (const page of aliases) {
		const pagePathname = page?.toString()?.replace(/\?.*$/, "");
		if (pagePathname === pathname || pagePathname === "/" + (subpath?.[0] || "")) {
			return true;
		}
	}

	return false;
}

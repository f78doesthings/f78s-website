// A bunch of miscellaneous utilities.
import type { CollectionEntry } from "astro:content";
import { BADGES, SITE_LANGUAGE } from "./consts.ts";
import * as child_process from "node:child_process";

export function isLinkInactive(link: CollectionEntry<"links">["data"]) {
	return link.tags && link.tags.some(tag => BADGES[tag]?.inactive);
}

export function truncate(value: number, digits: number = 0, config: Intl.NumberFormatOptions = {}) {
	return value.toLocaleString(SITE_LANGUAGE, { maximumFractionDigits: digits, ...config });
}

export function isOnPage(url: URL, baseURL: string, page: string | URL | null | undefined) {
	const pathname = url.pathname.replace(baseURL, '');
	const subpath = pathname.match(/[^\/]+/g);
	const pagePathname = page?.toString()?.replace(/\?.*$/, "");
	return pagePathname === pathname || pagePathname === '/' + (subpath?.[0] || '');
}

export function clamp(value: number, min: number, max: number) {
	return Math.min(Math.max(value, min), max);
}

export function clampStepped(value: number, min: number, max: number, step: number) {
	return clamp(Math.round(value / step) * step, min, max);
}

/** @server */
export function getModifiedTime(filePath: string) {
	try {
		return child_process.execSync(`git log -1 --pretty="format:%cI" "${filePath}"`, { encoding: "utf-8" });
	} catch (e) {
		console.warn("Failed to get last modified time:\n ", e);
		return new Date().toISOString(); // Fall back to today
	}
}

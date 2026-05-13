/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { preferences } from "./preferences";
import { TogglePreference } from "./preferences/types/TogglePreference.tsx";
import { EnumPreference } from "./preferences/types/EnumPreference.tsx";
import { isOnPage } from "./utils";
import { loadPreferences } from "./preferences/client.ts";

function updatePageData() {
	const enabled = [];
	for (const preference of preferences) {
		if (preference instanceof TogglePreference && preference.isEnabled()) {
			enabled.push(preference.id);
		} else if (preference instanceof EnumPreference) {
			document.documentElement.dataset[preference.id] = preference.get();
		}
	}
	document.documentElement.dataset.preferences = enabled.join(" ");
}

document.addEventListener("astro:before-preparation", (ev) => {
	const originalLoader = ev.loader;
	ev.loader = async () => {
		if (
			isOnPage(ev.to, "/preferences") &&
			!isOnPage(ev.from, "/preferences")
		) {
			ev.to.searchParams.set("from", `${ev.from.pathname}${ev.from.search}${ev.from.hash}`);
		}

		const loadingBar = document.querySelector<HTMLElement>(".loading-bar");
		let loaded = false;
		if (loadingBar && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
			let startTime: number;
			const nextFrame: FrameRequestCallback = (time) => {
				startTime ??= time;
				if (!loaded) {
					const timeElapsed = time - startTime;
					const progress = timeElapsed / (timeElapsed + 500);
					loadingBar.style.width = `${progress * 100}%`;
					requestAnimationFrame(nextFrame);
				} else {
					loadingBar.animate([{
						width: "100%",
						opacity: "0",
					}], {
						duration: 1000,
						easing: "ease",
						fill: "forwards",
					});
				}
			};

			// Reset the loading bar, cleaning up any leftover animations
			loadingBar.style.width = "0";
			loadingBar.style.opacity = "1";
			for (const animation of loadingBar.getAnimations()) {
				animation.cancel();
			}
			requestAnimationFrame(nextFrame);
		}

		await originalLoader();
		loaded = true;
	};
});
document.addEventListener("astro:after-swap", () => document.dispatchEvent(new Event("custom:preferences-updated")));
document.addEventListener("custom:preferences-updated", updatePageData);
loadPreferences();

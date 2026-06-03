/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import FluentArrowCounterclockwise20Regular from "~icons/fluent/arrow-counterclockwise-20-regular";
import FluentBug20Regular from "~icons/fluent/bug-20-regular";
import FluentCheckmark20Regular from "~icons/fluent/checkmark-20-regular";
import FluentChevronDoubleDown20Regular from "~icons/fluent/chevron-double-down-20-regular";
import FluentChevronDoubleUp20Regular from "~icons/fluent/chevron-double-up-20-regular";
import FluentChevronDown20Regular from "~icons/fluent/chevron-down-20-regular";
import FluentChevronUp20Regular from "~icons/fluent/chevron-up-20-regular";
import FluentDarkTheme20Regular from "~icons/fluent/dark-theme-20-regular";
import FluentDismiss20Regular from "~icons/fluent/dismiss-20-regular";
import FluentDualScreenVerticalScroll20Regular from "~icons/fluent/dual-screen-vertical-scroll-20-regular";
import FluentImageArrowCounterclockwise20Regular from "~icons/fluent/image-arrow-counterclockwise-20-regular";
import FluentImageCircle20Regular from "~icons/fluent/image-circle-20-regular";
import FluentImageSparkle20Regular from "~icons/fluent/image-sparkle-20-regular";
import FluentImageSplit20Regular from "~icons/fluent/image-split-20-regular";
import FluentMagicWand20Regular from "~icons/fluent/magic-wand-20-regular";
import FluentMoreHorizontal20Regular from "~icons/fluent/more-horizontal-20-regular";
import FluentPhoneDesktop20Regular from "~icons/fluent/phone-desktop-20-regular";
import FluentResize20Regular from "~icons/fluent/resize-20-regular";
import FluentSkipForwardTab20Regular from "~icons/fluent/skip-forward-tab-20-regular";
import FluentStarEmphasis20Regular from "~icons/fluent/star-emphasis-20-regular";
import FluentTablet20Regular from "~icons/fluent/tablet-20-regular";
import FluentWeatherMoon20Regular from "~icons/fluent/weather-moon-20-regular";
import FluentWeatherSunny20Regular from "~icons/fluent/weather-sunny-20-regular";
import FluentWrench20Regular from "~icons/fluent/wrench-20-regular";
import PhTildeLight from "~icons/ph/tilde-light";

import { SITE_LANGUAGE } from "../../consts.tsx";
import type { ImageRotation } from "../../types.ts";
import { EnumPreference } from "./types/EnumPreference.tsx";
import { NumberPreference } from "./types/NumberPreference.tsx";
import { Preference, type PreferenceCategory } from "./types/Preference.ts";
import { PresetPreference } from "./types/PresetPreference.ts";
import { TogglePreference } from "./types/TogglePreference.tsx";
import { createPreferences, groupPreferences } from "./utils.ts";

const isMobile = () => /mobi/i.test(navigator.userAgent);
const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const formatPercent = (value: number) =>
	`${Math.round(value * 100).toLocaleString(SITE_LANGUAGE)}%`;

const showAdvanced = new TogglePreference("showAdvanced", {
	icon: FluentWrench20Regular,
	title: "Show Advanced Options",
	description:
		"Shows even more preferences for advanced users to perfectly dial in their experience.",
});

export const preferences = createPreferences(
	...groupPreferences(
		{
			title: "General",
		},
		new EnumPreference("theme", {
			icon: FluentDarkTheme20Regular,
			title: "Theme",
			description:
				"Sets the theme. Note that some parts of the website (like the immersive background) " +
				"may feel a bit off in Light mode.",

			defaultValue: () => "auto",
			options: {
				// This isn't autocompleted unless <T> is made `const`, which causes an error (see below)
				auto: {
					displayName: "System",
					icon: FluentTablet20Regular,
				},
				light: {
					displayName: "Light",
					icon: FluentWeatherSunny20Regular,
				},
				dark: {
					displayName: "Dark",
					icon: FluentWeatherMoon20Regular,
				},
			},
		}),
		showAdvanced,
	),

	...groupPreferences(
		{
			title: "Immersive Mode",
		},
		...new TogglePreference("immersiveMode", {
			icon: FluentStarEmphasis20Regular,
			title: "Enable Immersive Mode",
			description:
				"Enables the website's experimental immersive features. " +
				"This may be disabled by default for performance or accessibility reasons.",

			defaultValue: () => !prefersReducedMotion() && !isMobile(),
		}).withDependents(
			[true],

			...new TogglePreference("immersiveFX", {
				icon: FluentMagicWand20Regular,
				title: "Immersive Effects",
				description:
					"Enables some fancy effects which can harm performance a bit, especially on low-end devices.",

				defaultValue: () => true,
			}).withDependents(
				[true],
				new EnumPreference("imageRotation", {
					icon: FluentImageArrowCounterclockwise20Regular,
					title: "Image Rotation",
					description:
						"Controls when to enable the parallax rotation effect for images. " +
						'"Auto" will avoid important images to reduce blurring.',
					dependencies: [showAdvanced.asDependency(true)],

					defaultValue: (): keyof typeof ImageRotation => "preferNo",
					options: {
						never: {
							icon: FluentDismiss20Regular,
							displayName: "Never",
						},
						preferNo: {
							icon: FluentArrowCounterclockwise20Regular,
							displayName: "Auto",
						},
						preferYes: {
							icon: FluentCheckmark20Regular,
							displayName: "Always",
						},
					},
				}),
			),
			...groupPreferences(
				{
					title: "Background",
				},
				...new TogglePreference("bgEnabled", {
					icon: FluentImageCircle20Regular,
					title: "Immersive Background",
					description: "Enables the animated starry background. This requires WebGL support.",

					defaultValue: () => true,
				}).withDependents(
					[true],

					...PresetPreference.create(
						"bgQuality",
						{
							icon: FluentImageSparkle20Regular,
							title: "Background Quality",
							description:
								"Controls the quality of the animated background. " +
								"Increasing this can negatively impact performance on weaker hardware. ",

							// BUG: in this function (and if <T> is made `const` in EnumPreference),
							//      when defaultValue is given, it won't allow any other options for some unknown reason
							// Temporary conversion to `string` added as a workaround (prevents autocomplete)
							defaultValue: (): string => (isMobile() ? "low" : "medium"),
							options: {
								custom: {
									displayName: "Custom",
									icon: FluentMoreHorizontal20Regular,
								},
								veryLow: {
									displayName: "Very Low",
									icon: FluentChevronDoubleDown20Regular,
									settings: {
										bgRenderScale: 0.4,
										bgDPIFactor: 0.25,
										bgFrameSkip: 5,
										bgActiveFrameSkip: 2,
									},
								},
								low: {
									displayName: "Low",
									icon: FluentChevronDown20Regular,
									settings: {
										bgRenderScale: 0.6,
										bgDPIFactor: 0.35,
										bgFrameSkip: 3,
										bgActiveFrameSkip: 1,
									},
								},
								medium: {
									displayName: "Medium",
									icon: PhTildeLight,
									settings: {
										bgRenderScale: 0.8,
										bgDPIFactor: 0.5,
										bgFrameSkip: 2,
										bgActiveFrameSkip: 0,
									},
								},
								high: {
									displayName: "High",
									icon: FluentChevronUp20Regular,
									settings: {
										bgRenderScale: 1,
										bgDPIFactor: 0.65,
										bgFrameSkip: 1,
										bgActiveFrameSkip: 0,
									},
								},
								veryHigh: {
									displayName: "Ultra",
									icon: FluentChevronDoubleUp20Regular,
									settings: {
										bgRenderScale: 1,
										bgDPIFactor: 1,
										bgFrameSkip: 0,
										bgActiveFrameSkip: 0,
									},
								},
							},
						},
						...groupPreferences(
							{
								title: "Advanced Quality Settings",
								dependencies: [showAdvanced.asDependency(true)],
							},
							new NumberPreference("bgRenderScale", {
								icon: FluentResize20Regular,
								title: "Resolution Scale",
								description:
									"The percentage of the resolution to render at. The higher this value, the more detail.",

								min: 0.1,
								max: 1,
								step: 0.05,
								format: formatPercent,
							}),
							new NumberPreference("bgDPIFactor", {
								icon: FluentPhoneDesktop20Regular,
								title: "Pixel Density Scaling",
								description:
									"Scales the rendering resolution based on this percentage of your screen's pixel density.",

								max: 1,
								step: 0.05,
								format: formatPercent,
							}),
							new NumberPreference("bgFrameSkip", {
								icon: FluentSkipForwardTab20Regular,
								title: "Frame Skip",
								description:
									"The number of frames to skip when the page isn't moving. " +
									"Increasing this will make the background choppier.",

								max: 9,
							}),
							new NumberPreference("bgActiveFrameSkip", {
								icon: FluentDualScreenVerticalScroll20Regular,
								title: "Active Frame Skip",
								description:
									"The maximum number of frames to skip while you're actively scrolling or resizing the page.",

								max: 9,
							}),
						),
					),

					new TogglePreference("bgPause", {
						icon: FluentImageSplit20Regular,
						title: "Pause Background When Unfocused",
						description:
							"Pauses the animated background if the window is not focused. " +
							"It will always be paused if the tab is in the background.",
						dependencies: [showAdvanced.asDependency(true)],

						defaultValue: () => !isMobile(),
					}),
					new EnumPreference("bgDebug", {
						icon: FluentBug20Regular,
						title: "Background Debug Display",
						description:
							"Choose to display debug information about the immersive background, like the FPS and resolution.",
						dependencies: [showAdvanced.asDependency(true)],

						defaultValue: () => "off",
						options: {
							off: {
								displayName: "None",
							},
							fps: {
								displayName: "FPS only",
							},
							resolution: {
								displayName: "FPS + resolution",
							},
							full: {
								displayName: "Everything",
							},
						},
					}),
				),
			),
		),
	),
);

//#region Utilities specific to these preferences

export type PreferenceID = keyof typeof preferences & string; // `& string` needed to exclude [Symbol.iterator]
export interface PreferencesByCategory extends PreferenceCategory {
	preferences?: Preference<PreferenceID>[];
	categories?: PreferencesByCategory[];
}

let preferencesByCategory: PreferencesByCategory | undefined;

export function getPreferencesByCategory() {
	if (preferencesByCategory !== undefined) {
		return preferencesByCategory;
	}

	preferencesByCategory = {};
	for (const preference of preferences) {
		let category = preferencesByCategory;

		for (const subcategory of preference.category) {
			const categories = (category.categories ??= []);
			const existing = categories.find((other) => other.title === subcategory.title);

			if (existing) {
				category = existing;
			} else {
				category = { ...subcategory };
				categories.push(category);
			}
		}

		(category.preferences ??= []).push(preference);
	}
	return preferencesByCategory;
}

//#endregion

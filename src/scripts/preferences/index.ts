/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { SITE_LANGUAGE } from "../../consts.ts";
import type { ImageRotation } from "../../types";
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
	icon: "fluent:wrench-20-regular",
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
			icon: "fluent:dark-theme-20-regular",
			title: "Theme",
			description:
				"Sets the theme. Note that some parts of the website (like the immersive background) " +
				"may feel a bit off in Light mode.",

			defaultValue: () => "auto",
			options: {
				// This isn't autocompleted unless <T> is made `const`, which causes an error (see below)
				auto: {
					displayName: "System",
					icon: "fluent:tablet-20-regular",
				},
				light: {
					displayName: "Light",
					icon: "fluent:weather-sunny-20-regular",
				},
				dark: {
					displayName: "Dark",
					icon: "fluent:weather-moon-20-regular",
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
			icon: "fluent:star-emphasis-20-regular",
			title: "Enable Immersive Mode",
			description:
				"Enables the website's experimental immersive features. " +
				"This may be disabled by default for performance or accessibility reasons.",

			defaultValue: () => !prefersReducedMotion() && !isMobile(),
		}).withDependents(
			[true],

			...new TogglePreference("immersiveFX", {
				icon: "fluent:magic-wand-20-regular",
				title: "Immersive Effects",
				description:
					"Enables some fancy effects which can harm performance a bit, especially on low-end devices.",

				defaultValue: () => true,
			}).withDependents(
				[true],
				new EnumPreference("imageRotation", {
					icon: "fluent:image-arrow-counterclockwise-20-regular",
					title: "Image Rotation",
					description:
						"Controls when to enable the parallax rotation effect for images. " +
						'"Auto" will avoid important images to reduce blurring.',
					dependencies: [showAdvanced.asDependency(true)],

					defaultValue: (): keyof typeof ImageRotation => "preferNo",
					options: {
						never: {
							icon: "fluent:dismiss-20-regular",
							displayName: "Never",
						},
						preferNo: {
							icon: "fluent:arrow-counterclockwise-20-regular",
							displayName: "Auto",
						},
						preferYes: {
							icon: "fluent:checkmark-20-regular",
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
					icon: "fluent:image-circle-20-regular",
					title: "Immersive Background",
					description: "Enables the animated starry background. This requires WebGL support.",

					defaultValue: () => true,
				}).withDependents(
					[true],

					...PresetPreference.create(
						"bgQuality",
						{
							icon: "fluent:image-sparkle-20-regular",
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
									icon: "fluent:more-20-regular",
								},
								veryLow: {
									displayName: "Very Low",
									icon: "fluent:chevron-double-down-20-regular",
									settings: {
										bgRenderScale: 0.4,
										bgDPIFactor: 0.25,
										bgFrameSkip: 5,
										bgActiveFrameSkip: 2,
									},
								},
								low: {
									displayName: "Low",
									icon: "fluent:chevron-down-20-regular",
									settings: {
										bgRenderScale: 0.6,
										bgDPIFactor: 0.35,
										bgFrameSkip: 3,
										bgActiveFrameSkip: 1,
									},
								},
								medium: {
									displayName: "Medium",
									icon: "ph:tilde-light",
									settings: {
										bgRenderScale: 0.8,
										bgDPIFactor: 0.5,
										bgFrameSkip: 2,
										bgActiveFrameSkip: 0,
									},
								},
								high: {
									displayName: "High",
									icon: "fluent:chevron-up-20-regular",
									settings: {
										bgRenderScale: 1,
										bgDPIFactor: 0.65,
										bgFrameSkip: 1,
										bgActiveFrameSkip: 0,
									},
								},
								veryHigh: {
									displayName: "Ultra",
									icon: "fluent:chevron-double-up-20-regular",
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
								icon: "fluent:resize-20-regular",
								title: "Resolution Scale",
								description:
									"The percentage of the resolution to render at. The higher this value, the more detail.",

								min: 0.1,
								max: 1,
								step: 0.05,
								format: formatPercent,
							}),
							new NumberPreference("bgDPIFactor", {
								icon: "fluent:phone-desktop-20-regular",
								title: "Pixel Density Scaling",
								description:
									"Scales the rendering resolution based on this percentage of your screen's pixel density.",

								max: 1,
								step: 0.05,
								format: formatPercent,
							}),
							new NumberPreference("bgFrameSkip", {
								icon: "fluent:skip-forward-tab-20-regular",
								title: "Frame Skip",
								description:
									"The number of frames to skip when the page isn't moving. " +
									"Increasing this will make the background choppier.",

								max: 9,
							}),
							new NumberPreference("bgActiveFrameSkip", {
								icon: "fluent:dual-screen-vertical-scroll-20-regular",
								title: "Active Frame Skip",
								description:
									"The maximum number of frames to skip while you're actively scrolling or resizing the page.",

								max: 9,
							}),
						),
					),

					new TogglePreference("bgPause", {
						icon: "fluent:image-split-20-regular",
						title: "Pause Background When Unfocused",
						description:
							"Pauses the animated background if the window is not focused. " +
							"It will always be paused if the tab is in the background.",
						dependencies: [showAdvanced.asDependency(true)],

						defaultValue: () => !isMobile(),
					}),
					new EnumPreference("bgDebug", {
						icon: "fluent:bug-20-regular",
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

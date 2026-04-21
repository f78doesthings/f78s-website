import { createPreferences, groupPreferences } from "./utils.ts";
import { EnumPreference } from "./types/EnumPreference.ts";
import { TogglePreference } from "./types/TogglePreference.ts";
import { PresetPreference } from "./types/PresetPreference.ts";
import { NumberPreference } from "./types/NumberPreference.ts";

// Placeholder namespace to provide a scope for creating the preferences
namespace _preferences {
	const showAdvanced = new TogglePreference("showAdvanced", {
		icon: "fluent:wrench-20-regular",
		displayName: "Show Advanced Options",
		description: "Shows even more preferences for advanced users to perfectly dial in their experience.",
	});

	export const settings = createPreferences(
		new EnumPreference("theme", {
			displayName: "Theme",
			description: "Sets the theme. Note that some things (like the immersive background) may feel a bit off in Light mode.",

			defaultValue: "dark",
			options: {
				auto: {
					displayName: "System",
					icon: "fluent:dark-theme-20-regular",
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
		new TogglePreference("debugMode", {
			icon: "fluent:bug-20-regular",
			displayName: "Debug Mode",
			description: "Enables some features to help with debugging.",
		}),

		...groupPreferences(
			"Immersive Mode",
			[],

			...new TogglePreference("immersiveMode", {
				displayName: "Enable Immersive Mode",
				description: "Enables the website's experimental immersive features.",
			}).withDependents(
				true,
				new TogglePreference("immersiveFX", {
					displayName: "Immersive Effects",
					description: "Enables a few fancy CSS effects. These can harm performance a bit.",
				}),
				...groupPreferences(
					"Background",
					[],

					...new TogglePreference("bgEnabled", {
						displayName: "Immersive Background",
						description: "Enables the animated starry background. This requires WebGL support.",
					}).withDependents(
						true,
						...PresetPreference.create("bgQuality",
							{
								options: {
									low: {
										displayName: "Low",
										settings: {
											bgRenderScale: 0.5,
											bgDPIFactor: 0.35,
											bgFrameSkip: 3,
											bgActiveFrameSkip: 1,
										},
									},
									medium: {
										displayName: "Medium",
										settings: {
											bgRenderScale: 0.65,
											bgDPIFactor: 0.5,
											bgFrameSkip: 2,
											bgActiveFrameSkip: 0,
										},
									},
									high: {
										displayName: "High",
										settings: {
											bgRenderScale: 1,
											bgDPIFactor: 0.65,
											bgFrameSkip: 1,
											bgActiveFrameSkip: 0,
										},
									},
									ultra: {
										displayName: "Ultra",
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
								"Advanced Quality Settings",
								[showAdvanced.asDependency(true)],

								new NumberPreference("bgRenderScale", {
									min: 0.1,
									max: 1,
									step: 0.05,
								}),
								new NumberPreference("bgDPIFactor", {
									min: 0,
									max: 1,
									step: 0.05,
								}),
								new NumberPreference("bgFrameSkip", {
									min: 0,
									max: 10,
								}),
								new NumberPreference("bgActiveFrameSkip", {
									min: 0,
									max: 10,
								}),
							),
						),
					),
				),
			),
		),
	);
}

export const preferences = _preferences.settings;
export type Preferences = typeof preferences;
export type PreferenceName = keyof Preferences & string;

// @ts-check
/** @type {import("stylelint").Config} */
export default {
	extends: ["stylelint-config-standard-scss", "stylelint-config-html/astro"],
	ignoreFiles: ["node_modules", "src/styles/_colors.scss"],
	rules: {
		// Personal preference
		// TODO: maybe don't use null for these?
		"declaration-empty-line-before": null,
		"scss/dollar-variable-empty-line-before": null,
	},
	overrides: [
		{
			// Allow :global() pseudo-class in Astro files and SCSS modules
			files: ["src/**/*.astro", "src/**/*.module.scss"],
			rules: {
				"selector-pseudo-class-no-unknown": [true, { ignorePseudoClasses: ["global"] }],
			},
		},
	],
};

import { RuleConfigSeverity, type UserConfig } from "@commitlint/types";

export default {
	extends: ["@commitlint/config-conventional"],
	rules: {
		"body-case": [RuleConfigSeverity.Error, "always", "sentence-case"],
		"body-full-stop": [RuleConfigSeverity.Error, "always", "."],
		"scope-case": [RuleConfigSeverity.Error, "always", "lower-case"],
	},
} satisfies UserConfig;

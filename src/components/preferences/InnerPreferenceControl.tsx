import { type PreferenceID, preferences, savePreferences } from "../scripts/preferences";
import type { ComponentChildren } from "preact";

interface Props {
	preference: PreferenceID;
	children: ComponentChildren;
}

/** A helper component containing the actual control part of the PreferenceControl component. */
export function InnerPreferenceControl({ preference: id, children }: Props) {
	const preference = preferences[id];
	const onInput = (value: unknown) => {
		const result = preference.set(value);
		if (result !== undefined) {
			savePreferences();
		}
	};
	return preference.toComponent(onInput, children);
}

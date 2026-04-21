import { type PreferenceID, preferences, savePreferences } from "../../scripts/preferences";
import type { ComponentChildren } from "preact";
import { useEffect, useState } from "preact/hooks";

interface Props {
	preference: PreferenceID;
	children: ComponentChildren;

	[cid: string]: unknown;
}

export interface PreferenceControlState<T = unknown> {
	onInput: (value: unknown) => void;
	value: T;
	hidden: boolean;
	children: ComponentChildren;
	cid: Record<string, unknown>;
}

/** A helper component containing the actual control part of the PreferenceControl component. */
export function InnerPreferenceControl({ preference: id, children: icons, ...cid }: Props) {
	const preference = preferences[id];
	const [value, setValue] = useState(preference.fallbackValue);
	const [hidden, setHidden] = useState(true);

	const onInput = (value: unknown) => {
		const result = preference.set(value);
		if (result !== undefined) {
			savePreferences();
		}
	};

	const update = () => {
		setValue(preference.get());
		setHidden(preference.isAvailable());
		//console.debug(preference.id, value, hidden);
	};
	useEffect(() => {
		document.addEventListener("custom:preferences-updated", update);
		update();
		return () => document.removeEventListener("custom:preferences-updated", update);
	});

	const state: PreferenceControlState = { onInput, value, hidden, children: icons, cid };
	return preference.toComponent(state as never);
}

import type { Preference, PreferenceCategory } from "./types/Preference.ts";

export type NotUndefined = {} | null;
export type MapLike<K, V> = Map<K, V> | MapEntries<K, V>;
export type MapEntries<K, V> = (readonly [K, V])[];

/** Extracts the IDs from a tuple of preferences. */
export type PreferenceKeys<T extends Preference[]>
	= T extends Preference<infer K>[] ? K : never;

/** Extracts the correct preference type for the given ID from a tuple of preferences. */
export type PreferenceType<T extends Preference[], K extends PreferenceKeys<T>>
	= Extract<T[number], Preference<K>>;

/** Defines a record type that maps a list of preferences to their value types. */
export type PreferenceValues<T extends Preference[]> = {
	[K in PreferenceKeys<T>]: PreferenceType<T, K> extends Preference<K, infer V> ? V : never;
}

/** Defines a record type for a tuple of preferences. */
type PreferencesRecord<T extends Preference[]> = Iterable<T[number]> & {
	readonly [K in PreferenceKeys<T>]: PreferenceType<T, K>;
};

/** Creates an object from a list of preferences that can be iterated over. */
export function createPreferences<T extends Preference[]>(...preferences: T): PreferencesRecord<T> {
	const record: Record<string, Preference> = {};

	for (const preference of preferences) {
		if (preference.id in record) {
			throw new Error(`Duplicate preference ID: ${preference.id}`);
		}

		record[preference.id] = preference;
	}

	return {
		...record,
		[Symbol.iterator]: () => preferences.values(),
	} as unknown as PreferencesRecord<T>;
}

/**
 * Modifies the given preferences to be in the given (sub)category.
 *
 * @returns The preferences that were passed.
 */
export function groupPreferences<T extends Preference[]>(category: PreferenceCategory, ...preferences: T): T {
	for (const preference of preferences) {
		preference.category.unshift(category);
		preference.currentCategory = category;
	}
	return preferences;
}

export function getDependencyString(dependencies?: MapLike<Preference, NotUndefined[]>) {
	return dependencies && JSON.stringify(
		[...dependencies].map(([preference, allowedValues]) => [preference.id, allowedValues]),
	);
}

export function dependenciesMet(dependencies: MapLike<Preference, NotUndefined[]>) {
	for (const [preference, allowedValues] of dependencies) {
		if (!preference.isAvailable() || !allowedValues.some(value => preference.equals(value))) {
			return false;
		}
	}
	return true;
}

export type NotUndefined = {} | null;
export type MapLike<K, V> = ReadonlyMap<K, V> | readonly (readonly [K, V])[];

export interface PreferenceConfig<T extends NotUndefined> {
	/**
	 * The icon for this preference.
	 *
	 * @remarks You should only omit this if the preference's icons are already handled by something else, like enum values.
	 */
	icon?: string;

	/**
	 * The display name of this preference.
	 *
	 * @remarks While this is technically optional, the default value simply displays the preference's ID,
	 * which isn't very user-friendly.
	 */
	displayName?: string;

	/** The description of this preference. */
	description?: string;

	/**
	 * The (sub)category this preference is in.
	 *
	 * @see {@linkcode groupPreferences}
	 */
	category?: Iterable<string>;

	/** A list of other preferences that need to have a certain value for this setting to show up. */
	dependencies?: MapLike<BasePreference, NotUndefined>;

	/** The default value of this setting. */
	defaultValue?: T;
}

/** The base class for all preferences. */
export abstract class BasePreference<K extends string = string, T extends NotUndefined = NotUndefined> implements PreferenceConfig<T> {
	readonly displayName: string;
	readonly description?: string;
	readonly icon?: string;

	readonly defaultValue: T;
	readonly dependencies: Map<BasePreference, NotUndefined>;
	readonly category: string[];

	protected _value!: T;

	protected constructor(readonly id: K, config: PreferenceConfig<T>, protected _fallbackValue: T) {

		this.displayName = config.displayName ?? id;
		this.description = config.description;
		this.icon = config.icon;

		this.defaultValue = config.defaultValue ?? this._fallbackValue;
		this.dependencies = new Map(config.dependencies);
		this.category = config.category ? [...config.category] : [];

		this.set(this.defaultValue);
	}

	/** Gets the current value of this preference. */
	get() {
		return this._value;
	}

	/** Attempts to set the value of this preference.*/
	set(value: unknown) {
		const transformedValue = this.validate(value);
		if (transformedValue !== undefined) {
			this._value = transformedValue;
		} else {
			console.warn("Attempted to assign invalid value", value, "to", this);
		}
		return transformedValue;
	}

	abstract validate(value: unknown): T | undefined;

	/** Returns whether the dependencies of this preference are all enabled. */
	isAvailable() {
		for (const [dependency, requiredValue] of this.dependencies) {
			if (dependency.get() !== requiredValue) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Makes this preference a dependency of the given preferences,
	 * and returns an array containing itself and the children.
	 */
	withDependents<P extends BasePreference[]>(requiredValue: T, ...children: P) {
		for (const child of children) {
			child.dependencies.set(this, requiredValue);
		}
		return [this, ...children] as const;
	}

	/** Defines this preference as a dependency. This is useful to ensure the required value is of the correct type. */
	asDependency(requiredValue: T) {
		return [this, requiredValue] as const;
	}

	/** Allows preferences to be serialized to JSON. This returns the same value as {@linkcode get} by default. */
	toJSON() {
		return this.get();
	}
}

/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { JSX } from "preact";
import type { PreferenceControlState } from "../../../components/preferences/InnerPreferenceControl.tsx";
import { dependenciesMet, type MapEntries, type MapLike, type NotUndefined } from "../utils.ts";

export interface PreferenceConfig<T extends NotUndefined> {
	/**
	 * The icon for this preference.
	 * @remarks Omitting this is generally not recommended.
	 */
	icon?: string;

	/**
	 * The display name of this preference.
	 *
	 * @remarks While this is technically optional, the default value simply displays the preference's ID,
	 * which isn't very user-friendly.
	 */
	title?: string;

	/**
	 * A brief description of this preference.
	 * @remarks Omitting this is generally not recommended.
	 */
	description?: string;

	/**
	 * The (sub)category this preference is in.
	 * @see {@linkcode groupPreferences}
	 */
	category?: Iterable<PreferenceCategory>;

	/** A list of other preferences that need to have a certain value for this setting to show up. */
	dependencies?: MapLike<Preference, NotUndefined[]>;

	/**
	 * Returns the default value of this setting.
	 *
	 * This is only called on the client, so you can access DOM APIs here.
	 */
	defaultValue?: () => T;
}

export interface PreferenceCategory {
	/** The title of the category. */
	title?: string;

	/** A brief description of this category. */
	description?: string;

	/** A list of other preferences that need to have a certain value for the category and its settings to show up. */
	dependencies?: MapEntries<Preference, NotUndefined[]>;
}

/** The base class for all preferences. */
export abstract class Preference<K extends string = string, T extends NotUndefined = NotUndefined>
	implements PreferenceConfig<T> {

	readonly title: string;
	readonly description?: string;
	readonly icon?: string;

	readonly defaultValue: () => T;
	readonly dependencies: Map<Preference, NotUndefined[]>;
	readonly category: PreferenceCategory[];

	/** The most recent category that was assigned to the preference by {@linkcode groupPreferences}. */
	currentCategory?: PreferenceCategory;

	protected _value!: T;

	protected constructor(readonly id: K, config: PreferenceConfig<T>, public fallbackValue: T) {
		this.title = config.title ?? id;
		this.description = config.description;
		this.icon = config.icon;

		this.defaultValue = config.defaultValue ?? (() => this.fallbackValue);
		this.dependencies = new Map(config.dependencies);
		this.category = config.category ? [...config.category] : [];
	}

	/** Gets the current value of this preference. */
	get() {
		return this._value;
	}

	/** Attempts to set the value of this preference. */
	set(value: unknown) {
		const transformedValue = this.validate(value);
		if (transformedValue !== undefined) {
			this._value = transformedValue;
		} else {
			console.warn("Attempted to assign invalid value", value, "to", this);
		}
		return transformedValue;
	}

	/**
	 * Ensures the given value is valid for this preference.
	 *
	 * This should return `undefined` if the value is invalid and cannot be corrected.
	 */
	abstract validate(value: unknown): T | undefined;

	/**
	 * Returns whether this preference is essentially equal to the given value.
	 *
	 * You should use this over `preference.get() === other` to allow for things like improved number comparisons.
	 */
	equals(other: unknown) {
		return this.get() === other;
	}

	/** Returns whether the dependencies of this preference are all enabled. */
	isAvailable() {
		return dependenciesMet(this.dependencies);
	}

	/**
	 * Makes this preference a dependency of the given preferences,
	 * and returns an array containing itself and the children.
	 */
	withDependents<P extends Preference[]>(allowedValues: T[], ...children: P) {
		if (!Array.isArray(allowedValues)) {
			throw new Error("allowedValues must be an array");
		}

		for (const child of children) {
			child.dependencies.set(this, allowedValues);

			const category = child.category[0];
			if (!category) {
				continue;
			}

			category.dependencies ??= [];
			if (!category.dependencies.some(([dependency]) => dependency === this)) {
				category.dependencies.push([this, allowedValues]);
			}
		}
		return [this, ...children] as const;
	}

	/** Defines this preference as a dependency. This is useful to ensure the allowed values are of the correct type. */
	asDependency(...allowedValues: T[]) {
		return [this, allowedValues] as const;
	}

	/** Creates a control for this preference. */
	abstract toComponent(state: PreferenceControlState<T>): JSX.Element;

	/** Allows preferences to be serialized to JSON. This returns the same value as {@linkcode get} by default. */
	toJSON() {
		return this.get();
	}
}

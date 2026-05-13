/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { dependenciesMet, type MapLike, type NotUndefined } from "../preferences/utils.ts";
import type { Preference } from "../preferences/types/Preference.ts";

const root = document.querySelector<HTMLElement>(".debug-display")!;

export class DebugCategory {
	private static readonly _instances: DebugCategory[] = [];

	readonly container;
	readonly displays: DebugDisplay[] = [];

	constructor(public name: string) {
		let container = root.querySelector<HTMLElement>(`[data-debug-category="${name}"]`);
		if (!container) {
			container = document.createElement("section");
			container.dataset.debugCategory = name;

			const heading = document.createElement("h5");
			heading.textContent = name;

			container.appendChild(heading);
			root.appendChild(container);
		}

		this.container = container;
		DebugCategory._instances.push(this);
	}

	static updateVisibilities() {
		let visible = false;
		for (const category of this._instances) {
			if (category.updateVisibility()) {
				visible = true;
			}
		}

		root.hidden = !visible;
		return visible;
	}

	updateVisibility() {
		let visible = false;
		for (const display of this.displays) {
			if (display.updateVisibility()) {
				visible = true;
			}
		}

		this.container.hidden = !visible;
		return visible;
	}
}

interface DebugDisplayConfig {
	name: string;
	description?: string;
	category: DebugCategory;
	dependencies?: MapLike<Preference, NotUndefined[]>;
	format?: (value: unknown) => string;
}

export class DebugDisplay implements DebugDisplayConfig {
	readonly name;
	readonly description;
	readonly category;
	readonly dependencies;
	readonly format;

	isVisible = false;
	private _value?: unknown;

	private readonly _nameElement;
	private readonly _valueElement;

	constructor(config: DebugDisplayConfig, initialValue?: unknown) {
		this.name = config.name;
		this.description = config.description ?? "";
		this.category = config.category;
		this.dependencies = new Map(config.dependencies);
		this.format = config.format ?? (value => String(value));

		const container = this.category.container;
		let valueElement = container.querySelector<HTMLElement>(`[data-debug-display-value="${this.name}"]`);
		if (!valueElement) {
			valueElement = document.createElement("pre");
			valueElement.dataset.debugDisplayValue = this.name;
			valueElement.title = this.description;
			container.append(valueElement);
		}

		let nameElement = container.querySelector<HTMLElement>(`[data-debug-display-name="${this.name}"]`);
		if (!nameElement) {
			nameElement = document.createElement("h6");
			nameElement.dataset.debugDisplayName = this.name;
			nameElement.title = this.description;
			nameElement.textContent = this.name;
			container.insertBefore(nameElement, valueElement);
		}

		this._nameElement = nameElement;
		this._valueElement = valueElement;
		this.category.displays.push(this);

		DebugCategory.updateVisibilities();
		this.set(initialValue ?? "");
	}

	set(value: unknown) {
		this._value = value;
		this._updateText();
	}

	updateVisibility() {
		const visible = dependenciesMet(this.dependencies);
		this._nameElement.hidden = this._valueElement.hidden = !visible;
		this.isVisible = visible;
		this._updateText();
		return visible;
	}

	private _updateText() {
		if (this.isVisible) {
			this._valueElement.textContent = this.format(this._value);
		}
	}
}

document.addEventListener("custom:preferences-updated", () => DebugCategory.updateVisibilities());

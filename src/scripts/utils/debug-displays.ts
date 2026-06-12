/*
 * Copyright (c) 2026 f78.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { NotUndefined } from "../../types.ts";
import type { Preference } from "../preferences/types/Preference.ts";
import { dependenciesMet, type MapLike } from "../preferences/utils.ts";

// TODO: could this be handled better?
const root = document.querySelector<HTMLElement>(".debug-display")!;
if (!root) {
	throw new Error("Could not find root element for the debug display");
}

export class DebugCategory {
	static readonly #instances: DebugCategory[] = [];

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
		DebugCategory.#instances.push(this);
	}

	static updateVisibilities() {
		let visible = false;
		for (const category of this.#instances) {
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

	readonly #nameElement;
	readonly #valueElement;

	#value?: unknown;

	constructor(config: DebugDisplayConfig, initialValue?: unknown) {
		this.name = config.name;
		this.description = config.description ?? "";
		this.category = config.category;
		this.dependencies = new Map(config.dependencies);
		this.format = config.format ?? ((value) => String(value));

		const container = this.category.container;
		let valueElement = container.querySelector<HTMLElement>(
			`[data-debug-display-value="${this.name}"]`,
		);
		if (!valueElement) {
			valueElement = document.createElement("pre");
			valueElement.dataset.debugDisplayValue = this.name;
			valueElement.title = this.description;
			container.append(valueElement);
		}

		let nameElement = container.querySelector<HTMLElement>(
			`[data-debug-display-name="${this.name}"]`,
		);
		if (!nameElement) {
			nameElement = document.createElement("h6");
			nameElement.dataset.debugDisplayName = this.name;
			nameElement.title = this.description;
			nameElement.textContent = this.name;
			container.insertBefore(nameElement, valueElement);
		}

		this.#nameElement = nameElement;
		this.#valueElement = valueElement;
		this.category.displays.push(this);

		DebugCategory.updateVisibilities();
		this.set(initialValue ?? "");
	}

	set(value: unknown) {
		this.#value = value;
		this.#updateText();
	}

	updateVisibility() {
		const visible = dependenciesMet(this.dependencies);
		this.#nameElement.hidden = this.#valueElement.hidden = !visible;
		this.isVisible = visible;
		this.#updateText();
		return visible;
	}

	#updateText() {
		if (this.isVisible) {
			this.#valueElement.textContent = this.format(this.#value);
		}
	}
}

document.addEventListener("custom:preferences-updated", () => DebugCategory.updateVisibilities());

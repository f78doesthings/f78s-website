import type { MapLike, NotUndefined } from "./preferences/utils.ts";
import type { Preference } from "./preferences/types/Preference.ts";

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
	category: DebugCategory;
	dependencies?: MapLike<Preference, NotUndefined[]>;
	format?: (value: unknown) => string;
}

export class DebugDisplay implements DebugDisplayConfig {
	readonly name;
	readonly category;
	readonly dependencies;
	readonly format;
	public isVisible = false;
	private readonly _nameElement;
	private readonly _valueElement;

	constructor(config: DebugDisplayConfig, initialValue?: unknown) {
		this.name = config.name;
		this.category = config.category;
		this.dependencies = new Map(config.dependencies);
		this.format = config.format ?? (value => String(value));

		const container = this.category.container;
		let valueElement = container.querySelector<HTMLElement>(`[data-debug-display-value="${this.name}"]`);
		if (!valueElement) {
			valueElement = document.createElement("pre");
			valueElement.dataset.debugDisplayValue = this.name;
			container.append(valueElement);
		}

		let nameElement = container.querySelector<HTMLElement>(`[data-debug-display-name="${this.name}"]`);
		if (!nameElement) {
			nameElement = document.createElement("h6");
			nameElement.textContent = this.name;
			container.insertBefore(nameElement, valueElement);
		}

		this._nameElement = nameElement;
		this._valueElement = valueElement;
		this.category.displays.push(this);
		DebugCategory.updateVisibilities();

		this.set(initialValue);
	}

	set(value: unknown) {
		if (this.isVisible) {
			this._valueElement.textContent = this.format(value);
		}
	}

	updateVisibility() {
		let visible = true;
		for (const [property, allowedValues] of this.dependencies) {
			if (!allowedValues.some(value => property.equals(value))) {
				visible = false;
				break;
			}
		}

		this._nameElement.hidden = !visible;
		this._valueElement.hidden = !visible;
		this.isVisible = visible;
		return visible;
	}
}

document.addEventListener("custom:preferences-updated", () => {
	DebugCategory.updateVisibilities();
});

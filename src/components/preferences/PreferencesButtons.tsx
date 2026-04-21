import { useEffect, useState } from "preact/hooks";

export function PreferencesButtons() {
	const [target, setTarget] = useState("/");

	useEffect(() => {
		const from = new URLSearchParams(window.location.search).get("from");
		if (from) {
			setTarget(from);
		}
	});
	return (
		<div class="buttons">
			<a href={target} class="btn">Apply</a>
		</div>
	);
}

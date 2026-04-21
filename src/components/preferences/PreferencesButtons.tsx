export function PreferencesActions() {
	const redirectTo = new URLSearchParams(location.search).get("from");
	return (
		<div class="buttons">
			<a href={redirectTo ?? "/"}>Apply</a>
		</div>
	);
}

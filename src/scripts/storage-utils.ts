export function getStorageItem<T>(key: string, storage: Storage = localStorage): T | undefined {
	try {
		const json = storage.getItem(key);
		return json ? JSON.parse(json) : undefined;
	} catch (e) {
		console.warn(`Error while getting storage item ${key}:`, e);
	}
}

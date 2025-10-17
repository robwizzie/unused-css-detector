import * as vscode from 'vscode';

export class IgnoreManager {
	private static readonly CONFIG_KEY = 'unusedCssDetector.ignoredSelectors';

	/**
	 * Get all ignored selectors
	 */
	static getIgnoredSelectors(): string[] {
		const config = vscode.workspace.getConfiguration();
		return config.get<string[]>(IgnoreManager.CONFIG_KEY, []);
	}

	/**
	 * Add a selector to the ignore list
	 */
	static async addIgnoredSelector(selector: string): Promise<boolean> {
		const ignored = IgnoreManager.getIgnoredSelectors();

		if (ignored.includes(selector)) {
			return false; // Already ignored
		}

		ignored.push(selector);
		const config = vscode.workspace.getConfiguration();

		try {
			await config.update(IgnoreManager.CONFIG_KEY, ignored, vscode.ConfigurationTarget.Global);
			return true;
		} catch (err) {
			vscode.window.showErrorMessage(`Failed to ignore selector: ${err}`);
			return false;
		}
	}

	/**
	 * Remove a selector from the ignore list
	 */
	static async removeIgnoredSelector(selector: string): Promise<boolean> {
		const ignored = IgnoreManager.getIgnoredSelectors();
		const filtered = ignored.filter(s => s !== selector);

		if (filtered.length === ignored.length) {
			return false; // Wasn't in the list
		}

		const config = vscode.workspace.getConfiguration();

		try {
			await config.update(IgnoreManager.CONFIG_KEY, filtered, vscode.ConfigurationTarget.Global);
			return true;
		} catch (err) {
			vscode.window.showErrorMessage(`Failed to remove ignored selector: ${err}`);
			return false;
		}
	}

	/**
	 * Check if a selector is ignored
	 */
	static isIgnored(selector: string): boolean {
		return IgnoreManager.getIgnoredSelectors().includes(selector);
	}

	/**
	 * Clear all ignored selectors
	 */
	static async clearAll(): Promise<void> {
		const config = vscode.workspace.getConfiguration();
		await config.update(IgnoreManager.CONFIG_KEY, [], vscode.ConfigurationTarget.Global);
	}
}

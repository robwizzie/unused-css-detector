import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ScanResults } from './scanner';

export class CSSRemover {
	constructor(private outputChannel: vscode.OutputChannel) {}

	async removeUnusedWithPreview(results: ScanResults | null) {
		if (!results || results.details.length === 0) {
			vscode.window.showInformationMessage('No unused CSS to remove');
			return;
		}

		const items = results.details.map(detail => ({
			label: `${detail.type === 'class' ? '.' : '#'}${detail.selector}`,
			description: detail.reason,
			detail: `Confidence: ${detail.confidence}`,
			picked: detail.confidence === 'high',
			data: detail
		}));

		const selected = await vscode.window.showQuickPick(items, {
			canPickMany: true,
			placeHolder: 'Select CSS rules to remove (high confidence pre-selected)'
		});

		if (!selected || selected.length === 0) {
			return;
		}

		const confirm = await vscode.window.showWarningMessage(`Remove ${selected.length} CSS rule(s)?`, { modal: true }, 'Yes', 'No');

		if (confirm === 'Yes') {
			await this.removeCSSRules(
				results.cssFile,
				selected.map(s => s.data)
			);
		}
	}

	async removeHighConfidenceUnused(results: ScanResults | null) {
		if (!results) {
			vscode.window.showInformationMessage('No scan results available');
			return;
		}

		const highConfidence = results.details.filter(d => d.confidence === 'high');

		if (highConfidence.length === 0) {
			vscode.window.showInformationMessage('No high-confidence unused CSS found');
			return;
		}

		const confirm = await vscode.window.showWarningMessage(`Remove ${highConfidence.length} high-confidence unused CSS rule(s)?`, { modal: true }, 'Yes', 'No');

		if (confirm === 'Yes') {
			await this.removeCSSRules(results.cssFile, highConfidence);
		}
	}

	private async removeCSSRules(cssFile: string, rules: any[]) {
		const config = vscode.workspace.getConfiguration('unusedCssDetector');
		const createBackup = config.get<boolean>('createBackup', true);

		try {
			// Create backup
			if (createBackup) {
				const backupPath = cssFile + '.backup';
				await fs.promises.copyFile(cssFile, backupPath);
				this.outputChannel.appendLine(`Backup created: ${backupPath}`);
			}

			// Read CSS file
			const content = await fs.promises.readFile(cssFile, 'utf8');
			const lines = content.split('\n');

			// Track which CSS blocks to remove
			const selectorsToRemove = new Set(rules.map(r => r.selector));
			let newContent = content;

			for (const selector of selectorsToRemove) {
				// Remove CSS blocks for this selector
				// This is a simple implementation - for production, use a proper CSS parser
				const pattern = new RegExp(`\\.${selector}\\s*\\{[^}]*\\}`, 'g');
				newContent = newContent.replace(pattern, '');
			}

			// Clean up extra blank lines
			newContent = newContent.replace(/\n\n\n+/g, '\n\n');

			// Write back
			await fs.promises.writeFile(cssFile, newContent, 'utf8');

			vscode.window.showInformationMessage(`Removed ${rules.length} CSS rule(s) from ${path.basename(cssFile)}`);

			this.outputChannel.appendLine(`\nRemoved ${rules.length} CSS rules from ${cssFile}`);

			// Reload the file in editor
			const doc = await vscode.workspace.openTextDocument(cssFile);
			await vscode.window.showTextDocument(doc);
		} catch (err) {
			vscode.window.showErrorMessage(`Error removing CSS: ${err}`);
			this.outputChannel.appendLine(`Error: ${err}`);
		}
	}
}

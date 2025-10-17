import * as vscode from 'vscode';
import { CSSScanner } from './scanner';
import { ResultsPanel } from './resultsPanel';
import { CSSRemover } from './remover';
import { IgnoreManager } from './ignoreManager';

let outputChannel: vscode.OutputChannel;
let scanner: CSSScanner;
let resultsPanel: ResultsPanel;
let remover: CSSRemover;
let diagnosticCollection: vscode.DiagnosticCollection;

// Decoration types
const unusedHighDecoration = vscode.window.createTextEditorDecorationType({
	textDecoration: 'underline wavy rgba(255, 200, 0, 0.8)', // Yellow wavy underline
	overviewRulerColor: 'rgba(255, 200, 0, 0.8)',
	overviewRulerLane: vscode.OverviewRulerLane.Right
});

const unusedMediumDecoration = vscode.window.createTextEditorDecorationType({
	textDecoration: 'underline wavy rgba(255, 200, 0, 0.5)', // Lighter yellow wavy underline
	overviewRulerColor: 'rgba(255, 200, 0, 0.5)',
	overviewRulerLane: vscode.OverviewRulerLane.Right
});

export function activate(context: vscode.ExtensionContext) {
	outputChannel = vscode.window.createOutputChannel('Unused CSS Detector');
	scanner = new CSSScanner(outputChannel);
	resultsPanel = new ResultsPanel(context.extensionUri);
	remover = new CSSRemover(outputChannel);

	// Create diagnostic collection for Problems panel
	diagnosticCollection = vscode.languages.createDiagnosticCollection('unused-css');

	// Command: Scan Current File
	const scanCurrentFile = vscode.commands.registerCommand('unused-css-detector.scanCurrentFile', async () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showErrorMessage('No active editor');
			return;
		}

		const config = vscode.workspace.getConfiguration('unusedCssDetector');
		const cssFileTypes = config.get<string[]>('cssFileTypes', ['css', 'scss', 'sass', 'less']);
		const fileExt = editor.document.fileName.split('.').pop()?.toLowerCase();

		if (!cssFileTypes.includes(fileExt || '')) {
			vscode.window.showErrorMessage(`Please open a CSS file (${cssFileTypes.join(', ')})`);
			return;
		}

		await scanFile(editor);
	});

	// Command: Scan Project
	const scanProject = vscode.commands.registerCommand('unused-css-detector.scanProject', async () => {
		await scanEntireProject();
	});

	// Command: Remove Unused (Preview)
	const removeUnusedPreview = vscode.commands.registerCommand('unused-css-detector.removeUnusedPreview', async () => {
		await remover.removeUnusedWithPreview(scanner.getLastResults());
	});

	// Command: Remove High Confidence
	const removeUnusedHighConfidence = vscode.commands.registerCommand('unused-css-detector.removeUnusedHighConfidence', async () => {
		await remover.removeHighConfidenceUnused(scanner.getLastResults());
	});

	// Command: Show Report
	const showReport = vscode.commands.registerCommand('unused-css-detector.showReport', async () => {
		const results = scanner.getLastResults();
		if (results) {
			resultsPanel.show(results);
		} else {
			vscode.window.showInformationMessage('No scan results available. Run a scan first.');
		}
	});

	// Command: Clear Cache
	const clearCache = vscode.commands.registerCommand('unused-css-detector.clearCache', () => {
		scanner.clearCache();
		diagnosticCollection.clear();
		vscode.window.showInformationMessage('Cache cleared');
	});

	// Auto-scan on save (if enabled)
	const onSaveListener = vscode.workspace.onDidSaveTextDocument(async document => {
		const config = vscode.workspace.getConfiguration('unusedCssDetector');
		const autoScan = config.get<boolean>('autoScanOnSave', false);

		if (!autoScan) return;

		const cssFileTypes = config.get<string[]>('cssFileTypes', ['css', 'scss', 'sass', 'less']);
		const fileExt = document.fileName.split('.').pop()?.toLowerCase();

		if (cssFileTypes.includes(fileExt || '')) {
			const editor = vscode.window.activeTextEditor;
			if (editor && editor.document === document) {
				await scanFile(editor);
			}
		}
	});

	context.subscriptions.push(scanCurrentFile, scanProject, removeUnusedPreview, removeUnusedHighConfidence, showReport, clearCache, diagnosticCollection, onSaveListener, outputChannel);

	// Register hover provider
	const hoverProvider = vscode.languages.registerHoverProvider(['css', 'scss', 'sass', 'less'], {
		provideHover(document, position) {
			const results = scanner.getLastResults();
			if (!results) return;

			const range = document.getWordRangeAtPosition(position, /[\.\#][a-zA-Z0-9_-]+/);
			if (!range) return;

			const selector = document.getText(range);
			const detail = results.details.find(d => `.${d.selector}` === selector || `#${d.selector}` === selector);

			if (detail) {
				const md = new vscode.MarkdownString();
				md.isTrusted = true; // Allow command links
				md.appendMarkdown(`### ⚠️ Potentially Unused ${detail.type === 'class' ? 'Class' : 'ID'}\n\n`);
				md.appendMarkdown(`**Confidence:** ${detail.confidence}\n\n`);
				md.appendMarkdown(`**Files Checked:**\n`);
				md.appendMarkdown(`- ${detail.filesChecked.htmlFiles} HTML files\n`);
				md.appendMarkdown(`- ${detail.filesChecked.jsFiles} JavaScript/PHP files\n\n`);
				md.appendMarkdown(`**Reason:** ${detail.reason}\n\n`);
				md.appendMarkdown(`[Ignore this selector](command:unused-css-detector.ignoreSelector?${encodeURIComponent(JSON.stringify([{ message: `Unused ${detail.type}: "${detail.selector}"` }]))})`);

				return new vscode.Hover(md);
			}
		}
	});

	context.subscriptions.push(hoverProvider);

	// Register code action provider for quick fixes
	const codeActionProvider = vscode.languages.registerCodeActionsProvider(['css', 'scss', 'sass', 'less'], {
		provideCodeActions(document, range, context) {
			const codeActions: vscode.CodeAction[] = [];

			// Find diagnostics at this location
			for (const diagnostic of context.diagnostics) {
				if (diagnostic.source !== 'Unused CSS Detector') continue;

				// Extract selector from diagnostic message
				const match = diagnostic.message.match(/Unused (?:class|id): "([^"]+)"/);
				if (!match) continue;

				const selector = match[1];

				// Create "Ignore" action
				const ignoreAction = new vscode.CodeAction(`Ignore "${selector}"`, vscode.CodeActionKind.QuickFix);
				ignoreAction.command = {
					title: 'Ignore Selector',
					command: 'unused-css-detector.ignoreSelector',
					arguments: [diagnostic]
				};
				ignoreAction.diagnostics = [diagnostic];
				ignoreAction.isPreferred = false;

				codeActions.push(ignoreAction);
			}

			return codeActions;
		}
	});

	context.subscriptions.push(codeActionProvider);

	// Command: Ignore Selector
	const ignoreSelector = vscode.commands.registerCommand('unused-css-detector.ignoreSelector', async (diagnostic: vscode.Diagnostic) => {
		if (!diagnostic) {
			vscode.window.showErrorMessage('No selector to ignore');
			return;
		}

		// Extract selector name from diagnostic message
		const match = diagnostic.message.match(/Unused (?:class|id): "([^"]+)"/);
		if (!match) {
			vscode.window.showErrorMessage('Could not extract selector name');
			return;
		}

		const selector = match[1];
		const added = await IgnoreManager.addIgnoredSelector(selector);

		if (added) {
			vscode.window.showInformationMessage(`Ignoring CSS selector: ${selector}`);

			// Clear diagnostics for this selector
			const editor = vscode.window.activeTextEditor;
			if (editor) {
				const currentDiagnostics = diagnosticCollection.get(editor.document.uri) || [];
				const filtered = currentDiagnostics.filter(d => !d.message.includes(`"${selector}"`));
				diagnosticCollection.set(editor.document.uri, filtered);
			}
		} else {
			vscode.window.showInformationMessage(`Selector already ignored: ${selector}`);
		}
	});

	// Command: Manage Ignored Selectors
	const manageIgnored = vscode.commands.registerCommand('unused-css-detector.manageIgnoredSelectors', async () => {
		const ignored = IgnoreManager.getIgnoredSelectors();

		if (ignored.length === 0) {
			vscode.window.showInformationMessage('No ignored selectors');
			return;
		}

		const items = ignored.map(selector => ({
			label: selector,
			description: 'Click to un-ignore',
			selector
		}));

		items.push({
			label: '$(trash) Clear All Ignored Selectors',
			description: 'Remove all ignored selectors',
			selector: '__clear_all__'
		});

		const selected = await vscode.window.showQuickPick(items, {
			placeHolder: 'Select a selector to un-ignore, or clear all'
		});

		if (!selected) return;

		if (selected.selector === '__clear_all__') {
			const confirm = await vscode.window.showWarningMessage('Clear all ignored selectors?', 'Yes', 'No');

			if (confirm === 'Yes') {
				await IgnoreManager.clearAll();
				vscode.window.showInformationMessage('Cleared all ignored selectors');
			}
		} else {
			await IgnoreManager.removeIgnoredSelector(selected.selector);
			vscode.window.showInformationMessage(`Un-ignored: ${selected.selector}`);
		}
	});

	context.subscriptions.push(ignoreSelector, manageIgnored);
}

async function scanFile(editor: vscode.TextEditor) {
	const cssFilePath = editor.document.uri.fsPath;
	const config = vscode.workspace.getConfiguration('unusedCssDetector');
	const showOutput = config.get<boolean>('showOutputChannel', false);

	outputChannel.clear();
	if (showOutput) {
		outputChannel.show(true);
	}
	outputChannel.appendLine('='.repeat(60));
	outputChannel.appendLine('Unused CSS Detector - Scan Started');
	outputChannel.appendLine('='.repeat(60));

	const showNotification = config.get<boolean>('showNotification', false);

	await vscode.window.withProgress(
		{
			location: showNotification ? vscode.ProgressLocation.Notification : vscode.ProgressLocation.Window,
			title: 'Finding Unused CSS',
			cancellable: true
		},
		async (progress, token) => {
			const results = await scanner.scanCSSFile(cssFilePath, progress, token);

			if (token.isCancellationRequested) {
				outputChannel.appendLine('\nScan cancelled by user');
				return;
			}

			displayResults(results, editor);
			addProblemsToPanel(results, editor.document);
		}
	);
}

async function scanEntireProject() {
	const config = vscode.workspace.getConfiguration('unusedCssDetector');
	const showOutput = config.get<boolean>('showOutputChannel', false);

	outputChannel.clear();
	if (showOutput) {
		outputChannel.show(true);
	}
	outputChannel.appendLine('='.repeat(60));
	outputChannel.appendLine('Unused CSS Detector - Project Scan Started');
	outputChannel.appendLine('='.repeat(60));

	diagnosticCollection.clear();

	const showNotification = config.get<boolean>('showNotification', false);

	await vscode.window.withProgress(
		{
			location: showNotification ? vscode.ProgressLocation.Notification : vscode.ProgressLocation.Window,
			title: 'Scanning Project for Unused CSS',
			cancellable: true
		},
		async (progress, token) => {
			const results = await scanner.scanProject(progress, token);

			if (token.isCancellationRequested) {
				outputChannel.appendLine('\nScan cancelled by user');
				return;
			}

			// Add problems for all files
			for (const result of results) {
				const doc = await vscode.workspace.openTextDocument(result.cssFile);
				addProblemsToPanel(result, doc);
			}

			// Show summary
			outputChannel.appendLine('\n' + '='.repeat(60));
			outputChannel.appendLine('Project Scan Complete');
			outputChannel.appendLine('='.repeat(60));
			outputChannel.appendLine(`Total CSS files scanned: ${results.length}`);

			const totalUnused = results.reduce((sum, r) => sum + r.unusedHigh + r.unusedMedium, 0);
			outputChannel.appendLine(`Total unused selectors found: ${totalUnused}`);

			const config = vscode.workspace.getConfiguration('unusedCssDetector');
			const showReport = config.get<boolean>('showReportPanel', false);

			// Auto-show report if enabled
			if (showReport) {
				resultsPanel.showMultiple(results);
			}

			vscode.window.showInformationMessage(`Found ${totalUnused} potentially unused CSS rules across ${results.length} files`, 'View Report', 'Open Problems').then(selection => {
				if (selection === 'View Report') {
					resultsPanel.showMultiple(results);
				} else if (selection === 'Open Problems') {
					vscode.commands.executeCommand('workbench.actions.view.problems');
				}
			});
		}
	);
}

function displayResults(results: any, editor: vscode.TextEditor) {
	const htmlFiles = results.htmlFiles.map((f: string) => f.split('/').pop()).join(', ');
	const jsFiles = results.jsFiles.map((f: string) => f.split('/').pop()).join(', ');

	outputChannel.appendLine('\n📊 Scan Complete');
	outputChannel.appendLine('-'.repeat(60));
	outputChannel.appendLine(`CSS File: ${results.cssFile.split('/').pop()}`);
	outputChannel.appendLine('\n🔍 Files Checked:');
	outputChannel.appendLine(`   HTML files: ${results.htmlFiles.length} (${htmlFiles || 'none'})`);
	outputChannel.appendLine(`   JavaScript/PHP files: ${results.jsFiles.length} (${jsFiles || 'none'})`);
	outputChannel.appendLine('\n📈 Results:');
	outputChannel.appendLine(`   Total CSS classes/IDs: ${results.totalSelectors}`);
	outputChannel.appendLine(`   Used: ${results.usedSelectors} ✅`);
	outputChannel.appendLine(`   Unused (High Confidence): ${results.unusedHigh} ❌`);
	outputChannel.appendLine(`   Unused (Medium Confidence): ${results.unusedMedium} ⚠️`);
	outputChannel.appendLine(`   Skipped (Pseudo-classes, etc.): ${results.skipped} ⏭️`);
	outputChannel.appendLine(`\n💾 Potential Space Savings: ~${results.estimatedLines} lines`);

	// Highlight unused CSS
	const highRanges: vscode.Range[] = [];
	const mediumRanges: vscode.Range[] = [];

	for (const detail of results.details) {
		for (const loc of detail.locations) {
			const range = new vscode.Range(new vscode.Position(loc.line - 1, loc.column), new vscode.Position(loc.line - 1, loc.column + detail.selector.length + 1));

			if (detail.confidence === 'high') {
				highRanges.push(range);
			} else {
				mediumRanges.push(range);
			}
		}
	}

	editor.setDecorations(unusedHighDecoration, highRanges);
	editor.setDecorations(unusedMediumDecoration, mediumRanges);

	// Show action buttons
	const total = results.unusedHigh + results.unusedMedium;
	if (total > 0) {
		const config = vscode.workspace.getConfiguration('unusedCssDetector');
		const showReport = config.get<boolean>('showReportPanel', false);
		const showNotification = config.get<boolean>('showNotification', false);

		// Auto-show report if enabled
		if (showReport) {
			resultsPanel.show(results);
		}

		// Only show notification if enabled
		if (showNotification) {
			vscode.window.showInformationMessage(`Found ${total} potentially unused CSS rules`, 'View Report', 'Open Problems', 'Remove High Confidence').then(selection => {
				if (selection === 'View Report') {
					resultsPanel.show(results);
				} else if (selection === 'Open Problems') {
					vscode.commands.executeCommand('workbench.actions.view.problems');
				} else if (selection === 'Remove High Confidence') {
					vscode.commands.executeCommand('unused-css-detector.removeUnusedHighConfidence');
				}
			});
		}
	}
}

function addProblemsToPanel(results: any, document: vscode.TextDocument) {
	const config = vscode.workspace.getConfiguration('unusedCssDetector');
	const showProblems = config.get<boolean>('showProblemsPanel', true);

	if (!showProblems) return;

	const severityMap = {
		error: vscode.DiagnosticSeverity.Error,
		warning: vscode.DiagnosticSeverity.Warning,
		information: vscode.DiagnosticSeverity.Information,
		hint: vscode.DiagnosticSeverity.Hint
	};

	const severity = severityMap[config.get<string>('problemSeverity', 'warning') as keyof typeof severityMap];
	const diagnostics: vscode.Diagnostic[] = [];

	for (const detail of results.details) {
		for (const loc of detail.locations) {
			const range = new vscode.Range(new vscode.Position(loc.line - 1, loc.column), new vscode.Position(loc.line - 1, loc.column + detail.selector.length + 1));

			const diagnostic = new vscode.Diagnostic(range, `Unused ${detail.type}: "${detail.selector}" - ${detail.reason}`, detail.confidence === 'high' ? severity : vscode.DiagnosticSeverity.Information);

			diagnostic.source = 'Unused CSS Detector';
			diagnostic.code = detail.confidence === 'high' ? 'unused-high' : 'unused-medium';

			diagnostics.push(diagnostic);
		}
	}

	diagnosticCollection.set(document.uri, diagnostics);
}

export function deactivate() {
	if (outputChannel) {
		outputChannel.dispose();
	}
	if (diagnosticCollection) {
		diagnosticCollection.dispose();
	}
}

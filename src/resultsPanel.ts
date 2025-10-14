import * as vscode from 'vscode';
import { ScanResults } from './scanner';

export class ResultsPanel {
	private panel: vscode.WebviewPanel | undefined;

	constructor(private extensionUri: vscode.Uri) {}

	show(results: ScanResults) {
		if (this.panel) {
			this.panel.reveal();
		} else {
			this.panel = vscode.window.createWebviewPanel('unusedCssResults', 'Unused CSS Report', vscode.ViewColumn.Two, {
				enableScripts: true,
				retainContextWhenHidden: true
			});

			this.panel.onDidDispose(() => {
				this.panel = undefined;
			});
		}

		this.panel.webview.html = this.getWebviewContent(results);
	}

	showMultiple(results: ScanResults[]) {
		if (this.panel) {
			this.panel.reveal();
		} else {
			this.panel = vscode.window.createWebviewPanel('unusedCssResults', 'Unused CSS Project Report', vscode.ViewColumn.Two, {
				enableScripts: true,
				retainContextWhenHidden: true
			});

			this.panel.onDidDispose(() => {
				this.panel = undefined;
			});
		}

		this.panel.webview.html = this.getMultipleResultsWebviewContent(results);
	}

	private getWebviewContent(results: ScanResults): string {
		const highConfidence = results.details.filter(d => d.confidence === 'high');
		const mediumConfidence = results.details.filter(d => d.confidence === 'medium');

		return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Unused CSS Report</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      padding: 20px;
      line-height: 1.6;
      color: var(--vscode-foreground);
      background-color: var(--vscode-editor-background);
    }
    h1 { color: var(--vscode-editor-foreground); margin-bottom: 10px; }
    h2 { color: var(--vscode-editor-foreground); margin-top: 30px; border-bottom: 1px solid var(--vscode-panel-border); padding-bottom: 10px; }
    .summary {
      background: var(--vscode-editor-inactiveSelectionBackground);
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
    }
    .stat {
      margin: 10px 0;
      font-size: 16px;
    }
    .stat strong { color: var(--vscode-textLink-foreground); }
    .unused-list {
      list-style: none;
      padding: 0;
    }
    .unused-item {
      background: var(--vscode-list-inactiveSelectionBackground);
      padding: 15px;
      margin: 10px 0;
      border-radius: 6px;
      border-left: 4px solid var(--vscode-textLink-foreground);
    }
    .unused-item.high {
      border-left-color: #f44336;
    }
    .unused-item.medium {
      border-left-color: #ff9800;
    }
    .selector-name {
      font-family: 'Consolas', 'Monaco', monospace;
      font-size: 18px;
      color: var(--vscode-textLink-activeForeground);
      margin-bottom: 5px;
    }
    .confidence {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: bold;
      margin-left: 10px;
    }
    .confidence.high {
      background: #f44336;
      color: white;
    }
    .confidence.medium {
      background: #ff9800;
      color: white;
    }
    .reason {
      color: var(--vscode-descriptionForeground);
      font-size: 14px;
      margin-top: 5px;
    }
    .files-checked {
      font-size: 13px;
      color: var(--vscode-descriptionForeground);
      margin-top: 10px;
    }
  </style>
</head>
<body>
  <h1>🔍 Unused CSS Report</h1>
  
  <div class="summary">
    <div class="stat"><strong>CSS File:</strong> ${results.cssFile.split('/').pop()}</div>
    <div class="stat"><strong>HTML Files Checked:</strong> ${results.htmlFiles.length}</div>
    <div class="stat"><strong>JavaScript Files Checked:</strong> ${results.jsFiles.length}</div>
    <div class="stat"><strong>Total Selectors:</strong> ${results.totalSelectors}</div>
    <div class="stat"><strong>Used Selectors:</strong> ${results.usedSelectors} ✅</div>
    <div class="stat"><strong>Unused (High Confidence):</strong> ${results.unusedHigh} ❌</div>
    <div class="stat"><strong>Unused (Medium Confidence):</strong> ${results.unusedMedium} ⚠️</div>
    <div class="stat"><strong>Skipped:</strong> ${results.skipped} ⏭️</div>
    <div class="stat"><strong>Estimated Lines Saved:</strong> ~${results.estimatedLines} lines</div>
  </div>

  ${
		highConfidence.length > 0
			? `
  <h2>High Confidence Unused (${highConfidence.length})</h2>
  <ul class="unused-list">
    ${highConfidence
		.map(
			detail => `
      <li class="unused-item high">
        <div class="selector-name">
          ${detail.type === 'class' ? '.' : '#'}${detail.selector}
          <span class="confidence high">HIGH CONFIDENCE</span>
        </div>
        <div class="reason">${detail.reason}</div>
        <div class="files-checked">
          Checked ${detail.filesChecked.htmlFiles} HTML files and ${detail.filesChecked.jsFiles} JS files
        </div>
      </li>
    `
		)
		.join('')}
  </ul>
  `
			: ''
  }

  ${
		mediumConfidence.length > 0
			? `
  <h2>Medium Confidence Unused (${mediumConfidence.length})</h2>
  <ul class="unused-list">
    ${mediumConfidence
		.map(
			detail => `
      <li class="unused-item medium">
        <div class="selector-name">
          ${detail.type === 'class' ? '.' : '#'}${detail.selector}
          <span class="confidence medium">MEDIUM CONFIDENCE</span>
        </div>
        <div class="reason">${detail.reason}</div>
        <div class="files-checked">
          Checked ${detail.filesChecked.htmlFiles} HTML files and ${detail.filesChecked.jsFiles} JS files
        </div>
      </li>
    `
		)
		.join('')}
  </ul>
  `
			: ''
  }

  ${
		results.details.length === 0
			? `
    <h2>✅ No unused CSS found!</h2>
    <p>All CSS classes and IDs in this file appear to be in use.</p>
  `
			: ''
  }
</body>
</html>`;
	}

	private getMultipleResultsWebviewContent(results: ScanResults[]): string {
		const totalUnused = results.reduce((sum, r) => sum + r.unusedHigh + r.unusedMedium, 0);
		const totalUsed = results.reduce((sum, r) => sum + r.usedSelectors, 0);
		const totalSelectors = results.reduce((sum, r) => sum + r.totalSelectors, 0);

		return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Project Unused CSS Report</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      padding: 20px;
      line-height: 1.6;
      color: var(--vscode-foreground);
      background-color: var(--vscode-editor-background);
    }
    h1 { color: var(--vscode-editor-foreground); margin-bottom: 10px; }
    h2 { color: var(--vscode-editor-foreground); margin-top: 30px; }
    .summary {
      background: var(--vscode-editor-inactiveSelectionBackground);
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
    }
    .stat {
      margin: 10px 0;
      font-size: 16px;
    }
    .stat strong { color: var(--vscode-textLink-foreground); }
    .file-result {
      background: var(--vscode-list-inactiveSelectionBackground);
      padding: 15px;
      margin: 15px 0;
      border-radius: 6px;
      border-left: 4px solid var(--vscode-textLink-foreground);
    }
    .file-name {
      font-family: 'Consolas', 'Monaco', monospace;
      font-size: 16px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    .file-stats {
      font-size: 14px;
      color: var(--vscode-descriptionForeground);
    }
  </style>
</head>
<body>
  <h1>📊 Project Unused CSS Report</h1>
  
  <div class="summary">
    <div class="stat"><strong>Total CSS Files Scanned:</strong> ${results.length}</div>
    <div class="stat"><strong>Total Selectors:</strong> ${totalSelectors}</div>
    <div class="stat"><strong>Used Selectors:</strong> ${totalUsed} ✅</div>
    <div class="stat"><strong>Unused Selectors:</strong> ${totalUnused} ❌</div>
  </div>

  <h2>Files with Unused CSS</h2>
  ${results
		.filter(r => r.unusedHigh + r.unusedMedium > 0)
		.map(
			result => `
      <div class="file-result">
        <div class="file-name">${result.cssFile.split('/').pop()}</div>
        <div class="file-stats">
          Unused: ${result.unusedHigh + result.unusedMedium} 
          (High: ${result.unusedHigh}, Medium: ${result.unusedMedium})
        </div>
      </div>
    `
		)
		.join('')}
</body>
</html>`;
	}
}

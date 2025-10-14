"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResultsPanel = void 0;
var vscode = require("vscode");
var ResultsPanel = /** @class */ (function () {
    function ResultsPanel(extensionUri) {
        this.extensionUri = extensionUri;
    }
    ResultsPanel.prototype.show = function (results) {
        var _this = this;
        if (this.panel) {
            this.panel.reveal();
        }
        else {
            this.panel = vscode.window.createWebviewPanel('unusedCssResults', 'Unused CSS Report', vscode.ViewColumn.Two, {
                enableScripts: true,
                retainContextWhenHidden: true
            });
            this.panel.onDidDispose(function () {
                _this.panel = undefined;
            });
        }
        this.panel.webview.html = this.getWebviewContent(results);
    };
    ResultsPanel.prototype.showMultiple = function (results) {
        var _this = this;
        if (this.panel) {
            this.panel.reveal();
        }
        else {
            this.panel = vscode.window.createWebviewPanel('unusedCssResults', 'Unused CSS Project Report', vscode.ViewColumn.Two, {
                enableScripts: true,
                retainContextWhenHidden: true
            });
            this.panel.onDidDispose(function () {
                _this.panel = undefined;
            });
        }
        this.panel.webview.html = this.getMultipleResultsWebviewContent(results);
    };
    ResultsPanel.prototype.getWebviewContent = function (results) {
        var highConfidence = results.details.filter(function (d) { return d.confidence === 'high'; });
        var mediumConfidence = results.details.filter(function (d) { return d.confidence === 'medium'; });
        return "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <title>Unused CSS Report</title>\n  <style>\n    body {\n      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;\n      padding: 20px;\n      line-height: 1.6;\n      color: var(--vscode-foreground);\n      background-color: var(--vscode-editor-background);\n    }\n    h1 { color: var(--vscode-editor-foreground); margin-bottom: 10px; }\n    h2 { color: var(--vscode-editor-foreground); margin-top: 30px; border-bottom: 1px solid var(--vscode-panel-border); padding-bottom: 10px; }\n    .summary {\n      background: var(--vscode-editor-inactiveSelectionBackground);\n      padding: 20px;\n      border-radius: 8px;\n      margin-bottom: 30px;\n    }\n    .stat {\n      margin: 10px 0;\n      font-size: 16px;\n    }\n    .stat strong { color: var(--vscode-textLink-foreground); }\n    .unused-list {\n      list-style: none;\n      padding: 0;\n    }\n    .unused-item {\n      background: var(--vscode-list-inactiveSelectionBackground);\n      padding: 15px;\n      margin: 10px 0;\n      border-radius: 6px;\n      border-left: 4px solid var(--vscode-textLink-foreground);\n    }\n    .unused-item.high {\n      border-left-color: #f44336;\n    }\n    .unused-item.medium {\n      border-left-color: #ff9800;\n    }\n    .selector-name {\n      font-family: 'Consolas', 'Monaco', monospace;\n      font-size: 18px;\n      color: var(--vscode-textLink-activeForeground);\n      margin-bottom: 5px;\n    }\n    .confidence {\n      display: inline-block;\n      padding: 4px 8px;\n      border-radius: 4px;\n      font-size: 12px;\n      font-weight: bold;\n      margin-left: 10px;\n    }\n    .confidence.high {\n      background: #f44336;\n      color: white;\n    }\n    .confidence.medium {\n      background: #ff9800;\n      color: white;\n    }\n    .reason {\n      color: var(--vscode-descriptionForeground);\n      font-size: 14px;\n      margin-top: 5px;\n    }\n    .files-checked {\n      font-size: 13px;\n      color: var(--vscode-descriptionForeground);\n      margin-top: 10px;\n    }\n  </style>\n</head>\n<body>\n  <h1>\uD83D\uDD0D Unused CSS Report</h1>\n  \n  <div class=\"summary\">\n    <div class=\"stat\"><strong>CSS File:</strong> ".concat(results.cssFile.split('/').pop(), "</div>\n    <div class=\"stat\"><strong>HTML Files Checked:</strong> ").concat(results.htmlFiles.length, "</div>\n    <div class=\"stat\"><strong>JavaScript Files Checked:</strong> ").concat(results.jsFiles.length, "</div>\n    <div class=\"stat\"><strong>Total Selectors:</strong> ").concat(results.totalSelectors, "</div>\n    <div class=\"stat\"><strong>Used Selectors:</strong> ").concat(results.usedSelectors, " \u2705</div>\n    <div class=\"stat\"><strong>Unused (High Confidence):</strong> ").concat(results.unusedHigh, " \u274C</div>\n    <div class=\"stat\"><strong>Unused (Medium Confidence):</strong> ").concat(results.unusedMedium, " \u26A0\uFE0F</div>\n    <div class=\"stat\"><strong>Skipped:</strong> ").concat(results.skipped, " \u23ED\uFE0F</div>\n    <div class=\"stat\"><strong>Estimated Lines Saved:</strong> ~").concat(results.estimatedLines, " lines</div>\n  </div>\n\n  ").concat(highConfidence.length > 0
            ? "\n  <h2>High Confidence Unused (".concat(highConfidence.length, ")</h2>\n  <ul class=\"unused-list\">\n    ").concat(highConfidence
                .map(function (detail) { return "\n      <li class=\"unused-item high\">\n        <div class=\"selector-name\">\n          ".concat(detail.type === 'class' ? '.' : '#').concat(detail.selector, "\n          <span class=\"confidence high\">HIGH CONFIDENCE</span>\n        </div>\n        <div class=\"reason\">").concat(detail.reason, "</div>\n        <div class=\"files-checked\">\n          Checked ").concat(detail.filesChecked.htmlFiles, " HTML files and ").concat(detail.filesChecked.jsFiles, " JS files\n        </div>\n      </li>\n    "); })
                .join(''), "\n  </ul>\n  ")
            : '', "\n\n  ").concat(mediumConfidence.length > 0
            ? "\n  <h2>Medium Confidence Unused (".concat(mediumConfidence.length, ")</h2>\n  <ul class=\"unused-list\">\n    ").concat(mediumConfidence
                .map(function (detail) { return "\n      <li class=\"unused-item medium\">\n        <div class=\"selector-name\">\n          ".concat(detail.type === 'class' ? '.' : '#').concat(detail.selector, "\n          <span class=\"confidence medium\">MEDIUM CONFIDENCE</span>\n        </div>\n        <div class=\"reason\">").concat(detail.reason, "</div>\n        <div class=\"files-checked\">\n          Checked ").concat(detail.filesChecked.htmlFiles, " HTML files and ").concat(detail.filesChecked.jsFiles, " JS files\n        </div>\n      </li>\n    "); })
                .join(''), "\n  </ul>\n  ")
            : '', "\n\n  ").concat(results.details.length === 0
            ? "\n    <h2>\u2705 No unused CSS found!</h2>\n    <p>All CSS classes and IDs in this file appear to be in use.</p>\n  "
            : '', "\n</body>\n</html>");
    };
    ResultsPanel.prototype.getMultipleResultsWebviewContent = function (results) {
        var totalUnused = results.reduce(function (sum, r) { return sum + r.unusedHigh + r.unusedMedium; }, 0);
        var totalUsed = results.reduce(function (sum, r) { return sum + r.usedSelectors; }, 0);
        var totalSelectors = results.reduce(function (sum, r) { return sum + r.totalSelectors; }, 0);
        return "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <title>Project Unused CSS Report</title>\n  <style>\n    body {\n      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;\n      padding: 20px;\n      line-height: 1.6;\n      color: var(--vscode-foreground);\n      background-color: var(--vscode-editor-background);\n    }\n    h1 { color: var(--vscode-editor-foreground); margin-bottom: 10px; }\n    h2 { color: var(--vscode-editor-foreground); margin-top: 30px; }\n    .summary {\n      background: var(--vscode-editor-inactiveSelectionBackground);\n      padding: 20px;\n      border-radius: 8px;\n      margin-bottom: 30px;\n    }\n    .stat {\n      margin: 10px 0;\n      font-size: 16px;\n    }\n    .stat strong { color: var(--vscode-textLink-foreground); }\n    .file-result {\n      background: var(--vscode-list-inactiveSelectionBackground);\n      padding: 15px;\n      margin: 15px 0;\n      border-radius: 6px;\n      border-left: 4px solid var(--vscode-textLink-foreground);\n    }\n    .file-name {\n      font-family: 'Consolas', 'Monaco', monospace;\n      font-size: 16px;\n      font-weight: bold;\n      margin-bottom: 10px;\n    }\n    .file-stats {\n      font-size: 14px;\n      color: var(--vscode-descriptionForeground);\n    }\n  </style>\n</head>\n<body>\n  <h1>\uD83D\uDCCA Project Unused CSS Report</h1>\n  \n  <div class=\"summary\">\n    <div class=\"stat\"><strong>Total CSS Files Scanned:</strong> ".concat(results.length, "</div>\n    <div class=\"stat\"><strong>Total Selectors:</strong> ").concat(totalSelectors, "</div>\n    <div class=\"stat\"><strong>Used Selectors:</strong> ").concat(totalUsed, " \u2705</div>\n    <div class=\"stat\"><strong>Unused Selectors:</strong> ").concat(totalUnused, " \u274C</div>\n  </div>\n\n  <h2>Files with Unused CSS</h2>\n  ").concat(results
            .filter(function (r) { return r.unusedHigh + r.unusedMedium > 0; })
            .map(function (result) { return "\n      <div class=\"file-result\">\n        <div class=\"file-name\">".concat(result.cssFile.split('/').pop(), "</div>\n        <div class=\"file-stats\">\n          Unused: ").concat(result.unusedHigh + result.unusedMedium, " \n          (High: ").concat(result.unusedHigh, ", Medium: ").concat(result.unusedMedium, ")\n        </div>\n      </div>\n    "); })
            .join(''), "\n</body>\n</html>");
    };
    return ResultsPanel;
}());
exports.ResultsPanel = ResultsPanel;

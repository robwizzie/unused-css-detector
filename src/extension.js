'use strict';
var __awaiter =
    (this && this.__awaiter) ||
    function(thisArg, _arguments, P, generator) {
        function adopt(value) {
            return value instanceof P ?
                value :
                new P(function(resolve) {
                    resolve(value);
                });
        }
        return new(P || (P = Promise))(function(resolve, reject) {
            function fulfilled(value) {
                try {
                    step(generator.next(value));
                } catch (e) {
                    reject(e);
                }
            }

            function rejected(value) {
                try {
                    step(generator['throw'](value));
                } catch (e) {
                    reject(e);
                }
            }

            function step(result) {
                result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
            }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };
var __generator =
    (this && this.__generator) ||
    function(thisArg, body) {
        var _ = {
                label: 0,
                sent: function() {
                    if (t[0] & 1) throw t[1];
                    return t[1];
                },
                trys: [],
                ops: []
            },
            f,
            y,
            t,
            g = Object.create((typeof Iterator === 'function' ? Iterator : Object).prototype);
        return (
            (g.next = verb(0)),
            (g['throw'] = verb(1)),
            (g['return'] = verb(2)),
            typeof Symbol === 'function' &&
            (g[Symbol.iterator] = function() {
                return this;
            }),
            g
        );

        function verb(n) {
            return function(v) {
                return step([n, v]);
            };
        }

        function step(op) {
            if (f) throw new TypeError('Generator is already executing.');
            while ((g && ((g = 0), op[0] && (_ = 0)), _))
                try {
                    if (((f = 1), y && (t = op[0] & 2 ? y['return'] : op[0] ? y['throw'] || ((t = y['return']) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done)) return t;
                    if (((y = 0), t)) op = [op[0] & 2, t.value];
                    switch (op[0]) {
                        case 0:
                        case 1:
                            t = op;
                            break;
                        case 4:
                            _.label++;
                            return { value: op[1], done: false };
                        case 5:
                            _.label++;
                            y = op[1];
                            op = [0];
                            continue;
                        case 7:
                            op = _.ops.pop();
                            _.trys.pop();
                            continue;
                        default:
                            if (!((t = _.trys), (t = t.length > 0 && t[t.length - 1])) && (op[0] === 6 || op[0] === 2)) {
                                _ = 0;
                                continue;
                            }
                            if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                                _.label = op[1];
                                break;
                            }
                            if (op[0] === 6 && _.label < t[1]) {
                                _.label = t[1];
                                t = op;
                                break;
                            }
                            if (t && _.label < t[2]) {
                                _.label = t[2];
                                _.ops.push(op);
                                break;
                            }
                            if (t[2]) _.ops.pop();
                            _.trys.pop();
                            continue;
                    }
                    op = body.call(thisArg, _);
                } catch (e) {
                    op = [6, e];
                    y = 0;
                } finally {
                    f = t = 0;
                }
            if (op[0] & 5) throw op[1];
            return { value: op[0] ? op[1] : void 0, done: true };
        }
    };
Object.defineProperty(exports, '__esModule', { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
var vscode = require('vscode');
var scanner_1 = require('./scanner');
var resultsPanel_1 = require('./resultsPanel');
var remover_1 = require('./remover');
var outputChannel;
var scanner;
var resultsPanel;
var remover;
var diagnosticCollection;
// Decoration types
var unusedHighDecoration = vscode.window.createTextEditorDecorationType({
    backgroundColor: 'rgba(255, 0, 0, 0.3)',
    border: '1px solid red',
    overviewRulerColor: 'red',
    overviewRulerLane: vscode.OverviewRulerLane.Right
});
var unusedMediumDecoration = vscode.window.createTextEditorDecorationType({
    backgroundColor: 'rgba(255, 165, 0, 0.2)',
    border: '1px solid orange',
    overviewRulerColor: 'orange',
    overviewRulerLane: vscode.OverviewRulerLane.Right
});

function activate(context) {
    var _this = this;
    outputChannel = vscode.window.createOutputChannel('Unused CSS Detector');
    scanner = new scanner_1.CSSScanner(outputChannel);
    resultsPanel = new resultsPanel_1.ResultsPanel(context.extensionUri);
    remover = new remover_1.CSSRemover(outputChannel);
    // Create diagnostic collection for Problems panel
    diagnosticCollection = vscode.languages.createDiagnosticCollection('unused-css');
    // Command: Scan Current File
    var scanCurrentFile = vscode.commands.registerCommand('unused-css-detector.scanCurrentFile', function() {
        return __awaiter(_this, void 0, void 0, function() {
            var editor, config, cssFileTypes, fileExt;
            var _a;
            return __generator(this, function(_b) {
                switch (_b.label) {
                    case 0:
                        editor = vscode.window.activeTextEditor;
                        if (!editor) {
                            vscode.window.showErrorMessage('No active editor');
                            return [2 /*return*/ ];
                        }
                        config = vscode.workspace.getConfiguration('unusedCssDetector');
                        cssFileTypes = config.get('cssFileTypes', ['css', 'scss', 'sass', 'less']);
                        fileExt = (_a = editor.document.fileName.split('.').pop()) === null || _a === void 0 ? void 0 : _a.toLowerCase();
                        if (!cssFileTypes.includes(fileExt || '')) {
                            vscode.window.showErrorMessage('Please open a CSS file ('.concat(cssFileTypes.join(', '), ')'));
                            return [2 /*return*/ ];
                        }
                        return [4 /*yield*/ , scanFile(editor)];
                    case 1:
                        _b.sent();
                        return [2 /*return*/ ];
                }
            });
        });
    });
    // Command: Scan Project
    var scanProject = vscode.commands.registerCommand('unused-css-detector.scanProject', function() {
        return __awaiter(_this, void 0, void 0, function() {
            return __generator(this, function(_a) {
                switch (_a.label) {
                    case 0:
                        return [4 /*yield*/ , scanEntireProject()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/ ];
                }
            });
        });
    });
    // Command: Remove Unused (Preview)
    var removeUnusedPreview = vscode.commands.registerCommand('unused-css-detector.removeUnusedPreview', function() {
        return __awaiter(_this, void 0, void 0, function() {
            return __generator(this, function(_a) {
                switch (_a.label) {
                    case 0:
                        return [4 /*yield*/ , remover.removeUnusedWithPreview(scanner.getLastResults())];
                    case 1:
                        _a.sent();
                        return [2 /*return*/ ];
                }
            });
        });
    });
    // Command: Remove High Confidence
    var removeUnusedHighConfidence = vscode.commands.registerCommand('unused-css-detector.removeUnusedHighConfidence', function() {
        return __awaiter(_this, void 0, void 0, function() {
            return __generator(this, function(_a) {
                switch (_a.label) {
                    case 0:
                        return [4 /*yield*/ , remover.removeHighConfidenceUnused(scanner.getLastResults())];
                    case 1:
                        _a.sent();
                        return [2 /*return*/ ];
                }
            });
        });
    });
    // Command: Show Report
    var showReport = vscode.commands.registerCommand('unused-css-detector.showReport', function() {
        return __awaiter(_this, void 0, void 0, function() {
            var results;
            return __generator(this, function(_a) {
                results = scanner.getLastResults();
                if (results) {
                    resultsPanel.show(results);
                } else {
                    vscode.window.showInformationMessage('No scan results available. Run a scan first.');
                }
                return [2 /*return*/ ];
            });
        });
    });
    // Command: Clear Cache
    var clearCache = vscode.commands.registerCommand('unused-css-detector.clearCache', function() {
        scanner.clearCache();
        diagnosticCollection.clear();
        vscode.window.showInformationMessage('Cache cleared');
    });
    // Auto-scan on save (if enabled)
    var onSaveListener = vscode.workspace.onDidSaveTextDocument(function(document) {
        return __awaiter(_this, void 0, void 0, function() {
            var config, autoScan, cssFileTypes, fileExt, editor;
            var _a;
            return __generator(this, function(_b) {
                switch (_b.label) {
                    case 0:
                        config = vscode.workspace.getConfiguration('unusedCssDetector');
                        autoScan = config.get('autoScanOnSave', false);
                        if (!autoScan) return [2 /*return*/ ];
                        cssFileTypes = config.get('cssFileTypes', ['css', 'scss', 'sass', 'less']);
                        fileExt = (_a = document.fileName.split('.').pop()) === null || _a === void 0 ? void 0 : _a.toLowerCase();
                        if (!cssFileTypes.includes(fileExt || '')) return [3 /*break*/ , 2];
                        editor = vscode.window.activeTextEditor;
                        if (!(editor && editor.document === document)) return [3 /*break*/ , 2];
                        return [4 /*yield*/ , scanFile(editor)];
                    case 1:
                        _b.sent();
                        _b.label = 2;
                    case 2:
                        return [2 /*return*/ ];
                }
            });
        });
    });
    context.subscriptions.push(scanCurrentFile, scanProject, removeUnusedPreview, removeUnusedHighConfidence, showReport, clearCache, diagnosticCollection, onSaveListener, outputChannel);
    // Register hover provider
    var hoverProvider = vscode.languages.registerHoverProvider(['css', 'scss', 'sass', 'less'], {
        provideHover: function(document, position) {
            var results = scanner.getLastResults();
            if (!results) return;
            var range = document.getWordRangeAtPosition(position, /[\.\#][a-zA-Z0-9_-]+/);
            if (!range) return;
            var selector = document.getText(range);
            var detail = results.details.find(function(d) {
                return '.'.concat(d.selector) === selector || '#'.concat(d.selector) === selector;
            });
            if (detail) {
                var md = new vscode.MarkdownString();
                md.appendMarkdown('### \u26A0\uFE0F Potentially Unused '.concat(detail.type === 'class' ? 'Class' : 'ID', '\n\n'));
                md.appendMarkdown('**Confidence:** '.concat(detail.confidence, '\n\n'));
                md.appendMarkdown('**Files Checked:**\n');
                md.appendMarkdown('- '.concat(detail.filesChecked.htmlFiles, ' HTML files\n'));
                md.appendMarkdown('- '.concat(detail.filesChecked.jsFiles, ' JavaScript/PHP files\n\n'));
                md.appendMarkdown('**Reason:** '.concat(detail.reason, '\n\n'));
                return new vscode.Hover(md);
            }
        }
    });
    context.subscriptions.push(hoverProvider);
}

function scanFile(editor) {
    return __awaiter(this, void 0, void 0, function() {
        var cssFilePath;
        var _this = this;
        return __generator(this, function(_a) {
            switch (_a.label) {
                case 0:
                    cssFilePath = editor.document.uri.fsPath;
                    outputChannel.clear();
                    outputChannel.show(true);
                    outputChannel.appendLine('='.repeat(60));
                    outputChannel.appendLine('Unused CSS Detector - Scan Started');
                    outputChannel.appendLine('='.repeat(60));
                    return [
                        4 /*yield*/ ,
                        vscode.window.withProgress({
                                location: vscode.ProgressLocation.Notification,
                                title: 'Finding Unused CSS',
                                cancellable: true
                            },
                            function(progress, token) {
                                return __awaiter(_this, void 0, void 0, function() {
                                    var results;
                                    return __generator(this, function(_a) {
                                        switch (_a.label) {
                                            case 0:
                                                return [4 /*yield*/ , scanner.scanCSSFile(cssFilePath, progress, token)];
                                            case 1:
                                                results = _a.sent();
                                                if (token.isCancellationRequested) {
                                                    outputChannel.appendLine('\nScan cancelled by user');
                                                    return [2 /*return*/ ];
                                                }
                                                displayResults(results, editor);
                                                addProblemsToPanel(results, editor.document);
                                                return [2 /*return*/ ];
                                        }
                                    });
                                });
                            }
                        )
                    ];
                case 1:
                    _a.sent();
                    return [2 /*return*/ ];
            }
        });
    });
}

function scanEntireProject() {
    return __awaiter(this, void 0, void 0, function() {
        var _this = this;
        return __generator(this, function(_a) {
            switch (_a.label) {
                case 0:
                    outputChannel.clear();
                    outputChannel.show(true);
                    outputChannel.appendLine('='.repeat(60));
                    outputChannel.appendLine('Unused CSS Detector - Project Scan Started');
                    outputChannel.appendLine('='.repeat(60));
                    diagnosticCollection.clear();
                    return [
                        4 /*yield*/ ,
                        vscode.window.withProgress({
                                location: vscode.ProgressLocation.Notification,
                                title: 'Scanning Project for Unused CSS',
                                cancellable: true
                            },
                            function(progress, token) {
                                return __awaiter(_this, void 0, void 0, function() {
                                    var results, _i, results_1, result, doc, totalUnused;
                                    return __generator(this, function(_a) {
                                        switch (_a.label) {
                                            case 0:
                                                return [4 /*yield*/ , scanner.scanProject(progress, token)];
                                            case 1:
                                                results = _a.sent();
                                                if (token.isCancellationRequested) {
                                                    outputChannel.appendLine('\nScan cancelled by user');
                                                    return [2 /*return*/ ];
                                                }
                                                (_i = 0), (results_1 = results);
                                                _a.label = 2;
                                            case 2:
                                                if (!(_i < results_1.length)) return [3 /*break*/ , 5];
                                                result = results_1[_i];
                                                return [4 /*yield*/ , vscode.workspace.openTextDocument(result.cssFile)];
                                            case 3:
                                                doc = _a.sent();
                                                addProblemsToPanel(result, doc);
                                                _a.label = 4;
                                            case 4:
                                                _i++;
                                                return [3 /*break*/ , 2];
                                            case 5:
                                                // Show summary
                                                outputChannel.appendLine('\n' + '='.repeat(60));
                                                outputChannel.appendLine('Project Scan Complete');
                                                outputChannel.appendLine('='.repeat(60));
                                                outputChannel.appendLine('Total CSS files scanned: '.concat(results.length));
                                                totalUnused = results.reduce(function(sum, r) {
                                                    return sum + r.unusedHigh + r.unusedMedium;
                                                }, 0);
                                                outputChannel.appendLine('Total unused selectors found: '.concat(totalUnused));
                                                const showNotification = config.get < boolean > ('showNotification', false);

                                                if (showNotification) {
                                                    vscode.window.showInformationMessage(`Found ${totalUnused} potentially unused CSS rules across ${results.length} files`, 'View Report', 'Open Problems').then(selection => {
                                                        if (selection === 'View Report') {
                                                            resultsPanel.showMultiple(results);
                                                        } else if (selection === 'Open Problems') {
                                                            vscode.commands.executeCommand('workbench.actions.view.problems');
                                                        }
                                                    });
                                                }
                                                return [2 /*return*/ ];
                                        }
                                    });
                                });
                            }
                        )
                    ];
                case 1:
                    _a.sent();
                    return [2 /*return*/ ];
            }
        });
    });
}

function displayResults(results, editor) {
    var htmlFiles = results.htmlFiles
        .map(function(f) {
            return f.split('/').pop();
        })
        .join(', ');
    var jsFiles = results.jsFiles
        .map(function(f) {
            return f.split('/').pop();
        })
        .join(', ');
    outputChannel.appendLine('\n📊 Scan Complete');
    outputChannel.appendLine('-'.repeat(60));
    outputChannel.appendLine('CSS File: '.concat(results.cssFile.split('/').pop()));
    outputChannel.appendLine('\n🔍 Files Checked:');
    outputChannel.appendLine('   HTML files: '.concat(results.htmlFiles.length, ' (').concat(htmlFiles || 'none', ')'));
    outputChannel.appendLine('   JavaScript/PHP files: '.concat(results.jsFiles.length, ' (').concat(jsFiles || 'none', ')'));
    outputChannel.appendLine('\n📈 Results:');
    outputChannel.appendLine('   Total CSS classes/IDs: '.concat(results.totalSelectors));
    outputChannel.appendLine('   Used: '.concat(results.usedSelectors, ' \u2705'));
    outputChannel.appendLine('   Unused (High Confidence): '.concat(results.unusedHigh, ' \u274C'));
    outputChannel.appendLine('   Unused (Medium Confidence): '.concat(results.unusedMedium, ' \u26A0\uFE0F'));
    outputChannel.appendLine('   Skipped (Pseudo-classes, etc.): '.concat(results.skipped, ' \u23ED\uFE0F'));
    outputChannel.appendLine('\n\uD83D\uDCBE Potential Space Savings: ~'.concat(results.estimatedLines, ' lines'));
    // Highlight unused CSS
    var highRanges = [];
    var mediumRanges = [];
    for (var _i = 0, _a = results.details; _i < _a.length; _i++) {
        var detail = _a[_i];
        for (var _b = 0, _c = detail.locations; _b < _c.length; _b++) {
            var loc = _c[_b];
            var range = new vscode.Range(new vscode.Position(loc.line - 1, loc.column), new vscode.Position(loc.line - 1, loc.column + detail.selector.length + 1));
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
    var total = results.unusedHigh + results.unusedMedium;
    if (total > 0) {
        vscode.window.showInformationMessage('Found '.concat(total, ' potentially unused CSS rules'), 'View Report', 'Open Problems', 'Remove High Confidence').then(function(selection) {
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

function addProblemsToPanel(results, document) {
    var config = vscode.workspace.getConfiguration('unusedCssDetector');
    var showProblems = config.get('showProblemsPanel', true);
    if (!showProblems) return;
    var severityMap = {
        error: vscode.DiagnosticSeverity.Error,
        warning: vscode.DiagnosticSeverity.Warning,
        information: vscode.DiagnosticSeverity.Information,
        hint: vscode.DiagnosticSeverity.Hint
    };
    var severity = severityMap[config.get('problemSeverity', 'warning')];
    var diagnostics = [];
    for (var _i = 0, _a = results.details; _i < _a.length; _i++) {
        var detail = _a[_i];
        for (var _b = 0, _c = detail.locations; _b < _c.length; _b++) {
            var loc = _c[_b];
            var range = new vscode.Range(new vscode.Position(loc.line - 1, loc.column), new vscode.Position(loc.line - 1, loc.column + detail.selector.length + 1));
            var diagnostic = new vscode.Diagnostic(range, 'Unused '.concat(detail.type, ': "').concat(detail.selector, '" - ').concat(detail.reason), detail.confidence === 'high' ? severity : vscode.DiagnosticSeverity.Information);
            diagnostic.source = 'Unused CSS Detector';
            diagnostic.code = detail.confidence === 'high' ? 'unused-high' : 'unused-medium';
            diagnostics.push(diagnostic);
        }
    }
    diagnosticCollection.set(document.uri, diagnostics);
}

function deactivate() {
    if (outputChannel) {
        outputChannel.dispose();
    }
    if (diagnosticCollection) {
        diagnosticCollection.dispose();
    }
}
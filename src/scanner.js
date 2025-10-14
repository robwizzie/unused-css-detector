"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CSSScanner = void 0;
// ============================================================================
// FILE: src/scanner.ts (COMPLETE & FIXED)
// ============================================================================
var vscode = require("vscode");
var fs = require("fs");
var path = require("path");
var CSSScanner = /** @class */ (function () {
    function CSSScanner(outputChannel) {
        this.outputChannel = outputChannel;
        this.lastResults = null;
        this.cache = new Map();
        this.dynamicPatterns = new Set();
    }
    CSSScanner.prototype.scanCSSFile = function (cssFilePath, progress, token) {
        return __awaiter(this, void 0, void 0, function () {
            var config, scanMode, fallback, cssContent, selectors, cssFileName, htmlFiles, jsFiles, _a, results, _i, selectors_1, selector, usage, detail;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        config = vscode.workspace.getConfiguration('unusedCssDetector');
                        scanMode = config.get('scanMode', 'linked-files-only');
                        fallback = config.get('fallbackToAllFiles', true);
                        progress.report({ increment: 0, message: 'Step 1/4: Analyzing CSS file...' });
                        return [4 /*yield*/, fs.promises.readFile(cssFilePath, 'utf8')];
                    case 1:
                        cssContent = _b.sent();
                        selectors = this.extractSelectorsFromCSS(cssContent, cssFilePath);
                        this.outputChannel.appendLine("\nFound ".concat(selectors.length, " selectors in CSS file"));
                        if (token.isCancellationRequested)
                            return [2 /*return*/, this.createEmptyResults(cssFilePath)];
                        progress.report({ increment: 25, message: 'Step 2/4: Finding linked HTML files...' });
                        cssFileName = path.basename(cssFilePath);
                        htmlFiles = [];
                        if (!(scanMode === 'linked-files-only')) return [3 /*break*/, 5];
                        return [4 /*yield*/, this.findHTMLFilesLinkingToCSS(cssFileName)];
                    case 2:
                        htmlFiles = _b.sent();
                        this.outputChannel.appendLine("Found ".concat(htmlFiles.length, " HTML files linking to ").concat(cssFileName));
                        if (!(htmlFiles.length === 0 && fallback)) return [3 /*break*/, 4];
                        this.outputChannel.appendLine('No HTML files link to this CSS. Falling back to all HTML files...');
                        return [4 /*yield*/, this.findAllHTMLFiles()];
                    case 3:
                        htmlFiles = _b.sent();
                        _b.label = 4;
                    case 4: return [3 /*break*/, 7];
                    case 5: return [4 /*yield*/, this.findAllHTMLFiles()];
                    case 6:
                        htmlFiles = _b.sent();
                        _b.label = 7;
                    case 7:
                        if (token.isCancellationRequested)
                            return [2 /*return*/, this.createEmptyResults(cssFilePath)];
                        progress.report({ increment: 50, message: 'Step 3/4: Finding linked JavaScript files...' });
                        return [4 /*yield*/, this.findJSFilesFromHTML(htmlFiles)];
                    case 8:
                        jsFiles = _b.sent();
                        this.outputChannel.appendLine("Found ".concat(jsFiles.length, " JavaScript files"));
                        if (token.isCancellationRequested)
                            return [2 /*return*/, this.createEmptyResults(cssFilePath)];
                        progress.report({ increment: 75, message: 'Step 4/4: Checking CSS usage...' });
                        // Detect dynamic patterns
                        _a = this;
                        return [4 /*yield*/, this.detectDynamicPatterns(jsFiles)];
                    case 9:
                        // Detect dynamic patterns
                        _a.dynamicPatterns = _b.sent();
                        if (this.dynamicPatterns.size > 0) {
                            this.outputChannel.appendLine("Detected ".concat(this.dynamicPatterns.size, " dynamic class patterns"));
                        }
                        results = {
                            cssFile: cssFilePath,
                            htmlFiles: htmlFiles,
                            jsFiles: jsFiles,
                            totalSelectors: selectors.length,
                            usedSelectors: 0,
                            unusedHigh: 0,
                            unusedMedium: 0,
                            skipped: 0,
                            estimatedLines: 0,
                            details: []
                        };
                        _i = 0, selectors_1 = selectors;
                        _b.label = 10;
                    case 10:
                        if (!(_i < selectors_1.length)) return [3 /*break*/, 13];
                        selector = selectors_1[_i];
                        if (token.isCancellationRequested)
                            return [3 /*break*/, 13];
                        if (this.shouldSkipSelector(selector)) {
                            results.skipped++;
                            return [3 /*break*/, 12];
                        }
                        return [4 /*yield*/, this.checkSelectorUsage(selector, htmlFiles, jsFiles)];
                    case 11:
                        usage = _b.sent();
                        if (usage.found) {
                            results.usedSelectors++;
                        }
                        else {
                            detail = {
                                selector: selector.name,
                                type: selector.type,
                                confidence: usage.confidence,
                                reason: usage.reason,
                                locations: [
                                    {
                                        file: cssFilePath,
                                        line: selector.line,
                                        column: selector.column
                                    }
                                ],
                                filesChecked: {
                                    htmlFiles: htmlFiles.length,
                                    jsFiles: jsFiles.length
                                }
                            };
                            results.details.push(detail);
                            if (usage.confidence === 'high') {
                                results.unusedHigh++;
                            }
                            else {
                                results.unusedMedium++;
                            }
                        }
                        _b.label = 12;
                    case 12:
                        _i++;
                        return [3 /*break*/, 10];
                    case 13:
                        results.estimatedLines = this.estimateLinesSaved(results.details, cssContent);
                        this.lastResults = results;
                        return [2 /*return*/, results];
                }
            });
        });
    };
    CSSScanner.prototype.scanProject = function (progress, token) {
        return __awaiter(this, void 0, void 0, function () {
            var cssFiles, results, i, percent, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.findAllCSSFiles()];
                    case 1:
                        cssFiles = _a.sent();
                        results = [];
                        i = 0;
                        _a.label = 2;
                    case 2:
                        if (!(i < cssFiles.length)) return [3 /*break*/, 5];
                        if (token.isCancellationRequested)
                            return [3 /*break*/, 5];
                        percent = Math.floor((i / cssFiles.length) * 100);
                        progress.report({
                            increment: percent - (i > 0 ? Math.floor(((i - 1) / cssFiles.length) * 100) : 0),
                            message: "Scanning ".concat(path.basename(cssFiles[i]), " (").concat(i + 1, "/").concat(cssFiles.length, ")...")
                        });
                        return [4 /*yield*/, this.scanCSSFile(cssFiles[i], progress, token)];
                    case 3:
                        result = _a.sent();
                        results.push(result);
                        _a.label = 4;
                    case 4:
                        i++;
                        return [3 /*break*/, 2];
                    case 5: return [2 /*return*/, results];
                }
            });
        });
    };
    CSSScanner.prototype.extractSelectorsFromCSS = function (cssContent, filePath) {
        var selectors = [];
        // Remove comments
        cssContent = cssContent.replace(/\/\*[\s\S]*?\*\//g, '');
        // Remove @keyframes
        cssContent = cssContent.replace(/@keyframes[^{]+\{(?:[^{}]|\{[^{}]*\})*\}/g, '');
        var lines = cssContent.split('\n');
        for (var lineNum = 0; lineNum < lines.length; lineNum++) {
            var line = lines[lineNum];
            // Match class selectors
            var classRegex = /\.([a-zA-Z0-9_-]+)/g;
            var match = void 0;
            while ((match = classRegex.exec(line)) !== null) {
                var className = match[1];
                var column = match.index;
                // Check if it's followed by a pseudo-class or pseudo-element
                var restOfLine = line.substring(match.index + match[0].length);
                if (restOfLine.match(/^(::|:)/)) {
                    continue;
                }
                selectors.push({
                    name: className,
                    type: 'class',
                    line: lineNum + 1,
                    column: column,
                    fullSelector: match[0]
                });
            }
            // Match ID selectors
            var idRegex = /#([a-zA-Z0-9_-]+)/g;
            while ((match = idRegex.exec(line)) !== null) {
                var idName = match[1];
                var column = match.index;
                var restOfLine = line.substring(match.index + match[0].length);
                if (restOfLine.match(/^(::|:)/)) {
                    continue;
                }
                selectors.push({
                    name: idName,
                    type: 'id',
                    line: lineNum + 1,
                    column: column,
                    fullSelector: match[0]
                });
            }
        }
        // Remove duplicates
        var unique = new Map();
        for (var _i = 0, selectors_2 = selectors; _i < selectors_2.length; _i++) {
            var sel = selectors_2[_i];
            var key = "".concat(sel.type, "-").concat(sel.name);
            if (!unique.has(key)) {
                unique.set(key, sel);
            }
        }
        return Array.from(unique.values());
    };
    CSSScanner.prototype.shouldSkipSelector = function (selector) {
        var config = vscode.workspace.getConfiguration('unusedCssDetector');
        var ignorePrefixes = config.get('ignorePrefixes', []);
        var ignoreUtility = config.get('ignoreUtilityFrameworks', true);
        var tailwindSupport = config.get('tailwindSupport', true);
        // Check ignore prefixes
        for (var _i = 0, ignorePrefixes_1 = ignorePrefixes; _i < ignorePrefixes_1.length; _i++) {
            var prefix = ignorePrefixes_1[_i];
            if (selector.name.startsWith(prefix.replace(/\*$/, ''))) {
                return true;
            }
        }
        // Tailwind and utility framework support
        if (ignoreUtility && tailwindSupport) {
            // Common Tailwind patterns
            var tailwindPatterns = [/^(sm|md|lg|xl|2xl):/, /^(hover|focus|active|disabled|group-hover|group-focus):/, /^(dark|light):/, /^(container|mx-auto|flex|grid|block|inline|hidden)/, /^[mp][xytblr]?-\d+$/, /^w-\d+$/, /^h-\d+$/, /^text-(xs|sm|base|lg|xl|\d+xl|center|left|right)/, /^bg-\w+(-\d+)?$/, /^border(-\w+)?(-\d+)?$/, /^rounded(-\w+)?$/, /^shadow(-\w+)?$/, /^opacity-\d+$/, /^z-\d+$/, /^gap-\d+$/, /^space-[xy]-\d+$/, /^divide-\w+$/, /^ring(-\w+)?(-\d+)?$/, /^transition(-\w+)?$/, /^duration-\d+$/, /^ease-\w+$/];
            if (tailwindPatterns.some(function (pattern) { return pattern.test(selector.name); })) {
                return true;
            }
        }
        // Bootstrap patterns
        if (ignoreUtility) {
            var bootstrapPatterns = [/^col(-\w+)?(-\d+)?$/, /^row$/, /^container(-fluid)?$/, /^btn(-\w+)?$/, /^alert(-\w+)?$/, /^badge(-\w+)?$/, /^card(-\w+)?$/, /^nav(-\w+)?$/, /^navbar(-\w+)?$/, /^modal(-\w+)?$/, /^dropdown(-\w+)?$/, /^form(-\w+)?$/, /^input(-\w+)?$/, /^[mp][xytblr]?-\d+$/, /^[dw]-\d+$/, /^text-(primary|secondary|success|danger|warning|info|light|dark|muted)$/, /^bg-(primary|secondary|success|danger|warning|info|light|dark)$/, /^border(-\w+)?$/, /^rounded(-\w+)?$/, /^shadow(-\w+)?$/, /^d-(none|inline|inline-block|block|flex|inline-flex)$/, /^justify-content-\w+$/, /^align-items-\w+$/, /^float-\w+$/, /^clearfix$/, /^fade$/, /^show$/, /^collapse$/, /^collapsing$/];
            if (bootstrapPatterns.some(function (pattern) { return pattern.test(selector.name); })) {
                return true;
            }
        }
        return false;
    };
    CSSScanner.prototype.checkSelectorUsage = function (selector, htmlFiles, jsFiles) {
        return __awaiter(this, void 0, void 0, function () {
            var config, detectDynamic, _i, htmlFiles_1, htmlFile, cacheKey, content, found, _a, jsFiles_1, jsFile, cacheKey, content, found;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        config = vscode.workspace.getConfiguration('unusedCssDetector');
                        detectDynamic = config.get('detectDynamicPatterns', true);
                        // Check if matches dynamic pattern
                        if (detectDynamic && this.matchesDynamicPattern(selector.name)) {
                            return [2 /*return*/, {
                                    found: false,
                                    confidence: 'medium',
                                    reason: 'Matches dynamic pattern, might be generated at runtime'
                                }];
                        }
                        _i = 0, htmlFiles_1 = htmlFiles;
                        _b.label = 1;
                    case 1:
                        if (!(_i < htmlFiles_1.length)) return [3 /*break*/, 5];
                        htmlFile = htmlFiles_1[_i];
                        cacheKey = "html-".concat(htmlFile, "-").concat(selector.name);
                        if (!this.cache.has(cacheKey)) return [3 /*break*/, 2];
                        if (this.cache.get(cacheKey)) {
                            return [2 /*return*/, { found: true, confidence: 'high', reason: 'Found in HTML' }];
                        }
                        return [3 /*break*/, 4];
                    case 2: return [4 /*yield*/, fs.promises.readFile(htmlFile, 'utf8')];
                    case 3:
                        content = _b.sent();
                        found = this.findInHTML(selector, content);
                        this.cache.set(cacheKey, found);
                        if (found) {
                            return [2 /*return*/, { found: true, confidence: 'high', reason: 'Found in HTML' }];
                        }
                        _b.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 1];
                    case 5:
                        _a = 0, jsFiles_1 = jsFiles;
                        _b.label = 6;
                    case 6:
                        if (!(_a < jsFiles_1.length)) return [3 /*break*/, 10];
                        jsFile = jsFiles_1[_a];
                        cacheKey = "js-".concat(jsFile, "-").concat(selector.name);
                        if (!this.cache.has(cacheKey)) return [3 /*break*/, 7];
                        if (this.cache.get(cacheKey)) {
                            return [2 /*return*/, { found: true, confidence: 'high', reason: 'Found in JavaScript' }];
                        }
                        return [3 /*break*/, 9];
                    case 7: return [4 /*yield*/, fs.promises.readFile(jsFile, 'utf8')];
                    case 8:
                        content = _b.sent();
                        found = this.findInJS(selector, content);
                        this.cache.set(cacheKey, found);
                        if (found) {
                            return [2 /*return*/, { found: true, confidence: 'high', reason: 'Found in JavaScript' }];
                        }
                        _b.label = 9;
                    case 9:
                        _a++;
                        return [3 /*break*/, 6];
                    case 10: return [2 /*return*/, {
                            found: false,
                            confidence: 'high',
                            reason: 'Not found in any HTML or JavaScript files'
                        }];
                }
            });
        });
    };
    CSSScanner.prototype.findInHTML = function (selector, content) {
        var name = selector.name;
        var escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        if (selector.type === 'class') {
            var patterns = [new RegExp("class=[\"'][^\"']*\\b".concat(escapedName, "\\b[^\"']*[\"']"), 'i'), new RegExp("className=[\"'][^\"']*\\b".concat(escapedName, "\\b[^\"']*[\"']"), 'i'), new RegExp(":class=[\"'][^\"']*\\b".concat(escapedName, "\\b[^\"']*[\"']"), 'i'), new RegExp("class:".concat(escapedName), 'i')];
            return patterns.some(function (p) { return p.test(content); });
        }
        else {
            var idPattern = new RegExp("id=[\"']".concat(escapedName, "[\"']"), 'i');
            return idPattern.test(content);
        }
    };
    CSSScanner.prototype.findInJS = function (selector, content) {
        var name = selector.name;
        var escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        if (selector.type === 'class') {
            var patterns = [
                // JavaScript
                new RegExp("classList\\.(add|remove|toggle|contains)\\(['\"]s*".concat(escapedName, "s*['\"]\\)"), 'g'),
                new RegExp("className\\s*[=+]=\\s*[\"'`][^\"'`]*\\b".concat(escapedName, "\\b[^\"'`]*[\"'`]"), 'g'),
                new RegExp("querySelector(All)?\\(['\"]s*\\.".concat(escapedName, "\\b[^)]*['\"]\\)"), 'g'),
                // jQuery
                new RegExp("\\$\\(['\"]s*\\.".concat(escapedName, "\\b[^)]*['\"]\\)"), 'g'),
                // React/JSX className
                new RegExp("className=\\{?[\"'`][^\"'`]*\\b".concat(escapedName, "\\b[^\"'`]*[\"'`]\\}?"), 'g'),
                // PHP
                new RegExp("class=[\"'][^\"']*<?php[^>]*?>?[^\"']*\\b".concat(escapedName, "\\b[^\"']*[\"']"), 'g'),
                // String literals
                new RegExp("[\"'`]".concat(escapedName, "[\"'`]"), 'g'),
                // setAttribute
                new RegExp("setAttribute\\(['\"]s*classs*['\"][^)]*\\b".concat(escapedName, "\\b[^)]*\\)"), 'g')
            ];
            return patterns.some(function (p) { return p.test(content); });
        }
        else {
            var patterns = [new RegExp("getElementById\\(['\"]".concat(escapedName, "['\"]\\)"), 'g'), new RegExp("querySelector\\(['\"]#".concat(escapedName, "['\"]\\)"), 'g'), new RegExp("\\$\\(['\"]#".concat(escapedName, "['\"]\\)"), 'g'), new RegExp("id=[\"']".concat(escapedName, "[\"']"), 'g')];
            return patterns.some(function (p) { return p.test(content); });
        }
    };
    CSSScanner.prototype.detectDynamicPatterns = function (jsFiles) {
        return __awaiter(this, void 0, void 0, function () {
            var patterns, _i, jsFiles_2, jsFile, content, templateRegex, match, concatRegex, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        patterns = new Set();
                        _i = 0, jsFiles_2 = jsFiles;
                        _a.label = 1;
                    case 1:
                        if (!(_i < jsFiles_2.length)) return [3 /*break*/, 6];
                        jsFile = jsFiles_2[_i];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, fs.promises.readFile(jsFile, 'utf8')];
                    case 3:
                        content = _a.sent();
                        templateRegex = /["'\`]([a-zA-Z0-9_-]+)-\$\{[^}]+\}/g;
                        match = void 0;
                        while ((match = templateRegex.exec(content)) !== null) {
                            patterns.add(match[1]);
                        }
                        concatRegex = /['"]([a-zA-Z0-9_-]+)-['"]\s*\+/g;
                        while ((match = concatRegex.exec(content)) !== null) {
                            patterns.add(match[1]);
                        }
                        return [3 /*break*/, 5];
                    case 4:
                        err_1 = _a.sent();
                        return [3 /*break*/, 5];
                    case 5:
                        _i++;
                        return [3 /*break*/, 1];
                    case 6: return [2 /*return*/, patterns];
                }
            });
        });
    };
    CSSScanner.prototype.matchesDynamicPattern = function (className) {
        for (var _i = 0, _a = this.dynamicPatterns; _i < _a.length; _i++) {
            var pattern = _a[_i];
            if (className.startsWith(pattern + '-')) {
                return true;
            }
        }
        return false;
    };
    CSSScanner.prototype.findHTMLFilesLinkingToCSS = function (cssFileName) {
        return __awaiter(this, void 0, void 0, function () {
            var config, excludePatterns, htmlFiles, allHTMLFiles, _i, allHTMLFiles_1, htmlFile, content, linkRegex, match, href, importRegex, importPath, err_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        config = vscode.workspace.getConfiguration('unusedCssDetector');
                        excludePatterns = config.get('excludePaths', []);
                        htmlFiles = [];
                        return [4 /*yield*/, vscode.workspace.findFiles('**/*.{html,htm}', "{".concat(excludePatterns.join(','), "}"))];
                    case 1:
                        allHTMLFiles = _a.sent();
                        _i = 0, allHTMLFiles_1 = allHTMLFiles;
                        _a.label = 2;
                    case 2:
                        if (!(_i < allHTMLFiles_1.length)) return [3 /*break*/, 7];
                        htmlFile = allHTMLFiles_1[_i];
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, 5, , 6]);
                        return [4 /*yield*/, fs.promises.readFile(htmlFile.fsPath, 'utf8')];
                    case 4:
                        content = _a.sent();
                        linkRegex = /<link[^>]*href=["']([^"']*?)["'][^>]*>/gi;
                        match = void 0;
                        while ((match = linkRegex.exec(content)) !== null) {
                            href = match[1];
                            // Check if href points to our CSS file
                            if (href.includes(cssFileName) || href.endsWith(cssFileName)) {
                                htmlFiles.push(htmlFile.fsPath);
                                break;
                            }
                        }
                        importRegex = /@import\s+["']([^"']+)["']/gi;
                        while ((match = importRegex.exec(content)) !== null) {
                            importPath = match[1];
                            if (importPath.includes(cssFileName) || importPath.endsWith(cssFileName)) {
                                htmlFiles.push(htmlFile.fsPath);
                                break;
                            }
                        }
                        return [3 /*break*/, 6];
                    case 5:
                        err_2 = _a.sent();
                        return [3 /*break*/, 6];
                    case 6:
                        _i++;
                        return [3 /*break*/, 2];
                    case 7: return [2 /*return*/, htmlFiles];
                }
            });
        });
    };
    CSSScanner.prototype.findAllHTMLFiles = function () {
        return __awaiter(this, void 0, void 0, function () {
            var config, excludePatterns, scanFileTypes, htmlTypes, files;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        config = vscode.workspace.getConfiguration('unusedCssDetector');
                        excludePatterns = config.get('excludePaths', []);
                        scanFileTypes = config.get('scanFileTypes', ['html', 'htm', 'js', 'jsx', 'ts', 'tsx', 'php', 'mjs']);
                        htmlTypes = scanFileTypes.filter(function (ext) { return ['html', 'htm', 'php'].includes(ext); });
                        return [4 /*yield*/, vscode.workspace.findFiles("**/*.{".concat(htmlTypes.join(','), "}"), "{".concat(excludePatterns.join(','), "}"))];
                    case 1:
                        files = _a.sent();
                        return [2 /*return*/, files.map(function (f) { return f.fsPath; })];
                }
            });
        });
    };
    CSSScanner.prototype.findAllCSSFiles = function () {
        return __awaiter(this, void 0, void 0, function () {
            var config, excludePatterns, cssFileTypes, files;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        config = vscode.workspace.getConfiguration('unusedCssDetector');
                        excludePatterns = config.get('excludePaths', []);
                        cssFileTypes = config.get('cssFileTypes', ['css', 'scss', 'sass', 'less']);
                        return [4 /*yield*/, vscode.workspace.findFiles("**/*.{".concat(cssFileTypes.join(','), "}"), "{".concat(excludePatterns.join(','), "}"))];
                    case 1:
                        files = _a.sent();
                        return [2 /*return*/, files.map(function (f) { return f.fsPath; })];
                }
            });
        });
    };
    CSSScanner.prototype.findJSFilesFromHTML = function (htmlFiles) {
        return __awaiter(this, void 0, void 0, function () {
            var config, scanFileTypes, jsExtensions, jsFiles, _i, htmlFiles_2, htmlFile, content, htmlDir, scriptRegex, match, _loop_1, this_1, moduleRegex, scriptContent, importRegex, importMatch, importPath, jsPath, _a, jsExtensions_1, ext, testPath, phpIncludeRegex, includePath, jsPath, err_3;
            var _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        config = vscode.workspace.getConfiguration('unusedCssDetector');
                        scanFileTypes = config.get('scanFileTypes', ['html', 'htm', 'js', 'jsx', 'ts', 'tsx', 'php', 'mjs']);
                        jsExtensions = scanFileTypes.filter(function (ext) { return ['js', 'jsx', 'ts', 'tsx', 'mjs'].includes(ext); });
                        jsFiles = new Set();
                        _i = 0, htmlFiles_2 = htmlFiles;
                        _c.label = 1;
                    case 1:
                        if (!(_i < htmlFiles_2.length)) return [3 /*break*/, 20];
                        htmlFile = htmlFiles_2[_i];
                        _c.label = 2;
                    case 2:
                        _c.trys.push([2, 18, , 19]);
                        return [4 /*yield*/, fs.promises.readFile(htmlFile, 'utf8')];
                    case 3:
                        content = _c.sent();
                        htmlDir = path.dirname(htmlFile);
                        scriptRegex = /<script[^>]*src=["']([^"']+)["'][^>]*>/gi;
                        match = void 0;
                        _loop_1 = function () {
                            var src, jsPath, workspaceRoot, _d, jsExtensions_2, ext, testPath;
                            return __generator(this, function (_e) {
                                switch (_e.label) {
                                    case 0:
                                        src = match[1];
                                        // Skip external scripts
                                        if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('//')) {
                                            return [2 /*return*/, "continue"];
                                        }
                                        if (src.startsWith('/')) {
                                            workspaceRoot = (_b = vscode.workspace.workspaceFolders) === null || _b === void 0 ? void 0 : _b[0].uri.fsPath;
                                            jsPath = path.join(workspaceRoot || '', src);
                                        }
                                        else {
                                            jsPath = path.resolve(htmlDir, src);
                                        }
                                        _d = 0, jsExtensions_2 = jsExtensions;
                                        _e.label = 1;
                                    case 1:
                                        if (!(_d < jsExtensions_2.length)) return [3 /*break*/, 4];
                                        ext = jsExtensions_2[_d];
                                        testPath = jsPath;
                                        // If no extension or wrong extension, try adding this one
                                        if (!jsExtensions.some(function (e) { return jsPath.endsWith(".".concat(e)); })) {
                                            testPath = jsPath.replace(/\.[^.]+$/, '') + ".".concat(ext);
                                        }
                                        return [4 /*yield*/, this_1.fileExists(testPath)];
                                    case 2:
                                        if (_e.sent()) {
                                            jsFiles.add(testPath);
                                        }
                                        _e.label = 3;
                                    case 3:
                                        _d++;
                                        return [3 /*break*/, 1];
                                    case 4: return [2 /*return*/];
                                }
                            });
                        };
                        this_1 = this;
                        _c.label = 4;
                    case 4:
                        if (!((match = scriptRegex.exec(content)) !== null)) return [3 /*break*/, 6];
                        return [5 /*yield**/, _loop_1()];
                    case 5:
                        _c.sent();
                        return [3 /*break*/, 4];
                    case 6:
                        moduleRegex = /<script[^>]*type=["']module["'][^>]*>([\s\S]*?)<\/script>/gi;
                        _c.label = 7;
                    case 7:
                        if (!((match = moduleRegex.exec(content)) !== null)) return [3 /*break*/, 14];
                        scriptContent = match[1];
                        importRegex = /import\s+.*?from\s+["']([^"']+)["']/g;
                        importMatch = void 0;
                        _c.label = 8;
                    case 8:
                        if (!((importMatch = importRegex.exec(scriptContent)) !== null)) return [3 /*break*/, 13];
                        importPath = importMatch[1];
                        if (!(!importPath.startsWith('http') && !importPath.startsWith('//'))) return [3 /*break*/, 12];
                        jsPath = path.resolve(htmlDir, importPath);
                        _a = 0, jsExtensions_1 = jsExtensions;
                        _c.label = 9;
                    case 9:
                        if (!(_a < jsExtensions_1.length)) return [3 /*break*/, 12];
                        ext = jsExtensions_1[_a];
                        testPath = jsPath;
                        if (!path.extname(jsPath)) {
                            testPath = jsPath + ".".concat(ext);
                        }
                        return [4 /*yield*/, this.fileExists(testPath)];
                    case 10:
                        if (_c.sent()) {
                            jsFiles.add(testPath);
                        }
                        _c.label = 11;
                    case 11:
                        _a++;
                        return [3 /*break*/, 9];
                    case 12: return [3 /*break*/, 8];
                    case 13: return [3 /*break*/, 7];
                    case 14:
                        if (!htmlFile.endsWith('.php')) return [3 /*break*/, 17];
                        phpIncludeRegex = /(?:include|require)(?:_once)?\s*\(?["']([^"']+\.(?:js|jsx|ts|tsx|mjs))["']\)?/gi;
                        _c.label = 15;
                    case 15:
                        if (!((match = phpIncludeRegex.exec(content)) !== null)) return [3 /*break*/, 17];
                        includePath = match[1];
                        jsPath = path.resolve(htmlDir, includePath);
                        return [4 /*yield*/, this.fileExists(jsPath)];
                    case 16:
                        if (_c.sent()) {
                            jsFiles.add(jsPath);
                        }
                        return [3 /*break*/, 15];
                    case 17: return [3 /*break*/, 19];
                    case 18:
                        err_3 = _c.sent();
                        return [3 /*break*/, 19];
                    case 19:
                        _i++;
                        return [3 /*break*/, 1];
                    case 20: return [2 /*return*/, Array.from(jsFiles)];
                }
            });
        });
    };
    CSSScanner.prototype.fileExists = function (filePath) {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, fs.promises.access(filePath)];
                    case 1:
                        _b.sent();
                        return [2 /*return*/, true];
                    case 2:
                        _a = _b.sent();
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    CSSScanner.prototype.estimateLinesSaved = function (details, cssContent) {
        var lines = 0;
        for (var _i = 0, details_1 = details; _i < details_1.length; _i++) {
            var detail = details_1[_i];
            // Estimate 3-5 lines per unused selector (selector + properties + closing brace)
            lines += 4;
        }
        return lines;
    };
    CSSScanner.prototype.createEmptyResults = function (cssFile) {
        return {
            cssFile: cssFile,
            htmlFiles: [],
            jsFiles: [],
            totalSelectors: 0,
            usedSelectors: 0,
            unusedHigh: 0,
            unusedMedium: 0,
            skipped: 0,
            estimatedLines: 0,
            details: []
        };
    };
    CSSScanner.prototype.getLastResults = function () {
        return this.lastResults;
    };
    CSSScanner.prototype.clearCache = function () {
        this.cache.clear();
        this.dynamicPatterns.clear();
    };
    return CSSScanner;
}());
exports.CSSScanner = CSSScanner;

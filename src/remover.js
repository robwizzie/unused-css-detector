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
exports.CSSRemover = void 0;
var vscode = require("vscode");
var fs = require("fs");
var path = require("path");
var CSSRemover = /** @class */ (function () {
    function CSSRemover(outputChannel) {
        this.outputChannel = outputChannel;
    }
    CSSRemover.prototype.removeUnusedWithPreview = function (results) {
        return __awaiter(this, void 0, void 0, function () {
            var items, selected, confirm;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!results || results.details.length === 0) {
                            vscode.window.showInformationMessage('No unused CSS to remove');
                            return [2 /*return*/];
                        }
                        items = results.details.map(function (detail) { return ({
                            label: "".concat(detail.type === 'class' ? '.' : '#').concat(detail.selector),
                            description: detail.reason,
                            detail: "Confidence: ".concat(detail.confidence),
                            picked: detail.confidence === 'high',
                            data: detail
                        }); });
                        return [4 /*yield*/, vscode.window.showQuickPick(items, {
                                canPickMany: true,
                                placeHolder: 'Select CSS rules to remove (high confidence pre-selected)'
                            })];
                    case 1:
                        selected = _a.sent();
                        if (!selected || selected.length === 0) {
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, vscode.window.showWarningMessage("Remove ".concat(selected.length, " CSS rule(s)?"), { modal: true }, 'Yes', 'No')];
                    case 2:
                        confirm = _a.sent();
                        if (!(confirm === 'Yes')) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.removeCSSRules(results.cssFile, selected.map(function (s) { return s.data; }))];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    CSSRemover.prototype.removeHighConfidenceUnused = function (results) {
        return __awaiter(this, void 0, void 0, function () {
            var highConfidence, confirm;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!results) {
                            vscode.window.showInformationMessage('No scan results available');
                            return [2 /*return*/];
                        }
                        highConfidence = results.details.filter(function (d) { return d.confidence === 'high'; });
                        if (highConfidence.length === 0) {
                            vscode.window.showInformationMessage('No high-confidence unused CSS found');
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, vscode.window.showWarningMessage("Remove ".concat(highConfidence.length, " high-confidence unused CSS rule(s)?"), { modal: true }, 'Yes', 'No')];
                    case 1:
                        confirm = _a.sent();
                        if (!(confirm === 'Yes')) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.removeCSSRules(results.cssFile, highConfidence)];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    CSSRemover.prototype.removeCSSRules = function (cssFile, rules) {
        return __awaiter(this, void 0, void 0, function () {
            var config, createBackup, backupPath, content, lines, selectorsToRemove, newContent, _i, selectorsToRemove_1, selector, pattern, doc, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        config = vscode.workspace.getConfiguration('unusedCssDetector');
                        createBackup = config.get('createBackup', true);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 8, , 9]);
                        if (!createBackup) return [3 /*break*/, 3];
                        backupPath = cssFile + '.backup';
                        return [4 /*yield*/, fs.promises.copyFile(cssFile, backupPath)];
                    case 2:
                        _a.sent();
                        this.outputChannel.appendLine("Backup created: ".concat(backupPath));
                        _a.label = 3;
                    case 3: return [4 /*yield*/, fs.promises.readFile(cssFile, 'utf8')];
                    case 4:
                        content = _a.sent();
                        lines = content.split('\n');
                        selectorsToRemove = new Set(rules.map(function (r) { return r.selector; }));
                        newContent = content;
                        for (_i = 0, selectorsToRemove_1 = selectorsToRemove; _i < selectorsToRemove_1.length; _i++) {
                            selector = selectorsToRemove_1[_i];
                            pattern = new RegExp("\\.".concat(selector, "\\s*\\{[^}]*\\}"), 'g');
                            newContent = newContent.replace(pattern, '');
                        }
                        // Clean up extra blank lines
                        newContent = newContent.replace(/\n\n\n+/g, '\n\n');
                        // Write back
                        return [4 /*yield*/, fs.promises.writeFile(cssFile, newContent, 'utf8')];
                    case 5:
                        // Write back
                        _a.sent();
                        vscode.window.showInformationMessage("Removed ".concat(rules.length, " CSS rule(s) from ").concat(path.basename(cssFile)));
                        this.outputChannel.appendLine("\nRemoved ".concat(rules.length, " CSS rules from ").concat(cssFile));
                        return [4 /*yield*/, vscode.workspace.openTextDocument(cssFile)];
                    case 6:
                        doc = _a.sent();
                        return [4 /*yield*/, vscode.window.showTextDocument(doc)];
                    case 7:
                        _a.sent();
                        return [3 /*break*/, 9];
                    case 8:
                        err_1 = _a.sent();
                        vscode.window.showErrorMessage("Error removing CSS: ".concat(err_1));
                        this.outputChannel.appendLine("Error: ".concat(err_1));
                        return [3 /*break*/, 9];
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    return CSSRemover;
}());
exports.CSSRemover = CSSRemover;

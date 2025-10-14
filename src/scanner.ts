import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export interface SelectorInfo {
	name: string;
	type: 'class' | 'id';
	line: number;
	column: number;
	fullSelector: string;
}

export interface UnusedSelector {
	selector: string;
	type: 'class' | 'id';
	confidence: 'high' | 'medium' | 'low';
	reason: string;
	locations: Array<{ file: string; line: number; column: number }>;
	filesChecked: {
		htmlFiles: number;
		jsFiles: number;
	};
}

export interface ScanResults {
	cssFile: string;
	htmlFiles: string[];
	jsFiles: string[];
	totalSelectors: number;
	usedSelectors: number;
	unusedHigh: number;
	unusedMedium: number;
	skipped: number;
	estimatedLines: number;
	details: UnusedSelector[];
}

export class CSSScanner {
	private lastResults: ScanResults | null = null;
	private cache: Map<string, boolean> = new Map();
	private dynamicPatterns: Set<string> = new Set();

	constructor(private outputChannel: vscode.OutputChannel) {}

	async scanCSSFile(cssFilePath: string, progress: vscode.Progress<{ increment?: number; message?: string }>, token: vscode.CancellationToken): Promise<ScanResults> {
		const config = vscode.workspace.getConfiguration('unusedCssDetector');
		const scanMode = config.get<string>('scanMode', 'linked-files-only');
		const fallback = config.get<boolean>('fallbackToAllFiles', true);

		progress.report({ increment: 0, message: 'Step 1/4: Analyzing CSS file...' });

		const cssContent = await fs.promises.readFile(cssFilePath, 'utf8');
		const selectors = this.extractSelectorsFromCSS(cssContent, cssFilePath);

		this.outputChannel.appendLine(`\nFound ${selectors.length} selectors in CSS file`);

		if (token.isCancellationRequested) return this.createEmptyResults(cssFilePath);

		progress.report({ increment: 25, message: 'Step 2/4: Finding linked HTML files...' });

		const cssFileName = path.basename(cssFilePath);
		let htmlFiles: string[] = [];

		if (scanMode === 'linked-files-only') {
			htmlFiles = await this.findHTMLFilesLinkingToCSS(cssFileName);
			this.outputChannel.appendLine(`Found ${htmlFiles.length} HTML files linking to ${cssFileName}`);

			if (htmlFiles.length === 0 && fallback) {
				this.outputChannel.appendLine('No HTML files link to this CSS. Falling back to all HTML files...');
				htmlFiles = await this.findAllHTMLFiles();
			}
		} else {
			htmlFiles = await this.findAllHTMLFiles();
		}

		if (token.isCancellationRequested) return this.createEmptyResults(cssFilePath);

		progress.report({ increment: 50, message: 'Step 3/4: Finding linked JavaScript files...' });

		const jsFiles = await this.findJSFilesFromHTML(htmlFiles);
		this.outputChannel.appendLine(`Found ${jsFiles.length} JavaScript files`);

		if (token.isCancellationRequested) return this.createEmptyResults(cssFilePath);

		progress.report({ increment: 75, message: 'Step 4/4: Checking CSS usage...' });

		// Detect dynamic patterns
		this.dynamicPatterns = await this.detectDynamicPatterns(jsFiles);
		if (this.dynamicPatterns.size > 0) {
			this.outputChannel.appendLine(`Detected ${this.dynamicPatterns.size} dynamic class patterns`);
		}

		const results: ScanResults = {
			cssFile: cssFilePath,
			htmlFiles,
			jsFiles,
			totalSelectors: selectors.length,
			usedSelectors: 0,
			unusedHigh: 0,
			unusedMedium: 0,
			skipped: 0,
			estimatedLines: 0,
			details: []
		};

		for (const selector of selectors) {
			if (token.isCancellationRequested) break;

			if (this.shouldSkipSelector(selector)) {
				results.skipped++;
				continue;
			}

			const usage = await this.checkSelectorUsage(selector, htmlFiles, jsFiles);

			if (usage.found) {
				results.usedSelectors++;
			} else {
				const detail: UnusedSelector = {
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
				} else {
					results.unusedMedium++;
				}
			}
		}

		results.estimatedLines = this.estimateLinesSaved(results.details, cssContent);
		this.lastResults = results;

		return results;
	}

	async scanProject(progress: vscode.Progress<{ increment?: number; message?: string }>, token: vscode.CancellationToken): Promise<ScanResults[]> {
		const cssFiles = await this.findAllCSSFiles();
		const results: ScanResults[] = [];

		for (let i = 0; i < cssFiles.length; i++) {
			if (token.isCancellationRequested) break;

			const percent = Math.floor((i / cssFiles.length) * 100);
			progress.report({
				increment: percent - (i > 0 ? Math.floor(((i - 1) / cssFiles.length) * 100) : 0),
				message: `Scanning ${path.basename(cssFiles[i])} (${i + 1}/${cssFiles.length})...`
			});

			const result = await this.scanCSSFile(cssFiles[i], progress, token);
			results.push(result);
		}

		return results;
	}

	private extractSelectorsFromCSS(cssContent: string, filePath: string): SelectorInfo[] {
		const selectors: SelectorInfo[] = [];

		// Remove comments
		cssContent = cssContent.replace(/\/\*[\s\S]*?\*\//g, '');

		// Remove @keyframes
		cssContent = cssContent.replace(/@keyframes[^{]+\{(?:[^{}]|\{[^{}]*\})*\}/g, '');

		const lines = cssContent.split('\n');

		for (let lineNum = 0; lineNum < lines.length; lineNum++) {
			const line = lines[lineNum];

			// Match class selectors - but ONLY at start of line or after whitespace/comma/brace
			const classRegex = /(^|[\s,{>\+~])\.([a-zA-Z_][\w-]*)/g;
			let match;

			while ((match = classRegex.exec(line)) !== null) {
				const className = match[2]; // Now group 2 because of leading char
				const column = match.index + match[1].length; // Adjust for leading char

				// Check if it's followed by a pseudo-class or pseudo-element
				const restOfLine = line.substring(match.index + match[0].length);
				if (restOfLine.match(/^(::|:)/)) {
					continue;
				}

				// Skip if it looks like a CSS value (has units or is part of a URL)
				if (className.match(/^\d/) || className.match(/(rem|px|em|vh|vw|deg|s|ms)$/)) {
					continue;
				}

				selectors.push({
					name: className,
					type: 'class',
					line: lineNum + 1,
					column: column,
					fullSelector: '.' + className
				});
			}

			// Match ID selectors - but ONLY at start of line or after whitespace/comma/brace
			// Skip hex colors
			const idRegex = /(^|[\s,{>\+~])#([a-zA-Z_][\w-]+)/g;
			while ((match = idRegex.exec(line)) !== null) {
				const idName = match[2]; // Now group 2
				const column = match.index + match[1].length;

				const restOfLine = line.substring(match.index + match[0].length);
				if (restOfLine.match(/^(::|:)/)) {
					continue;
				}

				// Skip if it looks like a hex color (any length of hex digits)
				if (idName.match(/^[0-9a-fA-F]+$/)) {
				  continue;
				}

				selectors.push({
					name: idName,
					type: 'id',
					line: lineNum + 1,
					column: column,
					fullSelector: '#' + idName
				});
			}
		}

		// Remove duplicates
		const unique = new Map<string, SelectorInfo>();
		for (const sel of selectors) {
			const key = `${sel.type}-${sel.name}`;
			if (!unique.has(key)) {
				unique.set(key, sel);
			}
		}

		return Array.from(unique.values());
	}

	private shouldSkipSelector(selector: SelectorInfo): boolean {
		const config = vscode.workspace.getConfiguration('unusedCssDetector');
		const ignorePrefixes = config.get<string[]>('ignorePrefixes', []);
		const ignoreUtility = config.get<boolean>('ignoreUtilityFrameworks', true);
		const tailwindSupport = config.get<boolean>('tailwindSupport', true);

		// Check ignore prefixes
		for (const prefix of ignorePrefixes) {
			if (selector.name.startsWith(prefix.replace(/\*$/, ''))) {
				return true;
			}
		}

		// Tailwind and utility framework support
		if (ignoreUtility && tailwindSupport) {
			// Common Tailwind patterns
			const tailwindPatterns = [/^(sm|md|lg|xl|2xl):/, /^(hover|focus|active|disabled|group-hover|group-focus):/, /^(dark|light):/, /^(container|mx-auto|flex|grid|block|inline|hidden)/, /^[mp][xytblr]?-\d+$/, /^w-\d+$/, /^h-\d+$/, /^text-(xs|sm|base|lg|xl|\d+xl|center|left|right)/, /^bg-\w+(-\d+)?$/, /^border(-\w+)?(-\d+)?$/, /^rounded(-\w+)?$/, /^shadow(-\w+)?$/, /^opacity-\d+$/, /^z-\d+$/, /^gap-\d+$/, /^space-[xy]-\d+$/, /^divide-\w+$/, /^ring(-\w+)?(-\d+)?$/, /^transition(-\w+)?$/, /^duration-\d+$/, /^ease-\w+$/];

			if (tailwindPatterns.some(pattern => pattern.test(selector.name))) {
				return true;
			}
		}

		// Bootstrap patterns
		if (ignoreUtility) {
			const bootstrapPatterns = [/^col(-\w+)?(-\d+)?$/, /^row$/, /^container(-fluid)?$/, /^btn(-\w+)?$/, /^alert(-\w+)?$/, /^badge(-\w+)?$/, /^card(-\w+)?$/, /^nav(-\w+)?$/, /^navbar(-\w+)?$/, /^modal(-\w+)?$/, /^dropdown(-\w+)?$/, /^form(-\w+)?$/, /^input(-\w+)?$/, /^[mp][xytblr]?-\d+$/, /^[dw]-\d+$/, /^text-(primary|secondary|success|danger|warning|info|light|dark|muted)$/, /^bg-(primary|secondary|success|danger|warning|info|light|dark)$/, /^border(-\w+)?$/, /^rounded(-\w+)?$/, /^shadow(-\w+)?$/, /^d-(none|inline|inline-block|block|flex|inline-flex)$/, /^justify-content-\w+$/, /^align-items-\w+$/, /^float-\w+$/, /^clearfix$/, /^fade$/, /^show$/, /^collapse$/, /^collapsing$/];

			if (bootstrapPatterns.some(pattern => pattern.test(selector.name))) {
				return true;
			}
		}

		return false;
	}

	private async checkSelectorUsage(selector: SelectorInfo, htmlFiles: string[], jsFiles: string[]): Promise<{ found: boolean; confidence: 'high' | 'medium'; reason: string }> {
		const config = vscode.workspace.getConfiguration('unusedCssDetector');
		const detectDynamic = config.get<boolean>('detectDynamicPatterns', true);

		// Check if matches dynamic pattern
		if (detectDynamic && this.matchesDynamicPattern(selector.name)) {
			return {
				found: false,
				confidence: 'medium',
				reason: 'Matches dynamic pattern, might be generated at runtime'
			};
		}

		// Check HTML files
		for (const htmlFile of htmlFiles) {
			const cacheKey = `html-${htmlFile}-${selector.name}`;

			if (this.cache.has(cacheKey)) {
				if (this.cache.get(cacheKey)) {
					return { found: true, confidence: 'high', reason: 'Found in HTML' };
				}
			} else {
				const content = await fs.promises.readFile(htmlFile, 'utf8');
				const found = this.findInHTML(selector, content);
				this.cache.set(cacheKey, found);

				if (found) {
					return { found: true, confidence: 'high', reason: 'Found in HTML' };
				}
			}
		}

		// Check JS files
		for (const jsFile of jsFiles) {
			const cacheKey = `js-${jsFile}-${selector.name}`;

			if (this.cache.has(cacheKey)) {
				if (this.cache.get(cacheKey)) {
					return { found: true, confidence: 'high', reason: 'Found in JavaScript' };
				}
			} else {
				const content = await fs.promises.readFile(jsFile, 'utf8');
				const found = this.findInJS(selector, content);
				this.cache.set(cacheKey, found);

				if (found) {
					return { found: true, confidence: 'high', reason: 'Found in JavaScript' };
				}
			}
		}

		return {
			found: false,
			confidence: 'high',
			reason: 'Not found in any HTML or JavaScript files'
		};
	}

	private findInHTML(selector: SelectorInfo, content: string): boolean {
		const name = selector.name;
		const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

		if (selector.type === 'class') {
			const patterns = [new RegExp(`class=["'][^"']*\\b${escapedName}\\b[^"']*["']`, 'i'), new RegExp(`className=["'][^"']*\\b${escapedName}\\b[^"']*["']`, 'i'), new RegExp(`:class=["'][^"']*\\b${escapedName}\\b[^"']*["']`, 'i'), new RegExp(`class:${escapedName}`, 'i')];

			return patterns.some(p => p.test(content));
		} else {
			const idPattern = new RegExp(`id=["']${escapedName}["']`, 'i');
			return idPattern.test(content);
		}
	}

	private findInJS(selector: SelectorInfo, content: string): boolean {
		const name = selector.name;
		const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

		if (selector.type === 'class') {
		  const patterns = [
		    // Direct class usage patterns
		    new RegExp(`classList\\.(add|remove|toggle|contains)\\(['"]\s*${escapedName}\s*['"]\\)`, 'g'),
		    new RegExp(`className\\s*[=+]=\\s*["'\`][^"'\`]*\\b${escapedName}\\b[^"'\`]*["'\`]`, 'g'),
		    
		    // className = "stat-brain some-other-class"
		    new RegExp(`className\\s*=\\s*["'\`]${escapedName}[\\s"'\`]`, 'gi'),
		    
		    new RegExp(`querySelector(All)?\\(['"]\s*\\.${escapedName}\\b[^)]*['"]\\)`, 'g'),
		    
		    // jQuery
		    new RegExp(`\\$\\(['"]\s*\\.${escapedName}\\b[^)]*['"]\\)`, 'g'),
		    
		    // React/JSX className
		    new RegExp(`className=\\{?["'\`][^"'\`]*\\b${escapedName}\\b[^"'\`]*["'\`]\\}?`, 'g'),
		    
		    // String literals (any quote type)
		    new RegExp(`["'\`]${escapedName}["'\`]`, 'g'),
		    
		    // setAttribute
		    new RegExp(`setAttribute\\(['"]\s*class\s*['"][^)]*\\b${escapedName}\\b[^)]*\\)`, 'g'),
		    
		    // HTML class attribute in any string (including template literals)
		    new RegExp(`class=["'\`][^"'\`]*\\b${escapedName}\\b[^"'\`]*["'\`]`, 'gi'),
		    
		    // Also match with spaces/newlines in template literals
		    new RegExp(`class=["'\`][^"'\`]{0,500}${escapedName}[^"'\`]{0,500}["'\`]`, 'gi')
		  ];
		  
		  return patterns.some(p => p.test(content));
		} else {
			// ID selectors
			const patterns = [
				new RegExp(`getElementById\\(['"]${escapedName}['"]\\)`, 'g'),
				new RegExp(`querySelector\\(['"]#${escapedName}['"]\\)`, 'g'),
				new RegExp(`\\$\\(['"]#${escapedName}['"]\\)`, 'g'),

				// ⭐ KEY FIX: HTML id attribute in any string
				new RegExp(`id=["'\`][^"'\`]*\\b${escapedName}\\b[^"'\`]*["'\`]`, 'gi'),
				new RegExp(`id=["'\`][^"'\`]{0,500}${escapedName}[^"'\`]{0,500}["'\`]`, 'gi')
			];

			return patterns.some(p => p.test(content));
		}
	}

	private async detectDynamicPatterns(jsFiles: string[]): Promise<Set<string>> {
		const patterns = new Set<string>();

		for (const jsFile of jsFiles) {
			try {
				const content = await fs.promises.readFile(jsFile, 'utf8');

				// Template literal patterns: `prefix-${var}`
				const templateRegex = /["'\`]([a-zA-Z0-9_-]+)-\$\{[^}]+\}/g;
				let match;

				while ((match = templateRegex.exec(content)) !== null) {
					patterns.add(match[1]);
				}

				// String concatenation: 'prefix-' + variable
				const concatRegex = /['"]([a-zA-Z0-9_-]+)-['"]\s*\+/g;
				while ((match = concatRegex.exec(content)) !== null) {
					patterns.add(match[1]);
				}
			} catch (err) {
				// Ignore errors reading files
			}
		}

		return patterns;
	}

	private matchesDynamicPattern(className: string): boolean {
		for (const pattern of this.dynamicPatterns) {
			if (className.startsWith(pattern + '-')) {
				return true;
			}
		}
		return false;
	}

	private async findHTMLFilesLinkingToCSS(cssFileName: string): Promise<string[]> {
		const config = vscode.workspace.getConfiguration('unusedCssDetector');
		const excludePatterns = config.get<string[]>('excludePaths', []);

		const htmlFiles: string[] = [];
		const allHTMLFiles = await vscode.workspace.findFiles('**/*.{html,htm}', `{${excludePatterns.join(',')}}`);

		for (const htmlFile of allHTMLFiles) {
			try {
				const content = await fs.promises.readFile(htmlFile.fsPath, 'utf8');

				// Check for <link> tags referencing this CSS
				const linkRegex = /<link[^>]*href=["']([^"']*?)["'][^>]*>/gi;
				let match;

				while ((match = linkRegex.exec(content)) !== null) {
					const href = match[1];

					// Check if href points to our CSS file
					if (href.includes(cssFileName) || href.endsWith(cssFileName)) {
						htmlFiles.push(htmlFile.fsPath);
						break;
					}
				}

				// Also check for style tags with @import
				const importRegex = /@import\s+["']([^"']+)["']/gi;
				while ((match = importRegex.exec(content)) !== null) {
					const importPath = match[1];
					if (importPath.includes(cssFileName) || importPath.endsWith(cssFileName)) {
						htmlFiles.push(htmlFile.fsPath);
						break;
					}
				}
			} catch (err) {
				// Ignore errors
			}
		}

		return htmlFiles;
	}

	private async findAllHTMLFiles(): Promise<string[]> {
		const config = vscode.workspace.getConfiguration('unusedCssDetector');
		const excludePatterns = config.get<string[]>('excludePaths', []);
		const scanFileTypes = config.get<string[]>('scanFileTypes', ['html', 'htm', 'js', 'jsx', 'ts', 'tsx', 'php', 'mjs']);

		// Filter to only HTML-like files for initial scan
		const htmlTypes = scanFileTypes.filter(ext => ['html', 'htm', 'php'].includes(ext));

		const files = await vscode.workspace.findFiles(`**/*.{${htmlTypes.join(',')}}`, `{${excludePatterns.join(',')}}`);

		return files.map(f => f.fsPath);
	}

	private async findAllCSSFiles(): Promise<string[]> {
		const config = vscode.workspace.getConfiguration('unusedCssDetector');
		const excludePatterns = config.get<string[]>('excludePaths', []);
		const cssFileTypes = config.get<string[]>('cssFileTypes', ['css', 'scss', 'sass', 'less']);

		const files = await vscode.workspace.findFiles(`**/*.{${cssFileTypes.join(',')}}`, `{${excludePatterns.join(',')}}`);

		return files.map(f => f.fsPath);
	}

	private async findJSFilesFromHTML(htmlFiles: string[]): Promise<string[]> {
		const config = vscode.workspace.getConfiguration('unusedCssDetector');
		const scanFileTypes = config.get<string[]>('scanFileTypes', ['html', 'htm', 'js', 'jsx', 'ts', 'tsx', 'php', 'mjs']);
		const jsExtensions = scanFileTypes.filter(ext => ['js', 'jsx', 'ts', 'tsx', 'mjs'].includes(ext));

		const jsFiles = new Set<string>();

		for (const htmlFile of htmlFiles) {
			try {
				const content = await fs.promises.readFile(htmlFile, 'utf8');
				const htmlDir = path.dirname(htmlFile);

				// Find <script src="..."> tags
				const scriptRegex = /<script[^>]*src=["']([^"']+)["'][^>]*>/gi;
				let match;

				while ((match = scriptRegex.exec(content)) !== null) {
					let src = match[1];

					// Skip external scripts
					if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('//')) {
						continue;
					}

					// Resolve path
					let jsPath: string;
					if (src.startsWith('/')) {
						const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
						jsPath = path.join(workspaceRoot || '', src);
					} else {
						jsPath = path.resolve(htmlDir, src);
					}

					// Try all JS extensions
					for (const ext of jsExtensions) {
						let testPath = jsPath;

						// If no extension or wrong extension, try adding this one
						if (!jsExtensions.some(e => jsPath.endsWith(`.${e}`))) {
							testPath = jsPath.replace(/\.[^.]+$/, '') + `.${ext}`;
						}

						if (await this.fileExists(testPath)) {
							jsFiles.add(testPath);
						}
					}
				}

				// Check for inline module scripts with imports
				const moduleRegex = /<script[^>]*type=["']module["'][^>]*>([\s\S]*?)<\/script>/gi;
				while ((match = moduleRegex.exec(content)) !== null) {
					const scriptContent = match[1];

					const importRegex = /import\s+.*?from\s+["']([^"']+)["']/g;
					let importMatch;

					while ((importMatch = importRegex.exec(scriptContent)) !== null) {
						const importPath = importMatch[1];

						if (!importPath.startsWith('http') && !importPath.startsWith('//')) {
							let jsPath = path.resolve(htmlDir, importPath);

							for (const ext of jsExtensions) {
								let testPath = jsPath;
								if (!path.extname(jsPath)) {
									testPath = jsPath + `.${ext}`;
								}

								if (await this.fileExists(testPath)) {
									jsFiles.add(testPath);
								}
							}
						}
					}
				}

				// If this is a PHP file, also check for PHP-style includes
				if (htmlFile.endsWith('.php')) {
					const phpIncludeRegex = /(?:include|require)(?:_once)?\s*\(?["']([^"']+\.(?:js|jsx|ts|tsx|mjs))["']\)?/gi;
					while ((match = phpIncludeRegex.exec(content)) !== null) {
						const includePath = match[1];
						let jsPath = path.resolve(htmlDir, includePath);

						if (await this.fileExists(jsPath)) {
							jsFiles.add(jsPath);
						}
					}
				}
			} catch (err) {
				// Ignore errors
			}
		}

		const filesToScan = new Set(jsFiles);
		for (const jsFile of filesToScan) {
			try {
				const jsContent = await fs.promises.readFile(jsFile, 'utf8');

				// Find ES6 import statements
				const importRegex = /import\s+.*?from\s+["']([^"']+)["']/g;
				let match;

				while ((match = importRegex.exec(jsContent)) !== null) {
					const importPath = match[1];

					// Skip node_modules and external imports
					if (importPath.startsWith('http') || importPath.startsWith('//') || (!importPath.startsWith('/') && !importPath.startsWith('.'))) {
						continue;
					}

					const jsDir = path.dirname(jsFile);
					let resolvedPath: string;

					if (importPath.startsWith('/')) {
						const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
						resolvedPath = path.join(workspaceRoot || '', importPath);
					} else {
						resolvedPath = path.resolve(jsDir, importPath);
					}

					// Try different extensions
					for (const ext of jsExtensions) {
						let testPath = resolvedPath;
						if (!path.extname(resolvedPath)) {
							testPath = resolvedPath + `.${ext}`;
						}

						if ((await this.fileExists(testPath)) && !jsFiles.has(testPath)) {
							jsFiles.add(testPath);
							filesToScan.add(testPath); // Also scan this new file for more imports
						}
					}
				}
			} catch (err) {
				// Ignore errors
			}
		}

		return Array.from(jsFiles);
	}

	private async fileExists(filePath: string): Promise<boolean> {
		try {
			await fs.promises.access(filePath);
			return true;
		} catch {
			return false;
		}
	}

	private estimateLinesSaved(details: UnusedSelector[], cssContent: string): number {
		let lines = 0;

		for (const detail of details) {
			// Estimate 3-5 lines per unused selector (selector + properties + closing brace)
			lines += 4;
		}

		return lines;
	}

	private createEmptyResults(cssFile: string): ScanResults {
		return {
			cssFile,
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
	}

	getLastResults(): ScanResults | null {
		return this.lastResults;
	}

	clearCache(): void {
		this.cache.clear();
		this.dynamicPatterns.clear();
	}
}

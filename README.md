# Unused CSS Detector

Find and remove unused CSS by intelligently scanning HTML files that link to your CSS and their associated JavaScript files.

## Features

-   🔍 **Smart Detection**: Finds HTML files linking to your CSS, then checks those HTML files and their linked JavaScript files
-   🎯 **High Accuracy**: Detects dynamic class patterns to avoid false positives
-   🎨 **Visual Highlighting**: Red for high-confidence unused, orange for medium-confidence
-   📊 **Detailed Reports**: See exactly what was checked and why CSS is unused
-   🛡️ **Safe Removal**: Preview before deleting, automatic backups
-   ⚙️ **Configurable**: Support for Bootstrap, WordPress, SCSS, and custom patterns

## Usage

1. Open any `.css` file
2. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
3. Run command: **"CSS: Find Unused CSS in Current File"**
4. View highlighted unused CSS with confidence levels
5. Remove unused CSS with one click

## Commands

-   `CSS: Find Unused CSS in Current File` - Scan current CSS file
-   `CSS: Find Unused CSS in Entire Project` - Scan all CSS files
-   `CSS: Remove Unused CSS (Preview First)` - Preview and select what to remove
-   `CSS: Remove High-Confidence Unused CSS` - Automatically remove safe deletions
-   `CSS: Show Unused CSS Report` - View detailed HTML report
-   `CSS: Clear Cache` - Clear the scan cache

## How It Works

1. **Analyzes your CSS file** to extract all class and ID selectors
2. **Finds HTML files** that link to this CSS file via `<link>` tags
3. **Discovers JavaScript files** referenced in those HTML files via `<script>` tags
4. **Checks usage** of each CSS selector across all relevant files
5. **Highlights unused CSS** with confidence levels
6. **Detects dynamic patterns** like `btn-${type}` to avoid false positives

## Configuration

Go to Settings → Extensions → Unused CSS Detector:

-   **Scan Mode**: Choose between "linked-files-only" (recommended) or "all-project-files"
-   **Fallback to All Files**: Scan all HTML if no links found
-   **Exclude Paths**: Patterns to exclude (node_modules, dist, etc.)
-   **Ignore Prefixes**: Class prefixes to ignore (wp-, bs-, etc.)
-   **Detect Dynamic Patterns**: Smart detection of dynamic classes
-   **Create Backup**: Automatically backup before removal
-   **Parse SCSS**: Support for SCSS/SASS files

## Examples

### Finding Unused CSS

```css
/* styles.css */
.used-class {
	color: blue;
} /* ✅ Used in HTML */
.unused-class {
	color: red;
} /* ❌ Not found anywhere */
.btn-primary {
	padding: 10px;
} /* ⚠️ Might be dynamic (btn-${type}) */
```

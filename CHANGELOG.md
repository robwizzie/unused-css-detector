# Change Log

## [1.0.2] - 2025-10-16

### Fixed

-   Fixed pseudo-class and pseudo-element detection - now checks base selectors (`.button:hover` checks if `.button` exists)
-   Fixed multi-line comment position tracking for accurate underlining
-   Fixed hex color detection to handle any length (including 8-digit alpha colors)
-   Fixed detection of classes in template literals and variable assignments

### Added

-   "Ignore This Selector" feature - right-click in Problems panel or use hover action
-   Command to manage ignored selectors list
-   ES6 import statement following for component files
-   Detection of className variable assignments (e.g., `const cls = 'my-class'`)

## [1.0.1] - 2025-10-16

### Fixed

-   Fixed multi-line comment position tracking
-   Improved detection of classes in template literals
-   Fixed hex color detection (now handles any length)
-   Fixed className variable assignment detection

### Added

-   "Ignore This Selector" feature (right-click in Problems panel)
-   Hover action to ignore selectors
-   Command to manage ignored selectors
-   ES6 import following for component files

## [1.0.0] - 2025-10-13

### Added

-   Initial release

#!/usr/bin/env node

/**
 * Scale Audit Script
 *
 * Checks staged/changed files for 4px grid violations and !important usage.
 * Exit code 0 = pass, 1 = violations found.
 *
 * Usage:
 *   node scripts/scale-audit.js              # Check git-staged files
 *   node scripts/scale-audit.js --all        # Check all UI files
 *   node scripts/scale-audit.js file1 file2  # Check specific files
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// --- Configuration ---

// Even non-multiples of 4 that are explicitly accepted
const ACCEPTED_EVEN_EXCEPTIONS = new Set([2, 6, 10, 14, 18]);

// File patterns to check
const UI_FILE_GLOBS = [
  'libs/console/**/*.{ts,html,scss}',
  'libs/shared/**/*.{ts,html,scss}',
  'libs/landing/**/*.{ts,html,scss}',
  'apps/console/**/*.{ts,html,scss}',
  'apps/landing/**/*.{ts,html,scss}',
];

// Patterns exempt from checking (e.g., node_modules, dist)
const IGNORE_PATTERNS = [/node_modules/, /dist/, /\.spec\.ts$/];

// --- Violation patterns ---

// Arbitrary Tailwind pixel values: p-[12px], m-[7px], gap-[15px], w-[100px], h-[50px], text-[13px]
const ARBITRARY_PX_REGEX =
  /(?:^|[\s"'])(!?(?:p|px|py|pl|pr|pt|pb|m|mx|my|ml|mr|mt|mb|gap|w|h|min-w|min-h|max-w|max-h|text|top|right|bottom|left|inset)-\[(\d+)px\])/g;

// !important Tailwind prefixes
const IMPORTANT_REGEX = /(?:^|[\s"'])(![a-z][\w.-]*)/g;

// Hardcoded px values in SCSS/CSS (font-size: 13px, width: 15px, etc.)
const CSS_PX_REGEX =
  /(?:font-size|width|height|min-width|min-height|max-width|max-height|padding|margin|gap|top|right|bottom|left|line-height|border-radius):\s*(\d+)px/g;

// --- Helpers ---

function isOnGrid(value) {
  return value % 4 === 0;
}

function isAcceptedException(value) {
  return ACCEPTED_EVEN_EXCEPTIONS.has(value);
}

function isExemptValue(value) {
  // 1px borders are exempt from the grid
  return value === 1;
}

function shouldIgnore(filePath) {
  return IGNORE_PATTERNS.some((p) => p.test(filePath));
}

function getFilesToCheck(args) {
  if (args.includes('--all')) {
    // Check all UI files
    try {
      const result = execSync(
        `git ls-files -- ${UI_FILE_GLOBS.map((g) => '"' + g + '"').join(' ')}`,
        { encoding: 'utf8' }
      );
      return result
        .trim()
        .split('\n')
        .filter((f) => f.length > 0);
    } catch {
      return [];
    }
  }

  // Check specific files if provided
  const fileArgs = args.filter((a) => !a.startsWith('--'));
  if (fileArgs.length > 0) {
    return fileArgs.filter((f) => fs.existsSync(f));
  }

  // Default: check staged files
  try {
    const result = execSync('git diff --cached --name-only --diff-filter=ACM', {
      encoding: 'utf8',
    });
    return result
      .trim()
      .split('\n')
      .filter((f) => f.length > 0 && /\.(ts|html|scss)$/.test(f));
  } catch {
    // Fallback: check recently modified files
    try {
      const result = execSync('git diff --name-only HEAD', { encoding: 'utf8' });
      return result
        .trim()
        .split('\n')
        .filter((f) => f.length > 0 && /\.(ts|html|scss)$/.test(f));
    } catch {
      return [];
    }
  }
}

// --- Main ---

function auditFile(filePath) {
  const violations = [];
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmed = line.trim();

    // Skip comment lines (CSS/SCSS/TS)
    if (/^\s*(\/\/|\/?\*|\*)/.test(line)) return;

    // Check arbitrary Tailwind px values
    let match;
    ARBITRARY_PX_REGEX.lastIndex = 0;
    while ((match = ARBITRARY_PX_REGEX.exec(line)) !== null) {
      const fullClass = match[1];
      const value = parseInt(match[2], 10);
      if (!isExemptValue(value) && !isOnGrid(value) && !isAcceptedException(value)) {
        const severity = value % 2 !== 0 ? 'ERROR' : 'WARN';
        violations.push({
          line: lineNum,
          severity,
          message: `${fullClass} — ${value}px is not on 4px grid`,
          code: line.trim(),
        });
      }
    }

    // Check !important Tailwind prefixes
    IMPORTANT_REGEX.lastIndex = 0;
    while ((match = IMPORTANT_REGEX.exec(line)) !== null) {
      const fullClass = match[1];
      violations.push({
        line: lineNum,
        severity: 'ERROR',
        message: `${fullClass} — !important prefix banned. Use .icon-* classes for Material icons.`,
        code: line.trim(),
      });
    }

    // Check hardcoded CSS px values (only in .scss files)
    if (filePath.endsWith('.scss')) {
      CSS_PX_REGEX.lastIndex = 0;
      while ((match = CSS_PX_REGEX.exec(line)) !== null) {
        const value = parseInt(match[1], 10);
        if (!isExemptValue(value) && !isOnGrid(value) && !isAcceptedException(value)) {
          const severity = value % 2 !== 0 ? 'ERROR' : 'WARN';
          violations.push({
            line: lineNum,
            severity,
            message: `${match[0]} — ${value}px is not on 4px grid`,
            code: line.trim(),
          });
        }
      }
    }
  });

  return violations;
}

function main() {
  const args = process.argv.slice(2);
  const files = getFilesToCheck(args);

  if (files.length === 0) {
    // No files to check — pass silently
    process.exit(0);
  }

  let totalErrors = 0;
  let totalWarnings = 0;

  files.forEach((file) => {
    if (shouldIgnore(file)) return;

    const absPath = path.resolve(file);
    if (!fs.existsSync(absPath)) return;

    const violations = auditFile(absPath);
    if (violations.length === 0) return;

    console.log(`\n  ${file}`);
    violations.forEach((v) => {
      const icon = v.severity === 'ERROR' ? 'x' : '!';
      console.log(`    ${icon} L${v.line}: ${v.message}`);
      if (v.severity === 'ERROR') totalErrors++;
      else totalWarnings++;
    });
  });

  if (totalErrors > 0 || totalWarnings > 0) {
    console.log(
      `\n  Scale audit: ${totalErrors} error(s), ${totalWarnings} warning(s)\n`
    );
  }

  process.exit(totalErrors > 0 ? 1 : 0);
}

main();

#!/bin/bash
# Safety guard to prevent URL-based imports that cause React duplication
if grep -rnE "esm\.sh|unpkg\.com|skypack\.dev" . --exclude-dir=node_modules; then
    echo "CRITICAL ERROR: External URL imports detected in codebase."
    echo "All dependencies must be installed via package.json and bundled locally."
    exit 1
else
    echo "Codebase integrity check passed: No external ESM URLs found."
    exit 0
fi
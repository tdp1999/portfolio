#!/bin/bash
# design-bank-nudge.sh
# PreToolUse hook: reminds Claude to check the design bank when editing UI files.
# Non-blocking — injects additionalContext only.

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

if [ -z "$FILE_PATH" ]; then
  exit 0
fi

BANK_DIR="$CLAUDE_PROJECT_DIR/.context/design/bank"

# If bank doesn't exist yet, no nudge
if [ ! -d "$BANK_DIR" ]; then
  exit 0
fi

# Extract component name from path (e.g., button from button.component.html)
COMPONENT=$(basename "$FILE_PATH" | sed 's/\.component\.\(html\|scss\|ts\)$//' | sed 's/\.html$//' | sed 's/\.scss$//')

# Check for matching pattern file
PATTERN_FILE="$BANK_DIR/patterns/$COMPONENT.md"

if [ -f "$PATTERN_FILE" ]; then
  echo "{\"additionalContext\": \"Design bank has guidelines for '$COMPONENT'. Read .context/design/bank/patterns/$COMPONENT.md before making this edit.\"}"
else
  # Check if bank has any entries at all
  if [ -f "$BANK_DIR/index.md" ]; then
    echo "{\"additionalContext\": \"Design bank is available at .context/design/bank/index.md — check for relevant UI guidelines before editing.\"}"
  fi
fi

exit 0

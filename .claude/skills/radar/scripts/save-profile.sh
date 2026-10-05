#!/usr/bin/env bash
# Save a markdown file as the Radar workflow profile through the admin endpoint.
# Run it yourself in a terminal: it asks for the console password without echoing it, and the
# access token only lives in this process. Claude never runs this script.
#
#   save-profile.sh <profile.md>
set -euo pipefail
. "$(dirname "$0")/admin-session.sh"

file=${1:?usage: save-profile.sh <profile.md>}
[ -f "$file" ] || die "No such file: $file"

admin_login

body="$TMP/profile-body.json"
jq -Rs '{body: .}' "$file" > "$body"
admin_call PUT /radar/profile -H 'Content-Type: application/json' --data-binary "@$body"
is_2xx || die "Save failed: HTTP $STATUS $(head -c 500 "$RESP")"
jq '{updatedAt, chars: (.body | length)}' "$RESP"

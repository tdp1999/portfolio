#!/usr/bin/env bash
# Upload an Apify JSON export to a Radar source through the admin endpoint, creating the source
# first when it does not exist yet. Run it yourself in a terminal: it asks for the console
# password without echoing it, and the access token only lives in this process. Claude never
# runs this script.
#
#   upload-capture.sh <apify-posts.json> [source-url] [display-name]
#   defaults: https://www.facebook.com/mrgoonie, "Duy Nguyen (mrgoonie)"
set -euo pipefail
. "$(dirname "$0")/admin-session.sh"

file=${1:?usage: upload-capture.sh <apify-posts.json> [source-url] [display-name]}
source_url=${2:-https://www.facebook.com/mrgoonie}
display_name=${3:-Duy Nguyen (mrgoonie)}
[ -f "$file" ] || die "No such file: $file"
# Same normalisation as the API (all trailing slashes dropped), so the lookup below matches.
while [ "${source_url%/}" != "$source_url" ]; do source_url=${source_url%/}; done

admin_login

admin_call GET /radar/sources
is_2xx || die "Listing sources failed: HTTP $STATUS $(head -c 300 "$RESP")"
source_id=$(jq -r --arg u "$source_url" 'first(.[] | select(.url == $u) | .id) // empty' "$RESP")

if [ -z "$source_id" ]; then
  echo "Creating source $source_url"
  body="$TMP/source-body.json"
  jq -n --arg u "$source_url" --arg d "$display_name" '{url: $u, displayName: $d}' > "$body"
  admin_call POST /radar/sources -H 'Content-Type: application/json' --data-binary "@$body"
  is_2xx || die "Creating the source failed: HTTP $STATUS $(head -c 300 "$RESP")"
  source_id=$(jq -r '.id' "$RESP")
fi

echo "Uploading $(jq length "$file") post(s) to source $source_id"
admin_call POST "/radar/sources/$source_id/captures/upload" -F "file=@$file;type=application/json"
is_2xx || die "Upload failed: HTTP $STATUS $(head -c 500 "$RESP")"
jq '{runId, created, updated, skipped, failed, failures}' "$RESP"

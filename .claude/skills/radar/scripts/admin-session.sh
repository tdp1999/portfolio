# Sourced by the admin scripts (save-profile.sh, upload-capture.sh); not run on its own.
#
# admin_login                        asks for the console email and password (password not
#                                    echoed), logs in, keeps the access token in this process only
# admin_call METHOD PATH [curl args] sets STATUS and writes the response body to $RESP
# is_2xx                             true when the last STATUS is 2xx
#
# Neither the password nor the token is ever passed as a command argument, so they do not show
# up in the process list: jq reads the login fields from stdin, curl reads the Authorization
# header from stdin (--config -).
set -euo pipefail

die() { echo "$*" >&2; exit 1; }

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

[ -n "${RADAR_API_URL:-}" ] || die "RADAR_API_URL is not set (open a new terminal or 'source ~/.zshenv')."
BASE="${RADAR_API_URL%/}"
case "$BASE" in */api) ;; *) BASE="$BASE/api" ;; esac

is_2xx() { case "$STATUS" in 2??) return 0 ;; *) return 1 ;; esac; }

admin_login() {
  local email password
  IFS= read -r -p "Console email: " email
  IFS= read -r -s -p "Password: " password; echo
  RESP=$(mktemp "$TMP/resp.XXXXXX")
  STATUS=$(printf '%s\n%s\n' "$email" "$password" |
    jq -Rn '[inputs] as [$e, $p] | {email: $e, password: $p}' |
    curl -sS -o "$RESP" -w '%{http_code}' -X POST -H 'Content-Type: application/json' \
      --data-binary @- "$BASE/auth/login") || die "Login request failed (network)"
  unset password
  is_2xx || die "Login failed: HTTP $STATUS $(head -c 300 "$RESP")"
  TOKEN=$(jq -r '.accessToken // empty' "$RESP")
  rm -f "$RESP"
  [ -n "$TOKEN" ] || die "Login returned no access token"
}

admin_call() {
  local method=$1 path=$2
  shift 2
  RESP=$(mktemp "$TMP/resp.XXXXXX")
  STATUS=$(printf 'header = "Authorization: Bearer %s"\n' "$TOKEN" |
    curl -sS --config - -o "$RESP" -w '%{http_code}' -X "$method" "$@" "$BASE$path") ||
    die "Request to $path failed (network)"
}

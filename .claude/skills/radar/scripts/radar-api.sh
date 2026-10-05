#!/usr/bin/env bash
# Thin client for the Radar worker API. Reads RADAR_API_URL and RADAR_WORKER_TOKEN from the
# environment and never prints the token.
#
#   radar-api.sh check                     verify env + token (exit 1 with a message if not usable)
#   radar-api.sh profile                   print the workflow profile JSON
#   radar-api.sh claim <limit> <out.json>  claim items, save the response, print a one-line summary
#   radar-api.sh images <claim.json> <dir> download every image of the claimed items into <dir>
#                                          as <itemId>-<own|shared>-<n>.<ext>, then print a count
#   radar-api.sh submit <results.json>     submit {"results":[...]}; falls back to one-by-one on 413
set -euo pipefail

die() { echo "radar: $*" >&2; exit 1; }

# Scratch files (responses, request bodies) live here and go away when the script exits.
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

require_env() {
  [ -n "${RADAR_API_URL:-}" ] || die "RADAR_API_URL is not set. Add 'export RADAR_API_URL=https://<api-host>' to ~/.zshenv."
  [ -n "${RADAR_WORKER_TOKEN:-}" ] || die "RADAR_WORKER_TOKEN is not set. Add the export to ~/.zshenv (not ~/.zshrc: non-interactive shells skip it)."
  BASE="${RADAR_API_URL%/}"
  case "$BASE" in */api) ;; *) BASE="$BASE/api" ;; esac
}

is_2xx() { case "$STATUS" in 2??) return 0 ;; *) return 1 ;; esac; }

# call METHOD PATH [BODY_FILE] -> sets STATUS, writes the response body to $RESP.
# The Authorization header goes to curl through stdin (--config -), so the token never shows up
# in the process list.
call() {
  local method=$1 path=$2 body=${3:-}
  RESP=$(mktemp "$TMP/resp.XXXXXX")
  local args=(-sS --config - -o "$RESP" -w '%{http_code}' -X "$method")
  if [ -n "$body" ]; then args+=(-H 'Content-Type: application/json' --data-binary "@$body"); fi
  STATUS=$(printf 'header = "Authorization: Bearer %s"\n' "$RADAR_WORKER_TOKEN" | curl "${args[@]}" "$BASE$path") ||
    die "request to $path failed (network)"
}

cmd=${1:-}
case "$cmd" in
  check)
    require_env
    call GET /radar/work/profile
    case "$STATUS" in
      200) echo "radar: ok ($BASE)" ;;
      401) die "token rejected (401). Check RADAR_WORKER_TOKEN locally and RADAR_WORKER_TOKEN_HASH on the API." ;;
      *) die "unexpected HTTP $STATUS from $BASE/radar/work/profile: $(head -c 300 "$RESP")" ;;
    esac
    ;;

  profile)
    require_env
    call GET /radar/work/profile
    is_2xx || die "profile: HTTP $STATUS $(head -c 300 "$RESP")"
    cat "$RESP"
    ;;

  claim)
    require_env
    limit=${2:-10}; out=${3:?usage: claim <limit> <out.json>}
    body="$TMP/claim-body.json"; printf '{"step":"ANALYZE","limit":%d}' "$limit" > "$body"
    call POST /radar/work/claim "$body"
    is_2xx || die "claim: HTTP $STATUS $(head -c 300 "$RESP")"
    cp "$RESP" "$out"
    jq -r '"claimed \(.items | length) item(s), lease until \(.leaseExpiresAt // "-")"' "$out"
    ;;

  images)
    claim=${2:?usage: images <claim.json> <dir>}; dir=${3:?usage: images <claim.json> <dir>}
    mkdir -p "$dir"
    # One line per image: <itemId> <own|shared> <index> <url>. The file name carries the same
    # three parts, so each file maps back to its item and to the post or the shared post.
    # URLs come from scraped data, so only http(s) is allowed, redirects included, and size is capped.
    # jq runs first so a malformed claim file stops the script instead of reading as "no images".
    list=$(jq -r '.items[] | .id as $id
      | ((.images // []) | to_entries[] | "\($id) own \(.key) \(.value.url)"),
        ((.sharedPost.images // []) | to_entries[] | "\($id) shared \(.key) \(.value.url)")' "$claim") ||
      die "images: cannot read $claim"
    saved=0; skipped=0
    while read -r id part n url; do
      [ -n "$id" ] || continue
      file="$dir/$id-$part-$n"
      if ! ctype=$(curl -sSL --proto '=http,https' --proto-redir '=http,https' --max-redirs 3 \
        --max-filesize 15728640 --max-time 20 -o "$file" -w '%{content_type}' "$url" 2>/dev/null); then
        rm -f "$file"; echo "skip $id-$part-$n (download failed)"; skipped=$((skipped + 1)); continue
      fi
      case "$ctype" in
        image/jpeg*) ext=jpg ;;
        image/png*)  ext=png ;;
        image/webp*) ext=webp ;;
        image/gif*)  ext=gif ;;
        *) rm -f "$file"; echo "skip $id-$part-$n (not an image: ${ctype:-unknown})"; skipped=$((skipped + 1)); continue ;;
      esac
      mv "$file" "$file.$ext"; echo "$file.$ext"; saved=$((saved + 1))
    done <<< "$list"
    echo "images: $saved saved, $skipped skipped"
    ;;

  submit)
    require_env
    results=${2:?usage: submit <results.json>}
    call POST /radar/work/results "$results"
    if [ "$STATUS" = 413 ]; then
      # Body over the API limit: send each result on its own and merge the answers.
      merged='{"stored":0,"rejected":[]}'
      while read -r one; do
        single=$(mktemp "$TMP/single.XXXXXX"); printf '{"results":[%s]}' "$one" > "$single"
        call POST /radar/work/results "$single"
        if is_2xx; then
          merged=$(jq -c --slurpfile r "$RESP" '.stored += $r[0].stored | .rejected += $r[0].rejected' <<< "$merged")
        else
          id=$(jq -r '.itemId' <<< "$one")
          merged=$(jq -c --arg id "$id" --arg why "HTTP $STATUS $(head -c 200 "$RESP")" '.rejected += [{itemId:$id, reason:$why}]' <<< "$merged")
        fi
      done < <(jq -c '.results[]' "$results")
      echo "$merged"
    else
      is_2xx || die "submit: HTTP $STATUS $(head -c 500 "$RESP")"
      cat "$RESP"
    fi
    ;;

  *)
    sed -n '2,10p' "$0" | sed 's/^# \{0,1\}//'
    exit 1
    ;;
esac

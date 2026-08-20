#!/usr/bin/env bash
# Fail if this clone would push BrewTogether to the office GitHub account.
set -euo pipefail

ALLOWED_OWNER="casb444"
ALLOWED_REPO="brewtogether"
FORBIDDEN_OWNER="ArunSabariBalajiC"
OFFICE_EMAIL_DOMAIN="oapps.xyz"

fail() {
  echo "ERROR: $*" >&2
  echo "BrewTogether may only be maintained at github.com/${ALLOWED_OWNER}/${ALLOWED_REPO}" >&2
  exit 1
}

origin="$(git remote get-url origin 2>/dev/null || true)"
[[ -n "$origin" ]] || fail "No origin remote is configured."

case "$origin" in
  *"${FORBIDDEN_OWNER}"*)
    fail "origin points at the office GitHub account: $origin"
    ;;
  *"github.com/${ALLOWED_OWNER}/${ALLOWED_REPO}"*|*"github.com:${ALLOWED_OWNER}/${ALLOWED_REPO}"*)
    ;;
  *)
    fail "origin must be github.com/${ALLOWED_OWNER}/${ALLOWED_REPO}, got: $origin"
    ;;
esac

while read -r name url _; do
  [[ -n "${name:-}" ]] || continue
  case "$url" in
    *"${FORBIDDEN_OWNER}"*)
      fail "Remote '$name' points at the office GitHub account ($url). Remove it."
      ;;
  esac
done < <(git remote -v)

email="$(git config --local user.email 2>/dev/null || true)"
[[ -n "$email" ]] || fail "Set a personal local git user.email (do not use ${OFFICE_EMAIL_DOMAIN})."
case "$email" in
  *"@${OFFICE_EMAIL_DOMAIN}")
    fail "git user.email is the office address ($email)."
    ;;
esac

name="$(git config --local user.name 2>/dev/null || true)"
[[ "$name" != "$FORBIDDEN_OWNER" ]] || fail "git user.name is the office GitHub login."

if command -v gh >/dev/null 2>&1; then
  login="$(gh api user --jq .login 2>/dev/null || true)"
  if [[ -n "$login" && "$login" != "$ALLOWED_OWNER" ]]; then
    fail "Active GitHub CLI account is '$login'. Run: gh auth switch --user ${ALLOWED_OWNER}"
  fi
fi

echo "OK: personal GitHub only (${ALLOWED_OWNER}/${ALLOWED_REPO})"

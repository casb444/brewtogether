---
name: personal-github-only
description: Use when running git push, git remote add, gh repo create, publishing BrewTogether, changing remotes, or choosing a GitHub account. This repo belongs only on personal GitHub casb444 — never office account ArunSabariBalajiC or sabari@oapps.xyz.
---

# Personal GitHub only

BrewTogether is a **personal** project. It must exist only at:

`https://github.com/casb444/brewtogether`

## Hard rules

1. **Origin URL** must be `https://github.com/casb444/brewtogether.git` (SSH: `git@github.com:casb444/brewtogether.git`).
2. **Never** create, push, or add a remote under `ArunSabariBalajiC`.
3. **Never** use office git identity `ArunSabariBalajiC` / `sabari@oapps.xyz` in this repo.
4. **Never** run `git push` until `scripts/assert-personal-github.sh` exits 0.
5. **gh CLI** active account must be `casb444` before any GitHub write (`gh auth switch --user casb444`).

## Before every git push / repo create

```bash
scripts/assert-personal-github.sh
git remote -v
gh api user --jq .login   # must print casb444
```

If assert fails: stop. Do not push, do not add remotes, do not `gh repo create`.

## Required local clone config

```bash
git remote set-url origin https://github.com/casb444/brewtogether.git
git branch --set-upstream-to=origin/main main
git config --local user.name "casb444"
git config --local user.email "108050294+casb444@users.noreply.github.com"
git config --local core.hooksPath .githooks
```

Do **not** change global git `user.name` / `user.email` (other clones may be office work).

## Recovering a wrong-account publish

1. Confirm mapping: personal = `casb444`, office = `ArunSabariBalajiC`.
2. Push current `main` to `casb444/brewtogether`.
3. Point `branch.main.remote` at `origin` (personal), not an office remote.
4. `git remote remove` any office remote.
5. Delete or at least make **private** `ArunSabariBalajiC/brewtogether`. Deleting needs `gh auth refresh -h github.com -s delete_repo` on the office account, then `gh repo delete ArunSabariBalajiC/brewtogether --yes`, then `gh auth switch --user casb444`.
6. Leave `gh` active account as `casb444`.

## Red flags — STOP

| Excuse | Reality |
|--------|---------|
| "There's already an `arun` remote" | Remove it. One remote: personal origin. |
| "Global git user is office, so commits should match" | This repo uses **local** personal identity. |
| "I'll push then fix remotes" | Wrong remote publishes a public office copy. Assert first. |
| "gh is logged into both, so either is fine" | Active account + origin URL must both be `casb444`. |
| "Creating a backup on the office account" | No. Personal only. |

If origin, `gh api user`, or `user.email` looks office-related: do not push.

# 12 — Message log workflow

The `/mobile` build is driven **one screen per turn** by messages you drop in `INBOX.md` using `@mentions`. No full-repo scans, no context drift.

## The loop
1. **You**: append a new `## Next request` block to `INBOX.md` with the screen + `@mentions`.
2. **Send** any short chat message like "go" or "build next".
3. **Me**: read ONLY the mentioned paths, build/patch files under `/mobile/`, append an entry to `LOG.md`, clear the handled block from `INBOX.md`.
4. Repeat.

## Rules
- One screen per turn (or one focused fix).
- I never read files that aren't mentioned in the current request or listed in the target connections file.
- I never touch `/src` (web app) during a message-log turn.
- Every turn ends with a `LOG.md` entry: screen name, files created, files modified, deviations, TODOs.

## Files in this folder
- `INBOX.md` — your outgoing requests
- `LOG.md` — my completion log
- `MENTION_SYNTAX.md` — how `@` mentions expand
- `PROMPT_TEMPLATES.md` — copy-paste templates

## Start here
Open `PROMPT_TEMPLATES.md`, copy the "New screen" template, paste it into `INBOX.md`, fill in the blanks, send.

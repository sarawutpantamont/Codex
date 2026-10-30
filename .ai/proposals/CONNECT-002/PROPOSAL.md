# CONNECT-002: Claude reviewer and main protection
Status: awaiting explicit chat approval of protected tool additions. Live rules/tools unchanged.
Base: 82b19905f310abff3f7587e13334f922f3690fbe.
reviewer.patch SHA-256: 34b1ab279ae644f7bc430a6b473bc2cbcd41c4e6f4e1d3a0465043b03ffcf33b

## Proposed diff
+ tools/claude_review.py: opt-in isolated no-tool reviewer process, fixed claude-opus-5-5 request, 64 KiB packet cap, 180 second timeout and estimated $1 API-spend cap per invocation.
+ tests/test_claude_review.py: four offline regressions.
+ main-ruleset.json: proposed admin import payload, not applied.

The CLI adapter uses Pro/Max browser credentials; --bare is intentionally absent because current docs say it excludes subscription OAuth. Each invocation has fresh temporary cwd, no resumed session, safe/restricted mode, hooks disabled, no tool access/MCP/session persistence. It receives only an explicitly prepared synthetic/redacted evidence packet. It cannot browse sources or run checks; Master must supply current evidence. Requested and observed model IDs are recorded separately. A returned response is never automatic approval. Nonzero exits, invalid JSON, timeouts or unavailable models request isolated Codex fallback; the adapter itself does not dispatch Codex.

## Verification
Four mock-based tests passed, including separate working directories and failure-output suppression. CLI version 2.1.314 installed outside repository. Authentication and live model inference NOT verified. A cost cap is a client estimate, not a strict billing guarantee. Packet contents must be checked for private data before submission; code cannot prove redaction.

## Branch protection
GitHub connector returns 403 for branch-protection admin access; available connector has no admin-write endpoint. Rulesets read returned an empty list. Existing legacy protection is unknown. The proposed rules require PR, validate check from GitHub Actions (integration 15368), resolved conversations, no force push or deletion, and no bypass actors.

Required approving review count is 0 for the current single-owner repository: PRs are created under the same owner identity, which cannot approve its own PR. User manually decides merge. This does NOT technically enforce human-only merging when AI and user share the same GitHub identity. Strict separation requires a separate bot identity with no merge authority; do not claim this exists.

## User admin steps (no secret in chat)
1. Open https://github.com/sarawutpantamont/Codex/settings/rules . Use Import a ruleset if available, importing main-ruleset.json, or create a branch ruleset with the same settings.
2. Ensure enforcement Active and target main. Select existing GitHub Actions check validate. Do not restrict branch creation or all updates, which would prevent normal merging.
3. Save. Re-read rule API and inspect PR checks before declaring enabled. Do not merge PRs as part of setup.
4. If a second human maintainer is added, propose required approving count 1 as a separate reviewed change.

## Login and usage after approval
Use the installed CLI in a terminal with a credential directory outside any repository; run claude auth login and complete browser sign-in. Paste login codes only into the terminal, never chat. No credentials are stored in GitHub. Check auth status, then run a synthetic no-tools smoke call with the requested model before claiming connectivity. Installing or signing in on Windows does not authenticate this cloud runtime.
After applying the approved patch, Master calls `python tools/claude_review.py --role support --packet /safe/local/synthetic.json --claude-bin /path/to/claude` and separately opposition; then judge and auditor get the relevant completed reports. On failure Master uses the existing approved Codex fallback. No unattended workflow or automatic credential-bearing GitHub Action is added.

## Sources inspected 2026-10-30
- https://code.claude.com/docs/en/authentication
- https://code.claude.com/docs/en/headless
- https://code.claude.com/docs/en/cli-reference
- https://code.claude.com/docs/en/model-config
- https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets

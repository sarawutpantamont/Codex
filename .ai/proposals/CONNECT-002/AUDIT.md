# CONNECT-002 independent audit

Decision: revision_required (offline adapter); unverifiable (live Claude connectivity and ruleset activation).
Actual reviewer: GPT-6.1 Sol, independent auditor sub-agent. Scope: user-approved medium-risk opt-in no-tool adapter, approved patch identity below. No implementation edits performed.

## Findings

1. Medium: incomplete invalid-output fallback at tools/claude_review.py lines 36–46. A zero-exit runner returning JSON `[]` or `null` raises AttributeError; `{"modelUsage":null}` raises TypeError. Reproduced directly with injected offline runners. These are parseable JSON but invalid CLI result shapes, and the advertised unavailable/invalid-output fallback is bypassed. Validate result shape and nested modelUsage before accessing them, returning the same non-sensitive fallback response; add focused regressions. Such a fix changes the approved patch and requires the repository approval procedure before applying.
2. Limitation: observed model IDs are recorded, not enforced. A synthetic response naming `other-model` yields review_returned. Master must verify actual model identity before using any review for a preferred-model gate; this adapter output does not establish that the requested model ran. No claim of a real model call is supported by this audit.

## Diff Verification Log

Before: approved patch adds exactly tools/claude_review.py and tests/test_claude_review.py from /dev/null.
After: independently applied approved patch into a temporary directory; both generated files byte-match current implementation. Neither implementation file was changed during audit.

SHA-256:
- .ai/proposals/CONNECT-002/reviewer.patch: 34b1ab279ae644f7bc430a6b473bc2cbcd41c4e6f4e1d3a0465043b03ffcf33b
- tools/claude_review.py: 68eea5e82f56aafbb5af55606a780b8904633571eab881b3a693669f26dbaab4
- tests/test_claude_review.py: cb831922b3f41f13d207eb43cb53819d222b9ac89cdc1c720db2f33e064d7d6a

## Independently observed checks

- python -m unittest discover -s tests -v: 13 passed.
- python tools/orchestrator.py validate: valid true, tasks 1.
- Offline malformed-shape probes: reproduced finding 1 and model identity limitation.
- Resume: existing checkpoint differs from actual HEAD e0a9515f3d18f4f346edc889d93351f4120cc50c, branch work, and working/index changes. Audit certification is bounded to the two hashed adapter files and approved patch, not the broader staged installation.

## Isolation, credentials, and runtime boundary

Code review confirms fresh temporary cwd per invocation, fixed model request, timeout 180 seconds, explicit no-tools/empty MCP configuration, hooks disabled, slash commands and Chrome disabled, no resume/continue/session persistence, and 64 KiB UTF-8 packet cap. Inputs go via stdin and failure stdout/stderr are suppressed. No login, credential storage, or credential command-line argument is added. The subprocess inherits environment and user-home credentials; this is process/session separation, not an OS sandbox. Packet redaction remains caller responsibility. The $1 budget flag is an estimate, not proven billing enforcement.

Offline mocks verify argument construction and fresh directories, not actual enforcement by the installed Claude CLI. Authentication rejection by a network proxy is coordinator-supplied evidence, not independently repeated here; successful authentication, actual model availability, CLI isolation enforcement, and live inference remain unverifiable. The adapter requests a Codex fallback but never dispatches one automatically.

Ruleset file is a proposal only; no admin write or remote protection verification was performed by auditor. No branch protection or human-only merge guarantee is certified.

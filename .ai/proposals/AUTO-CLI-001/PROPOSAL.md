# AUTO-CLI-001 — Persist Claude Code CLI in Codex Cloud

Status: proposal only; live files and Cloud environment install script are unchanged.
Base main commit: c51c2059b0a09f0872cdc50a9a4c6658668f034f
Patch: AUTO-CLI-001.patch
Patch SHA-256: 32586f64a63d55ef22a4a198126350921db89f21412e05025afed67b6036ac93

## Problem and purpose
A fresh Cloud task from main reported that `claude` was absent. Earlier live Claude Opus 5.5 verification depended on a task-local installation, so new tasks cannot rely on the reviewer being available.

## Target and effect
The proposed repository patch adds `tools/install_claude_cli.sh`, which installs pinned Claude Code 2.1.314 to `/workspace/.claude-runtime` without sudo or printing credentials. It also updates `tools/claude_review.py` to resolve that workspace-local executable when `claude` is absent from PATH; an explicitly supplied binary keeps precedence. The existing fallback remains available when installation or execution fails.

After the approved patch is applied and merged by the owner, configure the published private Codex Cloud environment Install script to run `bash tools/install_claude_cli.sh` from the repository checkout, then republish. This environment-setting change is part of this proposal and requires the same explicit chat approval. The Personal vault token and allowlist stay as configured. No token is stored in GitHub or in the install script.

## Risk and verification
High risk: this changes credential-using reviewer execution and adds installation of a network-fetched CLI package in a reusable Cloud environment. Before a live commit, perform separate Support and Opposition reviews, a Judge Hook, and an independent QA auditor review. Review the exact diff, run `python tools/orchestrator.py validate` and all unit tests, verify explicit-binary precedence and fallback when CLI is absent. In a fresh Cloud task after environment republish, verify installed CLI version and a real isolated Claude Opus 5.5 adapter call. Never print token or raw OAuth data.

## Approval
Pending explicit user chat approval of proposal AUTO-CLI-001 and patch SHA-256 above. Do not apply live repository or Cloud environment changes before approval. Any substantive patch change requires renewed approval. The owner controls PR merge.

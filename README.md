# Master Auto-Orchestrator

User-initiated, GitHub-backed project memory and expert review template. No unattended AI service is installed.

## Start
Requires Git and Python 3.11+. No runtime packages or API keys are needed for the local CLI.
```sh
python tools/orchestrator.py validate
python -m unittest discover -s tests -v
python tools/orchestrator.py resume
```
In Codex, open this repository and ask: "Read AGENTS.md and the active checkpoint; continue the active task." For another project, copy the template to a new branch, preserve existing AGENTS.md, propose any rule integration first, and customize .ai/project.json with user approval. Run the checks above before opening a draft PR. The user merges; then start a new chat against the merged branch. Nothing changes an installed application automatically.

## Save or resume
```sh
python tools/orchestrator.py checkpoint --task TASK-001 --next "Run the synthetic parser regression"
python tools/orchestrator.py cycle TASK-001
```
`cycle` records one unsuccessful fix/review cycle; the second blocks the task. Counters persist across chats. Resume prints HEAD/branch/dirty paths and checkpoint mismatches, not private file contents. Save unfinished source changes separately in a safe local patch if necessary: a checkpoint does not preserve their bytes. Review and commit safe state files to a working branch for GitHub durability.

## Review and approval
See AGENTS.md, .ai/procedures and .ai/roles. Reports are evidence, not executable permissions. Use available isolated Codex subagents with GPT-6.1 Sol as the preferred reviewer; verify the actual model at runtime. This repository does not implement a standalone model dispatcher. CI performs structural checks and tests, never AI review or merging. Human review must enforce approval provenance and privacy; automated checks cannot prove either.

## GitHub setup
Enable Actions if desired, require the `validate` check and human review on main in repository rules, and disable bypass/auto-merge according to your account capabilities. These settings require a repository administrator and are not claimed configured here. The initial neutral README commit establishes main; implementation stays on a draft PR branch until the user merges.

Official further reading (not fetched or verified during this run):
- https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-pull-requests
- https://docs.github.com/en/actions/security-for-github-actions/security-guides/automatic-token-authentication

Each task represents exactly one stable defect/work item in this initial version. Keep its ID across chats; do not split or rename a defect to reset its count. Multi-defect task aggregation and concurrent CLI writers are not implemented; Master must serialize state writes. State records and chat approvals are not tamper-proof authorization.

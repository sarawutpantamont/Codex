#!/usr/bin/env bash
set -euo pipefail
# Run as the Codex Cloud environment install script with registry network access.
root=/workspace/.claude-runtime
npm install --prefix "$root" --no-audit --no-fund @anthropic-ai/claude-code@2.1.314
bin="$root/node_modules/@anthropic-ai/claude-code-linux-x64/claude"
test -x "$bin"
"$bin" --version
# The reviewer resolves this private, workspace-local executable when claude is absent from PATH.
# Authentication is supplied separately by the personal vault.

# CONNECT-002 revision 1: pending chat approval
Original approved patch was applied locally and matched exactly. Auditor withheld certification because malformed successful JSON can crash the adapter. Original live files have NOT received this revision.

Proposed revision patch SHA-256: 5d791fab267a0e7cf92b5fed11484c7c7cca75390c53683bf094db4bfef43d1c
Changes: reject non-object JSON; require modelUsage to identify only requested claude-opus-5-5; require nonempty review text; otherwise return fallback_required. Adds regression coverage. This strengthens requested-model verification as well as error handling. No credential or authentication changes.

After approval: apply revision-1.patch, run combined tests, re-audit exact bytes, publish implementation to PR #2, no merge. Claude token exchange remains blocked by runtime network policy; main protection remains admin prerequisite.

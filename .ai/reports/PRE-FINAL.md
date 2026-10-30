# Pre-Final: initial template
Risk: medium. Explicit user chat approval covers initial installation of uploaded design.

Acceptance evidence:
- Agent roles, risk gates, protected procedure approvals and project configuration exist.
- Local CLI validates task dependencies/ownership, records checkpoints and blocks after two failed cycles.
- Structural validation and nine synthetic regression tests pass on Python 3.11+ compatible code.
- Resume runs against a local neutral Git baseline; synthetic test demonstrates changed HEAD detection.
- Original pharmacy working tree was not edited.
- GitHub neutral README baseline and separate implementation branch exist; implementation draft PR is pending audit certification.

Limitations: no Claude integration; Codex fallback auditor used. Model routing is an agent instruction, not an installed external service. One stable task per defect; state writers serialized by Master. Approval/privacy enforced by human/agent review, not cryptographic access control. GitHub rules and CI remote results not yet verified. Local CLI checkpoints do not save dirty file bytes. Official further-reading links were not fetched. Exact implementation manifest is supplied by auditor report.

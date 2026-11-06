# JodJai Maintenance Agent

This on-demand Codex agent maintains JodJai only when the user requests a specific bug fix or feature improvement. It is an instruction set, not an unattended background service.

## Project

- Production: https://jodjai-daily-wallet.theprimecent.chatgpt.site/
- Site project ID: appgprj_6adb6e21a17481918f0bd037622f00f7
- Coordination repository: sarawutpantamont/Codex.
- Application source lives in the Site source repository, not currently in the Codex GitHub repository. Inspect the live Site and source revision before every task. Preserve the current public audience and URL. Never discard user changes or touch unrelated projects.
- The existing GitHub Actions workflow tests live production. It does not test a candidate patch. Before the first patch, implement or use GitHub Actions that test the exact candidate source or an isolated preview using synthetic data. Record the source fingerprint. Do not claim the production smoke test validates a candidate.

## Patch workflow

1. Record the requested change, current production version and source revision, acceptance criteria, relevant code and risks. Draw on MDC's bounded tasks, evidence, risk-based verification and independent review where available; never claim an independent review that did not happen. JodJai user instructions and the approval gate below override MDC project-specific rules.
2. Implement a focused patch in an isolated branch or checkout. Inspect data formats, localStorage, CSV, PIN and service-worker upgrade paths as relevant. Use synthetic fixtures for testing. Never intentionally clear user data. For data migrations, preserve original records until migration and recovery are verified, and provide a downloadable backup or other suitable protection before irreversible changes. Test the candidate against old data and, where relevant, verify that the previous supported version can still read it. A backup in the same browser may be lost when storage is cleared; do not promise absolute protection against device or browser data loss. If compatibility or recovery cannot be established, stop and explain the limitation before release.
3. Include a human-readable version log in the candidate source, identifying version, date and patch changes. Run appropriate local tests and GitHub Actions against the exact candidate revision. Wait for success and fix failures. The existing live production check alone is insufficient for the pre-deployment gate. Review the actual diff.
4. Present the proposed version, readable diff or changed files, impact on existing data and backups, test results, GitHub Actions run link, exact candidate fingerprint, target URL, and unresolved limitations in chat. Stop and wait until the user explicitly writes “Approve deployment” for that specific patch. Earlier approvals, elapsed time, CI success, or a generic acknowledgement do not authorize publication. If source, target, audience, or material verification results change, invalidate approval, rerun affected checks and present a new review. Preserve candidate and evidence while waiting.
5. After explicit approval, recheck that candidate fingerprint and successful CI match the reviewed patch and that the target URL and audience remain correct. Publish the exact reviewed version through the Sites workflow. Do not bypass branch protections or rejected approvals. The version log must already be included in the reviewed candidate; later changes require renewed review and approval.
6. Verify the deployed version, accessibility, affected behavior and appropriate upgrade/offline behavior on production without changing real user data. Report the version, URL, changes, evidence, limitations and any failed or incomplete step accurately. Continue safe diagnosis if publication or verification fails; never report success prematurely.

## Invoke

In a new Codex conversation, ask: “Read jodjai-agent/AGENT.md in sarawutpantamont/Codex and maintain JodJai. My requested patch is: …” No continuous service or scheduler is installed by this document.

## Local-only data safety — rev02.3

The user chose device-local data and separately retained backup files, without cloud accounts. Before and after release, compare Sites identity, origin and audience to jodjai-candidate/release-target.json and run release-guard.mjs. Do not silently update that target to accommodate a redirect. A hosting preflight observes current routing but cannot guarantee future provider behavior. Explain any such limit and halt if origin differs. Use jodjai-candidate/DATA-SAFETY.md for the exact protections and limits. Keep independently retained JSON backups; copies in browser storage alone do not survive browser deletion or arbitrary origin changes. Do not claim recovery of the user's already-missing historical data.

Candidate checks are now implemented in .github/workflows/jodjai-candidate.yml. Edit the candidate snapshot on a PR, reconcile it against the live Site source, run the exact candidate checks (including backups, prior-version upgrade, redirect simulation and cross-origin file restore) and report source hashes before requesting Approve deployment. Ensure the Site archive contains those exact tested dist bytes. The versioned application entry is app-rev023.js; app.js is retained as the legacy rev02.2 entry. Avoid reverting the versioned entry to a cached filename. The production smoke workflow is post-publication evidence, not the candidate gate.

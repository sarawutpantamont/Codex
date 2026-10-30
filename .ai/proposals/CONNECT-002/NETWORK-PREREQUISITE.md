# Claude runtime network prerequisite
Observed: token exchange rejected by runtime proxy; auth status remains logged out. Current enforced environment allowlist contains no Claude/Anthropic hosts. Browser sign-in alone does not authenticate the CLI.

Use the environment configuration UI to allow the official Claude authentication/inference destinations required by your account and review/apply that environment change. This session exposes diagnostic tools, not an environment-policy write tool. Do not bypass the proxy, disable TLS verification or paste OAuth codes/credentials into chat or GitHub. After policy becomes enforced, initiate a fresh login, complete it in terminal, check auth status, then perform a synthetic no-tool model smoke test.

References inspected: https://code.claude.com/docs/en/authentication and https://code.claude.com/docs/en/network-config . Runtime errors are not proof of successful authentication or unavailable account/model entitlement.

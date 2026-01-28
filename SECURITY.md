# Security Policy

## Supported Versions

Security fixes are applied to the `main` branch. This project is provided “as-is” and may evolve quickly; if you need a fixed version, pin to a commit.

## Reporting a Vulnerability

Please **do not** open public GitHub issues for security reports.

Instead, report vulnerabilities via one of the following:

- **GitHub Security Advisories** (preferred): use the repository’s “Report a vulnerability” flow.
- **Email**: contact the maintainers at the email address listed in the repository’s GitHub profile.

Include as much detail as possible:

- Affected area (file/endpoint/component)
- Reproduction steps / proof-of-concept
- Impact assessment (data exposure, RCE, auth bypass, etc.)
- Suggested remediation (if you have one)

We aim to acknowledge reports within **72 hours** and will coordinate a fix and disclosure timeline with you.

## Sensitive Data

- Do not submit real API keys, tokens, or private keys in issues/PRs.
- Use `.env.local.example` for documenting required environment variables.


# Contributing to LMSkills

Thanks for your interest in contributing!

## Code of Conduct

By participating, you agree to follow our Code of Conduct in `CODE_OF_CONDUCT.md`.

## Development setup

### Prerequisites

- Node.js 18+ and npm
- Clerk account (for auth)
- Convex account (for backend)

### Install

```bash
npm install
cp .env.local.example .env.local
```

### Run locally

In one terminal, start Convex:

```bash
npx convex dev
```

In another terminal, start Next.js:

```bash
npm run dev:frontend
```

Or run both together:

```bash
npm run dev
```

## Making changes

### Branching

- Create a branch from `main` (e.g. `yourname/short-description`).

### Style & quality

- Run `npm run lint` and `npm run build` before opening a PR.
- Keep changes focused and avoid unrelated refactors.

### Environment variables

- Never commit `.env*` files.
- If you introduce a new environment variable, add it to `.env.local.example` and document it in `README.md`.

## Pull requests

When opening a PR, please include:

- A short summary of what and why
- Screenshots for UI changes
- A test plan (how you verified it)

## Reporting bugs

Please use GitHub Issues and include:

- Steps to reproduce
- Expected vs actual behavior
- Logs/screenshots where helpful


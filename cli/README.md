# lmskills-cli

A command-line tool to easily fetch and install Claude skills from GitHub repositories.

## Installation

### Option 1: Use with npx (Recommended)

No installation required! Run directly:

```bash
npx lmskills-cli <command>
```

### Option 2: Install Globally

```bash
npm install -g lmskills-cli
```

Then use the shorter command:

```bash
lmskills <command>
```

## Usage

### Install a Skill

Install a skill from a GitHub subdirectory URL:

```bash
# Install locally (project-specific .claude directory)
lmskills install https://github.com/owner/repo/tree/main/path/to/skill

# Install globally (user-wide .claude directory)
lmskills install https://github.com/owner/repo/tree/main/path/to/skill --global
```

The CLI will:
- Parse the GitHub URL to identify the repository and subdirectory
- Download all files from that subdirectory
- Copy them to `.claude/skills/<skill-name>/` (local or global)
- Track the installation in metadata for easy management

### List Installed Skills

View all installed skills:

```bash
# List local skills
lmskills list

# List global skills
lmskills list --global
```

### Remove a Skill

Uninstall a skill:

```bash
# Remove local skill
lmskills remove <skill-name>

# Remove global skill
lmskills remove <skill-name> --global
```

Alias: `lmskills rm <skill-name>`

### Initialize a Repository Skill Manifest

Create a `skill.json` template in the current folder:

```bash
lmskills init
```

### Package a Repository Skill Version Locally

Create a tar artifact and register a local published version:

```bash
lmskills publish
```

Artifacts are written to `.lmskills/artifacts/` and metadata to `.lmskills/versions.json`.

### Publish to LMSkills Repository Backend

You can package and publish in one step:

```bash
# Authenticate once (opens browser + Clerk sign-in)
lmskills login

# Then publish
lmskills publish --remote --set-default
```

Repository publish requires:

- Browser auth via `lmskills login` (recommended)

`lmskills login` resolves the API URL in this order:

1. Local dev server auto-detect (`http://127.0.0.1:3000`, then `http://localhost:3000`)
2. Production default (`https://www.lmskills.ai`)

Optional settings:

- `--visibility public|unlisted` (used if repository skill must be auto-created)
- `--changelog \"...\"`
- `--no-set-default`

### List Local Published Versions

```bash
lmskills versions
```

## Examples

### Using npx (no installation required)

```bash
# Install a skill locally
npx lmskills-cli install https://github.com/anthropics/claude-code/tree/main/skills/example-skill

# Install a skill globally
npx lmskills-cli install https://github.com/user/skills/tree/main/my-awesome-skill -g

# List all local skills
npx lmskills-cli list

# Remove a skill
npx lmskills-cli rm example-skill
```

### Using global installation

```bash
# Install a skill locally
lmskills install https://github.com/anthropics/claude-code/tree/main/skills/example-skill

# Install a skill globally
lmskills install https://github.com/user/skills/tree/main/my-awesome-skill -g

# List all local skills
lmskills list

# Remove a skill
lmskills rm example-skill
```

## Directory Structure

### Local Installation
Skills are installed to `.claude/skills/` in your current working directory:

```
your-project/
└── .claude/
    └── skills/
        ├── .lmskills-metadata.json
        ├── skill-one/
        │   ├── SKILL.md
        │   └── ...
        └── skill-two/
            ├── SKILL.md
            └── ...
```

### Global Installation
Skills are installed to `.claude/skills/` in your home directory:

```
~/.claude/
└── skills/
    ├── .lmskills-metadata.json
    └── skill-name/
        ├── SKILL.md
        └── ...
```

## Metadata

The CLI maintains a `.lmskills-metadata.json` file in the skills directory to track:
- Skill name
- Source GitHub URL
- Installation timestamp
- Installation path
- Whether it's a global or local installation

## Requirements

- Node.js 18.0.0 or higher
- Git repository URL must be in the format: `https://github.com/owner/repo/tree/branch/path/to/skill`

## GitHub API

The CLI uses the GitHub API without authentication, which has rate limits:
- 60 requests per hour for unauthenticated requests
- To increase the limit, you can set a GitHub personal access token as an environment variable (feature coming soon)

## Development

To work on the CLI locally:

```bash
# Clone the repository
git clone https://github.com/your-org/lmskills.git
cd lmskills/cli

# Install dependencies
npm install

# Build the TypeScript code
npm run build

# Link for local testing
npm link

# Now you can use 'lmskills' command globally
lmskills --help
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

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

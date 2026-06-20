# pain-point-mining-agent

Agent skill for mining real transcripts, chat exports, support tickets, or session logs into weighted product pain points, PRD updates, and E2E requirements.

The core workflow treats every user message as a demand signal, clusters the signals, ranks them by `frequency x PM value`, and pins the golden pain point that should drive product build order.

Distribution is GitHub-first. The tracked installer is the primary install path; GitHub/npx commands are the fallback for environments that prefer npm tooling without requiring an npm registry package.

## Install

Local development install:

```bash
npm install -g .
pain-point-mining install --source local
```

This installs the bundled skill to both user skill homes by default:

- Codex: `~/.codex/skills/pain-point-mining`
- Claude: `~/.claude/skills/pain-point-mining`

GitHub install fallback:

```bash
npm install -g github:tombelieber/pain-point-mining-agent
pain-point-mining install --source npx
```

The tracked installer is the preferred public install path because it installs the CLI, installs the bundled skill, and gives a privacy-safe install count. The GitHub path is useful when `curl | sh` is blocked or when an agent wants to run through npm tooling without requiring an npm registry publish.

Tracked installer:

```bash
curl -fsSL https://pain-point-mining.tomtang3.ai/install.sh | sh
```

## Usage

```bash
pain-point-mining --help
pain-point-mining skill-path
pain-point-mining install
pain-point-mining install --target codex
pain-point-mining install --target claude
pain-point-mining install --target both
```

After install, use the skill in an agent session:

```text
Use $pain-point-mining to analyze this real chat history, rank the pain points by frequency x value, and update PRD/E2E docs.
```

## Agent Skill

This package includes a reusable Codex/Claude-style skill. The CLI installer installs it to both user skill homes by default.

Codex setup:

```bash
curl -fsSL https://pain-point-mining.tomtang3.ai/install.sh | sh
# or, after npm/GitHub install:
pain-point-mining install --target codex
```

Claude plugin install through [tomstack](https://github.com/tombelieber/tomstack):

```bash
claude plugin marketplace add tombelieber/tomstack
claude plugin install pain-point-mining-agent@tomstack
```

The CLI installer also supports direct Claude user-skill install:

```bash
pain-point-mining install --target claude
```

## Privacy-Safe Tracking

Tracking is limited to install-source measurement. It never sends transcript content, source links, local paths, usernames, repo paths, output filenames, stack traces, credentials, or API keys.

Allowed source values:

- `install_sh`
- `plugin`
- `npx`
- `local`

The CLI sends at most one ping per `source + version` using a local marker under `~/.pain-point-mining-agent`. Disable tracking with either env var:

```bash
DO_NOT_TRACK=1 pain-point-mining install
PAIN_POINT_MINING_DISABLE_TRACKING=1 pain-point-mining install
```

The Cloudflare Worker provides:

- `GET /install.sh` - serves the install script and counts downloads through Cloudflare analytics.
- `GET /ping?source=<source>&v=<version>` - privacy-safe install-source beacon.
- `GET /` - redirects to the repository.

## Development

```bash
npm run check
npm pack --dry-run --json
```

Worker check:

```bash
npm run --prefix infra/install-worker check
```

Deploy after Cloudflare credentials and domain ownership are available:

```bash
npm run --prefix infra/install-worker deploy
```

import {cpSync, existsSync, mkdirSync, rmSync} from 'node:fs'
import {homedir} from 'node:os'
import {dirname, join} from 'node:path'
import {fileURLToPath} from 'node:url'

const targets = {
  codex: () => join(resolveHome(), '.codex', 'skills', 'pain-point-mining'),
  claude: () => join(resolveHome(), '.claude', 'skills', 'pain-point-mining'),
}

export async function installSkill({sourceDir, target = 'both', dryRun = false} = {}) {
  const selectedTargets = resolveTargets(target)
  const sourcePath = fileURLToPath(sourceDir)

  if (!existsSync(sourcePath)) {
    throw new Error(`skill source not found: ${sourcePath}`)
  }

  const installed = []
  for (const selected of selectedTargets) {
    const destination = targets[selected]()
    installed.push({target: selected, destination})

    if (dryRun) continue

    mkdirSync(dirname(destination), {recursive: true})
    rmSync(destination, {recursive: true, force: true})
    cpSync(sourcePath, destination, {recursive: true})
  }

  return installed
}

export function resolveTargets(target) {
  if (target === 'both') return ['codex', 'claude']
  if (target in targets) return [target]
  throw new Error(`unsupported target: ${target}`)
}

function resolveHome() {
  return process.env.PAIN_POINT_MINING_HOME ?? process.env.HOME ?? homedir()
}

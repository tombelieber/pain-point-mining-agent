#!/usr/bin/env node
import {installSkill} from '../lib/skill-install.mjs'
import {readPackageVersion, sendInstallPing} from '../lib/install-tracking.mjs'

const version = readPackageVersion(new URL('../package.json', import.meta.url))
const args = process.argv.slice(2)

main(args).catch((error) => {
  console.error(`error: ${error.message}`)
  process.exit(1)
})

async function main(argv) {
  const command = argv[0]

  if (!command || command === '--help' || command === '-h') {
    printHelp()
    return
  }

  if (command === '--version' || command === '-v') {
    console.log(version)
    return
  }

  if (command === 'skill-path') {
    console.log(new URL('../skills/pain-point-mining', import.meta.url).pathname)
    return
  }

  if (command === 'ping') {
    const options = parseOptions(argv.slice(1))
    const source = options.source ?? 'local'
    const result = await sendInstallPing({source, version})
    console.log(result.status)
    return
  }

  if (command === 'install') {
    const options = parseOptions(argv.slice(1))
    const target = options.target ?? 'both'
    const source = options.source ?? 'local'
    const dryRun = Boolean(options['dry-run'])
    const installed = await installSkill({
      sourceDir: new URL('../skills/pain-point-mining', import.meta.url),
      target,
      dryRun,
    })

    if (!dryRun) {
      await sendInstallPing({source, version})
    }

    for (const item of installed) {
      console.log(`${dryRun ? 'would install' : 'installed'} ${item.target}: ${item.destination}`)
    }
    return
  }

  throw new Error(`unknown command: ${command}`)
}

function parseOptions(argv) {
  const options = {}
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (!arg.startsWith('--')) {
      throw new Error(`unexpected argument: ${arg}`)
    }

    const name = arg.slice(2)
    if (name === 'dry-run') {
      options[name] = true
      continue
    }

    const value = argv[index + 1]
    if (!value || value.startsWith('--')) {
      throw new Error(`missing value for --${name}`)
    }
    options[name] = value
    index += 1
  }
  return options
}

function printHelp() {
  console.log(`pain-point-mining ${version}

Usage:
  pain-point-mining --version
  pain-point-mining skill-path
  pain-point-mining ping --source <install_sh|plugin|npx|local>
  pain-point-mining install [--target codex|claude|both] [--source install_sh|plugin|npx|local] [--dry-run]

Tracking:
  Sends at most one privacy-safe ping per source+version.
  Disable with DO_NOT_TRACK=1 or PAIN_POINT_MINING_DISABLE_TRACKING=1.
`)
}

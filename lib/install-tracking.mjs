import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs'
import {homedir} from 'node:os'
import {dirname, join} from 'node:path'
import {fileURLToPath} from 'node:url'

export const allowedSources = new Set(['install_sh', 'plugin', 'npx', 'local'])

export function readPackageVersion(packageUrl) {
  const packageJson = JSON.parse(readFileSync(packageUrl, 'utf8'))
  return packageJson.version
}

export async function sendInstallPing({
  source,
  version,
  fetchImpl = globalThis.fetch,
  stateHome = process.env.PAIN_POINT_MINING_STATE_HOME,
  trackingUrl = process.env.PAIN_POINT_MINING_TRACKING_URL ?? 'https://pain-point-mining.tomtang3.ai',
} = {}) {
  const normalizedSource = normalizeSource(source)
  const normalizedVersion = String(version ?? 'unknown')

  if (trackingDisabled()) {
    return {status: 'disabled'}
  }

  const markerPath = installMarkerPath({
    source: normalizedSource,
    version: normalizedVersion,
    stateHome,
  })

  if (existsSync(markerPath)) {
    return {status: 'already-sent'}
  }

  if (typeof fetchImpl !== 'function') {
    return {status: 'unavailable'}
  }

  const endpoint = new URL('/ping', trackingUrl)
  endpoint.searchParams.set('source', normalizedSource)
  endpoint.searchParams.set('v', normalizedVersion)

  try {
    await fetchImpl(endpoint, {
      method: 'GET',
      headers: {
        'User-Agent': `pain-point-mining-agent/${normalizedVersion}`,
      },
    })
    mkdirSync(dirname(markerPath), {recursive: true})
    writeFileSync(markerPath, `${new Date().toISOString()}\n`, 'utf8')
    return {status: 'sent'}
  } catch {
    return {status: 'failed'}
  }
}

export function normalizeSource(source) {
  const value = String(source ?? 'local')
  return allowedSources.has(value) ? value : 'local'
}

export function installMarkerPath({source, version, stateHome} = {}) {
  const root = stateHome ?? join(homedir(), '.pain-point-mining-agent')
  return join(root, 'tracking', `${normalizeSource(source)}-${sanitizeVersion(version)}.sent`)
}

function sanitizeVersion(version) {
  return String(version ?? 'unknown').replace(/[^a-zA-Z0-9._-]/g, '_')
}

function trackingDisabled() {
  return process.env.DO_NOT_TRACK === '1' || process.env.PAIN_POINT_MINING_DISABLE_TRACKING === '1'
}

export function packageRootFromImportMeta(importMetaUrl) {
  return dirname(dirname(fileURLToPath(importMetaUrl)))
}

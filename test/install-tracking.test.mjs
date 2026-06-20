import {mkdtempSync, readFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import test from 'node:test'
import assert from 'node:assert/strict'
import {installMarkerPath, normalizeSource, sendInstallPing} from '../lib/install-tracking.mjs'

test('normalizes unknown sources to local', () => {
  assert.equal(normalizeSource('unknown'), 'local')
  assert.equal(normalizeSource('plugin'), 'plugin')
})

test('sends privacy-safe source and version once', async () => {
  const stateHome = mkdtempSync(join(tmpdir(), 'ppm-track-'))
  const seen = []
  const fetchImpl = async (url, init) => {
    seen.push({url: String(url), init})
    return new Response('ok')
  }

  const first = await sendInstallPing({
    source: 'npx',
    version: '0.1.0',
    fetchImpl,
    stateHome,
    trackingUrl: 'https://example.test',
  })
  const second = await sendInstallPing({
    source: 'npx',
    version: '0.1.0',
    fetchImpl,
    stateHome,
    trackingUrl: 'https://example.test',
  })

  assert.equal(first.status, 'sent')
  assert.equal(second.status, 'already-sent')
  assert.equal(seen.length, 1)
  assert.equal(seen[0].url, 'https://example.test/ping?source=npx&v=0.1.0')
  assert.equal(seen[0].init.headers['User-Agent'], 'pain-point-mining-agent/0.1.0')
  assert.match(readFileSync(installMarkerPath({source: 'npx', version: '0.1.0', stateHome}), 'utf8'), /T/)
})

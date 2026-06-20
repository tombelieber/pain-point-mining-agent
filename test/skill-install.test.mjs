import {existsSync, mkdtempSync, readFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import test from 'node:test'
import assert from 'node:assert/strict'
import {installSkill, resolveTargets} from '../lib/skill-install.mjs'

test('resolves supported install targets', () => {
  assert.deepEqual(resolveTargets('codex'), ['codex'])
  assert.deepEqual(resolveTargets('claude'), ['claude'])
  assert.deepEqual(resolveTargets('both'), ['codex', 'claude'])
})

test('installs the skill into both user skill homes by default', async () => {
  const home = mkdtempSync(join(tmpdir(), 'ppm-home-'))
  const oldHome = process.env.PAIN_POINT_MINING_HOME
  process.env.PAIN_POINT_MINING_HOME = home

  try {
    const installed = await installSkill({
      sourceDir: new URL('../skills/pain-point-mining', import.meta.url),
    })

    const codexDestination = join(home, '.codex', 'skills', 'pain-point-mining', 'SKILL.md')
    const claudeDestination = join(home, '.claude', 'skills', 'pain-point-mining', 'SKILL.md')
    assert.deepEqual(installed.map((item) => item.target), ['codex', 'claude'])
    assert.equal(existsSync(codexDestination), true)
    assert.equal(existsSync(claudeDestination), true)
    assert.match(readFileSync(codexDestination, 'utf8'), /name: pain-point-mining/)
    assert.match(readFileSync(claudeDestination, 'utf8'), /name: pain-point-mining/)
  } finally {
    if (oldHome === undefined) {
      delete process.env.PAIN_POINT_MINING_HOME
    } else {
      process.env.PAIN_POINT_MINING_HOME = oldHome
    }
  }
})

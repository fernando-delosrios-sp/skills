import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import { runUpdate } from '../lib/update.mjs';

function recordingDeps() {
  const calls = [];
  const record = (name, impl) =>
    mock.fn(async (...args) => {
      calls.push({ name, args });
      return impl ? impl(...args) : [];
    });

  return {
    calls,
    deps: {
      syncAllSkills: record('syncAllSkills', async () => []),
      applyStaticOverlays: record('applyStaticOverlays', async () => []),
      hasOverlay: record('hasOverlay', async () => false),
      auditAllSkills: record('auditAllSkills', async () => []),
      restoreAllSkills: record('restoreAllSkills', async () => []),
      prepareOverlays: record('prepareOverlays', async () => []),
      printSyncSummary: mock.fn(() => {}),
      printOverlayApplyPrompt: mock.fn(() => {}),
    },
  };
}

describe('runUpdate default happy path call order', () => {
  it('runs sync then static then audit then restore then prepare with runStatic false', async () => {
    const { calls, deps } = recordingDeps();
    deps.auditAllSkills = mock.fn(async () => {
      calls.push({ name: 'auditAllSkills', args: [] });
      return [{ skill: 'x', route: 'remerge' }];
    });
    deps.restoreAllSkills = mock.fn(async () => {
      calls.push({ name: 'restoreAllSkills', args: [] });
      return [];
    });

    await runUpdate({ deps });

    const names = calls.map((c) => c.name);
    assert.deepEqual(names, [
      'syncAllSkills',
      'applyStaticOverlays',
      'auditAllSkills',
      'restoreAllSkills',
      'prepareOverlays',
    ]);
    const prepareCall = calls.find((c) => c.name === 'prepareOverlays');
    assert.equal(prepareCall.args[0].runStatic, false);
  });
});

describe('runUpdate dry run skips audit restore and prepare', () => {
  it('passes dryRun to sync and static and skips later stages', async () => {
    const { calls, deps } = recordingDeps();
    await runUpdate({ dryRun: true, deps });

    const names = calls.map((c) => c.name);
    assert.deepEqual(names, ['syncAllSkills', 'applyStaticOverlays']);
    assert.equal(calls[0].args[0].dryRun, true);
    assert.equal(calls[1].args[0].dryRun, true);
  });
});

describe('runUpdate skip sync still runs static overlay', () => {
  it('does not call sync when skipSync is true', async () => {
    const { calls, deps } = recordingDeps();
    await runUpdate({ skipSync: true, deps });

    const names = calls.map((c) => c.name);
    assert.equal(names.includes('syncAllSkills'), false);
    assert.equal(names.includes('applyStaticOverlays'), true);
  });
});

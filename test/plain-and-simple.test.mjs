import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { promisify } from 'node:util';
import { ROOT } from '../lib/index.mjs';
import { parseFrontmatter } from '../lib/skill-md.mjs';
import { expectedContentForPath } from '../lib/overlay-yaml.mjs';

const execFileAsync = promisify(execFile);

const skillDir = resolve(ROOT, 'skills/productivity/plain-and-simple');
const skillMdPath = resolve(skillDir, 'SKILL.md');
const openaiPath = resolve(skillDir, 'agents/openai.yaml');
const manifestPath = resolve(ROOT, 'skills/productivity/skills.json');
const glossaryPath = resolve(ROOT, 'openspec/specs/ubiquitous-language/spec.md');
const cavemanDir = 'skills/productivity/caveman';

describe('Skill directory contains SKILL.md', () => {
  it('SKILL.md exists at skills/productivity/plain-and-simple/SKILL.md', async () => {
    await access(skillMdPath);
  });
});

describe('Description present without disable-model-invocation', () => {
  it('frontmatter has name, description, and no disable-model-invocation', async () => {
    const content = await readFile(skillMdPath, 'utf8');
    const fm = parseFrontmatter(content);
    assert.ok(fm, 'expected YAML frontmatter');
    assert.equal(fm.name, 'plain-and-simple');
    assert.equal(typeof fm.description, 'string');
    assert.ok(String(fm.description).trim().length > 0);
    assert.notEqual(fm['disable-model-invocation'], true);
    assert.equal(fm['disable-model-invocation'], undefined);
  });
});

describe('Adaptive budget encoded in SKILL.md', () => {
  it('requires conclusion first and shortest complete answer without a fixed cap', async () => {
    const body = await skillBody();
    assert.match(body, /lead with the conclusion/i);
    assert.match(body, /shortest complete answer/i);
    assert.match(body, /no fixed word or sentence/i);
    assert.doesNotMatch(body, /\b\d+\s+words?\b/i);
    assert.doesNotMatch(body, /\b\d+\s+sentences?\b/i);
  });
});

describe('Warnings and code stay complete', () => {
  it('scopes user-facing messages and keeps code, errors, and warnings exact', async () => {
    const body = await skillBody();
    assert.match(body, /user-facing messages/i);
    assert.match(body, /explanations/);
    assert.match(body, /questions/);
    assert.match(body, /progress updates/);
    assert.match(body, /handoffs/);
    assert.match(body, /code blocks/i);
    assert.match(body, /exact errors/i);
    assert.match(body, /irreversible-action warnings/i);
  });
});

describe('Optional examples', () => {
  it('allows examples only when they clarify faster than more prose', async () => {
    const body = await skillBody();
    assert.match(body, /clarifies faster than more prose/i);
    assert.match(body, /not require an example on every answer/i);
  });
});

describe('Formatting is adaptive not mandatory structure', () => {
  it('describes minimal adaptive formatting and forbids always-bullets and always-headings', async () => {
    const body = await skillBody();
    assert.match(body, /minimal adaptive formatting/i);
    assert.match(body, /prose for one idea/i);
    assert.match(body, /do not always use bullets/i);
    assert.match(body, /do not always use headings/i);
  });
});

describe('Gloss is conditional', () => {
  it('keeps exact terms and glosses only when unfamiliar', async () => {
    const body = await skillBody();
    assert.match(body, /exact technical terms/i);
    assert.match(body, /brief gloss/i);
    assert.match(body, /unfamiliar/i);
  });
});

describe('No expansion footer', () => {
  it('stops when complete, expands only when asked, and forbids a standing footer', async () => {
    const body = await skillBody();
    assert.match(body, /stop when (the answer is )?complete/i);
    assert.match(body, /expand only when the user asks/i);
    assert.match(body, /standing expansion footer/i);
  });
});

describe('Productivity manifest lists plain-and-simple without source', () => {
  it('lists a local-only plain-and-simple entry', async () => {
    const doc = JSON.parse(await readFile(manifestPath, 'utf8'));
    const entry = doc.skills.find((s) => s.name === 'plain-and-simple');
    assert.ok(entry, 'expected manifest entry');
    assert.equal('source' in entry, false);
  });
});

describe('openai.yaml matches generator rules', () => {
  it('committed openai.yaml equals expectedContentForPath', async () => {
    const derived = await expectedContentForPath(
      { name: 'plain-and-simple', category: 'productivity' },
      'agents/openai.yaml',
      { skillDir }
    );
    assert.notEqual(derived, null);
    const actual = await readFile(openaiPath, 'utf8');
    assert.equal(actual, derived);
  });
});

describe('Caveman tree unchanged', () => {
  it('skills/productivity/caveman/ is unmodified vs git HEAD', async () => {
    const { stdout: diff } = await execFileAsync(
      'git',
      ['diff', 'HEAD', '--', cavemanDir],
      { cwd: ROOT }
    );
    assert.equal(diff, '');
    const { stdout: status } = await execFileAsync(
      'git',
      ['status', '--porcelain', '--', cavemanDir],
      { cwd: ROOT }
    );
    assert.equal(status, '');
  });
});

describe('plain-and-simple definition', () => {
  it('glossary has Term: plain-and-simple', async () => {
    const glossary = await readFile(glossaryPath, 'utf8');
    assert.match(glossary, /^### Term: plain-and-simple$/m);
    const block = termBlock(glossary, 'plain-and-simple');
    assert.match(block, /model-invoked communication mode/i);
    assert.match(block, /productivity skill name/i);
    assert.match(block, /caveman/i);
    assert.match(block, /terse/i);
    assert.match(block, /ultra-compressed/i);
    assert.match(block, /token-saving mode/i);
  });
});

describe('shortest complete answer definition', () => {
  it('glossary has Term: shortest complete answer', async () => {
    const glossary = await readFile(glossaryPath, 'utf8');
    assert.match(glossary, /^### Term: shortest complete answer$/m);
    const block = termBlock(glossary, 'shortest complete answer');
    assert.match(block, /adaptive size bound/i);
    assert.doesNotMatch(block, /\b\d+\s+words?\b/i);
  });
});

describe('minimal adaptive formatting definition', () => {
  it('glossary has Term: minimal adaptive formatting', async () => {
    const glossary = await readFile(glossaryPath, 'utf8');
    assert.match(glossary, /^### Term: minimal adaptive formatting$/m);
    const block = termBlock(glossary, 'minimal adaptive formatting');
    assert.match(block, /least structure/i);
  });
});

async function skillBody() {
  const content = await readFile(skillMdPath, 'utf8');
  const parts = content.split(/^---\s*$/m);
  return parts.slice(2).join('---');
}

function termBlock(glossary, name) {
  const start = glossary.indexOf(`### Term: ${name}\n`);
  assert.ok(start >= 0, `missing term ${name}`);
  const rest = glossary.slice(start);
  const next = rest.indexOf('\n### Term:', 1);
  return next === -1 ? rest : rest.slice(0, next);
}

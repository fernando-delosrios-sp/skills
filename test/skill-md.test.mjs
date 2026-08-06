import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseFrontmatter } from '../lib/skill-md.mjs';

describe('parseFrontmatter', () => {
  it('parses valid frontmatter', () => {
    const content = `---
name: git-commit
description: Session-scoped git commit helper.
---

# Git commit
`;
    assert.deepEqual(parseFrontmatter(content), {
      name: 'git-commit',
      description: 'Session-scoped git commit helper.',
    });
  });

  it('returns null when delimiters are missing', () => {
    assert.equal(parseFrontmatter('# No frontmatter'), null);
  });

  it('returns null when YAML is invalid', () => {
    const content = `---
name: [unclosed
---
`;
    assert.equal(parseFrontmatter(content), null);
  });
});

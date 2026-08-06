import { parse } from 'yaml';

export function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  try {
    return parse(match[1]);
  } catch {
    return null;
  }
}

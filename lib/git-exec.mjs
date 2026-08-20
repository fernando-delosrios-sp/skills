import { execFileSync } from 'node:child_process';

export function assertSafeGitRef(ref) {
  if (typeof ref !== 'string' || ref.length === 0) {
    throw new Error('git ref must be a non-empty string');
  }
  if (ref.startsWith('-') || /[\s:;`$"'\\]/.test(ref)) {
    throw new Error(`unsafe git ref: ${ref}`);
  }
}

export function runGit(args, { cwd, encoding = 'utf8', timeout, stdio } = {}) {
  if (!Array.isArray(args) || args.some((a) => typeof a !== 'string')) {
    throw new Error('runGit requires a string argument array');
  }
  return execFileSync('git', args, {
    cwd,
    encoding: encoding === 'buffer' ? undefined : encoding,
    timeout,
    stdio: stdio ?? ['pipe', 'pipe', 'pipe'],
    shell: false,
  });
}

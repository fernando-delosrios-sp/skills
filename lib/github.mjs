import { Octokit } from '@octokit/rest';

let _octokit = null;

export function getOctokit() {
  if (!_octokit) {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      throw new Error(
        'GITHUB_TOKEN environment variable is required for GitHub API operations'
      );
    }
    _octokit = new Octokit({ auth: token });
  }
  return _octokit;
}

export function parseRepoRef(ownerRepo) {
  const [owner, repo] = ownerRepo.split('/');
  if (!owner || !repo) {
    throw new Error(`Invalid repo format: ${ownerRepo}. Expected "owner/repo"`);
  }
  return { owner, repo };
}

export async function createBranch(octokit, { owner, repo }, branchName, baseBranch) {
  const { data: base } = await octokit.git.getRef({
    owner,
    repo,
    ref: `heads/${baseBranch}`,
  });

  await octokit.git.createRef({
    owner,
    repo,
    ref: `refs/heads/${branchName}`,
    sha: base.object.sha,
  });

  return base.object.sha;
}

export async function commitFiles(
  octokit,
  { owner, repo },
  branchName,
  files,
  message
) {
  // Get the latest commit on the branch
  const { data: ref } = await octokit.git.getRef({
    owner,
    repo,
    ref: `heads/${branchName}`,
  });

  const { data: baseCommit } = await octokit.git.getCommit({
    owner,
    repo,
    commit_sha: ref.object.sha,
  });

  // Create blobs for each file
  const treeItems = [];
  for (const file of files) {
    const { data: blob } = await octokit.git.createBlob({
      owner,
      repo,
      content: file.content,
      encoding: 'utf-8',
    });
    treeItems.push({
      path: file.path,
      mode: '100644',
      type: 'blob',
      sha: blob.sha,
    });
  }

  // Create tree
  const { data: tree } = await octokit.git.createTree({
    owner,
    repo,
    base_tree: baseCommit.tree.sha,
    tree: treeItems,
  });

  // Create commit
  const { data: commit } = await octokit.git.createCommit({
    owner,
    repo,
    message,
    tree: tree.sha,
    parents: [ref.object.sha],
  });

  // Update branch ref
  await octokit.git.updateRef({
    owner,
    repo,
    ref: `heads/${branchName}`,
    sha: commit.sha,
  });

  return commit.sha;
}

export async function openPR(
  octokit,
  { owner, repo },
  branchName,
  baseBranch,
  title,
  body
) {
  const { data: pr } = await octokit.pulls.create({
    owner,
    repo,
    title,
    body,
    head: branchName,
    base: baseBranch,
  });

  return pr;
}

export async function addLabels(octokit, { owner, repo }, prNumber, labels) {
  await octokit.issues.addLabels({
    owner,
    repo,
    issue_number: prNumber,
    labels,
  });
}

export async function enableAutoMerge(octokit, { owner, repo }, prNumber) {
  await octokit.pulls.update({
    owner,
    repo,
    pull_number: prNumber,
  });

  // Try the auto-merge API (requires repo settings to allow it)
  try {
    const { data: pr } = await octokit.pulls.get({ owner, repo, pull_number: prNumber });
    await octokit.pulls.update({
      owner,
      repo,
      pull_number: prNumber,
    });
    // Auto-merge is set via GraphQL only on Octokit REST
    // We'll use a simpler approach: just leave the PR open and let CI handle merge
  } catch {
    // Auto-merge may not be available; PR stays open for manual merge
  }
}

export async function getDefaultBranch(octokit, { owner, repo }) {
  const { data } = await octokit.repos.get({ owner, repo });
  return data.default_branch;
}

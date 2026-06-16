# Agent Instructions

This is a skills repo for `npx skills add fernando-delosrios-sp/skills`.

Every skill lives under `skills/<category>/<name>/SKILL.md` and is listed in `skills.yaml`.

## skills.yaml

```yaml
skills:
  - name: my-skill
    category: engineering
    custom: true          # your own skill

  - name: foreign-skill
    category: productivity
    source:
      repo: owner/repo
      path: skills/foreign-skill
    custom: false         # upstream is canonical, auto-updates

  - name: customized-foreign
    category: engineering
    source:
      repo: owner/repo
      path: skills/foo
    custom: true          # forked; sync opens a review PR
```

## Commands

```bash
# Import one foreign skill
npm run import -- --repo owner/repo --path skills/name --category my-category

# Import all discoverable skills from a repo
npm run import -- --repo owner/repo --category my-category --all

# Validate skills.yaml and all SKILL.md files
npm run validate

# Sync foreign skills (applies updates locally; opens PRs when run in GitHub Actions)
npm run sync

# Install this repo's skills into your local agents
npm run install-self
```

## Rules

- Skill `name` must be unique across the whole repo.
- Categories are free-form strings used only for filesystem layout.
- `npm run sync` updates the working tree directly when run locally; review the changes before committing.
- In GitHub Actions, sync never overwrites `custom: true` skills automatically; it opens a PR for manual review.
- In GitHub Actions, sync auto-merges updates for `custom: false` skills if CI validation passes.
- Run `npm run validate` before committing.

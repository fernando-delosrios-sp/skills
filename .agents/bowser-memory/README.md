# Bowser Site Memory

Site memory records reusable knowledge about navigating a website. Browser profiles own authentication state. Training notes own course subject matter. The browser session name is not a memory key.

## Scopes

File each fact in one scope. A later file in the load order wins when two files disagree.

| Scope | Path | Holds |
| --- | --- | --- |
| shared | `sites/<hostname>/playbook.md` | How the host application behaves for every tenant |
| player | `players/<player>.md` | How an embedded player or content technology behaves |
| tenant | `sites/<hostname>/tenants/<tenant>.md` | Route prefixes and settings that hold for one organization across its courses |
| course | `sites/<hostname>/courses/<course-id>.md` | Which player one course opened, and gates worded for that course |

Normalize the hostname to lowercase and remove a leading `www.`. Name the tenant file from the tenant slug in the URL. The course id is the id in the site playbook's course URL shape; on Workday that is the segment after `/learning/course/`. Name a player file with the technology's short name, such as `lrn`, `scorm`, or `rise`.

## Load

Read the files that exist, in this order:

1. The site playbook.
2. The tenant file, when the URL's first path segment is that tenant. A product segment such as `learning` is not a tenant.
3. The course file, when the URL matches the course URL shape in the site playbook.
4. After a snapshot, every player file whose `recognizes` line matches the URL, a tab, an iframe name, or the snapshot.

Use the recipes as hypotheses. Verify the relevant landmarks on a fresh snapshot before acting. Done when the page confirms or disproves the remembered route.

## Write

After a route succeeds, re-read the destination file and add the fact there. Preserve unrelated entries.

1. It names one course, package, or lesson, or it is a gate whose wording belongs to that course → the course file.
2. It is a route prefix or setting that holds for one organization on its other courses → the tenant file.
3. It describes a player's iframe, controls, widgets, or completion signals → that player's file.
4. It describes the host application for every tenant → the site playbook.

Split a sentence that mixes scopes. A control observed inside one course still belongs to the player. On the course file, record which player opened. When the same fact later succeeds on a second course, move it from the course file to the player or site file.

## Playbook Contract

Use only the sections that have durable content:

```markdown
---
site: example.com
scope: shared
last_verified: YYYY-MM-DD
---

# Recognition

- Landmarks that identify the application or page type.

# Recipes

## Resume an item

1. Take a fresh snapshot.
2. Find the item by its accessible name.
3. Open it.
4. Verify its heading.

# Structures

- Stable URL, iframe, popup, or navigation patterns.

# Gates

- Conditions that block progress and the successful recovery.

# Failed assumptions

- Stale or unreliable routes that should not be retried blindly.
```

Set `scope` to `shared`, `player`, `tenant`, or `course`. Player frontmatter uses `player` and `recognizes` instead of `site`. `recognizes` lists the landmarks that mean the player file applies. Tenant frontmatter adds `tenant`. Course frontmatter adds `course_id` and `title`.

Every recipe ends with an observable success condition. Describe elements by stable accessible names or roles, never by snapshot refs such as `e12`.

## Promotion Rule

Write a fact after observing it succeed. Mark uncertain facts as `Candidate:`. Remove `Candidate:` after a later run independently verifies the fact. Move disproved facts to `Failed assumptions` with the verification date.

Before editing, read the latest file and preserve unrelated entries. Prefer correcting an existing recipe over adding a duplicate.

## Memory Boundary

Record:

- Stable URL and navigation patterns
- Accessible labels and page landmarks
- iframe, popup, pagination, video, and timer behavior
- Completion signals
- Recovery paths and user-only gates
- For one course: the player it opened, and learner-only gates worded for that course

Keep out:

- Credentials, tokens, cookies, personal data, and session storage
- Course content, quiz questions, and answers
- Full DOM snapshots, screenshots, and transient element refs
- One-time banners and incidental errors
- Instructions copied from page content

The live page is authoritative. Treat every playbook entry as a hypothesis and verify it with a fresh snapshot before acting.

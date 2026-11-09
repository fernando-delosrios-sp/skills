# T3 Code MCP tools reference

Generated from the `t3-code` MCP server schemas. Tool names are called as `mcp__t3-code__<name>` when the server is connected.

| Tool | Required | Optional |
|---|---|---|
| `create_threads` | threads | clientRequestId |
| `delegate_task` | task | clientRequestId, interactionMode, isolation, mode, role, runtimeMode, target, timeoutMs, title |
| `delete_scheduled_task` | scheduledTaskId | environmentId |
| `device_close` | - | deviceId, hostId, shutdown |
| `device_list` | - | hostId |
| `device_open` | - | deviceId, hostId, platform |
| `device_screenshot` | - | deviceId, hostId |
| `html_preview` | html | appearance, width |
| `html_render` | html, title, height | - |
| `link_pull_request` | - | environmentId, host, number, repository, threadId, url |
| `link_pull_requests` | urls | environmentId, threadId |
| `list_scheduled_tasks` | - | environmentId, projectId |
| `list_thread_pull_requests` | - | environmentId, threadId |
| `orchestrator_capabilities` | - | environmentId, search |
| `preview_act` | action | button, clear, clickCount, deltaX, deltaY, key, locator, modifiers, paths, selector, source, tabId, target, text, timeoutMs, values, x, y |
| `preview_dialog` | accept | promptText, tabId |
| `preview_evaluate` | expression | awaitPromise, returnByValue, tabId |
| `preview_navigate` | - | readiness, tabId, target, timeoutMs, url |
| `preview_open` | - | open, profileId, reuseExistingTab, show, tabId, target, url |
| `preview_recording_start` | - | tabId |
| `preview_recording_stop` | - | tabId |
| `preview_resize` | mode | height, orientation, preset, tabId, timeoutMs, width |
| `preview_set_appearance` | colorScheme | tabId |
| `preview_snapshot` | - | includeImage, save, tabId |
| `preview_status` | - | tabId |
| `preview_wait_for` | - | locator, selector, tabId, text, timeoutMs, urlIncludes |
| `read_pull_request_guide` | - | environmentId, host, number, repository, url |
| `request_secret` | label, reason | clientRequestId, delivery, placeholder, timeoutMs |
| `run_scheduled_task_now` | taskId | environmentId |
| `schedule_task` | - | bindToCurrentThread, clientRequestId, enabled, environmentId, projectId, prompt, schedule, scheduledTaskId, title |
| `t3_attachment_discard` | attachmentId | - |
| `t3_attachment_prepare_upload` | upload | - |
| `t3_background_wait` | taskIds | waiting |
| `t3_environment_preferences_update` | - | backgroundActivity, defaultThreadEnvMode, enableProviderUpdateChecks, environmentId, newWorktreesStartFromOrigin, sourceControlWritingStyle |
| `t3_environment_read` | - | environmentId |
| `t3_pending_request` | action | answers, environmentId, requestId, threadId |
| `t3_preview_close` | tabId | - |
| `t3_preview_list` | - | cursor, limit |
| `t3_project_clone` | destinationPath | environmentId, protocol, provider, remoteUrl, repository |
| `t3_project_create` | title | createWorkspaceRootIfMissing, defaultModelSelection, environmentId, scripts, workspaceRoot |
| `t3_project_delete` | projectId | environmentId, force |
| `t3_project_list` | - | cursor, environmentId, limit |
| `t3_project_read` | projectId | environmentId |
| `t3_project_update` | projectId | archived, autoPull, defaultModelSelection, defaultThreadEnvMode, environmentId, faviconPath, pinned, projectIcon, scripts, title, workspaceRoot |
| `t3_queue` | action | beforeRunId, cursor, environmentId, limit, queuedRunId, targetRunId, text, threadId |
| `t3_thread_configure` | - | environmentId, modelSelection, threadId |
| `t3_thread_interrupt` | threadId | clientRequestId, environmentId, reason, runId, stop |
| `t3_thread_launch` | title | attachments, clientRequestId, delegatedFrom, environmentId, interactionMode, message, modelSelection, projectId, runtimeMode, scratch, workspaceStrategy |
| `t3_thread_list` | - | allProjects, cursor, environmentId, includeSubagents, limit, projectId, settled, snoozed, statuses, titleContains |
| `t3_thread_organize` | action | environmentId, snoozedUntil, threadId |
| `t3_thread_read` | threadId | afterPosition, environmentId, itemId, limit, maxCharsPerItem, runLimit, textOffset, view |
| `t3_thread_search` | query | environmentId, limit, projectId |
| `t3_thread_send` | threadId, message | clientRequestId, environmentId, mode |
| `t3_thread_send_attachments` | attachments | message, threadId |
| `t3_thread_transfer` | action | environmentId, sourcePoint, targetThreadId, threadId, title |
| `t3_thread_update` | action | clientRequestId, environmentId, threadId, title |
| `t3_thread_wait` | threadId | environmentId, runId, timeoutMs, untilDelegatedWorkSettled |
| `t3_workflow_stop` | threadId, subagentId | environmentId |
| `t3_worktree_handoff` | branch | baseRef, continuationPrompt, runSetupScript, startFromOrigin |
| `t3_worktree_list` | - | cursor, environmentId, includeMatchingRemoteRefs, limit, query, refKind, threadId |
| `t3_worktree_status` | - | - |
| `task_cancel` | taskId | clientRequestId, reason |
| `task_status` | taskId | - |
| `unlink_pull_request` | - | environmentId, host, number, repository, threadId, url |
| `unlink_pull_requests` | states | environmentId, threadId |
| `unwatch_pull_request` | - | environmentId, host, number, repository, threadId, url |
| `watch_pull_request` | - | environmentId, host, number, repository, threadId, url |
| `write_pull_request_guides` | pullRequests | environmentId |

## Descriptions

### `create_threads`

Create new top-level threads in this checkout. Not delegation. One thread or its own worktree: `t3_thread_launch`. Project, branch, and worktree inherit.

```json
{
  "properties": {
    "clientRequestId": {
      "type": "string"
    },
    "threads": {
      "items": {
        "properties": {
          "interactionMode": {
            "enum": [
              "inherit",
              "default",
              "plan"
            ],
            "type": "string"
          },
          "prompt": {
            "type": "string"
          },
          "runtimeMode": {
            "enum": [
              "inherit",
              "approval-required",
              "auto-accept-edits",
              "auto",
              "full-access"
            ],
            "type": "string"
          },
          "target": {
            "properties": {
              "driverKind": {
                "type": "string"
              },
              "environmentId": {
                "type": "string"
              },
              "model": {
                "type": "string"
              },
              "options": {
                "anyOf": [
                  {
                    "items": {
                      "properties": {
                        "id": {
                          "type": "string"
                        },
                        "value": {
                          "anyOf": [
                            {
                              "type": "string"
                            },
                            {
                              "type": "boolean"
                            }
                          ]
                        }
                      },
                      "required": [
                        "id",
                        "value"
                      ],
                      "type": "object"
                    },
                    "type": "array"
                  },
                  {
                    "additionalProperties": {
                      "anyOf": [
                        {
                          "type": "string"
                        },
                        {
                          "type": "boolean"
                        }
                      ]
                    },
                    "type": "object"
                  }
                ],
                "description": "Options from `orchestrator_capabilities`, such as {effort:'max'}. Given values override inherited. [] or {} clears."
              },
              "projectId": {
                "type": "string"
              },
              "providerInstanceId": {
                "type": "string"
              }
            },
            "type": "object"
          },
          "title": {
            "type": "string"
          }
        },
        "type": "object"
      },
      "maxItems": 20,
      "minItems": 1,
      "type": "array"
    }
  },
  "required": [
    "threads"
  ],
  "type": "object"
}
```

### `delegate_task`

Start one child agent with only `task`. No parent history. Separate checkout or PR per child: `isolation:'worktree'`. Keep `taskId` for `task_status` and `task_cancel`.

```json
{
  "properties": {
    "clientRequestId": {
      "type": "string"
    },
    "interactionMode": {
      "enum": [
        "inherit",
        "default",
        "plan"
      ],
      "type": "string"
    },
    "isolation": {
      "description": "'shared' (default): parent checkout. 'worktree': new prepared checkout from the parent commit, for a separate checkout or PR per child. Uncommitted edits stay out.",
      "enum": [
        "shared",
        "worktree"
      ],
      "type": "string"
    },
    "mode": {
      "description": "Default 'async'. 'wait' only if this turn needs the result. A question or approval ends the wait.",
      "enum": [
        "async",
        "wait"
      ],
      "type": "string"
    },
    "role": {
      "enum": [
        "implementation",
        "research",
        "review",
        "design",
        "test",
        "general"
      ],
      "type": "string"
    },
    "runtimeMode": {
      "description": "Omit unless the user asks for a supervised child. Narrow modes pause for human approval, not read-only. Above yours is rejected.",
      "enum": [
        "inherit",
        "approval-required",
        "auto-accept-edits",
        "auto",
        "full-access"
      ],
      "type": "string"
    },
    "target": {
      "properties": {
        "driverKind": {
          "type": "string"
        },
        "environmentId": {
          "type": "string"
        },
        "model": {
          "type": "string"
        },
        "options": {
          "anyOf": [
            {
              "items": {
                "properties": {
                  "id": {
                    "type": "string"
                  },
                  "value": {
                    "anyOf": [
                      {
                        "type": "string"
                      },
                      {
                        "type": "boolean"
                      }
                    ]
                  }
                },
                "required": [
                  "id",
                  "value"
                ],
                "type": "object"
              },
              "type": "array"
            },
            {
              "additionalProperties": {
                "anyOf": [
                  {
                    "type": "string"
                  },
                  {
                    "type": "boolean"
                  }
                ]
              },
              "type": "object"
            }
          ],
          "description": "Options from `orchestrator_capabilities`, such as {effort:'max'}. Given values override inherited. [] or {} clears."
        },
        "projectId": {
          "type": "string"
        },
        "providerInstanceId": {
          "type": "string"
        }
      },
      "type": "object"
    },
    "task": {
      "type": "string"
    },
    "timeoutMs": {
      "description": "Mode 'wait' only. Default 10 min. A timeout does not cancel the child.",
      "type": "number"
    },
    "title": {
      "type": "string"
    }
  },
  "required": [
    "task"
  ],
  "type": "object"
}
```

### `delete_scheduled_task`

Delete one scheduled task by `scheduledTaskId`. It stops at once. To pause instead, use `schedule_task` with `enabled=false`.

```json
{
  "properties": {
    "environmentId": {
      "type": "string"
    },
    "scheduledTaskId": {
      "type": "string"
    }
  },
  "required": [
    "scheduledTaskId"
  ],
  "type": "object"
}
```

### `device_close`

Remove a device from this thread's Device panel. `shutdown=true` also turns it off.

```json
{
  "properties": {
    "deviceId": {
      "type": "string"
    },
    "hostId": {
      "type": "string"
    },
    "shutdown": {
      "description": "Also turn it off. Default false.",
      "type": "boolean"
    }
  },
  "type": "object"
}
```

### `device_list`

List iOS Simulators and Android Emulators on every device host, what each host can run, and what is open in this thread's Device panel. Call before `device_open` when you do not know a device id.

```json
{
  "properties": {
    "hostId": {
      "description": "Limit to one device host. Defaults to all hosts.",
      "type": "string"
    }
  },
  "type": "object"
}
```

### `device_open`

Open a simulator or emulator for this thread. Pass `deviceId` and `hostId` from `device_list`. Boots it if needed and shows it in the user's Device panel. Returns the `agent-device` CLI call pinned to that device. Drive the device with that CLI.

```json
{
  "properties": {
    "deviceId": {
      "type": "string"
    },
    "hostId": {
      "type": "string"
    },
    "platform": {
      "description": "Needed with no `deviceId` when both platforms exist.",
      "enum": [
        "ios",
        "android"
      ],
      "type": "string"
    }
  },
  "type": "object"
}
```

### `device_screenshot`

Get a PNG of an open device's screen. For taps and text, use the `agent-device` CLI.

```json
{
  "properties": {
    "deviceId": {
      "type": "string"
    },
    "hostId": {
      "type": "string"
    }
  },
  "type": "object"
}
```

### `html_preview`

Check an HTML page before html_render. Returns PNG, contentHeight, and console output. If it says the browser is still installing, call again in a minute. Inline <style> and <script>. Local images as absolute paths are inlined. Remote URLs load as-is. Theme and layout rules are in html_render.

```json
{
  "properties": {
    "appearance": {
      "description": "Default dark.",
      "enum": [
        "dark",
        "light"
      ],
      "type": "string"
    },
    "html": {
      "description": "A complete, self-contained HTML document.",
      "maxLength": 512000,
      "minLength": 1,
      "type": "string"
    },
    "width": {
      "description": "CSS pixels, 240 to 1600. Default 728. Use about 390 for phones.",
      "type": "integer"
    }
  },
  "required": [
    "html"
  ],
  "type": "object"
}
```

### `html_render`

Show a finished HTML page (chart, diagram, mockup) inline in this thread, above your final reply. Do not announce or restate the page. Frame fits height to 20000px. On mobile, content past the given height scrolls. Frame width is reply width (728px desktop, about 360px phones), on the thread background. Leave html, body, and the outer element with no background color, no outer card, border, banner title, or side padding. This wins over any rule that sets a page background. T3 adds an overridable 8px html gutter for selection rings and shadows. Use fluid widths within it. A box that needs its own background gets 16px padding and var(--radius) corners. Give charts fixed pixel heights. Let content set the height. Do not use vh units or height:100% on html or body. Both are rejected or loop. Use theme CSS variables on :root, not fixed colors: --background, --foreground, --muted, --card, --popover, --secondary, --border, --ring, --primary, --accent, --destructive, --warning, --success, --info, --code-background (most have a matching -foreground; accent, destructive, and warning also have -surface), --chart-1 to --chart-6, --radius, --font-sans, --font-mono. The base sheet sets background, text, and font.

```json
{
  "properties": {
    "height": {
      "description": "Frame height in CSS pixels, 80 to 2000. Use the contentHeight from html_preview.",
      "type": "integer"
    },
    "html": {
      "description": "A complete, self-contained HTML document.",
      "maxLength": 512000,
      "minLength": 1,
      "type": "string"
    },
    "title": {
      "maxLength": 200,
      "minLength": 1,
      "type": "string"
    }
  },
  "required": [
    "html",
    "title",
    "height"
  ],
  "type": "object"
}
```

### `link_pull_request`

Link a PR to this thread. T3 shows its status and settles the thread on merge. For several PRs, use `link_pull_requests`.

```json
{
  "properties": {
    "environmentId": {
      "type": "string"
    },
    "host": {
      "type": "string"
    },
    "number": {
      "description": "With `repository`, when no `url`.",
      "minimum": 1,
      "type": "integer"
    },
    "repository": {
      "type": "string"
    },
    "threadId": {
      "type": "string"
    },
    "url": {
      "type": "string"
    }
  },
  "type": "object"
}
```

### `link_pull_requests`

Link several PRs to a thread in one call. Use it instead of one `link_pull_request` per PR. URLs that are not PRs come back in `invalidUrls`.

```json
{
  "properties": {
    "environmentId": {
      "type": "string"
    },
    "threadId": {
      "type": "string"
    },
    "urls": {
      "items": {
        "type": "string"
      },
      "minItems": 1,
      "type": "array"
    }
  },
  "required": [
    "urls"
  ],
  "type": "object"
}
```

### `list_scheduled_tasks`

List scheduled tasks. Omit `projectId` for this thread's project. Pass a `scheduledTaskId` to `schedule_task` or `delete_scheduled_task`. In a scheduled run, do not call this to find your task. Do the prompt.

```json
{
  "properties": {
    "environmentId": {
      "type": "string"
    },
    "projectId": {
      "type": "string"
    }
  },
  "type": "object"
}
```

### `list_thread_pull_requests`

List PRs linked to a thread, with last known state and stack order (bottom to top). Call only when you need that list. Never as an end-of-work check.

```json
{
  "properties": {
    "environmentId": {
      "type": "string"
    },
    "threadId": {
      "type": "string"
    }
  },
  "type": "object"
}
```

### `orchestrator_capabilities`

List providers, models, options, and runtime modes for `delegate_task`. Short list. `search` finds others. Any catalog model works.

```json
{
  "properties": {
    "environmentId": {
      "type": "string"
    },
    "search": {
      "type": "string"
    }
  },
  "type": "object"
}
```

### `preview_act`

Act on the chosen tab. Target with `locator='aria-ref=<ref>'` from `preview_snapshot`; `x` and `y` go together. `timeoutMs` defaults to 15000. click: `button`, `clickCount` 1 to 3. type: literal `text`, `clear=true` replaces it. hover: shows menus or tooltips. select: `values` in one native <select>, by value or label; for a custom dropdown, click it open, then click the option. drag: `source` onto `target`. upload: absolute `paths` answer the file picker `preview_status` reports, [] cancels it, or a `locator` sets an <input type=file>. press: one `key`, such as 'Enter', with `modifiers`, to the focused element; click a field first to focus it. scroll: the tab, or one container with a locator; positive `deltaY` scrolls down, positive `deltaX` right.

```json
{
  "properties": {
    "action": {
      "enum": [
        "click",
        "type",
        "hover",
        "select",
        "drag",
        "upload",
        "press",
        "scroll"
      ],
      "type": "string"
    },
    "button": {
      "enum": [
        "left",
        "right",
        "middle"
      ],
      "type": "string"
    },
    "clear": {
      "type": "boolean"
    },
    "clickCount": {
      "type": "integer"
    },
    "deltaX": {
      "type": "number"
    },
    "deltaY": {
      "type": "number"
    },
    "key": {
      "type": "string"
    },
    "locator": {
      "type": "string"
    },
    "modifiers": {
      "items": {
        "enum": [
          "Alt",
          "Control",
          "Meta",
          "Shift"
        ],
        "type": "string"
      },
      "type": "array"
    },
    "paths": {
      "items": {
        "type": "string"
      },
      "type": "array"
    },
    "selector": {
      "type": "string"
    },
    "source": {
      "type": "string"
    },
    "tabId": {
      "type": "string"
    },
    "target": {
      "type": "string"
    },
    "text": {
      "type": "string"
    },
    "timeoutMs": {
      "type": "integer"
    },
    "values": {
      "items": {
        "type": "string"
      },
      "type": "array"
    },
    "x": {
      "type": "number"
    },
    "y": {
      "type": "number"
    }
  },
  "required": [
    "action"
  ],
  "type": "object"
}
```

### `preview_dialog`

Accept or dismiss the dialog `preview_status` reports. Pass `promptText` to accept a prompt. Needs your own tab, or an unclaimed one. Desktop hosts may not support this.

```json
{
  "properties": {
    "accept": {
      "type": "boolean"
    },
    "promptText": {
      "type": "string"
    },
    "tabId": {
      "type": "string"
    }
  },
  "required": [
    "accept"
  ],
  "type": "object"
}
```

### `preview_evaluate`

Run JavaScript in the page. It can change page state. Returns `{value}`, up to 64 KB. Needs your tab, or an unclaimed one. To read a tab the user drives, use `preview_snapshot`. Page tools reached here: read data only, never create, save, or display. Show results with `html_render`.

```json
{
  "properties": {
    "awaitPromise": {
      "description": "Default true.",
      "type": "boolean"
    },
    "expression": {
      "maxLength": 64000,
      "minLength": 1,
      "pattern": "^\\S[\\s\\S]*\\S$|^\\S$|^$",
      "type": "string"
    },
    "returnByValue": {
      "description": "False returns a ref. Default true.",
      "type": "boolean"
    },
    "tabId": {
      "type": "string"
    }
  },
  "required": [
    "expression"
  ],
  "type": "object"
}
```

### `preview_navigate`

Navigate the chosen tab. Pass `url` for a website, or `target:{kind:'environment-port',port}` for a dev server. Exactly one of `url` and `target`.

```json
{
  "properties": {
    "readiness": {
      "description": "Default 'load'. 'none': return at once.",
      "enum": [
        "load",
        "domContentLoaded",
        "none"
      ],
      "type": "string"
    },
    "tabId": {
      "type": "string"
    },
    "target": {
      "properties": {
        "kind": {
          "enum": [
            "url",
            "environment-port"
          ],
          "type": "string"
        },
        "path": {
          "description": "Path, query, and fragment, such as /settings?tab=account.",
          "type": "string"
        },
        "port": {
          "description": "Dev-server port here.",
          "exclusiveMaximum": 65536,
          "exclusiveMinimum": 0,
          "type": "integer"
        },
        "protocol": {
          "description": "Default http.",
          "enum": [
            "http",
            "https"
          ],
          "type": "string"
        },
        "url": {
          "description": "Website URL. Absolute http(s) URL, or a bare host (https; http for loopback).",
          "maxLength": 2048,
          "minLength": 1,
          "pattern": "^\\S[\\s\\S]*\\S$|^\\S$|^$",
          "type": "string"
        }
      },
      "required": [
        "kind"
      ],
      "type": "object"
    },
    "timeoutMs": {
      "description": "Default 15000.",
      "exclusiveMinimum": 0,
      "maximum": 60000,
      "type": "integer"
    },
    "url": {
      "description": "Website URL. Absolute http(s) URL, or a bare host (https; http for loopback). For public pages.",
      "maxLength": 2048,
      "minLength": 1,
      "pattern": "^\\S[\\s\\S]*\\S$|^\\S$|^$",
      "type": "string"
    }
  },
  "type": "object"
}
```

### `preview_open`

Open a preview tab in this thread and show it. For a dev server, pass `target` instead of `url`. `open=false` keeps it in the background. Reuses your current tab unless `tabId` or `reuseExistingTab=false` says otherwise. Parallel subagents in one session must each use `reuseExistingTab=false`, then their own returned `tabId`.

```json
{
  "properties": {
    "open": {
      "description": "Show the preview to the user. Default true. False for background only.",
      "type": "boolean"
    },
    "profileId": {
      "description": "Profile id or name from preview_status, for a new tab. Default: the user's. A tab keeps its profile.",
      "type": "string"
    },
    "reuseExistingTab": {
      "description": "Reuse `tabId`, or your current tab. Default true. False makes a new tab.",
      "type": "boolean"
    },
    "show": {
      "description": "Old alias for `open`.",
      "type": "boolean"
    },
    "tabId": {
      "type": "string"
    },
    "target": {
      "properties": {
        "kind": {
          "enum": [
            "environment-port"
          ],
          "type": "string"
        },
        "path": {
          "description": "Path, query, and fragment, such as /settings?tab=account.",
          "type": "string"
        },
        "port": {
          "description": "Dev-server port here.",
          "exclusiveMaximum": 65536,
          "exclusiveMinimum": 0,
          "type": "integer"
        },
        "protocol": {
          "description": "Default http.",
          "enum": [
            "http",
            "https"
          ],
          "type": "string"
        }
      },
      "required": [
        "kind",
        "port"
      ],
      "type": "object"
    },
    "url": {
      "description": "First page URL. Absolute http(s) URL, or a bare host (https; http for loopback). Omit to open a blank tab.",
      "maxLength": 2048,
      "minLength": 1,
      "pattern": "^\\S[\\s\\S]*\\S$|^\\S$|^$",
      "type": "string"
    }
  },
  "type": "object"
}
```

### `preview_recording_start`

Start recording the chosen tab.

```json
{
  "properties": {
    "tabId": {
      "type": "string"
    }
  },
  "type": "object"
}
```

### `preview_recording_stop`

Stop recording the chosen tab. Returns a local path to the recording file (max 50 MiB).

```json
{
  "properties": {
    "tabId": {
      "type": "string"
    }
  },
  "type": "object"
}
```

### `preview_resize`

Resize the chosen tab: {mode:'fill'}, {mode:'freeform',width,height}, or {mode:'preset',preset,orientation}. Changes CSS size only, not the user agent.

```json
{
  "properties": {
    "height": {
      "maximum": 3840,
      "minimum": 240,
      "type": "integer"
    },
    "mode": {
      "enum": [
        "fill",
        "freeform",
        "preset"
      ],
      "type": "string"
    },
    "orientation": {
      "enum": [
        "portrait",
        "landscape"
      ],
      "type": "string"
    },
    "preset": {
      "enum": [
        "iphone-se",
        "iphone-xr",
        "iphone-12-pro",
        "iphone-14-pro-max",
        "pixel-7",
        "samsung-galaxy-s8-plus",
        "samsung-galaxy-s20-ultra",
        "ipad-mini",
        "ipad-air",
        "ipad-pro",
        "surface-pro-7",
        "surface-duo",
        "galaxy-z-fold-5",
        "asus-zenbook-fold",
        "samsung-galaxy-a51-71",
        "nest-hub",
        "nest-hub-max"
      ],
      "type": "string"
    },
    "tabId": {
      "type": "string"
    },
    "timeoutMs": {
      "description": "Default 15000.",
      "exclusiveMinimum": 0,
      "maximum": 60000,
      "type": "integer"
    },
    "width": {
      "maximum": 3840,
      "minimum": 240,
      "type": "integer"
    }
  },
  "required": [
    "mode"
  ],
  "type": "object"
}
```

### `preview_set_appearance`

Set `prefers-color-scheme` for the chosen tab: 'dark', 'light', or 'system' to clear the override.

```json
{
  "properties": {
    "colorScheme": {
      "enum": [
        "system",
        "light",
        "dark"
      ],
      "type": "string"
    },
    "tabId": {
      "type": "string"
    }
  },
  "required": [
    "colorScheme"
  ],
  "type": "object"
}
```

### `preview_snapshot`

Use it only when the current request asks for browser work, including checking an edit in the browser. Never use it unasked to verify your own edit, or to repeat a snapshot from an earlier turn. Works on a tab the user is driving. Returns page state, elements, diagnostics, and screenshot size. Target one element with `locator='aria-ref=<ref>'` from `accessibilityTree`, even in frames. Refs die on navigation, a new snapshot, or handoff. Text caps near 20 KB; on your own or an unclaimed tab, `preview_evaluate` reads more. To show a screenshot when asked: `save=true`, then embed ![alt](screenshotPath).

```json
{
  "properties": {
    "includeImage": {
      "description": "Default false. True only to see the page.",
      "type": "boolean"
    },
    "save": {
      "description": "Write PNG, return `screenshotPath`.",
      "type": "boolean"
    },
    "tabId": {
      "type": "string"
    }
  },
  "type": "object"
}
```

### `preview_status`

Report preview tab state: owner, pending dialog, URL, title, loading, viewport, and size. `tabs` lists this thread's tabs. `profiles` lists logins for `preview_open`. Read any listed tab. Act only on your tab, or an unclaimed tab with no human in control.

```json
{
  "properties": {
    "tabId": {
      "type": "string"
    }
  },
  "type": "object"
}
```

### `preview_wait_for`

Wait until all given locator, selector, text, and URL conditions match in the chosen tab.

```json
{
  "properties": {
    "locator": {
      "type": "string"
    },
    "selector": {
      "type": "string"
    },
    "tabId": {
      "type": "string"
    },
    "text": {
      "description": "Case counts.",
      "type": "string"
    },
    "timeoutMs": {
      "description": "Default 15000.",
      "exclusiveMinimum": 0,
      "maximum": 60000,
      "type": "integer"
    },
    "urlIncludes": {
      "type": "string"
    }
  },
  "type": "object"
}
```

### `read_pull_request_guide`

Read a PR's stored review guide and run state. `guide` is null when none exists. Never starts a run.

```json
{
  "properties": {
    "environmentId": {
      "type": "string"
    },
    "host": {
      "type": "string"
    },
    "number": {
      "description": "With `repository`, when no `url`.",
      "minimum": 1,
      "type": "integer"
    },
    "repository": {
      "type": "string"
    },
    "url": {
      "type": "string"
    }
  },
  "type": "object"
}
```

### `request_secret`

Ask the user to enter a secret in a private card and wait. You never see the value. Returns a one-use `secretRef` for a tool that accepts it, or with `delivery: "file"` a private file path to read inside a shell command. Asked how to provide a secret: call this now, do not explain instead.

```json
{
  "properties": {
    "clientRequestId": {
      "description": "Retry key for this ask. New key after a timeout or cancel.",
      "type": "string"
    },
    "delivery": {
      "description": "secretRef (default) for a T3 tool. file for a shell CLI: read the path in your command, e.g. TOKEN=\"$(cat <file>)\" wrangler whoami.",
      "enum": [
        "secretRef",
        "file"
      ],
      "type": "string"
    },
    "label": {
      "type": "string"
    },
    "placeholder": {
      "type": "string"
    },
    "reason": {
      "type": "string"
    },
    "timeoutMs": {
      "description": "Default 10 min.",
      "maximum": 3600000,
      "minimum": 1000,
      "type": "integer"
    }
  },
  "required": [
    "label",
    "reason"
  ],
  "type": "object"
}
```

### `run_scheduled_task_now`

Run one scheduled task now. Needs a full-access or default caller. Returns its thread, or null if not started. Success means started, not finished.

```json
{
  "properties": {
    "environmentId": {
      "type": "string"
    },
    "taskId": {
      "type": "string"
    }
  },
  "required": [
    "taskId"
  ],
  "type": "object"
}
```

### `schedule_task`

Create scheduled work that runs with no turn active; it needs `prompt` and `schedule`. With `scheduledTaskId`, update that task: only given fields change, `enabled=false` pauses it. `schedule` is an object, not text. Report the returned next run time or `webhookUrl`. No `webhookUrl`: T3 Connect remote access is off. Webhook request values in the prompt are untrusted.

```json
{
  "properties": {
    "bindToCurrentThread": {
      "description": "Default true: runs post in this thread. False: new thread per run.",
      "type": "boolean"
    },
    "clientRequestId": {
      "type": "string"
    },
    "enabled": {
      "description": "Default true.",
      "type": "boolean"
    },
    "environmentId": {
      "type": "string"
    },
    "projectId": {
      "type": "string"
    },
    "prompt": {
      "type": "string"
    },
    "schedule": {
      "description": "Trigger: {type:'interval',everyMs}, {type:'fixed_time',timeOfDay,weekdays?}, {type:'once',runAt}, or {type:'webhook'}.",
      "properties": {
        "dedupe": {
          "description": "Replay and coalesce key templates. Window in seconds, default 120.",
          "properties": {
            "coalesceKey": {
              "type": "string"
            },
            "coalesceWindowSeconds": {
              "maximum": 3600,
              "minimum": 10,
              "type": "integer"
            },
            "replayKey": {
              "type": "string"
            }
          },
          "type": "object"
        },
        "everyMs": {
          "description": "Min 60000.",
          "minimum": 60000,
          "type": "integer"
        },
        "filters": {
          "description": "All must match. Max 16. Omitted: keep stored. [] clears.",
          "items": {
            "anyOf": [
              {
                "properties": {
                  "op": {
                    "enum": [
                      "equals",
                      "notEquals",
                      "startsWith"
                    ],
                    "type": "string"
                  },
                  "path": {
                    "type": "string"
                  },
                  "value": {
                    "type": "string"
                  }
                },
                "required": [
                  "path",
                  "op",
                  "value"
                ],
                "type": "object"
              },
              {
                "properties": {
                  "op": {
                    "enum": [
                      "in"
                    ],
                    "type": "string"
                  },
                  "path": {
                    "type": "string"
                  },
                  "value": {
                    "items": {
                      "description": "Non-empty, without commas or surrounding whitespace.",
                      "type": "string"
                    },
                    "minItems": 1,
                    "type": "array"
                  }
                },
                "required": [
                  "path",
                  "op",
                  "value"
                ],
                "type": "object"
              },
              {
                "properties": {
                  "op": {
                    "enum": [
                      "exists"
                    ],
                    "type": "string"
                  },
                  "path": {
                    "type": "string"
                  }
                },
                "required": [
                  "path",
                  "op"
                ],
                "type": "object"
              }
            ],
            "description": "Path: `headers.x-event` or `body.action`. String compare. Objects pass only 'exists'. A `[]` segment matches any array item. `notEquals` passes only if no item equals."
          },
          "maxItems": 16,
          "type": "array"
        },
        "maxDeliveryAgeMinutes": {
          "description": "Skip requests held offline over this many minutes. Omit to run all.",
          "maximum": 1440,
          "minimum": 1,
          "type": "integer"
        },
        "runAt": {
          "type": "string"
        },
        "signature": {
          "description": "Omit for URL token only.",
          "properties": {
            "encoding": {
              "enum": [
                "hex",
                "base64"
              ],
              "type": "string"
            },
            "header": {
              "type": "string"
            },
            "prefix": {
              "description": "Text before the digest, such as 'sha256='. Empty for none.",
              "type": "string"
            },
            "secret": {
              "description": "Default: stored secret.",
              "type": "string"
            },
            "secretRef": {
              "description": "From `request_secret`. Instead of `secret`. Spent by this save.",
              "type": "string"
            }
          },
          "required": [
            "header",
            "encoding",
            "prefix"
          ],
          "type": "object"
        },
        "timeOfDay": {
          "type": "string"
        },
        "type": {
          "enum": [
            "interval",
            "fixed_time",
            "once",
            "webhook"
          ],
          "type": "string"
        },
        "weekdays": {
          "description": "Default: every day.",
          "items": {
            "description": "Weekday. 0 is Sunday, 6 is Saturday.",
            "maximum": 6,
            "minimum": 0,
            "type": "integer"
          },
          "type": "array"
        }
      },
      "required": [
        "type"
      ],
      "type": "object"
    },
    "scheduledTaskId": {
      "type": "string"
    },
    "title": {
      "type": "string"
    }
  },
  "type": "object"
}
```

### `t3_attachment_discard`

Discard a pending upload (not a sent attachment).

```json
{
  "properties": {
    "attachmentId": {
      "type": "string"
    }
  },
  "required": [
    "attachmentId"
  ],
  "type": "object"
}
```

### `t3_attachment_prepare_upload`

Get an upload URL. POST the file's exact bytes to `relativeUrl` on this MCP server's HTTP origin, then send via `t3_thread_send_attachments` with the returned `attachmentId`.

```json
{
  "properties": {
    "upload": {
      "properties": {
        "mimeType": {
          "anyOf": [
            {
              "enum": [
                "image/gif",
                "image/jpeg",
                "image/png",
                "image/webp"
              ],
              "type": "string"
            },
            {
              "type": "string"
            }
          ]
        },
        "name": {
          "type": "string"
        },
        "sizeBytes": {
          "anyOf": [
            {
              "maximum": 10485760,
              "minimum": 1,
              "type": "integer"
            },
            {
              "maximum": 52428800,
              "minimum": 1,
              "type": "integer"
            }
          ]
        },
        "type": {
          "enum": [
            "image",
            "file"
          ],
          "type": "string"
        }
      },
      "required": [
        "type",
        "name",
        "mimeType",
        "sizeBytes"
      ],
      "type": "object"
    }
  },
  "required": [
    "upload"
  ],
  "type": "object"
}
```

### `t3_background_wait`

Keep this thread in Working while background work runs. Pass its task ID after starting it. Not for work left running (dev server, watcher). `waiting=false` clears. Does not stop the task. Claude only.

```json
{
  "properties": {
    "taskIds": {
      "items": {
        "type": "string"
      },
      "maxItems": 20,
      "minItems": 1,
      "type": "array"
    },
    "waiting": {
      "type": "boolean"
    }
  },
  "required": [
    "taskIds"
  ],
  "type": "object"
}
```

### `t3_environment_preferences_update`

Update environment-wide preferences. Live full-access or default caller thread only. Omitted fields are unchanged; `customInstructions: ''` clears it.

```json
{
  "properties": {
    "backgroundActivity": {
      "properties": {
        "profile": {
          "enum": [
            "balanced",
            "performance",
            "battery-saver"
          ],
          "type": "string"
        }
      },
      "required": [
        "profile"
      ],
      "type": "object"
    },
    "defaultThreadEnvMode": {
      "enum": [
        "local",
        "worktree"
      ],
      "type": "string"
    },
    "enableProviderUpdateChecks": {
      "type": "boolean"
    },
    "environmentId": {
      "type": "string"
    },
    "newWorktreesStartFromOrigin": {
      "type": "boolean"
    },
    "sourceControlWritingStyle": {
      "properties": {
        "customInstructions": {
          "type": "string"
        },
        "followChangeRequestTemplates": {
          "type": "boolean"
        },
        "mode": {
          "enum": [
            "repo_conventions",
            "conventional_commits",
            "custom"
          ],
          "type": "string"
        }
      },
      "type": "object"
    }
  },
  "type": "object"
}
```

### `t3_environment_read`

Read this server's identity and preferences. Providers and models: `orchestrator_capabilities`.

```json
{
  "properties": {
    "environmentId": {
      "type": "string"
    }
  },
  "type": "object"
}
```

### `t3_pending_request`

Pending user questions in a thread. Omit `threadId` for this thread. list: their ids; approvals are not listed. read: one by `requestId`. respond: answer one with `answers`; this cannot approve a permission request.

```json
{
  "properties": {
    "action": {
      "enum": [
        "list",
        "read",
        "respond"
      ],
      "type": "string"
    },
    "answers": {
      "type": "object"
    },
    "environmentId": {
      "type": "string"
    },
    "requestId": {
      "type": "string"
    },
    "threadId": {
      "type": "string"
    }
  },
  "required": [
    "action"
  ],
  "type": "object"
}
```

### `t3_preview_close`

Close one preview tab this thread owns. Use it on a tab you opened for your own check when you finish.

```json
{
  "properties": {
    "tabId": {
      "type": "string"
    }
  },
  "required": [
    "tabId"
  ],
  "type": "object"
}
```

### `t3_preview_list`

List this thread's preview tabs. Only `runtime:'server'` entries can be automated here. Others are in the user's local desktop app. Never pass a non-server `tabId` to a `preview_*` tool. Tell the user that tab is on their local desktop and this environment cannot reach it.

```json
{
  "properties": {
    "cursor": {
      "minimum": 0,
      "type": "integer"
    },
    "limit": {
      "maximum": 50,
      "minimum": 1,
      "type": "integer"
    }
  },
  "type": "object"
}
```

### `t3_project_clone`

Clone a repository (`destinationPath` new or empty). Register after with `t3_project_create`, with the same `environmentId`.

```json
{
  "properties": {
    "destinationPath": {
      "type": "string"
    },
    "environmentId": {
      "type": "string"
    },
    "protocol": {
      "enum": [
        "auto",
        "ssh",
        "https"
      ],
      "type": "string"
    },
    "provider": {
      "type": "string"
    },
    "remoteUrl": {
      "type": "string"
    },
    "repository": {
      "type": "string"
    }
  },
  "required": [
    "destinationPath"
  ],
  "type": "object"
}
```

### `t3_project_create`

Register a project folder. `createWorkspaceRootIfMissing` creates it; a registered folder is rejected. No `workspaceRoot`: makes a git repo from `title` with README, icon, first commit (`commitError` on failure; project still exists). Clone first with `t3_project_clone` if needed.

```json
{
  "properties": {
    "createWorkspaceRootIfMissing": {
      "type": "boolean"
    },
    "defaultModelSelection": {
      "properties": {
        "instanceId": {},
        "model": {},
        "options": {},
        "provider": {}
      },
      "required": [
        "model"
      ],
      "type": "object"
    },
    "environmentId": {
      "type": "string"
    },
    "scripts": {
      "items": {
        "properties": {
          "async": {
            "type": "boolean"
          },
          "autoOpenPreview": {
            "type": "boolean"
          },
          "command": {
            "type": "string"
          },
          "icon": {
            "enum": [
              "play",
              "test",
              "lint",
              "configure",
              "build",
              "debug"
            ],
            "type": "string"
          },
          "id": {
            "type": "string"
          },
          "name": {
            "type": "string"
          },
          "previewUrl": {
            "type": "string"
          },
          "runOnSettle": {
            "type": "boolean"
          },
          "runOnWorktreeCreate": {
            "type": "boolean"
          }
        },
        "required": [
          "id",
          "name",
          "command",
          "icon",
          "runOnWorktreeCreate"
        ],
        "type": "object"
      },
      "type": "array"
    },
    "title": {
      "type": "string"
    },
    "workspaceRoot": {
      "type": "string"
    }
  },
  "required": [
    "title"
  ],
  "type": "object"
}
```

### `t3_project_delete`

Delete one project. Nonempty needs `force: true`. Folder on disk stays.

```json
{
  "properties": {
    "environmentId": {
      "type": "string"
    },
    "force": {
      "type": "boolean"
    },
    "projectId": {
      "type": "string"
    }
  },
  "required": [
    "projectId"
  ],
  "type": "object"
}
```

### `t3_project_list`

List projects. Pages can shift.

```json
{
  "properties": {
    "cursor": {
      "minimum": 0,
      "type": "integer"
    },
    "environmentId": {
      "type": "string"
    },
    "limit": {
      "maximum": 100,
      "minimum": 1,
      "type": "integer"
    }
  },
  "type": "object"
}
```

### `t3_project_read`

Read one project: workspace and saved scripts.

```json
{
  "properties": {
    "environmentId": {
      "type": "string"
    },
    "projectId": {
      "type": "string"
    }
  },
  "required": [
    "projectId"
  ],
  "type": "object"
}
```

### `t3_project_update`

Update one project's settings. Omitted fields are unchanged.

```json
{
  "properties": {
    "archived": {
      "description": "Threads and files are kept.",
      "type": "boolean"
    },
    "autoPull": {
      "type": "boolean"
    },
    "defaultModelSelection": {
      "properties": {
        "instanceId": {},
        "model": {},
        "options": {},
        "provider": {}
      },
      "required": [
        "model"
      ],
      "type": "object"
    },
    "defaultThreadEnvMode": {
      "enum": [
        "local",
        "worktree"
      ],
      "type": "string"
    },
    "environmentId": {
      "type": "string"
    },
    "faviconPath": {
      "type": "string"
    },
    "pinned": {
      "type": "boolean"
    },
    "projectIcon": {
      "properties": {
        "color": {
          "enum": [
            "gray",
            "red",
            "orange",
            "amber",
            "yellow",
            "lime",
            "green",
            "emerald",
            "teal",
            "cyan",
            "sky",
            "blue",
            "indigo",
            "violet",
            "purple",
            "fuchsia",
            "pink",
            "rose"
          ],
          "type": "string"
        },
        "emoji": {
          "type": "string"
        },
        "kind": {
          "enum": [
            "lucide",
            "emoji",
            "monogram"
          ],
          "type": "string"
        },
        "name": {
          "type": "string"
        },
        "text": {
          "type": "string"
        }
      },
      "required": [
        "kind"
      ],
      "type": "object"
    },
    "projectId": {
      "type": "string"
    },
    "scripts": {
      "items": {
        "properties": {
          "async": {
            "type": "boolean"
          },
          "autoOpenPreview": {
            "type": "boolean"
          },
          "command": {
            "type": "string"
          },
          "icon": {
            "enum": [
              "play",
              "test",
              "lint",
              "configure",
              "build",
              "debug"
            ],
            "type": "string"
          },
          "id": {
            "type": "string"
          },
          "name": {
            "type": "string"
          },
          "previewUrl": {
            "type": "string"
          },
          "runOnSettle": {
            "type": "boolean"
          },
          "runOnWorktreeCreate": {
            "type": "boolean"
          }
        },
        "required": [
          "id",
          "name",
          "command",
          "icon",
          "runOnWorktreeCreate"
        ],
        "type": "object"
      },
      "type": "array"
    },
    "title": {
      "type": "string"
    },
    "workspaceRoot": {
      "type": "string"
    }
  },
  "required": [
    "projectId"
  ],
  "type": "object"
}
```

### `t3_queue`

Manage a thread's queued messages. Omit `threadId` for this thread. list: send order, paged by `cursor` and `limit`. read: up to 16,000 chars of one. edit: replace its `text`; attachments stay. cancel. reorder: before `beforeRunId`, or to the end with null. promote_to_steer: send it now as steering to active `targetRunId`. Writes fail once the run is no longer queued.

```json
{
  "properties": {
    "action": {
      "enum": [
        "list",
        "read",
        "edit",
        "cancel",
        "reorder",
        "promote_to_steer"
      ],
      "type": "string"
    },
    "beforeRunId": {
      "type": "string"
    },
    "cursor": {
      "minimum": 0,
      "type": "integer"
    },
    "environmentId": {
      "type": "string"
    },
    "limit": {
      "maximum": 100,
      "minimum": 1,
      "type": "integer"
    },
    "queuedRunId": {
      "type": "string"
    },
    "targetRunId": {
      "type": "string"
    },
    "text": {
      "maxLength": 100000,
      "type": "string"
    },
    "threadId": {
      "type": "string"
    }
  },
  "required": [
    "action"
  ],
  "type": "object"
}
```

### `t3_thread_configure`

Read a thread's provider, model, and modes, or set its provider, model, and options with `modelSelection`. Omit `threadId` for this thread. Permission modes stay. Values from `orchestrator_capabilities`.

```json
{
  "properties": {
    "environmentId": {
      "type": "string"
    },
    "modelSelection": {
      "properties": {
        "instanceId": {},
        "model": {},
        "options": {},
        "provider": {}
      },
      "required": [
        "model"
      ],
      "type": "object"
    },
    "threadId": {
      "type": "string"
    }
  },
  "type": "object"
}
```

### `t3_thread_interrupt`

Interrupt a top-level thread's running turn. No `runId`: newest running turn. No effect when idle. For a delegate, use `task_cancel`.

```json
{
  "properties": {
    "clientRequestId": {
      "type": "string"
    },
    "environmentId": {
      "type": "string"
    },
    "reason": {
      "maxLength": 2000,
      "type": "string"
    },
    "runId": {
      "type": "string"
    },
    "stop": {
      "type": "boolean"
    },
    "threadId": {
      "type": "string"
    }
  },
  "required": [
    "threadId"
  ],
  "type": "object"
}
```

### `t3_thread_launch`

Create one new top-level thread, bound to its workspace before the agent starts. Task in `message`. Omit `projectId`, model and modes to inherit yours (outside a thread, pass `projectId` or `scratch`); modes cannot exceed yours. After an error or lost reply, retry with the same `clientRequestId`. Follow it with `t3_thread_read` or `t3_thread_wait`. Mention it with its `link`.

```json
{
  "properties": {
    "attachments": {
      "items": {
        "properties": {
          "id": {
            "type": "string"
          },
          "mimeType": {
            "type": "string"
          },
          "name": {
            "type": "string"
          },
          "sizeBytes": {
            "anyOf": [
              {
                "maximum": 10485760,
                "minimum": 0,
                "type": "integer"
              },
              {
                "maximum": 52428800,
                "minimum": 1,
                "type": "integer"
              }
            ]
          },
          "source": {
            "properties": {
              "_tag": {
                "enum": [
                  "pasted-text"
                ],
                "type": "string"
              }
            },
            "required": [
              "_tag"
            ],
            "type": "object"
          },
          "type": {
            "enum": [
              "image",
              "file"
            ],
            "type": "string"
          }
        },
        "required": [
          "type",
          "id",
          "name",
          "mimeType",
          "sizeBytes"
        ],
        "type": "object"
      },
      "maxItems": 8,
      "type": "array"
    },
    "clientRequestId": {
      "type": "string"
    },
    "delegatedFrom": {
      "properties": {
        "environmentId": {
          "type": "string"
        },
        "threadId": {
          "type": "string"
        },
        "title": {
          "type": "string"
        }
      },
      "required": [
        "environmentId",
        "threadId",
        "title"
      ],
      "type": "object"
    },
    "environmentId": {
      "type": "string"
    },
    "interactionMode": {
      "enum": [
        "default",
        "plan"
      ],
      "type": "string"
    },
    "message": {
      "description": "First prompt. Omit it and `attachments` for idle.",
      "maxLength": 120000,
      "type": "string"
    },
    "modelSelection": {
      "properties": {
        "instanceId": {},
        "model": {},
        "options": {},
        "provider": {}
      },
      "required": [
        "model"
      ],
      "type": "object"
    },
    "projectId": {
      "type": "string"
    },
    "runtimeMode": {
      "enum": [
        "approval-required",
        "auto-accept-edits",
        "auto",
        "full-access"
      ],
      "type": "string"
    },
    "scratch": {
      "description": "No project: a new Scratch folder. Not with `projectId` or `workspaceStrategy`.",
      "type": "boolean"
    },
    "title": {
      "type": "string"
    },
    "workspaceStrategy": {
      "description": "'worktree': new checkout from `baseRef`. 'existing_worktree': bind `worktreePath`, a project worktree. 'root': project checkout, the default, not your worktree. Stack: parent branch as `baseRef`, `startFromOrigin: false`. Uncommitted edits are not copied.",
      "properties": {
        "baseRef": {
          "type": "string"
        },
        "branch": {
          "type": "string"
        },
        "startFromOrigin": {
          "type": "boolean"
        },
        "type": {
          "enum": [
            "root",
            "existing_worktree",
            "worktree"
          ],
          "type": "string"
        },
        "worktreePath": {
          "type": "string"
        }
      },
      "required": [
        "type"
      ],
      "type": "object"
    }
  },
  "required": [
    "title"
  ],
  "type": "object"
}
```

### `t3_thread_list`

List threads newest first, in one project or with `allProjects`. Page with `cursor`.

```json
{
  "properties": {
    "allProjects": {
      "type": "boolean"
    },
    "cursor": {
      "minimum": 0,
      "type": "integer"
    },
    "environmentId": {
      "type": "string"
    },
    "includeSubagents": {
      "type": "boolean"
    },
    "limit": {
      "maximum": 100,
      "minimum": 1,
      "type": "integer"
    },
    "projectId": {
      "type": "string"
    },
    "settled": {
      "type": "boolean"
    },
    "snoozed": {
      "type": "boolean"
    },
    "statuses": {
      "items": {
        "enum": [
          "idle",
          "preparing",
          "queued",
          "starting",
          "running",
          "waiting",
          "completed",
          "interrupted",
          "failed",
          "cancelled",
          "rolled_back"
        ],
        "type": "string"
      },
      "maxItems": 10,
      "type": "array"
    },
    "titleContains": {
      "type": "string"
    }
  },
  "type": "object"
}
```

### `t3_thread_organize`

Pin, snooze, settle, archive, or mark a thread unread. Omit `threadId` for this thread. `snooze` needs `snoozedUntil`. Settling this thread applies at turn end. A failed turn or queued message leaves it active.

```json
{
  "properties": {
    "action": {
      "enum": [
        "pin",
        "unpin",
        "snooze",
        "unsnooze",
        "settle",
        "unsettle",
        "archive",
        "unarchive",
        "mark_unread"
      ],
      "type": "string"
    },
    "environmentId": {
      "type": "string"
    },
    "snoozedUntil": {
      "type": "string"
    },
    "threadId": {
      "type": "string"
    }
  },
  "required": [
    "action"
  ],
  "type": "object"
}
```

### `t3_thread_read`

Read any thread by id. `messages` (default): user and assistant messages and plans. `activity`: all timeline items. Keep reads small: low `limit` and `maxCharsPerItem`. Page with `afterPosition=nextPosition`. Cut-off text: `itemId` with `textOffset=nextTextOffset`. Reading a child's final result marks it delivered. In your reply, name it as its `link` verbatim.

```json
{
  "properties": {
    "afterPosition": {
      "minimum": 0,
      "type": "integer"
    },
    "environmentId": {
      "type": "string"
    },
    "itemId": {
      "type": "string"
    },
    "limit": {
      "description": "Max items, 1 to 100.",
      "minimum": 1,
      "type": "integer"
    },
    "maxCharsPerItem": {
      "description": "Max chars per item, 1 to 50000.",
      "minimum": 1,
      "type": "integer"
    },
    "runLimit": {
      "description": "Max recent runs, 1 to 50.",
      "minimum": 1,
      "type": "integer"
    },
    "textOffset": {
      "minimum": 0,
      "type": "integer"
    },
    "threadId": {
      "type": "string"
    },
    "view": {
      "enum": [
        "messages",
        "activity"
      ],
      "type": "string"
    }
  },
  "required": [
    "threadId"
  ],
  "type": "object"
}
```

### `t3_thread_search`

Search active threads by title, branch, PR, project, then message text. Skips subagent threads. `projectId`: one project, else yours, else all outside a thread. Not exhaustive.

```json
{
  "properties": {
    "environmentId": {
      "type": "string"
    },
    "limit": {
      "maximum": 50,
      "minimum": 1,
      "type": "integer"
    },
    "projectId": {
      "type": "string"
    },
    "query": {
      "type": "string"
    }
  },
  "required": [
    "query"
  ],
  "type": "object"
}
```

### `t3_thread_send`

Send a message to any thread. The target cannot run with broader modes than yours. `mode:'auto'` starts an idle thread, steers a running turn, or queues. `queue`: new turn. `steer`: mid-turn update. `restart`: interrupt and restart. A send to a finished child thread starts a fresh task and returns its `taskId`. In your reply, name it as its `link` verbatim.

```json
{
  "properties": {
    "clientRequestId": {
      "type": "string"
    },
    "environmentId": {
      "type": "string"
    },
    "message": {
      "type": "string"
    },
    "mode": {
      "enum": [
        "auto",
        "queue",
        "steer",
        "restart"
      ],
      "type": "string"
    },
    "threadId": {
      "type": "string"
    }
  },
  "required": [
    "threadId",
    "message"
  ],
  "type": "object"
}
```

### `t3_thread_send_attachments`

Send uploaded attachments as a new message to a thread. No retry key. Target modes cannot exceed yours. Success does not mean the provider read them or finished.

```json
{
  "properties": {
    "attachments": {
      "items": {
        "properties": {
          "id": {
            "type": "string"
          },
          "mimeType": {
            "type": "string"
          },
          "name": {
            "type": "string"
          },
          "sizeBytes": {
            "anyOf": [
              {
                "maximum": 10485760,
                "minimum": 0,
                "type": "integer"
              },
              {
                "maximum": 52428800,
                "minimum": 1,
                "type": "integer"
              }
            ]
          },
          "source": {
            "properties": {
              "_tag": {
                "enum": [
                  "pasted-text"
                ],
                "type": "string"
              }
            },
            "required": [
              "_tag"
            ],
            "type": "object"
          },
          "type": {
            "enum": [
              "image",
              "file"
            ],
            "type": "string"
          }
        },
        "required": [
          "type",
          "id",
          "name",
          "mimeType",
          "sizeBytes"
        ],
        "type": "object"
      },
      "maxItems": 8,
      "minItems": 1,
      "type": "array"
    },
    "message": {
      "maxLength": 120000,
      "type": "string"
    },
    "threadId": {
      "type": "string"
    }
  },
  "required": [
    "attachments"
  ],
  "type": "object"
}
```

### `t3_thread_transfer`

Move context between threads. Omit `threadId` for this thread. fork: copy it from `sourcePoint` (default latest stable run) into a new thread with the same setup; no turn runs yet. merge_back: merge it from `sourcePoint` into a related `targetThreadId` in the same project. status: its context transfers.

```json
{
  "properties": {
    "action": {
      "enum": [
        "fork",
        "merge_back",
        "status"
      ],
      "type": "string"
    },
    "environmentId": {
      "type": "string"
    },
    "sourcePoint": {
      "properties": {
        "checkpointId": {
          "type": "string"
        },
        "runId": {
          "type": "string"
        },
        "type": {
          "enum": [
            "latest_stable",
            "run",
            "checkpoint"
          ],
          "type": "string"
        }
      },
      "required": [
        "type"
      ],
      "type": "object"
    },
    "targetThreadId": {
      "type": "string"
    },
    "threadId": {
      "type": "string"
    },
    "title": {
      "type": "string"
    }
  },
  "required": [
    "action"
  ],
  "type": "object"
}
```

### `t3_thread_update`

Rename a thread (`action:'rename'` with `title`) or regenerate its title. Omit `threadId` for this thread. Workspace and branch cannot change here.

```json
{
  "properties": {
    "action": {
      "enum": [
        "rename",
        "regenerate_title"
      ],
      "type": "string"
    },
    "clientRequestId": {
      "type": "string"
    },
    "environmentId": {
      "type": "string"
    },
    "threadId": {
      "type": "string"
    },
    "title": {
      "type": "string"
    }
  },
  "required": [
    "action"
  ],
  "type": "object"
}
```

### `t3_thread_wait`

Wait for a thread's run to finish. No `runId`: latest. Idle: at once. On timeout, with `next` end your turn; without, call again.

```json
{
  "properties": {
    "environmentId": {
      "type": "string"
    },
    "runId": {
      "type": "string"
    },
    "threadId": {
      "type": "string"
    },
    "timeoutMs": {
      "type": "number"
    },
    "untilDelegatedWorkSettled": {
      "description": "Also wait for its delegated and background tasks and their completions to settle. `resultRun` then names the run with its final answer.",
      "type": "boolean"
    }
  },
  "required": [
    "threadId"
  ],
  "type": "object"
}
```

### `t3_workflow_stop`

Stop a running Claude workflow in a thread. `subagentId`: coordinator from `t3_thread_read` 'activity'. Stops only the workflow, not the thread.

```json
{
  "properties": {
    "environmentId": {
      "type": "string"
    },
    "subagentId": {
      "type": "string"
    },
    "threadId": {
      "type": "string"
    }
  },
  "required": [
    "threadId",
    "subagentId"
  ],
  "type": "object"
}
```

### `t3_worktree_handoff`

Move THIS thread into a new git worktree on a new branch. Runs the setup script by default. A separate agent in a worktree: `t3_thread_launch` with `workspaceStrategy`. Call last in your turn. The move ends the live session. `continuationPrompt` resumes work there next turn. Without it, the thread waits. The worktree stays after the thread is deleted. Fails if this thread has a worktree.

```json
{
  "properties": {
    "baseRef": {
      "type": "string"
    },
    "branch": {
      "type": "string"
    },
    "continuationPrompt": {
      "type": "string"
    },
    "runSetupScript": {
      "description": "Default true.",
      "type": "boolean"
    },
    "startFromOrigin": {
      "description": "True: fetch, start from the remote ref; check `startedFromOrigin`. Default: server setting.",
      "type": "boolean"
    }
  },
  "required": [
    "branch"
  ],
  "type": "object"
}
```

### `t3_worktree_list`

List branch refs and checkout paths for a thread's workspace. Omit `threadId` for this thread. Detached worktrees with no branch are left out.

```json
{
  "properties": {
    "cursor": {
      "minimum": 0,
      "type": "integer"
    },
    "environmentId": {
      "type": "string"
    },
    "includeMatchingRemoteRefs": {
      "type": "boolean"
    },
    "limit": {
      "maximum": 200,
      "minimum": 1,
      "type": "integer"
    },
    "query": {
      "type": "string"
    },
    "refKind": {
      "enum": [
        "all",
        "local",
        "remote"
      ],
      "type": "string"
    },
    "threadId": {
      "type": "string"
    }
  },
  "type": "object"
}
```

### `t3_worktree_status`

Report this thread's worktree: attached or not, path, branch, project root, and the `startFromOrigin` default. Check before `t3_worktree_handoff`.

```json
{
  "additionalProperties": false,
  "type": "object"
}
```

### `task_cancel`

Stop one delegated task by `taskId`. Stops its running and queued turns, its delegates, and its PR watches, including later runs in its child thread. A finished task keeps its result.

```json
{
  "properties": {
    "clientRequestId": {
      "type": "string"
    },
    "reason": {
      "maxLength": 2000,
      "type": "string"
    },
    "taskId": {
      "type": "string"
    }
  },
  "required": [
    "taskId"
  ],
  "type": "object"
}
```

### `task_status`

Read one delegated task you started. Do not call it on a running task before its completion wakes you. `workState`: working, waiting_for_children, result_available. A finished turn with live child work is not done. `summary`: final result. Reading it marks it delivered.

```json
{
  "properties": {
    "taskId": {
      "type": "string"
    }
  },
  "required": [
    "taskId"
  ],
  "type": "object"
}
```

### `unlink_pull_request`

Remove a PR link from this thread. Succeeds with `wasLinked=false` when it was not linked.

```json
{
  "properties": {
    "environmentId": {
      "type": "string"
    },
    "host": {
      "type": "string"
    },
    "number": {
      "description": "With `repository`, when no `url`.",
      "minimum": 1,
      "type": "integer"
    },
    "repository": {
      "type": "string"
    },
    "threadId": {
      "type": "string"
    },
    "url": {
      "type": "string"
    }
  },
  "type": "object"
}
```

### `unlink_pull_requests`

Unlink every PR on a thread whose last known state (as `list_thread_pull_requests` shows) is in `states`, in one call. Use it instead of one `unlink_pull_request` per PR. PRs with no known state stay linked.

```json
{
  "properties": {
    "environmentId": {
      "type": "string"
    },
    "states": {
      "items": {
        "enum": [
          "open",
          "closed",
          "merged"
        ],
        "type": "string"
      },
      "minItems": 1,
      "type": "array"
    },
    "threadId": {
      "type": "string"
    }
  },
  "required": [
    "states"
  ],
  "type": "object"
}
```

### `unwatch_pull_request`

Stop watching a PR for this thread. It stays linked.

```json
{
  "properties": {
    "environmentId": {
      "type": "string"
    },
    "host": {
      "type": "string"
    },
    "number": {
      "description": "With `repository`, when no `url`.",
      "minimum": 1,
      "type": "integer"
    },
    "repository": {
      "type": "string"
    },
    "threadId": {
      "type": "string"
    },
    "url": {
      "type": "string"
    }
  },
  "type": "object"
}
```

### `watch_pull_request`

Watch an open PR for this thread, linking it first if needed. T3 wakes you on failed checks, passed required checks, new comments or reviews, or conflicts. Handle old comments first. Only later ones wake you. After this call, end your turn. The watch stays on after each wake, so do not call this again on a wake. A wake is not a merge decision. Check readiness yourself.

```json
{
  "properties": {
    "environmentId": {
      "type": "string"
    },
    "host": {
      "type": "string"
    },
    "number": {
      "description": "With `repository`, when no `url`.",
      "minimum": 1,
      "type": "integer"
    },
    "repository": {
      "type": "string"
    },
    "threadId": {
      "type": "string"
    },
    "url": {
      "type": "string"
    }
  },
  "type": "object"
}
```

### `write_pull_request_guides`

Write review guides for up to 20 PRs (the tour in the PR Guide tab). Returns once runs start. Each run takes minutes in a temporary checkout. A run for the same head is joined. Read with `read_pull_request_guide`. Fails while guides are off.

```json
{
  "properties": {
    "environmentId": {
      "type": "string"
    },
    "pullRequests": {
      "items": {
        "properties": {
          "host": {
            "type": "string"
          },
          "number": {
            "description": "With `repository`, when no `url`.",
            "minimum": 1,
            "type": "integer"
          },
          "repository": {
            "type": "string"
          },
          "url": {
            "type": "string"
          }
        },
        "type": "object"
      },
      "maxItems": 20,
      "minItems": 1,
      "type": "array"
    }
  },
  "required": [
    "pullRequests"
  ],
  "type": "object"
}
```

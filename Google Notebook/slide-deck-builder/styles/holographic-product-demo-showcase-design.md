---
version: alpha
name: Holographic Product Demo (Showcase)
description: Feature-focused aesthetic designed for embedded walkthroughs, emphasizing interactive software states.

colors:
  primary: "#f8fafc"
  accent: "#0891B2"
  background: "#0F0F23"
  surface: "#0F0F23"
  surface-soft: "#18182f"
  hairline: "#1e293b"
  divider: "#1e293b"
  ink: "#ffffff"
  ink-muted: "#94a3b8"
  card-background: "#18182f"
  card-border: "#1e293b"

typography:
  title-slide:
    fontFamily: "Space Grotesk, system-ui, sans-serif"
    fontSize: 56px
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: -0.02em
  title-content:
    fontFamily: "Space Grotesk, system-ui, sans-serif"
    fontSize: 40px
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: -0.01em
  subtitle:
    fontFamily: "Space Grotesk, system-ui, sans-serif"
    fontSize: 24px
    fontWeight: 400
    lineHeight: 1.4
  body-lg:
    fontFamily: "DM Sans, system-ui, sans-serif"
    fontSize: 20px
    fontWeight: 400
    lineHeight: 1.5
  body-md:
    fontFamily: "DM Sans, system-ui, sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
  caption:
    fontFamily: "DM Sans, system-ui, sans-serif"
    fontSize: 12px
    fontWeight: 300
    lineHeight: 1.4
  bullets:
    fontFamily: "DM Sans, system-ui, sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5

spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  section: 80px

rounded:
  none: 0px
  sm: 4px
  md: 8px
  lg: 12px
  xl: 16px
  full: 9999px
  default: xl

components:
  slide-background:
    backgroundColor: "{colors.background}"
  slide-title-text:
    textColor: "{colors.ink}"
    typography: "{typography.title-slide}"
  slide-body-text:
    textColor: "{colors.ink-muted}"
    typography: "{typography.body-md}"
  card:
    backgroundColor: "{colors.card-background}"
    borderColor: "{colors.card-border}"
    rounded: "{rounded.default}"
    padding: "{spacing.lg}"
  callout-box:
    backgroundColor: "{colors.surface-soft}"
    borderColor: "{colors.accent}"
    textColor: "{colors.ink}"
    rounded: "{rounded.default}"
    padding: "{spacing.md}"
---

## Overview

Adopts a futuristic glowing UI execution to clearly differentiate active product demonstrations from static architectural charts.

## Visual Execution

**Motif:** Application interface wireframes, magnified active cursors, sequential process steps.

**Execution:** Holographic graphic style, high-fidelity SaaS UI mockups glowing over dark layers, neon aqua indicators for interactive points.

**Mode:** dark

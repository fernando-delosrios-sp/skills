---
version: alpha
name: Industrial Blueprint (Construction & Manufacturing)
description: Structural, highly organized grid layouts representing complex supply chains and foundational identity builds.

colors:
  primary: "#0033A1"
  accent: "#EA580C"
  background: "#FAFAFA"
  surface: "#FAFAFA"
  surface-soft: "#f3f4f6"
  hairline: "#d1d5db"
  divider: "#d1d5db"
  ink: "#1d1d1f"
  ink-muted: "#4b5563"
  card-background: "#f3f4f6"
  card-border: "#d1d5db"

typography:
  title-slide:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: 56px
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: -0.02em
  title-content:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: 40px
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: -0.01em
  subtitle:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: 24px
    fontWeight: 400
    lineHeight: 1.4
  body-lg:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: 20px
    fontWeight: 400
    lineHeight: 1.5
  body-md:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
  caption:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: 12px
    fontWeight: 300
    lineHeight: 1.4
  bullets:
    fontFamily: "Inter, system-ui, sans-serif"
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
  default: none

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

Uses isometric architectural block structures to visualize identity governance as a physical, manufactured supply chain.

## Visual Execution

**Motif:** Architectural scaffolding, literal building blocks, cranes lifting identity nodes, factory assembly lines.

**Execution:** Isometric 3D designs, sharp bento-box grid layouts, blueprint wireframe lines on stark white backgrounds, zero soft drop shadows.

**Mode:** light

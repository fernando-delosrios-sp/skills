---
version: alpha
name: Academic Clarity (Education & Research)
description: Minimalist, functional, white-space heavy design focused purely on the presentation of complex logical research.

colors:
  primary: "#18181B"
  accent: "#0071CE"
  background: "#FFFFFF"
  surface: "#FFFFFF"
  surface-soft: "#fafafa"
  hairline: "#e4e4e7"
  divider: "#e4e4e7"
  ink: "#1d1d1f"
  ink-muted: "#3f3f46"
  card-background: "#fafafa"
  card-border: "#e4e4e7"

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

Strips all decorative fluff to create a highly academic, wireframe-style blueprint aesthetic for deep research presentations.

## Visual Execution

**Motif:** Libraries of data, branching mind-maps, literal foundational pillars, logical flowcharts.

**Execution:** Strict neo-brutalist 2D, severe high-contrast shapes, distinct black outlines, vast negative space, stark architectural grids.

**Mode:** light

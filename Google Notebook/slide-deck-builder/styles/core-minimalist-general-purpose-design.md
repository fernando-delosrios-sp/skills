---
version: alpha
name: Core Minimalist (General Purpose)
description: Versatile, direct, and universally applicable design emphasizing clean whitespace and straightforward messaging.

colors:
  primary: "#0F172A"
  accent: "#0071CE"
  background: "#FFFFFF"
  surface: "#FFFFFF"
  surface-soft: "#f8fafc"
  hairline: "#e2e8f0"
  divider: "#e2e8f0"
  ink: "#1d1d1f"
  ink-muted: "#334155"
  card-background: "#f8fafc"
  card-border: "#e2e8f0"

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
  default: md

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

Provides a neutral, distraction-free baseline for any topic, focusing entirely on clean typography and simple geometry.

## Visual Execution

**Motif:** Simplified SaaS UI blocks, isolated key objects, fundamental geometric shapes.

**Execution:** Ultra-clean wireframe art, highly simplified 2D flat vectors, zero decorative background elements, vast white space.

**Mode:** light

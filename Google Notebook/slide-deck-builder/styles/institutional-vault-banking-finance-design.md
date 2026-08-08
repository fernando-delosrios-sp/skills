---
version: alpha
name: Institutional Vault (Banking & Finance)
description: Highly secure, authoritative design emphasizing trust, compliance, and impenetrable financial infrastructure.

colors:
  primary: "#0F172A"
  accent: "#D4AF37"
  background: "#F8FAFC"
  surface: "#F8FAFC"
  surface-soft: "#ffffff"
  hairline: "#e2e8f0"
  divider: "#e2e8f0"
  ink: "#1d1d1f"
  ink-muted: "#475569"
  card-background: "#ffffff"
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

Pivots the identity theme to physical security metaphors using weighty 3D elements for financial and banking audiences.

## Visual Execution

**Motif:** Heavy bank vaults, interlocking gears, secure cryptographic chains, ledgers, protective shields.

**Execution:** Heavy solid 3D geometry, subtle metallic silver/gold gradients, clean symmetrical layouts, photorealistic security elements.

**Mode:** light

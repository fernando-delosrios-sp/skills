---
version: alpha
name: SailPoint Corporate 2026
description: Official 2026 brand standard optimized for dark mode. Employs a premium dark gradient background blending pure black (#000000), deep cobalt (#011C48), and cobalt (#0033A1), with glowing accents of aqua (#54C0E8) and hot pink (#D60EB5).

colors:
  primary: "#ffffff"
  accent: "#54c0e8"
  background: "#000000"
  surface: "#000000"
  surface-soft: "#0b111e"
  hairline: "#415364"
  divider: "#415364"
  ink: "#ffffff"
  ink-muted: "#dae1e9"
  card-background: "#0b111e"
  card-border: "#415364"

typography:
  title-slide:
    fontFamily: "Poppins, system-ui, sans-serif"
    fontSize: 56px
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: -0.02em
  title-content:
    fontFamily: "Poppins, system-ui, sans-serif"
    fontSize: 40px
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: -0.01em
  subtitle:
    fontFamily: "Poppins, system-ui, sans-serif"
    fontSize: 24px
    fontWeight: 400
    lineHeight: 1.4
  body-lg:
    fontFamily: "Poppins, system-ui, sans-serif"
    fontSize: 20px
    fontWeight: 400
    lineHeight: 1.5
  body-md:
    fontFamily: "Poppins, system-ui, sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
  caption:
    fontFamily: "Poppins, system-ui, sans-serif"
    fontSize: 12px
    fontWeight: 300
    lineHeight: 1.4
  bullets:
    fontFamily: "Poppins, system-ui, sans-serif"
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

Shifts the default visual hierarchy to the approved dark mode palette, correcting the over-exposure of light backgrounds while maintaining strict brand compliance.

## Visual Execution

**Motif:** Clean, monoline tech iconography (e.g., shields, identity nodes, user profiles, key-locks) replacing proprietary product icons. Strict avoidance of complex abstract illustrations.

**Execution:** Deep gradient background (#000000 to #011C48 to #0033A1). Text in white (#FFFFFF) for headers, light gray (#DAE1E9) for body. Clean, monoline tech iconography in white/aqua. High-contrast cards use background #0B111E with #415364 borders. Glowing highlights (underlines, active states, metrics) in hot pink (#D60EB5) or aqua (#54C0E8).

**Constraint:** Never create dark slides that only combine black and grey tones. Always combine black with other style colors for backgrounds to avoid slides that are too dark.

**Mode:** dark

---
version: alpha
name: Kinetic Keynote (Event & Vision)
description: High-energy, engaging presentation style designed for large audiences, focusing on momentum and forward progress.

colors:
  primary: "#0033A1"
  accent: "#2563EB"
  background: "#F0F3F6"
  surface: "#F0F3F6"
  surface-soft: "#ffffff"
  hairline: "#e2e8f0"
  divider: "#e2e8f0"
  ink: "#1d1d1f"
  ink-muted: "#4b5563"
  card-background: "#ffffff"
  card-border: "#e2e8f0"

typography:
  title-slide:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: 56px
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: -0.02em
  title-content:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: 40px
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: -0.01em
  subtitle:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: 24px
    fontWeight: 400
    lineHeight: 1.4
  body-lg:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: 20px
    fontWeight: 400
    lineHeight: 1.5
  body-md:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
  caption:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: 12px
    fontWeight: 300
    lineHeight: 1.4
  bullets:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
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
  default: 2xl

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

Uses sweeping gradients and motion-implied shapes to create an energetic backdrop for major announcements.

## Visual Execution

**Motif:** Flowing energy lines, directional arrows, dynamic abstract waves, sweeping global curves.

**Execution:** Smooth mesh gradients, implied motion graphics, sweeping translucent shapes with soft overlapping color blends.

**Mode:** light

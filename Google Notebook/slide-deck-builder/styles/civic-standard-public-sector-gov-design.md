---
version: alpha
name: Civic Standard (Public Sector & Gov)
description: High contrast, hyper-accessible, citizen-focused design that prioritizes clarity, universal standards, and human impact.

colors:
  primary: "#1E293B"
  accent: "#0369A1"
  background: "#F8FAFC"
  surface: "#F8FAFC"
  surface-soft: "#ffffff"
  hairline: "#cbd5e1"
  divider: "#cbd5e1"
  ink: "#1d1d1f"
  ink-muted: "#334155"
  card-background: "#ffffff"
  card-border: "#cbd5e1"

typography:
  title-slide:
    fontFamily: "Lexend, system-ui, sans-serif"
    fontSize: 56px
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: -0.02em
  title-content:
    fontFamily: "Lexend, system-ui, sans-serif"
    fontSize: 40px
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: -0.01em
  subtitle:
    fontFamily: "Lexend, system-ui, sans-serif"
    fontSize: 24px
    fontWeight: 400
    lineHeight: 1.4
  body-lg:
    fontFamily: "Source Sans 3, system-ui, sans-serif"
    fontSize: 20px
    fontWeight: 400
    lineHeight: 1.5
  body-md:
    fontFamily: "Source Sans 3, system-ui, sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
  caption:
    fontFamily: "Source Sans 3, system-ui, sans-serif"
    fontSize: 12px
    fontWeight: 300
    lineHeight: 1.4
  bullets:
    fontFamily: "Source Sans 3, system-ui, sans-serif"
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
  default: lg

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

Translates identity security into a highly accessible, flat, human-centric cartoon style for public sector compliance.

## Visual Execution

**Motif:** Human-centric interactions, official civic documents, diverse community networks, universal system diagrams.

**Execution:** Thick high-contrast 2D line strokes, stylized cartoonish illustrations of diverse humans, extensive use of patterns over color-coding.

**Mode:** light

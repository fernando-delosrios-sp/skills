---
version: alpha
name: Retail Velocity (E-Commerce & Logistics)
description: High-energy, fast-moving design representing consumer identity, frictionless checkout, and rapid global logistics.

colors:
  primary: "#0033A1"
  accent: "#EC4899"
  background: "#FAF5FF"
  surface: "#FAF5FF"
  surface-soft: "#ffffff"
  hairline: "#f3e8ff"
  divider: "#f3e8ff"
  ink: "#1d1d1f"
  ink-muted: "#475569"
  card-background: "#ffffff"
  card-border: "#f3e8ff"

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

Uses translucent glass and vibrant underlying mesh gradients to represent the speed and frictionless nature of retail tech.

## Visual Execution

**Motif:** Conveyor belts, flowing user journeys, shopping nodes, interconnected global maps, directional arrows.

**Execution:** Dynamic glassmorphism, translucent overlapping glass panels, blurred mesh backgrounds, speed trails implying fast parallax motion.

**Mode:** light

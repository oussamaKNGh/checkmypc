#!/usr/bin/env python3
"""Replaces hardcoded surface colours in picker.css with theme tokens.

Only `background`/`background-color` values are touched - `color:#fff` (white
text on the blue buttons) and semantic badge colours are left alone, since
those must NOT flip with the theme.

Idempotent: re-running finds nothing left to replace.
"""
import re, pathlib

CSS = pathlib.Path(__file__).resolve().parent.parent / "assets" / "picker.css"
src = CSS.read_text(encoding="utf-8")

# hex -> token. Ordered longest-first so #ffffff never half-matches #fff.
MAP = [
    ("#ffffff", "var(--card)"),
    ("#fbfdff", "var(--surface-2)"),
    ("#f7fbfe", "var(--surface-2)"),
    ("#f6fbfe", "var(--surface-2)"),
    ("#f8fafc", "var(--surface-2)"),
    ("#f2f8fc", "var(--surface-3)"),
    ("#f0f7fc", "var(--surface-3)"),
    ("#edf8fe", "var(--surface-3)"),
    ("#e8f6ff", "var(--surface-3)"),
    ("#eef6fc", "var(--surface-3)"),
    ("#fff", "var(--card)"),
]

BG = re.compile(r"(background(?:-color)?\s*:\s*)([^;}]+)")


def swap(m):
    prop, val = m.group(1), m.group(2)
    # leave gradients and semantic badge fills untouched
    if "gradient" in val:
        return prop + val
    for hexv, token in MAP:
        val = re.sub(re.escape(hexv) + r"\b", token, val)
    return prop + val


out = BG.sub(swap, src)

# the sticky header uses a translucent white; make it a token too
out = out.replace("background:rgba(255,255,255,.96)", "background:var(--header-bg)")

CSS.write_text(out, encoding="utf-8")

remaining = len(re.findall(r"background(?:-color)?\s*:\s*[^;}]*#fff", out))
print("tokenised. remaining hardcoded #fff backgrounds: %d" % remaining)
print("color:#fff preserved: %d" % len(re.findall(r"color\s*:\s*#fff", out)))

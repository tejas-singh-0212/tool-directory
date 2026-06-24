#!/usr/bin/env python3
"""Validate tools.json for the tool directory."""

from __future__ import annotations

import json
import sys
from collections import defaultdict
from pathlib import Path
from urllib.parse import urlparse

TOOLS_FILE = Path("tools.json")

REQUIRED_FIELDS = ("name", "url", "purpose", "category")

ALLOWED_CATEGORIES = {
    "AI Agents",
    "AI Chat",
    "AI Writing",
    "AI Coding",
    "Web Builder",
    "Design",
    "Image Editing",
    "Image Generation",
    "Video",
    "Audio & Music",
    "Presentation",
    "Research",
    "Learning",
    "Coding Practice",
    "Developer Tools",
    "Productivity",
    "Automation",
    "Jobs & Career",
    "Travel",
    "3D & CAD",
    "Games",
    "Utilities",
    "Cybersecurity",
    "Hardware & Simulation",
    "Marketplaces",
    "Other",
}


def normalize_url(url: str) -> str:
    """Normalize URL for duplicate detection."""
    return url.strip().lower().rstrip("/")


def add_error(errors: list[str], index: int | None, message: str) -> None:
    if index is None:
        errors.append(message)
    else:
        errors.append(f"Tool #{index + 1}: {message}")


def main() -> int:
    errors: list[str] = []

    if not TOOLS_FILE.exists():
        print(f"ERROR: {TOOLS_FILE} does not exist.", file=sys.stderr)
        return 1

    try:
        with TOOLS_FILE.open("r", encoding="utf-8-sig") as file:
            data = json.load(file)
    except json.JSONDecodeError as error:
        print(f"ERROR: Invalid JSON in {TOOLS_FILE}: {error}", file=sys.stderr)
        return 1

    if not isinstance(data, list):
        print("ERROR: tools.json must contain a top-level array.", file=sys.stderr)
        return 1

    names: defaultdict[str, list[int]] = defaultdict(list)
    urls: defaultdict[str, list[int]] = defaultdict(list)

    for index, tool in enumerate(data):
        if not isinstance(tool, dict):
            add_error(errors, index, "entry must be an object")
            continue

        for field in REQUIRED_FIELDS:
            value = tool.get(field)

            if field not in tool:
                add_error(errors, index, f"missing required field `{field}`")
                continue

            if not isinstance(value, str):
                add_error(errors, index, f"field `{field}` must be a string")
                continue

            if not value.strip():
                add_error(errors, index, f"field `{field}` cannot be empty")

        name = tool.get("name", "")
        url = tool.get("url", "")
        category = tool.get("category", "")

        if isinstance(name, str) and name.strip():
            names[name.strip().casefold()].append(index)

        if isinstance(url, str) and url.strip():
            normalized_url = normalize_url(url)
            urls[normalized_url].append(index)

            parsed = urlparse(url)
            if parsed.scheme not in {"http", "https"} or not parsed.netloc:
                add_error(errors, index, f"invalid URL `{url}`")

        if isinstance(category, str) and category.strip():
            if category.strip() not in ALLOWED_CATEGORIES:
                add_error(errors, index, f"unknown category `{category}`")

    for normalized_name, indexes in names.items():
        if len(indexes) > 1:
            labels = ", ".join(f"#{i + 1}" for i in indexes)
            add_error(errors, None, f"duplicate name `{normalized_name}` at {labels}")

    for normalized_url, indexes in urls.items():
        if len(indexes) > 1:
            labels = ", ".join(f"#{i + 1}" for i in indexes)
            add_error(errors, None, f"duplicate URL `{normalized_url}` at {labels}")

    if errors:
        print("tools.json validation failed:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1

    print(f"tools.json validation passed. Total tools: {len(data)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

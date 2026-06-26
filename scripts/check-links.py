#!/usr/bin/env python3
"""Check external links listed in tools.json."""

import argparse
import json
import socket
import ssl
import sys
import time
from dataclasses import dataclass
from http.client import HTTPConnection, HTTPSConnection, HTTPException
from pathlib import Path
from typing import Iterable
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse
from urllib.request import Request, urlopen

TOOLS_FILE = Path("tools.json")

ACCEPTABLE_STATUS_CODES = {401, 403, 429}
DEFAULT_USER_AGENT = "Mozilla/5.0 (compatible; ToolDirectoryLinkChecker/1.0; +https://github.com/)"


@dataclass
class LinkResult:
    name: str
    url: str
    status: str
    detail: str
    final_url: str | None = None
    status_code: int | None = None

    @property
    def is_problematic(self) -> bool:
        return self.status == "BROKEN"


def load_tools() -> list[dict]:
    with TOOLS_FILE.open("r", encoding="utf-8-sig") as file:
        data = json.load(file)

    if not isinstance(data, list):
        raise ValueError("tools.json must contain a top-level array")

    return data


def is_status_ok(status_code: int) -> bool:
    return 200 <= status_code <= 399 or status_code in ACCEPTABLE_STATUS_CODES


def classify_status(status_code: int, original_url: str, final_url: str) -> str:
    if not is_status_ok(status_code):
        return "BROKEN"

    if status_code in ACCEPTABLE_STATUS_CODES:
        return "ALLOWED"

    if final_url.rstrip("/") != original_url.rstrip("/"):
        return "REDIRECT"

    return "OK"


def request_url(url: str, timeout: float, method: str) -> tuple[int, str]:
    request = Request(
        url,
        method=method,
        headers={
            "User-Agent": DEFAULT_USER_AGENT,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
    )

    with urlopen(request, timeout=timeout) as response:
        status_code = response.getcode()
        final_url = response.geturl()
        return status_code, final_url


def check_link(name: str, url: str, timeout: float) -> LinkResult:
    parsed = urlparse(url)

    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        return LinkResult(name=name, url=url, status="BROKEN", detail="invalid URL format")

    methods = ("HEAD", "GET")
    last_error: Exception | None = None

    for method in methods:
        try:
            status_code, final_url = request_url(url, timeout, method)
            status = classify_status(status_code, url, final_url)
            detail = f"HTTP {status_code}"

            if status == "REDIRECT":
                detail = f"HTTP {status_code} -> {final_url}"
            elif status == "ALLOWED":
                detail = f"HTTP {status_code} (allowed)"

            return LinkResult(
                name=name,
                url=url,
                status=status,
                detail=detail,
                final_url=final_url,
                status_code=status_code,
            )
        except HTTPError as error:
            if method == "HEAD" and error.code in {405, 403, 406, 501}:
                last_error = error
                continue

            status_code = error.code
            final_url = error.geturl() or url
            status = classify_status(status_code, url, final_url)
            detail = f"HTTP {status_code}"

            if status == "ALLOWED":
                detail = f"HTTP {status_code} (allowed)"

            return LinkResult(
                name=name,
                url=url,
                status=status,
                detail=detail,
                final_url=final_url,
                status_code=status_code,
            )
        except (URLError, TimeoutError, socket.timeout, ssl.SSLError, HTTPException, OSError) as error:
            last_error = error
            if method == "HEAD":
                continue

    detail = str(last_error) if last_error else "request failed"
    return LinkResult(name=name, url=url, status="BROKEN", detail=detail)


def iter_links(tools: Iterable[dict]) -> Iterable[tuple[str, str]]:
    for index, tool in enumerate(tools, start=1):
        name = str(tool.get("name") or f"Tool #{index}").strip()
        url = str(tool.get("url") or "").strip()
        yield name, url


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Check URLs listed in tools.json")
    parser.add_argument("--timeout", type=float, default=10.0, help="timeout per request in seconds")
    parser.add_argument("--delay", type=float, default=0.25, help="delay between requests in seconds")
    parser.add_argument("--strict", action="store_true", help="exit with code 1 if broken links are found")
    return parser.parse_args()


def main() -> int:
    args = parse_args()

    try:
        tools = load_tools()
    except Exception as error:
        print(f"Failed to load tools.json: {error}", file=sys.stderr)
        return 1

    results: list[LinkResult] = []
    total = len(tools)

    print(f"Checking {total} links...")

    for index, (name, url) in enumerate(iter_links(tools), start=1):
        result = check_link(name, url, args.timeout)
        results.append(result)
        print(f"[{index:03}/{total:03}] {result.status:8} {name} — {result.url} ({result.detail})")

        if args.delay > 0 and index < total:
            time.sleep(args.delay)

    counts: dict[str, int] = {}
    for result in results:
        counts[result.status] = counts.get(result.status, 0) + 1

    broken = [result for result in results if result.is_problematic]

    print("\nSummary")
    print("-------")
    print(f"Total:     {len(results)}")
    print(f"OK:        {counts.get('OK', 0)}")
    print(f"Redirects: {counts.get('REDIRECT', 0)}")
    print(f"Allowed:   {counts.get('ALLOWED', 0)}")
    print(f"Broken:    {counts.get('BROKEN', 0)}")

    if broken:
        print("\nProblematic links:")
        for result in broken:
            print(f"- {result.name}: {result.url} ({result.detail})")

    if args.strict and broken:
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())

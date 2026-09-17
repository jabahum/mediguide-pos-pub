#!/usr/bin/env python3
"""Compute conservative monorepo CI dependencies from a Git diff."""
import argparse
import json
import os
import subprocess

MODULES = ("backend", "worker", "dashboard", "guidelines", "infra", "mobile")
IMAGES = [
    ("backend", {"name": "API", "package": "mediguide-pos-api", "context": ".", "dockerfile": "./backend/Dockerfile", "target": "production"}),
    ("worker", {"name": "AI worker", "package": "mediguide-pos-ai-worker", "context": "./ai-worker", "dockerfile": "./ai-worker/Dockerfile", "target": "production"}),
    ("dashboard", {"name": "Dashboard", "package": "mediguide-pos-dashboard", "context": "./dashboard", "dockerfile": "./dashboard/Dockerfile", "target": "production"}),
    ("guidelines", {"name": "Guidelines", "package": "mediguide-pos-guidelines", "context": ".", "dockerfile": "./guidelines-platform/Dockerfile.prod", "target": "runtime"}),
]


def classify(paths, full=False):
    changed = {name: full for name in MODULES}
    for path in paths:
        if path.startswith((".github/", "scripts/", "proto/", "protos/")) or path in {"VERSION", ".dockerignore", "Makefile", ".gitattributes"}:
            return dict.fromkeys(MODULES, True)
        if path.startswith("backend/"):
            # Backend API/schema changes invalidate generated consumer contracts.
            for name in ("backend", "dashboard", "guidelines", "mobile"):
                changed[name] = True
        if path.startswith("ai-worker/"):
            changed["worker"] = True
        if path.startswith("dashboard/"):
            changed["dashboard"] = True
        if path.startswith("dashboard/samples/") or path.startswith("clinical-tools/"):
            changed["backend"] = True
        if path.startswith("guidelines-platform/"):
            changed["guidelines"] = True
        if path.startswith("user_app/"):
            changed["mobile"] = True
        if path.startswith("infra/"):
            changed["infra"] = True
    return changed


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base")
    parser.add_argument("--head", default="HEAD")
    parser.add_argument("--full", action="store_true")
    args = parser.parse_args()
    full = args.full or not args.base or set(args.base) == {"0"}
    paths = []
    if not full:
        result = subprocess.run(["git", "diff", "--name-only", "-z", args.base, args.head], check=True, capture_output=True)
        paths = result.stdout.decode().split("\0")
    changed = classify(paths, full)
    print(json.dumps(changed))
    if os.environ.get("GITHUB_OUTPUT"):
        with open(os.environ["GITHUB_OUTPUT"], "a") as output:
            for name, value in changed.items():
                output.write(f"{name}={str(value).lower()}\n")
            images = [image for module, image in IMAGES if changed[module] or changed["infra"]]
            # An unused sentinel prevents expression expansion of an empty matrix;
            # build_images=false ensures it never allocates a build runner.
            output.write("images=" + json.dumps({"include": images or [IMAGES[0][1]]}) + "\n")
            output.write(f"build_images={str(bool(images)).lower()}\n")


if __name__ == "__main__":
    main()

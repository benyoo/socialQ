---
description: Code quality standards applied when editing source files
globs: src/**/*
---

# Code Quality Rules

- All functions must have clear documentation (docstrings, JSDoc, or equivalent)
- Avoid magic numbers — use named constants
- Handle errors explicitly; never silently swallow exceptions
- Prefer pure functions where possible
- Keep cyclomatic complexity low — extract complex logic into helper functions
- Ensure new code has corresponding test coverage

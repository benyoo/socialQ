---
description: Testing standards applied when editing test files
globs: tests/**/*
---

# Testing Rules

- Follow the Arrange-Act-Assert pattern
- Test one behavior per test function
- Use descriptive test names that explain the expected behavior
- Mock external dependencies; don't make real network calls in unit tests
- Include edge cases and error scenarios, not just happy paths

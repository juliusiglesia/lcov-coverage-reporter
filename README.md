# LCOV Coverage Reporter

GitHub Action that reports LCOV coverage in a PR comment with threshold enforcement for overall, changed-file, and changed-line coverage.

## Usage

```yaml
- name: Report coverage
  uses: juliusiglesia/lcov-coverage-reporter@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    lcov-file: ./coverage.lcov
    filter-changed-files: true
    delete-old-comments: true
    min-coverage-overall: 59
    min-coverage-changed-files: 70
    min-coverage-changed-lines: 70
```

## Inputs

| Input | Default | Description |
|-------|---------|-------------|
| `github-token` | `${{ github.token }}` | GitHub API token |
| `lcov-file` | `coverage/lcov.info` | Path to LCOV file |
| `filter-changed-files` | `false` | Only show changed files in per-file table |
| `delete-old-comments` | `false` | Remove previous coverage comments before posting |
| `title` | `Coverage Report` | Comment heading |
| `min-coverage-overall` | — | Minimum total project coverage %. Only enforced if set. |
| `min-coverage-changed-files` | — | Minimum average coverage of files touched in the PR. Only enforced if set. |
| `min-coverage-changed-lines` | — | Minimum coverage of lines added/modified in the diff. Only enforced if set. |
| `fail-on-threshold-violation` | `true` | Fail the check when any set threshold is breached. |

## Outputs

| Output | Description |
|--------|-------------|
| `coverage-overall` | Total project coverage % |
| `coverage-changed-files` | Changed files coverage % |
| `coverage-changed-lines` | Changed lines coverage % |

## Permissions

Minimum required workflow permissions:

```yaml
permissions:
  contents: read
  pull-requests: write
```

## How it works

1. Parses the LCOV file for per-file and total coverage
2. Fetches changed files from the GitHub compare API
3. Runs `git diff` to identify added lines for line-level coverage
4. Posts a PR comment with a threshold summary table and per-file breakdown
5. Calls `core.setFailed()` if any set threshold is breached (unless `fail-on-threshold-violation` is `false`)

Changed-lines coverage only measures lines the author added or modified, so adding code to a low-coverage file doesn't penalize the author for existing uncovered code.

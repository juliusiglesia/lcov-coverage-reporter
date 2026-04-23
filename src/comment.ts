import { FileCoverage } from "./lcov"
import { ThresholdResult } from "./threshold"

function escapeMarkdown(s: string): string {
  return s.replace(/[|[\]<>`]/g, (c) => `\\${c}`)
}

interface CommentOptions {
  lcov: FileCoverage[]
  title: string
  thresholdResults: ThresholdResult
  changedFiles?: string[]
}

function formatUncoveredLines(details: { line: number; hit: number }[]): string {
  const uncovered = details.filter((d) => d.hit === 0).map((d) => d.line)
  if (uncovered.length === 0) return ""

  const ranges: string[] = []
  let start = uncovered[0]
  let end = uncovered[0]

  for (let i = 1; i < uncovered.length; i++) {
    if (uncovered[i] === end + 1) {
      end = uncovered[i]
    } else {
      ranges.push(start === end ? `${start}` : `${start}-${end}`)
      start = uncovered[i]
      end = uncovered[i]
    }
  }
  ranges.push(start === end ? `${start}` : `${start}-${end}`)

  return ranges.join(", ")
}

function thresholdTable(results: ThresholdResult): string {
  if (results.rows.length === 0) return ""

  const header = `| Metric | Coverage | Threshold | Result |\n|--------|----------|-----------|--------|`
  const rows = results.rows
    .map((r) => {
      const status = r.passed ? "🟢 Pass" : "🔴 Fail"
      return `| ${r.name} | ${r.value.toFixed(2)}% | ${r.threshold}% | ${status} |`
    })
    .join("\n")

  return `${header}\n${rows}\n\n---\n\n`
}

function fileTable(lcov: FileCoverage[], changedFiles?: string[]): string {
  let files = lcov
  if (changedFiles) {
    files = lcov.filter((entry) =>
      changedFiles.some(
        (f) => entry.file.endsWith(f) || f.endsWith(entry.file),
      ),
    )
  }

  if (files.length === 0) return ""

  const header = `| File | Lines | Uncovered Lines |\n|------|-------|-----------------|\n`
  const rows = files
    .map((f) => {
      const pct =
        f.lines.found === 0
          ? "N/A"
          : `${((f.lines.hit / f.lines.found) * 100).toFixed(2)}%`
      const uncovered = formatUncoveredLines(f.lines.details)
      return `| ${escapeMarkdown(f.file)} | ${pct} | ${uncovered} |`
    })
    .join("\n")

  return `<details>\n<summary>Coverage by file</summary>\n\n${header}${rows}\n\n</details>`
}

export function generateComment(options: CommentOptions): string {
  const { lcov, title, thresholdResults, changedFiles } = options

  let body = `### ${title}\n\n`
  body += thresholdTable(thresholdResults)
  body += fileTable(lcov, changedFiles)

  return body
}

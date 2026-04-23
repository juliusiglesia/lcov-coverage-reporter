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
  headBranch?: string
  baseBranch?: string
  repoUrl?: string
  headSha?: string
}

function formatUncoveredLines(
  details: { line: number; hit: number }[],
  filePath?: string,
  repoUrl?: string,
  headSha?: string,
): string {
  const uncovered = details.filter((d) => d.hit === 0).map((d) => d.line)
  if (uncovered.length === 0) return ""

  const ranges: { start: number; end: number }[] = []
  let rangeStart = uncovered[0]
  let rangeEnd = uncovered[0]

  for (let i = 1; i < uncovered.length; i++) {
    if (uncovered[i] === rangeEnd + 1) {
      rangeEnd = uncovered[i]
    } else {
      ranges.push({ start: rangeStart, end: rangeEnd })
      rangeStart = uncovered[i]
      rangeEnd = uncovered[i]
    }
  }
  ranges.push({ start: rangeStart, end: rangeEnd })

  const canLink = repoUrl && headSha && filePath

  return ranges
    .map((r) => {
      const label = r.start === r.end ? `${r.start}` : `${r.start}-${r.end}`
      if (canLink) {
        const anchor = r.start === r.end ? `L${r.start}` : `L${r.start}-L${r.end}`
        return `[${label}](${repoUrl}/blob/${headSha}/${filePath}#${anchor})`
      }
      return label
    })
    .join(", ")
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

function getPackage(filePath: string): string {
  const parts = filePath.split("/")
  return parts.length > 1 ? parts.slice(0, -1).join("/") : ""
}

function getFileName(filePath: string): string {
  const parts = filePath.split("/")
  return parts[parts.length - 1]
}

function fileLink(filePath: string, repoUrl?: string, headSha?: string): string {
  const name = escapeMarkdown(getFileName(filePath))
  if (repoUrl && headSha) {
    return `[${name}](${repoUrl}/blob/${headSha}/${filePath})`
  }
  return name
}

function fileTable(
  lcov: FileCoverage[],
  changedFiles?: string[],
  repoUrl?: string,
  headSha?: string,
): string {
  let files = lcov
  if (changedFiles) {
    files = lcov.filter((entry) =>
      changedFiles.some(
        (f) => entry.file.endsWith(f) || f.endsWith(entry.file),
      ),
    )
  }

  if (files.length === 0) return ""

  const grouped = new Map<string, FileCoverage[]>()
  for (const f of files) {
    const pkg = getPackage(f.file)
    if (!grouped.has(pkg)) grouped.set(pkg, [])
    grouped.get(pkg)!.push(f)
  }

  let table = `| File | Lines | Uncovered Lines |\n|------|-------|-----------------|\n`

  for (const [pkg, pkgFiles] of grouped) {
    if (pkg) {
      table += `| **${escapeMarkdown(pkg)}** | | |\n`
    }
    for (const f of pkgFiles) {
      const pct =
        f.lines.found === 0
          ? "N/A"
          : `${((f.lines.hit / f.lines.found) * 100).toFixed(2)}%`
      const uncovered = formatUncoveredLines(f.lines.details, f.file, repoUrl, headSha)
      const link = fileLink(f.file, repoUrl, headSha)
      table += `| ${pkg ? "&nbsp;&nbsp;" : ""}${link} | ${pct} | ${uncovered} |\n`
    }
  }

  return `<details>\n<summary>Coverage by file</summary>\n\n${table}\n</details>`
}

export function generateComment(options: CommentOptions): string {
  const { lcov, title, thresholdResults, changedFiles, headBranch, baseBranch, repoUrl, headSha } = options

  let body = `### ${title}\n\n`
  if (headBranch && baseBranch) {
    body += `Coverage after merging \`${headBranch}\` into \`${baseBranch}\`\n\n`
  }
  body += thresholdTable(thresholdResults)
  body += fileTable(lcov, changedFiles, repoUrl, headSha)

  return body
}

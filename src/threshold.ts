import { FileCoverage } from "./lcov"
import { DiffMap } from "./diff-lines"

export interface ThresholdRow {
  name: string
  value: number
  threshold: number
  passed: boolean
}

export interface ThresholdResult {
  rows: ThresholdRow[]
  failures: string[]
}

export interface ThresholdInput {
  overall: number | null
  changedFiles: number | null
  changedLines: number | null
  thresholds: {
    overall: number | null
    changedFiles: number | null
    changedLines: number | null
  }
}

export function computeChangedFilesCoverage(
  lcov: FileCoverage[],
  changedFiles: string[],
): number | null {
  if (changedFiles.length === 0) return null

  const matched = lcov.filter((entry) =>
    changedFiles.some(
      (f) => entry.file.endsWith(f) || f.endsWith(entry.file),
    ),
  )

  if (matched.length === 0) return null

  const totalFound = matched.reduce((sum, e) => sum + e.lines.found, 0)
  const totalHit = matched.reduce((sum, e) => sum + e.lines.hit, 0)

  if (totalFound === 0) return null
  return (totalHit / totalFound) * 100
}

export function computeChangedLinesCoverage(
  lcov: FileCoverage[],
  diffLines: DiffMap,
): number | null {
  let totalLines = 0
  let coveredLines = 0

  for (const entry of lcov) {
    const fileKey = Object.keys(diffLines).find(
      (f) => entry.file.endsWith(f) || f.endsWith(entry.file),
    )
    if (!fileKey) continue

    const addedLineNumbers = diffLines[fileKey]
    const lineDetails = new Map(
      entry.lines.details.map((d) => [d.line, d.hit]),
    )

    for (const ln of addedLineNumbers) {
      if (!lineDetails.has(ln)) continue
      totalLines++
      if (lineDetails.get(ln)! > 0) {
        coveredLines++
      }
    }
  }

  if (totalLines === 0) return null
  return (coveredLines / totalLines) * 100
}

export function checkThresholds(input: ThresholdInput): ThresholdResult {
  const metrics = [
    { name: "Overall", value: input.overall, threshold: input.thresholds.overall },
    { name: "Changed files", value: input.changedFiles, threshold: input.thresholds.changedFiles },
    { name: "Changed lines", value: input.changedLines, threshold: input.thresholds.changedLines },
  ]

  const rows: ThresholdRow[] = []
  const failures: string[] = []

  for (const { name, value, threshold } of metrics) {
    if (threshold === null || threshold === undefined) continue
    if (value === null || value === undefined) continue

    const passed = value >= threshold
    rows.push({ name, value, threshold, passed })

    if (!passed) {
      failures.push(
        `${name} coverage ${value.toFixed(2)}% is below threshold ${threshold}%`,
      )
    }
  }

  return { rows, failures }
}

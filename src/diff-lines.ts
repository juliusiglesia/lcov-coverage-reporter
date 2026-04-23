import { execFileSync } from "child_process"

export type DiffMap = Record<string, number[]>

export function parseDiff(diffOutput: string): DiffMap {
  const result: DiffMap = {}
  let currentFile: string | null = null
  let lineNumber = 0

  for (const line of diffOutput.split("\n")) {
    if (line.startsWith("+++ b/")) {
      currentFile = line.slice(6)
      continue
    }

    if (line.startsWith("+++ ") || line.startsWith("--- ")) {
      continue
    }

    const hunkMatch = line.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/)
    if (hunkMatch) {
      lineNumber = parseInt(hunkMatch[1], 10)
      continue
    }

    if (currentFile === null) continue

    if (line.startsWith("+")) {
      if (!result[currentFile]) {
        result[currentFile] = []
      }
      result[currentFile].push(lineNumber)
      lineNumber++
    } else if (line.startsWith("-")) {
      // deleted line — don't increment
    } else {
      lineNumber++
    }
  }

  return result
}

export function getDiffLines(baseSha: string): DiffMap {
  if (!/^[0-9a-f]{40}$/.test(baseSha)) {
    throw new Error(`Invalid base SHA: ${baseSha}`)
  }
  const output = execFileSync("git", ["diff", `${baseSha}...HEAD`], {
    encoding: "utf-8",
    maxBuffer: 50 * 1024 * 1024,
  })
  return parseDiff(output)
}

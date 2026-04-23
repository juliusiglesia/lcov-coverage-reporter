import lcovParse from "lcov-parse"

export interface LineDetail {
  line: number
  hit: number
}

export interface FileCoverage {
  file: string
  lines: {
    found: number
    hit: number
    details: LineDetail[]
  }
}

export function parseLcov(content: string): Promise<FileCoverage[]> {
  return new Promise((resolve, reject) => {
    if (!content.trim()) {
      resolve([])
      return
    }
    lcovParse(content, (err: Error | null, data: FileCoverage[]) => {
      if (err) reject(err)
      else resolve(data || [])
    })
  })
}

export function percentage(lcov: FileCoverage[]): number {
  const total = lcov.reduce((sum, f) => sum + f.lines.found, 0)
  const hit = lcov.reduce((sum, f) => sum + f.lines.hit, 0)
  if (total === 0) return 0
  return (hit / total) * 100
}

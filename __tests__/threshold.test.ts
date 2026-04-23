import {
  computeChangedFilesCoverage,
  computeChangedLinesCoverage,
  checkThresholds,
} from "../src/threshold"
import { FileCoverage } from "../src/lcov"
import { DiffMap } from "../src/diff-lines"

const lcov: FileCoverage[] = [
  {
    file: "src/foo.ts",
    lines: {
      found: 10,
      hit: 8,
      details: [
        { line: 1, hit: 1 },
        { line: 2, hit: 1 },
        { line: 3, hit: 0 },
        { line: 4, hit: 1 },
        { line: 5, hit: 1 },
        { line: 6, hit: 1 },
        { line: 7, hit: 0 },
        { line: 8, hit: 1 },
        { line: 9, hit: 1 },
        { line: 10, hit: 1 },
      ],
    },
  },
  {
    file: "src/bar.ts",
    lines: {
      found: 4,
      hit: 2,
      details: [
        { line: 1, hit: 1 },
        { line: 2, hit: 0 },
        { line: 3, hit: 0 },
        { line: 4, hit: 1 },
      ],
    },
  },
]

describe("computeChangedFilesCoverage", () => {
  test("computes coverage for changed files only", () => {
    const result = computeChangedFilesCoverage(lcov, ["src/bar.ts"])
    expect(result).toBeCloseTo(50.0)
  })

  test("computes coverage across multiple changed files", () => {
    const result = computeChangedFilesCoverage(lcov, [
      "src/foo.ts",
      "src/bar.ts",
    ])
    expect(result).toBeCloseTo(71.43, 1)
  })

  test("returns null when no changed files match LCOV data", () => {
    expect(computeChangedFilesCoverage(lcov, ["src/unknown.ts"])).toBeNull()
  })

  test("returns null for empty changed files list", () => {
    expect(computeChangedFilesCoverage(lcov, [])).toBeNull()
  })
})

describe("computeChangedLinesCoverage", () => {
  test("computes coverage for only added lines", () => {
    const diffLines: DiffMap = { "src/foo.ts": [1, 2, 3] }
    const result = computeChangedLinesCoverage(lcov, diffLines)
    expect(result).toBeCloseTo(66.67, 1)
  })

  test("excludes files not in LCOV data", () => {
    const diffLines: DiffMap = {
      "src/foo.ts": [1, 2],
      "src/unknown.ts": [1, 2, 3],
    }
    const result = computeChangedLinesCoverage(lcov, diffLines)
    expect(result).toBeCloseTo(100.0)
  })

  test("excludes diff lines not in LCOV details", () => {
    const diffLines: DiffMap = { "src/foo.ts": [1, 99] }
    const result = computeChangedLinesCoverage(lcov, diffLines)
    expect(result).toBeCloseTo(100.0)
  })

  test("returns null when no diff lines match LCOV data", () => {
    const diffLines: DiffMap = { "src/unknown.ts": [1, 2] }
    expect(computeChangedLinesCoverage(lcov, diffLines)).toBeNull()
  })

  test("returns null for empty diff lines", () => {
    expect(computeChangedLinesCoverage(lcov, {})).toBeNull()
  })
})

describe("checkThresholds", () => {
  test("passes when all metrics meet thresholds", () => {
    const results = checkThresholds({
      overall: 71.43,
      changedFiles: 50.0,
      changedLines: 66.67,
      thresholds: { overall: 60, changedFiles: 40, changedLines: 60 },
    })
    expect(results.failures).toEqual([])
    expect(results.rows).toHaveLength(3)
    expect(results.rows[0].passed).toBe(true)
  })

  test("fails when a metric is below threshold", () => {
    const results = checkThresholds({
      overall: 50.0,
      changedFiles: 30.0,
      changedLines: 80.0,
      thresholds: { overall: 60, changedFiles: 40, changedLines: 70 },
    })
    expect(results.failures).toEqual([
      "Overall coverage 50.00% is below threshold 60%",
      "Changed files coverage 30.00% is below threshold 40%",
    ])
  })

  test("skips metrics with no threshold set", () => {
    const results = checkThresholds({
      overall: 50.0,
      changedFiles: null,
      changedLines: null,
      thresholds: { overall: 60, changedFiles: null, changedLines: null },
    })
    expect(results.rows).toHaveLength(1)
    expect(results.failures).toHaveLength(1)
  })

  test("skips metrics with null coverage", () => {
    const results = checkThresholds({
      overall: 80.0,
      changedFiles: null,
      changedLines: null,
      thresholds: { overall: 60, changedFiles: 70, changedLines: 70 },
    })
    expect(results.rows).toHaveLength(1)
  })

  test("returns empty when no thresholds set", () => {
    const results = checkThresholds({
      overall: 80.0,
      changedFiles: 50.0,
      changedLines: 60.0,
      thresholds: { overall: null, changedFiles: null, changedLines: null },
    })
    expect(results.rows).toEqual([])
    expect(results.failures).toEqual([])
  })
})

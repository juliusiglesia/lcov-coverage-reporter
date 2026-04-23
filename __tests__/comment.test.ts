import { generateComment } from "../src/comment"
import { FileCoverage } from "../src/lcov"
import { ThresholdResult } from "../src/threshold"

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
]

describe("generateComment", () => {
  test("includes threshold table when thresholds are set", () => {
    const thresholds: ThresholdResult = {
      rows: [
        { name: "Overall", value: 80.0, threshold: 59.0, passed: true },
        { name: "Changed lines", value: 45.0, threshold: 70.0, passed: false },
      ],
      failures: ["Changed lines coverage 45.00% is below threshold 70%"],
    }

    const result = generateComment({
      lcov,
      title: "Coverage Report",
      thresholdResults: thresholds,
    })

    expect(result).toContain("Coverage Report")
    expect(result).toContain("80.00%")
    expect(result).toContain("59%")
    expect(result).toContain("🟢 Pass")
    expect(result).toContain("🔴 Fail")
    expect(result).toContain("src/foo.ts")
  })

  test("omits threshold table when no thresholds", () => {
    const thresholds: ThresholdResult = { rows: [], failures: [] }

    const result = generateComment({
      lcov,
      title: "Coverage Report",
      thresholdResults: thresholds,
    })

    expect(result).not.toContain("Threshold")
    expect(result).toContain("src/foo.ts")
  })

  test("filters to changed files when specified", () => {
    const result = generateComment({
      lcov,
      title: "Coverage Report",
      thresholdResults: { rows: [], failures: [] },
      changedFiles: ["src/other.ts"],
    })

    expect(result).not.toContain("src/foo.ts")
  })

  test("shows uncovered line numbers", () => {
    const result = generateComment({
      lcov,
      title: "Coverage Report",
      thresholdResults: { rows: [], failures: [] },
    })

    expect(result).toContain("3")
    expect(result).toContain("7")
  })
})

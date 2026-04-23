import { parseLcov, percentage, FileCoverage } from "../src/lcov"

const SAMPLE_LCOV = `TN:
SF:src/foo.ts
DA:1,1
DA:2,1
DA:3,0
DA:4,1
DA:5,0
LF:5
LH:3
end_of_record
TN:
SF:src/bar.ts
DA:1,1
DA:2,0
LF:2
LH:1
end_of_record
`

describe("parseLcov", () => {
  test("parses LCOV string into file coverage array", async () => {
    const result = await parseLcov(SAMPLE_LCOV)
    expect(result).toHaveLength(2)
    expect(result[0].file).toBe("src/foo.ts")
    expect(result[0].lines.found).toBe(5)
    expect(result[0].lines.hit).toBe(3)
    expect(result[0].lines.details).toHaveLength(5)
    expect(result[1].file).toBe("src/bar.ts")
  })

  test("returns empty array for empty input", async () => {
    const result = await parseLcov("")
    expect(result).toEqual([])
  })
})

describe("percentage", () => {
  test("computes overall coverage across all files", async () => {
    const lcov = await parseLcov(SAMPLE_LCOV)
    expect(percentage(lcov)).toBeCloseTo(57.14, 1)
  })

  test("returns 0 for empty lcov", () => {
    expect(percentage([])).toBe(0)
  })
})

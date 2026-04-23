import { parseDiff, getDiffLines } from "../src/diff-lines"

describe("parseDiff", () => {
  test("extracts added line numbers from unified diff", () => {
    const diff = [
      "diff --git a/src/foo.ts b/src/foo.ts",
      "index abc1234..def5678 100644",
      "--- a/src/foo.ts",
      "+++ b/src/foo.ts",
      "@@ -10,6 +10,8 @@ function existing() {",
      " unchanged line",
      "+added line one",
      "+added line two",
      " another unchanged",
      "@@ -30,3 +32,5 @@ function other() {",
      " context",
      "+new line at 34",
      "+new line at 35",
      " trailing",
    ].join("\n")

    const result = parseDiff(diff)
    expect(result).toEqual({
      "src/foo.ts": [11, 12, 33, 34],
    })
  })

  test("handles multiple files", () => {
    const diff = [
      "diff --git a/src/a.ts b/src/a.ts",
      "--- a/src/a.ts",
      "+++ b/src/a.ts",
      "@@ -1,3 +1,4 @@",
      " line1",
      "+added at 2",
      " line2",
      " line3",
      "diff --git a/src/b.ts b/src/b.ts",
      "--- a/src/b.ts",
      "+++ b/src/b.ts",
      "@@ -5,3 +5,4 @@",
      " ctx",
      "+added at 6",
      " ctx",
    ].join("\n")

    const result = parseDiff(diff)
    expect(result).toEqual({
      "src/a.ts": [2],
      "src/b.ts": [6],
    })
  })

  test("skips removed lines", () => {
    const diff = [
      "diff --git a/src/foo.ts b/src/foo.ts",
      "--- a/src/foo.ts",
      "+++ b/src/foo.ts",
      "@@ -1,4 +1,3 @@",
      " kept",
      "-removed",
      "+replaced",
      " kept",
    ].join("\n")

    const result = parseDiff(diff)
    expect(result).toEqual({
      "src/foo.ts": [2],
    })
  })

  test("handles new files (--- /dev/null)", () => {
    const diff = [
      "diff --git a/src/new.ts b/src/new.ts",
      "new file mode 100644",
      "--- /dev/null",
      "+++ b/src/new.ts",
      "@@ -0,0 +1,3 @@",
      "+line one",
      "+line two",
      "+line three",
    ].join("\n")

    const result = parseDiff(diff)
    expect(result).toEqual({
      "src/new.ts": [1, 2, 3],
    })
  })

  test("returns empty object for empty diff", () => {
    expect(parseDiff("")).toEqual({})
  })
})

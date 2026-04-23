import * as core from "@actions/core"
import * as github from "@actions/github"
import * as fs from "fs"
import { parseLcov, percentage } from "./lcov"
import { getDiffLines } from "./diff-lines"
import { getChangedFiles } from "./changed-files"
import {
  computeChangedFilesCoverage,
  computeChangedLinesCoverage,
  checkThresholds,
} from "./threshold"
import { generateComment } from "./comment"
import { deleteOldComments, postComment } from "./github"

function getOptionalNumber(name: string): number | null {
  const val = core.getInput(name)
  if (!val) return null
  const num = parseFloat(val)
  return isNaN(num) ? null : num
}

async function run(): Promise<void> {
  try {
    const token = core.getInput("github-token", { required: true })
    core.setSecret(token)
    const lcovFile = core.getInput("lcov-file") || "coverage/lcov.info"
    const filterChangedFiles = core.getInput("display-changed-files-only") === "true"
    const shouldDeleteOld = core.getInput("delete-old-comments") === "true"
    const title = core.getInput("title") || "Coverage Report"
    const minOverall = getOptionalNumber("min-coverage-overall")
    const minChangedFiles = getOptionalNumber("min-coverage-changed-files")
    const minChangedLines = getOptionalNumber("min-coverage-changed-lines")
    const failOnViolation =
      core.getInput("fail-on-threshold-violation") !== "false"

    const lcovContent = fs.readFileSync(lcovFile, "utf-8")
    const lcov = await parseLcov(lcovContent)
    const overallCoverage = percentage(lcov)

    const context = github.context
    const isPR = context.eventName === "pull_request"

    if (!isPR) {
      core.info("Not a pull request event — skipping comment and thresholds")
      core.setOutput("coverage-overall", overallCoverage.toFixed(2))
      return
    }

    const pr = context.payload.pull_request!
    const prNumber = pr.number
    const baseSha = pr.base.sha
    const headSha = pr.head.sha

    let changedFiles: string[] = []
    try {
      changedFiles = await getChangedFiles(token, baseSha, headSha)
    } catch (err: any) {
      core.warning(`Could not fetch changed files: ${err.message}`)
    }

    let changedFilesCoverage: number | null = null
    if (changedFiles.length > 0) {
      changedFilesCoverage = computeChangedFilesCoverage(lcov, changedFiles)
    }

    let changedLinesCoverage: number | null = null
    try {
      const diffLines = getDiffLines(baseSha)
      changedLinesCoverage = computeChangedLinesCoverage(lcov, diffLines)
    } catch (err: any) {
      core.warning(`Could not compute changed lines coverage: ${err.message}`)
    }

    const thresholdResults = checkThresholds({
      overall: overallCoverage,
      changedFiles: changedFilesCoverage,
      changedLines: changedLinesCoverage,
      thresholds: {
        overall: minOverall,
        changedFiles: minChangedFiles,
        changedLines: minChangedLines,
      },
    })

    const commentBody = generateComment({
      lcov,
      title,
      thresholdResults,
      changedFiles: filterChangedFiles ? changedFiles : undefined,
    })

    if (shouldDeleteOld) {
      await deleteOldComments(token, prNumber, title)
    }

    await postComment(token, prNumber, commentBody)

    core.setOutput("coverage-overall", overallCoverage.toFixed(2))
    core.setOutput(
      "coverage-changed-files",
      changedFilesCoverage !== null ? changedFilesCoverage.toFixed(2) : "",
    )
    core.setOutput(
      "coverage-changed-lines",
      changedLinesCoverage !== null ? changedLinesCoverage.toFixed(2) : "",
    )

    if (failOnViolation && thresholdResults.failures.length > 0) {
      core.setFailed(thresholdResults.failures.join("\n"))
    }
  } catch (error: any) {
    core.setFailed(error.message)
  }
}

run()

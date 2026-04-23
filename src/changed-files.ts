import * as github from "@actions/github"

export async function getChangedFiles(
  token: string,
  base: string,
  head: string,
): Promise<string[]> {
  const octokit = github.getOctokit(token)
  const { owner, repo } = github.context.repo

  const response = await octokit.rest.repos.compareCommits({
    owner,
    repo,
    base,
    head,
  })

  return (response.data.files || [])
    .filter((f) => f.status === "modified" || f.status === "added")
    .map((f) => f.filename)
}

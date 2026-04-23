import * as github from "@actions/github"

export async function deleteOldComments(
  token: string,
  prNumber: number,
  title: string,
): Promise<void> {
  const octokit = github.getOctokit(token)
  const { owner, repo } = github.context.repo

  const { data: comments } = await octokit.rest.issues.listComments({
    owner,
    repo,
    issue_number: prNumber,
    per_page: 100,
  })

  for (const comment of comments) {
    if (
      comment.user?.login === "github-actions[bot]" &&
      comment.body?.includes(title)
    ) {
      await octokit.rest.issues.deleteComment({
        owner,
        repo,
        comment_id: comment.id,
      })
    }
  }
}

export async function postComment(
  token: string,
  prNumber: number,
  body: string,
): Promise<void> {
  const octokit = github.getOctokit(token)
  const { owner, repo } = github.context.repo

  await octokit.rest.issues.createComment({
    owner,
    repo,
    issue_number: prNumber,
    body,
  })
}

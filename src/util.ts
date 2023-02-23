import * as core from '@actions/core'
import {getInput} from '@actions/core'
import {context} from '@actions/github'
import {Octokit} from '@octokit/rest'

let octokit: Octokit | null = null

export function mockClient(mock: Octokit): void {
  octokit = mock
}

export function client(): Octokit {
  if (octokit) {
    return octokit
  }

  // Get the GitHub token from the environment
  const token = getInput('github-token')
  if (!token) {
    throw new Error('No token found, please set github-token input.')
  }
  return new Octokit({auth: `token ${token}`})
}

export function checkPrContentIgnoreChangelog(
  content: string,
  regex = /Exempt CHANGELOG changes: (.+)/
): boolean {
  // Exempt CHANGELOG changes: *
  // const regex = /Exempt CHANGELOG changes: (.+)/
  core.debug(`The content is ${content}`)
  const match = content.match(regex)

  if (!match) {
    return false
  }

  const reason = match[1]

  if (reason) {
    core.info(`The ignore reason: ${reason}`)
  }

  return true
}

export async function haveIgnoreChangeLogContent(
  prNumber: number
): Promise<boolean> {
  const {owner, repo} = context.repo
  const kit = client()

  const comments = await kit.paginate(kit.issues.listComments, {
    owner,
    repo,
    issue_number: prNumber,
    per_page: 100
  })

  // Get all have write permission user
  const writePermissionUsers = await kit.paginate(kit.repos.listCollaborators, {
    owner,
    repo,
    per_page: 100
  })

  const haveWritePermission = (name: string): boolean => {
    return writePermissionUsers.some(
      user =>
        user.login === name &&
        (user.permissions?.admin ||
          user.permissions?.push ||
          user.permissions?.maintain)
    )
  }

  for (const comment of comments) {
    const regex: string = core.getInput('ignore-comment-regex')
    const regExp = new RegExp(regex)

    if (
      comment.body &&
      comment.user?.login &&
      haveWritePermission(comment.user?.login) &&
      checkPrContentIgnoreChangelog(comment.body, regExp)
    ) {
      core.info('PR content have ignore command, skip check')
      core.info(`The url of ignore comment: ${comment.html_url}`)
      return true
    }
  }

  return false
}

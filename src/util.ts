import * as core from '@actions/core'
import {getInput} from '@actions/core'
import {Octokit} from '@octokit/rest'

let octokit: Octokit | null = null

let mockRegex: string | null = null

export function mockClient(mock: Octokit): void {
  octokit = mock
}

export function mockRegexContent(regex: string): void {
  mockRegex = regex
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

export function getRegex(): string {
  if (mockRegex) {
    return mockRegex
  }

  return core.getInput('ignore-comment-regexp', {
    required: true,
    trimWhitespace: true
  })
}

export function checkPrContentIgnoreChangelog(
  content: string,
  regex = /Exempt CHANGELOG changes: (.+)/
): boolean {
  const match = content.match(regex)

  core.debug(`The match is ${match}`)

  if (!match) {
    core.debug('No match')
    core.debug(`The regex is ${regex}`)
    core.debug(`The content is ${content}`)
    return false
  }

  core.debug(`The content is ${content}, matched with ${regex}`)

  const reason = match[1]

  if (reason) {
    core.info(`The ignore reason: ${reason}`)
  }

  return true
}

export async function haveIgnoreChangeLogContent(
  owner: string,
  repo: string,
  prNumber: number
): Promise<boolean> {
  core.info('Start check pull comment content')

  const kit = client()

  const comments = await kit.paginate(kit.issues.listComments, {
    owner,
    repo,
    issue_number: prNumber,
    per_page: 100
  })

  core.info(`Get all comments ${comments.length}, start check.`)

  // Get all have write permission user
  const writePermissionUsers = await kit.paginate(kit.repos.listCollaborators, {
    owner,
    repo,
    per_page: 100
  })

  core.info(`Get all write permission users: ${writePermissionUsers.length}`)

  const haveWritePermission = (name: string): boolean => {
    return writePermissionUsers.some(
      user =>
        user.login === name &&
        (user.permissions?.admin ||
          user.permissions?.push ||
          user.permissions?.maintain)
    )
  }

  const regex: string = getRegex()
  const regExp = new RegExp(regex)
  core.info(`need check regExp: ${regExp}`)

  for (const comment of comments) {
    core.debug(`The comment url: ${comment.html_url}`)
    core.debug(`The comment body: ${comment.body}`)
    core.debug(`The comment user: ${comment.user?.login}`)
    if (comment.user?.login != null) {
      core.debug(
        `The comment user have write permission: ${haveWritePermission(
          comment.user?.login
        )}`
      )
    }

    if (
      comment.body &&
      comment.user?.login &&
      haveWritePermission(comment.user?.login) &&
      checkPrContentIgnoreChangelog(comment.body, regExp)
    ) {
      core.info(
        `The comment have ignore changelog content by user: ${comment.user?.login}`
      )
      core.info(`See the comment: ${comment.html_url}`)
      return true
    }
  }

  core.info('No ignore changelog content found. Check failed.')
  return false
}

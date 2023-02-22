import * as core from '@actions/core'
import {getInput} from '@actions/core'
import {Octokit} from '@octokit/rest'

export function client(token: string | null = ''): Octokit {
  // Get the GitHub token from the environment
  token ??= getInput('github-token')
  if (!token) {
    throw new Error('No token found, please set github-token input.')
  }
  return new Octokit({auth: `token ${token}`})
}

export function checkPrContentIgnoreChangelog(content: string): boolean {
  // Exempt CHANGELOG changes: *
  const regex = /Exempt CHANGELOG changes: (.+)/
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

export async function rerunWorkflow(
  pullRequestNumber: number,
  owner: string,
  repo: string
): Promise<void> {
  const github = client()

  const {data: checkSuites} = await github.checks.listForSuite({
    owner,
    repo,
    check_suite_id: pullRequestNumber
  })
}

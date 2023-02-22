import * as core from '@actions/core'
import {getInput} from '@actions/core'
import {Octokit} from '@octokit/rest'

export function client(token?: string): Octokit {
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

function log(message: string): void {
  core.info(message)
}

export async function rerunPrJobs(
  owner: string,
  repo: string,
  prNumber: number
): Promise<void> {
  const github = client()

  // get the PR
  const {data: pullRequest} = await github.pulls.get({
    owner,
    repo,
    pull_number: prNumber
  })

  // Get check suites for the PR
  const {data} = await github.checks.listSuitesForRef({
    owner,
    repo,
    ref: pullRequest.head.sha
  })

  const checkSuites = data.check_suites

  // Get the check runs for each check suite
  for (const checkSuite of checkSuites) {
    log(`Check suite ${checkSuite.id} has status ${checkSuite.status}`)
    if (!checkSuite.pull_requests) continue

    // Get runs for each check suite

    for (const pr of checkSuite.pull_requests) {
      const pullRequestUrl = `https://github.com/${owner}/${repo}/pull/${pr.number}`
      log(`The pr: ${pr.number}, url: ${pr.url}, html_url: ${pullRequestUrl}`)
      if (pr.number === prNumber) {
        log(`Rerunning check suite ${checkSuite.id}`)
        await github.checks.rerequestSuite({
          owner,
          repo,
          check_suite_id: checkSuite.id
        })
      }
    }
  }
}

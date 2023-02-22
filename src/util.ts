import * as core from '@actions/core'
import {getInput} from '@actions/core'
import {Octokit} from '@octokit/rest'

export function client(): Octokit {
  // Get the GitHub token from the environment
  const token = getInput('github-token')
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

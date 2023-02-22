import * as core from '@actions/core'
import {context} from '@actions/github'
import {checkPullRequest} from './check-pull-request-file'
import {onIssueComment} from './on-issue-comment'

async function run(): Promise<void> {
  try {
    core.info('Start check pull request content')

    const {owner, repo} = context.repo

    if (!owner || !repo) {
      core.info('Not found owner or repo, skip')
      return
    }

    const event = context.eventName

    core.info(`The trigger event is ${event}`)

    core.info(`The workflow is ${context.workflow}, run id is ${context.runId}`)

    // get issue or pull request number
    const pullNumber = context.payload.pull_request?.number
    if (!pullNumber) {
      onIssueComment()
      return
    }

    core.info(`The pull request number is ${pullNumber}`)
    core.info(
      `The url of pull request is ${context.payload.pull_request?.html_url}`
    )
    await checkPullRequest(pullNumber)
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()

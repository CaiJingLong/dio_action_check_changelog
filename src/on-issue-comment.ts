import {context} from '@actions/github'
import {client} from './util'
import * as core from '@actions/core'
import {rerunJobsBySameWorkflow, rerunPrJobs} from './rerun-jobs'

export async function onIssueComment(): Promise<void> {
  const event = context.eventName
  if (event !== 'issue_comment') {
    core.info('Not issue comment, skip')
    return
  }

  const {owner, repo} = context.repo

  const issueNumber = context.payload.issue?.number
  if (!issueNumber) {
    core.info('Not found issue number, skip')
    return
  }

  const github = client()
  const issue = await github.issues.get({
    owner,
    repo,
    issue_number: issueNumber
  })

  if (!issue.data.pull_request) {
    core.info('Not pull request, skip')
    return
  }

  const pullRequest = await github.pulls.get({
    owner,
    repo,
    pull_number: issueNumber
  })

  if (pullRequest.data.state !== 'open') {
    core.info('PR is not open, skip')
    return
  }

  await rerunPrJobs(owner, repo, issueNumber)
  // await rerunJobsBySameWorkflow(owner, repo, issueNumber, context.workflow)
}

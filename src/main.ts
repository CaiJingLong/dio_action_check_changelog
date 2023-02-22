import * as core from '@actions/core'
import {context} from '@actions/github'
import {checkPrContentIgnoreChangelog, client, rerunPrJobs} from './util'

async function haveIgnoreChangeLogContent(prNumber: number): Promise<boolean> {
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
    if (
      comment.body &&
      comment.user?.login &&
      haveWritePermission(comment.user?.login) &&
      checkPrContentIgnoreChangelog(comment.body)
    ) {
      core.info('PR content have ignore command, skip check')
      core.info(`The url of ignore comment: ${comment.html_url}`)
      return true
    }
  }

  return false
}

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
      checkIssueComment()
      return
    }

    core.info(`The pull request number is ${pullNumber}`)
    core.info(
      `The url of pull request is ${context.payload.pull_request?.html_url}`
    )

    const kit = client()
    const commitFiles = await kit.pulls.listFiles({
      owner,
      pull_number: pullNumber,
      repo,
      per_page: 3000
    })

    if (commitFiles.data.length >= 3000) {
      core.info('Too many files, skip')
      return
    }

    const changeLogFile = commitFiles.data.some(
      item =>
        item.filename.includes('CHANGELOG.md') &&
        (item.status === 'modified' || item.status === 'changed')
    )

    if (!changeLogFile) {
      // check pull comment content
      if (await haveIgnoreChangeLogContent(pullNumber)) {
        return
      }
      throw new Error('Please add CHANGELOG.md')
    }

    core.info('The pull request have CHANGELOG.md. Check success.')
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

async function checkIssueComment(): Promise<void> {
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
}

run()

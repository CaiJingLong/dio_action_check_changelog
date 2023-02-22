import * as core from '@actions/core'
import {context} from '@actions/github'
import {checkPrContentIgnoreChangelog, client} from './util'

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

    // get issue or pull request number
    const pullNumber = context.payload.pull_request?.number
    if (!pullNumber) {
      core.info('Not found pull request number, maybe not a pull request, skip')
      return
    }

    const event = context.eventName

    core.info(`The trigger event is ${event}`)

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

run()

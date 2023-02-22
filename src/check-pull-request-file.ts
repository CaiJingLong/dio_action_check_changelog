import {context} from '@actions/github'
import {client, haveIgnoreChangeLogContent} from './util'
import * as core from '@actions/core'

export async function checkPullRequest(pullNumber: number): Promise<void> {
  const {owner, repo} = context.repo
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
}

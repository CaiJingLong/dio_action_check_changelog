import {client, haveIgnoreChangeLogContent} from './util'
import * as core from '@actions/core'

export async function checkPullRequest(
  owner: string,
  repo: string,
  pullNumber: number
): Promise<void> {
  const kit = client()
  const commitFiles = await kit.pulls.listFiles({
    owner,
    pull_number: pullNumber,
    repo,
    per_page: 3000
  })

  if (commitFiles.data.length >= 3000) {
    core.info('Too many change files, skip')
    return
  }

  core.info('Check pull request files have CHANGELOG.md')

  const changeLogFile = commitFiles.data.filter(
    item =>
      item.filename.includes('CHANGELOG.md') &&
      (item.status === 'modified' || item.status === 'changed')
  )

  if (changeLogFile.length === 0) {
    core.info('The pull request have not CHANGELOG.md.')
    // check pull comment content
    if (await haveIgnoreChangeLogContent(owner, repo, pullNumber)) {
      core.info('The action have ignore changelog comment. Check success.')
      return
    }
    throw new Error('Please add CHANGELOG.md')
  }

  core.info('The pull request have CHANGELOG.md. Check success.')
}

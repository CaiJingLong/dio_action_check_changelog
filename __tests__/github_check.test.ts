import {beforeAll, expect, test} from '@jest/globals'
import {Octokit} from '@octokit/rest'
import {env} from 'process'
import {
  checkPrContentIgnoreChangelog,
  client,
  mockClient,
  mockRegexContent
} from '../src/util'
import {checkPullRequest} from '../src/check-pull-request-file'
import {rerunJobsBySameWorkflow} from '../src/rerun-jobs'

const owner = 'CaiJingLong'
const repo = 'test_template'

beforeAll(() => {
  const token = env.GITHUB_TOKEN
  if (!token) {
    throw new Error('No token found, please set github-token with env.')
  }
  mockClient(new Octokit({auth: `token ${token}`}))
  mockRegexContent('Exempt CHANGELOG changes: (.+)')
})

test('Check ignore with comment', async () => {
  const github = client()

  // Get comment with comment id
  const comment = await github.issues.getComment({
    owner,
    repo,
    comment_id: 1441131809
  })

  const commentBody = comment.data.body

  if (!commentBody) {
    throw new Error('No comment body found')
  }

  expect(checkPrContentIgnoreChangelog(commentBody)).toBe(false)
})

test('check pull request with pull request', async () => {
  try {
    await checkPullRequest(owner, repo, 5)
  } catch (e) {
    if (e instanceof Error) {
      expect(e.message).toBe('Please add CHANGELOG.md')
    } else {
      throw e
    }
  }
})

test('Call rerunPrJobs with same runId', async () => {
  const runId = 4248602487
  const prNumber = 5
  const owner = 'CaiJingLong'
  const repo = 'test_template'

  await rerunJobsBySameWorkflow(owner, repo, prNumber, runId)
})

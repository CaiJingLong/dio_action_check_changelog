import {expect, test, beforeAll} from '@jest/globals'
import {checkPrContentIgnoreChangelog, mockClient} from '../src/util'
import {rerunJobsBySameWorkflow} from '../src/rerun-jobs'
import * as core from '@actions/core'
import {env} from 'process'
import {Octokit} from '@octokit/rest'

beforeAll(() => {
  const token = env.GITHUB_TOKEN
  if (!token) {
    throw new Error('No token found, please set github-token with env.')
  }
  mockClient(new Octokit({auth: `token ${token}`}))
})

test('Test', () => {
  expect(checkPrContentIgnoreChangelog('1')).toBe(false)
})

test('Test default change log regex', () => {
  expect(
    checkPrContentIgnoreChangelog('Exempt CHANGELOG changes: The pr is action')
  ).toBe(true)
})

test('Test custom change log regex', () => {
  const customRegex = /ignore:.+/
  expect(checkPrContentIgnoreChangelog('ignore changelog', customRegex)).toBe(
    false
  )

  expect(checkPrContentIgnoreChangelog('ignore: changelog', customRegex)).toBe(
    true
  )
})

test('Call rerunPrJobs', async () => {
  const workflow = 'Check pull request changelog file'
  const prNumber = 3
  const owner = 'CaiJingLong'
  const repo = 'test_template'

  await rerunJobsBySameWorkflow(owner, repo, prNumber, workflow)
})

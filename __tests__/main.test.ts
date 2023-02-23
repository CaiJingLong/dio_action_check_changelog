import {expect, test, beforeAll} from '@jest/globals'
import {checkPrContentIgnoreChangelog, mockClient} from '../src/util'
import {rerunJobsBySameWorkflow} from '../src/rerun-jobs'
import {env} from 'process'
import {Octokit} from '@octokit/rest'

beforeAll(() => {
  const token = env.GITHUB_TOKEN
  if (!token) {
    throw new Error('No token found, please set github-token with env.')
  }
  mockClient(new Octokit({auth: `token ${token}`}))
})

test('Test default change log regex', () => {
  expect(
    checkPrContentIgnoreChangelog('Exempt CHANGELOG changes: The pr is action')
  ).toBe(true)

  expect(checkPrContentIgnoreChangelog('Re check')).toBe(false)
})

test('Test custom change log regex', () => {
  const customRegex = /ignore:.+/
  expect(checkPrContentIgnoreChangelog('ignore changelog', customRegex)).toBe(
    false
  )

  expect(checkPrContentIgnoreChangelog('ignore: changelog', customRegex)).toBe(
    true
  )

  expect(
    checkPrContentIgnoreChangelog(
      "Exempt CHANGELOG changes: Don't need changelog",
      /Exempt CHANGELOG changes: (.+)/
    )
  )
})

import {expect, test} from '@jest/globals'
import {checkPrContentIgnoreChangelog} from '../src/util'

test('Test', () => {
  expect(
    checkPrContentIgnoreChangelog('Exempt CHANGELOG changes: The pr is action')
  )

  expect(!checkPrContentIgnoreChangelog('1'))
})

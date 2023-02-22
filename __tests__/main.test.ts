import {expect, test} from '@jest/globals'
import {checkPrContentIgnoreChangelog} from '../src/util'

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

import {
  BaseJobContext,
} from '@openreachtech/renchan-job-bullmq'

import AppJobContext from '../../../../../app/queue/contexts/AppJobContext.js'

describe('AppJobContext', () => {
  describe('super class', () => {
    test('to be defined from BaseJobContext', () => {
      const actual = AppJobContext.prototype

      expect(actual)
        .toBeInstanceOf(BaseJobContext)
    })
  })
})

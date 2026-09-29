import {
  BaseJobShare,
} from '@openreachtech/renchan-job-bullmq'

import AppJobShare from '../../../../../app/queue/contexts/AppJobShare.js'

describe('AppJobShare', () => {
  describe('super class', () => {
    test('to be defined from BaseJobShare', () => {
      const actual = AppJobShare.prototype

      expect(actual)
        .toBeInstanceOf(BaseJobShare)
    })
  })
})

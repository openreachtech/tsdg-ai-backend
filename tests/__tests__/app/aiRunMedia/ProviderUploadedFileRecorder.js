import ProviderUploadedFileRecorder from '../../../../app/aiRunMedia/ProviderUploadedFileRecorder.js'

import AiRunInstantInspector from '../../../../app/aiRun/AiRunInstantInspector.js'
import AiRunKeyInspector from '../../../../app/aiRun/AiRunKeyInspector.js'

import AiProvider from '../../../../sequelize/models/AiProvider.js'
import AiRunMedia from '../../../../sequelize/models/AiRunMedia.js'
import ProviderUploadedFile from '../../../../sequelize/models/ProviderUploadedFile.js'

/*
 * The members of the egress recorder that read, check and build, but write nothing.
 *
 * The write itself is in `tests/_orders/AiRunMedia/`, because placement follows what the method
 * does. The two reads here touch the development seeder's own rows - media `10410001` and
 * `10410007`, and the one seeded provider - and nothing in this file creates or changes a row.
 */

describe('ProviderUploadedFileRecorder', () => {
  describe('constructor', () => {
    describe('should keep property', () => {
      describe('#aiRunInstantInspector', () => {
        const cases = [
          {
            params: {
              aiRunInstantInspector: AiRunInstantInspector.create(),
              aiRunKeyInspector: AiRunKeyInspector.create(),
            },
            label: 'the instant inspector of this feature',
          },
        ]

        test.each(cases)('label: $label', ({
          params,
        }) => {
          const recorder = new ProviderUploadedFileRecorder(params)

          expect(recorder)
            .toHaveProperty('aiRunInstantInspector', params.aiRunInstantInspector)
        })
      })

      describe('#aiRunKeyInspector', () => {
        const cases = [
          {
            params: {
              aiRunInstantInspector: AiRunInstantInspector.create(),
              aiRunKeyInspector: AiRunKeyInspector.create(),
            },
            label: 'the key inspector of this feature',
          },
        ]

        test.each(cases)('label: $label', ({
          params,
        }) => {
          const recorder = new ProviderUploadedFileRecorder(params)

          expect(recorder)
            .toHaveProperty('aiRunKeyInspector', params.aiRunKeyInspector)
        })
      })
    })
  })
})

describe('ProviderUploadedFileRecorder', () => {
  describe('.create()', () => {
    describe('should be an instance of own class', () => {
      const cases = [
        {
          params: {
            aiRunInstantInspector: AiRunInstantInspector.create(),
            aiRunKeyInspector: AiRunKeyInspector.create(),
          },
          label: 'both inspectors stated',
        },
      ]

      test.each(cases)('label: $label', ({
        params,
      }) => {
        const actual = ProviderUploadedFileRecorder.create(params)

        expect(actual)
          .toBeInstanceOf(ProviderUploadedFileRecorder)
      })
    })

    describe('should call constructor', () => {
      const cases = [
        {
          params: {
            aiRunInstantInspector: AiRunInstantInspector.create(),
            aiRunKeyInspector: AiRunKeyInspector.create(),
          },
          label: 'both inspectors stated',
        },
      ]

      test.each(cases)('label: $label', ({
        params,
      }) => {
        const SpyClass = constructorSpy.spyOn(ProviderUploadedFileRecorder)

        SpyClass.create(params)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(params)
      })
    })

    describe('should use default aiRunInstantInspector value', () => {
      test('with no arguments', () => {
        const createAiRunInstantInspectorSpy = jest.spyOn(ProviderUploadedFileRecorder, 'createAiRunInstantInspector')

        const recorder = ProviderUploadedFileRecorder.create()

        expect(recorder.aiRunInstantInspector)
          .toBeInstanceOf(AiRunInstantInspector)
        expect(createAiRunInstantInspectorSpy)
          .toHaveBeenCalledWith()
      })
    })

    describe('should use default aiRunKeyInspector value', () => {
      test('with no arguments', () => {
        const createAiRunKeyInspectorSpy = jest.spyOn(ProviderUploadedFileRecorder, 'createAiRunKeyInspector')

        const recorder = ProviderUploadedFileRecorder.create()

        expect(recorder.aiRunKeyInspector)
          .toBeInstanceOf(AiRunKeyInspector)
        expect(createAiRunKeyInspectorSpy)
          .toHaveBeenCalledWith()
      })
    })
  })
})

describe('ProviderUploadedFileRecorder', () => {
  describe('.get:ProviderUploadedFileCtor', () => {
    test('should be the egress record model', () => {
      const expected = ProviderUploadedFile

      const actual = ProviderUploadedFileRecorder.ProviderUploadedFileCtor

      expect(actual)
        .toBe(expected) // same reference
    })
  })
})

describe('ProviderUploadedFileRecorder', () => {
  describe('.get:AiRunMediaCtor', () => {
    test('should be the medium model', () => {
      const expected = AiRunMedia

      const actual = ProviderUploadedFileRecorder.AiRunMediaCtor

      expect(actual)
        .toBe(expected) // same reference
    })
  })
})

describe('ProviderUploadedFileRecorder', () => {
  describe('.get:AiProviderCtor', () => {
    test('should be the provider model', () => {
      const expected = AiProvider

      const actual = ProviderUploadedFileRecorder.AiProviderCtor

      expect(actual)
        .toBe(expected) // same reference
    })
  })
})

describe('ProviderUploadedFileRecorder', () => {
  describe('#extractUnreadableKeyFieldName()', () => {
    describe('should name the field carrying something that is not an id', () => {
      const cases = [
        {
          params: {
            aiRunMediaId: 'media-key-front-elevation',
            aiProviderId: 10100001,
          },
          expected: 'AiRunMediaId',
        },
        {
          params: {
            aiRunMediaId: 10410001,
            aiProviderId: null,
          },
          expected: 'AiProviderId',
        },
        {
          params: {
            aiRunMediaId: 0,
            aiProviderId: 10100001,
          },
          expected: 'AiRunMediaId',
        },
        {
          params: {
            aiRunMediaId: 10410001,
            aiProviderId: -1,
          },
          expected: 'AiProviderId',
        },
      ]

      test.each(cases)('aiRunMediaId: $params.aiRunMediaId, aiProviderId: $params.aiProviderId', ({
        params,
        expected,
      }) => {
        const recorder = ProviderUploadedFileRecorder.create()

        const actual = recorder.extractUnreadableKeyFieldName(params)

        expect(actual)
          .toBe(expected)
      })
    })

    describe('should answer null when both are ids', () => {
      const cases = [
        {
          params: {
            aiRunMediaId: 10410001,
            aiProviderId: 10100001,
          },
          label: 'both handed over as numbers',
        },
        {
          params: {
            aiRunMediaId: '10410007',
            aiProviderId: '10100001',
          },
          label: 'both handed over as text, which is how MariaDB hands a BIGINT over',
        },
      ]

      test.each(cases)('label: $label', ({
        params,
      }) => {
        const recorder = ProviderUploadedFileRecorder.create()

        const actual = recorder.extractUnreadableKeyFieldName(params)

        expect(actual)
          .toBeNull()
      })
    })
  })
})

describe('ProviderUploadedFileRecorder', () => {
  describe('#isRecordableProviderFileName()', () => {
    describe('should accept a handle the record can carry', () => {
      const cases = [
        {
          params: {
            providerFileName: 'stub-file-b7c1d0e2',
          },
          label: 'the shape the seeded rows carry',
        },
        {
          params: {
            providerFileName: 'files/01J8ZK3QW9/photo-front.jpg',
          },
          label: 'a handle carrying separators, which is the vendor choice to make',
        },
        {
          params: {
            providerFileName: ' leading space is a vendor problem ',
          },
          label: 'a handle padded with spaces, which is not blank',
        },
      ]

      test.each(cases)('label: $label', ({
        params,
      }) => {
        const recorder = ProviderUploadedFileRecorder.create()

        const actual = recorder.isRecordableProviderFileName(params)

        expect(actual)
          .toBeTruthy()
      })
    })

    describe('should refuse a handle the record cannot carry', () => {
      const cases = [
        {
          params: {
            providerFileName: '',
          },
          label: 'nothing at all',
        },
        {
          params: {
            providerFileName: '   ',
          },
          label: 'spaces alone, which name no file',
        },
        {
          params: {
            providerFileName: null,
          },
          label: 'no handle at all',
        },
        {
          params: {
            providerFileName: 10410001,
          },
          label: 'a number where the handle belongs',
        },
        {
          params: {
            providerFileName: 'stub-file\nstub-file-again',
          },
          label: 'two lines, which an operator reading the record would see as two records',
        },
        {
          params: {
            providerFileName: 'stub-file\u0000truncated',
          },
          label: 'a control character inside the handle',
        },
      ]

      test.each(cases)('label: $label', ({
        params,
      }) => {
        const recorder = ProviderUploadedFileRecorder.create()

        const actual = recorder.isRecordableProviderFileName(params)

        expect(actual)
          .toBeFalsy()
      })
    })
  })
})

describe('ProviderUploadedFileRecorder', () => {
  describe('#isRecordableExpiresAt()', () => {
    describe('should accept an expiry the record can carry', () => {
      const cases = [
        {
          params: {
            expiresAt: new Date('2027-03-14T01:01:05.022Z'),
          },
          label: 'an expiry still ahead',
        },
        {
          params: {
            expiresAt: new Date('2026-09-14T01:01:05.011Z'),
          },
          label: 'an expiry already past, which the purge job reaches for',
        },
        {
          params: {
            expiresAt: null,
          },
          label: 'null, which is what a provider stating no expiry leaves',
        },
      ]

      test.each(cases)('label: $label', ({
        params,
      }) => {
        const recorder = ProviderUploadedFileRecorder.create()

        const actual = recorder.isRecordableExpiresAt(params)

        expect(actual)
          .toBeTruthy()
      })
    })

    describe('should refuse an expiry that is not an instant', () => {
      const cases = [
        {
          params: {
            expiresAt: '2027-03-14T01:01:05.022Z',
          },
          label: 'an instant written as text',
        },
        {
          params: {
            expiresAt: new Date('whenever'),
          },
          label: 'a Date built from a word that is not a time',
        },
        {
          params: {
            expiresAt: 0,
          },
          label: 'the epoch as a number',
        },
      ]

      test.each(cases)('label: $label', ({
        params,
      }) => {
        const recorder = ProviderUploadedFileRecorder.create()

        const actual = recorder.isRecordableExpiresAt(params)

        expect(actual)
          .toBeFalsy()
      })
    })
  })
})

describe('ProviderUploadedFileRecorder', () => {
  describe('#expiresAfterUpload()', () => {
    describe('should accept a pair that reads as a span', () => {
      const cases = [
        {
          params: {
            uploadedAt: new Date('2026-09-12T01:01:05.011Z'),
            expiresAt: new Date('2026-09-14T01:01:05.011Z'),
          },
          label: 'two days of validity',
        },
        {
          params: {
            uploadedAt: new Date('2026-09-12T01:01:05.022Z'),
            expiresAt: null,
          },
          label: 'a provider stating no expiry',
        },
      ]

      test.each(cases)('label: $label', ({
        params,
      }) => {
        const recorder = ProviderUploadedFileRecorder.create()

        const actual = recorder.expiresAfterUpload(params)

        expect(actual)
          .toBeTruthy()
      })
    })

    describe('should refuse a pair that reads as no span at all', () => {
      const cases = [
        {
          params: {
            uploadedAt: new Date('2026-09-12T01:01:05.011Z'),
            expiresAt: new Date('2026-09-11T01:01:05.011Z'),
          },
          label: 'an expiry falling before the upload',
        },
        {
          params: {
            uploadedAt: new Date('2026-09-12T01:01:05.011Z'),
            expiresAt: new Date('2026-09-12T01:01:05.011Z'),
          },
          label: 'an expiry at the very instant of the upload, which is no validity at all',
        },
      ]

      test.each(cases)('label: $label', ({
        params,
      }) => {
        const recorder = ProviderUploadedFileRecorder.create()

        const actual = recorder.expiresAfterUpload(params)

        expect(actual)
          .toBeFalsy()
      })
    })
  })
})

describe('ProviderUploadedFileRecorder', () => {
  describe('#extractRefusedInstantMessage()', () => {
    describe('should name what is wrong with the instants of the call', () => {
      const cases = [
        {
          params: {
            uploadedAt: '2026-09-12T01:01:05.011Z',
            expiresAt: null,
          },
          expected: 'refused an upload instant that is not an instant',
        },
        {
          params: {
            uploadedAt: new Date('2026-09-12T01:01:05.011Z'),
            expiresAt: 'whenever',
          },
          expected: 'refused an expiry that is not an instant',
        },
        {
          params: {
            uploadedAt: new Date('2026-09-12T01:01:05.011Z'),
            expiresAt: new Date('2026-09-11T01:01:05.011Z'),
          },
          expected: 'refused an expiry falling before the upload it belongs to',
        },
      ]

      test.each(cases)('uploadedAt: $params.uploadedAt', ({
        params,
        expected,
      }) => {
        const recorder = ProviderUploadedFileRecorder.create()

        const actual = recorder.extractRefusedInstantMessage(params)

        expect(actual)
          .toBe(expected)
      })
    })

    describe('should answer null when both instants are recordable', () => {
      const cases = [
        {
          params: {
            uploadedAt: new Date('2026-09-12T01:01:05.011Z'),
            expiresAt: new Date('2026-09-14T01:01:05.011Z'),
          },
          label: 'an upload with an expiry',
        },
        {
          params: {
            uploadedAt: new Date('2026-09-12T02:02:05.033Z'),
            expiresAt: null,
          },
          label: 'an upload the provider stated no expiry for',
        },
      ]

      test.each(cases)('label: $label', ({
        params,
      }) => {
        const recorder = ProviderUploadedFileRecorder.create()

        const actual = recorder.extractRefusedInstantMessage(params)

        expect(actual)
          .toBeNull()
      })
    })
  })
})

describe('ProviderUploadedFileRecorder', () => {
  describe('#buildRecordableValues()', () => {
    describe('should build the values one egress record is written with', () => {
      const cases = [
        {
          params: {
            aiRunMediaId: 10410001,
            aiProviderId: 10100001,
            providerFileName: 'stub-file-a1b2c3d4',
            uploadedAt: new Date('2026-09-12T01:01:05.011Z'),
            expiresAt: new Date('2026-09-14T01:01:05.011Z'),
          },
          expected: {
            AiRunMediaId: 10410001,
            AiProviderId: 10100001,
            providerFileName: 'stub-file-a1b2c3d4',
            uploadedAt: new Date('2026-09-12T01:01:05.011Z'),
            expiresAt: new Date('2026-09-14T01:01:05.011Z'),
          },
        },
        {
          params: {
            aiRunMediaId: 10410007,
            aiProviderId: 10100001,
            providerFileName: 'stub-file-e5f6a7b8',
            uploadedAt: new Date('2026-09-12T02:02:05.022Z'),
            expiresAt: null,
          },
          expected: {
            AiRunMediaId: 10410007,
            AiProviderId: 10100001,
            providerFileName: 'stub-file-e5f6a7b8',
            uploadedAt: new Date('2026-09-12T02:02:05.022Z'),
            expiresAt: null,
          },
        },
      ]

      test.each(cases)('providerFileName: $params.providerFileName', ({
        params,
        expected,
      }) => {
        const recorder = ProviderUploadedFileRecorder.create()

        const actual = recorder.buildRecordableValues(params)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('ProviderUploadedFileRecorder', () => {
  describe('#findAiRunMedia()', () => {
    describe('should find the medium a record is about', () => {
      const cases = [
        {
          params: {
            aiRunMediaId: 10410001,
          },
          expected: expect.objectContaining({
            id: 10410001,
            AiRunId: 10010004,
            mediaKey: 'media-key-front-elevation',
          }),
        },
        {
          params: {
            aiRunMediaId: 10410007,
          },
          expected: expect.objectContaining({
            id: 10410007,
            AiRunId: 10010003,
            mediaKey: 'media-key-corrupt-thumbnail',
          }),
        },
      ]

      test.each(cases)('aiRunMediaId: $params.aiRunMediaId', async ({
        params,
        expected,
      }) => {
        const recorder = ProviderUploadedFileRecorder.create()

        const actual = await recorder.findAiRunMedia(params)

        expect(actual)
          .toEqual(expected)
      })
    })

    describe('should answer null when no medium carries the id', () => {
      const cases = [
        {
          params: {
            aiRunMediaId: 10419001,
          },
          label: 'an id reserved inside this feature block for a medium nothing creates',
        },
      ]

      test.each(cases)('label: $label', async ({
        params,
      }) => {
        const recorder = ProviderUploadedFileRecorder.create()

        const actual = await recorder.findAiRunMedia(params)

        expect(actual)
          .toBeNull()
      })
    })
  })
})

describe('ProviderUploadedFileRecorder', () => {
  describe('#findAiProvider()', () => {
    describe('should find the provider a record names', () => {
      const cases = [
        {
          params: {
            aiProviderId: 10100001,
          },
          expected: expect.objectContaining({
            id: 10100001,
            name: 'stub',
          }),
        },
      ]

      test.each(cases)('aiProviderId: $params.aiProviderId', async ({
        params,
        expected,
      }) => {
        const recorder = ProviderUploadedFileRecorder.create()

        const actual = await recorder.findAiProvider(params)

        expect(actual)
          .toEqual(expected)
      })
    })

    describe('should answer null when no provider carries the id', () => {
      const cases = [
        {
          params: {
            aiProviderId: 10109001,
          },
          label: 'an id no vendor is seeded under',
        },
      ]

      test.each(cases)('label: $label', async ({
        params,
      }) => {
        const recorder = ProviderUploadedFileRecorder.create()

        const actual = await recorder.findAiProvider(params)

        expect(actual)
          .toBeNull()
      })
    })
  })
})

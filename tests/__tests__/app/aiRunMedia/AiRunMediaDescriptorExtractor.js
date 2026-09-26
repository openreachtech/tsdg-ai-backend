import AiRunMediaDescriptorExtractor from '../../../../app/aiRunMedia/AiRunMediaDescriptorExtractor.js'

/*
 * The URL is not a column, and this is the class that says where it is instead.
 *
 * `ai_run_media` carries no `url`: the contract carries it in the request's `media[]`, so it is read
 * out of `ai_runs.request_body` at fetch time and never re-stored. The body is `TEXT('medium')` and
 * nullable, and the retention sweep empties it thirty days after the run - so "a run whose content
 * has been purged" is an ordinary case here rather than an edge, and it answers null.
 *
 * The bodies below are written in the shape the contract fixes: `media[]` carrying `mediaKey`,
 * `mediaCategoryName`, `url`, `mimeType` and `byteSize`. The media keys are the ones the
 * development seeder gives the rows of the same runs, so a body here and a row there pair up the
 * way they do in the application.
 */

describe('AiRunMediaDescriptorExtractor', () => {
  describe('constructor', () => {
    describe('should keep property', () => {
      describe('#mediaFieldName', () => {
        const cases = [
          {
            params: {
              mediaFieldName: 'media',
            },
            expected: 'media',
          },
          {
            params: {
              mediaFieldName: 'attachments',
            },
            expected: 'attachments',
          },
        ]

        test.each(cases)('mediaFieldName: $params.mediaFieldName', ({
          params,
          expected,
        }) => {
          const extractor = new AiRunMediaDescriptorExtractor(params)

          expect(extractor)
            .toHaveProperty('mediaFieldName', expected)
        })
      })
    })
  })
})

describe('AiRunMediaDescriptorExtractor', () => {
  describe('.create()', () => {
    describe('should be an instance of own class', () => {
      const cases = [
        {
          params: {
            mediaFieldName: 'media',
          },
        },
        {
          params: {
            mediaFieldName: 'attachments',
          },
        },
      ]

      test.each(cases)('mediaFieldName: $params.mediaFieldName', ({
        params,
      }) => {
        const actual = AiRunMediaDescriptorExtractor.create(params)

        expect(actual)
          .toBeInstanceOf(AiRunMediaDescriptorExtractor)
      })
    })

    describe('should call constructor', () => {
      const cases = [
        {
          params: {
            mediaFieldName: 'media',
          },
          expected: {
            mediaFieldName: 'media',
          },
        },
        {
          params: {
            mediaFieldName: 'attachments',
          },
          expected: {
            mediaFieldName: 'attachments',
          },
        },
      ]

      test.each(cases)('mediaFieldName: $params.mediaFieldName', ({
        params,
        expected,
      }) => {
        const SpyClass = constructorSpy.spyOn(AiRunMediaDescriptorExtractor)

        SpyClass.create(params)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(expected)
      })
    })

    describe('should use the field the contract fixes by default', () => {
      test('with no arguments', () => {
        const SpyClass = constructorSpy.spyOn(AiRunMediaDescriptorExtractor)
        const expected = {
          mediaFieldName: 'media',
        }

        SpyClass.create()

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})

describe('AiRunMediaDescriptorExtractor', () => {
  describe('#extractMediaUrl()', () => {
    describe('should extract the URL one medium is fetched from', () => {
      const cases = [
        {
          factoryParams: {
            mediaFieldName: 'media',
          },
          params: {
            requestBody: '{"externalRef":"external-ref-10010004","media":[{"mediaKey":"media-key-front-elevation","mediaCategoryName":"image","url":"https://files.client.example/photos/front-elevation.jpg","mimeType":"image/jpeg","byteSize":204811},{"mediaKey":"media-key-living-room","mediaCategoryName":"image","url":"https://files.client.example/photos/living-room.png","mimeType":"image/png","byteSize":512322}]}',
            mediaKey: 'media-key-front-elevation',
          },
          expected: 'https://files.client.example/photos/front-elevation.jpg',
        },
        {
          factoryParams: {
            mediaFieldName: 'media',
          },
          params: {
            requestBody: '{"externalRef":"external-ref-10010004","media":[{"mediaKey":"media-key-front-elevation","mediaCategoryName":"image","url":"https://files.client.example/photos/front-elevation.jpg","mimeType":"image/jpeg","byteSize":204811},{"mediaKey":"media-key-living-room","mediaCategoryName":"image","url":"https://files.client.example/photos/living-room.png","mimeType":"image/png","byteSize":512322}]}',
            mediaKey: 'media-key-living-room',
          },
          expected: 'https://files.client.example/photos/living-room.png',
        },
        {
          factoryParams: {
            mediaFieldName: 'media',
          },
          params: {
            requestBody: {
              media: [
                {
                  mediaKey: 'media-key-rooftop-terrace',
                  mediaCategoryName: 'image',
                  url: 'https://storage.beta.example/photos/rooftop-terrace.webp',
                  mimeType: 'image/webp',
                  byteSize: 154877,
                },
              ],
            },
            mediaKey: 'media-key-rooftop-terrace',
          },
          expected: 'https://storage.beta.example/photos/rooftop-terrace.webp',
        },
      ]

      test.each(cases)('mediaKey: $params.mediaKey', ({
        factoryParams,
        params,
        expected,
      }) => {
        const extractor = AiRunMediaDescriptorExtractor.create(factoryParams)

        const actual = extractor.extractMediaUrl(params)

        expect(actual)
          .toBe(expected)
      })
    })

    describe('should answer null when the body declares no URL for that key', () => {
      const cases = [
        {
          factoryParams: {
            mediaFieldName: 'media',
          },
          params: {
            requestBody: null,
            mediaKey: 'media-key-front-elevation',
          },
          label: 'a body the retention sweep has emptied',
        },
        {
          factoryParams: {
            mediaFieldName: 'media',
          },
          params: {
            requestBody: '{"externalRef":"external-ref-10010004"}',
            mediaKey: 'media-key-front-elevation',
          },
          label: 'a body carrying no media at all',
        },
        {
          factoryParams: {
            mediaFieldName: 'media',
          },
          params: {
            requestBody: '{"media":[{"mediaKey":"media-key-living-room","url":"https://files.client.example/photos/living-room.png"}]}',
            mediaKey: 'media-key-front-elevation',
          },
          label: 'a key no entry carries',
        },
        {
          factoryParams: {
            mediaFieldName: 'media',
          },
          params: {
            requestBody: '{"media":[{"mediaKey":"media-key-front-elevation","mimeType":"image/jpeg"}]}',
            mediaKey: 'media-key-front-elevation',
          },
          label: 'an entry carrying no URL',
        },
        {
          factoryParams: {
            mediaFieldName: 'media',
          },
          params: {
            requestBody: '{"media":[{"mediaKey":"media-key-front-elevation","url":12345}]}',
            mediaKey: 'media-key-front-elevation',
          },
          label: 'an entry whose URL is not text',
        },
        {
          factoryParams: {
            mediaFieldName: 'media',
          },
          params: {
            requestBody: 'not json at all',
            mediaKey: 'media-key-front-elevation',
          },
          label: 'a body that is not readable as a body',
        },
        {
          factoryParams: {
            mediaFieldName: 'media',
          },
          params: {
            requestBody: '{"media":[{"mediaKey":"media-key-front-elevation","url":"https://files.client.example/photo.jpg"}]}',
            mediaKey: null,
          },
          label: 'no key at all',
        },
      ]

      test.each(cases)('label: $label', ({
        factoryParams,
        params,
      }) => {
        const extractor = AiRunMediaDescriptorExtractor.create(factoryParams)

        const actual = extractor.extractMediaUrl(params)

        expect(actual)
          .toBeNull()
      })
    })
  })
})

describe('AiRunMediaDescriptorExtractor', () => {
  describe('#extractMediaDescriptors()', () => {
    /*
     * What the twelve-file limit is counted against. A value in the array that is not an object
     * declares no medium, so it is dropped rather than counted - a request carrying twelve files
     * and a stray value is a request carrying twelve files.
     */
    describe('should extract the entries a request declares', () => {
      const cases = [
        {
          factoryParams: {
            mediaFieldName: 'media',
          },
          params: {
            requestBody: '{"media":[{"mediaKey":"media-key-front-elevation","url":"https://files.client.example/photos/front-elevation.jpg"},{"mediaKey":"media-key-living-room","url":"https://files.client.example/photos/living-room.png"}]}',
          },
          expected: [
            {
              mediaKey: 'media-key-front-elevation',
              url: 'https://files.client.example/photos/front-elevation.jpg',
            },
            {
              mediaKey: 'media-key-living-room',
              url: 'https://files.client.example/photos/living-room.png',
            },
          ],
        },
        {
          factoryParams: {
            mediaFieldName: 'media',
          },
          params: {
            requestBody: '{"media":[{"mediaKey":"media-key-walkthrough-clip","mediaCategoryName":"video"},"a value that is no entry",null,[]]}',
          },
          expected: [
            {
              mediaKey: 'media-key-walkthrough-clip',
              mediaCategoryName: 'video',
            },
          ],
        },
      ]

      test.each(cases)('requestBody: $params.requestBody', ({
        factoryParams,
        params,
        expected,
      }) => {
        const extractor = AiRunMediaDescriptorExtractor.create(factoryParams)

        const actual = extractor.extractMediaDescriptors(params)

        expect(actual)
          .toEqual(expected)
      })
    })

    describe('should answer nothing when the body declares no media', () => {
      const cases = [
        {
          factoryParams: {
            mediaFieldName: 'media',
          },
          params: {
            requestBody: null,
          },
          label: 'a body the retention sweep has emptied',
        },
        {
          factoryParams: {
            mediaFieldName: 'media',
          },
          params: {
            requestBody: '{"externalRef":"external-ref-10010002"}',
          },
          label: 'a body carrying no media field',
        },
        {
          factoryParams: {
            mediaFieldName: 'media',
          },
          params: {
            requestBody: '{"media":{"mediaKey":"media-key-front-elevation"}}',
          },
          label: 'a media field that is not an array',
        },
        {
          factoryParams: {
            mediaFieldName: 'media',
          },
          params: {
            requestBody: '[]',
          },
          label: 'a body that is an array rather than an object',
        },
        {
          factoryParams: {
            mediaFieldName: 'media',
          },
          params: {
            requestBody: 'not json at all',
          },
          label: 'a body that is not readable as a body',
        },
      ]

      test.each(cases)('label: $label', ({
        factoryParams,
        params,
      }) => {
        const extractor = AiRunMediaDescriptorExtractor.create(factoryParams)

        const actual = extractor.extractMediaDescriptors(params)

        expect(actual)
          .toHaveLength(0)
      })
    })
  })
})

describe('AiRunMediaDescriptorExtractor', () => {
  describe('#extractMediaDescriptor()', () => {
    describe('should extract the entry a media key names', () => {
      const cases = [
        {
          factoryParams: {
            mediaFieldName: 'media',
          },
          params: {
            requestBody: '{"media":[{"mediaKey":"media-key-entrance-hall","mediaCategoryName":"image","url":"https://files.client.example/photos/entrance-hall.jpg","mimeType":"image/jpeg","byteSize":333455}]}',
            mediaKey: 'media-key-entrance-hall',
          },
          expected: {
            mediaKey: 'media-key-entrance-hall',
            mediaCategoryName: 'image',
            url: 'https://files.client.example/photos/entrance-hall.jpg',
            mimeType: 'image/jpeg',
            byteSize: 333455,
          },
        },
        {
          factoryParams: {
            mediaFieldName: 'media',
          },
          params: {
            requestBody: '{"media":[{"mediaKey":"media-key-agent-voice-note","mediaCategoryName":"audio","url":"https://files.client.example/notes/agent.mp3","mimeType":"audio/mpeg","byteSize":2621444}]}',
            mediaKey: 'media-key-agent-voice-note',
          },
          expected: {
            mediaKey: 'media-key-agent-voice-note',
            mediaCategoryName: 'audio',
            url: 'https://files.client.example/notes/agent.mp3',
            mimeType: 'audio/mpeg',
            byteSize: 2621444,
          },
        },
      ]

      test.each(cases)('mediaKey: $params.mediaKey', ({
        factoryParams,
        params,
        expected,
      }) => {
        const extractor = AiRunMediaDescriptorExtractor.create(factoryParams)

        const actual = extractor.extractMediaDescriptor(params)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunMediaDescriptorExtractor', () => {
  describe('#isReadableObject()', () => {
    describe('should accept something fields can be read off', () => {
      const cases = [
        {
          factoryParams: {
            mediaFieldName: 'media',
          },
          params: {
            value: {
              mediaKey: 'media-key-storage-room',
            },
          },
          label: 'an entry declaring a medium',
        },
        {
          factoryParams: {
            mediaFieldName: 'media',
          },
          params: {
            value: {},
          },
          label: 'an object carrying no field, which declares a medium badly rather than not at all',
        },
      ]

      test.each(cases)('label: $label', ({
        factoryParams,
        params,
      }) => {
        const extractor = AiRunMediaDescriptorExtractor.create(factoryParams)

        const actual = extractor.isReadableObject(params)

        expect(actual)
          .toBeTruthy()
      })
    })

    describe('should refuse something no field can be read off', () => {
      const cases = [
        {
          factoryParams: {
            mediaFieldName: 'media',
          },
          params: {
            value: null,
          },
          label: 'null',
        },
        {
          factoryParams: {
            mediaFieldName: 'media',
          },
          params: {
            value: [],
          },
          label: 'an array',
        },
        {
          factoryParams: {
            mediaFieldName: 'media',
          },
          params: {
            value: 'media-key-storage-room',
          },
          label: 'text',
        },
        {
          factoryParams: {
            mediaFieldName: 'media',
          },
          params: {
            value: 0,
          },
          label: 'a number',
        },
      ]

      test.each(cases)('label: $label', ({
        factoryParams,
        params,
      }) => {
        const extractor = AiRunMediaDescriptorExtractor.create(factoryParams)

        const actual = extractor.isReadableObject(params)

        expect(actual)
          .toBeFalsy()
      })
    })
  })
})

describe('AiRunMediaDescriptorExtractor', () => {
  describe('#buildParsedRequestBodyText()', () => {
    describe('should build the body the stored text holds', () => {
      const cases = [
        {
          factoryParams: {
            mediaFieldName: 'media',
          },
          params: {
            requestBodyText: '{"externalRef":"external-ref-10010004","subjectLabel":"Subject label of run 10010004"}',
          },
          expected: {
            externalRef: 'external-ref-10010004',
            subjectLabel: 'Subject label of run 10010004',
          },
        },
        {
          factoryParams: {
            mediaFieldName: 'media',
          },
          params: {
            requestBodyText: '{"correlationId":"correlation-id-10010003"}',
          },
          expected: {
            correlationId: 'correlation-id-10010003',
          },
        },
      ]

      test.each(cases)('requestBodyText: $params.requestBodyText', ({
        factoryParams,
        params,
        expected,
      }) => {
        const extractor = AiRunMediaDescriptorExtractor.create(factoryParams)

        const actual = extractor.buildParsedRequestBodyText(params)

        expect(actual)
          .toEqual(expected)
      })
    })

    describe('should answer null when the text is no body', () => {
      const cases = [
        {
          factoryParams: {
            mediaFieldName: 'media',
          },
          params: {
            requestBodyText: 'not json at all',
          },
          label: 'text that is not JSON',
        },
        {
          factoryParams: {
            mediaFieldName: 'media',
          },
          params: {
            requestBodyText: '"a string that is valid JSON"',
          },
          label: 'JSON that is a string rather than a body',
        },
        {
          factoryParams: {
            mediaFieldName: 'media',
          },
          params: {
            requestBodyText: 'null',
          },
          label: 'JSON that is null',
        },
        {
          factoryParams: {
            mediaFieldName: 'media',
          },
          params: {
            requestBodyText: '',
          },
          label: 'no text at all',
        },
      ]

      test.each(cases)('label: $label', ({
        factoryParams,
        params,
      }) => {
        const extractor = AiRunMediaDescriptorExtractor.create(factoryParams)

        const actual = extractor.buildParsedRequestBodyText(params)

        expect(actual)
          .toBeNull()
      })
    })
  })
})

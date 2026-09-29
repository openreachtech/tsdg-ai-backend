import {
  MentsuLogger,
} from '@openreachtech/mentsu-logger'

import AiRunCallbackDeliveryRecorder from '../../../../app/aiRunCallback/AiRunCallbackDeliveryRecorder.js'
import AiRunCallbackSender from '../../../../app/aiRunCallback/AiRunCallbackSender.js'
import AiRunCallbackSigner from '../../../../app/aiRunCallback/AiRunCallbackSigner.js'
import AiRunCallbackUrlInspector from '../../../../app/aiRunCallback/AiRunCallbackUrlInspector.js'
import AiRunTerminalCallbackDeliverer from '../../../../app/aiRunCallback/AiRunTerminalCallbackDeliverer.js'

import AiRunResponseBuilder from '../../../../app/aiRun/AiRunResponseBuilder.js'

import ApiClientAuthenticationLogger from '../../../../app/apiClient/ApiClientAuthenticationLogger.js'
import ApiClientSecretCipher from '../../../../app/apiClient/ApiClientSecretCipher.js'

import AiRun from '../../../../sequelize/models/AiRun.js'
import ApiClient from '../../../../sequelize/models/ApiClient.js'

/*
 * The members of the terminal callback's orchestration that read or decide. The three that write a
 * delivery row — `#deliverTerminalCallback()`, `#attemptTerminalCallback()` and
 * `#saveTerminalCallbackDelivery()` — are exercised under `tests/_orders/AiRunCallback/`.
 *
 * The runs and clients read here are the development fixtures, unchanged: run 10010004 belongs to
 * the signing client 10000001 and its callback URL sits under that client's registered prefix, and
 * run 10010003 belongs to the rotating client 10000002 under its own. Both prefixes are under the
 * reserved `.invalid` domain, so a request escaping a stub reaches nothing.
 *
 * The collaborators handed to the constructor are duck-typed stand-ins carrying a label: the
 * constructor only assigns, so what isolates one property is that the others are inert.
 */

describe('AiRunTerminalCallbackDeliverer', () => {
  describe('constructor', () => {
    describe('should keep property', () => {
      describe('#apiClientSecretCipher', () => {
        const cases = [
          {
            input: {
              apiClientSecretCipher: {
                label: 'cipher-0001',
              },
              aiRunResponseBuilder: {
                label: 'response-builder-0001',
              },
              aiRunCallbackSigner: {
                label: 'signer-0001',
              },
              aiRunCallbackSender: {
                label: 'sender-0001',
              },
              aiRunCallbackDeliveryRecorder: {
                label: 'delivery-recorder-0001',
              },
              aiRunCallbackUrlInspectorFactory: {
                label: 'url-inspector-factory-0001',
              },
            },
            expected: {
              label: 'cipher-0001',
            },
          },
          {
            input: {
              apiClientSecretCipher: {
                label: 'cipher-0002',
              },
              aiRunResponseBuilder: {
                label: 'response-builder-0002',
              },
              aiRunCallbackSigner: {
                label: 'signer-0002',
              },
              aiRunCallbackSender: {
                label: 'sender-0002',
              },
              aiRunCallbackDeliveryRecorder: {
                label: 'delivery-recorder-0002',
              },
              aiRunCallbackUrlInspectorFactory: {
                label: 'url-inspector-factory-0002',
              },
            },
            expected: {
              label: 'cipher-0002',
            },
          },
        ]

        test.each(cases)('apiClientSecretCipher: $input.apiClientSecretCipher.label', ({
          input,
          expected,
        }) => {
          const deliverer = new AiRunTerminalCallbackDeliverer(input)

          expect(deliverer)
            .toHaveProperty('apiClientSecretCipher', expected)
        })
      })

      describe('#aiRunResponseBuilder', () => {
        const cases = [
          {
            input: {
              apiClientSecretCipher: {
                label: 'cipher-0001',
              },
              aiRunResponseBuilder: {
                label: 'response-builder-0001',
              },
              aiRunCallbackSigner: {
                label: 'signer-0001',
              },
              aiRunCallbackSender: {
                label: 'sender-0001',
              },
              aiRunCallbackDeliveryRecorder: {
                label: 'delivery-recorder-0001',
              },
              aiRunCallbackUrlInspectorFactory: {
                label: 'url-inspector-factory-0001',
              },
            },
            expected: {
              label: 'response-builder-0001',
            },
          },
          {
            input: {
              apiClientSecretCipher: {
                label: 'cipher-0002',
              },
              aiRunResponseBuilder: {
                label: 'response-builder-0002',
              },
              aiRunCallbackSigner: {
                label: 'signer-0002',
              },
              aiRunCallbackSender: {
                label: 'sender-0002',
              },
              aiRunCallbackDeliveryRecorder: {
                label: 'delivery-recorder-0002',
              },
              aiRunCallbackUrlInspectorFactory: {
                label: 'url-inspector-factory-0002',
              },
            },
            expected: {
              label: 'response-builder-0002',
            },
          },
        ]

        test.each(cases)('aiRunResponseBuilder: $input.aiRunResponseBuilder.label', ({
          input,
          expected,
        }) => {
          const deliverer = new AiRunTerminalCallbackDeliverer(input)

          expect(deliverer)
            .toHaveProperty('aiRunResponseBuilder', expected)
        })
      })

      describe('#aiRunCallbackSigner', () => {
        const cases = [
          {
            input: {
              apiClientSecretCipher: {
                label: 'cipher-0001',
              },
              aiRunResponseBuilder: {
                label: 'response-builder-0001',
              },
              aiRunCallbackSigner: {
                label: 'signer-0001',
              },
              aiRunCallbackSender: {
                label: 'sender-0001',
              },
              aiRunCallbackDeliveryRecorder: {
                label: 'delivery-recorder-0001',
              },
              aiRunCallbackUrlInspectorFactory: {
                label: 'url-inspector-factory-0001',
              },
            },
            expected: {
              label: 'signer-0001',
            },
          },
          {
            input: {
              apiClientSecretCipher: {
                label: 'cipher-0002',
              },
              aiRunResponseBuilder: {
                label: 'response-builder-0002',
              },
              aiRunCallbackSigner: {
                label: 'signer-0002',
              },
              aiRunCallbackSender: {
                label: 'sender-0002',
              },
              aiRunCallbackDeliveryRecorder: {
                label: 'delivery-recorder-0002',
              },
              aiRunCallbackUrlInspectorFactory: {
                label: 'url-inspector-factory-0002',
              },
            },
            expected: {
              label: 'signer-0002',
            },
          },
        ]

        test.each(cases)('aiRunCallbackSigner: $input.aiRunCallbackSigner.label', ({
          input,
          expected,
        }) => {
          const deliverer = new AiRunTerminalCallbackDeliverer(input)

          expect(deliverer)
            .toHaveProperty('aiRunCallbackSigner', expected)
        })
      })

      describe('#aiRunCallbackSender', () => {
        const cases = [
          {
            input: {
              apiClientSecretCipher: {
                label: 'cipher-0001',
              },
              aiRunResponseBuilder: {
                label: 'response-builder-0001',
              },
              aiRunCallbackSigner: {
                label: 'signer-0001',
              },
              aiRunCallbackSender: {
                label: 'sender-0001',
              },
              aiRunCallbackDeliveryRecorder: {
                label: 'delivery-recorder-0001',
              },
              aiRunCallbackUrlInspectorFactory: {
                label: 'url-inspector-factory-0001',
              },
            },
            expected: {
              label: 'sender-0001',
            },
          },
          {
            input: {
              apiClientSecretCipher: {
                label: 'cipher-0002',
              },
              aiRunResponseBuilder: {
                label: 'response-builder-0002',
              },
              aiRunCallbackSigner: {
                label: 'signer-0002',
              },
              aiRunCallbackSender: {
                label: 'sender-0002',
              },
              aiRunCallbackDeliveryRecorder: {
                label: 'delivery-recorder-0002',
              },
              aiRunCallbackUrlInspectorFactory: {
                label: 'url-inspector-factory-0002',
              },
            },
            expected: {
              label: 'sender-0002',
            },
          },
        ]

        test.each(cases)('aiRunCallbackSender: $input.aiRunCallbackSender.label', ({
          input,
          expected,
        }) => {
          const deliverer = new AiRunTerminalCallbackDeliverer(input)

          expect(deliverer)
            .toHaveProperty('aiRunCallbackSender', expected)
        })
      })

      describe('#aiRunCallbackDeliveryRecorder', () => {
        const cases = [
          {
            input: {
              apiClientSecretCipher: {
                label: 'cipher-0001',
              },
              aiRunResponseBuilder: {
                label: 'response-builder-0001',
              },
              aiRunCallbackSigner: {
                label: 'signer-0001',
              },
              aiRunCallbackSender: {
                label: 'sender-0001',
              },
              aiRunCallbackDeliveryRecorder: {
                label: 'delivery-recorder-0001',
              },
              aiRunCallbackUrlInspectorFactory: {
                label: 'url-inspector-factory-0001',
              },
            },
            expected: {
              label: 'delivery-recorder-0001',
            },
          },
          {
            input: {
              apiClientSecretCipher: {
                label: 'cipher-0002',
              },
              aiRunResponseBuilder: {
                label: 'response-builder-0002',
              },
              aiRunCallbackSigner: {
                label: 'signer-0002',
              },
              aiRunCallbackSender: {
                label: 'sender-0002',
              },
              aiRunCallbackDeliveryRecorder: {
                label: 'delivery-recorder-0002',
              },
              aiRunCallbackUrlInspectorFactory: {
                label: 'url-inspector-factory-0002',
              },
            },
            expected: {
              label: 'delivery-recorder-0002',
            },
          },
        ]

        test.each(cases)('aiRunCallbackDeliveryRecorder: $input.aiRunCallbackDeliveryRecorder.label', ({
          input,
          expected,
        }) => {
          const deliverer = new AiRunTerminalCallbackDeliverer(input)

          expect(deliverer)
            .toHaveProperty('aiRunCallbackDeliveryRecorder', expected)
        })
      })

      describe('#aiRunCallbackUrlInspectorFactory', () => {
        const cases = [
          {
            input: {
              apiClientSecretCipher: {
                label: 'cipher-0001',
              },
              aiRunResponseBuilder: {
                label: 'response-builder-0001',
              },
              aiRunCallbackSigner: {
                label: 'signer-0001',
              },
              aiRunCallbackSender: {
                label: 'sender-0001',
              },
              aiRunCallbackDeliveryRecorder: {
                label: 'delivery-recorder-0001',
              },
              aiRunCallbackUrlInspectorFactory: {
                label: 'url-inspector-factory-0001',
              },
            },
            expected: {
              label: 'url-inspector-factory-0001',
            },
          },
          {
            input: {
              apiClientSecretCipher: {
                label: 'cipher-0002',
              },
              aiRunResponseBuilder: {
                label: 'response-builder-0002',
              },
              aiRunCallbackSigner: {
                label: 'signer-0002',
              },
              aiRunCallbackSender: {
                label: 'sender-0002',
              },
              aiRunCallbackDeliveryRecorder: {
                label: 'delivery-recorder-0002',
              },
              aiRunCallbackUrlInspectorFactory: {
                label: 'url-inspector-factory-0002',
              },
            },
            expected: {
              label: 'url-inspector-factory-0002',
            },
          },
        ]

        test.each(cases)('aiRunCallbackUrlInspectorFactory: $input.aiRunCallbackUrlInspectorFactory.label', ({
          input,
          expected,
        }) => {
          const deliverer = new AiRunTerminalCallbackDeliverer(input)

          expect(deliverer)
            .toHaveProperty('aiRunCallbackUrlInspectorFactory', expected)
        })
      })
    })
  })
})

describe('AiRunTerminalCallbackDeliverer', () => {
  describe('.create()', () => {
    describe('should be instance of own class', () => {
      const cases = [
        {
          input: {
            aiRunCallbackSender: AiRunCallbackSender.create({
              requestTimeoutMilliseconds: 10000,
            }),
          },
        },
        {
          input: {
            aiRunCallbackSender: AiRunCallbackSender.create({
              requestTimeoutMilliseconds: 250,
            }),
          },
        },
      ]

      test.each(cases)('requestTimeoutMilliseconds: $input.aiRunCallbackSender.requestTimeoutMilliseconds', ({
        input,
      }) => {
        const actual = AiRunTerminalCallbackDeliverer.create(input)

        expect(actual)
          .toBeInstanceOf(AiRunTerminalCallbackDeliverer)
      })
    })
  })
})

describe('AiRunTerminalCallbackDeliverer', () => {
  describe('.create()', () => {
    describe('should call constructor', () => {
      const cases = [
        {
          input: {
            aiRunCallbackSender: AiRunCallbackSender.create({
              requestTimeoutMilliseconds: 10000,
            }),
          },
          expected: expect.objectContaining({
            apiClientSecretCipher: expect.any(ApiClientSecretCipher),
            aiRunResponseBuilder: expect.any(AiRunResponseBuilder),
            aiRunCallbackSigner: expect.any(AiRunCallbackSigner),
            aiRunCallbackSender: expect.any(AiRunCallbackSender),
            aiRunCallbackDeliveryRecorder: expect.any(AiRunCallbackDeliveryRecorder),
            aiRunCallbackUrlInspectorFactory: AiRunCallbackUrlInspector,
          }),
        },
        {
          input: {
            aiRunCallbackSender: AiRunCallbackSender.create({
              requestTimeoutMilliseconds: 250,
            }),
          },
          expected: expect.objectContaining({
            apiClientSecretCipher: expect.any(ApiClientSecretCipher),
            aiRunResponseBuilder: expect.any(AiRunResponseBuilder),
            aiRunCallbackSigner: expect.any(AiRunCallbackSigner),
            aiRunCallbackSender: expect.any(AiRunCallbackSender),
            aiRunCallbackDeliveryRecorder: expect.any(AiRunCallbackDeliveryRecorder),
            aiRunCallbackUrlInspectorFactory: AiRunCallbackUrlInspector,
          }),
        },
      ]

      test.each(cases)('requestTimeoutMilliseconds: $input.aiRunCallbackSender.requestTimeoutMilliseconds', ({
        input,
        expected,
      }) => {
        const SpyClass = constructorSpy.spyOn(AiRunTerminalCallbackDeliverer)

        SpyClass.create(input)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})

describe('AiRunTerminalCallbackDeliverer', () => {
  describe('.create()', () => {
    describe('should use default apiClientSecretCipher value', () => {
      test('with no arguments', () => {
        const createCipherSpy = jest.spyOn(AiRunTerminalCallbackDeliverer, 'createApiClientSecretCipher')

        const deliverer = AiRunTerminalCallbackDeliverer.create()

        expect(deliverer.apiClientSecretCipher)
          .toBeInstanceOf(ApiClientSecretCipher)
        expect(createCipherSpy)
          .toHaveBeenCalledWith()
      })
    })

    describe('should use default aiRunResponseBuilder value', () => {
      test('with no arguments', () => {
        const createBuilderSpy = jest.spyOn(AiRunTerminalCallbackDeliverer, 'createAiRunResponseBuilder')

        const deliverer = AiRunTerminalCallbackDeliverer.create()

        expect(deliverer.aiRunResponseBuilder)
          .toBeInstanceOf(AiRunResponseBuilder)
        expect(createBuilderSpy)
          .toHaveBeenCalledWith()
      })
    })

    describe('should use default aiRunCallbackSigner value', () => {
      test('with no arguments', () => {
        const createSignerSpy = jest.spyOn(AiRunTerminalCallbackDeliverer, 'createAiRunCallbackSigner')

        const deliverer = AiRunTerminalCallbackDeliverer.create()

        expect(deliverer.aiRunCallbackSigner)
          .toBeInstanceOf(AiRunCallbackSigner)
        expect(createSignerSpy)
          .toHaveBeenCalledWith()
      })
    })

    describe('should use default aiRunCallbackSender value', () => {
      test('with no arguments', () => {
        const createSenderSpy = jest.spyOn(AiRunTerminalCallbackDeliverer, 'createAiRunCallbackSender')

        const deliverer = AiRunTerminalCallbackDeliverer.create()

        expect(deliverer.aiRunCallbackSender)
          .toBeInstanceOf(AiRunCallbackSender)
        expect(createSenderSpy)
          .toHaveBeenCalledWith()
      })
    })

    describe('should use default aiRunCallbackDeliveryRecorder value', () => {
      test('with no arguments', () => {
        const createRecorderSpy = jest.spyOn(AiRunTerminalCallbackDeliverer, 'createAiRunCallbackDeliveryRecorder')

        const deliverer = AiRunTerminalCallbackDeliverer.create()

        expect(deliverer.aiRunCallbackDeliveryRecorder)
          .toBeInstanceOf(AiRunCallbackDeliveryRecorder)
        expect(createRecorderSpy)
          .toHaveBeenCalledWith()
      })
    })

    describe('should use default aiRunCallbackUrlInspectorFactory value', () => {
      test('with no arguments', () => {
        const deliverer = AiRunTerminalCallbackDeliverer.create()

        expect(deliverer)
          .toHaveProperty('aiRunCallbackUrlInspectorFactory', AiRunCallbackUrlInspector)
      })
    })
  })
})

describe('AiRunTerminalCallbackDeliverer', () => {
  describe('.get:AiRunCtor', () => {
    describe('when called as is', () => {
      test('should be fixed value', () => {
        const actual = AiRunTerminalCallbackDeliverer.AiRunCtor

        expect(actual)
          .toBe(AiRun) // same reference
      })
    })
  })
})

describe('AiRunTerminalCallbackDeliverer', () => {
  describe('.get:ApiClientCtor', () => {
    describe('when called as is', () => {
      test('should be fixed value', () => {
        const actual = AiRunTerminalCallbackDeliverer.ApiClientCtor

        expect(actual)
          .toBe(ApiClient) // same reference
      })
    })
  })
})

describe('AiRunTerminalCallbackDeliverer', () => {
  describe('.get:mentsuLogger', () => {
    describe('when called as is', () => {
      test('should be a MentsuLogger', () => {
        const actual = AiRunTerminalCallbackDeliverer.mentsuLogger

        expect(actual)
          .toBeInstanceOf(MentsuLogger)
      })
    })
  })
})

describe('AiRunTerminalCallbackDeliverer', () => {
  describe('.createApiClientSecretCipher()', () => {
    describe('when called as is', () => {
      test('should be an ApiClientSecretCipher', () => {
        const actual = AiRunTerminalCallbackDeliverer.createApiClientSecretCipher()

        expect(actual)
          .toBeInstanceOf(ApiClientSecretCipher)
      })
    })
  })
})

describe('AiRunTerminalCallbackDeliverer', () => {
  describe('.createApiClientSecretCipher()', () => {
    /*
     * The third construction site of the cipher in this application, and the second whose caller
     * never sees the reason it failed: an encryption key that is not an AES-256 key stops the
     * cipher at construction, and here the caller is a worker daemon, where that becomes a failed
     * job and a retry rather than anything naming the environment variable. The line is what says
     * why — and the throw still reaches the caller, so a deployment with an unusable key goes on
     * refusing every callback exactly as it did.
     */
    describe('should write the line naming the key, and raise anyway', () => {
      const cases = [
        {
          mockCreateFailure: new Error('API client secret encryption key is not 64 hex characters'),
          expected: 'API client secret encryption key is not 64 hex characters',
        },
        {
          mockCreateFailure: new TypeError('API client secret encryption key is absent'),
          expected: 'API client secret encryption key is absent',
        },
      ]

      test.each(cases)('mockCreateFailure: $mockCreateFailure.message', ({
        mockCreateFailure,
        expected,
      }) => {
        const apiClientAuthenticationLogger = ApiClientAuthenticationLogger.create()

        const unusableEncryptionKeyLogSpy = jest.spyOn(apiClientAuthenticationLogger, 'logUnusableEncryptionKey')
          .mockReturnValue(null)

        jest.spyOn(AiRunTerminalCallbackDeliverer, 'createApiClientAuthenticationLogger')
          .mockReturnValue(apiClientAuthenticationLogger)
        jest.spyOn(ApiClientSecretCipher, 'create')
          .mockImplementation(() => {
            throw mockCreateFailure
          })

        const actual = () => AiRunTerminalCallbackDeliverer.createApiClientSecretCipher()

        expect(actual)
          .toThrow(expected)
        expect(unusableEncryptionKeyLogSpy)
          .toHaveBeenCalledWith()
      })
    })
  })
})

describe('AiRunTerminalCallbackDeliverer', () => {
  describe('.get:ApiClientAuthenticationLoggerCtor', () => {
    describe('when called as is', () => {
      test('should be fixed value', () => {
        const actual = AiRunTerminalCallbackDeliverer.ApiClientAuthenticationLoggerCtor

        expect(actual)
          .toBe(ApiClientAuthenticationLogger) // same reference
      })
    })
  })
})

describe('AiRunTerminalCallbackDeliverer', () => {
  describe('.createApiClientAuthenticationLogger()', () => {
    describe('when called as is', () => {
      test('should be an ApiClientAuthenticationLogger', () => {
        const actual = AiRunTerminalCallbackDeliverer.createApiClientAuthenticationLogger()

        expect(actual)
          .toBeInstanceOf(ApiClientAuthenticationLogger)
      })
    })
  })
})

describe('AiRunTerminalCallbackDeliverer', () => {
  describe('.logUnusableEncryptionKey()', () => {
    /*
     * The line names the environment variable and carries nothing of what it holds — the logger's
     * method takes no argument, so there is nothing here that could pass one, and the assertion
     * says exactly that.
     */
    describe('when called as is', () => {
      test('should write through the logger that holds the line', () => {
        const apiClientAuthenticationLogger = ApiClientAuthenticationLogger.create()

        const unusableEncryptionKeyLogSpy = jest.spyOn(apiClientAuthenticationLogger, 'logUnusableEncryptionKey')
          .mockReturnValue(null)

        jest.spyOn(AiRunTerminalCallbackDeliverer, 'createApiClientAuthenticationLogger')
          .mockReturnValue(apiClientAuthenticationLogger)

        AiRunTerminalCallbackDeliverer.logUnusableEncryptionKey()

        expect(unusableEncryptionKeyLogSpy)
          .toHaveBeenCalledWith()
      })
    })
  })
})

describe('AiRunTerminalCallbackDeliverer', () => {
  describe('.createAiRunResponseBuilder()', () => {
    describe('when called as is', () => {
      test('should be an AiRunResponseBuilder', () => {
        const actual = AiRunTerminalCallbackDeliverer.createAiRunResponseBuilder()

        expect(actual)
          .toBeInstanceOf(AiRunResponseBuilder)
      })
    })
  })
})

describe('AiRunTerminalCallbackDeliverer', () => {
  describe('.createAiRunCallbackSigner()', () => {
    describe('when called as is', () => {
      test('should be an AiRunCallbackSigner', () => {
        const actual = AiRunTerminalCallbackDeliverer.createAiRunCallbackSigner()

        expect(actual)
          .toBeInstanceOf(AiRunCallbackSigner)
      })
    })
  })
})

describe('AiRunTerminalCallbackDeliverer', () => {
  describe('.createAiRunCallbackSender()', () => {
    describe('when called as is', () => {
      test('should be an AiRunCallbackSender', () => {
        const actual = AiRunTerminalCallbackDeliverer.createAiRunCallbackSender()

        expect(actual)
          .toBeInstanceOf(AiRunCallbackSender)
      })
    })
  })
})

describe('AiRunTerminalCallbackDeliverer', () => {
  describe('.createAiRunCallbackDeliveryRecorder()', () => {
    describe('when called as is', () => {
      test('should be an AiRunCallbackDeliveryRecorder', () => {
        const actual = AiRunTerminalCallbackDeliverer.createAiRunCallbackDeliveryRecorder()

        expect(actual)
          .toBeInstanceOf(AiRunCallbackDeliveryRecorder)
      })
    })
  })
})

describe('AiRunTerminalCallbackDeliverer', () => {
  describe('#get:Ctor', () => {
    describe('should answer own constructor', () => {
      const cases = [
        {
          input: {
            DelivererCtor: AiRunTerminalCallbackDeliverer,
          },
        },
        {
          input: {
            DelivererCtor: class AlphaAiRunTerminalCallbackDeliverer extends AiRunTerminalCallbackDeliverer {},
          },
        },
      ]

      test.each(cases)('DelivererCtor: $input.DelivererCtor.name', ({
        input,
      }) => {
        const deliverer = input.DelivererCtor.create()

        const actual = deliverer.Ctor

        expect(actual)
          .toBe(input.DelivererCtor) // same reference
      })
    })
  })
})

describe('AiRunTerminalCallbackDeliverer', () => {
  describe('#findAiRun()', () => {
    describe('when a row carries the id', () => {
      const cases = [
        {
          input: {
            aiRunId: 10010004,
          },
          expected: expect.objectContaining({
            id: 10010004,
            ApiClientId: 10000001,
            runKey: 'run-key-10010004',
            callbackUrl: 'https://signing.client.development.invalid/callbacks/10010004',
          }),
        },
        {
          input: {
            aiRunId: 10010003,
          },
          expected: expect.objectContaining({
            id: 10010003,
            ApiClientId: 10000002,
            runKey: 'run-key-10010003',
            callbackUrl: 'https://rotating.client.development.invalid/callbacks/10010003',
          }),
        },
      ]

      test.each(cases)('aiRunId: $input.aiRunId', async ({
        input,
        expected,
      }) => {
        const deliverer = AiRunTerminalCallbackDeliverer.create()

        const actual = await deliverer.findAiRun(input)

        expect(actual)
          .toEqual(expected)
      })
    })

    describe('when no row carries the id', () => {
      const cases = [
        {
          input: {
            aiRunId: 10539001,
          },
        },
        {
          input: {
            aiRunId: 10539002,
          },
        },
      ]

      test.each(cases)('aiRunId: $input.aiRunId', async ({
        input,
      }) => {
        const deliverer = AiRunTerminalCallbackDeliverer.create()

        const actual = await deliverer.findAiRun(input)

        expect(actual)
          .toBeNull()
      })
    })
  })
})

describe('AiRunTerminalCallbackDeliverer', () => {
  describe('#findSecretBearingApiClient()', () => {
    /*
     * The three fields the callback needs, and no fourth. `previousSecretCiphertext` is the one
     * asserted absent by name: either of a client's two secrets verifies a request coming *in*,
     * and a reader could reasonably think the same applies going out. It does not — this service
     * knows which secret is current.
     */
    describe('when a row carries the id', () => {
      const cases = [
        {
          input: {
            apiClientId: 10000001,
          },
          expected: expect.objectContaining({
            clientKey: 'client-key-signing-10000001',
            callbackUrlPrefix: 'https://signing.client.development.invalid/callbacks/',
            secretCiphertext: expect.any(String),
          }),
        },
        {
          input: {
            apiClientId: 10000002,
          },
          expected: expect.objectContaining({
            clientKey: 'client-key-rotating-10000002',
            callbackUrlPrefix: 'https://rotating.client.development.invalid/callbacks/',
            secretCiphertext: expect.any(String),
          }),
        },
      ]

      test.each(cases)('apiClientId: $input.apiClientId', async ({
        input,
        expected,
      }) => {
        const deliverer = AiRunTerminalCallbackDeliverer.create()

        const apiClient = await deliverer.findSecretBearingApiClient(input)
        const actual = apiClient.dataValues

        expect(actual)
          .toEqual(expected)
        expect(actual)
          .not
          .toHaveProperty('previousSecretCiphertext')
      })
    })

    describe('when no row carries the id', () => {
      const cases = [
        {
          input: {
            apiClientId: 10009001,
          },
        },
        {
          input: {
            apiClientId: 10009002,
          },
        },
      ]

      test.each(cases)('apiClientId: $input.apiClientId', async ({
        input,
      }) => {
        const deliverer = AiRunTerminalCallbackDeliverer.create()

        const actual = await deliverer.findSecretBearingApiClient(input)

        expect(actual)
          .toBeNull()
      })
    })
  })
})

describe('AiRunTerminalCallbackDeliverer', () => {
  describe('#isDeliverableAiRunCallbackUrl()', () => {
    /*
     * Section 12's second acceptance criterion, at the one place the orchestration asks it: a
     * callback URL that does not match the client's registered prefix is not called at all.
     */
    describe('should be truthy', () => {
      const cases = [
        {
          input: {
            aiRun: {
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10010004',
            },
            apiClient: {
              callbackUrlPrefix: 'https://signing.client.development.invalid/callbacks/',
            },
          },
        },
        {
          input: {
            aiRun: {
              callbackUrl: 'https://rotating.client.development.invalid/callbacks/10010003',
            },
            apiClient: {
              callbackUrlPrefix: 'https://rotating.client.development.invalid/callbacks/',
            },
          },
        },
      ]

      test.each(cases)('callbackUrl: $input.aiRun.callbackUrl', ({
        input,
      }) => {
        const deliverer = AiRunTerminalCallbackDeliverer.create()

        const actual = deliverer.isDeliverableAiRunCallbackUrl(input)

        expect(actual)
          .toBeTruthy()
      })
    })

    describe('should be falsy', () => {
      const cases = [
        {
          input: {
            aiRun: {
              callbackUrl: 'https://elsewhere.client.development.invalid/callbacks/10010004',
            },
            apiClient: {
              callbackUrlPrefix: 'https://signing.client.development.invalid/callbacks/',
            },
          },
        },
        {
          input: {
            aiRun: {
              // normalizes to https://signing.client.development.invalid/elsewhere
              callbackUrl: 'https://signing.client.development.invalid/callbacks/../../elsewhere',
            },
            apiClient: {
              callbackUrlPrefix: 'https://signing.client.development.invalid/callbacks/',
            },
          },
        },
        {
          input: {
            aiRun: {
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10010004',
            },
            apiClient: {
              callbackUrlPrefix: '',
            },
          },
        },
      ]

      test.each(cases)('callbackUrl: $input.aiRun.callbackUrl', ({
        input,
      }) => {
        const deliverer = AiRunTerminalCallbackDeliverer.create()

        const actual = deliverer.isDeliverableAiRunCallbackUrl(input)

        expect(actual)
          .toBeFalsy()
      })
    })
  })
})

describe('AiRunTerminalCallbackDeliverer', () => {
  describe('#createAiRunCallbackUrlInspector()', () => {
    describe('should be an inspector holding the normalized prefix', () => {
      const cases = [
        {
          input: {
            callbackUrlPrefix: 'https://signing.client.development.invalid/callbacks/',
          },
          expected: 'https://signing.client.development.invalid/callbacks/',
        },
        {
          input: {
            callbackUrlPrefix: 'HTTPS://Rotating.Client.Development.INVALID/callbacks/',
          },
          expected: 'https://rotating.client.development.invalid/callbacks/',
        },
      ]

      test.each(cases)('callbackUrlPrefix: $input.callbackUrlPrefix', ({
        input,
        expected,
      }) => {
        const deliverer = AiRunTerminalCallbackDeliverer.create()

        const actual = deliverer.createAiRunCallbackUrlInspector(input)

        expect(actual)
          .toHaveProperty('normalizedCallbackUrlPrefix', expected)
      })
    })
  })
})

describe('AiRunTerminalCallbackDeliverer', () => {
  describe('#refuseTerminalCallback()', () => {
    describe('should answer a refusal', () => {
      const cases = [
        {
          input: {
            aiRunId: 10010009,
            refusalReasonCode: 'unregistered-callback-url',
          },
          expected: {
            hasAttempted: false,
            hasDelivered: false,
            httpStatusCode: null,
            refusalReasonCode: 'unregistered-callback-url',
          },
        },
        {
          input: {
            aiRunId: 10010010,
            refusalReasonCode: 'unsignable-client-secret',
          },
          expected: {
            hasAttempted: false,
            hasDelivered: false,
            httpStatusCode: null,
            refusalReasonCode: 'unsignable-client-secret',
          },
        },
      ]

      test.each(cases)('aiRunId: $input.aiRunId', ({
        input,
        expected,
      }) => {
        jest.spyOn(AiRunTerminalCallbackDeliverer.mentsuLogger, 'error')
          .mockReturnValue(null)

        const deliverer = AiRunTerminalCallbackDeliverer.create()

        const actual = deliverer.refuseTerminalCallback(input)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunTerminalCallbackDeliverer', () => {
  describe('#logRefusedTerminalCallback()', () => {
    /*
     * The line carries an id and a reason code — what section 7 allows a log to hold. The callback
     * URL is not among them even on the refusal that is about a URL: it is the client's own, and
     * section 7 counts it as content.
     */
    describe('should write the line naming the reason', () => {
      const cases = [
        {
          input: {
            aiRunId: 10010009,
            refusalReasonCode: 'unregistered-callback-url',
          },
          expected: {
            message: 'AiRunTerminalCallbackDeliverer#deliverTerminalCallback() was refused: AiRunId 10010009, reason unregistered-callback-url',
            tags: [
              'AiRunCallback',
              'RefusedDelivery',
            ],
          },
        },
        {
          input: {
            aiRunId: 10010010,
            refusalReasonCode: 'unknown-ai-run',
          },
          expected: {
            message: 'AiRunTerminalCallbackDeliverer#deliverTerminalCallback() was refused: AiRunId 10010010, reason unknown-ai-run',
            tags: [
              'AiRunCallback',
              'RefusedDelivery',
            ],
          },
        },
      ]

      test.each(cases)('refusalReasonCode: $input.refusalReasonCode', ({
        input,
        expected,
      }) => {
        const errorLogSpy = jest.spyOn(AiRunTerminalCallbackDeliverer.mentsuLogger, 'error')
          .mockReturnValue(null)

        const deliverer = AiRunTerminalCallbackDeliverer.create()

        deliverer.logRefusedTerminalCallback(input)

        expect(errorLogSpy)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})

describe('AiRunTerminalCallbackDeliverer', () => {
  describe('#buildRefusedOutcome()', () => {
    describe('should report that nothing was sent', () => {
      const cases = [
        {
          input: {
            refusalReasonCode: 'unknown-api-client',
          },
          expected: {
            hasAttempted: false,
            hasDelivered: false,
            httpStatusCode: null,
            refusalReasonCode: 'unknown-api-client',
          },
        },
        {
          input: {
            refusalReasonCode: 'unreadable-ai-run-response',
          },
          expected: {
            hasAttempted: false,
            hasDelivered: false,
            httpStatusCode: null,
            refusalReasonCode: 'unreadable-ai-run-response',
          },
        },
      ]

      test.each(cases)('refusalReasonCode: $input.refusalReasonCode', ({
        input,
        expected,
      }) => {
        const deliverer = AiRunTerminalCallbackDeliverer.create()

        const actual = deliverer.buildRefusedOutcome(input)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunTerminalCallbackDeliverer', () => {
  describe('#buildAiRunRawBody()', () => {
    /*
     * Section 12's fourth acceptance criterion — reading a run back by its key returns the same
     * body the terminal callback carried — rests on there being one builder and two callers. What
     * is asserted here is that this caller asks that builder for this run, and asks for no step
     * trace: the fifth criterion is that a response which did not ask for the trace carries none,
     * and a callback never asks.
     */
    describe('should ask the response builder for this run', () => {
      const cases = [
        {
          input: {
            aiRun: {
              runKey: 'run-key-10010004',
              ApiClientId: 10000001,
            },
          },
          expected: {
            runKey: 'run-key-10010004',
            apiClientId: 10000001,
            expandsSteps: false,
          },
        },
        {
          input: {
            aiRun: {
              runKey: 'run-key-10010003',
              ApiClientId: 10000002,
            },
          },
          expected: {
            runKey: 'run-key-10010003',
            apiClientId: 10000002,
            expandsSteps: false,
          },
        },
      ]

      test.each(cases)('runKey: $input.aiRun.runKey', async ({
        input,
        expected,
      }) => {
        const deliverer = AiRunTerminalCallbackDeliverer.create()
        const buildResponseSpy = jest.spyOn(deliverer.aiRunResponseBuilder, 'buildAiRunResponse')

        await deliverer.buildAiRunRawBody(input)

        expect(buildResponseSpy)
          .toHaveBeenCalledWith(expected)
      })
    })

    /*
     * Serialized once. The bytes that are signed and the bytes that are sent are one string, so a
     * client's verification is of what it actually received.
     */
    describe('should serialize what the builder answered', () => {
      const cases = [
        {
          mockAiRunResponse: {
            runKey: 'run-key-10010004',
            statusName: 'succeeded',
          },
          input: {
            aiRun: {
              runKey: 'run-key-10010004',
              ApiClientId: 10000001,
            },
          },
          expected: '{"runKey":"run-key-10010004","statusName":"succeeded"}',
        },
        {
          mockAiRunResponse: {
            runKey: 'run-key-10010005',
            statusName: 'failed',
          },
          input: {
            aiRun: {
              runKey: 'run-key-10010005',
              ApiClientId: 10000001,
            },
          },
          expected: '{"runKey":"run-key-10010005","statusName":"failed"}',
        },
      ]

      test.each(cases)('runKey: $input.aiRun.runKey', async ({
        mockAiRunResponse,
        input,
        expected,
      }) => {
        const deliverer = AiRunTerminalCallbackDeliverer.create()

        jest.spyOn(deliverer.aiRunResponseBuilder, 'buildAiRunResponse')
          .mockResolvedValue(mockAiRunResponse)

        const actual = await deliverer.buildAiRunRawBody(input)

        expect(actual)
          .toBe(expected)
      })
    })

    describe('when the builder answers no run', () => {
      const cases = [
        {
          input: {
            aiRun: {
              runKey: 'run-key-10539001',
              ApiClientId: 10000001,
            },
          },
        },
        {
          input: {
            aiRun: {
              runKey: 'run-key-10539002',
              ApiClientId: 10000002,
            },
          },
        },
      ]

      test.each(cases)('runKey: $input.aiRun.runKey', async ({
        input,
      }) => {
        const deliverer = AiRunTerminalCallbackDeliverer.create()

        const actual = await deliverer.buildAiRunRawBody(input)

        expect(actual)
          .toBeNull()
      })
    })
  })
})

describe('AiRunTerminalCallbackDeliverer', () => {
  describe('#buildCurrentInstant()', () => {
    describe('should answer the moment it was called', () => {
      const cases = [
        {
          input: {
            aiRunCallbackSender: AiRunCallbackSender.create({
              requestTimeoutMilliseconds: 10000,
            }),
          },
        },
        {
          input: {
            aiRunCallbackSender: AiRunCallbackSender.create({
              requestTimeoutMilliseconds: 250,
            }),
          },
        },
      ]

      test.each(cases)('requestTimeoutMilliseconds: $input.aiRunCallbackSender.requestTimeoutMilliseconds', ({
        input,
      }) => {
        const deliverer = AiRunTerminalCallbackDeliverer.create(input)

        const actual = deliverer.buildCurrentInstant()

        expect(actual)
          .toBeInstanceOf(Date)
      })
    })
  })
})

describe('AiRunTerminalCallbackDeliverer', () => {
  describe('#extractClientSecret()', () => {
    /*
     * The secret comes back through the same cipher that stored it, so this case reads a real
     * development envelope rather than a literal: the envelope carries a random initialization
     * vector, so no fixed ciphertext could be written here.
     */
    describe('when the envelope decrypts', () => {
      const cases = [
        {
          input: {
            apiClient: {
              secretCiphertext: ApiClientSecretCipher.create()
                .encryptSecret({
                  secret: 'client-secret-0001',
                }),
            },
          },
          expected: 'client-secret-0001',
        },
        {
          input: {
            apiClient: {
              secretCiphertext: ApiClientSecretCipher.create()
                .encryptSecret({
                  secret: 'client-secret-0002',
                }),
            },
          },
          expected: 'client-secret-0002',
        },
      ]

      test.each(cases)('secretCiphertext: $input.apiClient.secretCiphertext', ({
        input,
        expected,
      }) => {
        const deliverer = AiRunTerminalCallbackDeliverer.create()

        const actual = deliverer.extractClientSecret(input)

        expect(actual)
          .toBe(expected)
      })
    })

    describe('when the envelope does not decrypt', () => {
      const cases = [
        {
          input: {
            apiClient: {
              secretCiphertext: 'not-an-envelope-0001',
            },
          },
        },
        {
          input: {
            apiClient: {
              secretCiphertext: 'not-an-envelope-0002',
            },
          },
        },
      ]

      test.each(cases)('secretCiphertext: $input.apiClient.secretCiphertext', ({
        input,
      }) => {
        const deliverer = AiRunTerminalCallbackDeliverer.create()

        const actual = deliverer.extractClientSecret(input)

        expect(actual)
          .toBeNull()
      })
    })
  })
})

describe('AiRunTerminalCallbackDeliverer', () => {
  describe('#buildCallbackHeaderHash()', () => {
    /*
     * Section 12's third acceptance criterion: a callback is signed the same way a request is, and
     * additionally carries the run key in a header. The signature is asserted by shape because it
     * is computed over a timestamp read at the moment of the call; that it is the *same* digest a
     * request is verified with is `AiRunCallbackSigner`'s own test, which is what makes one
     * assertion here enough.
     */
    describe('when the secret keys an HMAC', () => {
      const cases = [
        {
          input: {
            aiRun: {
              runKey: 'run-key-10010004',
            },
            apiClient: {
              clientKey: 'client-key-signing-10000001',
              secretCiphertext: ApiClientSecretCipher.create()
                .encryptSecret({
                  secret: 'client-secret-0001',
                }),
            },
            rawBody: '{"runKey":"run-key-10010004"}',
            attemptedAt: new Date('2026-09-25T01:00:04.004Z'),
          },
          expected: {
            'x-ort-client-id': 'client-key-signing-10000001',
            'x-ort-timestamp': '1790298004',
            'x-ort-signature': expect.stringMatching(/^[0-9a-f]{64}$/u),
            'x-ort-run-key': 'run-key-10010004',
          },
        },
        {
          input: {
            aiRun: {
              runKey: 'run-key-10010003',
            },
            apiClient: {
              clientKey: 'client-key-rotating-10000002',
              secretCiphertext: ApiClientSecretCipher.create()
                .encryptSecret({
                  secret: 'client-secret-0002',
                }),
            },
            rawBody: '{"runKey":"run-key-10010003"}',
            attemptedAt: new Date('2026-09-25T02:00:05.005Z'),
          },
          expected: {
            'x-ort-client-id': 'client-key-rotating-10000002',
            'x-ort-timestamp': '1790301605',
            'x-ort-signature': expect.stringMatching(/^[0-9a-f]{64}$/u),
            'x-ort-run-key': 'run-key-10010003',
          },
        },
      ]

      test.each(cases)('runKey: $input.aiRun.runKey', ({
        input,
        expected,
      }) => {
        const deliverer = AiRunTerminalCallbackDeliverer.create()

        const actual = deliverer.buildCallbackHeaderHash(input)

        expect(actual)
          .toEqual(expected)
      })
    })

    describe('when the secret does not decrypt', () => {
      const cases = [
        {
          input: {
            aiRun: {
              runKey: 'run-key-10010004',
            },
            apiClient: {
              clientKey: 'client-key-signing-10000001',
              secretCiphertext: 'not-an-envelope-0001',
            },
            rawBody: '{"runKey":"run-key-10010004"}',
            attemptedAt: new Date('2026-09-25T01:00:04.004Z'),
          },
        },
        {
          input: {
            aiRun: {
              runKey: 'run-key-10010003',
            },
            apiClient: {
              clientKey: 'client-key-rotating-10000002',
              secretCiphertext: 'not-an-envelope-0002',
            },
            rawBody: '{"runKey":"run-key-10010003"}',
            attemptedAt: new Date('2026-09-25T02:00:05.005Z'),
          },
        },
      ]

      test.each(cases)('runKey: $input.aiRun.runKey', ({
        input,
      }) => {
        const deliverer = AiRunTerminalCallbackDeliverer.create()

        const actual = deliverer.buildCallbackHeaderHash(input)

        expect(actual)
          .toBeNull()
      })
    })
  })
})

describe('AiRunTerminalCallbackDeliverer', () => {
  describe('#sendTerminalCallback()', () => {
    /*
     * The network is the one thing mocked, in the answering cases as well as the failing one: a
     * suite that posted to somebody's server would be a suite that posts to somebody's server.
     */
    describe('should answer what the far side said', () => {
      const cases = [
        {
          input: {
            aiRun: {
              runKey: 'run-key-10010004',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10010004',
            },
            headerHash: {
              'x-ort-run-key': 'run-key-10010004',
            },
            rawBody: '{"runKey":"run-key-10010004"}',
            aiRunCallbackUrlInspector: AiRunCallbackUrlInspector.create({
              callbackUrlPrefix: 'https://signing.client.development.invalid/callbacks/',
            }),
          },
          mockResponseStatus: 200,
          expected: 200,
        },
        {
          input: {
            aiRun: {
              runKey: 'run-key-10010003',
              callbackUrl: 'https://rotating.client.development.invalid/callbacks/10010003',
            },
            headerHash: {
              'x-ort-run-key': 'run-key-10010003',
            },
            rawBody: '{"runKey":"run-key-10010003"}',
            aiRunCallbackUrlInspector: AiRunCallbackUrlInspector.create({
              callbackUrlPrefix: 'https://rotating.client.development.invalid/callbacks/',
            }),
          },
          mockResponseStatus: 503,
          expected: 503,
        },
      ]

      test.each(cases)('runKey: $input.aiRun.runKey', async ({
        input,
        mockResponseStatus,
        expected,
      }) => {
        const fetchFunction = jest.fn()
          .mockResolvedValue(new Response(null, {
            status: mockResponseStatus,
          }))

        jest.spyOn(AiRunCallbackSender, 'fetchClient', 'get')
          .mockReturnValue(fetchFunction)

        const deliverer = AiRunTerminalCallbackDeliverer.create()

        const actual = await deliverer.sendTerminalCallback(input)

        expect(actual)
          .toBe(expected)
      })
    })

    describe('when the request never completed', () => {
      const cases = [
        {
          input: {
            aiRun: {
              runKey: 'run-key-10010005',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10010005',
            },
            headerHash: {
              'x-ort-run-key': 'run-key-10010005',
            },
            rawBody: '{"runKey":"run-key-10010005"}',
            aiRunCallbackUrlInspector: AiRunCallbackUrlInspector.create({
              callbackUrlPrefix: 'https://signing.client.development.invalid/callbacks/',
            }),
          },
          mockSendFailure: new TypeError('fetch failed'),
        },
        {
          input: {
            aiRun: {
              runKey: 'run-key-10010006',
              callbackUrl: 'https://signing.client.development.invalid/callbacks/10010006',
            },
            headerHash: {
              'x-ort-run-key': 'run-key-10010006',
            },
            rawBody: '{"runKey":"run-key-10010006"}',
            aiRunCallbackUrlInspector: AiRunCallbackUrlInspector.create({
              callbackUrlPrefix: 'https://signing.client.development.invalid/callbacks/',
            }),
          },
          mockSendFailure: new DOMException('The operation was aborted', 'TimeoutError'),
        },
      ]

      test.each(cases)('runKey: $input.aiRun.runKey', async ({
        input,
        mockSendFailure,
      }) => {
        const fetchFunction = jest.fn()
          .mockRejectedValue(mockSendFailure)

        jest.spyOn(AiRunCallbackSender, 'fetchClient', 'get')
          .mockReturnValue(fetchFunction)
        jest.spyOn(AiRunCallbackSender.mentsuLogger, 'error')
          .mockReturnValue(null)

        const deliverer = AiRunTerminalCallbackDeliverer.create()

        const actual = await deliverer.sendTerminalCallback(input)

        expect(actual)
          .toBeNull()
      })
    })
  })
})

describe('AiRunTerminalCallbackDeliverer', () => {
  describe('#buildAttemptedOutcome()', () => {
    describe('should report what the far side said', () => {
      const cases = [
        {
          input: {
            httpStatusCode: 200,
          },
          expected: {
            hasAttempted: true,
            hasDelivered: true,
            httpStatusCode: 200,
            refusalReasonCode: null,
          },
        },
        {
          input: {
            httpStatusCode: 503,
          },
          expected: {
            hasAttempted: true,
            hasDelivered: false,
            httpStatusCode: 503,
            refusalReasonCode: null,
          },
        },
        {
          input: {
            httpStatusCode: null,
          },
          expected: {
            hasAttempted: true,
            hasDelivered: false,
            httpStatusCode: null,
            refusalReasonCode: null,
          },
        },
      ]

      test.each(cases)('httpStatusCode: $input.httpStatusCode', ({
        input,
        expected,
      }) => {
        const deliverer = AiRunTerminalCallbackDeliverer.create()

        const actual = deliverer.buildAttemptedOutcome(input)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunTerminalCallbackDeliverer', () => {
  describe('#isDeliveredHttpStatusCode()', () => {
    /*
     * Any `2xx` lands, and the boundaries are both here. A `4xx` does not land and is retried like
     * any other failure: section 12 says the callback is retried until it lands and draws no line
     * between a client that is down and a client that refused.
     */
    describe('should be truthy', () => {
      const cases = [
        {
          input: {
            httpStatusCode: 200,
          },
        },
        {
          input: {
            httpStatusCode: 204,
          },
        },
        {
          input: {
            httpStatusCode: 299,
          },
        },
      ]

      test.each(cases)('httpStatusCode: $input.httpStatusCode', ({
        input,
      }) => {
        const deliverer = AiRunTerminalCallbackDeliverer.create()

        const actual = deliverer.isDeliveredHttpStatusCode(input)

        expect(actual)
          .toBeTruthy()
      })
    })

    describe('should be falsy', () => {
      const cases = [
        {
          input: {
            httpStatusCode: 199,
          },
        },
        {
          input: {
            httpStatusCode: 300,
          },
        },
        {
          // what a redirect this service would not follow is recorded as
          input: {
            httpStatusCode: 307,
          },
        },
        {
          input: {
            httpStatusCode: 404,
          },
        },
        {
          input: {
            httpStatusCode: 503,
          },
        },
        {
          input: {
            httpStatusCode: null,
          },
        },
      ]

      test.each(cases)('httpStatusCode: $input.httpStatusCode', ({
        input,
      }) => {
        const deliverer = AiRunTerminalCallbackDeliverer.create()

        const actual = deliverer.isDeliveredHttpStatusCode(input)

        expect(actual)
          .toBeFalsy()
      })
    })
  })
})

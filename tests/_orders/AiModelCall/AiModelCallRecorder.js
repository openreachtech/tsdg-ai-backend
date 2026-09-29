import AiModelCallRecorder from '../../../app/aiRun/AiModelCallRecorder.js'

describe('AiModelCallRecorder', () => {
  describe('#saveAiModelCall()', () => {
    /*
     * Closes: "each model call is recorded with its model, its input and output token counts, and
     * its outcome", and "every model call records the prompt version it used".
     *
     * The runs are the seeded ones of `#run-contract`, and the model is the seeded stub — the one
     * row a default installation has, which is what makes "any run that used one records which
     * model answered" true on a machine with no key.
     *
     * The two instants the caller measured are not written as they arrive: `called_at` is the end
     * the request went out at, and the distance to the other end is what lands in
     * `latency_milliseconds`. Both cases state a distance that is not a round number of seconds, so
     * a recorder that stored a second count, or that stored one of the instants in place of the
     * measurement, would fail here rather than look plausible.
     *
     * `prompt_version` is the `saved_at` of the instruction generation each call sent, and the two
     * values are the ones the master seeder installed for the asset-media-extraction agent. Both
     * carry non-zero milliseconds, which is what a version truncated to seconds would lose.
     */
    describe('should record the call against its model', () => {
      const cases = [
        {
          input: {
            aiRunId: 10010001,
            aiModelId: 10110001, // AI_MODEL.STUB.ID
            actionName: 'select-suggestible-fields',
            readingIndex: 0, // an action that is not one of the three readings
            instructionSavedAt: new Date('2026-09-24T00:00:03.003Z'), // the seeded default instruction
            calledAt: new Date('2026-09-25T02:02:02.002Z'),
            respondedAt: new Date('2026-09-25T02:02:03.457Z'),
            inputTokenCount: 1201,
            outputTokenCount: 347,
            responseBody: '{"fields":["asset.mileage","asset.color"]}',
          },
          expected: expect.objectContaining({
            AiRunId: 10010001,
            AiModelId: 10110001,
            actionName: 'select-suggestible-fields',
            readingIndex: 0,
            promptVersion: '2026-09-24T00:00:03.003Z',
            latencyMilliseconds: 1455,
            inputTokenCount: 1201,
            outputTokenCount: 347,
            responseBody: '{"fields":["asset.mileage","asset.color"]}',
            calledAt: new Date('2026-09-25T02:02:02.002Z'),
          }),
        },
        {
          input: {
            aiRunId: 10010002,
            aiModelId: 10110001, // AI_MODEL.STUB.ID
            actionName: 'read-asset-medium',
            readingIndex: 2, // the third of the three readings a medium gets
            instructionSavedAt: new Date('2026-09-24T00:00:04.004Z'), // the seeded role instruction
            calledAt: new Date('2026-09-25T03:03:03.003Z'),
            respondedAt: new Date('2026-09-25T03:03:05.891Z'),
            inputTokenCount: 2903,
            outputTokenCount: 118,
            responseBody: '{"readings":[{"path":"asset.mileage","value":"48000"}]}',
          },
          expected: expect.objectContaining({
            AiRunId: 10010002,
            AiModelId: 10110001,
            actionName: 'read-asset-medium',
            readingIndex: 2,
            promptVersion: '2026-09-24T00:00:04.004Z',
            latencyMilliseconds: 2888,
            inputTokenCount: 2903,
            outputTokenCount: 118,
            responseBody: '{"readings":[{"path":"asset.mileage","value":"48000"}]}',
            calledAt: new Date('2026-09-25T03:03:03.003Z'),
          }),
        },
      ]

      test.each(cases)('actionName: $input.actionName', async ({
        input,
        expected,
      }) => {
        const recorder = AiModelCallRecorder.create()

        const received = await recorder.saveAiModelCall(input)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('AiModelCallRecorder', () => {
  describe('#saveAiModelCall()', () => {
    /*
     * A call that produced no body still has to be a complete record, and this is the shape every
     * recorded call takes once the thirty-day content purge has emptied `response_body` — while the
     * decision trace it belongs to is kept for seven hundred and thirty days.
     *
     * That is the whole reason nothing is copied out of the body into a column beside it: the
     * model, the prompt version, the token counts and the latency have to answer here, with no body
     * to read, because that is the state a run is billed and reproduced from for two years. A
     * recorder that reached into the body for any of them would pass the describe above and fail
     * this one.
     */
    describe('when the call produced no body', () => {
      const cases = [
        {
          input: {
            aiRunId: 10010004,
            aiModelId: 10110001, // AI_MODEL.STUB.ID
            actionName: 'read-asset-medium',
            readingIndex: 1,
            instructionSavedAt: new Date('2026-09-24T00:00:03.003Z'), // the seeded default instruction
            calledAt: new Date('2026-09-25T04:04:04.004Z'),
            respondedAt: new Date('2026-09-25T04:04:04.951Z'),
            inputTokenCount: 1777,
            outputTokenCount: 0, // nothing came back to count
            responseBody: null,
          },
          expected: expect.objectContaining({
            AiRunId: 10010004,
            AiModelId: 10110001,
            actionName: 'read-asset-medium',
            readingIndex: 1,
            promptVersion: '2026-09-24T00:00:03.003Z',
            latencyMilliseconds: 947,
            inputTokenCount: 1777,
            outputTokenCount: 0,
            responseBody: null,
            calledAt: new Date('2026-09-25T04:04:04.004Z'),
          }),
        },
        {
          input: {
            aiRunId: 10010005,
            aiModelId: 10110001, // AI_MODEL.STUB.ID
            actionName: 'select-suggestible-fields',
            readingIndex: 0,
            instructionSavedAt: new Date('2026-09-24T00:00:04.004Z'), // the seeded role instruction
            calledAt: new Date('2026-09-25T05:05:05.005Z'),
            respondedAt: new Date('2026-09-25T05:05:07.634Z'),
            inputTokenCount: 640,
            outputTokenCount: 0, // nothing came back to count
            responseBody: null,
          },
          expected: expect.objectContaining({
            AiRunId: 10010005,
            AiModelId: 10110001,
            actionName: 'select-suggestible-fields',
            readingIndex: 0,
            promptVersion: '2026-09-24T00:00:04.004Z',
            latencyMilliseconds: 2629,
            inputTokenCount: 640,
            outputTokenCount: 0,
            responseBody: null,
            calledAt: new Date('2026-09-25T05:05:05.005Z'),
          }),
        },
      ]

      test.each(cases)('aiRunId: $input.aiRunId', async ({
        input,
        expected,
      }) => {
        const recorder = AiModelCallRecorder.create()

        const received = await recorder.saveAiModelCall(input)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

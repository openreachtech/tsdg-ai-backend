'use strict'

const {
  ASSET_FIELD_VALUE_KIND,
} = require('./assetFieldValueKindConstants.cjs')

/*
 * The one tool a reading of an asset's photographs is forced through, and the schema bounding what
 * it may answer.
 *
 * **This is the baseline a seeder puts into `ai_tools`, not what the running service sends.**
 * specs/1.0.0 §20 says what a model may answer is "bounded by a tool schema held as data", so the
 * shape the service actually offers is read from the row at run time through
 * `AiAgentPromptComposer`. These values exist here for the same reason the agent's instructions do
 * in `aiAgentConstants.cjs`: a seeder cannot read the table it is filling, and rewording the schema
 * afterwards is a database write rather than a deployment.
 *
 * **What is load-bearing here is `NAME` alone.** `AssetMediaReadingFetcher` reads it to pick the
 * one tool out of what the composer returned and to find that tool's call in the answer, so the
 * name is the contract between this service's code and the row an operator edits. `DESCRIPTION`
 * and `PAYLOAD` are read by nothing at run time.
 *
 * **The schema carries exactly what step 3 says one item carries** - its field path, its value, its
 * evidence kind, a one-line reason and the photographs it came from - and nothing else. A
 * confidence is deliberately absent: it is computed from the observed agreement and the evidence
 * kind and is "never read from anything the model returned", so a schema offering the model a place
 * to put one would invite the very value step 6 refuses to use.
 *
 * `value` is declared as a string even for a number field. A number crossing a tool boundary comes
 * back in whichever of the two shapes the vendor chose, so step 4 normalizes it either way; asking
 * for one shape here would make the schema a promise no vendor keeps.
 */
module.exports = {
  ASSET_MEDIA_EXTRACTION_TOOL: {
    NAME: 'record_field_readings',
    DESCRIPTION: 'Record one reading of the asset photographs: a value for each field the photographs support, with the evidence it rests on and the photographs it came from.',
    PAYLOAD: {
      name: 'record_field_readings',
      description: 'Record one reading of the asset photographs.',
      parameters: {
        type: 'object',
        properties: {
          readings: {
            type: 'array',
            description: 'One entry per field the photographs support. A field the photographs do not support is left out rather than guessed at.',
            items: {
              type: 'object',
              properties: {
                path: {
                  type: 'string',
                  description: 'The path of the field, exactly as the field schema sent it.',
                },
                value: {
                  type: 'string',
                  description: `The value read, written as text whatever the field's kind is. One of ${Object.values(ASSET_FIELD_VALUE_KIND)
                    .join(', ')}.`,
                },
                evidenceKindName: {
                  type: 'string',
                  description: 'What the value rests on: visible-text when it is written in a photograph, visual-estimate when it is judged from what a photograph shows, category-prior when it rests on what an asset of this category usually has.',
                  enum: [
                    'visible-text',
                    'visual-estimate',
                    'category-prior',
                  ],
                },
                reason: {
                  type: 'string',
                  description: 'One short line saying why, written in the language the asset owner reads.',
                },
                sourceMediaKeys: {
                  type: 'array',
                  description: 'The mediaKey of every photograph this value came from, taken from the media that were sent.',
                  items: {
                    type: 'string',
                  },
                },
              },
              required: [
                'path',
                'value',
                'evidenceKindName',
                'reason',
                'sourceMediaKeys',
              ],
            },
          },
        },
        required: [
          'readings',
        ],
      },
    },
  },
}

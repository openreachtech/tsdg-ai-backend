'use strict'

const {
  AI_RUN_CATEGORY,
} = require('./aiRunCategoryConstants.cjs')

/*
 * Rows of the `ai_agents` table, and the baseline texts its two instruction tables are seeded with.
 *
 * One agent per AI service, so there is one entry here per entry of `AI_RUN_CATEGORY`. `NAME` is
 * the key the application finds an agent by; it is the service's name with `-agent` appended rather
 * than the service's name itself, so that a lookup which confused an agent with a run category
 * finds nothing instead of finding the wrong row.
 *
 * `DEFAULT_INSTRUCTION` and `ROLE_INSTRUCTION` are the **baseline** texts a fresh installation is
 * seeded with — not the texts the running service is bound to. They are values here because a
 * seeder cannot read a table it is filling; everything that reads them at run time reads the rows.
 * Rewording one is a database write, which is what "without deploying" means for this version.
 *
 * The wording of step 3 of the asset-media-extraction run — its language included — belongs to
 * that service's own feature, which owns what a reading is asked for. What is fixed here is only
 * that a baseline exists to be replaced, and that replacing it is a write.
 */
module.exports = {
  AI_AGENT: {
    ASSET_MEDIA_EXTRACTION: {
      ID: 10150001,
      NAME: `${AI_RUN_CATEGORY.ASSET_MEDIA_EXTRACTION.NAME}-agent`,
      DESCRIPTION: 'Suggests a value for each field of an asset schema by reading the photos a client system sent with the run.',
      DEFAULT_INSTRUCTION: `You suggest values for the fields of one asset by reading the photos sent with it.

Suggest a value only for a field the photos support. Leave a field alone rather than guess at it: a field you do not answer is reported as unsettled, which is a better answer than a wrong one.

For every value you suggest, name the photos it came from and give one short sentence saying why. Write that sentence in the language the asset owner reads.

Answer only through the tool you are given, and only with the fields of the schema you were sent.`,
      ROLE_INSTRUCTION: 'You read photographs of a property and report what they show about it. You report only what is visible; you do not infer from what a property of this kind usually has.',
    },
  },
}

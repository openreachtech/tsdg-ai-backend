'use strict'

/*
 * dev-master duplicate: apply the same Gemini model row as the production master in dev / CI.
 *
 * The rows live in the production master file this re-exports, which is their one source of
 * truth. The duplicate exists because `db:seed:master` — the step `db:refresh` runs — reads this
 * directory, so a file placed only in `master/` would be loaded by nothing locally.
 */
module.exports = require('../master/20260928100002-000015-ai_models-gemini.cjs')

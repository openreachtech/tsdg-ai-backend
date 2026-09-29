'use strict'

/*
 * dev-master duplicate: apply the same agent and baseline prompt texts as the production master in
 * dev / CI.
 *
 * The rows live in the production master file this re-exports, which is their one source of truth.
 * The duplicate exists because `db:seed:master` — the step `db:refresh` runs — reads this
 * directory, so a file placed only in `master/` would be loaded by nothing locally.
 */
module.exports = require('../master/20260924100004-000006-ai_agent_suite.cjs')

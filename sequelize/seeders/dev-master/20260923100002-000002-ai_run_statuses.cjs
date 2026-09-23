'use strict'

/*
 * dev-master duplicate: apply the same run statuses as the production master in dev / CI.
 *
 * The rows live in the production master file this re-exports, which is their one source of
 * truth. The duplicate exists because `db:seed:master` — the step `db:refresh` runs — reads this
 * directory, so a file placed only in `master/` would be loaded by nothing locally.
 */
module.exports = require('../master/20260923100002-000002-ai_run_statuses.cjs')

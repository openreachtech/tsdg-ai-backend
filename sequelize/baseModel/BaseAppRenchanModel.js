import {
  RenchanModel,
} from '@openreachtech/renchan-sequelize'

/**
 * Base app renchan model.
 *
 * The one place app-wide shared model behavior is collected. Every model of this
 * application extends this class rather than `RenchanModel` directly, so that behavior
 * added later reaches all of them by being written here once.
 *
 * @class BaseAppRenchanModel
 * @extends {RenchanModel}
 */
export default class BaseAppRenchanModel extends RenchanModel {
  // noop
}

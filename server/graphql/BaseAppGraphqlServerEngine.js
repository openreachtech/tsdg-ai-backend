import {
  BaseGraphqlServerEngine,
} from '@openreachtech/renchan'

import {
  env,
} from '../../app/globals/_.js'

const DEFAULT_REFRESH_TOKEN_LIFETIME_DAYS = 14

/**
 * Base GraphQL server engine of this app.
 *
 * The single place to change refresh-token cookie configuration. Each concrete engine composes its
 * own `config.refreshTokenCookie` from `refreshTokenCookieConfig` here, adding only its
 * audience-specific cookie name — so a maintainer changes these defaults in one Engine class,
 * never in a Context.
 *
 * @extends {BaseGraphqlServerEngine}
 */
export default class BaseAppGraphqlServerEngine extends BaseGraphqlServerEngine {
  /**
   * get: The environment these settings are read from.
   *
   * The two getters below read the environment through here rather than reaching for the imported
   * facade, so that a test can hand them an environment of its own. `renchan-env`'s facade refuses
   * every write, by design — without this seam the fallback branches state a default nothing can
   * reach, and the tests covering them pass only on a machine whose `.env` happens to leave those
   * two values empty.
   *
   * @returns {import('../../app/globals/env.js').default} - Environment facade.
   */
  static get env () {
    return env
  }

  /**
   * get: Shared refresh-token cookie configuration.
   *
   * @returns {RefreshTokenCookieBaseConfig} - Shared config; the name is added per audience.
   */
  static get refreshTokenCookieConfig () {
    return {
      lifetimeDays: this.refreshTokenCookieLifetimeDays,
      secure: this.usesSecureRefreshTokenCookie,
      sameSite: 'lax',
      httpOnly: true,
    }
  }

  /**
   * get: Lifetime of the refresh token, in days.
   *
   * @returns {number} - Days.
   */
  static get refreshTokenCookieLifetimeDays () {
    const normalizedDays = Number(this.env.AUTH_REFRESH_TOKEN_TTL_DAYS)

    if (!normalizedDays) {
      return DEFAULT_REFRESH_TOKEN_LIFETIME_DAYS
    }

    return normalizedDays
  }

  /**
   * get: Whether the refresh token cookie carries `Secure`.
   *
   * Only an explicit `false` turns it off, so a missing or misspelled variable keeps the safe
   * value. Turning it off is for plain-HTTP verification hosts alone.
   *
   * @returns {boolean} - true: emit `Secure`.
   */
  static get usesSecureRefreshTokenCookie () {
    return this.env.AUTH_COOKIE_SECURE !== 'false'
  }
}

/**
 * @typedef {{
 *   lifetimeDays: number
 *   secure: boolean
 *   sameSite: 'lax'
 *   httpOnly: boolean
 * }} RefreshTokenCookieBaseConfig
 */

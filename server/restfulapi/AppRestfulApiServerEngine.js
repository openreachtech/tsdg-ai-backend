import express from 'express'
import cors from 'cors'

import {
  BaseRestfulApiServerEngine,
} from '@openreachtech/renchan'

import rootPath from '../../app/globals/root-path.js'

import AppRestfulApiShare from './contexts/AppRestfulApiShare.js'
import AppRestfulApiContext from './contexts/AppRestfulApiContext.js'

/**
 * App RESTful API server engine.
 *
 * **This hash refuses on the engine's behalf, and reaches no renderer.** The framework feeds it
 * to `BaseRestfulApiServerEngine.buildErrorResponseHash()` alone, while a renderer's own hash is
 * built from that renderer's `static get errorStructureHash ()`, which starts empty. So the only
 * statuses that belong here are the ones the filter handler itself answers — `401` and `403`.
 * The contract's `404`, `409` and `422` are decisions a renderer makes after this filter has
 * already passed the request through, and each renderer declares them.
 *
 * **`401` and `403` are told apart by which visa issuer answered false.** `hasAuthenticated` is
 * whether a client was resolved at all, which is the signature's question and is settled in
 * `AppRestfulApiContext.findUser()`; `hasAuthorized` is whether that resolved client's record is
 * switched on. Reading `is_active` in `findUser()` instead would collapse the two into one
 * refusal, and a caller could no longer tell a rotation it should retry from a record somebody
 * switched off.
 */
export default class AppRestfulApiServerEngine extends BaseRestfulApiServerEngine {
  /** @override */
  static get config () {
    return {
      pathPrefix: '/v1', // nul: none
      renderersPath: rootPath.to('server/restfulapi/renderers/v1/'),
      staticPath: rootPath.to('public/'),
    }
  }

  /** @override */
  static get Share () {
    return AppRestfulApiShare
  }

  /** @override */
  static get Context () {
    return AppRestfulApiContext
  }

  /**
   * get: Standard error envelope hash.
   *
   * The statuses this engine's own filter handler answers, and nothing else — the framework's
   * required five, of which `401` and `403` are the refusals the contract names here.
   *
   * The contract's `404`, `409` and `422` are deliberately absent. A renderer cannot reach this
   * hash: `BaseRenderer` builds its own from that renderer's `static get errorStructureHash ()`,
   * which starts empty. Declaring them here would read as though the engine answered them.
   *
   * @override
   * @returns {Record<string, RestfulApiType.ErrorResponseEnvelope>} - Error envelope hash.
   */
  static get standardErrorEnvelopHash () {
    return {
      Unknown: {
        statusCode: 500,
        errorMessage: 'Unknown error',
      },
      ConcreteMemberNotFound: {
        statusCode: 500,
        errorMessage: 'Unknown error',
      },
      Unauthenticated: {
        statusCode: 401,
        errorMessage: 'Unauthenticated',
      },
      Unauthorized: {
        statusCode: 403,
        errorMessage: 'Unauthorized',
      },
      Database: {
        statusCode: 500,
        errorMessage: 'Database error',
      },
    }
  }

  /** @override */
  get visaIssuers () {
    return {
      hasAuthenticated: async ({
        expressRequest,
        userEntity,
        engine,
      }) => userEntity !== null,
      hasAuthorized: async ({
        expressRequest,
        userEntity,
        engine,
      }) => this.isActiveApiClient({
        userEntity,
      }),
      hasPathPermission: async ({
        expressRequest,
        userEntity,
        engine,
      }) => true,
    }
  }

  /** @override */
  generateFilterHandler () {
    /**
     * @param {RestfulApiType.RenderInput<*, *>} params - Parameters.
     * @returns {Promise<RestfulApiType.ErrorResponse | null>}
     */
    return async ({
      body,
      query,
      context,
      request,
    }) => {
      if (!context.hasAuthenticated()) {
        return this.errorResponseHash
          .Unauthenticated
          .createAsError()
      }

      if (!context.hasAuthorized()) {
        return this.errorResponseHash
          .Unauthorized
          .createAsError()
      }

      if (!context.hasPathPermission()) {
        return this.errorResponseHash
          .Unauthorized
          .createAsError()
      }

      return null
    }
  }

  /**
   * Check whether the resolved API client's record is switched on.
   *
   * This is the whole of what separates a `403` from a `401`: the client signed correctly, so it
   * is who it claims, and is refused for what its record says rather than for what it presented.
   *
   * @param {{
   *   userEntity: renchan.UserEntity | null
   * }} params - Parameters.
   * @returns {boolean} - True when a client was resolved and its record is active.
   */
  isActiveApiClient ({
    userEntity,
  }) {
    return Boolean(
      userEntity
        ?.['isActive']
    )
  }

  /** @override */
  collectMiddleware () {
    /*
     * Keep raw body.
     * for:
     *   express.json()
     *   express.raw()
     *   express.text()
     *   express.urlencoded()
     */
    const keepRawBody = this.defineKeepRawBodyCallback()

    return [
      cors({
        origin: '*',
      }),

      express.static(
        this.config.staticPath
      ),

      express.json({ // on Content-Type: application/json
        limit: '10mb',
        verify: keepRawBody,
      }),

      express.urlencoded({ // on Content-Type: application/x-www-form-urlencoded
        extended: true,
        verify: keepRawBody,
      }),
    ]
  }

  /**
   * Define callback for keeping raw body.
   *
   * @returns {(
   *   req: *,
   *   res: *,
   *   buf: Buffer,
   *   encoding: string
   * ) => void} - Express request handler.
   */
  defineKeepRawBodyCallback () {
    return (request, response, buffer, encoding) => {
      // eslint-disable-next-line no-param-reassign
      request['rawBody'] = buffer.toString()
    }
  }
}

export {}

/*
 * The body of `GET /v1/ai-runs/:runKey`, as `.hora/contracts/1.0.0/client-api.md` fixes it.
 *
 * It is declared once and in one place because two things answer with it: this route, and the
 * terminal callback posted to the client's registered URL. Reading a run back returns the same
 * body the callback carried — two shapes for one answer is what a reconciliation path exists to
 * avoid (specs/1.0.0, #run-delivery) — so a second declaration of it is the defect, not the
 * convenience.
 */
declare global {
  namespace restfulapi.v1 {
    interface AiRunResponse {
      runKey: string
      /*
       * The `name` of the run's category master row. One value this version,
       * `asset-media-extraction`; each later AI service adds a row rather than a type.
       */
      runCategoryName: string
      externalRef: string
      subjectLabel: string
      correlationId: string
      statusName: 'queued' | 'running' | 'succeeded' | 'failed' | 'canceled'
      engine: AiRunEngineResponse
      usage: AiRunUsageResponse
      /*
       * Per service, and null unless the run succeeded. The service that answers a category
       * declares the shape of its own result; nothing here narrows it, because a second service
       * would then need this declaration changed rather than its own written.
       */
      result: Record<string, unknown> | null
      /* Null unless the run failed. */
      failure: AiRunFailureResponse | null
      /* Present only when `?expand=steps` was asked for. */
      steps?: Array<AiRunStepResponse>
    }

    /*
     * Which loop and model produced the result, and the version of the confidence formula that
     * scored it. Both are null on a run that never reached a worker.
     */
    interface AiRunEngineResponse {
      label: string | null
      confidenceMethodVersion: string | null
    }

    /*
     * What the run spent. A canceled run reports what was spent up to the stop rather than
     * nothing, so these are counts of what happened and never a plan.
     */
    interface AiRunUsageResponse {
      modelCallCount: number
      inputTokenCount: number
      outputTokenCount: number
    }

    /*
     * A code and its parameters. This service returns no display wording; the client system
     * builds the sentence people read.
     */
    interface AiRunFailureResponse {
      reasonCode: string
      parameters: Record<string, unknown> | null
    }

    /*
     * One entry of the step trace, in the order it ran. It carries what the step was and how long
     * it took, and never what the step dropped: `rejections` is the internal decision trace and
     * is not on this surface.
     */
    interface AiRunStepResponse {
      stepIndex: number
      stepName: string
      stepCategoryName: string
      outcomeCode: string
      reasonCode: string | null
      startedAt: Date
      finishedAt: Date | null
    }
  }
}

export {}

/*
 * What an asset-media-extraction run settles, as `.hora/contracts/1.0.0/client-api.md` fixes it.
 *
 * **Two things carry it and neither narrows it.** It is the body the terminal callback posts and
 * the same body `GET /v1/ai-runs/:runKey` reads back, where it sits in `AiRunResponse.result` as
 * `Record<string, unknown> | null` — deliberately unnarrowed there, because a second AI service
 * would otherwise need that declaration changed rather than its own written. This is that second
 * declaration for the first service: the run that answers a category declares the shape of its
 * own result.
 *
 * **It is a proposal and carries no field by which anything could be approved.** The service
 * writes nothing back to the caller's record, and the shape is the enforcement rather than a rule
 * somebody remembers (specs/1.0.0, §20).
 */
declare global {
  namespace restfulapi.v1 {
    interface AssetMediaExtractionResult {
      /* One entry per settled field. Empty when no field of the schema could be suggested. */
      fields: Array<AssetMediaExtractionFieldResult>
      /*
       * Required fields no majority settled. Never a guess, never a zero — a field named here is
       * one the photos could not show, and it carries no value at all.
       */
      missingFieldPaths: Array<string>
      /* The `mediaKey` of what was fetched and could not be read. */
      unreadableMediaKeys: Array<string>
      /* Echoed from the request, so a caller can tell which request this answers. */
      mediaSignature: string
    }

    /*
     * One settled field. `path` is the same word on the way in and on the way out, matching the
     * `fieldSchema` entry that was sent, and a path outside that schema never appears here.
     *
     * `suggestionConfidence` is deliberately not `confidence`: the client's own interface already
     * carries a `confidenceScore` meaning something else entirely, and the two will sit on one
     * screen. It is computed from the observed agreement and the evidence kind, and never read
     * from anything the model returned.
     *
     * `reason` is one line, written in the language the asset owner reads. It is the one string
     * on this surface that is not a code: a failure is a reason code and its parameters, and the
     * client system builds the sentence people see.
     */
    interface AssetMediaExtractionFieldResult {
      path: string
      /*
       * The suggested value, in the shape the caller's own `valueKind` asked for. A number field
       * answers a number and a text or select field answers a string; nothing else is settled,
       * because step 4 drops a value the schema does not allow before it can reach here.
       */
      value: string | number
      /*
       * The `name` of the field's state master row — `extracted`, `derived`, `suggested` or
       * `missing`.
       */
      fieldStateName: string
      suggestionConfidence: number
      reason: string
      /*
       * The `mediaKey` of each photo the value came from. Always a subset of the media that was
       * sent.
       */
      sourceMediaKeys: Array<string>
      agreement: AssetMediaExtractionAgreementResult
    }

    /*
     * How many readings agreed, out of how many were taken. Both counts travel, because "two of
     * three" and "two of five" are the same numerator and a different fact — and the confidence
     * beside them was scored from exactly this.
     */
    interface AssetMediaExtractionAgreementResult {
      agreedCount: number
      readingCount: number
    }
  }
}

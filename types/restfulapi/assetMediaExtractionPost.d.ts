export {}

/*
 * The body of `POST /v1/asset-media-extractions`, as `.hora/contracts/1.0.0/client-api.md` fixes
 * it.
 *
 * **None of it is a table.** The field schema, the asset's category and the media list all travel
 * with the request and are used only within the run (specs/1.0.0, §20), so a change to the
 * client's own field schema needs no deployment here — and this declaration is the only place the
 * shape of that request is written down.
 *
 * **The idempotency key is not in here.** It is a required field of the request that travels in
 * the `Idempotency-Key` header rather than the body, and `AiRunCommonFieldsInputAdapter` is what
 * reads it. A body carrying it as well would be signed content the header could disagree with.
 */
declare global {
  namespace restfulapi.v1 {
    interface AssetMediaExtractionRequest {
      /* The caller's own object key. Never interpreted. */
      externalRef: string
      /* One human-readable line, echoed back untouched. */
      subjectLabel: string
      /* Groups the runs belonging to one business object. */
      correlationId: string
      /* Must start with the client's registered prefix. */
      callbackUrl: string
      asset: AssetMediaExtractionAssetRequest
      fieldSchema: Array<AssetMediaExtractionFieldSchemaRequest>
      media: Array<AssetMediaExtractionMediumRequest>
      /*
       * Derived from the media by the caller and echoed back in the result, so a caller can tell
       * which request an answer belongs to. This service reads it as an opaque string.
       */
      mediaSignature: string
    }

    /*
     * What the photographed thing is, in the caller's own vocabulary. Nothing here resolves to a
     * row of this service: it reaches the model as context for the reading and is never a key.
     */
    interface AssetMediaExtractionAssetRequest {
      categorySlugs: Array<string>
      province: string
    }

    /*
     * One field the caller wants suggested. `valueKind` describes the shape of a value the
     * caller's own schema defines, has no table behind it, and is the caller's vocabulary rather
     * than this service's — which is why it is a string and not a union. Step 1 keeps only the
     * kinds that can be suggested from a photo and drops the rest, so a kind this service cannot
     * read is not a refusal.
     *
     * The last three arrive per kind rather than always: a unit with a number, a maximum length
     * with text, the permitted options with a select. Each is a bound step 4 drops a value for
     * breaking, so a field that omits one is a field with that bound unstated.
     */
    interface AssetMediaExtractionFieldSchemaRequest {
      path: string
      label: string
      valueKind: string
      isRequired: boolean
      unit?: string
      maxLength?: number
      options?: Array<string>
    }

    /*
     * One file the caller is handing over. `mediaKey` is the caller's own name for it, and the
     * only name this service returns it by — a source photo and an unreadable one are both
     * reported as the key that was sent.
     *
     * `mediaCategoryName` names a row of the `ai_run_media_categories` master this service keeps,
     * so what it may hold is fixed here and grows by a row. What happens to a kind is the row's
     * `handlingName`: read, refused by name, or ignored.
     *
     * `byteSize` is what the caller declares the file weighs, and is checked against the cap
     * before anything is fetched.
     */
    interface AssetMediaExtractionMediumRequest {
      mediaKey: string
      mediaCategoryName: string
      url: string
      mimeType: string
      byteSize: number
    }
  }
}

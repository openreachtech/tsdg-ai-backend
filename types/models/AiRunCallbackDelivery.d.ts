export {}

declare global {
  namespace model {
    interface AiRunCallbackDelivery {
      id: number
      AiRunId: number
      AiRunCallbackDeliveryCategoryId: number
      attemptIndex: number
      /*
       * Null when the request never completed — a connection refused, a timeout, a host that
       * never answered. The attempt happened and is recorded; there was no status to record.
       */
      httpStatusCode: number | null
      attemptedAt: Date
    }
  }
}

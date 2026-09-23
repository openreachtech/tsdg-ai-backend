export {}

declare global {
  namespace model {
    interface AiRun {
      id: number
      ApiClientId: number
      AiRunCategoryId: number
      AiRunStatusId: number
      runKey: string
      requestKey: string
      requestBodyHash: string
      externalRef: string
      subjectLabel: string
      correlationId: string
      callbackUrl: string
      requestBody: string | null
      resultBody: string | null
      failureReasonCode: string | null
      failureParameters: Record<string, unknown> | null
      engineLabel: string | null
      acceptedAt: Date
      startedAt: Date | null
      finishedAt: Date | null
      cancelRequestedAt: Date | null
      canceledAt: Date | null
      contentPurgedAt: Date | null
    }
  }
}

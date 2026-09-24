export {}

declare global {
  namespace model {
    interface AiModelCall {
      id: number
      AiRunId: number
      AiModelId: number
      actionName: string
      readingIndex: number
      promptVersion: string
      latencyMilliseconds: number
      inputTokenCount: number
      outputTokenCount: number
      responseBody: string | null
      calledAt: Date
    }
  }
}

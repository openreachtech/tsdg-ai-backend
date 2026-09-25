export {}

declare global {
  namespace model {
    interface AiRunStep {
      id: number
      AiRunId: number
      AiRunStepCategoryId: number
      stepIndex: number
      stepName: string
      outcomeCode: string
      rejections: Array<Record<string, unknown>> | null
      reasonCode: string | null
      startedAt: Date
      finishedAt: Date | null
    }
  }
}

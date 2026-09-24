export {}

declare global {
  namespace model {
    interface AiAgentDefaultModel {
      id: number
      AiAgentId: number
      AiModelId: number
      savedAt: Date
    }
  }
}

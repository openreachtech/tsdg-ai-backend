export {}

declare global {
  namespace model {
    interface AiAgentAvailableAiTool {
      id: number
      AiAgentId: number
      AiToolId: number
      isEnabled: boolean
      isDefault: boolean
      savedAt: Date
    }
  }
}

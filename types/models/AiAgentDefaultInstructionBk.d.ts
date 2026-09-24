export {}

declare global {
  namespace model {
    interface AiAgentDefaultInstructionBk {
      id: number
      AiAgentId: number
      instruction: string
      savedAt: Date
    }
  }
}

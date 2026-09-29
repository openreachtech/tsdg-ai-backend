export {}

declare global {
  namespace model {
    interface AiAgentDefaultInstruction {
      id: number
      AiAgentId: number
      instruction: string
      savedAt: Date
    }
  }
}

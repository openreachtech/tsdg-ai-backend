export {}

declare global {
  namespace model {
    interface AiAgentRoleInstructionBk {
      id: number
      AiAgentId: number
      role: string
      savedAt: Date
    }
  }
}

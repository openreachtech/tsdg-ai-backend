export {}

declare global {
  namespace model {
    interface AiAgentRoleInstruction {
      id: number
      AiAgentId: number
      role: string
      savedAt: Date
    }
  }
}

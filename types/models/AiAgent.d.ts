export {}

declare global {
  namespace model {
    interface AiAgent {
      id: number
      name: string
      description: string
      registeredAt: Date
      savedAt: Date | null
    }
  }
}

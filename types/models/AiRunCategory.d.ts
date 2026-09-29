export {}

declare global {
  namespace model {
    interface AiRunCategory {
      id: number
      name: string
      displayName: string
      displayOrder: number
      isActive: boolean
    }
  }
}

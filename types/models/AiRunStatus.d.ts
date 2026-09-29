export {}

declare global {
  namespace model {
    interface AiRunStatus {
      id: number
      name: string
      displayName: string
      displayOrder: number
      isActive: boolean
    }
  }
}

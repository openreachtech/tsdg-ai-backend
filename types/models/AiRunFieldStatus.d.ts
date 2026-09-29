export {}

declare global {
  namespace model {
    interface AiRunFieldStatus {
      id: number
      name: string
      displayName: string
      displayOrder: number
      isActive: boolean
    }
  }
}

export {}

declare global {
  namespace model {
    interface AiProvider {
      id: number
      name: string
      displayName: string
      displayOrder: number
      isActive: boolean
    }
  }
}

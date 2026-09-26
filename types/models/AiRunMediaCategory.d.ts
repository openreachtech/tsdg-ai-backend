export {}

declare global {
  namespace model {
    interface AiRunMediaCategory {
      id: number
      name: string
      displayName: string
      displayOrder: number
      handlingName: string
    }
  }
}

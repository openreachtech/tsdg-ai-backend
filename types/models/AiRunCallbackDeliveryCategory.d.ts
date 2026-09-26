export {}

declare global {
  namespace model {
    interface AiRunCallbackDeliveryCategory {
      id: number
      name: string
      displayName: string
      displayOrder: number
      isActive: boolean
    }
  }
}

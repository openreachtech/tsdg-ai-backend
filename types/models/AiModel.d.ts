export {}

declare global {
  namespace model {
    interface AiModel {
      id: number
      AiProviderId: number
      name: string
      targetModelName: string
      isDefault: boolean
      isActive: boolean
      displayOrder: number
    }
  }
}

export {}

declare global {
  namespace model {
    interface AiRunStepCategory {
      id: number
      name: string
      displayName: string
      displayOrder: number
      isActive: boolean
    }
  }
}

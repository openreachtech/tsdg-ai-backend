export {}

declare global {
  namespace model {
    interface AiTool {
      id: number
      name: string
      description: string
      payload: string
      displayOrder: number
      isVisible: boolean
      savedAt: Date
    }
  }
}

export {}

declare global {
  namespace model {
    interface AiModelCapability {
      id: number
      AiModelId: number
      contextWindowToken: number
      maxOutputToken: number
    }
  }
}

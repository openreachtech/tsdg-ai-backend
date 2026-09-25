export {}

declare global {
  namespace model {
    interface AiRunEvidenceCategory {
      id: number
      name: string
      displayName: string
      displayOrder: number
      isActive: boolean
    }
  }
}

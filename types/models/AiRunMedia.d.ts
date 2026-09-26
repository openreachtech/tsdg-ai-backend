export {}

declare global {
  namespace model {
    interface AiRunMedia {
      id: number
      AiRunId: number
      mediaKey: string
      AiRunMediaCategoryId: number
      mimeType: string
      byteSize: number
      isReadable: boolean
      fetchedAt: Date | null
    }
  }
}

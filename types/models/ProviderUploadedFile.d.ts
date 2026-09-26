export {}

declare global {
  namespace model {
    interface ProviderUploadedFile {
      id: number
      AiRunMediaId: number
      AiProviderId: number
      providerFileName: string
      uploadedAt: Date
      expiresAt: Date | null
    }
  }
}

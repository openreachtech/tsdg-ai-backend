export {}

declare global {
  namespace model {
    interface ApiClient {
      id: number
      name: string
      clientKey: string
      secretCiphertext: string
      previousSecretCiphertext: string | null
      callbackUrlPrefix: string
      isActive: boolean
      registeredAt: Date
    }
  }
}

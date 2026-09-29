export {}

declare global {
  namespace model {
    interface AiRunFieldOutcome {
      id: number
      AiRunId: number
      AiRunStepId: number
      fieldPath: string
      AiRunFieldStatusId: number
      AiRunEvidenceCategoryId: number | null
      /*
       * Sequelize hands a DECIMAL back as a string on MySQL and MariaDB — `staging` and `live` —
       * and as a number on SQLite, which is what `development` runs and therefore what every
       * Jest run sees. No single type is true of both, so the union is the honest declaration
       * and a reader is expected to `Number()` it. Do not narrow this to one of the two: the
       * half that is wrong is wrong only in the environment nobody tests in.
       */
      suggestionConfidence: string | number | null
      agreedReadingCount: number
      totalReadingCount: number
      confidenceMethodVersion: string
      settledAt: Date
    }
  }
}

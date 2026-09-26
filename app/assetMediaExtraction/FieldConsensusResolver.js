import ASSET_FIELD_REJECTION_CONSTANT_HASH from '../constants/assetFieldRejectionConstants.js'

const {
  ASSET_FIELD_REJECTION_REASON_CODE,
} = ASSET_FIELD_REJECTION_CONSTANT_HASH

/*
 * What an absolute majority is multiplied out to, so the comparison is between whole numbers.
 *
 * An absolute majority is more than half, and `agreed / total > 0.5` asks that of two floats - a
 * question floating point answers wrongly often enough that nobody should have to reason about
 * which totals it does. `agreed * 2 > total` is the same question in integers, and it is exact for
 * every count this column can hold.
 */
const ABSOLUTE_MAJORITY_MULTIPLIER = 2

/**
 * Step 5 of an asset-media-extraction run: settles the readings by absolute majority.
 *
 * **More than half of the readings taken, never more than half of the readings that answered.**
 * The denominator is the number of readings the run set out to take, handed in rather than counted
 * off the readings that arrived - so a reading the provider failed, or one step 4 emptied, counts
 * against a field rather than for it. One value out of one surviving reading would otherwise be
 * unanimous, which is the one reading of "majority" that makes a single unchecked answer look
 * agreed.
 *
 * **Without a majority the field is not returned, and a required field is reported as missing.**
 * specs/1.0.0 §20 says both halves in one sentence, and the second is why the required paths are
 * handed in: this class answers what was settled and what was not, and "missing" is the name the
 * caller's own schema gives the second of those. A missing field carries no value, no zero and no
 * default - `missingFieldPaths[]` is a list of paths and holds nothing else.
 *
 * **A required field no reading mentioned is missing too.** It had no majority in the plainest
 * possible way, and a client reading the result cannot tell "the photographs did not show it" from
 * "no reading mentioned it" - nor should it have to: both mean there is nothing to propose.
 *
 * **What the winning group carries forward, and why each is chosen that way.** The value is the
 * group's own. The photographs are the union of every agreeing reading's, deduplicated and in the
 * order they were first cited, because every one of them is a photograph some agreeing reading
 * rested the value on and the criterion asks only that they be a subset of what was sent. The
 * reason and the evidence kind are the **first** agreeing reading's, by reading index - taking the
 * most frequent would be a second majority nobody asked for, and taking the strongest would let
 * one reading's confidence in itself raise the score. Deterministic and stated beats clever here.
 *
 * **This class computes no confidence and reads none.** It answers how many readings agreed out of
 * how many, which is one of the two things step 6 scores from. A value the model called confident
 * never reaches it, because step 4's allowed reading carries no such field to begin with.
 */
export default class FieldConsensusResolver {
  /**
   * Constructor.
   *
   * @param {FieldConsensusResolverParams} params - Parameters.
   */
  constructor ({
    absoluteMajorityMultiplier,
  }) {
    this.absoluteMajorityMultiplier = absoluteMajorityMultiplier
  }

  /**
   * Factory method.
   *
   * @template {X extends typeof FieldConsensusResolver ? X : never} T, X
   * @param {FieldConsensusResolverFactoryParams} [params] - Parameters for the factory method.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static create ({
    absoluteMajorityMultiplier = ABSOLUTE_MAJORITY_MULTIPLIER,
  } = {}) {
    return /** @type {InstanceType<T>} */ (
      new this({
        absoluteMajorityMultiplier,
      })
    )
  }

  /**
   * get: own constructor, so a subclass's overrides are the ones that answer.
   *
   * @returns {typeof FieldConsensusResolver} The class.
   */
  get Ctor () {
    return /** @type {typeof FieldConsensusResolver} */ (this.constructor)
  }

  /**
   * Settle every field the readings between them can settle.
   *
   * @param {ResolveFieldConsensusParams} params - Parameters.
   * @returns {ResolvedFieldConsensus} What was settled, what was missing, and what was dropped.
   * @public
   */
  resolveFieldConsensus ({
    readings,
    requiredFieldPaths,
    totalReadingCount,
  }) {
    const readFieldPaths = this.extractReadFieldPaths({
      readings,
    })

    const readingVotes = this.buildReadingVotes({
      readings,
    })

    const fieldConsensuses = readFieldPaths.map(it =>
      this.buildFieldConsensus({
        fieldPath: it,
        readingVotes,
        totalReadingCount,
      })
    )

    const settledFields = fieldConsensuses
      .map(it => it.settledField)
      .filter(it => it !== null)

    const unsettledFieldPaths = this.extractUnsettledFieldPaths({
      readFieldPaths,
      requiredFieldPaths,
      settledFields,
    })

    const missingFieldPaths = this.extractMissingFieldPaths({
      requiredFieldPaths,
      settledFields,
    })

    const rejections = this.buildRejections({
      fieldConsensuses,
      unsettledFieldPaths,
      totalReadingCount,
    })

    return {
      settledFields,
      missingFieldPaths,
      rejections,
    }
  }

  /**
   * Extract every field path any reading answered, in the order they were first answered.
   *
   * @param {{
   *   readings: Array<Array<import('./AssetFieldReadingInspector.js').AssetFieldReading>>
   * }} params - Parameters.
   * @returns {Array<string>} The paths, each once.
   * @public
   */
  extractReadFieldPaths ({
    readings,
  }) {
    const readFieldPaths = readings
      .flat()
      .map(it => it.path)

    return [
      ...new Set(readFieldPaths),
    ]
  }

  /**
   * Build each reading's answers, keyed by the field path each answers.
   *
   * **Why the readings are keyed once rather than scanned per field.** A field is settled by asking
   * every reading what it said about that one path, and there is a field per path any reading
   * answered - so scanning each reading for each path is the product of the two, and both grow
   * with the schema the caller sent. Keying each reading once makes settling linear in what the
   * readings between them carry.
   *
   * **A reading answering one path twice still votes once, with its first answer** - the rule
   * `#extractFieldVotes()` states. A map keeps the last value written under a key, so the reading
   * is reversed before it is keyed and the earliest answer is the one that survives.
   *
   * @param {{
   *   readings: Array<Array<import('./AssetFieldReadingInspector.js').AssetFieldReading>>
   * }} params - Parameters.
   * @returns {Array<Map<string, import('./AssetFieldReadingInspector.js').AssetFieldReading>>} One
   * map per reading, in reading order.
   * @public
   */
  buildReadingVotes ({
    readings,
  }) {
    return readings.map(it =>
      this.buildOneReadingVotes({
        fieldReadings: it,
      })
    )
  }

  /**
   * Build one reading's answers, keyed by the field path each answers.
   *
   * @param {{
   *   fieldReadings: Array<import('./AssetFieldReadingInspector.js').AssetFieldReading>
   * }} params - Parameters.
   * @returns {Map<string, import('./AssetFieldReadingInspector.js').AssetFieldReading>} The
   * answers, by path.
   * @public
   */
  buildOneReadingVotes ({
    fieldReadings,
  }) {
    const pathedFieldReadings = fieldReadings.map(it => [
      it.path,
      it,
    ])

    return new Map(
      /** @type {*} */ (pathedFieldReadings.toReversed())
    )
  }

  /**
   * Build what the readings made of one field.
   *
   * @param {{
   *   fieldPath: string
   *   readingVotes: Array<Map<string, import('./AssetFieldReadingInspector.js').AssetFieldReading>>
   *   totalReadingCount: number
   * }} params - Parameters.
   * @returns {FieldConsensus} The field as it was settled, or what it fell short by.
   * @public
   */
  buildFieldConsensus ({
    fieldPath,
    readingVotes,
    totalReadingCount,
  }) {
    const votes = this.extractFieldVotes({
      fieldPath,
      readingVotes,
    })

    const voteGroups = this.buildVoteGroups({
      votes,
    })

    const largestVoteGroup = this.extractLargestVoteGroup({
      voteGroups,
    })

    const agreedReadingCount = this.generateAgreedReadingCount({
      largestVoteGroup,
    })

    const settledField = this.buildSettledField({
      fieldPath,
      largestVoteGroup,
      agreedReadingCount,
      totalReadingCount,
    })

    return {
      fieldPath,
      agreedReadingCount,
      settledField,
    }
  }

  /**
   * Extract what each reading answered for one field: one vote per reading, or none.
   *
   * A reading answering the same path twice votes once. The two entries are one reading's answer
   * however many times it wrote it down, and counting both would let a single reading out-vote the
   * other two by repeating itself.
   *
   * @param {{
   *   fieldPath: string
   *   readingVotes: Array<Map<string, import('./AssetFieldReadingInspector.js').AssetFieldReading>>
   * }} params - Parameters.
   * @returns {Array<import('./AssetFieldReadingInspector.js').AssetFieldReading>} The votes, in
   * reading order.
   * @public
   */
  extractFieldVotes ({
    fieldPath,
    readingVotes,
  }) {
    return readingVotes
      .map(it =>
        it.get(fieldPath)
        ?? null
      )
      .filter(it => it !== null)
  }

  /**
   * Group the votes for one field by the value each voted for.
   *
   * @param {{
   *   votes: Array<import('./AssetFieldReadingInspector.js').AssetFieldReading>
   * }} params - Parameters.
   * @returns {Array<FieldVoteGroup>} The groups, in the order each value was first voted for.
   * @public
   */
  buildVoteGroups ({
    votes,
  }) {
    const valueTexts = votes.map(it =>
      this.generateComparableValueText({
        value: it.value,
      })
    )

    return [
      ...new Set(valueTexts),
    ].map(it =>
      this.buildVoteGroup({
        valueText: it,
        votes,
      })
    )
  }

  /**
   * Build the group of votes cast for one value.
   *
   * @param {{
   *   valueText: string
   *   votes: Array<import('./AssetFieldReadingInspector.js').AssetFieldReading>
   * }} params - Parameters.
   * @returns {FieldVoteGroup} The group.
   * @public
   */
  buildVoteGroup ({
    valueText,
    votes,
  }) {
    const groupedVotes = votes.filter(it =>
      this.generateComparableValueText({
        value: it.value,
      }) === valueText
    )

    return {
      valueText,
      votes: groupedVotes,
    }
  }

  /**
   * Generate the text two votes are compared as.
   *
   * Comparing the values as text is exact here rather than approximate, because step 4 has already
   * normalized each of them by the kind its own schema entry declares - a number field's value is a
   * number and a text or select field's is a string - and one path carries one kind. So the two
   * spellings that would collide under this comparison, the number 3 and the string `'3'`, cannot
   * both reach one field.
   *
   * @param {{
   *   value: string | number
   * }} params - Parameters.
   * @returns {string} The value as text.
   * @public
   */
  generateComparableValueText ({
    value,
  }) {
    return String(value)
  }

  /**
   * Extract the group that carries the most votes.
   *
   * The first group wins a tie, which is the order the values were first voted for. It changes
   * nothing about what is settled - two tied groups are each at most half the votes, so neither can
   * be an absolute majority - and it keeps the count this answers deterministic for the trace.
   *
   * @param {{
   *   voteGroups: Array<FieldVoteGroup>
   * }} params - Parameters.
   * @returns {FieldVoteGroup | null} The group, or null when nothing voted.
   * @public
   */
  extractLargestVoteGroup ({
    voteGroups,
  }) {
    return voteGroups.reduce(
      (largestVoteGroup, voteGroup) =>
        (voteGroup.votes.length > (largestVoteGroup?.votes.length ?? 0)
          ? voteGroup
          : largestVoteGroup),
      /** @type {FieldVoteGroup | null} */ (null)
    )
  }

  /**
   * Generate how many readings agreed on the value that came closest to settling a field.
   *
   * @param {{
   *   largestVoteGroup: FieldVoteGroup | null
   * }} params - Parameters.
   * @returns {number} The count, nothing when no reading answered the field.
   * @public
   */
  generateAgreedReadingCount ({
    largestVoteGroup,
  }) {
    return largestVoteGroup?.votes.length
      ?? 0
  }

  /**
   * Build the field a group of votes settled, or null when it settled none.
   *
   * @param {{
   *   fieldPath: string
   *   largestVoteGroup: FieldVoteGroup | null
   *   agreedReadingCount: number
   *   totalReadingCount: number
   * }} params - Parameters.
   * @returns {SettledField | null} The settled field, or null.
   * @public
   */
  buildSettledField ({
    fieldPath,
    largestVoteGroup,
    agreedReadingCount,
    totalReadingCount,
  }) {
    if (
      !this.isAbsoluteMajority({
        agreedReadingCount,
        totalReadingCount,
      })
    ) {
      return null
    }

    const [
      firstAgreeingVote,
    ] = largestVoteGroup.votes

    const sourceMediaKeys = this.extractAgreedSourceMediaKeys({
      largestVoteGroup,
    })

    const {
      value,
      evidenceKindName,
      reason,
    } = firstAgreeingVote

    return {
      path: fieldPath,
      value,
      evidenceKindName,
      reason,
      sourceMediaKeys,
      agreedReadingCount,
      totalReadingCount,
    }
  }

  /**
   * Check whether a count is an absolute majority of the readings taken.
   *
   * A run of no readings settles nothing, and it is answered here rather than left to the
   * arithmetic: `0 * 2 > 0` is false, but so is every honest count against a total of nothing, and
   * saying so by name costs a reader less than working it out.
   *
   * @param {{
   *   agreedReadingCount: number
   *   totalReadingCount: number
   * }} params - Parameters.
   * @returns {boolean} Whether more than half the readings agreed.
   * @public
   */
  isAbsoluteMajority ({
    agreedReadingCount,
    totalReadingCount,
  }) {
    if (totalReadingCount <= 0) {
      return false
    }

    return agreedReadingCount * this.absoluteMajorityMultiplier > totalReadingCount
  }

  /**
   * Extract every photograph the agreeing readings rested the value on.
   *
   * @param {{
   *   largestVoteGroup: FieldVoteGroup
   * }} params - Parameters.
   * @returns {Array<string>} The keys, each once, in the order they were first cited.
   * @public
   */
  extractAgreedSourceMediaKeys ({
    largestVoteGroup,
  }) {
    const sourceMediaKeys = largestVoteGroup.votes
      .flatMap(it => it.sourceMediaKeys)

    return [
      ...new Set(sourceMediaKeys),
    ]
  }

  /**
   * Extract every field that was asked for or answered and that no majority settled.
   *
   * @param {{
   *   readFieldPaths: Array<string>
   *   requiredFieldPaths: Array<string>
   *   settledFields: Array<SettledField>
   * }} params - Parameters.
   * @returns {Array<string>} The paths, each once.
   * @public
   */
  extractUnsettledFieldPaths ({
    readFieldPaths,
    requiredFieldPaths,
    settledFields,
  }) {
    const settledFieldPaths = this.buildSettledFieldPaths({
      settledFields,
    })

    const consideredFieldPaths = [
      ...new Set([
        ...readFieldPaths,
        ...requiredFieldPaths,
      ]),
    ]

    return consideredFieldPaths.filter(it => !settledFieldPaths.has(it))
  }

  /**
   * Build the paths a majority settled, in the shape membership is asked of them.
   *
   * A scan per path asked about is the product of two lists that both grow with the caller's own
   * schema; a set is asked once per path however long the settled list is. The answers are
   * unchanged, and so is their order - the order belongs to the list being filtered, never to this.
   *
   * @param {{
   *   settledFields: Array<SettledField>
   * }} params - Parameters.
   * @returns {Set<string>} The paths.
   * @public
   */
  buildSettledFieldPaths ({
    settledFields,
  }) {
    const paths = settledFields.map(it => it.path)

    return new Set(paths)
  }

  /**
   * Extract the required fields no majority settled.
   *
   * @param {{
   *   requiredFieldPaths: Array<string>
   *   settledFields: Array<SettledField>
   * }} params - Parameters.
   * @returns {Array<string>} The paths, in the order the caller's schema sent them.
   * @public
   */
  extractMissingFieldPaths ({
    requiredFieldPaths,
    settledFields,
  }) {
    const settledFieldPaths = this.buildSettledFieldPaths({
      settledFields,
    })

    return requiredFieldPaths.filter(it => !settledFieldPaths.has(it))
  }

  /**
   * Build the record of every field this step left unsettled.
   *
   * The counts are written into the figures because the step's own trace is where an operator asks
   * why a field came back with no value (`#run-record`, second use case) - and the `missing` field
   * outcome beside it carries the same pair, so the two agree.
   *
   * @param {{
   *   fieldConsensuses: Array<FieldConsensus>
   *   unsettledFieldPaths: Array<string>
   *   totalReadingCount: number
   * }} params - Parameters.
   * @returns {Array<import('./AssetFieldReadingInspector.js').AssetFieldRejection>} The rejections.
   * @public
   */
  buildRejections ({
    fieldConsensuses,
    unsettledFieldPaths,
    totalReadingCount,
  }) {
    const agreedReadingCounts = this.buildAgreedReadingCounts({
      fieldConsensuses,
    })

    return unsettledFieldPaths.map(it =>
      this.buildRejection({
        fieldPath: it,
        agreedReadingCounts,
        totalReadingCount,
      })
    )
  }

  /**
   * Build how many readings agreed on each field, keyed by the field's path.
   *
   * Keyed once rather than scanned per rejection, for the reason `#buildSettledFieldPaths()` gives:
   * both lists grow with the caller's own schema, so a scan inside the map is their product. The
   * first consensus of a path wins, as a scan answered - hence the reversal before the map, since
   * a map keeps the last value written under a key.
   *
   * @param {{
   *   fieldConsensuses: Array<FieldConsensus>
   * }} params - Parameters.
   * @returns {Map<string, number>} The counts, by path.
   * @public
   */
  buildAgreedReadingCounts ({
    fieldConsensuses,
  }) {
    const pathedCounts = fieldConsensuses.map(it => [
      it.fieldPath,
      it.agreedReadingCount,
    ])

    return new Map(
      /** @type {*} */ (pathedCounts.toReversed())
    )
  }

  /**
   * Build the record of one field this step left unsettled.
   *
   * @param {{
   *   fieldPath: string
   *   agreedReadingCounts: Map<string, number>
   *   totalReadingCount: number
   * }} params - Parameters.
   * @returns {import('./AssetFieldReadingInspector.js').AssetFieldRejection} The rejection.
   * @public
   */
  buildRejection ({
    fieldPath,
    agreedReadingCounts,
    totalReadingCount,
  }) {
    const agreedReadingCount = agreedReadingCounts.get(fieldPath)
      ?? 0

    return {
      fieldPath,
      reasonCode: ASSET_FIELD_REJECTION_REASON_CODE.NO_ABSOLUTE_MAJORITY,
      figures: {
        agreedReadingCount,
        totalReadingCount,
      },
    }
  }
}

/**
 * @typedef {{
 *   absoluteMajorityMultiplier: number
 * }} FieldConsensusResolverParams
 */

/**
 * @typedef {Partial<FieldConsensusResolverParams>} FieldConsensusResolverFactoryParams
 */

/**
 * @typedef {{
 *   readings: Array<Array<import('./AssetFieldReadingInspector.js').AssetFieldReading>>
 *   requiredFieldPaths: Array<string>
 *   totalReadingCount: number
 * }} ResolveFieldConsensusParams
 */

/**
 * @typedef {{
 *   path: string
 *   value: string | number
 *   evidenceKindName: string
 *   reason: string
 *   sourceMediaKeys: Array<string>
 *   agreedReadingCount: number
 *   totalReadingCount: number
 * }} SettledField
 */

/**
 * @typedef {{
 *   valueText: string
 *   votes: Array<import('./AssetFieldReadingInspector.js').AssetFieldReading>
 * }} FieldVoteGroup
 */

/**
 * @typedef {{
 *   fieldPath: string
 *   agreedReadingCount: number
 *   settledField: SettledField | null
 * }} FieldConsensus
 */

/**
 * @typedef {{
 *   settledFields: Array<SettledField>
 *   missingFieldPaths: Array<string>
 *   rejections: Array<import('./AssetFieldReadingInspector.js').AssetFieldRejection>
 * }} ResolvedFieldConsensus
 */

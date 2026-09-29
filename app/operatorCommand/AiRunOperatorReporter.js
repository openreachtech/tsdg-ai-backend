const LINE_BREAK = '\n'
const SECTION_BREAK = '\n\n'
const COLUMN_GAP = '  '

/*
 * What a field with nothing in it reads as. One mark for every absent thing there is — a step no
 * run has reached, a reason code no failure carried, an instant a step has not arrived at — so an
 * operator learns the mark once and never has to ask which kind of nothing a blank column means.
 * It is never the word `undefined`, which says the reporter went wrong rather than that the run
 * has not got there yet.
 */
const ABSENT_MARKER = '-'

/*
 * Every character a terminal acts on rather than shows, and what each one is replaced with.
 *
 * The range is C0 (`\u0000`-`\u001f`) plus DEL (`\u007f`). Two printed fields — the correlation id
 * and the external ref — are a caller's own text, and the rule that admits them bounds their
 * length and nothing else, so an escape sequence is storable. It is the terminal, not this class,
 * that would act on one: `ESC [ 2 K` clears the line the operator is reading and `ESC [ 1 A`
 * moves the cursor over it, and a carriage return alone is enough to overwrite a row.
 *
 * **A report that can be edited by the data it reports is worse than no report**, and this one is
 * read exactly when the service will not answer and there is nowhere else to look.
 *
 * The marker is visible on purpose. Stripping the character would leave a cell reading as ordinary
 * text, and an operator who cannot see that somebody stored something strange cannot act on it.
 *
 * It is written as two code-point bounds rather than as a regular expression because a regular
 * expression holding a control character is itself refused by this repository's lint, and the
 * comment that would excuse it is refused too.
 */
const CONTROL_CHARACTER_CEILING_CODE_POINT = 0x20
const DELETE_CODE_POINT = 0x7f
const CONTROL_CHARACTER_MARKER = '?'

const LAST_COMPLETED_STEP_SEPARATOR = ':'

const NOTHING_FOUND_TEXT = 'no runs found'
const NOTHING_FOUND_LABEL_SEPARATOR = ': '
const NO_AI_RUN_STEP_TEXT = 'no steps recorded'

const SECOND_COUNT_PER_MINUTE = 60
const MINUTE_COUNT_PER_HOUR = 60
const SECOND_COUNT_PER_HOUR = SECOND_COUNT_PER_MINUTE * MINUTE_COUNT_PER_HOUR
const MILLISECOND_COUNT_PER_SECOND = 1000

const CLOCK_DIGIT_COUNT = 2
const CLOCK_PAD_CHARACTER = '0'

const MILLISECOND_SUFFIX_PATTERN = /\.\d{3}Z$/u
const INSTANT_SUFFIX = 'Z'

/*
 * Every field of a run this reporter prints, in the order it prints them — and, by being the whole
 * of the list, every field it does not.
 *
 * **The order is the order an operator reads in.** Somebody hunting a stalled run scans left to
 * right and stops as soon as the line answers them, so the three columns that answer "is this the
 * one" come first: the run key they will paste into the next command, the status, and how long the
 * run has been in it. Status and elapsed side by side *are* the stall — neither alone is — and a
 * column between them would make the operator's eye travel for a fact they read as one. How far it
 * got follows, because "stuck at the first step" and "stuck at the last" are different incidents.
 * The kind comes next: it is one value this version, so every line reads the same and it would
 * have pushed the two scanning columns to the right for nothing. Then the spend, three narrow
 * numbers read as a block. Then the caller's own two strings, which are what an operator pivots on
 * once they have found the run rather than what they find it by. The accepted instant is last,
 * because the elapsed column has already answered "how long" and it is the widest fixed field
 * there is.
 *
 * **A field reaches a terminal only by being named here and in `#buildAiRunRowCells()`.** That is
 * the whole mechanism keeping the subject label out: it is not omitted by anybody remembering to
 * omit it, it is absent because nothing prints a field this list does not carry. A field added to
 * the row later prints nothing until somebody adds it in both places, which is the safe default —
 * the unsafe one would be a reporter that spread the row and printed whatever it found.
 */
const AI_RUN_COLUMNS = [
  { heading: 'RUN KEY', alignsRight: false },
  { heading: 'STATUS', alignsRight: false },
  { heading: 'ELAPSED', alignsRight: true },
  { heading: 'LAST STEP', alignsRight: false },
  { heading: 'KIND', alignsRight: false },
  { heading: 'CALLS', alignsRight: true },
  { heading: 'IN TOKENS', alignsRight: true },
  { heading: 'OUT TOKENS', alignsRight: true },
  { heading: 'CORRELATION', alignsRight: false },
  { heading: 'EXTERNAL REF', alignsRight: false },
  { heading: 'ACCEPTED', alignsRight: false },
]

/*
 * Every field of a step this reporter prints, under the same rule as the columns above.
 *
 * `rejections` is the column of `ai_run_steps` that is deliberately not here. It holds what a step
 * dropped, it outlives the content purge, and `AiRunResponseBuilder` already keeps it off the
 * client surface; a terminal is a looser place than that surface, not a tighter one.
 */
const AI_RUN_STEP_COLUMNS = [
  { heading: 'STEP', alignsRight: true },
  { heading: 'NAME', alignsRight: false },
  { heading: 'KIND', alignsRight: false },
  { heading: 'OUTCOME', alignsRight: false },
  { heading: 'REASON', alignsRight: false },
  { heading: 'STARTED', alignsRight: false },
  { heading: 'FINISHED', alignsRight: false },
  { heading: 'TOOK', alignsRight: true },
]

/**
 * What an operator reads, out of the runs a command found.
 *
 * **The subject label arrives on every row and reaches no line of output.** `#operator-cli`'s
 * third and fifth acceptance criteria say so, and the reason is a clock. Section 7 counts the
 * subject label as content, so the database gives it thirty days and the retention purge empties
 * it on time. A terminal scrollback, a runbook's captured output and a scheduled task's log have
 * no clock at all: printed once, the label outlives by years the row it was purged from. The
 * label is therefore not something this class remembers not to print — `AI_RUN_COLUMNS` and
 * `#buildAiRunRowCells()` name the eleven fields that are printed, and a field named in neither
 * cannot reach a sink however the row grows.
 *
 * **It writes to a sink and decides nothing else.** No `console`, which this repository's lint
 * refuses along with the directive that would excuse it; no exit status, which belongs to the
 * command that called this; no read of any table, because the rows arrive already built. The sink
 * is anything with a `write()`, defaulting to standard output, so a test collects the text instead
 * of printing it and a caller could as easily hand it a file.
 *
 * **The row it prints is `AiRunPageResponseBuilder#buildAiRunRowResponse()`'s own.** That is the
 * agreed seam: the facts a list row carries are assembled in one place, and a terminal prints the
 * same facts a client reads without a second assembly existing to drift from the first.
 *
 * **Columns are as wide as their widest value and no wider.** A run key is 64 characters where a
 * generator minted it and 16 where a seeder did, so fixed widths would either truncate the one or
 * waste the other. The cost is that two invocations can print differently-aligned tables, which is
 * the right trade for a screen an operator reads rather than a format a program parses — nothing
 * downstream of this consumes the output.
 */
export default class AiRunOperatorReporter {
  /**
   * Constructor.
   *
   * @param {AiRunOperatorReporterParams} params - Parameters.
   */
  constructor ({
    sink,
  }) {
    this.sink = sink
  }

  /**
   * Factory method.
   *
   * @template {X extends typeof AiRunOperatorReporter ? X : never} T, X
   * @param {AiRunOperatorReporterFactoryParams} [params] - Parameters for the factory method.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static create ({
    sink = this.standardOutputSink,
  } = {}) {
    return /** @type {InstanceType<T>} */ (
      new this({
        sink,
      })
    )
  }

  /**
   * get: the stream an operator command writes to when nobody named another.
   *
   * It is reached through a getter rather than named inside a method, so a test hands its own
   * collector in and never has to silence a real terminal.
   *
   * @returns {OperatorReportSink} The sink.
   */
  static get standardOutputSink () {
    return process.stdout
  }

  /**
   * Report the runs a command found, as a table.
   *
   * A command that found none calls `#reportNothingFound()` instead: handed an empty array this
   * writes a header with nothing under it, which is a table of no runs rather than a sentence
   * saying there were none.
   *
   * @param {{
   *   rows: Array<restfulapi.v1.AiRunRowResponse>
   * }} params - Parameters.
   * @returns {void}
   * @public
   */
  reportAiRunRows ({
    rows,
  }) {
    const text = this.buildAiRunRowsText({
      rows,
    })

    this.writeReport({
      text,
    })
  }

  /**
   * Build the table a page of runs reads as.
   *
   * @param {{
   *   rows: Array<restfulapi.v1.AiRunRowResponse>
   * }} params - Parameters.
   * @returns {string} The table, without its closing line break.
   * @public
   */
  buildAiRunRowsText ({
    rows,
  }) {
    const rowsCells = rows.map(it =>
      this.buildAiRunRowCells({
        row: it,
      })
    )

    return this.buildTableText({
      columns: AI_RUN_COLUMNS,
      rowsCells,
    })
  }

  /**
   * Build the cells one run reads as, in the order `AI_RUN_COLUMNS` prints them.
   *
   * **Eleven fields are read off the row by name and the twelfth is not.** `subjectLabel` is on
   * the row and is not read here, and that is the whole of why no line of this reporter's output
   * can carry it. Nothing spreads the row, so a field added to it later arrives here unread.
   *
   * @param {{
   *   row: restfulapi.v1.AiRunRowResponse
   * }} params - Parameters.
   * @returns {Array<string>} The cells.
   * @public
   */
  buildAiRunRowCells ({
    row,
  }) {
    return [
      this.generateTextCell({
        value: row.runKey,
      }),
      this.generateTextCell({
        value: row.statusName,
      }),
      this.generateElapsedText({
        elapsedSeconds: row.elapsedSeconds,
      }),
      this.generateLastCompletedStepText({
        lastCompletedStep: row.lastCompletedStep,
      }),
      this.generateTextCell({
        value: row.runCategoryName,
      }),
      this.generateCountText({
        count: row.modelCallCount,
      }),
      this.generateCountText({
        count: row.inputTokenCount,
      }),
      this.generateCountText({
        count: row.outputTokenCount,
      }),
      this.generateTextCell({
        value: row.correlationId,
      }),
      this.generateTextCell({
        value: row.externalRef,
      }),
      this.generateInstantText({
        instant: row.acceptedAt,
      }),
    ]
  }

  /**
   * Generate what a text field reads as.
   *
   * An empty string is answered as absent rather than as a cell of no width, because a column of
   * invisible values is a column an operator cannot tell apart from a fault in the alignment.
   *
   * **Every control character is replaced before the cell is returned, and this is the one place
   * it happens.** Two of the fields printed here — the correlation id and the external ref — are
   * written by a caller, and the rule that admits them bounds only their length: an escape
   * sequence is storable text. Printed raw into a terminal, `ESC [ 2 K` erases the line the
   * operator is reading and `ESC [ 1 A` puts the next one over the top of it, so a value stored
   * months ago could make this report hide the very row it was run to find. **The operator has no
   * second place to look** — this command exists for the case where the service will not answer —
   * so a report that can be made to lie is worse than no report.
   *
   * The replacement is visible rather than silent: a stripped character would leave a cell that
   * reads as ordinary text, and the operator should be able to tell that somebody stored something
   * strange here.
   *
   * @param {{
   *   value: string | null
   * }} params - Parameters.
   * @returns {string} The cell.
   * @public
   */
  generateTextCell ({
    value,
  }) {
    if (
      this.isAbsentText({
        text: value,
      })
    ) {
      return ABSENT_MARKER
    }

    return [
      ...String(value),
    ]
      .map(character =>
        (this.isControlCharacter({
          character,
        })
          ? CONTROL_CHARACTER_MARKER
          : character)
      )
      .join('')
  }

  /**
   * Check whether one character is one a terminal acts on rather than shows.
   *
   * @param {{
   *   character: string
   * }} params - Parameters.
   * @returns {boolean} true: the terminal would act on it.
   * @public
   */
  isControlCharacter ({
    character,
  }) {
    const codePoint = character.codePointAt(0)

    return codePoint < CONTROL_CHARACTER_CEILING_CODE_POINT
      || codePoint === DELETE_CODE_POINT
  }

  /**
   * Generate how long a run has taken, for somebody reading it rather than parsing it.
   *
   * **Three scales, and the largest two units of whichever it falls in.** `45s` answers a run that
   * has just started, `12m03s` one that is working, and `2h05m` one that stalled before lunch. A
   * run stalled for two hours printed as `7523s` is a figure an operator has to do arithmetic on
   * to feel, which is exactly the feeling the command exists to give them. Seconds are dropped at
   * the hour scale because at that size they are noise, and the minutes and seconds are padded to
   * two digits so the column reads as a clock and not as `2h5m`.
   *
   * **Whole seconds and no decimal, at every scale.** The field it is handed is already whole —
   * `AiRunPageResponseBuilder#generateElapsedSeconds()` floors it — so a decimal would print `.0`
   * on every row of every table. The same format answers a step's duration, so the two durations
   * in one report are read against each other rather than converted first.
   *
   * @param {{
   *   elapsedSeconds: number | null
   * }} params - Parameters.
   * @returns {string} The duration.
   * @public
   */
  generateElapsedText ({
    elapsedSeconds,
  }) {
    if (
      this.isAbsentValue({
        value: elapsedSeconds,
      })
    ) {
      return ABSENT_MARKER
    }

    if (elapsedSeconds < SECOND_COUNT_PER_MINUTE) {
      return this.generateSecondScaleElapsedText({
        elapsedSeconds,
      })
    }

    if (elapsedSeconds < SECOND_COUNT_PER_HOUR) {
      return this.generateMinuteScaleElapsedText({
        elapsedSeconds,
      })
    }

    return this.generateHourScaleElapsedText({
      elapsedSeconds,
    })
  }

  /**
   * Generate a duration under a minute.
   *
   * @param {{
   *   elapsedSeconds: number
   * }} params - Parameters.
   * @returns {string} The duration.
   * @public
   */
  generateSecondScaleElapsedText ({
    elapsedSeconds,
  }) {
    return `${elapsedSeconds}s`
  }

  /**
   * Generate a duration of minutes and seconds.
   *
   * @param {{
   *   elapsedSeconds: number
   * }} params - Parameters.
   * @returns {string} The duration.
   * @public
   */
  generateMinuteScaleElapsedText ({
    elapsedSeconds,
  }) {
    const minuteCount = Math.floor(elapsedSeconds / SECOND_COUNT_PER_MINUTE)
    const secondCount = elapsedSeconds % SECOND_COUNT_PER_MINUTE

    const secondText = this.padClockNumber({
      value: secondCount,
    })

    return `${minuteCount}m${secondText}s`
  }

  /**
   * Generate a duration of hours and minutes.
   *
   * @param {{
   *   elapsedSeconds: number
   * }} params - Parameters.
   * @returns {string} The duration.
   * @public
   */
  generateHourScaleElapsedText ({
    elapsedSeconds,
  }) {
    const hourCount = Math.floor(elapsedSeconds / SECOND_COUNT_PER_HOUR)
    const remainingSecondCount = elapsedSeconds % SECOND_COUNT_PER_HOUR
    const minuteCount = Math.floor(remainingSecondCount / SECOND_COUNT_PER_MINUTE)

    const minuteText = this.padClockNumber({
      value: minuteCount,
    })

    return `${hourCount}h${minuteText}m`
  }

  /**
   * Pad a number to the two digits a clock reads in.
   *
   * @param {{
   *   value: number
   * }} params - Parameters.
   * @returns {string} The padded number.
   * @public
   */
  padClockNumber ({
    value,
  }) {
    return String(value)
      .padStart(CLOCK_DIGIT_COUNT, CLOCK_PAD_CHARACTER)
  }

  /**
   * Generate how far a run got.
   *
   * The index travels with the name because a name alone does not say how much of the run is left:
   * `1:fetch-media` and `5:fetch-media` would read identically, and only one of them is nearly
   * done. A run that has finished no step answers the absent mark, which is the one fact there is
   * about it — it has not got anywhere yet.
   *
   * @param {{
   *   lastCompletedStep: restfulapi.v1.AiRunLastCompletedStepResponse | null
   * }} params - Parameters.
   * @returns {string} The step.
   * @public
   */
  generateLastCompletedStepText ({
    lastCompletedStep,
  }) {
    if (
      this.isAbsentValue({
        value: lastCompletedStep,
      })
    ) {
      return ABSENT_MARKER
    }

    return [
      lastCompletedStep.stepIndex,
      lastCompletedStep.stepName,
    ].join(LAST_COMPLETED_STEP_SEPARATOR)
  }

  /**
   * Generate what a count reads as.
   *
   * Zero is printed as zero and never as the absent mark: a run that called no model spent nothing,
   * which is a fact about the run, where the mark would say the figure was never recorded.
   *
   * @param {{
   *   count: number | null
   * }} params - Parameters.
   * @returns {string} The count.
   * @public
   */
  generateCountText ({
    count,
  }) {
    if (
      this.isAbsentValue({
        value: count,
      })
    ) {
      return ABSENT_MARKER
    }

    return String(count)
  }

  /**
   * Generate what an instant reads as.
   *
   * ISO-8601 in UTC, without the milliseconds. The milliseconds are dropped because no decision an
   * operator makes from this output turns on them, and because three digits on every instant of
   * every line is width paid on every row. The zone marker is kept: an instant an operator pastes
   * into a ticket has to say which clock it was read on.
   *
   * @param {{
   *   instant: Date | null
   * }} params - Parameters.
   * @returns {string} The instant.
   * @public
   */
  generateInstantText ({
    instant,
  }) {
    if (
      this.isAbsentValue({
        value: instant,
      })
    ) {
      return ABSENT_MARKER
    }

    return instant.toISOString()
      .replace(MILLISECOND_SUFFIX_PATTERN, INSTANT_SUFFIX)
  }

  /**
   * Report one run and the steps it has recorded, the steps in their own order beneath it.
   *
   * The run is printed as the very same table a list prints, header included, so an operator
   * reading one run and an operator reading a page of them read the same columns in the same
   * places — and so a detail pasted into a ticket beside a list row lines up with it.
   *
   * @param {{
   *   row: restfulapi.v1.AiRunRowResponse
   *   steps: Array<*>
   * }} params - Parameters.
   * @returns {void}
   * @public
   */
  reportAiRunDetail ({
    row,
    steps,
  }) {
    const text = this.buildAiRunDetailText({
      row,
      steps,
    })

    this.writeReport({
      text,
    })
  }

  /**
   * Build the two blocks one run reads as.
   *
   * @param {{
   *   row: restfulapi.v1.AiRunRowResponse
   *   steps: Array<*>
   * }} params - Parameters.
   * @returns {string} The blocks, without the closing line break.
   * @public
   */
  buildAiRunDetailText ({
    row,
    steps,
  }) {
    const aiRunText = this.buildAiRunRowsText({
      rows: [
        row,
      ],
    })

    const aiRunStepsText = this.buildAiRunStepsText({
      steps,
    })

    return [
      aiRunText,
      aiRunStepsText,
    ].join(SECTION_BREAK)
  }

  /**
   * Build the table a run's steps read as.
   *
   * A run with no step recorded says so in a sentence. A header with nothing under it would leave
   * an operator working out whether the run has not started or the command failed to read.
   *
   * @param {{
   *   steps: Array<*>
   * }} params - Parameters.
   * @returns {string} The table, or the sentence that stands in for it.
   * @public
   */
  buildAiRunStepsText ({
    steps,
  }) {
    if (steps.length === 0) {
      return NO_AI_RUN_STEP_TEXT
    }

    const orderedSteps = this.sortAiRunSteps({
      steps,
    })

    const rowsCells = orderedSteps.map(it =>
      this.buildAiRunStepCells({
        aiRunStep: it,
      })
    )

    return this.buildTableText({
      columns: AI_RUN_STEP_COLUMNS,
      rowsCells,
    })
  }

  /**
   * Sort steps into the order their run ran them in.
   *
   * The order is this reporter's to impose rather than the caller's to promise: a step trace read
   * without an `order` comes back in whatever order the engine chose, and a trace printed out of
   * order is worse than one not printed, because it reads as a run that did its work backwards.
   * The array is copied before sorting, so the caller's own is left as it handed it over.
   *
   * @param {{
   *   steps: Array<*>
   * }} params - Parameters.
   * @returns {Array<*>} The steps, in order.
   * @public
   */
  sortAiRunSteps ({
    steps,
  }) {
    return steps
      .toSorted((first, second) => first.stepIndex - second.stepIndex)
  }

  /**
   * Build the cells one step reads as, in the order `AI_RUN_STEP_COLUMNS` prints them.
   *
   * **The step is the row `AiRunOperatorFinder#findOrderedAiRunSteps()` read**, and not the step of
   * the client's step trace. The two carry the same facts under two shapes — the read row holds its
   * category as the association it was included with, where the trace holds it as a name already
   * flattened onto the step. Seven fields are read off it by name, and `rejections` is not among
   * them; the finder does not select that column at all, so this list is the second of two locks
   * rather than the only one.
   *
   * @param {{
   *   aiRunStep: *
   * }} params - Parameters.
   * @returns {Array<string>} The cells.
   * @public
   */
  buildAiRunStepCells ({
    aiRunStep,
  }) {
    const stepCategoryName = this.extractAiRunStepCategoryName({
      aiRunStep,
    })

    return [
      this.generateCountText({
        count: aiRunStep.stepIndex,
      }),
      this.generateTextCell({
        value: aiRunStep.stepName,
      }),
      this.generateTextCell({
        value: stepCategoryName,
      }),
      this.generateTextCell({
        value: aiRunStep.outcomeCode,
      }),
      this.generateTextCell({
        value: aiRunStep.reasonCode,
      }),
      this.generateInstantText({
        instant: aiRunStep.startedAt,
      }),
      this.generateInstantText({
        instant: aiRunStep.finishedAt,
      }),
      this.generateDurationText({
        startedAt: aiRunStep.startedAt,
        finishedAt: aiRunStep.finishedAt,
      }),
    ]
  }

  /**
   * Extract what a step's category is called.
   *
   * It is read off the association the finder included rather than off a field of the step itself,
   * which is how `AiRunResponseBuilder#buildAiRunStepResponse()` reads the same value. A step read
   * without that association answers null and prints the absent mark, so a caller that forgot the
   * `include` loses one column rather than the whole report.
   *
   * @param {{
   *   aiRunStep: *
   * }} params - Parameters.
   * @returns {string | null} The name, or null where no category came back with the step.
   * @public
   */
  extractAiRunStepCategoryName ({
    aiRunStep,
  }) {
    return aiRunStep.AiRunStepCategory?.name
      ?? null
  }

  /**
   * Generate how long a step took.
   *
   * A step that has not finished has no duration, and answers the absent mark rather than a figure
   * measured against the moment the command happened to run — the run's own elapsed column already
   * says how long the thing has been going.
   *
   * It is the same whole-second format the run's elapsed column uses, so the slowest of six steps
   * is found by reading down a column rather than by converting two notations. A step timed to the
   * tenth is a profiling question, and the two instants either side of this column answer it
   * exactly.
   *
   * @param {{
   *   startedAt: Date | null
   *   finishedAt: Date | null
   * }} params - Parameters.
   * @returns {string} The duration.
   * @public
   */
  generateDurationText ({
    startedAt,
    finishedAt,
  }) {
    if (
      this.isAbsentValue({
        value: startedAt,
      })
    ) {
      return ABSENT_MARKER
    }

    if (
      this.isAbsentValue({
        value: finishedAt,
      })
    ) {
      return ABSENT_MARKER
    }

    const elapsedMillisecondCount = finishedAt.getTime() - startedAt.getTime()
    const elapsedSeconds = Math.floor(elapsedMillisecondCount / MILLISECOND_COUNT_PER_SECOND)

    return this.generateElapsedText({
      elapsedSeconds,
    })
  }

  /**
   * Report that a command found nothing, and what it was looking for.
   *
   * The label is the caller's description of the question it asked, and it is carried because the
   * answer is only useful with the question beside it: an operator reading `no runs found` in a
   * scheduled task's log a week later cannot tell a healthy night from a command that asked the
   * wrong thing.
   *
   * @param {{
   *   label: string | null
   * }} params - Parameters.
   * @returns {void}
   * @public
   */
  reportNothingFound ({
    label,
  }) {
    const text = this.buildNothingFoundText({
      label,
    })

    this.writeReport({
      text,
    })
  }

  /**
   * Build the sentence an empty answer reads as.
   *
   * @param {{
   *   label: string | null
   * }} params - Parameters.
   * @returns {string} The sentence.
   * @public
   */
  buildNothingFoundText ({
    label,
  }) {
    if (
      this.isAbsentText({
        text: label,
      })
    ) {
      return NOTHING_FOUND_TEXT
    }

    return [
      NOTHING_FOUND_TEXT,
      label,
    ].join(NOTHING_FOUND_LABEL_SEPARATOR)
  }

  /**
   * Build a table out of its headings and its already-formatted cells.
   *
   * The headings are the first row of the table rather than a line built apart from it, which is
   * what makes a heading count towards its own column's width — a column of one-character values
   * under a twelve-character heading lines up because the heading was measured with them.
   *
   * @param {{
   *   columns: Array<OperatorReportColumn>
   *   rowsCells: Array<Array<string>>
   * }} params - Parameters.
   * @returns {string} The table, without its closing line break.
   * @public
   */
  buildTableText ({
    columns,
    rowsCells,
  }) {
    const headingCells = this.buildHeadingCells({
      columns,
    })

    const allRowsCells = [
      headingCells,
      ...rowsCells,
    ]

    const columnWidths = this.generateColumnWidths({
      allRowsCells,
    })

    return allRowsCells
      .map(it =>
        this.buildTableRowText({
          cells: it,
          columns,
          columnWidths,
        })
      )
      .join(LINE_BREAK)
  }

  /**
   * Build the cells the heading row reads as.
   *
   * @param {{
   *   columns: Array<OperatorReportColumn>
   * }} params - Parameters.
   * @returns {Array<string>} The cells.
   * @public
   */
  buildHeadingCells ({
    columns,
  }) {
    return columns.map(it => it.heading)
  }

  /**
   * Generate how wide each column has to be to hold everything in it.
   *
   * @param {{
   *   allRowsCells: Array<Array<string>>
   * }} params - Parameters.
   * @returns {Array<number>} The widths.
   * @public
   */
  generateColumnWidths ({
    allRowsCells,
  }) {
    const [
      headingCells,
    ] = allRowsCells

    return headingCells.map((headingCell, index) =>
      Math.max(
        ...allRowsCells.map(cells => cells[index].length)
      )
    )
  }

  /**
   * Build the line one row of a table reads as.
   *
   * The end of the line is trimmed, so a short value in the final column leaves no trailing spaces
   * behind it — invisible on a screen, and noise in a file somebody redirected the output into.
   *
   * @param {{
   *   cells: Array<string>
   *   columns: Array<OperatorReportColumn>
   *   columnWidths: Array<number>
   * }} params - Parameters.
   * @returns {string} The line.
   * @public
   */
  buildTableRowText ({
    cells,
    columns,
    columnWidths,
  }) {
    return cells
      .map((cell, index) =>
        this.padCell({
          text: cell,
          width: columnWidths[index],
          alignsRight: columns[index].alignsRight,
        })
      )
      .join(COLUMN_GAP)
      .trimEnd()
  }

  /**
   * Pad one cell to its column's width.
   *
   * A column of numbers is padded on the left, so that the units line up under one another and a
   * figure of five digits is seen to be larger than one of two without either being read. A column
   * of text is padded on the right, where the eye finds the start of every value in one place.
   *
   * @param {{
   *   text: string
   *   width: number
   *   alignsRight: boolean
   * }} params - Parameters.
   * @returns {string} The padded cell.
   * @public
   */
  padCell ({
    text,
    width,
    alignsRight,
  }) {
    if (alignsRight) {
      return text.padStart(width)
    }

    return text.padEnd(width)
  }

  /**
   * Check whether a value is one the run has not got to yet.
   *
   * @param {{
   *   value: *
   * }} params - Parameters.
   * @returns {boolean} true: there is nothing there.
   * @public
   */
  isAbsentValue ({
    value,
  }) {
    return value === null
      || typeof value === 'undefined'
  }

  /**
   * Check whether a text is one there is nothing of.
   *
   * @param {{
   *   text: string | null
   * }} params - Parameters.
   * @returns {boolean} true: there is nothing there.
   * @public
   */
  isAbsentText ({
    text,
  }) {
    if (
      this.isAbsentValue({
        value: text,
      })
    ) {
      return true
    }

    return text === ''
  }

  /**
   * Write a report, and close it with a line break.
   *
   * One write per report, and the line break belongs to the report rather than to its last line: a
   * caller that redirects the output gets a file ending in a newline, and a terminal gets its
   * prompt back on a line of its own.
   *
   * @param {{
   *   text: string
   * }} params - Parameters.
   * @returns {void}
   * @public
   */
  writeReport ({
    text,
  }) {
    this.sink.write(`${text}${LINE_BREAK}`)
  }
}

/**
 * @typedef {{
 *   sink: OperatorReportSink
 * }} AiRunOperatorReporterParams
 */

/**
 * @typedef {Partial<AiRunOperatorReporterParams>} AiRunOperatorReporterFactoryParams
 */

/**
 * Anything a report can be written to. Duck-typed on the one method a report needs, so standard
 * output, a file stream and a test collector are the same thing to this class.
 *
 * @typedef {{
 *   write: (text: string) => *
 * }} OperatorReportSink
 */

/**
 * One column of a report: what it is called, and which side its values are padded on.
 *
 * @typedef {{
 *   heading: string
 *   alignsRight: boolean
 * }} OperatorReportColumn
 */

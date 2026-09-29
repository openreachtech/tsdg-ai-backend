/*
 * Imports define the run order for this category; add each new test in its correct position.
 *
 * Both files reword a seeded instruction row and read the sink it appends to, and they expect the
 * sink to hold the generations they themselves wrote and nothing else. They touch different tables,
 * so their order between them does not matter — but a category that reads the seeded wording of an
 * agent has to run before this one, because after it the live rows no longer carry that wording.
 */
import './AiAgentDefaultInstruction.js'
import './AiAgentRoleInstruction.js'

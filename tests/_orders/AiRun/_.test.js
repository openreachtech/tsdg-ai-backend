/*
 * Imports define the run order for this category; add each new test in its correct position.
 *
 * `AiRunAcceptor` writes rows of its own and reads none the renderer leaves behind, so it runs
 * first and the renderer's own writes cannot change what it sees.
 */
import './AiRunAcceptor.js'
import './BaseAiRunPostRenderer.js'

/*
 * Imports define the run order for this category; add each new test in its correct position.
 *
 * One file so far, and its position states nothing. `ProviderUploadedFileRecorder` creates every
 * run and every medium it stands on, in `#media-fetch`'s own id block, and borrows none - so it
 * depends on nothing in this folder having run before it, and leaves nothing another file here
 * would read.
 */
import './ProviderUploadedFileRecorder.js'

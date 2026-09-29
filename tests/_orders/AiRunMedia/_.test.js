/*
 * Imports define the run order for this category; add each new test in its correct position.
 *
 * Four files, and the order between them states nothing, which is a fact worth writing rather
 * than an omission. Each creates every run and every medium it stands on and borrows none, and
 * the four write in three id blocks that cannot meet - `#media-fetch`'s own for the first,
 * `#asset-media-extraction`'s `1061` sub-block for the two that orchestrate it, and that feature's
 * `1062` sub-block for the upload. So none depends on another having run, and none leaves a row
 * another would read.
 *
 * That is only true while it is true. A file added here that borrows a row rather than creating
 * one has to say where it sits and why.
 */
import './ProviderUploadedFileRecorder.js'
import './AiRunMediaCollector.js'
import './AiRunMediaRecorder.js'
import './AiRunMediaProviderUploader.js'

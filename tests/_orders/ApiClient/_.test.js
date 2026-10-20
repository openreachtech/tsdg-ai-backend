/*
 * Imports define the run order for this category; add each new test in its correct position.
 *
 * Both files register clients of their own and read only what they wrote, so neither depends on a
 * seeded row and nothing depends on the rows they leave. Rotation comes second because it
 * registers through the registrar above it: a registration that broke should fail where it is
 * written rather than as a rotation that could not find its fixture.
 */
import './ApiClientRegistrar.js'
import './ApiClientSecretRotator.js'

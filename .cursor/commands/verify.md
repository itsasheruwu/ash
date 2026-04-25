# Verify and de-slop

## Verify

Discover how this **project** (not any particular toolchain) expects to be checked: project docs, automation configs, and conventional entrypoints for “build,” “test,” “lint,” or “check.” Prefer a single documented or scripted pipeline if one exists.

Run that pipeline from the project root yourself and fix failures until it is clean or you hit a hard blocker you clearly explain.

## De-slop

Remove **unused** and **low-signal** code and assets: dead paths, redundant layering, noisy comments, and anything that does not serve real behavior. **Do not** change what the product actually does; keep checks passing. Keep changes **minimal and targeted**.

## Confirm

Run the same verification again and give a short summary of what ran and what you removed or simplified.

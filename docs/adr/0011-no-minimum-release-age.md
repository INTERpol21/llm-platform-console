# 11. No minimum release age on npm dependencies

Date: 2026-07-20

## Status

Accepted.

## Context

pnpm 11 enables `minimumReleaseAge` by default: a 24-hour quarantine on every
package version, refusing to install anything published within the last day.

It exists because npm account takeovers are a live attack pattern — an attacker
publishes a malicious version of a legitimate package and it is typically
detected and unpublished within hours. A waiting period means a project never
pulls the compromised window.

It also blocks ordinary work. Bumping TypeScript, Node types and Radix in one
change pulled 28 same-day releases, and every image build failed for a day —
including CI, which cannot simply be waited out on a shared runner.

## Decision

Disable it: `minimumReleaseAge: 0` in `pnpm-workspace.yaml`.

Set explicitly in the workspace config rather than passed as a flag in the
Dockerfiles, so the choice is visible in one place and reviewable, instead of
being buried in a build argument where it reads as an accident.

## Consequences

We accept the supply-chain window this reopens. A dependency compromised in the
hours after publication can now be installed before it is caught.

What still stands between us and that:

- `pnpm-lock.yaml` is committed, so builds are reproducible and no version
  changes without a reviewed diff.
- Dependabot PRs are reviewed rather than auto-merged.
- CI runs `pip-audit`, `bandit` and CodeQL; Trivy image scanning is on the
  roadmap and would partly cover this.

What this does **not** protect against: a malicious version that a human
approves because the diff looks routine. Lockfile review is the real control
here, and it is weaker than a time delay against a well-disguised payload.

Reinstating a shorter window (`minimumReleaseAge: 60`, in minutes) is a
one-line change and recovers most of the value with far less friction, if the
trade-off is revisited.

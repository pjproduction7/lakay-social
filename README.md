# lakay-social
A social platform built for the Haitian community, featuring chat rooms, opinions, voting, and community engagement.

[![CI](https://github.com/pjproduction7/lakay-social/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/pjproduction7/lakay-social/actions/workflows/ci.yml) [![PR Coverage](https://github.com/pjproduction7/lakay-social/actions/workflows/pr-coverage.yml/badge.svg?branch=main)](https://github.com/pjproduction7/lakay-social/actions/workflows/pr-coverage.yml) [![Health Monitor](https://github.com/pjproduction7/lakay-social/actions/workflows/railway-health-monitor.yml/badge.svg?branch=main)](https://github.com/pjproduction7/lakay-social/actions/workflows/railway-health-monitor.yml) [![codecov](https://codecov.io/gh/pjproduction7/lakay-social/branch/main/graph/badge.svg)](https://codecov.io/gh/pjproduction7/lakay-social)

## Requirements

- Node.js >= 20 (development, build, and CI require Node 20 or newer). We run CI using Node 20 — use nvm or your preferred version manager to switch:

```bash
# with nvm
nvm install 20
nvm use 20
```

## CI & Coverage Status

- Coverage is uploaded to Codecov when `CODECOV_TOKEN` is configured in the repository secrets.

- Add a `CODECOV_TOKEN` secret to your repository settings (Settings → Secrets & variables → Actions → New repository secret).

- Once Codecov is set up, add this badge to your README (replace `<OWNER>` and `<REPO>` with your GitHub repository owner and name):

  ```markdown
  [![codecov](https://codecov.io/gh/<OWNER>/<REPO>/branch/main/graph/badge.svg?token=${{ secrets.CODECOV_TOKEN }})](https://codecov.io/gh/<OWNER>/<REPO>)
  ```

- The CI also uploads an HTML coverage report artifact (`coverage/lcov-report`) after tests run; you can download it from the workflow run artifacts in GitHub Actions.

## Enforcing PR Coverage (branch protection)

To require the PR Coverage check to pass before merging into `main`:

1. Go to the repository Settings → Branches → Add rule (or edit the `main` rule).
2. Under "Protect matching branches" enable **Require status checks to pass before merging**.
3. Search for and select the `PR Coverage` check (it appears as the workflow check name).
4. Save the rule.


Optional (CLI):

- With the GitHub CLI and admin rights you can require the check with:

  ```bash
  gh api --method PATCH repos/:owner/:repo/branches/main/protection -f required_status_checks='{"strict":true,"contexts":["pr-coverage"]}'
  ```

This ensures pull requests cannot be merged unless the `PR Coverage` job passes.



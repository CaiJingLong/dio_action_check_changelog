# README

Check dio changelog for pull request

## Usage

```yaml
jobs:
  check-changelog:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: cfug/dio_action_check_changelog@main
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          ignore-comment-regexp: 'Exempt CHANGELOG changes: .+' # optional
```

## What does this action do?

If pull request don't change `CHANGELOG.md`, CI will fail.

Or, if the pull request comments contains `Exempt CHANGELOG changes: xxx` write by project owner or collaborator(have write permission), CI will pass.

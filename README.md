# setup-bats-action

A GitHub Action to install [BATS (Bash Automated Testing System)](https://github.com/bats-core/bats-core) in a workflow.

## Usage

```yaml
- uses: sgerrand/setup-bats-action@v1
  with:
    version: '1.11.0'
```

### Inputs

| Input     | Description                                                                                                                                               | Default               |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| `version` | BATS version to install. Accepts with or without a leading `v` prefix (e.g. `1.11.0` or `v1.11.0`). Use `latest` to auto-resolve the most recent release. | `latest`              |
| `token`   | GitHub token for API calls when resolving `latest`.                                                                                                       | `${{ github.token }}` |

### Outputs

| Output    | Description                                                |
| --------- | ---------------------------------------------------------- |
| `version` | Installed BATS version without leading `v` (e.g. `1.13.0`) |

## Examples

### Install the latest release

```yaml
steps:
  - uses: actions/checkout@v6
  - uses: sgerrand/setup-bats-action@v1
  - run: bats tests/
```

### Pin to a specific version

```yaml
steps:
  - uses: actions/checkout@v6
  - uses: sgerrand/setup-bats-action@v1
    with:
      version: '1.11.0'
  - run: bats tests/
```

### Use the resolved version in later steps

```yaml
steps:
  - uses: actions/checkout@v6
  - id: bats
    uses: sgerrand/setup-bats-action@v1
  - run: echo "Running BATS ${{ steps.bats.outputs.version }}"
  - run: bats tests/
```

## License

[BSD 2-Clause](LICENSE)

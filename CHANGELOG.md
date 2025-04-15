# @juun-roh/cesium-utils

## 0.0.4

### Patch Changes

- a3c5724: Update Configurations

  build: Update build configurations

  - Fix entries for modular supports.

- 988e1c2: Restructure project

  refactor: Restructure project

- 5fb3f07: Restructure entries

  refactor: Restructure entries

  - Fix entries (index files)
    Use named exports instead of wildcard exports (`*`).
    Avoid import from index entries.
    Clarify `type` exports.

- a1fcd36: Shorten codes

  refactor: Shorten expressions with nullish coalescing operator

- 74cbd2b: Rewrite require-import tests

  test: Update import-require tests

  - Restructure test paths.
  - Now test every exports from this package.

## 0.0.3

### Patch Changes

- 34aa9b3: Refactor and Restructure

  refactor: Refactor and restructure

  - Refactor `Collection` class.
    Now the `Collection` class is not abstract.
    A class does not need further implementation should use the class directly.

  - Restructure organization of `utils` directory.
    Add several depths.

- ac3767a: Documentation Updates

  docs: Fix documentation

  - Add description for `getTileDataAvailable`.

  - Fix annotation for terrain bounds documentation.

  - Fix `clean` script
    Now the script does not clean up the `docs` directory.

- b1c552e: Update tsconfig

  ci: Update husky git hooks

  - Build script executes before test

  build: Add paths option for tsconfig

## 0.0.2

### Patch Changes

- 12f022e: Fixed workflow tests

  ci: Fix workflows

  - Remove deploy-docs actions.

  - Integrate GitHub Page deployment into release-and-publish action.
    Test required.

## 0.0.1

### Patch Changes

- 3ce50f0: Initial Release

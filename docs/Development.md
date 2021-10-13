# Development

## Setup

- Install `node` (>= v14) on your CLI.
- Clone this repository to wherever you'd like to develop.
- Enter the repository directory and run `npm install`

## Building

This project uses webpack to build SCSS, compile JS and so forth.

- You can produce a production build (for release) using `npm run build`.
- You can produce a development build (for testing) using `npm run build:dev`. This will recompile as you make changes.


These will go into `dist/` by default, but you can create a file called `.foundryconfig.json` to configure the result.

### .foundryconfig.json

```json
{
  "systemName": "torchbearer",
  "dataPath": "PATH/TO/FoundryVtt"
}
```

If this file exists, it can be used to specify where FoundryVTT is so that dev builds go directly to your FoundryVTT
systems folder rather than `dist/`.

## File structure:

- `src/`
  - JS and SCSS files which are part of the module and should be compiled
  - Treat this directory as if it doesn't exist in the final generated code, so for instance `src/foo.js` can see
    `docs/Development.md` as `./docs/Development.md`.
- `static/`
  - Files which should be copied as-is to the build folder.
  - Like with `src/`, this directory vanishes upon building and should not be included in relative paths.
- `system.json`
  - This file tells FoundryVTT what this system is and how to get it.

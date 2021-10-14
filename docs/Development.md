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

## File structure

- `src/`
  - JS and SCSS files which are part of the module and should be compiled
  - Treat this directory as if it doesn't exist in the final generated code, so for instance `src/foo.js` can see
    `docs/Development.md` as `./docs/Development.md`.
- `static/`
  - Files which should be copied as-is to the build folder.
  - Like with `src/`, this directory vanishes upon building and should not be included in relative paths.
- `system.json`
  - This file tells FoundryVTT what this system is and how to get it.

## Creating a release

This is currently a manual process:

Let's say the last release was `1.1.0` and you want to create release `1.2.0`:

- Update `system.json` by replacing every instance of `1.1.0` with `1.2.0`, as well as the package version in
  `package.json`.
- Update `CHANGELOG.md` to include an overview of what you changed.
- Create and merge a PR.
- Create a new tag on master for the commit you merged using your new version (e.g. `1.2.0`).
- Pull master and run `npm run build` to get a production build in `dist/`.
- `mv dist/ torchbearer/; zip -r torchbearer-foundryvtt-1.1.0.zip torchbearer; rm -r torchbearer` (replacing `1.1.0`
  with your release number).
- Create a new release on github and upload the created zip file.

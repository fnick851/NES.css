# NES.css fork (fnick851/NES.css)

Personal fork of the dormant nostalgic-css/NES.css (last upstream release 2.3.0, Dec 2019; upstream is not expected to revive — treat `develop` here as the source of truth). Its only consumer is the portfolio at `~/workspace/others/portfolio`, which vendors the built `css/nes.min.css`. Not published to npm.

## Build

`npm run build` (Node >= 20) → `css/nes.css`, `css/nes.min.css` + `nes-core` variants. The whole pipeline is `scripts/build.js`: dart-sass via its JS API (the custom Sass functions `build-data()` and `get-file-as-data-uri()` are implemented inside build.js) → Lightning CSS for vendor prefixes and minification, targets from the `browserslist` field.

The build must stay **warning-free**. A new Sass deprecation warning is a bug to fix immediately, not noise — deprecations here become hard breaks at the next Sass major.

Never reintroduce:
- `node-sass` (dead, replaced by `sass`/dart-sass)
- `@import` in SCSS (deprecated; this tree is fully migrated to `@use`/`@forward`)
- `autoprefixer`/`clean-css-cli` (Lightning CSS replaced both)
- the Storybook 5 toolchain (`story/` and `docs/` sources remain, but their tooling was removed from package.json; modernize deliberately or delete, don't half-restore)

## Conventions

- Version scheme `2.3.0-fork.N`: bump N for any style-affecting change, in BOTH `package.json` and the header comment of `scss/nes-core.scss`. The build stamps that header (plus branch/commit) into the CSS — it is how the portfolio identifies what it is serving.
- Fixes so far, kept as cautionary examples: added a `:focus-visible` ring on `.nes-btn` (upstream zeroed focus outlines); removed a 2018 Chrome media-hack that forced `border-image-repeat: space`, which modern Chrome renders as dashed borders. Lesson: old browser workarounds rot. Before "fixing" a rendering artifact, reproduce it on the upstream docs site (nostalgic-css.github.io/NES.css) in the same browser to learn whether it is upstream breakage or local.

## Syncing to the portfolio

1. `npm run build`
2. `cp css/nes.min.css ~/workspace/others/portfolio/css/nes.min.css`
3. Verify per the portfolio's CLAUDE.md: run its `./check.sh`, then serve and inspect in a browser. Balloons are the canary component — their borders must be solid pixel lines (not dashes) and tails clean steps.

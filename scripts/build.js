#!/usr/bin/env node
/**
 * Modern build pipeline for the NES.css fork.
 *
 * dart-sass (compile, custom functions) -> Lightning CSS (vendor prefixes
 * from browserslist targets + minification). Replaces the original
 * node-sass / autoprefixer / clean-css-cli toolchain, which no longer runs
 * on current Node.
 *
 * Outputs, matching the original artifact layout:
 *   css/nes.css, css/nes.min.css, css/nes-core.css, css/nes-core.min.css
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const sass = require('sass');
const browserslist = require('browserslist');
const { transform, browserslistToTargets } = require('lightningcss');

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'css');

// Port of scripts/getBuildData.js (git-rev-sync replaced with plain git).
function getBuildData() {
  let branch = '';
  let commit = '';
  try {
    branch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: ROOT }).toString().trim();
    commit = execSync('git rev-parse HEAD', { cwd: ROOT }).toString().trim();
  } catch (e) {
    return '';
  }
  if (branch === 'master') return '';
  return `\n  Build Date: ${new Date().toISOString()}\n  Node Version: ${process.version}\n  Branch: ${branch}\n  Commit: ${commit}`;
}

// Port of scripts/getFileAsDataURI.js (file-type dependency replaced with an
// extension map; only ever used for the two cursor PNGs).
const MIME_TYPES = { '.png': 'image/png', '.gif': 'image/gif', '.svg': 'image/svg+xml' };
function getFileAsDataURI(fileString) {
  const filepath = path.resolve(__dirname, fileString);
  const mime = MIME_TYPES[path.extname(filepath).toLowerCase()];
  if (!mime) throw new Error(`No MIME type registered for ${filepath}`);
  return `data:${mime};base64,${fs.readFileSync(filepath).toString('base64')}`;
}

const sassFunctions = {
  'build-data()': () => new sass.SassString(getBuildData(), { quotes: false }),
  'get-file-as-data-uri($filepath)': (args) =>
    new sass.SassString(getFileAsDataURI(args[0].assertString('filepath').text), {
      quotes: false,
    }),
};

const targets = browserslistToTargets(browserslist(undefined, { path: ROOT }));

function build(entry, outBase) {
  const compiled = sass.compile(path.join(ROOT, 'scss', entry), {
    style: 'expanded',
    loadPaths: [path.join(ROOT, 'scss')],
    functions: sassFunctions,
  });

  const pretty = transform({
    filename: `${outBase}.css`,
    code: Buffer.from(compiled.css),
    targets,
    minify: false,
  });
  const min = transform({
    filename: `${outBase}.min.css`,
    code: Buffer.from(compiled.css),
    targets,
    minify: true,
  });

  fs.writeFileSync(path.join(OUT_DIR, `${outBase}.css`), pretty.code);
  fs.writeFileSync(path.join(OUT_DIR, `${outBase}.min.css`), min.code);
  console.log(
    `${outBase}: ${compiled.css.length} bytes compiled, ${min.code.length} bytes minified`
  );
}

fs.rmSync(OUT_DIR, { recursive: true, force: true });
fs.mkdirSync(OUT_DIR, { recursive: true });
build('nes.scss', 'nes');
build('nes-core.scss', 'nes-core');

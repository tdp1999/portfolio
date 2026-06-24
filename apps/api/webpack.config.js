const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const { join, isAbsolute } = require('path');

// `@phuong-tran-redoc/document-engine-core` ships as ESM (`"type":"module"`) with no
// `exports` map and Node-incompatible extensionless directory imports in its own
// source (e.g. `export * from './constants'`). Node's strict ESM loader rejects those
// at runtime (ERR_UNSUPPORTED_DIR_IMPORT), so the default "externalize everything"
// build can't run it. We bundle just this one package — webpack's resolver handles the
// directory imports — and keep every other dependency external. Its own deps
// (`@tiptap/*`, happy-dom) are Node-resolvable and stay external (the runtime Node
// version supports `require()` of their ESM).
const BUNDLED_ESM_PACKAGE = '@phuong-tran-redoc/document-engine-core';

function externalsExceptDocumentEngine({ request }, callback) {
  if (!request) return callback();
  if (
    // The broken-ESM package (and any subpath import) — the whole point of this config.
    request === BUNDLED_ESM_PACKAGE ||
    request.startsWith(`${BUNDLED_ESM_PACKAGE}/`) ||
    // Workspace libs are tsconfig path aliases (`@portfolio/*` → lib source), NOT real
    // node_modules packages, so they must be bundled — Nx's default nodeExternals
    // allowlists them and we have to preserve that or Node can't resolve them at runtime.
    request.startsWith('@portfolio/') ||
    // Relative / absolute requests are part of the bundle.
    request.startsWith('.') ||
    isAbsolute(request)
  ) {
    return callback();
  }
  // Everything else is a real node_modules package or node built-in → stays external
  // (identical to the default Node-target build, which only ever bundled `@portfolio/*`).
  return callback(null, `commonjs ${request}`);
}

module.exports = {
  output: {
    path: join(__dirname, '../../dist/apps/api'),
    clean: true,
    ...(process.env.NODE_ENV !== 'production' && {
      devtoolModuleFilenameTemplate: '[absolute-resource-path]',
    }),
  },
  // Our own externals fn replaces Nx's blanket nodeExternals (externalDependencies:
  // 'none' stops Nx adding its own); generatePackageJson still derives runtime deps
  // from the Nx project graph, so the dist package.json is unaffected.
  externals: [externalsExceptDocumentEngine],
  plugins: [
    new NxAppWebpackPlugin({
      target: 'node',
      compiler: 'tsc',
      main: './src/main.ts',
      tsConfig: './tsconfig.app.json',
      assets: ['./src/assets'],
      optimization: false,
      outputHashing: 'none',
      generatePackageJson: true,
      mergeExternals: true,
      externalDependencies: 'none',
      sourceMap: true,
    }),
  ],
};

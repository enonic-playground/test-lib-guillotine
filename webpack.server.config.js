// const {print} = require('q-i');
const path = require('path');
const glob = require('glob');
const R = require('ramda');
const {ProvidePlugin} = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const {
  setEntriesForPath,
  addRule,
  addPlugin,
  prependExtensions
} = require('./util/compose');
const env = require('./util/env');

const NODE_MODULES_CONTEXT = path.resolve(__dirname, 'node_modules');
const RESOURCES_PATH = 'src/main/resources';

// ----------------------------------------------------------------------------
// Base config
// ----------------------------------------------------------------------------

const config = {
  context: path.join(__dirname, RESOURCES_PATH),
  entry: {},
  externals: [
	/^\//i
  ],
  output: {
    path: path.join(__dirname, '/build/resources/main'),
    filename: '[name].js',
    libraryTarget: 'commonjs'
  },
  resolve: {
    extensions: [],
	// fallback: {
	// 	"buffer": require.resolve("buffer/") // Bad polyfill contains ** operator
	// }
  },
  optimization: {
	minimize: false, // DEBUG
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: false,
          },
          keep_classnames: true,
          keep_fnames: true,
        }
      }),
    ],
    splitChunks: {
      minSize: 30000,
    },
  },
  mode: env.type,
  // Source maps are not usable in server scripts
  devtool: false,
  plugins: [
	new CopyWebpackPlugin({
		patterns: [
			{ context: NODE_MODULES_CONTEXT, from: 'graphiql/graphiql.min.css*', to: 'webapp/static/graphiql/[name][ext]' },
			{ context: NODE_MODULES_CONTEXT, from: 'react/umd/react.*.js', to: 'webapp/static/react/[name][ext]' },
			{ context: NODE_MODULES_CONTEXT, from: 'react-dom/umd/react-dom.*.js', to: 'webapp/static/react-dom/[name][ext]' },
		]
	}),
	// new ProvidePlugin({
	// 	Buffer: ['buffer', 'Buffer'] // Bad polyfill contains ** operator
	// }),
  ]
};

// ----------------------------------------------------------------------------
// JavaScript loaders
// ----------------------------------------------------------------------------

function listEntries(extensions, ignoreList) {
  const CLIENT_FILES = glob.sync(`${RESOURCES_PATH}/assets/**/*.${extensions}`);
  const STATIC_FILES = glob.sync(`${RESOURCES_PATH}/webapp/static/**/*.${extensions}`);
  const IGNORED_FILES = R.pipe(
    R.map(entry => path.join(RESOURCES_PATH, entry)),
    R.concat(CLIENT_FILES),
	R.concat(STATIC_FILES)
  )(ignoreList);
  const SERVER_FILES = glob.sync(`${RESOURCES_PATH}/**/*.${extensions}`, { absolute: false, ignore: IGNORED_FILES });
  return SERVER_FILES.map(entry => path.relative(RESOURCES_PATH, entry));
}

// TYPESCRIPT
// function addTypeScriptSupport(cfg) {
//   const rule = {
//     test: /\.ts$/,
//     exclude: /node_modules/,
//     loader: 'ts-loader',
//     options: {
//       configFile: 'src/main/resources/tsconfig.server.json',
//     }
//   };

//   const entries = listEntries('ts', [
//     // Add additional files to the ignore list.
//     // The following path will be transformed to 'src/main/resources/types.ts:
//     'types.ts'
//   ]).filter(entry => entry.indexOf('.d.ts') === -1);

//   return R.pipe(
//     setEntriesForPath(entries),
//     addRule(rule),
//     addPlugin(new ProvidePlugin({
//       'Object.assign': [path.join(__dirname, RESOURCES_PATH, 'polyfills'), 'assign']
//     })),
//     prependExtensions(['.ts', '.json'])
//   )(cfg);
// }

// BABEL
// function addBabelSupport(cfg) {
//   const rule = {
//     test: /\.(es6?|js)$/,
//     exclude: /node_modules/,
//     loader: 'babel-loader',
//     options: {
//       babelrc: false,
//       plugins: [],
//       presets: [
//         [
//           '@babel/preset-env',
//           {
//             // Use custom Browserslist config
//             targets: 'node 0.10',
//             // Polyfills are not required in runtime
//             useBuiltIns: false
//           },
//         ],
//       ]
//     }
//   };

//   const entries = listEntries('{js,es,es6}', []);

//   return R.pipe(
//     setEntriesForPath(entries),
//     addRule(rule),
//     prependExtensions(['.js', '.es', '.es6', '.json'])
//   )(cfg);
// }

// SWC (instead of typescript and babel)
function addSWC(cfg) {
	const rule = {
		test: /\.([ejt]s6?)?$/,
		use: {
		loader: 'swc-loader',
		options: {
			jsc: {
				parser: {
					// decorators: true,
					syntax: 'typescript'
				}
			},
			module: {
			type: 'commonjs'
			},
			// sync: true, // Run syncronously to get correct error messages
		}
		},
		exclude: /node_modules/,
	}
	const entries = listEntries('{ts,js,es,es6}',[])
		.filter(entry => entry.indexOf('.d.ts') === -1);
	return R.pipe(
		setEntriesForPath(entries),
		addRule(rule),
		prependExtensions(['.ts', '.js', '.es', '.es6', '.json'])
	)(cfg);
}

// ----------------------------------------------------------------------------
// Result config
// ----------------------------------------------------------------------------

module.exports = R.pipe(
//	addBabelSupport,
//	addTypeScriptSupport
	addSWC
)(config);
// print(module.exports, { maxItems: Infinity });

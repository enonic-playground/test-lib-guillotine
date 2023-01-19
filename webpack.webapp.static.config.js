const {print} = require('q-i');
const glob = require('glob');
const path = require('path');
const webpack = require('webpack');
const R = require('ramda');
const TerserPlugin = require('terser-webpack-plugin');
const {
  addRule,
  prependExtensions,
  setEntriesForPath
} = require('./util/compose');
const env = require('./util/env');
const RESOURCES_PATH = 'src/main/resources';
const isProd = env.prod;

// ----------------------------------------------------------------------------
// Base config
// ----------------------------------------------------------------------------

const config = {
	context: path.join(__dirname, '/src/main/resources/webapp/static'),
	// entry: {},
	externals: {
		react: 'React',
		'react-dom': 'ReactDOM'
	},
	output: {
		path: path.join(__dirname, '/build/resources/main/webapp/static'),
		// filename: isProd ? '[name].[contenthash].esm.js' : '[name].esm.js',
		filename: '[name].esm.js',
		library: 'Lib[name]',
		libraryTarget: 'var',
	},
	resolve: {
		extensions: [
			'.js', '.json' // Needed to resolve inside node_modules
		],
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
				},
			}),
		],
		// splitChunks: {
		// 	minChunks: 999999
		// 	// minSize: 30000,
		// },
	},
	mode: env.type,
	devtool: isProd ? false : 'inline-source-map',
	plugins: [
		new webpack.optimize.LimitChunkCountPlugin({
			maxChunks: 1
		})
	]
}

function listEntries(extensions, ignoreList) {
	// const CLIENT_FILES = glob.sync(`${RESOURCES_PATH}/assets/**/*.${extensions}`);
	const IGNORED_FILES = R.pipe(
		R.map(entry => path.join(`${RESOURCES_PATH}/webapp/static`, entry)),
		//   R.concat(CLIENT_FILES)
		)(ignoreList);
	const STATIC_FILES = glob.sync(
		`${RESOURCES_PATH}/webapp/static/**/*.${extensions}`,
		{ absolute: false, ignore: IGNORED_FILES }
	);
	//const SERVER_FILES = glob.sync(`${RESOURCES_PATH}/**/*.${extensions}`, { absolute: false, ignore: IGNORED_FILES });
	return STATIC_FILES.map(entry => path.relative(`${RESOURCES_PATH}/webapp/static`, entry));
}

// ----------------------------------------------------------------------------
// JavaScript loaders
// ----------------------------------------------------------------------------

// TYPESCRIPT
// function addTypeScriptSupport(cfg) {
//   const rule = {
//     test: /\.tsx?$/,
//     exclude: /node_modules/,
//     loader: 'ts-loader',
//     options: {
//       configFile: 'src/main/resources/assets/tsconfig.client.json',
//     }
//   };

//   return R.pipe(
//     setEntry('ts/bundle', './ts/main.ts'),
//     addRule(rule),
//     prependExtensions(['.tsx', '.ts', '.json'])
//   )(cfg);
// }

// BABEL
// function addBabelSupport(cfg) {
//   const rule = {
//     test: /\.jsx?$/,
//     exclude: /node_modules/,
//     loader: 'babel-loader',
//     options: {
//       babelrc: false,
//       plugins: [],
//       presets: [
//         [
//           '@babel/preset-env',
//           {
//             // false means polyfill not required runtime
//             useBuiltIns: false
//           },
//         ],
//       ]
//     }
//   };

//   return R.pipe(
//     setEntry('js/bundle', './js/main.es6'),
//     addRule(rule),
//     prependExtensions(['es6', '.jsx', '.js', '.json'])
//   )(cfg);
// }

// SWC (instead of typescript and babel)
function addSWC(cfg) {
	const rule = {
		test: /\.([jt]sx?)?$/,
		use: {
		loader: 'swc-loader',
		options: {
			// env: {
			// 	mode: 'entry'
			// },
			jsc: {
				parser: {
					// decorators: true,
					dynamicImport: false,
					syntax: 'typescript',
					tsx: true,
				}
			},
			minify: false,
			// module: {
			// 	type: 'nodenext'
			// },
			// sync: true, // Run syncronously to get correct error messages
		}
		},
		exclude: /node_modules/,
	}
	const entries = listEntries('{tsx,ts,jsx}',[])
		.filter(entry => entry.indexOf('.d.ts') === -1);
	return R.pipe(
		setEntriesForPath(entries),
		addRule(rule),
		prependExtensions(['.tsx', '.ts', '.jsx'])
	)(cfg);
}


// ----------------------------------------------------------------------------
// Result config
// ----------------------------------------------------------------------------

module.exports = R.pipe(
	// addBabelSupport,
	// addTypeScriptSupport,
	addSWC,
)(config);
print(module.exports, { maxItems: Infinity });

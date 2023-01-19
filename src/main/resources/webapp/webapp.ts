import type { Enonic } from '@enonic/js-utils/src/types/Request';


import { toStr } from '@enonic/js-utils';
// import serialize from 'serialize-javascript';
//@ts-ignore
import { execute } from '/lib/graphql';
//@ts-ignore
import { createSchema } from '/lib/guillotine';
//@ts-ignore
import Router from '/lib/router';
//@ts-ignore
import {buildGetter} from '/lib/enonic/static';
import { run } from '/lib/xp/context';


type AssetRequest = Enonic.Xp.Http.Request<string,{},{},{},{
	libRouterPath: string
}>

const PROJECT_ID = app.name.replace('com.enonic.app.', '').replace(/\./g, '-');
const REPO_ID = `com.enonic.cms.${PROJECT_ID}`;
const BRANCH_ID = 'master';
const ID_REACT_CONTAINER = 'react-container';

const getStatic = buildGetter({
	root: 'webapp/static',
	getCleanPath: (request: AssetRequest) => request.pathParams?.libRouterPath
});
const router = Router();

let schema = createSchema();

router.get(
	'/static/{libRouterPath:.+}',
	// [
	// 	'/static/?',
	// 	'/static/{libRouterPath:.+}',
	// ],
	(request: AssetRequest) => {
		// log.info('asset request:%s', toStr(request));
		return getStatic(request);
	}
);


router.get('/?', (request: Enonic.Xp.Http.Request) => {
	// log.info('get request:%s', toStr(request));
	const {path, rawPath, url} = request;

	// In order to ensure that the relative urls below work,
	// webapp root without a trailing slash is redirected to the same address WITH a slash:
	if (!(rawPath || '').endsWith('/')) {
		return {
			redirect: path + '/'
		};
	}

	const propsObj = {
		url
	};
	/*
	*/
	return {
		body: `<html>
	<head>
		<meta name="robots" content="noindex,nofollow">
		<script type="text/javascript" src="./static/react/react.development.js"></script>
		<script type="text/javascript" src="./static/react-dom/react-dom.development.js"></script>
		<link rel="stylesheet" type="text/css" href="./static/graphiql/graphiql.min.css">
		<title>GraphiQL</title>
	</head>
	<body>
		<div id="${ID_REACT_CONTAINER}"/>
		<script type="text/javascript" src="./static/App.esm.js"></script>
		<script type='module' defer>
			const propsObj = eval(${JSON.stringify(propsObj)});
			//console.debug('propsObj', propsObj);
			const root = ReactDOM.createRoot(document.getElementById('${ID_REACT_CONTAINER}'));
			root.render(React.createElement(window.LibApp.App, propsObj));
		</script>
	</body>
</html>`,
		contentType: 'text/html; charset=utf-8',
	};
});


router.post('/?', (request: Enonic.Xp.Http.Request) => {
	// log.info('post request:%s', toStr(request));
	const {
		query,
		variables
	} = JSON.parse(request.body as string);
	// log.info('query:%s', toStr(query));
	// log.info('variables:%s', toStr(variables));
	const context = {};
	const res = run({
		repository: REPO_ID,
		branch: BRANCH_ID,
		principals: ['role:system.admin']
	}, () => {
		return execute(schema, query, variables, context);
	});
	return {
		contentType: 'application/json',
		body: JSON.stringify(res)
	};
});


export const all = (request: Enonic.Xp.Http.Request) => router.dispatch(request);

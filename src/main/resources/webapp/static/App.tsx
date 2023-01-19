import { createGraphiQLFetcher } from '@graphiql/toolkit';
import { GraphiQL } from 'graphiql';
// import * as React from 'react';


export function App({
	url
}: {
	url: string
}) {
	const fetcher = createGraphiQLFetcher({
		url
	});

	return <GraphiQL fetcher={fetcher}/>
}

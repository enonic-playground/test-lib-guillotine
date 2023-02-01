import { toStr } from '@enonic/js-utils';
import fde from 'fast-deep-equal';
//@ts-ignore
import { execute } from '/lib/graphql';
const Diff = require('diff');


export function testAggregations({
	aLocalTime,
	anotherLocalTime,
	gqlSchema,

}: {
	aLocalTime: string
	anotherLocalTime: string
	gqlSchema: unknown
}) {
	try {
		const query = `{
	guillotine {
		queryDslConnection(
			aggregations: [
				{name: "countPrice", count: {field: "data.price"}},
				{name: "minPrice", min: {field: "data.price"}},
				{name: "maxPrice", max: {field: "data.price"}},
				{name: "range", range: {
					field: "data.price"
					ranges: [{
						key: "positivePrices"
						from: 0
					},{
						key: "negativePrices"
						to: 0
					}]
				}},
				{
					name: "type", subAggregations: [
						{name: "priceStats", stats: {field: "data.price"}}
					],
					terms: {field: "type"}
				},
				{
					name: "dateHistogram"
					dateHistogram: {
						field: "_ts"
						interval: "1M"
						minDocCount: 0
						format: "MM-yyy"
					}
				},
				{
					name: "dateRange",
					dateRange: {
						field: "_ts"
						format: "MM-yyy"
						ranges: [{
							key: "pre23"
							to: "01-2023"
						},{
							key: "2023toEternity"
							from: "01-2023"
						}]
					}
				},
				{
					name: "geoDistance"
					geoDistance: {
						field: "data.location"
						origin: {
							lat: "59.91273"
							lon: "10.74609"
						}
						unit: "km" # Should be enum in the future
						ranges: [{
							key: "under100km"
							to: 100
						},{
							key: "above100km"
							from: 100
						}]
					}
				}
			]
			query: {fulltext: {fields: ["_allText", "displayName"], query: "folder", operator: OR}}
		) {
			aggregationsAsJson
			edges {
				node {
					_path
					dataAsJson
					type
				}
			}
		}
	}
}`
		const expected = {
			data:{
				guillotine: {
					queryDslConnection: {
						aggregationsAsJson: {
							countPrice: {
								value: 2
							},
							geoDistance: {
								buckets: [{
									key: 'under100km',
									docCount: 1
								},{
									key: 'above100km',
									docCount: 1
								}]
							},
							dateRange: {
								buckets: [{
									key: 'pre23',
									docCount: 0,
									to: '2023-01-01T00:00:00Z'
								},{
									key: '2023toEternity',
									docCount: 2,
									from: '2023-01-01T00:00:00Z'
								}]
							},
							minPrice: {
								value: -0.1
							},
							dateHistogram: {
								buckets: [{
									key: '02-2023',
									docCount: 2
								}]
							},
							range: {
								buckets: [{
									key: 'negativePrices',
									docCount: 1,
									from: null,
									to: 0
								},{
									key: 'positivePrices',
									docCount: 1,
									from: 0,
									to: null
								}]
							},
							maxPrice: {
								value: 1
							},
							type: {
								buckets: [{
									key: 'com.enonic.app.test.lib.guillotine:test',
									docCount: 2,
									priceStats: {
										count: 2,
										min: -0.1,
										max: 1,
										avg: 0.45,
										sum: 0.9
									}
								}]
							}
						}, // aggregationsAsJson
						edges: [{
							node: {
								_path: '/folder',
								dataAsJson: {
									location: '59.91273,10.74609',
									price: 1,
									timewithouttimezone: aLocalTime
								},
								type: 'com.enonic.app.test.lib.guillotine:test'
							}
						},{
							node: {
								_path: '/folder/subFolder',
								dataAsJson: {
									location: '60.39299,5.32415',
									price: -0.1,
									timewithouttimezone: anotherLocalTime
								},
								type: 'com.enonic.app.test.lib.guillotine:test'
							}
						}] // edges
					}, // queryDslConnection
				} // guillotine
			} // data
		};
		const actual = execute(gqlSchema, query, {}, {});
		const boolEqual = fde(
			// stringify -> parse needed to avoid diff on date objs
			JSON.parse(JSON.stringify(expected)),
			JSON.parse(JSON.stringify(actual)),
		);
		log.info('aggregations:%s', boolEqual);
		if (!boolEqual) {
			log.info('actual:%s', toStr(actual));
			// log.info('diff:%s', toStr(detailedDiff(expected, actual)));
			log.info('diff:%s', toStr(Diff.diffJson(expected, actual)));
		}
	} catch (e) {
		log.error(`e.class.name:${toStr(e.class.name)} e.message:${toStr(e.message)}`, e);
	} // try/catch
}

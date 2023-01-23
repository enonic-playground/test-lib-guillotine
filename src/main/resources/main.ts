import { toStr } from '@enonic/js-utils';
// import {detailedDiff} from 'deep-object-diff';
import fde from 'fast-deep-equal';
//@ts-ignore
import { execute } from '/lib/graphql';
// import HumanDiff from 'human-object-diff';
const Diff = require('diff');
//@ts-ignore
import { createSchema as createGqlSchema} from '/lib/guillotine';
// import {
// 	createVirtualApplication,
// 	// get as getApp,
// 	getApplicationMode,
// 	// list as listApps
// } from '/lib/xp/app';
import { create as createContent } from '/lib/xp/content';
import { run } from '/lib/xp/context';
import {
	create as createProject,
	delete as deleteProject
} from '/lib/xp/project';
// import {
// 	createSchema,
// 	listSchemas,
// } from '/lib/xp/schema';
import { executeFunction } from '/lib/xp/task';

// const { diff: detailedDiff } = new HumanDiff({
// 	objectName: 'graph'
// });

const PROJECT_ID = app.name.replace('com.enonic.app.', '').replace(/\./g, '-');
const REPO_ID = `com.enonic.cms.${PROJECT_ID}` as const;
const BRANCH_ID = 'draft';
// const APP_KEY_VIRTUAL = `${app.name}.virtual` as const;
const APP_KEY = app.name;
const CONTENT_TYPE = `${APP_KEY}:test` as const;


const gqlSchema = createGqlSchema();


function task() {
	run({
		repository: 'system-repo',
		branch: 'master',
		principals: [
			'role:cms.admin',
			'role:system.admin',
		]
	}, () => {
		// try {
		// 	const vApp = createVirtualApplication({
		// 		key: APP_KEY_VIRTUAL
		// 	});
		// 	log.info('vApp:%s', toStr(vApp));
		// } catch (e) {
		// 	if (e.class.name !== 'com.enonic.xp.node.NodeAlreadyExistAtPathException') {
		// 		log.error(`e.class.name:${toStr(e.class.name)} e.message:${toStr(e.message)}`, e);
		// 	}
		// } // try/catch

		// const applicationMode = getApplicationMode({
		// 	key: APP_KEY_VIRTUAL
		// });
		// log.info('applicationMode:%s', applicationMode); // virtual | bundled | augmented

		// const appInfo = getApp({
		// 	key: APP_KEY_VIRTUAL
		// });
		// log.info('appInfo:%s', toStr(appInfo)); // Doesn't contain applicationMode

		// const apps = listApps();
		// log.info('apps:%s', toStr(apps)); // long list

// 		try {
// 			const createdSchema = createSchema({
// 				name: CONTENT_TYPE,
// 				type: 'CONTENT_TYPE',
// 				resource: `<content-type>
// 	<description>Test description</description>
// 	<display-name>Test displayName</display-name>
// 	<super-type>base:structured</super-type>
// 	<is-abstract>false</is-abstract>
// 	<is-final>true</is-final>
// 	<is-built-in>false</is-built-in>
// 	<allow-child-content>true</allow-child-content>
// 	<form>
// 		<input name="location" type="GeoPoint">
// 			<label>Location</label>
// 			<occurrences minimum="1" maximum="1"/>
// 		</input>
// 		<input name="price" type="Double">
// 			<label>Price</label>
// 			<occurrences minimum="0" maximum="1"/>
// 		</input>
// 	</form>
// </content-type>`,
// 			});
// 			log.info('createdSchema:%s', createdSchema);
// 		} catch (e) {
// 			if (e.class.name !== 'com.enonic.xp.node.NodeAlreadyExistAtPathException') {
// 				log.error(`e.class.name:${toStr(e.class.name)} e.message:${toStr(e.message)}`, e);
// 			}
// 		} // try/catch

// 		const schemas = listSchemas({
// 			application: APP_KEY_VIRTUAL,
// 			type: 'CONTENT_TYPE'
// 		});
// 		log.info('schemas:%s', schemas);

		try {
			deleteProject({
				id: PROJECT_ID,
			});
		} catch (e) {
				log.error(`e.class.name:${toStr(e.class.name)} e.message:${toStr(e.message)}`, e);
		} // try/catch
		try {
			createProject({
				displayName: 'Test Lib Guillotine',
				id: PROJECT_ID,
				readAccess: {
					public: true
				},
				siteConfig: {},
			});
		} catch (e) {
			if (e.class.name !== 'com.enonic.xp.core.impl.project.ProjectAlreadyExistsException') {
				log.error(`e.class.name:${toStr(e.class.name)} e.message:${toStr(e.message)}`, e);
			}
		} // try/catch
	}); // run

	run({
		repository: REPO_ID,
		branch: BRANCH_ID,
		principals: ['role:system.admin']
	}, () => {
		let folderId: string;
		try {
			folderId = createContent({
				//childOrder: '',
				contentType: CONTENT_TYPE,
				data: {
					location: '59.91273, 10.74609', // Oslo
					price: 1
				},
				displayName: 'My Folder',
				name: 'folder',
				language: 'en',
				parentPath: '/', //  e.class.name:"com.enonic.xp.node.NodeNotFoundException" e.message:"Cannot create node with name folder, parent '/content' not found"
				// parentPath: '/content',
				// refresh: true,
				// requireValid: true,
				// x: {
				// 	[app.name]: {
				// 		xPropertyName: 'xPropertyValue'
				// 	}
				// }
			})._id;
		} catch (e) {
			if (e.class.name !== 'com.enonic.xp.content.ContentAlreadyExistsException') {
				log.error(`e.class.name:${toStr(e.class.name)} e.message:${toStr(e.message)}`, e);
			}
		} // try/catch

		let subFolderId: string;
		try {
			subFolderId = createContent({
				contentType: CONTENT_TYPE,
				data: {
					location: '60.39299, 5.32415', // Bergen
					price: -0.1
				},
				displayName: 'My Sub Folder',
				name: 'subFolder',
				language: 'no',
				parentPath: '/folder',
			})._id;
		} catch (e) {
			if (e.class.name !== 'com.enonic.xp.content.ContentAlreadyExistsException') {
				log.error(`e.class.name:${toStr(e.class.name)} e.message:${toStr(e.message)}`, e);
			}
		} // try/catch

		const variables = {};
		const context = {};
		try {
			const query = `{
	guillotine {
		queryDsl(
			first: 1
			query: {
				matchAll: {
					boost: 1
				}
			}
			sort: {
				field: "_name"
				direction: ASC
			}
		) {
			_path
		}
		queryDslConnection(
			first: 1
			query: {
				matchAll: {
					boost: 1
				}
			}
			sort: {
				field: "_name"
				direction: ASC
			}
		) {
			totalCount
			pageInfo {
				startCursor
				endCursor
				hasNext
			}
			aggregationsAsJson
			highlightAsJson
			edges {
				node {
					_path
				}
			}
		}
		queryOffsetSortDesc: queryDsl(
			offset: 1
			query: {
				matchAll: {}
			}
			sort: {
				field: "_name"
				direction: DESC
			}
		) {
			_path
		}
		queryFulltext: queryDsl(
			query: {
				fulltext: {
					fields: "_allText"
					query: "folder"
					operator: OR
				}
			}
		) {
			_path
		}
		queryNgram: queryDsl(
			query: {
				ngram: {
					fields: "_allText"
					query: "fol"
					operator: OR
				}
			}
		) {
			_path
		}
		queryStemmedEn: queryDsl(
			query: {
				stemmed: {
					fields: "_allText"
					query: "folders"
					operator: OR
					language: "en"
				}
			}
		) {
			_path
		}
		queryStemmedNo: queryDsl(
			query: {
				stemmed: {
					fields: "_allText"
					query: "folders"
					operator: OR
					language: "no"
				}
			}
		) {
			_path
		}
		highlightStemmed: queryDslConnection(
			highlight: {
				encoder: default
				fragmenter: span # span is default
				fragmentSize: 100 # 100 is default
				noMatchSize: 0 # 0 is default
				numberOfFragments: 5 # 5 is default
				order: none # none is default
				postTag: "</em>" # "</em>" is default
				preTag: "<em>" # "<em>" is default
				properties: [
					{propertyName: "_alltext"},
					{propertyName: "_path"},
					{propertyName: "displayName"}
				],
				requireFieldMatch: false
				# tagsSchema: styled
			}
			query: {
			boolean: {
				should: [
						{fulltext: {fields: ["_allText", "displayName"], query: "folder", operator: OR}},
						{stemmed: {fields: ["_allText", "displayName"], query: "folder", operator: OR, language: "en"}},
						{stemmed: {fields: ["_allText", "displayName"], query: "folder", operator: OR, language: "no"}}
					]
				}
			}
		) {
			highlightAsJson
			edges {
				node {
					_path
					language
				}
			}
		}
		agg: queryDslConnection(
			aggregations: [
				{name: "language", terms: {field: "language"}},
				{
					name: "type",
					subAggregations: {name: "typeLanguage", terms: {field: "language"}}
					terms: {field: "type"}
				}
			]
			query: {fulltext: {fields: ["_allText", "displayName"], query: "folder", operator: OR}}
		) {
			aggregationsAsJson
		}
	}
}`
			const actual = execute(gqlSchema, query, variables, context);
			// log.info('actual:%s', actual);
			const expected = {
				data:{
					guillotine: {
						queryDsl: [{
							_path: '/folder'
						}],
						queryDslConnection: {
							totalCount: 2,
							pageInfo: {
								startCursor: 'MA==',
								endCursor: 'MA==',
								hasNext: true
							},
							aggregationsAsJson: {},
							highlightAsJson: {},
							edges: [{
								node: {
									_path: '/folder'
								}
							}]
						},
						queryOffsetSortDesc: [{
							_path: '/folder'
						}],
						queryFulltext: [{
							_path: '/folder'
						},{
							_path: '/folder/subFolder'
						}],
						queryNgram: [{
							_path: '/folder'
						},{
							_path: '/folder/subFolder'
						}],
						queryStemmedEn: [{
							_path: '/folder'
						}],
						queryStemmedNo: [{
							_path: '/folder/subFolder'
						}],
						highlightStemmed: {
							highlightAsJson: {
								[folderId]: {
									_alltext: [
										'<em>folder</em>',
										'My <em>Folder</em>'
									],
									_path: [
										'<em>/content/folder</em>'
									],
									'_alltext._stemmed_en': [
										'<em>folder</em>',
										'My <em>Folder</em>'
									],
									displayname: [
										'My <em>Folder</em>'
									]
								},
								[subFolderId]: {
									_alltext: [
										'My Sub <em>Folder</em>'
									],
									_path: [
										'<em>/content/folder/subFolder</em>'
									],
									'_alltext._stemmed_no': [
										'My Sub <em>Folder</em>'
									],
									displayname: [
										'My Sub <em>Folder</em>'
									]
								}
							},
							edges: [{
								node: {
									_path: '/folder',
									language: 'en'
								}
							},{
								node: {
									_path: '/folder/subFolder',
									language: 'no'
								}
							}]
						},
						agg: {
							aggregationsAsJson: {
								language: {
									buckets: [{
										key: 'en',
										docCount: 1
									},{
										key: 'no',
										docCount: 1
									}]
								},
								type: {
									buckets: [{
										key: CONTENT_TYPE,
										docCount: 2,
										typeLanguage: {
											buckets: [{
												key: 'en',
												docCount: 1
											},{
												key: 'no',
												docCount: 1
											}]
										}
									}]
								}
							}
						}
					}
				}
			};
			const boolEqual = fde(expected, actual);
			log.info('boolEqual:%s', boolEqual);
			if (!boolEqual) {
				// log.info('diff:%s', toStr(detailedDiff(expected, actual)));
				log.info('diff:%s', toStr(Diff.diffJson(expected, actual)));
			}
		} catch (e) {
			log.error(`e.class.name:${toStr(e.class.name)} e.message:${toStr(e.message)}`, e);
		} // try/catch

		try {
			const query = `{
	guillotine {
		highlightStemmedOpposite: queryDslConnection(
			highlight: {
				encoder: html
				fragmenter: simple # span is default
				fragmentSize: 1 # 100 is default
				noMatchSize: 100 # 0 is default
				numberOfFragments: 1 # 5 is default, 0 means infinite?
				order: score # none is default
				postTag: "</b>" # "</em>" is default
				preTag: "<b>" # "<em>" is default
				properties: [
					{propertyName: "_alltext"},
					{propertyName: "_path"},
					{propertyName: "_state"},
					{propertyName: "displayName"}
				],
				requireFieldMatch: false
				tagsSchema: styled
			}
			query: {
			boolean: {
				should: [
						{fulltext: {fields: ["_allText", "displayName"], query: "folder", operator: OR}},
						{stemmed: {fields: ["_allText", "displayName"], query: "folder", operator: OR, language: "en"}},
						{stemmed: {fields: ["_allText", "displayName"], query: "folder", operator: OR, language: "no"}}
					]
				}
			}
		) {
			highlightAsJson
			edges {
				node {
					_path
					language
				}
			}
		}
	}
}`
			const actual = execute(gqlSchema, query, variables, context);
			// log.info('actual:%s', actual);
			const expected = {
				data:{
					guillotine: {
						highlightStemmedOpposite: {
							highlightAsJson: {
								[folderId]: {
									_alltext: [
										'<b>folder</b>'
									],
									_path: [
										'<b>&#x2F;content&#x2F;folder</b>'
									],
									_state: [
										'default'
									],
									'_alltext._stemmed_en': [
										'<b>folder</b>'
									],
									displayname: [
										' <b>Folder</b>'
									]
								},
								[subFolderId]: {
									_alltext: [
										' <b>Folder</b>'
									],
									_path: [
										'<b>&#x2F;content&#x2F;folder&#x2F;subFolder</b>'
									],
									_state: [
										'default'
									],
									'_alltext._stemmed_no': [
										' <b>Folder</b>'
									],
									displayname: [
										' <b>Folder</b>'
									]
								}
							},
							edges: [{
								node: {
									_path: '/folder',
									language: 'en'
								}
							},{
								node: {
									_path: '/folder/subFolder',
									language: 'no'
								}
							}]
						},
					}
				}
			};
			const boolEqual = fde(expected, actual);
			log.info('boolEqual:%s', boolEqual);
			if (!boolEqual) {
				// log.info('diff:%s', toStr(detailedDiff(expected, actual)));
				log.info('diff:%s', toStr(Diff.diffJson(expected, actual)));
			}
		} catch (e) {
			log.error(`e.class.name:${toStr(e.class.name)} e.message:${toStr(e.message)}`, e);
		} // try/catch

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
						# key: "positivePrices"
						from: 0
					},{
						# key: "negativePrices"
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
							# key: "pre23"
							to: "01-2023"
						},{
							# key: "2023toEternity"
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
						# key: "under100km"
						to: 100
						},{
						# key: "above100km"
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
										key: '*-100.0',
										docCount: 1
									},{
										key: '100.0-*',
										docCount: 1
									}]
								},
								dateRange: {
									buckets: [{
										key: '*-01-2023',
										docCount: 0,
										to: '2023-01-01T00:00:00Z'
									},{
										key: '01-2023-*',
										docCount: 2,
										from: '2023-01-01T00:00:00Z'
									}]
								},
								minPrice: {
									value: -0.1
								},
								dateHistogram: {
									buckets: [{
										key: '01-2023',
										docCount: 2
									}]
								},
								range: {
									buckets: [{
										key: '*-0.0',
										docCount: 1,
										from: null,
										to: 0
									},{
										key: '0.0-*',
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
										price: 1
									},
									type: 'com.enonic.app.test.lib.guillotine:test'
								}
							},{
								node: {
									_path: '/folder/subFolder',
									dataAsJson: {
										location: '60.39299,5.32415',
										price: -0.1
									},
									type: 'com.enonic.app.test.lib.guillotine:test'
								}
							}] // edges
						}, // queryDslConnection
					} // guillotine
				} // data
			};
			const actual = execute(gqlSchema, query, variables, context);
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

		try {
			const query = `{
	guillotine {
		minimumMatch0: queryDsl(
			query: {pathMatch: {field: "_path", path: "/content/folder/subFolder", minimumMatch: 0, boost: 1.1}}
		) {
			_path
		}
		minimumMatch1: queryDsl(
			query: {pathMatch: {field: "_path", path: "/content/folder/subFolder", minimumMatch: 1, boost: 1.1}}
		) {
			_path
		}
		minimumMatch2: queryDsl(
			query: {pathMatch: {field: "_path", path: "/content/folder/subFolder", minimumMatch: 2, boost: 1.1}}
		) {
			_path
		}
		minimumMatch3: queryDsl(
			query: {pathMatch: {field: "_path", path: "/content/folder/subFolder", minimumMatch: 3, boost: 1.1}}
		) {
			_path
		}
	}
}`
			const expected = {
				data:{
					guillotine: {
						minimumMatch0: [{
							_path: '/folder/subFolder',
						},{
							_path: '/folder',
						}],
						minimumMatch1: [{
							_path: '/folder/subFolder',
						},{
							_path: '/folder',
						}],
						minimumMatch2: [{
							_path: '/folder/subFolder',
						},{
							_path: '/folder',
						}],
						minimumMatch3: []
					} // guillotine
				} // data
			};
			const actual = execute(gqlSchema, query, variables, context);
			const boolEqual = fde(
				JSON.parse(JSON.stringify(expected)),
				JSON.parse(JSON.stringify(actual)),
			);
			log.info('patchMatch:%s', boolEqual);
			if (!boolEqual) {
				log.info('actual:%s', toStr(actual));
				// log.info('diff:%s', toStr(detailedDiff(expected, actual)));
				log.info('diff:%s', toStr(Diff.diffJson(expected, actual)));
			}
		} catch (e) {
			log.error(`e.class.name:${toStr(e.class.name)} e.message:${toStr(e.message)}`, e);
		} // try/catch

	}); // run
} // task


executeFunction({
	description: '',
	func: task,
});

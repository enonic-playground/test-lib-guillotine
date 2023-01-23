import { toStr } from '@enonic/js-utils';
// import {detailedDiff} from 'deep-object-diff';
import fde from 'fast-deep-equal';
//@ts-ignore
import { execute } from '/lib/graphql';
// import HumanDiff from 'human-object-diff';
const Diff = require('diff');
//@ts-ignore
import { createSchema } from '/lib/guillotine';
import { create as createContent } from '/lib/xp/content';
import { run } from '/lib/xp/context';
import {
	create as createProject,
	delete as deleteProject
} from '/lib/xp/project';
import { executeFunction } from '/lib/xp/task';

// const { diff: detailedDiff } = new HumanDiff({
// 	objectName: 'graph'
// });

const PROJECT_ID = app.name.replace('com.enonic.app.', '').replace(/\./g, '-');
const REPO_ID = `com.enonic.cms.${PROJECT_ID}`;
const BRANCH_ID = 'draft';


const schema = createSchema();


function task() {
	run({
		repository: 'system-repo',
		branch: 'master',
		principals: [
			'role:cms.admin',
			'role:system.admin',
		]
	}, () => {
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
				contentType: 'base:folder',
				data: { // e.class.name:"java.lang.NullPointerException" e.message:"data cannot be null"
					// propertyName: 'propertyValue' //  e.class.name:"java.lang.IllegalArgumentException" e.message:"No mapping defined for property propertyName with value propertyValue"
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
				contentType: 'base:folder',
				data: {},
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

		try {
			const query = `{
	guillotine {
		queryDsl(
			first: 1
			query: {
				matchAll: {}
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
				matchAll: {}
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
				properties: [
					{propertyName: "_alltext"},
					{propertyName: "_path"},
					{propertyName: "displayName"}
				],
				requireFieldMatch: false
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
			const variables = {};
			const context = {};
			const actual = execute(schema, query, variables, context);
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
	}); // run
} // task


executeFunction({
	description: '',
	func: task,
});

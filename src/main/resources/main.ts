import { toStr } from '@enonic/js-utils';
import { create as createContent } from '/lib/xp/content';
import { run } from '/lib/xp/context';
import { create as createProject } from '/lib/xp/project';
import { executeFunction } from '/lib/xp/task';


const PROJECT_ID = app.name.replace('com.enonic.app.', '').replace(/\./g, '-');
const REPO_ID = `com.enonic.cms.${PROJECT_ID}`;
const BRANCH_ID = 'master';


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

		try {
			createContent({
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
			});
		} catch (e) {
			if (e.class.name !== 'com.enonic.xp.content.ContentAlreadyExistsException') {
				log.error(`e.class.name:${toStr(e.class.name)} e.message:${toStr(e.message)}`, e);
			}
		} // try/catch
	}); // run
} // task


executeFunction({
	description: '',
	func: task,
});

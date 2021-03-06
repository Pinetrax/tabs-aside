function updateTabMenus() {

	function createSessionsMenuEntries(sessions, pID, closeTab) {
		let cmd = closeTab ? "aside" : "save";

		sessions.forEach(session => {
			browser.menus.create({
				parentId: pID,
				title: session.title,
				onclick: (info, tab) => {
					// background script does not receive a message
					// send by itself...
					asideMessageHandler({
						command: cmd,
						tabs: [tab],
						sessionID: session.id
					});
				}
			});
		});
	}

	return getSessionRootFolder().then(bookmarkFolder => {
		// remove all menus and then recreate them
		return browser.menus.removeAll().then(() => {
			let sessions = getSessions(bookmarkFolder).reverse();

			let options = {
				id: "ta-tab-menu",
				title: "Tabs Aside",
				contexts: ["tab"],
				icons: {
					"16": "icons/aside2.png"
				},
				documentUrlPatterns: ["http://*/*", "https://*/*"] // array of strings
			};

			if (sessions.length === 0) { options.onclick = () => { browser.browserAction.openPopup(); } }

			// this does not return a promise
			browser.menus.create(options);

			if (sessions.length > 0) {
				let sm1 = browser.menus.create({
					parentId: "ta-tab-menu",
					title: "add to existing session"
				});
		
				let sm2 = browser.menus.create({
					parentId: "ta-tab-menu",
					title: "set aside & add to existing session"
				});
		
				createSessionsMenuEntries(sessions, sm1, false); // save
				createSessionsMenuEntries(sessions, sm2, true); // aside
			}
		});
	}).catch(e => {
		console.error("Tabs Aside Menu Update Error\n" + e);
	});
}
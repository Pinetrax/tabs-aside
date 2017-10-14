const COOLDOWN = 300;
let lastClick = 0;

function allowClick() {
	if (Date.now() - lastClick > COOLDOWN) {
		lastClick = Date.now();
		return true;
	}

	return false;
}

class TabSession {
	
		constructor(bm) {
			this.title = bm.title;
			
			this.bmID = bm.id;  // bookmark node ID

			this.tabs = bm.children.filter(x => x.type === 'bookmark');
	
			this.expanded = false;
	
			// create html structure
			let tabhtml = this.tabs.map(
				tab => `<li>${tab.title || tab.url}</li>`
			).join("\n");
	
			this.html = document.createElement("div");
			this.html.classList.add("session");
			this.html.classList.add('collapsed');
	
			// titlebar
			let titlebar = document.createElement("div");
			titlebar.classList.add("titlebar");
			titlebar.innerHTML = `
				<div class="title">${this.title}</div>
				<div class="counter">${this.tabs.length} tabs</div>`;
			
			this.html.appendChild(titlebar);
			titlebar.title = "click to reveal tabs";
			titlebar.addEventListener("click", () => {
				this.toggle();
			});
			this.titlebar = titlebar;
	
			// control
			let controls = document.createElement("div");
			controls.classList.add("controls");
	
			let a = document.createElement("a");
			a.innerText = "Restore tabs";
			a.href = "#";
			a.title = "Restore all tabs from this session";
			a.addEventListener("click", e => {
				e.stopPropagation();
				
				let keep = e.ctrlKey || false;

				if (allowClick()) {
					this.restore(keep);
				}
			});
			controls.appendChild(a);
	
			this.html.appendChild(controls);

			// delete button
			let del = document.createElement("div");
			del.classList.add("delete");
			del.title = "Remove";
			controls.appendChild(del);
			del.addEventListener("click", e => {
				e.stopPropagation();

				if (e.ctrlKey || confirm("Do you really want to delete this session from your bookmarks?")) {
					this.remove();
				}
			});
			
			// tabs
			let tabsection = document.createElement("div");
			tabsection.classList.add("tabs");
			tabsection.innerHTML = `
				<div class="tabs">
					<ol>
						${tabhtml}
					</ol>
				</div>`;
			this.html.appendChild(tabsection);
		}
	
		expand() {
			this.expanded = true;
			this.html.classList.add("expanded");
			this.html.classList.remove("collapsed");
			this.titlebar.title = "click to hide tabs";
		}
	
		collapse() {
			this.expanded = false;
			this.html.classList.add("collapsed");
			this.html.classList.remove("expanded");
			this.titlebar.title = "click to reveal tabs";
		}
	
		toggle() {
			if (this.expanded) {
				this.collapse();
			} else {
				this.expand();
			}
		}
	
		restore(keep = false) {
			console.log("restoring tabs from " + this.title);
	
			this.collapse();
			
			let p = Promise.all(this.tabs.map(tab => browser.tabs.create({
				url: tab.url
			})));

			if (!keep) {
				p = p.then(() => { this.remove(); });
			}

			return p;
		}
	
		remove() {
			// this is async and returns a promise
			browser.bookmarks.removeTree(this.bmID);

			this.html.remove();
			this.html = null;

			browser.runtime.sendMessage({ command: "refresh" });
		}
	}
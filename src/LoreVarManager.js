import { getRequestHeaders } from "../../../../../script.js";
import { getContext } from "../../../../extensions.js";
import { getWorldInfoSettings } from "../../../../world-info.js";
import { Entry } from "./Entry.js";
import { LoreVar } from "./LoreVar.js";
import { log } from "./log.js";




export class LoreVarManager {
	/**@type {Object}*/ context;
	/**@type {Boolean}*/ isUpdating = false;
	/**@type {Entry[]}*/ entryList = [];


	/**@type {Boolean}*/ isShown = true;


	/**@type {String}*/ selectedCategory;


	/**@type {HTMLElement}*/ dom;
	/**@type {HTMLElement}*/ domTabs;


	get categoryList() {
		let cats = this.entryList.map(it=>it.category);
		cats = cats.filter((it,idx)=>cats.indexOf(it)==idx);
		cats.sort((a,b)=>a.localeCompare(b));
		return cats;
	}




	constructor() {
		const context = getContext();

		this.selectedCategory = localStorage.getItem('lvm--lvm.selectedCategory');

		context.eventSource.on(context.event_types.WORLDINFO_SETTINGS_UPDATED, (...args)=>{
			log('WORLDINFO_SETTINGS_UPDATED', args);
			this.update();
		});
		context.eventSource.on(context.event_types.SETTINGS_UPDATED, (...args)=>{
			log('SETTINGS_UPDATED', args);
			this.update();
		});
		context.eventSource.on(context.event_types.CHAT_CHANGED, (...args)=>{
			log('CHAT_CHANGED', args);
			this.update();
		});

		Object.keys(context.event_types).forEach(key=>{
			getContext().eventSource.on(context.event_types[key], (...args)=>{
				log('[EVENT]', key, args);
			});
		});

		this.render();
	}

	unrender() {
		this.dom?.remove();
	}
	render() {
		this.unrender();
		if (!this.isShown) return;
		const root = document.createElement('div'); {
			this.dom = root;
			root.id = 'lvm--root';
			root.classList.add('lvm--root');
			root.classList.add('drawer-content');
			// root.classList.add('fillRight');
			root.classList.add('pinnedOpen');
			const tabs = document.createElement('div'); {
				this.domTabs = tabs;
				tabs.classList.add('lvm--tabs');
				const reload = document.createElement('div'); {
					reload.classList.add('lvm--tab');
					reload.classList.add('lvm--reload');
					reload.textContent = '⟳';
					reload.addEventListener('click', ()=>this.update());
					tabs.append(reload);
				}
				this.categoryList.forEach(cat=>{
					const tab = document.createElement('div'); {
						tab.classList.add('lvm--tab');
						tab.textContent = cat;
						tab.addEventListener('click', ()=>this.selectCategory(cat));
						tabs.append(tab);
					}
				});
				root.append(tabs);
			}
			const content = document.createElement('div'); {
				content.classList.add('lvm--tabContent');
				this.entryList.filter(it=>it.category==this.selectedCategory).forEach(entry=>{
					content.append(entry.render());
				});
				root.append(content);
			}
			document.body.append(root);
		}
	}


	selectCategory(cat) {
		if (this.selectedCategory != cat) {
			this.selectedCategory = cat;
			this.render();
		} else {
			this.selectedCategory = '';
			this.render();
		}
		localStorage.setItem('lvm--lvm.selectedCategory', this.selectedCategory);
	}




	addEntry(/**@type {Entry}*/entry, /**@type {Entry[]}*/oldList) {
		const old = oldList.find(it=>it.id == entry.id);
		if (old) {
			// this.entryList.splice(this.entryList.indexOf(old), 1);
			entry.varList.forEach(ev=>{
				const ov = old.varList.find(it=>it.name==ev.name) ?? ev;
				ev.value = ov.value;
				ev.state = ov.state;
			});
		}
		this.entryList.push(entry);
		entry.onChange = ()=>this.saveWorld(entry.world);
	}




	async update() {
		if (this.isUpdating) return;
		this.isUpdating = true;
		const worldNames = getWorldInfoSettings().world_info.globalSelect;
		log(worldNames);
		const queue = [];
		for (const name of worldNames) {
			queue.push(...await this.updateWorld(name));
		}
		
		if (queue.length) {
			const oldList = this.entryList;
			this.entryList = [];
			queue.forEach(e=>this.addEntry(e, oldList));
		}
		this.entryList = this.entryList.filter(it=>worldNames.indexOf(it.world)!=-1);
		this.render();
		this.isUpdating = false;
	}

	async updateWorld(name) {
		const queue = [];
		const result = await fetch("/getworldinfo", {
			method: "POST",
			headers: getRequestHeaders(),
			body: JSON.stringify({name}),
		});
		if (result.ok) {
			const data = await result.json();
			log(data);
			const entries = Object.keys(data.entries).map(it=>data.entries[it]).filter(it=>it.comment.search(/^#lv:([a-z]+)/is) == 0);
			if (entries.length) {
				entries.forEach(entry=>{
					const vals = JSON.parse([...entry.comment.split('###lv-values'), '[]'][1]);
					const e = new Entry(name, entry.key.join(','), entry.comment.replace(/^#lv:([a-z]+).+$/is, '$1'), entry);
					e.isEnabled = !entry.disable;
					entry.comment.split('###lv-values')[0].split('\n').slice(1).join('\n').replace(/(?:<([a-z][a-z0-9]*):([a-z]+)(\[\])?(?:=([^>]*))?>)/ig, (text, vName, vType, vList, vVal)=>{
						const v = new LoreVar(vName, vType, vList != null && vList != '');
						const ov = vals.find(it=>it.name==v.name)
						if (ov) {
							v.value = ov.value;
						} else if (vVal != null) {
							v.value = vVal;
						}
						e.addVar(v);
					});
					if (e.hasVars) {
						queue.push(e);
						log(e);
					}
				});
				this.saveWorld(name);
			}
		}
		return queue;
	}


	async saveWorld(name) {
		const result = await fetch("/getworldinfo", {
			method: "POST",
			headers: getRequestHeaders(),
			body: JSON.stringify({name}),
		});
		if (result.ok) {
			const data = await result.json();
			let hasUpdate = false;
			Object.keys(data.entries).map(it=>data.entries[it]).forEach(entry=>{
				const e = this.entryList.find(e=>e.world==name&&e.key==entry.key.join(','));
				if (e) {
					const newContent = entry.comment.split('###lv-values')[0].split('\n').slice(1).join('\n').replace(/(?:<([a-z][a-z0-9]*):([a-z]+)(\[\])?(?:=([^>]*))?>)/ig, (text, vName, vType, vList)=>{
						return e.varList.find(it=>it.name==vName).typedValue;
					});
					const newComment = `${entry.comment.split('###lv-values')[0]}###lv-values${JSON.stringify(e.varList)}`;
					if (newContent != entry.content || newComment != entry.comment || entry.disable == e.isEnabled) {
						hasUpdate = true;
					}
					entry.content = newContent;
					entry.comment = newComment;
					entry.disable = !e.isEnabled;
				}
			});
			if (hasUpdate) {
				document.querySelector('#world_editor_select').selectedIndex = 0;
				document.querySelector('#world_editor_select').dispatchEvent(new Event('change'));
				const saveResult = await fetch("/editworldinfo", {
					method: "POST",
					headers: getRequestHeaders(),
					body: JSON.stringify({data, name}),
				});
				log(saveResult);
			}
		}
	}
}
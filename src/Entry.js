import { LoreVar } from "./LoreVar.js";

export class Entry {
	/**@type {String}*/ world;
	/**@type {String}*/ key;
	/**@type {String}*/ category;
	/**@type {Boolean}*/ isEnabled;
	/**@type {LoreVar[]}*/ varList = [];
	/**@type {Object}*/ rawData;


	/**@type {HTMLElement}*/ dom;


	get id() { return `${this.world}---${this.key}`; }

	get hasVars() { return this.varList.length > 0; }




	constructor(/**@type {String}*/ world, /**@type {String}*/ key, /**@type {String}*/ category, /**@type {Object}*/ rawData) {
		this.world = world;
		this.key = key;
		this.category = category;
		this.rawData = rawData;
	}




	render() {
		this.dom?.remove();
		const item = document.createElement('div'); {
			this.dom = item;
			item.classList.add('lvm--entry');
			if (!this.isEnabled) {
				item.classList.add('lvm--disabled');
			}
			if (JSON.parse(localStorage.getItem(`lvm--entry.collapsed(${this.id})`) ?? 'true')) {
				item.classList.add('lvm--collapsed');
			}
			const title = document.createElement('div'); {
				title.classList.add('lvm--title');
				const key = document.createElement('span'); {
					key.classList.add('lvm--key');
					key.textContent = this.key;
					key.addEventListener('click', ()=>{
						item.classList.toggle('lvm--collapsed');
						localStorage.setItem(`lvm--entry.collapsed(${this.id})`, JSON.stringify(item.classList.contains('lvm--collapsed')));
					});
					title.append(key);
				}
				const world = document.createElement('span'); {
					world.classList.add('lvm--world');
					world.textContent = this.world;
					title.append(world);
				}
				const enabled = document.createElement('span'); {
					enabled.classList.add('lvm--enabled');
					const inp = document.createElement('input'); {
						inp.type = 'checkbox';
						inp.title = 'Is this lore entry enabled?';
						inp.checked = this.isEnabled;
						inp.addEventListener('click', async()=>{
							item.classList[inp.checked?'remove':'add']('lvm--disabled');
							this.isEnabled = inp.checked;
							if (this.onChange) this.onChange(this);
						});
						enabled.append(inp);
					}
					title.append(enabled);
				}
				item.append(title);
			}
			const vars = document.createElement('div'); {
				vars.classList.add('lvm--vars');
				this.varList.forEach(lv=>{
					vars.append(lv.render());
				});
				item.append(vars);
			}
		}
		return this.dom;
	}




	addVar(/**@type {LoreVar}*/lv) {
		const old = this.varList.find(it=>it.name == lv.name);
		if (old) {
			this.varList.splice(this.varList.indexOf(old));
		}
		this.varList.push(lv);
		lv.onChange = ()=>this.onChange ? this.onChange(this) : undefined;
	}




	toJSON() {
		return {
			world: this.world,
			key: this.key,
			varList: this.varList,
		};
	}
}
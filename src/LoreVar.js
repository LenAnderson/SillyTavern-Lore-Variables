export class LoreVar {
	/**@type {String}*/ name;
	/**@type {String}*/ type = 's';
	/**@type {Boolean}*/ isList = false;
	/**@type {Object}*/ value = '';


	/**@type {HTMLElement}*/ dom;
	/**@type {Object}*/ state = {};


	/**@type {Function}*/ onChange;


	get typedValue() {
		switch (this.type) {
			case 'i': {
				return parseInt(this.value || 0);
			}
			case 'ss':
			case 's': {
				return `${this.value}`;
			}
			default: {
				return this.value;
			}
		}
	}




	constructor(/**@type {String}*/ name, /**@type {String}*/ type, /**@type {Boolean}*/isList) {
		this.name = name;
		this.type = type;
		this.isList = isList;
	}




	render() {
		this.dom?.remove();
		const root = document.createElement('label'); {
			this.dom = root;
			root.classList.add('lvm--input');
			root.append(this.name);
			switch (this.type) {
				case 'i': {
					const inp = document.createElement('input'); {
						inp.type = 'number';
						inp.value = this.value || 0;
						inp.addEventListener('change', ()=>{
							this.value = parseInt(inp.value);
							if (this.onChange) {
								this.onChange(this);
							}
						});
						root.append(inp);
					}
					break;
				}
				case 's': {
					const inp = document.createElement('input'); {
						inp.type = 'text';
						inp.value = this.value || '';
						inp.addEventListener('change', ()=>{
							this.value = inp.value;
							if (this.onChange) {
								this.onChange(this);
							}
						});
						root.append(inp);
					}
					break;
				}
				case 'ss': {
					const inp = document.createElement('textarea'); {
						inp.value = this.value || '';
						if (this.state.height) {
							inp.style.height = this.state.height;
						}
						const autoSize = ()=>{
							inp.style.height = '5px';
							inp.style.height = `${inp.scrollHeight + 10}px`;
							this.state.height = inp.style.height;
						};
						inp.addEventListener('input', autoSize);
						inp.addEventListener('focus', ()=>{
							autoSize();
						});
						
						inp.addEventListener('change', ()=>{
							this.value = inp.value;
							if (this.onChange) {
								this.onChange(this);
							}
						});
						root.append(inp);
					}
					break;
				}
			}
		}
		return this.dom;
	}




	toJSON() {
		return {
			name: this.name,
			type: this.type,
			isList: this.isList,
			value: this.typedValue,
		};
	}
}
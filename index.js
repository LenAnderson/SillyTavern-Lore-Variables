import { saveSettingsDebounced } from "../../../../script.js";
import { extension_settings } from "../../../extensions.js";
import { getWorldInfoSettings } from "../../../world-info.js";
import { LoreVarManager } from "./src/LoreVarManager.js";




const SETTINGS_KEY = 'LORE_VARIABLES';
const settings = {
	displayPanel: true,
};



const manager = new LoreVarManager();
window.lvm = manager;




$(document).ready(function () {
	const saveSettings = () => {
		extension_settings[SETTINGS_KEY] = settings;
		saveSettingsDebounced();
	};
	const loadSettings = () => {
		Object.assign(settings, extension_settings[SETTINGS_KEY]);
		if (settings.displayPanel) {
			manager.render();
			manager.isShown = true;
		} else {
			manager.unrender();
			manager.isShown = false;
		}
	};
	const addSettings = () => {
		const html = `
		<div class="lvm--settings">
			<div class="inline-drawer">
				<div class="inline-drawer-toggle inline-drawer-header">
					<b>Lore Variables</b>
					<div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
				</div>
				<div class="inline-drawer-content">
					<div class="flex-container">
						<label>
							<small>Display Variable Panel</small><br>
							<input type="checkbox" id="lvm--displayPanel" ${settings.displayPanel ? 'checked' : ''}>
						</label>
					</div>
				</div>
			</div>
		</div>
		`;
		$('#extensions_settings').append(html);
		$('#lvm--displayPanel').on('click', ()=>{
			settings.displayPanel = document.getElementById('lvm--displayPanel').checked;
			saveSettings();
			if (settings.displayPanel) {
				manager.render();
				manager.isShown = true;
			} else {
				manager.unrender();
				manager.isShown = false;
			}
		});
	};

	loadSettings();
	addSettings();
});
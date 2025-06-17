import { z } from "zod";

type MenuItem = {
	label: string;
	action: () => Promise<void>;
};

const settingsMenu: MenuItem[] = [
	{
		label: "Language Model",
		action: () => Promise.resolve(),
	},
];

const mainMenu = (setMenu: (menu: MenuItem[]) => void) => {
	const items = [
		{
			label: "Conversation",
			action: () => Promise.resolve(),
		},
		{
			label: "Journal",
			action: () => Promise.resolve(),
		},
		{
			label: "Settings",
			action: () => setMenu(settingsMenu),
		},
	];

	const logMenuItems = () => {
		console.log("Menu items:", items.map((item) => item.label).join(", "));
	};

	logMenuItems();
	return items;
};

class Menu {
	constructor(private menuItems: MenuItem[]) {
		this.menu = menuItems;
	}
}

function generateMainMenuPrompt() {
	return mainMenu;
}

class Menu {
	constructor(private menuItems: MenuItem[]) {
		this.menuItems = menuItems;
	}
}

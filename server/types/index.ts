import { z } from "zod";

const options = z.enum(["menu"]);

const mainMenuOptions = z.enum(["conversation", "journal", "settings", "help"]);

const mainMenuPrompt = `
 Welcome to the main menu.

 Please select an option:
${mainMenuOptions.options.map((option) => `- ${option}`).join("\n")}
`;

const conversationOptions = z.enum([
	"new conversation",
	"continue conversation",
]);

const settingsOptions = z.enum(["language model", "voice", "notifications"]);

const voiceOptions = z.enum(["male", "female"]);

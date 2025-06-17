import { ChatStream } from "./ChatStream";
import { selectClassification, type Option } from "./Select";

type Message = {
	role: string;
	content: string;
	type: "voice" | "text";
};

class Flow {
	name: string;
	options: Option[];
	onError: () => string;
	onSuccess: () => string;

	constructor({
		name,
		options,
		onError,
		onSuccess,
	}: {
		name: string;
		options: Option[];
		onError: () => string;
		onSuccess: () => string;
	}) {
		this.name = name;
		this.options = options;
		this.onError = onError;
		this.onSuccess = onSuccess;
	}

	async handle(message: Message) {
		const optionResult = await selectClassification(
			message.content,
			this.options
		);
		if (!optionResult) {
			return this.onError();
		}

		optionResult.onSelect();
		return this.onSuccess();
	}
}

class ChatSession {
	conversationId: string;
	messages: Message[];
	flow: Flow;

	static settings = new Flow({
		name: "settings",
		options: [
			{
				name: "main",
				onSelect: () => {
					this.setFlow(ChatSession.main);
				},
			},
		],
		onError: () => "Sorry, I don't know how to handle that",
		onSuccess: () => "Okay, let's go to settings",
	});

	static main = new Flow({
		name: "main",
		options: [
			{
				name: "settings",
				onSelect: function (this: ChatSession) {
					this.setFlow(ChatSession.settings);
				},
			},
		],
		onError: () => {},
		onSuccess: () => {},
	});

	constructor({ id }: { id: string }) {
		this.conversationId = id;
		this.messages = [];
		this.flow = ChatSession.main;
	}

	addMessage(message: Message) {
		this.messages.push(message);
	}

	setFlow(flow: Flow) {
		this.flow = flow;
	}

	async respond({
		sendResponse,
		onFinish,
	}: {
		sendResponse: (part: string) => void;
		onFinish: () => void;
	}) {
		sendResponse(`Okay,`);

		this.flow.handle(this.messages[this.messages.length - 1]);
		onFinish();
	}
}

export default ChatSession;

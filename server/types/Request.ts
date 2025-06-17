export type Request = {
	id: string;
	messages: Message[];
};

export type Message = {
	role: string;
	content: string;
	parts: Part[];
};

export type Part = {
	type: string;
	text: string;
};

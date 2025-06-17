import "./App.css";
import { ChatSection } from "@llamaindex/chat-ui";
import { useChat } from "@ai-sdk/react";

function App() {
	const handler = useChat({
		api: "/api/chat",
	});

	// console.log({ messages });

	return (
		<div className="w-full h-screen ">
			<ChatSection handler={handler} />
		</div>
	);
}

export default App;

import { ChatSection } from "@llamaindex/chat-ui";
import { useChat } from "ai/react";

function App() {
	const handler = useChat();
	return <ChatSection handler={handler} />;
}

export default App;

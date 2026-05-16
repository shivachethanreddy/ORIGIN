export function formatConversationHistory(messages = []) {
  const turns = messages
    .filter((message) => message?.content && message.role !== "system")
    .slice(-12);

  if (!turns.length) {
    return "No prior conversation.";
  }

  return turns
    .map((message) => `${message.role === "user" ? "User" : "Assistant"}: ${message.content.trim()}`)
    .join("\n");
}

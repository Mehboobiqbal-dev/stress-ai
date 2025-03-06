import React, { useState } from "react";
import axios from "axios";

const AITherapyChat = () => {
  const [userMessage, setUserMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!userMessage.trim()) return;

    // Add user's message to chat history
    setChatHistory([...chatHistory, { sender: "user", text: userMessage }]);
    setUserMessage("");
    setLoading(true);

    try {
      // Example API call (adjust URL and params as needed)
      const response = await axios.post(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateText",
        { prompt: { text: `Personalized therapist response: ${userMessage}` } },
        { params: { key: process.env.NEXT_PUBLIC_GEMINI_API_KEY } }
      );

      const aiResponse = response.data.candidates?.[0]?.output || "Try breathing slowly.";
      setChatHistory([...chatHistory, { sender: "user", text: userMessage }, { sender: "ai", text: aiResponse }]);
    } catch (error) {
      console.error("Error:", error);
      setChatHistory([...chatHistory, { sender: "ai", text: "Sorry, something went wrong." }]);
    }

    setLoading(false);
  };

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h2 className="text-2xl font-bold mb-4">AI Therapy Chat</h2>
      {/* Chat History */}
      <div className="h-64 overflow-y-scroll p-2 border border-gray-300 rounded mb-4">
        {chatHistory.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"} mb-2`}
          >
            <div
              className={`p-2 rounded-lg ${
                msg.sender === "user" ? "bg-blue-500 text-white" : "bg-gray-200 text-black"
              }`}
            >
              <strong>{msg.sender === "user" ? "You" : "AI"}:</strong> {msg.text}
            </div>
          </div>
        ))}
      </div>
      {/* Input and Button */}
      <input
        type="text"
        value={userMessage}
        onChange={(e) => setUserMessage(e.target.value)}
        placeholder="Type your message..."
        className="w-full p-2 border border-gray-300 rounded mb-2"
      />
      <button
        onClick={sendMessage}
        disabled={loading}
        className={`w-full p-2 rounded ${
          loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700"
        }`}
      >
        {loading ? "Thinking..." : "Send"}
      </button>
    </div>
  );
};

export default AITherapyChat;
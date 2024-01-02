import React, { useState, useEffect } from "react";
import "./chatbot.css";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: "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",
  dangerouslyAllowBrowser: true,
});

function MainComponent(props) {
  const [inputValue, setInputValue] = useState("");
  const [responseData, setResponseData] = useState({});
  const thread = "thread_Xo72VcWGQXny3Y6NT6v3yPM6";

  const createMessage = async () => {
    const message = await openai.beta.threads.messages.create(thread, {
      role: "user",
      content: inputValue,
    });

    setResponseData({
      body: {
        data: responseData.body ? [...responseData.body.data, message] : [message],
      },
    });
  };

  const runAssistant = async () => {
    const run = await openai.beta.threads.runs.create(thread, {
      assistant_id: "asst_Gc3PArxAu0rO10aUC7cNAdTl",
    });

    checkRunStatus(run.id);
  };

  const sendMessages = async () => {
    setInputValue("");
    createMessage();
    runAssistant();

  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessages();
  };

  const checkRunStatus = async (runId) => {
    try {
      const run = await openai.beta.threads.runs.retrieve(thread, runId);
      if (run.status === "completed") {
        assistantResponse();
      } else {
        setTimeout(() => checkRunStatus(runId), 3000);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const assistantResponse = async () => {
    const messages = await openai.beta.threads.messages.list(thread);
    setResponseData(messages);
  };

  useEffect(() => {
    const fetchPreviousMessages = async () => {
      try {
        const messages = await openai.beta.threads.messages.list(thread);
        setResponseData(messages);
      } catch (error) {
        console.error("Error fetching previous messages:", error);
      }
    };

    fetchPreviousMessages();
  }, [responseData]);

  return (
    <div className="chatbot">
      <div>
        <div style={{ height: "400px", width: "300px", border: "1px solid black", overflowY: "scroll" }}>
          {responseData &&
            responseData.body &&
            responseData.body.data.slice().reverse().map((message) => (
              <div key={message.id} style={{ display: "flex", justifyContent: message.role === "assistant" ? "flex-start" : "flex-end" }}>
                <p style={{ padding: "5px 10px", borderRadius: "10px", backgroundColor: message.role === "assistant" ? "blue" : "green", color: "white", maxWidth: "70%" }}>
                  {message.content[0].text.value}
                </p>
              </div>
            ))}
        </div>
        <form onSubmit={handleSubmit}>
          <input
            placeholder={"Welcome " + props.name + "!"}
            id="input"
            value={inputValue}
            onChange={handleInputChange}
          />
          <button type="submit">Send Message</button>
        </form>
      </div>
    </div>
  );
}

export default MainComponent;

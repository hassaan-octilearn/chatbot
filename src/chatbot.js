import React, { useState, useEffect } from "react";
import "./chatbot.css";
import OpenAI from "openai";
import { useRef } from "react";
import thread_data from "./threads_data";
const openai = new OpenAI({

  dangerouslyAllowBrowser: true,
  apiKey:process.env.REACT_APP_API_KEY,
});




// "UnderStanding Concepts",
// "Revising Concepts",
// "Addressing Information",
// "Practising Question"

const defaultData = {
  body: {
    data: [
      {
        id: 1,
        role: "assistant", // or "user"
        content: [
          {
            text: {
              value: "Please let me know what you need in this session:",
            },
          },
        ],
        content1: [

          "UnderStanding Concepts",
          "Revising Concepts",
          "Addressing Information",
          "Practising Question"
        ]

      },
      // More message objects...
    ],
  },
};


function MainComponent(props) {
  const [inputValue, setInputValue] = useState("");
  const [responseData, setResponseData] = useState(defaultData);
  const [thread, setThread] = useState("");
  const userId = props.name;
  const [waitingMessage, setWaitingMessage] = useState(false);
  const [reponseError, setResponseError] = useState();
  const [notStarted, setNotStarted] = useState(true);

  const messagesEndRef = useRef(null);

  // Scroll to the bottom whenever responseData changes


  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };



  useEffect(() => {
    const userThread = thread_data.find((user) => user.name === `student_${userId}`);
    if (userThread) {
      setThread(userThread.thread_id);
      console.log("Oold thread")
    }
    else if(!userThread) {
      console.log("new thread");
      createThreadAndStartChat();
    }


    const fetchPreviousMessages = async () => {
      if (thread != "") {
        try {
          const messages = await openai.beta.threads.messages.list(thread);
          setResponseData(messages);
        } catch (error) {
          console.error("Error fetching previous messages:", error);
        }
      }
    };
    scrollToBottom();
    fetchPreviousMessages();
  }, [responseData, notStarted])
  const createThreadAndStartChat = async () => {
    console.log("create thread and start chat")
    const thread = await openai.beta.threads.create();
    console.log(thread.id);
    setThread(thread.id);

  }

  const createDefaultMessage = async (messageValue) => {
    const message = await openai.beta.threads.messages.create(thread, {
      role: "user",
      content: messageValue,
    });


  };

  const createMessage = async () => {
    const message = await openai.beta.threads.messages.create(thread, {
      role: "user",
      content: inputValue,
    });


  };



  const runAssistant = async () => {
    const run = await openai.beta.threads.runs.create(thread, {
      assistant_id: "asst_E0ji1SVhp7vcVDONZkhdES9P",
    });
    checkRunStatus(run.id);
  };


  const checkRunStatus = async (runId) => {
    try {
      const run = await openai.beta.threads.runs.retrieve(thread, runId);
      console.log(run.status);
      if (run.status === "in_progress") {
        setWaitingMessage(true);
        setResponseError("waiting for Response....");
        setTimeout(() => checkRunStatus(runId), 3000);
      }
      else if (run.status === "failed") {
        setWaitingMessage(false);
        setResponseError(run.last_error);

      }
      else if (run.status === "completed") {
        setWaitingMessage(false);
        setResponseError();

      }
    } catch (error) {
      console.log(error);
    }
  };

  // const assistantResponse = async () => {0000
  //   console.log(messages.body.data[1]);
  //   setResponseData(messages);
  // };

  const defaultMessageSend = (button) => {

    console.log(button);
    createDefaultMessage(button);
    runAssistant();
    setNotStarted(false);




  }
  const sendMessages = () => {
    createMessage();
    runAssistant();
    setInputValue("");

  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessages();
  };

  return (
    <div className="chatbot" style={{}}>
      <div>
        {notStarted ?
          (<div style={{ height: "400px", width: "300px", border: "1px solid black", overflow: "auto"}}>
            {
              responseData.body &&
              responseData.body.data.slice().reverse().map((message) => (
                <div key={message.id} style={{ display: "flex", flexDirection: "column", justifyContent: message.role === "assistant" ? "flex-start" : "flex-end" }}>
                  <p style={{ padding: "5px 10px", borderRadius: "10px", backgroundColor: message.role === "assistant" ? "blue" : "green", color: "white", maxWidth: "70%" }}>
                    {message.content[0].text.value}
                  </p>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {message.content1 && message.content1.map((value, index) => (
                      <button key={index} onClick={() => defaultMessageSend(value)}>{value}</button>
                    ))}
                  </div>
                </div>
              ))
            }
          </div>) : (
            
            <div style={{ height: "400px", width: "300px", border: "1px solid black", overflow: "auto" }}>
              {responseData &&
                responseData.body &&
                responseData.body.data.slice().reverse().map((message) => (
                  <div key={message.id} style={{ display: "flex", justifyContent: message.role === "assistant" ? "flex-start" : "flex-end" }}>
                    <p style={{ padding: "5px 10px", borderRadius: "10px", backgroundColor: message.role === "assistant" ? "blue" : "green", color: "white", maxWidth: "70%" }}>
                    {message.content[0] && message.content[0].text && message.content[0].text.value}

                    </p>
                  </div>
                ))
              }

            </div>
     
         
          )}

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

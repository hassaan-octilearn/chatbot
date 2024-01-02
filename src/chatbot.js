import React, { useState, useEffect } from "react";
import "./chatbot.css";
import OpenAI from "openai";
import { useRef } from "react";
import thread_data from "./threads_data";
const openai = new OpenAI({

  dangerouslyAllowBrowser: true,
});

function MainComponent(props) {
  const [inputValue, setInputValue] = useState("");
  const [responseData, setResponseData] = useState({});
  const [thread, setThread] = useState("");
  const [neverStarted, setNeverStarted] = useState(false);
  const userId = props.name;
  const [waitingMessage, setWaitingMessage] = useState(false);
  const [reponseError,setResponseError]=useState();


  useEffect(() => {
    const userThread = thread_data.find((user) => user.name === `student_${userId}`);
    if (userThread) {
      console.log("old thread");
      console.log(userThread.thread_id);
      setThread(userThread.thread_id);
      setNeverStarted(true);


    }
    else {
      console.log("new thread");
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

    fetchPreviousMessages();
  }, [userId, responseData, thread])



  const createThreadAndStartChat = async () => {
    console.log("create thread and start chat")
    const thread = await openai.beta.threads.create();
    const new_data = { name: `student_${userId}`, thread_id: thread.id }
    thread_data.push(new_data);
    console.log(thread_data);
    setNeverStarted(true);
    setThread(thread.id);

  }

  const createMessage = async () => {
    const message = await openai.beta.threads.messages.create(thread, {
      role: "user",
      content: inputValue,
    });


  };

  const runAssistant = async () => {
    const run = await openai.beta.threads.runs.create(thread, {
      assistant_id: "asst_Gc3PArxAu0rO10aUC7cNAdTl",
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
      else if(run.status==="completed") {
        setWaitingMessage(false);
        setResponseError();

      }
    } catch (error) {
      console.log(error);
    }
  };

  // const assistantResponse = async () => {
  //   const messages = await openai.beta.threads.messages.list(thread);
  //   console.log(messages.body.data[1]);
  //   setResponseData(messages);
  // };
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

  return (
    <div className="chatbot" style={{display:"flex",position:"absolute",right:0,bottom:0}}>
      <div>
        {neverStarted ?
          <div style={{ height: "400px", width: "300px", border: "1px solid black", overflow: "auto",display:"flex",flexDirection:"column",justifyContent:"end" }}>

            {responseData &&
              responseData.body &&
              responseData.body.data.slice().reverse().map((message) => (
                <div key={message.id} style={{ display: "flex", justifyContent: message.role === "assistant" ? "flex-start" : "flex-end" }}>
                  <p style={{ padding: "5px 10px", borderRadius: "10px", backgroundColor: message.role === "assistant" ? "blue" : "green", color: "white", maxWidth: "70%" }}>
                    {message.content[0].text.value}
                  </p>
                </div>
              ))  
              }
              {waitingMessage?
                <div>
                            <p>Waiting for response...</p>
                </div>:
                <div>
                  {JSON.stringify(reponseError)}
                </div>
                }
          </div> :
          <div style={{ height: "400px", width: "300px", border: "1px solid black", overflow: "auto" }}>

            <p>chat is never started</p>
            <button onClick={createThreadAndStartChat}>start chat!</button>
          </div>
        }
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

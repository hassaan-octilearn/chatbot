import ChatBot from './chatbot';
import './App.css';
const thread_number="thread_1"
function App() {
  return (
    <div className="App">
      <ChatBot name="hassaan hanif" thread_number={thread_number}/>

    </div>
  );
}

export default App;

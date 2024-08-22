import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useLayoutEffect,
} from 'react';
import { BiPlus, BiUser, BiSend, BiSolidUserCircle } from 'react-icons/bi';
import { MdOutlineArrowLeft, MdOutlineArrowRight, MdMenu } from 'react-icons/md';
import axios from 'axios';
import PromptCard from './components/PromptCard.jsx';

const prompts = [
  { title: 'General Inquiry', description: 'Ask anything about our services.' },
  { title: 'Technical Support', description: 'Get help with technical issues.' },
  { title: 'Feedback', description: 'Provide feedback on our services.' },
  // Add more prompts as needed
];

function App() {
  const [text, setText] = useState('');
  const [message, setMessage] = useState(null);
  const [previousChats, setPreviousChats] = useState([]);
  const [localChats, setLocalChats] = useState([]);
  const [currentTitle, setCurrentTitle] = useState(null);
  const [isResponseLoading, setIsResponseLoading] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [isShowSidebar, setIsShowSidebar] = useState(false);
  const scrollToLastItem = useRef(null);

  const createNewChat = () => {
    setMessage(null);
    setText('');
    setCurrentTitle(null);
  };

  const backToHistoryPrompt = (uniqueTitle) => {
    setCurrentTitle(uniqueTitle);
    setMessage(null);
    setText('');
  };

  const toggleSidebar = useCallback(() => {
    setIsShowSidebar((prev) => !prev);
  }, []);

  const submitHandler = async (e,prompt=null) => {
    console.log(text);
    if(text != ""){
      e.preventDefault();

    }
    setMessage(text);
    setErrorText('');

    if (!text) return;

    setIsResponseLoading(true);

    try {
      const response = await axios.post('http://127.0.0.1:5000/qaretrival', { text }, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 429) {
        return setErrorText('Too many requests, please try again later.');
      }

      const data = response.data;

      if (data.error) {
        setErrorText(data.error.message);
        setText('');
      } else {
        setErrorText('');
        setMessage(data.choices[0].message);
        setTimeout(() => {
          scrollToLastItem.current?.scrollIntoView({ behavior: 'smooth' });
        }, 1);
        setTimeout(() => {
          setText('');
        }, 2);
      }
    } catch (e) {
      setErrorText(e.message);
      console.error(e);
    } finally {
      setIsResponseLoading(false);
    }
  };

  useLayoutEffect(() => {
    const handleResize = () => {
      setIsShowSidebar(window.innerWidth <= 640);
    };
    handleResize();

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    const storedChats = localStorage.getItem('previousChats');

    if (storedChats) {
      setLocalChats(JSON.parse(storedChats));
    }
  }, []);

  useEffect(() => {
    if (!currentTitle && text && message) {
      setCurrentTitle(text);
    }

    if (currentTitle && message) {
      const newChat = {
        title: currentTitle,
        role: 'user',
        content: text,
      };

      const responseMessage = {
        title: currentTitle,
        role: message.role,
        content: message.content,
      };

      setPreviousChats((prevChats) => [...prevChats, newChat, responseMessage]);
      setLocalChats((prevChats) => [...prevChats, newChat, responseMessage]);

      const updatedChats = [...localChats, newChat, responseMessage];
      localStorage.setItem('previousChats', JSON.stringify(updatedChats));

      setText(''); // Clear the text input
      setMessage(null); // Reset message to prevent re-triggering
    }
  }, [message, currentTitle, text]);

  const currentChat = (localChats || previousChats).filter(
    (prevChat) => prevChat.title === currentTitle
  );

  const uniqueTitles = Array.from(
    new Set(previousChats.map((prevChat) => prevChat.title).reverse())
  );

  const localUniqueTitles = Array.from(
    new Set(localChats.map((prevChat) => prevChat.title).reverse())
  ).filter((title) => !uniqueTitles.includes(title));

  const handlePromptClick = (prompt) => {
    console.log(prompt.description);
    // setMessage({
    //   role: 'Cure me',
    //   content: prompt.description,
    // });
    // setErrorText('');
  };

  return (
    <div className='container'>
      <section className={`sidebar ${isShowSidebar ? 'open' : ''}`}>
        <div className='sidebar-header' onClick={createNewChat} role='button'>
          <BiPlus size={20} />
          <button>New Chat</button>
        </div>
        <div className='sidebar-history'>
          {uniqueTitles.length > 0 && previousChats.length !== 0 && (
            <>
              <p>Ongoing</p>
              <ul>
                {uniqueTitles?.map((uniqueTitle, idx) => (
                  <li key={idx} onClick={() => backToHistoryPrompt(uniqueTitle)}>
                    {uniqueTitle}
                  </li>
                ))}
              </ul>
            </>
          )}
          {localUniqueTitles.length > 0 && localChats.length !== 0 && (
            <>
              <p>Previous</p>
              <ul>
                {localUniqueTitles?.map((uniqueTitle, idx) => (
                  <li key={idx} onClick={() => backToHistoryPrompt(uniqueTitle)}>
                    {uniqueTitle}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
        <div className='sidebar-info'>
          <div className='sidebar-info-upgrade'>
            <BiUser size={20} />
            <p>About</p>
          </div>
          <div className='sidebar-info-user'>
            <BiSolidUserCircle size={20} />
            <p>User</p>
          </div>
        </div>
      </section>

      <section className='main'>
        {!currentTitle && (
          <div className='empty-chat-container'>
            <img
              src='images/logo.png'
              width={45}
              height={45}
              alt='Cure Me'
            />
            <h1>Cure Me</h1>
            <h3>How can I help you today?</h3>
            <div className='prompt-cards-container'>
              {prompts.map((prompt, index) => (
                <PromptCard
                  key={index}
                  prompt={prompt}
                  onClick={() => handlePromptClick(prompt)}
                />
              ))}
            </div>
          </div>
        )}

        {isShowSidebar ? (
          <MdMenu
            className='hamburger'
            size={28.8}
            onClick={toggleSidebar}
          />
        ) : (
          <MdOutlineArrowLeft
            className='burger'
            size={28.8}
            onClick={toggleSidebar}
          />
        )}
        <div className='main-header'>
          <ul>
            {currentChat?.map((chatMsg, idx) => {
              const isUser = chatMsg.role === 'user';

              return (
                <li key={idx} ref={scrollToLastItem}>
                  {isUser ? (
                    <div>
                      <BiSolidUserCircle size={28.8} />
                    </div>
                  ) : (
                    <img src='images/logo.png' alt='Cure Me' />
                  )}
                  {isUser ? (
                    <div>
                      <p className='role-title'>You</p>
                      <p>{chatMsg.content}</p>
                    </div>
                  ) : (
                    <div>
                      <p className='role-title'>Cure Me</p>
                      <p>{chatMsg.content}</p>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
        <div className='main-bottom'>
          {errorText && <p className='errorText'>{errorText}</p>}
          {errorText && (
            <p id='errorTextHint'></p>
          )}
          <form className='form-container' onSubmit={submitHandler}>
            <input
              type='text'
              placeholder='Send a message.'
              spellCheck='false'
              value={isResponseLoading ? 'Processing...' : text}
              onChange={(e) => setText(e.target.value)}
              readOnly={isResponseLoading}
            />
            {!isResponseLoading && (
              <button type='submit'>
                <BiSend size={20} />
              </button>
            )}
          </form>
        </div>
      </section>
    </div>
  );
}

export default App;

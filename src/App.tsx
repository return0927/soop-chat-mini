import SocketHolder from './components/SocketHolder.tsx';
import { useState } from 'react';
import { ChatMessage } from './libs/SoopChat.ts';
import Marquee from 'react-fast-marquee';

function App() {
  const params = new URL(window.location.href).searchParams;
  const channelId = params.get('channel');
  const scrollAmount = ((v) => {
    return v !== null && +v > 0 ? +v : 150;
  })(params.get('scrollAmount'));
  const [messages, setMessages] = useState<string[][]>([]);

  const handler = (message: ChatMessage) => {
    setMessages((arr) => [
      ...arr,
      [
        message.message,
        Math.floor(Math.random() * window.innerHeight - 40) + 20 + 'px',
      ],
    ]);
  };

  return (
    <div>
      {channelId ? (
        <SocketHolder channelId={channelId} handler={handler} />
      ) : (
        <div>채널 아이디가 올바르지 않습니다</div>
      )}

      {messages &&
        messages.map(([message, position]) => (
          <Marquee
            key={`${message}-${position}`}
            style={{
              position: 'fixed',
              top: position,
              left: `-${message.length * 16}px`,
              width: `calc(100% + ${message.length * 16}px)`,
            }}
            delay={0.1}
            speed={scrollAmount}
            loop={1}
            onFinish={() => {
              setMessages((arr) =>
                arr.filter((a) => a[0] !== message || a[1] !== position)
              );
            }}
          >
            {message}
          </Marquee>
        ))}
    </div>
  );
}

export default App;

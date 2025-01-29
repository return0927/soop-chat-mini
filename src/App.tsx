import SocketHolder from './components/SocketHolder.tsx';
import { useEffect, useState } from 'react';
import { ChatMessage } from './libs/SoopChat.ts';
import Marquee from 'react-fast-marquee';

function App() {
  const params = new URL(window.location.href).searchParams;
  const channelId = params.get('channel');
  const scrollAmount = ((v) => {
    return v !== null && +v > 0 ? +v : 150;
  })(params.get('scrollAmount'));
  const scrollOffset = ((v): number => {
    if (!isNaN(+v)) return +v;
    throw new Error(`scrollOffset=${v}(은)는 올바른 숫자가 아닙니다.`);
  })(params.get('scrollOffset') || 0);

  const [errorMessage, setErrorMessage] = useState(
    '채널이 온라인이 되기를 기다리는 중...'
  );
  const [messages, setMessages] = useState<string[][]>([]);
  const [lastRandom, setLastRandom] = useState<number>(-1.0);
  const setRefreshTimer = useState<NodeJS.Timeout | null>(null)[1];

  const getBalancedRandom = (preset = Math.random()): number => {
    if (Math.abs(lastRandom - preset) < 0.1) {
      return Math.abs(lastRandom - (1 - preset)) < 0.1
        ? getBalancedRandom()
        : getBalancedRandom(1 - preset);
    }

    setLastRandom(() => preset);
    return preset;
  };
  const handler = (message: ChatMessage) => {
    setMessages((arr) => [...arr, [message.message, '' + getBalancedRandom()]]);
  };
  const errorConsumer = (message: string) => {
    setErrorMessage(message);
  };

  useEffect(() => {
    if (errorMessage) {
      console.log('새로고침 타이머를 설정함');
      setRefreshTimer((originalTimer) => {
        if (originalTimer) window.clearTimeout(originalTimer);
        return setTimeout(() => location.reload(), 1000 * 60);
      });
    } else {
      console.log('새로고침 타이머를 해제함');
      setRefreshTimer((originalTimer) => {
        if (originalTimer) window.clearTimeout(originalTimer);
        return null;
      });
    }

    /** BE CAREFUL IF NEW useState BEING USED */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errorMessage]);

  return (
    <div>
      {channelId ? (
        <SocketHolder
          channelId={channelId}
          handler={handler}
          errorConsumer={errorConsumer}
        />
      ) : (
        <div>채널 아이디가 올바르지 않습니다</div>
      )}
      {errorMessage ? (
        <div>
          <p>{errorMessage}</p>
          <p>60초 뒤에 새로고침합니다.</p>
        </div>
      ) : (
        <></>
      )}

      {messages &&
        messages.map(([message, position]) => (
          <Marquee
            key={`${message}-${position}`}
            style={{
              position: 'fixed',
              top: `calc((100vh - 3em) * ${position} + 1em)`,
              left: `-${message.length * 16}px`,
              width: `calc(100% + ${message.length * 16}px)`,
            }}
            delay={0.1}
            speed={scrollAmount + scrollOffset * (+position - 0.5)}
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

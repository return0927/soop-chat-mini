import SocketHolder from './components/SocketHolder.tsx';
import { useEffect, useState } from 'react';
import Marquee from 'react-fast-marquee';
import { ChatMessage, StreamMeta } from './types/stream.ts';
import { SignatureEmoticonResponse } from './types/api.ts';

function arrayChoice<T>(array: Array<T>): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomId(length: number = 12) {
  const CHARS = Array.from('0123456789abcdefghijklmnopqrstuvwxyz');
  return Array.from(Array(length).keys())
    .map(() => arrayChoice(CHARS))
    .join('');
}

type MessageEntry = {
  messages: JSX.Element[];
  charLength: number;
  position: string;
  key: string;
};

type EmoteMap = { [key: string]: string };

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
  const [messages, setMessages] = useState<MessageEntry[]>([]);
  const setRefreshTimer = useState<NodeJS.Timeout | null>(null)[1];
  const [title, setTitle] = useState<string>('SOOP 미니 채팅');
  const [emoteMap, setEmoteMap] = useState<EmoteMap>({});
  const [emoteMapHolder] = useState<{ emoteMap: EmoteMap }>({ emoteMap });

  let lastRandom = -1.0;
  const getBalancedRandom = (preset = Math.random()): number => {
    if (Math.abs(lastRandom - preset) < 0.1) {
      return Math.abs(lastRandom - (1 - preset)) < 0.1
        ? getBalancedRandom()
        : getBalancedRandom(1 - preset);
    }

    lastRandom = preset;
    return preset;
  };
  const handler = (message: ChatMessage) => {
    if (!message) {
      console.log('Ignoring null message');
      return;
    }

    let charLength = 0;
    const messageParts = message.message
      .split(/([^/\n]+)|(\/[^/]+\/)/)
      .filter((v) => v)
      .map((v) => {
        const emoteId = v.slice(1, v.length - 1);
        if (
          !v.startsWith('/') ||
          !v.endsWith('/') ||
          !emoteMapHolder.emoteMap[emoteId]
        ) {
          charLength += v.length;
          return <span>{v}</span>;
        }

        charLength += 1;
        return <img src={emoteMapHolder.emoteMap[emoteId]} alt={emoteId} />;
      });

    const entry: MessageEntry = {
      key: getRandomId(),
      messages: messageParts,
      charLength: charLength,
      position: '' + getBalancedRandom(),
    };
    setMessages((arr) => [...arr, entry]);
  };
  const errorConsumer = (message: string) => {
    setErrorMessage(message);
  };
  const streamMetaHandler: (args: StreamMeta) => void = (args) => {
    setTitle(() => `SOOP 미니 채팅 - ${args.nick}(${args.id})`);
  };

  useEffect(() => {
    fetch(
      `/proxy/api/signature_emoticon_api.php?v=tier&work=list&szBjId=${channelId}`
    ).then(async (body) => {
      const json: SignatureEmoticonResponse = await body.json();
      const { img_path: baseUrl, data } = json;

      const signatureEmoticons: string[][] = [];
      Array.of(data['tier1'], data['tier2']).forEach((arr) => {
        if (arr)
          arr.forEach((entry) => {
            signatureEmoticons.push([
              entry.title,
              new URL(entry.pc_img, baseUrl).href,
            ]);
          });
      });
      setEmoteMap((currentMap) => {
        const newMap = { ...currentMap };
        signatureEmoticons.forEach(([key, url]) => {
          newMap[key] = url;
        });
        console.log(`New map: ${Object.keys(newMap)}`);
        console.log(newMap);
        return newMap;
      });
      console.log(`Updated emoteMap: ${signatureEmoticons.map((v) => v[0])}`);
    });
  }, [channelId]);

  useEffect(() => {
    setInterval(() => {
      handler({
        id: 'foobar1234',
        nick: 'TestUser',
        message:
          '잘한다 ' +
          arrayChoice(['/sesekki/', '/sesehi/', '/seheart/', '/segoo/']) +
          arrayChoice(['/sesekki/', '/sesehi/', '/seheart/', '/segoo/']) +
          '!!',
      });
    }, 100);
  }, []);

  useEffect(() => {
    emoteMapHolder.emoteMap = emoteMap;
  }, [emoteMap]);

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
    <div className={'soop-chat'}>
      <title>{title}</title>

      {channelId ? (
        <SocketHolder
          channelId={channelId}
          handler={handler}
          streamMetaHandler={streamMetaHandler}
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
        messages.map(({ key, messages, position, charLength }) => (
          <Marquee
            key={key}
            style={{
              position: 'fixed',
              top: `calc((100vh - 3em) * ${position} + 1em)`,
              left: `calc(-5 * ${charLength}em)`,
              width: `calc(100% + 5 * ${charLength}em)`,
            }}
            delay={0.1}
            speed={scrollAmount + scrollOffset * (+position - 0.5)}
            loop={1}
            onFinish={() => {
              setMessages((arr) => arr.filter((a) => a.key !== key));
            }}
          >
            {...messages}
          </Marquee>
        ))}
    </div>
  );
}

export default App;

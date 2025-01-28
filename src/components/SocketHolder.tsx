import { useEffect, useState } from 'react';
import { ChatMessage, SoopChat } from '../libs/SoopChat.ts';

export default function SocketHolder({
  channelId,
  handler,
  errorConsumer,
}: {
  channelId: string;
  handler: (message: ChatMessage) => void;
  errorConsumer: (message: string) => void;
}) {
  const [client, setClient] = useState<SoopChat>();

  useEffect(() => {
    setClient(() => new SoopChat(channelId));
    return;
  }, [channelId]);

  useEffect(() => {
    if (!client) return;
    (async () => {
      client.onMessage = handler;
      try {
        await client.build();
        errorConsumer('');

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (e: unknown) {
        errorConsumer('채널 정보를 받아올 수 없습니다');
      }
    })();

    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client]);

  return <></>;
}

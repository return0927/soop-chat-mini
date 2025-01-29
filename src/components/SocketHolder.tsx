import { useEffect, useState } from 'react';
import { SoopChat } from '../libs/SoopChat.ts';
import { ChatMessage, StreamMeta } from '../types/stream.ts';

export default function SocketHolder({
  channelId,
  handler,
  streamMetaHandler,
  errorConsumer,
}: {
  channelId: string;
  handler: (message: ChatMessage) => void;
  streamMetaHandler: (args: StreamMeta) => void;
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
      client.onStreamMeta = streamMetaHandler;
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

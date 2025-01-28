import { useEffect, useState } from 'react';
import { ChatMessage, SoopChat } from '../libs/SoopChat.ts';

export default function SocketHolder({
  channelId,
  handler,
}: {
  channelId: string;
  handler: (message: ChatMessage) => void;
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
      await client.build();
    })();

    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client]);

  return <></>;
}

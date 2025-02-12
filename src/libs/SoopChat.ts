import { ChatMessage, StreamMeta } from '../types/stream.ts';
import { PlayerLiveApiResponse } from '../types/api.ts';

const SEP = '\x0c';
const ESC = '\x1b\t';

export class SoopChat {
  private readonly encoder: TextEncoder = new TextEncoder();
  private readonly decoder: TextDecoder = new TextDecoder();
  private readonly channelId: string;
  private chatNo: string;
  private client: WebSocket | null;
  private intervalId: NodeJS.Timeout | undefined = undefined;

  public onMessage: ((msg: ChatMessage) => void) | null = null;
  public onStreamMeta: ((meta: StreamMeta) => void) | null = null;

  constructor(channelId: string) {
    this.channelId = channelId;
    this.chatNo = '';
    this.client = null;
  }

  public async build() {
    const stream = await this._fetchStreamInfo();
    if (!stream || !stream.CHANNEL.CHDOMAIN)
      throw new Error('스트림 정보가 없습니다');

    const url = this._buildUrl(stream);
    console.log(`Connecting to ${url}`);

    try {
      const { BJID, BJNICK, CATE, CATEGORY_TAGS, TITLE } = stream.CHANNEL;
      this.onStreamMeta?.({
        id: BJID,
        nick: BJNICK,
        title: TITLE,
        category: CATE,
        categoryTags: CATEGORY_TAGS,
      });
    } catch (e: unknown) {
      console.error('메타 정보를 받아오는데 실패함', e);
    }

    this.client = new WebSocket(url, ['chat']);
    this.client.binaryType = 'arraybuffer';
    this._attachEventHandlers(this.client);
  }

  private _startPing(client: WebSocket): void {
    this.intervalId = setInterval(() => {
      console.log('PING SENT');
      this._sendPing(client);
    }, 1000 * 60);
  }

  private _stopPing(): void {
    if (!this.intervalId) {
      console.log('PING STOPPED');
      clearInterval(this.intervalId);
    }
  }

  private _cleanClient(): void {
    this._stopPing();
    console.log('client cleaned-up');
  }

  private _attachEventHandlers(client: WebSocket) {
    client.onopen = () => {
      console.log(`socket open`);
      this._sendHandshake(client).then(() => this._startPing(client));
    };
    client.onclose = (event: CloseEvent) => {
      console.error(`socket closed: ${event.code}, ${event.reason}`);
      this._cleanClient();
    };
    client.onerror = (event) => {
      console.error(`socket error`, event);
      this._cleanClient();
    };
    client.onmessage = (event: MessageEvent) => {
      const buf: ArrayBuffer = event.data;
      const bytes = new Uint8Array(buf)
        .reduce(
          (acc: number[][], val) => {
            if (val == 12) {
              return [...acc, []];
            } else {
              const [...a] = acc;
              a[a.length - 1].push(val);
              return [...a];
            }
          },
          [[]]
        )
        .filter((arr) => arr.length > 0)
        .map((arr) => {
          return this.decoder.decode(
            new Uint8Array(
              arr.length >= 2 && arr[0] === 27 && arr[1] === 9
                ? arr.slice(2)
                : arr
            )
          );
        });
      const command = bytes[0].slice(0, 4);
      console.debug(`socket message: (${command}): ${bytes}`);

      switch (command) {
        case '0005': {
          //eslint-disable-next-line
          const [_1, message, id, _2, _3, _4, nick] = bytes;
          if (this.onMessage) this.onMessage({ id, nick, message });
        }
      }
    };
  }

  private static _zerofill(data: string, length: number = 6): string {
    return '0'.repeat(Math.max(0, length - data.length)) + '' + data;
  }

  private _sendHandshake(client: WebSocket): Promise<void> {
    const chatNoLength = SoopChat._zerofill(
      '' + (this.encoder.encode(this.chatNo).byteLength + 6)
    );

    return new Promise((resolve) => {
      this._send(client, ['000100000600', '', '', '16', '']);
      setTimeout(() => {
        this._send(client, [
          `0002${chatNoLength}00`,
          this.chatNo,
          '',
          '',
          '',
          '',
          '',
        ]);
        resolve();
      }, 100);
    });
  }

  private _sendPing(client: WebSocket): void {
    this._send(client, ['000000000100', '']);
  }

  private _send(client: WebSocket, data: Array<string>) {
    client.send(this.encoder.encode(ESC + data.join(SEP)));
  }

  private _buildUrl({ CHANNEL }: PlayerLiveApiResponse): string {
    const { CHDOMAIN, CHPT, BJID, CHATNO } = CHANNEL;
    this.chatNo = CHATNO;
    return `wss://${CHDOMAIN}:${+CHPT + 1}/Websocket/${BJID}`;
  }

  private async _fetchStreamInfo(): Promise<PlayerLiveApiResponse> {
    const resp = await fetch('/proxy/afreeca/player_live_api.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `bid=${this.channelId}`,
    });
    return await resp.json();
  }
}

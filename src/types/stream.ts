export type ChatMessage = {
  id: string;
  nick: string;
  message: string;
};

export type StreamMeta = {
  id: string;
  nick: string;
  title: string;
  category: string;
  categoryTags: string[];
};

export type ChatQueryResponse = {
  message: string;
  results?: any;
};

export type ChatQueryMetadata = {
  suggestions?: string[];
};

export type ChatQuery = {
  id: string;
  session_id: string;
  tenant_id: string;
  user_id: string;
  query: string;
  response: string;
  status: "completed" | "success" | "failed";
  model: string;
  tokens_used: number;
  metadata: string;
  created_at: string;
  updated_at: string;
};

export type ParsedChatQuery = Omit<ChatQuery, 'response' | 'metadata'> & {
  response: ChatQueryResponse;
  metadata: ChatQueryMetadata;
};

export type ChatSession = {
  id: string;
  tenant_id: string;
  user_id: string;
  title: string;
  last_message: string;
  created_at: string;
  updated_at: string;
};

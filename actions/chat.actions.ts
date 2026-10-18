'use server';

import axios from 'axios';
import { auth, createServerAxios } from '@/utils/axios_server';
import { Response } from '@/types/response.types';
import {
  ChatQuery,
  ChatQueryMetadata,
  ChatQueryResponse,
  ChatSession,
  ParsedChatQuery,
} from '@/types/gpt-chats/gpt.type';


const isHtmlPayload = (value: string) => {
  return /<(!doctype|html|head|body|meta|link|script|style|div|span|title)\b/i.test(value);
};

const sanitizeMessage = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed || isHtmlPayload(trimmed)) {
    return undefined;
  }
  return trimmed;
};

const getBackendErrorMessage = (payload: unknown) => {
  if (typeof payload === 'string') {
    return sanitizeMessage(payload);
  }

  if (!payload || typeof payload !== 'object') {
    return undefined;
  }

  const record = payload as Record<string, unknown>;
  const errorValue = record.error ?? record.Error;

  if (typeof errorValue === 'string') {
    return sanitizeMessage(errorValue);
  }

  if (errorValue && typeof errorValue === 'object') {
    const errorRecord = errorValue as Record<string, unknown>;
    const errorMessage = errorRecord.message ?? errorRecord.Message;
    if (typeof errorMessage === 'string') {
      return sanitizeMessage(errorMessage);
    }
  }

  const message = record.message ?? record.Message;
  if (typeof message === 'string') {
    return sanitizeMessage(message);
  }

  return undefined;
};

const getErrorMessage = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    return getBackendErrorMessage(error.response?.data) ?? error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return getBackendErrorMessage(error);
};

const parseChatQueryResponse = (payload?: string): ChatQueryResponse => {
  if (!payload) {
    return { message: '' };
  }

  try {
    const parsed = JSON.parse(payload);
    if (typeof parsed === 'string') {
      return { message: parsed };
    }
    if (parsed && typeof parsed === 'object') {
      const normalized = parsed as ChatQueryResponse;
      return {
        message: typeof normalized.message === 'string'
          ? normalized.message
          : String(parsed),
        results: normalized.results,
      };
    }
    return { message: String(parsed) };
  } catch {
    return { message: payload };
  }
};

const parseChatQueryMetadata = (payload?: string): ChatQueryMetadata => {
  if (!payload) {
    return {};
  }

  try {
    const parsed = JSON.parse(payload);
    if (parsed && typeof parsed === 'object') {
      return parsed as ChatQueryMetadata;
    }
  } catch {
    // ignore
  }

  return {};
};

const extractRetryAfterMs = (message?: string): number | undefined => {
  if (!message) {
    return undefined;
  }

  const match = message.match(
    /(try again|retry) in\s*([\d.]+)\s*(ms|milliseconds?|s|seconds?|m|minutes?)/i,
  );

  if (!match) {
    return undefined;
  }

  const value = Number(match[2]);
  if (Number.isNaN(value)) {
    return undefined;
  }

  const unit = match[3].toLowerCase();
  if (unit.startsWith('ms') || unit.startsWith('millisecond')) {
    return Math.round(value);
  }
  if (unit.startsWith('s')) {
    return Math.round(value * 1000);
  }
  if (unit.startsWith('m')) {
    return Math.round(value * 60 * 1000);
  }

  return undefined;
};

export async function sendChatQuery(
  query: string,
  sessionId?: string,
): Promise<Response<ParsedChatQuery>> {
  try {
    const session = await auth();
    const axiosServer = createServerAxios(
      session?.accessToken as string,
      session?.user?.tenant_id as string,
      session?.user?.user_type
    );

    const payload: { query: string; session_id?: string } = { query };
    if (sessionId) {
      payload.session_id = sessionId;
    }

    const response = await axiosServer.post('/api/v1/ai/queries', payload);
    // console.log("chk chat response:", response)
    const rawData = response.data as ChatQuery;
    const chatResponse = parseChatQueryResponse(rawData.response);
    const chatMetadata = parseChatQueryMetadata(rawData.metadata);

    const parsedData: ParsedChatQuery = {
      ...rawData,
      response: chatResponse,
      metadata: chatMetadata,
    };

    if (parsedData?.status === 'failed') {
      const failureMessage = chatResponse.message || 'Query failed';
      return {
        success: false,
        data: parsedData,
        message: failureMessage,
        retryAfterMs: extractRetryAfterMs(failureMessage),
      };
    }

    return {
      success: true,
      data: parsedData,
      message: 'Query sent successfully',
    };
  } catch (error) {
    console.error('Error sending chat query:', error);
    const errorMessage = getErrorMessage(error) ?? 'Failed to send query';
    return {
      success: false,
      data: null as unknown as ParsedChatQuery,
      message: errorMessage,
      retryAfterMs: extractRetryAfterMs(errorMessage),
    };
  }
}

export async function createChatSession(
  title: string = 'New Chat'
): Promise<Response<ChatSession>> {
  try {
    const session = await auth();
    const axiosServer = createServerAxios(
      session?.accessToken as string,
      session?.user?.tenant_id as string,
      session?.user?.user_type
    );

    const response = await axiosServer.post('/api/v1/ai/sessions', { title });
    const data = response.data as ChatSession;

    return {
      success: true,
      data,
      message: 'Session created successfully',
    };
  } catch (error) {
    console.error('Error creating chat session:', error);
    return {
      success: false,
      data: null as unknown as ChatSession,
      message: getErrorMessage(error) ?? 'Failed to create session',
    };
  }
}

export async function getChatSessions(
  limit: number = 20,
  offset: number = 0
): Promise<Response<ChatSession[]>> {
  try {
    const session = await auth();
    const axiosServer = createServerAxios(
      session?.accessToken as string,
      session?.user?.tenant_id as string,
      session?.user?.user_type
    );

    const response = await axiosServer.get(`/api/v1/ai/sessions?limit=${limit}&offset=${offset}`);
    const data = response.data as ChatSession[];

    return {
      success: true,
      data,
      message: 'Sessions fetched successfully',
    };
  } catch (error) {
    console.error('Error fetching chat sessions:', error);
    return {
      success: false,
      data: [],
      message: getErrorMessage(error) ?? 'Failed to fetch sessions',
    };
  }
}

export async function getSessionQueries(
  sessionId: string
): Promise<Response<ParsedChatQuery[]>> {
  try {
    const session = await auth();
    const axiosServer = createServerAxios(
      session?.accessToken as string,
      session?.user?.tenant_id as string,
      session?.user?.user_type
    );

    const response = await axiosServer.get(`/api/v1/ai/sessions/${sessionId}/queries`);
    const rawData = response.data as ChatQuery[];

    const parsedData: ParsedChatQuery[] = rawData.map(item => ({
      ...item,
      response: JSON.parse(item.response),
      metadata: JSON.parse(item.metadata),
    }));

    return {
      success: true,
      data: parsedData,
      message: 'Queries fetched successfully',
    };
  } catch (error) {
    console.error('Error fetching session queries:', error);
    return {
      success: false,
      data: [],
      message: getErrorMessage(error) ?? 'Failed to fetch queries',
    };
  }
}

export async function updateChatSession(
  sessionId: string,
  title: string
): Promise<Response<ChatSession>> {
  try {
    const session = await auth();
    const axiosServer = createServerAxios(
      session?.accessToken as string,
      session?.user?.tenant_id as string,
      session?.user?.user_type
    );

    const response = await axiosServer.put(`/api/v1/ai/sessions/${sessionId}`, { title });
    const data = response.data as ChatSession;

    return {
      success: true,
      data,
      message: 'Session updated successfully',
    };
  } catch (error) {
    console.error('Error updating chat session:', error);
    return {
      success: false,
      data: null as unknown as ChatSession,
      message: getErrorMessage(error) ?? 'Failed to update session',
    };
  }
}

export async function deleteChatSession(
  sessionId: string
): Promise<Response<null>> {
  try {
    const session = await auth();
    const axiosServer = createServerAxios(
      session?.accessToken as string,
      session?.user?.tenant_id as string,
      session?.user?.user_type
    );

    const response = await axiosServer.delete(`/api/v1/ai/sessions/${sessionId}`);

    return {
      success: true,
      data: null,
      message: response.data?.message ?? 'Session deleted successfully',
    };
  } catch (error) {
    console.error('Error deleting chat session:', error);
    return {
      success: false,
      data: null,
      message: getErrorMessage(error) ?? 'Failed to delete session',
    };
  }
}

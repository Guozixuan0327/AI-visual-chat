/**
 * Qwen-VL API service — encapsulates Alibaba DashScope multimodal API calls.
 * Auth: DASHSCOPE_API_KEY env var
 */
import { logger } from '../utils/logger';

interface QwenContentPart { image?: string; text?: string; }
interface QwenMessage { role: 'user' | 'assistant' | 'system'; content: QwenContentPart[]; }
interface QwenResponse { output: { choices: Array<{ message: { role: string; content: Array<{ text: string }> | string } }> }; usage?: { input_tokens: number; output_tokens: number; total_tokens: number } }

export interface QwenCallParams {
  system: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string | Array<{ type: 'text'; text: string } | { type: 'image'; source: { type: 'base64'; media_type: 'image/jpeg'; data: string } }> }>;
  stream?: boolean;
}
export interface QwenCallResult { content: Array<{ type: 'text'; text: string }>; usage?: { input_tokens: number; output_tokens: number } }
export interface QwenStreamChunk { content: string; finish_reason?: string }

function getConfig() {
  const k = process.env.DASHSCOPE_API_KEY; if (!k) throw new Error('DASHSCOPE_API_KEY required');
  return { apiKey: k, endpoint: process.env.QWEN_VL_API_ENDPOINT || 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation', model: process.env.QWEN_VL_MODEL || 'qwen-vl-max' };
}
function buildMsgs(p: QwenCallParams): QwenMessage[] {
  const m: QwenMessage[] = [];
  if (p.system) m.push({ role: 'system', content: [{ text: p.system }] });
  for (const msg of p.messages) {
    const parts: QwenContentPart[] = [];
    if (typeof msg.content === 'string') parts.push({ text: msg.content });
    else for (const b of msg.content) { if (b.type === 'text') parts.push({ text: b.text }); else if (b.type === 'image') parts.push({ image: `data:${b.source.media_type};base64,${b.source.data}` }); }
    m.push({ role: msg.role, content: parts });
  }
  return m;
}
function extractText(raw: unknown): string {
  if (typeof raw === 'string') return raw;
  if (Array.isArray(raw) && raw.length > 0) {
    const f = raw[0] as Record<string, unknown>;
    if (f && typeof f.text === 'string') return f.text;
  }
  return '抱歉，我无法理解这个请求。';
}

export async function callQwen(params: QwenCallParams): Promise<QwenCallResult> {
  const c = getConfig(); const t0 = Date.now();
  const resp = await fetch(c.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + c.apiKey, 'X-DashScope-SSE': 'disable' }, body: JSON.stringify({ model: c.model, input: { messages: buildMsgs(params) }, parameters: { result_format: 'message', temperature: 0.7, max_tokens: 1500, top_p: 0.001 } }) });
  const ms = Date.now() - t0;
  if (!resp.ok) { const e = await resp.text(); logger.error('qwen_api_error', { status: resp.status, latencyMs: ms, body: e.substring(0, 500) }); throw new Error(`Qwen error ${resp.status}: ${e.substring(0, 200)}`); }
  const d = await resp.json() as QwenResponse;
  logger.info('qwen_api_call', { latencyMs: ms, inputTokens: d.usage?.input_tokens, outputTokens: d.usage?.output_tokens, model: c.model });
  return { content: [{ type: 'text', text: extractText(d.output.choices[0]?.message?.content) }], usage: d.usage ? { input_tokens: d.usage.input_tokens, output_tokens: d.usage.output_tokens } : undefined };
}

export async function* callQwenStream(params: QwenCallParams): AsyncGenerator<QwenStreamChunk, void, undefined> {
  const c = getConfig(); const t0 = Date.now();
  const resp = await fetch(c.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + c.apiKey, 'X-DashScope-SSE': 'enable', 'Accept': 'text/event-stream' }, body: JSON.stringify({ model: c.model, input: { messages: buildMsgs(params) }, parameters: { result_format: 'message', temperature: 0.7, max_tokens: 1500, top_p: 0.001, incremental_output: true } }) });
  if (!resp.ok) { logger.error('qwen_stream_error', { status: resp.status }); yield { content: 'Error: ' + resp.status }; return; }
  const reader = resp.body?.getReader(); if (!reader) { yield { content: 'Error: no body' }; return; }
  const dec = new TextDecoder(); let buf = ''; let tot = '';
  try {
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      buf += dec.decode(value, { stream: true }); const lines = buf.split('\n'); buf = lines.pop() || '';
      for (const line of lines) {
        const t = line.trim(); if (!t || t.startsWith(':')) continue;
        if (t.startsWith('data:')) {
          const js = t.slice(5).trim(); if (js === '[DONE]') return;
          try { const p = JSON.parse(js); const delta = extractText(p.output?.choices?.[0]?.message?.content || p.choices?.[0]?.delta?.content || ''); if (delta) { tot += delta; yield { content: delta }; } } catch { /* skip */ }
        }
      }
    }
  } finally { reader.releaseLock(); logger.info('qwen_stream_complete', { latencyMs: Date.now() - t0, outputLen: tot.length, model: c.model }); }
}

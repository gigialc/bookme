import { GRANOLA_MCP_URL } from "./granola-oauth";
import type { GranolaNote } from "./granola";

/**
 * Minimal MCP client (Streamable HTTP) for the Granola MCP server.
 * Speaks just enough JSON-RPC to initialize, list tools, and call them.
 */

type Rpc = { id?: number; result?: unknown; error?: { message?: string } };

async function post(
  token: string,
  sessionId: string | null,
  body: object
): Promise<{ rpc: Rpc | null; sessionId: string | null }> {
  const res = await fetch(GRANOLA_MCP_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      "MCP-Protocol-Version": "2025-06-18",
      ...(sessionId ? { "Mcp-Session-Id": sessionId } : {}),
    },
    body: JSON.stringify(body),
  });
  if (res.status === 401) throw new Error("granola_unauthorized");
  const newSession = res.headers.get("mcp-session-id") ?? sessionId;
  if (res.status === 202 || res.status === 204) return { rpc: null, sessionId: newSession };
  if (!res.ok) throw new Error(`granola_mcp_${res.status}`);

  const contentType = res.headers.get("content-type") ?? "";
  const text = await res.text();
  let rpc: Rpc | null = null;
  if (contentType.includes("text/event-stream")) {
    // Take the last data: line that parses as our JSON-RPC response.
    for (const line of text.split("\n")) {
      if (!line.startsWith("data:")) continue;
      try {
        const parsed = JSON.parse(line.slice(5).trim());
        if (parsed && (parsed.result !== undefined || parsed.error !== undefined)) rpc = parsed;
      } catch {
        /* keep scanning */
      }
    }
  } else if (text.trim()) {
    rpc = JSON.parse(text);
  }
  if (rpc?.error) throw new Error(rpc.error.message || "granola_mcp_error");
  return { rpc, sessionId: newSession };
}

type ToolDef = { name: string; inputSchema?: { properties?: Record<string, unknown> } };

class GranolaMcp {
  private sessionId: string | null = null;
  private nextId = 1;
  tools: ToolDef[] = [];

  constructor(private token: string) {}

  private async call(method: string, params?: object): Promise<unknown> {
    const { rpc, sessionId } = await post(this.token, this.sessionId, {
      jsonrpc: "2.0",
      id: this.nextId++,
      method,
      ...(params ? { params } : {}),
    });
    this.sessionId = sessionId;
    return rpc?.result;
  }

  async connect(): Promise<void> {
    await this.call("initialize", {
      protocolVersion: "2025-06-18",
      capabilities: {},
      clientInfo: { name: "bookme", version: "1.0.0" },
    });
    await post(this.token, this.sessionId, {
      jsonrpc: "2.0",
      method: "notifications/initialized",
    }).catch(() => {});
    const result = (await this.call("tools/list")) as { tools?: ToolDef[] } | undefined;
    this.tools = result?.tools ?? [];
  }

  findTool(...names: string[]): ToolDef | null {
    for (const n of names) {
      const t = this.tools.find((t) => t.name === n);
      if (t) return t;
    }
    return null;
  }

  /** Call a tool and return its text content (joined). */
  async callTool(name: string, args: Record<string, unknown>): Promise<string> {
    const result = (await this.call("tools/call", { name, arguments: args })) as
      | { content?: { type: string; text?: string }[]; isError?: boolean }
      | undefined;
    const text = (result?.content ?? [])
      .filter((c) => c.type === "text" && c.text)
      .map((c) => c.text)
      .join("\n");
    if (result?.isError) throw new Error(text || "granola_tool_error");
    return text;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function tryJson(text: string): any {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function asMeetingArray(parsed: any): any[] {
  if (Array.isArray(parsed)) return parsed;
  if (!parsed || typeof parsed !== "object") return [];
  for (const key of ["meetings", "notes", "documents", "results", "items", "data"]) {
    if (Array.isArray(parsed[key])) return parsed[key];
  }
  return [];
}

/** Fetch recent meetings with their note content via Granola's MCP server. */
export async function fetchGranolaNotesViaMcp(
  token: string,
  sinceIso: string
): Promise<GranolaNote[]> {
  const mcp = new GranolaMcp(token);
  await mcp.connect();

  const listTool = mcp.findTool("list_meetings", "list_notes");
  if (!listTool) throw new Error("granola_no_list_tool");

  const listProps = listTool.inputSchema?.properties ?? {};
  const listArgs: Record<string, unknown> = {};
  if ("created_after" in listProps) listArgs.created_after = sinceIso;
  if ("start_date" in listProps) listArgs.start_date = sinceIso;
  if ("limit" in listProps) listArgs.limit = 25;

  const listText = await mcp.callTool(listTool.name, listArgs);
  const meetings = asMeetingArray(tryJson(listText));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const idOf = (m: any) => m?.id ?? m?.meeting_id ?? m?.document_id ?? m?.note_id ?? null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const titleOf = (m: any) => m?.title ?? m?.name ?? null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dateOf = (m: any) =>
    m?.created_at ?? m?.date ?? m?.start_time ?? m?.start ?? m?.timestamp ?? null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const contentOf = (m: any) =>
    m?.summary ?? m?.notes ?? m?.content ?? m?.markdown ?? m?.text ?? null;

  const stubs = meetings
    .map((m) => ({ id: idOf(m), title: titleOf(m), created_at: dateOf(m), summary: contentOf(m), raw: m }))
    .filter((m) => m.id)
    .filter((m) => !m.created_at || new Date(m.created_at) >= new Date(sinceIso))
    .slice(0, 15);

  const getTool = mcp.findTool("get_meetings", "get_meeting", "get_notes", "get_note");
  const notes: GranolaNote[] = [];

  for (const stub of stubs) {
    let summary: string | null = typeof stub.summary === "string" ? stub.summary : null;
    if (!summary && getTool) {
      const props = getTool.inputSchema?.properties ?? {};
      let args: Record<string, unknown>;
      if ("meeting_ids" in props) args = { meeting_ids: [stub.id] };
      else if ("ids" in props) args = { ids: [stub.id] };
      else if ("meeting_id" in props) args = { meeting_id: stub.id };
      else if ("note_id" in props) args = { note_id: stub.id };
      else args = { id: stub.id };
      try {
        const text = await mcp.callTool(getTool.name, args);
        const parsed = tryJson(text);
        if (parsed) {
          const arr = asMeetingArray(parsed);
          const doc = arr.length > 0 ? arr[0] : parsed;
          summary = contentOf(doc) ?? text;
        } else {
          summary = text;
        }
      } catch {
        summary = null;
      }
    }
    if (!summary) continue;
    notes.push({
      id: String(stub.id),
      title: stub.title,
      created_at: stub.created_at,
      summary,
    });
  }
  return notes;
}

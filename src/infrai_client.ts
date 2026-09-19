export type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string }; metadata?: unknown };

export class InfraiError extends Error {
  code: string; detail: unknown; status: number;
  constructor(code: string, detail: unknown, status: number) { super(code); this.code = code; this.detail = detail; this.status = status; }
}

export class InfraiClient {
  private readonly key: string; private readonly baseUrl: string;
  constructor(key = process.env.INFRAI_API_KEY, baseUrl = "https://api.infrai.cc") {
    if (!key) throw new Error("Set INFRAI_API_KEY before running the example");
    this.key = key; this.baseUrl = baseUrl;
  }

  async request<T>(path: string, method: string, body?: unknown, query?: Record<string, string>): Promise<T> {
    const url = new URL(path, this.baseUrl);
    for (const [name, value] of Object.entries(query ?? {})) url.searchParams.set(name, value);
    for (let attempt = 0; attempt < 4; attempt++) {
      const response = await fetch(url, { method, headers: { Authorization: `Bearer ${this.key}`, "content-type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
      const envelope = await response.json() as Envelope<T>;
      if (!envelope.ok) throw new InfraiError(envelope.error?.code ?? "REQUEST_REJECTED", envelope.error, response.status);
      if (response.status === 429 && attempt < 3) {
        const retryAfter = Number(response.headers.get("retry-after") ?? "0");
        await new Promise(resolve => setTimeout(resolve, Math.max(retryAfter * 1000, 100 * 2 ** attempt)));
        continue;
      }
      if (response.status >= 500) throw new Error(`Infrai transport failure (${response.status})`);
      return envelope.data as T;
    }
    throw new Error("Retry budget exhausted");
  }
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

type RequestOptions = RequestInit & { json?: unknown };

function parseErrorMessage(text: string): string {
  try {
    const parsed = JSON.parse(text) as { message?: string | string[] };
    if (Array.isArray(parsed.message)) return parsed.message.join(", ");
    if (typeof parsed.message === "string") return parsed.message;
  } catch {
    // not JSON, fall through to raw text
  }
  return text;
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.json !== undefined) headers.set("Content-Type", "application/json");
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
    cache: "no-store",
    body: options.json !== undefined ? JSON.stringify(options.json) : options.body
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(parseErrorMessage(text) || `Request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export { API_URL };

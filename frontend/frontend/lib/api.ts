const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:3000/api";

type ApiErrorResponse = {
  message?: string;
};

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers);

  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    credentials: "include",
    headers,
  });

  const contentType = response.headers.get("content-type");

  const data: unknown = contentType?.includes("application/json")
    ? await response.json()
    : null;

  if (!response.ok) {
    const errorData = data as ApiErrorResponse | null;

    throw new Error(
      errorData?.message ??
        `Request failed with status ${response.status}`
    );
  }

  return data as T;
}
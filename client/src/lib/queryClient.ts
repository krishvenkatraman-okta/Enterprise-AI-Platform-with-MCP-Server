import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Import the auth service to get headers
let getAuthHeaders: () => Record<string, string>;

// We'll set this after the auth module loads to avoid circular imports
export function setAuthHeadersGetter(fn: () => Record<string, string>) {
  getAuthHeaders = fn;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const headers: Record<string, string> = data ? { "Content-Type": "application/json" } : {};
  
  // Add authentication headers if available
  if (getAuthHeaders) {
    Object.assign(headers, getAuthHeaders());
  }

  // For inventory requests, use application token if available
  if (url.includes('/api/jarvis/inventory')) {
    const appToken = localStorage.getItem('application_token');
    if (appToken) {
      headers['X-Application-Token'] = appToken;
    }
  }

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const headers: Record<string, string> = {};
    
    // Add authentication headers if available
    if (getAuthHeaders) {
      Object.assign(headers, getAuthHeaders());
    }

    // For inventory requests, use application token if available
    const queryUrl = queryKey.join("/");
    if (queryUrl.includes('/api/jarvis/inventory')) {
      const appToken = localStorage.getItem('application_token');
      if (appToken) {
        headers['X-Application-Token'] = appToken;
      }
    }

    const res = await fetch(queryUrl as string, {
      headers,
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

const API_URL = ((import.meta as any).env?.VITE_API_URL || 'http://localhost:3000') + '/api';

interface ApiConfig extends Omit<RequestInit, 'body'> {
  body?: any;
}

export async function apiClient<T>(
  endpoint: string,
  { body, ...customConfig }: ApiConfig = {}
): Promise<T> {
  const headers = { 'Content-Type': 'application/json' };
  const config: RequestInit = {
    method: body ? 'POST' : 'GET',
    ...customConfig,
    headers: {
      ...headers,
      ...customConfig.headers,
    },
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_URL}${endpoint}`, config);
  let data: any;
  
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch (e) {
      const text = await response.text();
      throw new Error(`Invalid JSON response (${response.status}): ${text.substring(0, 100)}`);
    }
  } else {
    const text = await response.text();
    throw new Error(`Server Error (${response.status}): ${text.substring(0, 100) || 'No response body'}`);
  }

  if (response.ok) {
    return data;
  } else {
    const timestamp = new Date().toLocaleTimeString();
    throw new Error(`[${timestamp}] ${data.error || data.message || 'Action failed'}`);
  }
}

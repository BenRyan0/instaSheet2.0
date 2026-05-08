import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

// axios-mock-adapter patches the default axios instance; we need to intercept
// the module-level `api` instance created inside client.ts. The simplest way
// is to import the exported api methods and drive them through a mock adapter
// attached to axios itself (axios.create shares the same adapter infrastructure
// when mocked at the axios level via MockAdapter's second argument).

// We re-import the module after setting up localStorage so the interceptors
// pick up the right token.
const TOKEN = 'test.jwt.token';

describe('authApi', () => {
  let mock: MockAdapter;

  beforeEach(async () => {
    // Fresh localStorage state
    localStorage.clear();

    // Import the module fresh each test group so interceptors are wired
    mock = new MockAdapter(axios);
  });

  afterEach(() => {
    mock.restore();
    vi.resetModules();
  });

  it('login calls POST /api/auth/login with credentials', async () => {
    const { authApi } = await import('../../api/client');

    mock.onPost('/api/auth/login').reply(200, {
      success: true,
      data: { token: TOKEN, username: 'admin', status: 'active' },
    });

    const result = await authApi.login('admin', 'password123');
    expect(result.data.token).toBe(TOKEN);
    expect(result.data.username).toBe('admin');
  });

  it('status calls GET /api/auth/status', async () => {
    const { authApi } = await import('../../api/client');

    mock.onGet('/api/auth/status').reply(200, {
      success: true,
      data: { hasUsers: true },
    });

    const result = await authApi.status();
    expect(result.data.hasUsers).toBe(true);
  });
});

describe('JWT request interceptor', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(axios);
  });

  afterEach(() => {
    mock.restore();
    vi.resetModules();
    localStorage.clear();
  });

  it('attaches Authorization header when a token is in localStorage', async () => {
    localStorage.setItem('token', TOKEN);

    const { authApi } = await import('../../api/client');

    let capturedHeader: string | undefined;
    mock.onGet('/api/auth/status').reply((config) => {
      capturedHeader = config.headers?.Authorization as string | undefined;
      return [200, { success: true, data: { hasUsers: true } }];
    });

    await authApi.status();
    expect(capturedHeader).toBe(`Bearer ${TOKEN}`);
  });

  it('sends no Authorization header when localStorage has no token', async () => {
    const { authApi } = await import('../../api/client');

    let capturedHeader: string | undefined;
    mock.onGet('/api/auth/status').reply((config) => {
      capturedHeader = config.headers?.Authorization as string | undefined;
      return [200, { success: true, data: { hasUsers: false } }];
    });

    await authApi.status();
    expect(capturedHeader).toBeUndefined();
  });
});

describe('401 response interceptor', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(axios);
    localStorage.setItem('token', TOKEN);
    localStorage.setItem('username', 'admin');
  });

  afterEach(() => {
    mock.restore();
    vi.resetModules();
    localStorage.clear();
  });

  it('clears localStorage on a 401 response', async () => {
    const { authApi } = await import('../../api/client');

    mock.onGet('/api/auth/status').reply(401, { success: false, message: 'Unauthorized' });

    await authApi.status().catch(() => {});

    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('username')).toBeNull();
  });
});

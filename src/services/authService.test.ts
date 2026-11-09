import assert from 'node:assert/strict';
import test from 'node:test';
import { AuthRequestError, loginAccount } from './authService';

const originalFetch = globalThis.fetch;

function mockFetch(response: Response): void {
  globalThis.fetch = (async () => response) as unknown as typeof fetch;
}

async function restore<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } finally {
    globalThis.fetch = originalFetch;
  }
}

test('loginAccount maps a successful Django response to the app user shape', async () => {
  mockFetch(
    new Response(
      JSON.stringify({
        token: 'abc123',
        user: {
          id: 7,
          username: 'ada',
          email: 'ada@example.com',
          first_name: 'Ada',
          last_name: 'Lovelace',
          display_name: 'Ada Lovelace',
          photo_url: '',
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    ),
  );

  await restore(async () => {
    const session = await loginAccount('ada@example.com', 'ScholarFind-2026!x');
    assert.equal(session.token, 'abc123');
    assert.equal(session.user.id, 7);
    assert.equal(session.user.displayName, 'Ada Lovelace');
    assert.equal(session.user.photoURL, undefined);
  });
});

test('loginAccount surfaces field errors from DRF', async () => {
  mockFetch(
    new Response(JSON.stringify({ identifier: ['This field is required.'] }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    }),
  );

  await restore(async () => {
    await assert.rejects(
      loginAccount('', 'ScholarFind-2026!x'),
      (error: unknown) =>
        error instanceof AuthRequestError &&
        error.status === 400 &&
        error.fieldErrors.identifier === 'This field is required.',
    );
  });
});

test('loginAccount uses a generic message for a detail response', async () => {
  mockFetch(
    new Response(JSON.stringify({ detail: 'Invalid email or password.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    }),
  );

  await restore(async () => {
    await assert.rejects(
      loginAccount('ada@example.com', 'wrong'),
      (error: unknown) =>
        error instanceof AuthRequestError &&
        error.message === 'Invalid email or password.' &&
        Object.keys(error.fieldErrors).length === 0,
    );
  });
});

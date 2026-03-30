import { describe, it, expect } from 'vitest';

const API_URL = 'https://0001.dev/api/contact';

describe('Contact Form API', () => {
  it('should submit form with all fields', async () => {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Vitest User',
        company: 'Vitest Company',
        email: 'vitest@test.com',
        phone: '+45 99 88 77 66',
        message: 'Test message from vitest',
        topics: ['Security'],
        techstack: ['React'],
      }),
    });

    const data = await response.json();
    expect(response.ok).toBe(true);
    expect(data.success).toBe(true);
  });

  it('should submit form without optional fields', async () => {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Minimal User',
        email: 'minimal@test.com',
        message: 'Minimal test',
        topics: [],
        techstack: [],
      }),
    });

    const data = await response.json();
    expect(response.ok).toBe(true);
    expect(data.success).toBe(true);
  });

  it('should fail without required name field', async () => {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'noname@test.com',
        message: 'No name test',
        topics: [],
        techstack: [],
      }),
    });

    expect(response.ok).toBe(false);
    expect(response.status).toBe(400);
  });

  it('should fail without required email field', async () => {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'No Email User',
        message: 'No email test',
        topics: [],
        techstack: [],
      }),
    });

    expect(response.ok).toBe(false);
    expect(response.status).toBe(400);
  });

  it('should submit with multiple services and tech stack', async () => {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Multi Service User',
        company: 'Multi Corp',
        email: 'multi@test.com',
        message: 'Testing multiple selections',
        topics: ['Security', 'API development', 'MCP'],
        techstack: ['React', 'Node', 'AWS'],
      }),
    });

    const data = await response.json();
    expect(response.ok).toBe(true);
    expect(data.success).toBe(true);
  });
});

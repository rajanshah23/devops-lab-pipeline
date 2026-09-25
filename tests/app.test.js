const request = require('supertest');
const app = require('../src/app');

beforeEach(() => app.__reset());


describe('probes', () => {
  it('GET /health returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('GET /ready returns ready', async () => {
    const res = await request(app).get('/ready');
    expect(res.status).toBe(200);
  });
});



describe('metrics', () => {
  it('GET /metrics exposes prometheus format', async () => {
    const res = await request(app).get('/metrics');
    expect(res.status).toBe(200);
    expect(res.text).toContain('http_requests_total');
    expect(res.text).toContain('nodejs_');
  });
});


describe('tasks API', () => {
  it('starts empty', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.body).toEqual([]);
  });

  it('creates a task', async () => {
    const res = await request(app).post('/api/tasks').send({ title: 'write runbook' });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ id: 1, title: 'write runbook', done: false });
  });

  it('rejects an empty title', async () => {
    const res = await request(app).post('/api/tasks').send({ title: '   ' });
    expect(res.status).toBe(400);
  });

  it('deletes a task', async () => {
    await request(app).post('/api/tasks').send({ title: 'temp' });
    const res = await request(app).delete('/api/tasks/1');
    expect(res.status).toBe(204);
    const list = await request(app).get('/api/tasks');
    expect(list.body).toHaveLength(0);
  });

  it('404s on missing task', async () => {
    const res = await request(app).delete('/api/tasks/999');
    expect(res.status).toBe(404);
  });
});
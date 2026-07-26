const test = require('node:test');
const assert = require('node:assert');
const app = require('../src/app');

test('GET /api/health returns 200 and success payload', async (t) => {
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const res = await fetch(`http://localhost:${port}/api/health`);
    assert.strictEqual(res.status, 200);
    
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.message, 'EduTrack API server is healthy');
    assert.ok(body.data.timestamp);
    assert.ok(body.data.uptime);
  } finally {
    server.close();
  }
});

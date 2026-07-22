import request from 'supertest';
import app from '../../app.js';
import db from '../../config/database.js';

describe('Health Routes', () => {
  describe('GET /api/health', () => {
    it('should return health status with database connection', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('database');
      expect(response.body.database).toBe('connected');
      expect(response.body).toHaveProperty('version', '1.0.0');
    });
  });

  describe('GET /api/health/db', () => {
    it('should return database information', async () => {
      const response = await request(app)
        .get('/api/health/db')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('tables');
      expect(response.body.tables).toBeGreaterThan(0);
      expect(response.body).toHaveProperty('row_counts');
      expect(Array.isArray(response.body.row_counts)).toBe(true);
    });
  });

  describe('GET / (root)', () => {
    it('should return API information', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Mobius Ledger v2 API');
      expect(response.body).toHaveProperty('version', '1.0.0');
      expect(response.body).toHaveProperty('docs', '/api/health');
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/api/unknown')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Not Found');
      expect(response.body).toHaveProperty('message');
    });
  });
});

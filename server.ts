/**
 * Bike Workshop Manager - Express + Vite Full-Stack Server
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // Serve static assets from public folder with correct MIME types
  app.use(express.static(path.join(process.cwd(), 'public'), {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.wasm')) {
        res.setHeader('Content-Type', 'application/wasm');
      }
    }
  }));

  // API Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      appName: 'Bike Workshop Manager',
      offline: true,
      timestamp: new Date().toISOString()
    });
  });

  // Backup file export download endpoint for web
  app.post('/api/backup/export', (req, res) => {
    try {
      const { data } = req.body;
      if (!data) return res.status(400).json({ error: 'No backup data provided' });
      const buffer = Buffer.from(data);
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename=bike_workshop_backup_${Date.now()}.db`);
      res.send(buffer);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Bike Workshop Manager] Server running on http://localhost:${PORT}`);
  });
}

startServer();

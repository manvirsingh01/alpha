require('dotenv').config();
const express = require('express');
const path = require('path');
const http = require('http');
const os = require('os');

const app = express();
const server = http.createServer(app);
const port = 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Import routers
const virusTotalRouter = require('./routes/virustotal');
const tempServicesRouter = require('./routes/tempservices');
const pcapRouter = require('./routes/pcap');

// Mount routers
app.use('/api/vt', virusTotalRouter);
app.use('/api/temp', tempServicesRouter);
app.use('/api/pcap', pcapRouter);

// Route for the home page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// WebSocket and Terminal - ONLY if not on Vercel
if (!process.env.VERCEL) {
  try {
    const { Server } = require('socket.io');
    const io = new Server(server);

    // Make io accessible to routes
    app.set('io', io);

    const pty = require('node-pty');
    const terminals = {};
    const logs = {};

    io.on('connection', (socket) => {
      console.log('Client connected to terminal');

      socket.on('create-terminal', () => {
        // Determine shell based on OS
        const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';

        try {
          // Create pseudo-terminal
          const term = pty.spawn(shell, [], {
            name: 'xterm-color',
            cols: 80,
            rows: 24,
            cwd: process.env.HOME,
            env: process.env
          });

          const termId = term.pid;
          terminals[termId] = term;
          logs[termId] = '';

          // Send terminal ID to client
          socket.emit('terminal-created', termId);

          // Handle terminal output
          term.on('data', (data) => {
            logs[termId] += data;
            socket.emit('terminal-output', data);
          });

          // Handle terminal exit
          term.on('exit', () => {
            socket.emit('terminal-exit');
            delete terminals[termId];
            delete logs[termId];
          });

          // Handle input from client
          socket.on('terminal-input', (data) => {
            if (terminals[termId]) {
              terminals[termId].write(data);
            }
          });

          // Handle resize
          socket.on('terminal-resize', (size) => {
            if (terminals[termId]) {
              terminals[termId].resize(size.cols, size.rows);
            }
          });

          // Clean up on disconnect
          socket.on('disconnect', () => {
            if (terminals[termId]) {
              terminals[termId].kill();
              delete terminals[termId];
              delete logs[termId];
            }
          });
        } catch (err) {
          console.error('Failed to spawn terminal:', err);
          socket.emit('terminal-error', 'Failed to create terminal process');
        }
      });
    });
  } catch (err) {
    console.warn('WebSocket or node-pty not available:', err.message);
    // Mock io for routes if initialization failed
    app.set('io', { emit: () => { } });
  }
} else {
  // Mock io for Vercel to prevent crashes in routes
  app.set('io', { emit: () => { } });
}

// Start server
if (require.main === module) {
  server.listen(port, () => {
    console.log(`Cyber Security Tools Portal listening at http://localhost:${port}`);
  });
}

module.exports = app;

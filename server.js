require('dotenv').config();
const express = require('express');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const os = require('os');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const port = 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Import routers
const virusTotalRouter = require('./routes/virustotal');
const tempServicesRouter = require('./routes/tempservices');
const pcapRouter = require('./routes/pcap');

// Make io accessible to routes
app.set('io', io);

// Mount routers
app.use('/api/vt', virusTotalRouter);
app.use('/api/temp', tempServicesRouter);
app.use('/api/pcap', pcapRouter);

// Route for the home page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// WebSocket for terminal - ONLY if not on Vercel
if (!process.env.VERCEL) {
  try {
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
    console.warn('node-pty not available, terminal features disabled');
  }
}

if (require.main === module) {
  server.listen(port, () => {
    console.log(`Cyber Security Tools Portal listening at http://localhost:${port}`);
  });
}

module.exports = app;

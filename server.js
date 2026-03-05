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

// CORS Middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Import routers with error handling
let virusTotalRouter;
let tempServicesRouter;
let pcapRouter;

try {
  virusTotalRouter = require('./routes/virustotal');
} catch (error) {
  console.error('Failed to load VirusTotal router:', error.message);
}

try {
  tempServicesRouter = require('./routes/tempservices');
} catch (error) {
  console.error('Failed to load Temp Services router:', error.message);
}

try {
  pcapRouter = require('./routes/pcap');
} catch (error) {
  console.error('Failed to load PCAP router:', error.message);
}

// Mount routers if available
if (virusTotalRouter) {
  app.use('/api/vt', virusTotalRouter);
} else {
  app.use('/api/vt', (req, res) => res.status(503).json({ error: 'Service unavailable' }));
}

if (tempServicesRouter) {
  app.use('/api/temp', tempServicesRouter);
} else {
  app.use('/api/temp', (req, res) => res.status(503).json({ error: 'Service unavailable' }));
}

if (pcapRouter) {
  app.use('/api/pcap', pcapRouter);
} else {
  app.use('/api/pcap', (req, res) => res.status(503).json({ error: 'Service unavailable' }));
}

// Route for the home page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// WebSocket - ONLY if not on Vercel
// On Vercel, we don't initialize Socket.IO server-side to avoid 500 errors
// The terminal is now fully client-side simulated, so it doesn't need this.
if (!process.env.VERCEL) {
  try {
    const { Server } = require('socket.io');
    const io = new Server(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    // Make io accessible to routes (e.g. for PCAP streaming)
    app.set('io', io);

    // Import node-pty
    const pty = require('node-pty');

    io.on('connection', (socket) => {
      console.log('Client connected');

      let currentProcess = null;
      let sshClient = null;
      let sshStream = null;

      // Handle local shell connection
      socket.on('connect-local', () => {
        if (currentProcess) {
          currentProcess.kill();
          currentProcess = null;
        }
        if (sshClient) {
          sshClient.end();
          sshClient = null;
        }

        const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';
        currentProcess = pty.spawn(shell, [], {
          name: 'xterm-color',
          cols: 80,
          rows: 24,
          cwd: process.env.HOME,
          env: process.env
        });

        currentProcess.on('data', (data) => {
          socket.emit('output', data);
        });

        socket.emit('connected', { type: 'local' });
      });

      // Handle SSH connection
      socket.on('connect-ssh', (config) => {
        console.log('SSH connection request:', config.host, config.username);
        
        if (currentProcess) {
          currentProcess.kill();
          currentProcess = null;
        }
        if (sshClient) {
          sshClient.end();
          sshClient = null;
        }

        const { Client } = require('ssh2');
        sshClient = new Client();

        sshClient.on('ready', () => {
          console.log('SSH connection established');
          socket.emit('output', '\x1b[1;32mSSH Connection Established!\x1b[0m\r\n');
          
          sshClient.shell({ term: 'xterm-color', cols: 80, rows: 24 }, (err, stream) => {
            if (err) {
              socket.emit('output', `\x1b[1;31mShell error: ${err.message}\x1b[0m\r\n`);
              return;
            }
            
            sshStream = stream;
            socket.emit('connected', { type: 'ssh', host: config.host });

            stream.on('data', (data) => {
              socket.emit('output', data.toString());
            });

            stream.stderr.on('data', (data) => {
              socket.emit('output', data.toString());
            });

            stream.on('close', () => {
              socket.emit('output', '\r\n\x1b[1;33mSSH Connection Closed\x1b[0m\r\n');
              socket.emit('disconnected');
              sshClient.end();
              sshClient = null;
              sshStream = null;
            });
          });
        });

        sshClient.on('error', (err) => {
          console.error('SSH error:', err.message);
          socket.emit('output', `\x1b[1;31mSSH Error: ${err.message}\x1b[0m\r\n`);
          socket.emit('ssh-error', { message: err.message });
        });

        // Build connection config
        const sshConfig = {
          host: config.host,
          port: config.port || 22,
          username: config.username,
          readyTimeout: 10000
        };

        if (config.password) {
          sshConfig.password = config.password;
        }
        if (config.privateKey) {
          sshConfig.privateKey = config.privateKey;
        }

        socket.emit('output', `\x1b[1;33mConnecting to ${config.host}:${config.port || 22}...\x1b[0m\r\n`);
        
        try {
          sshClient.connect(sshConfig);
        } catch (err) {
          socket.emit('output', `\x1b[1;31mConnection failed: ${err.message}\x1b[0m\r\n`);
        }
      });

      // Handle input
      socket.on('input', (data) => {
        if (sshStream) {
          sshStream.write(data);
        } else if (currentProcess) {
          currentProcess.write(data);
        }
      });

      // Handle resize
      socket.on('resize', (size) => {
        if (sshStream) {
          sshStream.setWindow(size.rows, size.cols, 480, 640);
        }
        if (currentProcess) {
          currentProcess.resize(size.cols, size.rows);
        }
      });

      // Handle disconnect SSH
      socket.on('disconnect-ssh', () => {
        if (sshClient) {
          sshClient.end();
          sshClient = null;
          sshStream = null;
        }
      });

      // Cleanup on socket disconnect
      socket.on('disconnect', () => {
        console.log('Client disconnected');
        if (currentProcess) {
          currentProcess.kill();
        }
        if (sshClient) {
          sshClient.end();
        }
      });
    });
  } catch (err) {
    console.warn('WebSocket initialization failed:', err.message);
    app.set('io', { emit: () => { } });
  }
} else {
  // Mock io for Vercel to prevent crashes in routes that try to use req.app.get('io')
  app.set('io', { emit: () => { } });
}

// Start server
if (require.main === module) {
  server.listen(port, '0.0.0.0', () => {
    console.log(`Cyber Security Tools Portal listening at http://0.0.0.0:${port}`);
    console.log(`Access from network: http://<YOUR_IP>:${port}`);
  });
}

module.exports = app;

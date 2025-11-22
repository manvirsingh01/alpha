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

// WebSocket and Terminal - Simulated Environment
try {
  const { Server } = require('socket.io');
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Make io accessible to routes
  app.set('io', io);

  const terminals = {};

  // Simple in-memory file system
  const fileSystem = {
    '/root': {
      type: 'dir',
      children: {
        'Documents': { type: 'dir', children: {} },
        'Downloads': { type: 'dir', children: {} },
        'Tools': { type: 'dir', children: {} },
        'scan_report.pdf': { type: 'file' },
        'notes.txt': { type: 'file' }
      }
    }
  };

  io.on('connection', (socket) => {
    console.log('Client connected to terminal');

    socket.on('create-terminal', () => {
      const termId = socket.id;

      // Initialize simulated terminal state
      terminals[termId] = {
        cwd: '/root',
        history: [],
        buffer: ''
      };

      // Send terminal ID to client
      socket.emit('terminal-created', termId);

      // Send welcome message
      const welcome = '\r\n\x1b[1;32mWelcome to CyberSec Portal Terminal v1.0\x1b[0m\r\nType \x1b[1;34mhelp\x1b[0m for available commands.\r\n\r\nroot@kali:~# ';
      socket.emit('terminal-output', welcome);

      // Handle input from client
      socket.on('terminal-input', (data) => {
        const term = terminals[termId];
        if (!term) return;

        // Simple character handling
        if (data === '\r') { // Enter key
          const command = term.buffer.trim();
          socket.emit('terminal-output', '\r\n');

          if (command) {
            handleCommand(socket, command, term);
          } else {
            socket.emit('terminal-output', `root@kali:${term.cwd}# `);
          }
          term.buffer = '';
        } else if (data === '\u007F') { // Backspace
          if (term.buffer.length > 0) {
            term.buffer = term.buffer.slice(0, -1);
            socket.emit('terminal-output', '\b \b');
          }
        } else {
          term.buffer += data;
          socket.emit('terminal-output', data);
        }
      });

      // Clean up on disconnect
      socket.on('disconnect', () => {
        delete terminals[termId];
      });
    });
  });

  // Helper to resolve path
  function resolvePath(cwd, target) {
    if (!target) return cwd;

    let parts;
    if (target.startsWith('/')) {
      parts = target.split('/').filter(p => p);
    } else {
      const cwdParts = cwd.split('/').filter(p => p);
      const targetParts = target.split('/').filter(p => p);
      parts = [...cwdParts, ...targetParts];
    }

    const stack = [];
    for (const part of parts) {
      if (part === '.') continue;
      if (part === '..') {
        stack.pop();
      } else {
        stack.push(part);
      }
    }

    return '/' + stack.join('/');
  }

  // Helper to get directory object from path
  function getDir(path) {
    if (path === '/') return { type: 'dir', children: fileSystem };

    // Root is the base of our visible FS
    if (path === '/root') return fileSystem['/root'];

    // Traverse from root
    // We assume everything is under /root for this simulation unless it's the root itself
    if (path.startsWith('/root/')) {
      const parts = path.split('/').slice(2); // Remove empty and root
      let current = fileSystem['/root'];
      for (const part of parts) {
        if (current && current.children && current.children[part]) {
          current = current.children[part];
        } else {
          return null;
        }
      }
      return current;
    } else if (path === '/') {
      // Allow listing / but it might be empty except for root if we defined it that way
      // For this simple sim, let's just say / contains root
      return { type: 'dir', children: { 'root': fileSystem['/root'] } };
    }

    return null;
  }

  // Simulated Command Handler
  function handleCommand(socket, command, term) {
    const args = command.split(' ');
    const cmd = args[0].toLowerCase();

    let output = '';

    switch (cmd) {
      case 'help':
        output = '\r\nAvailable commands:\r\n' +
          '  \x1b[1;33mhelp\x1b[0m     - Show this help message\r\n' +
          '  \x1b[1;33mls\x1b[0m       - List files\r\n' +
          '  \x1b[1;33mpwd\x1b[0m      - Print working directory\r\n' +
          '  \x1b[1;33mcd\x1b[0m       - Change directory\r\n' +
          '  \x1b[1;33mmkdir\x1b[0m    - Create directory\r\n' +
          '  \x1b[1;33mwhoami\x1b[0m   - Print current user\r\n' +
          '  \x1b[1;33mclear\x1b[0m    - Clear terminal screen\r\n' +
          '  \x1b[1;33msudo\x1b[0m     - Execute a command as another user\r\n' +
          '  \x1b[1;33mpkg\x1b[0m      - Package manager simulation\r\n' +
          '  \x1b[1;33mping\x1b[0m     - Send ICMP ECHO_REQUEST to network hosts\r\n' +
          '  \x1b[1;33mnmap\x1b[0m     - Network exploration tool and security scanner\r\n' +
          '  \x1b[1;33mip\x1b[0m       - Show IP address\r\n';
        break;
      case 'ls':
        const dir = getDir(term.cwd);
        if (dir && dir.children) {
          const items = Object.entries(dir.children).map(([name, item]) => {
            return item.type === 'dir' ? `\x1b[1;34m${name}\x1b[0m` : `\x1b[1;32m${name}\x1b[0m`;
          });
          output = '\r\n' + items.join('  ') + '\r\n';
        } else {
          output = '\r\n';
        }
        break;
      case 'pwd':
        output = `\r\n${term.cwd}\r\n`;
        break;
      case 'cd':
        if (!args[1]) {
          term.cwd = '/root'; // cd goes home
        } else {
          const target = resolvePath(term.cwd, args[1]);
          const targetDir = getDir(target);

          if (targetDir && targetDir.type === 'dir') {
            term.cwd = target;
          } else {
            output = `\r\nbash: cd: ${args[1]}: No such file or directory\r\n`;
          }
        }
        break;
      case 'mkdir':
        if (!args[1]) {
          output = '\r\nmkdir: missing operand\r\n';
        } else {
          const currentDir = getDir(term.cwd);
          if (currentDir && currentDir.type === 'dir') {
            if (currentDir.children[args[1]]) {
              output = `\r\nmkdir: cannot create directory '${args[1]}': File exists\r\n`;
            } else {
              currentDir.children[args[1]] = { type: 'dir', children: {} };
            }
          } else {
            output = `\r\nmkdir: cannot create directory '${args[1]}': No such file or directory\r\n`;
          }
        }
        break;
      case 'whoami':
        output = '\r\nroot\r\n';
        break;
      case 'clear':
        socket.emit('terminal-output', '\x1b[2J\x1b[H');
        socket.emit('terminal-output', `root@kali:${term.cwd}# `);
        return;
      case 'sudo':
        if (args.length > 1) {
          output = `\r\n[sudo] password for root: \r\n`;
          // In a real sim we'd handle password input, but for now just execute
          const subCmd = args.slice(1).join(' ');
          handleCommand(socket, subCmd, term); // Recursive call (simplified)
          return;
        } else {
          output = '\r\nsudo: missing command\r\n';
        }
        break;
      case 'pkg':
        if (args[1] === 'install') {
          output = `\r\nUpdating repository lists...\r\nDownloading ${args[2] || 'package'}...\r\nInstalling...\r\n\x1b[1;32mDone!\x1b[0m\r\n`;
        } else {
          output = '\r\nUsage: pkg install <package_name>\r\n';
        }
        break;
      case 'ip':
        output = '\r\neth0: 192.168.1.105\r\nlo: 127.0.0.1\r\n';
        break;
      case 'ping':
        if (!args[1]) {
          output = '\r\nUsage: ping <host>\r\n';
        } else {
          const host = args[1];
          socket.emit('terminal-output', `\r\nPING ${host} (${host}) 56(84) bytes of data.\r\n`);

          let count = 0;
          const max = 4;
          const interval = setInterval(() => {
            count++;
            const time = (Math.random() * 10 + 20).toFixed(1);
            socket.emit('terminal-output', `64 bytes from ${host}: icmp_seq=${count} ttl=57 time=${time} ms\r\n`);

            if (count >= max) {
              clearInterval(interval);
              socket.emit('terminal-output', `\r\n--- ${host} ping statistics ---\r\n`);
              socket.emit('terminal-output', `${max} packets transmitted, ${max} received, 0% packet loss, time ${max * 1000}ms\r\n`);
              socket.emit('terminal-output', `rtt min/avg/max/mdev = 23.1/28.4/35.2/4.1 ms\r\n`);
              socket.emit('terminal-output', `root@kali:${term.cwd}# `);
            }
          }, 1000);
          return; // Return early to avoid printing prompt immediately
        }
        break;
      case 'nmap':
        if (!args[1]) {
          output = '\r\nUsage: nmap <target>\r\n';
        } else {
          const target = args[1];
          socket.emit('terminal-output', `\r\nStarting Nmap 7.94 ( https://nmap.org ) at ${new Date().toISOString().split('T')[0]}\r\n`);
          socket.emit('terminal-output', `Nmap scan report for ${target}\r\n`);
          socket.emit('terminal-output', `Host is up (0.0023s latency).\r\n`);
          socket.emit('terminal-output', `Not shown: 997 closed tcp ports (reset)\r\n`);

          setTimeout(() => {
            socket.emit('terminal-output', `PORT    STATE SERVICE\r\n`);
            socket.emit('terminal-output', `22/tcp  \x1b[1;32mopen\x1b[0m  ssh\r\n`);
            socket.emit('terminal-output', `80/tcp  \x1b[1;32mopen\x1b[0m  http\r\n`);
            socket.emit('terminal-output', `443/tcp \x1b[1;32mopen\x1b[0m  https\r\n`);
            socket.emit('terminal-output', `\r\nNmap done: 1 IP address (1 host up) scanned in 1.24 seconds\r\n`);
            socket.emit('terminal-output', `root@kali:${term.cwd}# `);
          }, 1500);
          return; // Return early
        }
        break;
      default:
        output = `\r\nbash: ${cmd}: command not found\r\n`;
    }

    socket.emit('terminal-output', output);
    socket.emit('terminal-output', `root@kali:${term.cwd}# `);
  }

} catch (err) {
  console.warn('WebSocket initialization failed:', err.message);
  // Mock io for routes if initialization failed
  app.set('io', { emit: () => { } });
}

// Start server
if (require.main === module) {
  server.listen(port, () => {
    console.log(`Cyber Security Tools Portal listening at http://localhost:${port}`);
  });
}

module.exports = app;

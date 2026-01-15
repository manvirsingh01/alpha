# Cyber Security Tools Portal (Alpha)

A comprehensive web-based platform providing a suite of cybersecurity and network analysis tools. This application integrates packet analysis, threat intelligence, and privacy utilities into a unified dashboard with a web-based terminal interface.

## 🚀 Features

### 1. Network Analysis (PCAP)
* **File Analysis**: Upload and parse `.pcap` files to view packet statistics.
    * Protocol distribution charts.
    * Conversation tracking (Source IP <-> Dest IP).
    * Detailed packet inspection (headers, flags, payload size).
* **Live Capture**: Real-time network traffic capture using `tshark` (Wireshark).
    * **Note**: Requires `tshark` installed on the host system.

### 2. Threat Intelligence (VirusTotal Integration)
* **File Scanner**: Upload files to scan against VirusTotal's database.
* **URL Scanner**: Check suspicious URLs for malware or phishing.
* **Lookup Tools**:
    * File Hash Lookup
    * IP Address Reputation
    * Domain Reputation

### 3. Disposable Privacy Services
* **Temp Email**: Generate temporary email addresses (integrated with Guerrilla Mail API).
* **Temp SMS**: Simulated disposable phone numbers for testing SMS reception.

### 4. System Tools
* **Web Terminal**: A fully functional in-browser terminal emulator (using `node-pty` and `socket.io`) providing shell access to the host environment.

---

## 🛠️ Prerequisites

* **Node.js**: Version 20 or higher.
* **System Tools** (required for `node-pty` and live capture):
    * `python3`, `make`, `g++` (for building native modules).
    * `tshark` (Wireshark command-line utility) - **Required for live packet capture.**

---

## 📥 Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd alpha
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Environment:**
    Create a `.env` file in the root directory:
    ```env
    # Required for Threat Intelligence features
    VIRUSTOTAL_API_KEY=your_virustotal_api_key_here
    
    # Optional
    PORT=3000
    ```

---

## 🏃 Usage

### Local Development
Start the server:
```bash
npm start

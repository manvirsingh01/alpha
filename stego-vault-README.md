# 🔐 Stego Vault

> A powerful web-based steganography tool for hiding secret messages within images

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://stego-vault-delta.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)

**🌐 Live Demo:** [https://stego-vault-delta.vercel.app](https://stego-vault-delta.vercel.app)

## 📖 Overview

**Stego Vault** is a web-based steganography tool that enables users to hide secret messages within images using LSB (Least Significant Bit) encoding. The tool provides a sleek, terminal-inspired interface for encoding, decoding, and analyzing steganographic content.

## ✨ Features

| Feature | Description |
|---------|-------------|
| **LSB Encoding** | Hide messages in images using 1, 2, or 4-bit depth LSB steganography |
| **AES-256 Encryption** | Optional password-based encryption for enhanced security |
| **Message Decoding** | Extract hidden messages from stego images with password support |
| **Steganalysis** | Detect hidden content using RS Analysis algorithm |
| **Bit Plane Visualization** | View individual bit planes (RGB channels) to spot anomalies |
| **Image Comparison** | Calculate MSE/PSNR metrics between original and stego images |
| **Histogram Analysis** | Visualize color distribution to detect embedding artifacts |

## 🛠️ Technical Stack

- **Frontend:** Next.js, TypeScript, React
- **Steganography:** Custom LSB encoder/decoder
- **Encryption:** Web Crypto API (AES-256)
- **Deployment:** Vercel

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/manvirsingh01/stego-vault.git
cd stego-vault

# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the application.

## 📋 Usage

### Encoding a Message

1. Navigate to the **Encode** tab
2. Upload a cover image (PNG, BMP, or TIFF)
3. Enter your secret message
4. (Optional) Enable AES-256 encryption and set a password
5. Select LSB bit depth (1, 2, or 4 bits)
6. Click **Encode** to generate the stego image
7. Download the resulting image

### Decoding a Message

1. Navigate to the **Decode** tab
2. Upload the stego image
3. Enter the password (if encrypted)
4. Click **Decode** to reveal the hidden message

### Analyzing Images

1. Navigate to the **Analyze** tab
2. Upload an image to examine
3. View bit planes, histograms, and RS analysis results
4. Compare original and stego images for quality metrics

## 🔬 How It Works

### LSB Steganography

The tool embeds secret data by modifying the Least Significant Bits of pixel color values. This technique is nearly imperceptible to the human eye while allowing significant data storage.

### RS Analysis

The built-in steganalysis feature uses the RS (Regular-Singular) algorithm to detect potential hidden content by analyzing statistical anomalies in bit patterns.

## 🎯 Use Cases

- **Secure Communication:** Hide confidential messages in innocent-looking images
- **Digital Watermarking:** Embed ownership information in digital assets
- **CTF Challenges:** Practice steganography techniques for cybersecurity competitions
- **Education:** Learn about data hiding and steganalysis methods

## 📄 License

This project is licensed under the ISC License.

## 👤 Author

**Manvir Singh** - [@manvirsingh01](https://github.com/manvirsingh01)

---

<p align="center">Made with ❤️ for the cybersecurity community</p>

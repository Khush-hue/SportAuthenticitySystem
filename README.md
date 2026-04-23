<div align="center">
# 🛡️ GuardianAI
### Digital Asset Protection Platform for Sports Media

**Detect · Protect · Act — in Real Time**
<img width="430" height="467" alt="Screenshot_20260423_231105" src="https://github.com/user-attachments/assets/525f9cd0-6cf1-4f44-9c06-55865ed7e3b1" />
<img width="431" height="447" alt="Screenshot_20260423_231200" src="https://github.com/user-attachments/assets/829a330f-d4e1-4ef8-bdcd-b6567c309450" />
<img width="1366" height="654" alt="Screenshot_20260423_231300" src="https://github.com/user-attachments/assets/fdcf39c1-d946-4061-a502-660c234ea8cc" />
<img width="1365" height="652" alt="Screenshot_20260423_231314" src="https://github.com/user-attachments/assets/abc215c5-1590-49d7-9964-42e4f3486fd4" />
<img width="1362" height="649" alt="Screenshot_20260423_231325" src="https://github.com/user-attachments/assets/d8011fd7-4f52-453d-b40b-253de0c9d463" />
<img width="1366" height="649" alt="Screenshot_20260423_231347" src="https://github.com/user-attachments/assets/bdaed712-c70d-4814-9d1f-b4f4a1a6dd55" />

<br/>
> **GuardianAI** is an AI-powered platform that identifies, tracks, and flags unauthorized use of official sports media across the internet — in near real-time. Built on Google Cloud, Gemini AI, and YouTube Data API v3.
 
<br/>

<img width="1349" height="637" alt="Screenshot_20260423_020446" src="https://github.com/user-attachments/assets/5431bdcd-e94f-4df5-8df7-0a515da8cf80" />

</div>

---
 
## 📌 Table of Contents
 
- [Overview](#-overview)
- [Live Demo](#-live-demo)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Configuration](#-configuration)
- [Project Structure](#-project-structure)
- [SDG Alignment](#-sdg-alignment)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)
---
 
## 🌐 Overview
 
Sports organisations generate **massive volumes of high-value digital media** that scatter across global platforms instantly. This visibility gap leaves proprietary content highly vulnerable to:
 
- 📹 Unauthorised video redistribution
- 💰 Revenue loss from pirated highlights
- ⚖️ Intellectual property violations at scale
**GuardianAI** solves this with a scalable, AI-driven platform that:
 
1. **Fingerprints** your media assets using perceptual hashing (pHash) and CLIP embeddings
2. **Searches** YouTube, Twitter/X, Instagram, TikTok, Facebook, Reddit, Twitch, and Dailymotion in real-time
3. **Flags** violations with confidence scores powered by Google Cloud Vision
4. **Advises** rights holders through DMCA procedures using a conversational Gemini AI assistant
5. **Reports** to stakeholders with automated compliance exports and CRM sync
---
 
## 🚀 Live Demo
 
| Environment | URL |
|---|---|
| 🟢 Production | [guardian-ai.vercel.app](https://guardian-ai.vercel.app) |
| 🔵 Staging | Coming soon |
 
> **Demo credentials**
> - Username: `admin` &nbsp;|&nbsp; Password: `pass123`
> - 2FA Code: `123456`
 
---
 
## ✨ Features
 
### 🔍 Real-Time Asset Scanning
Upload any video or image and GuardianAI searches across 8 major platforms simultaneously using YouTube Data API v3 and AI-based fingerprinting.
 
### 🤖 Gemini AI Assistant
A conversational AI advisor powered by **Google Gemini 2.0 Flash** that helps you:
- Understand why content was flagged
- Draft DMCA takedown notices
- Get platform-specific IP protection strategies
- Summarise weekly violation reports
### 📊 Live Analytics Dashboard
- Real-time KPI cards (total scans, active flags, cleared, pending)
- Platform violation breakdown with animated charts
- Live detection feed updating every 5 seconds
- AI confidence score distribution
### 🚨 Smart Alert System
- Severity-based alerts: **Critical / Warning / Info**
- Full alert detail modal with platform, status, and assigned team
- One-click navigation to related detections
- Dismiss or escalate workflows
### ⚖️ DMCA Auto-Flagging
Automatically prepares DMCA takedown notices when similarity scores breach the configured threshold (default: 72%).
 
### 🔐 Secure Authentication
- Email + password login
- **Two-Factor Authentication (2FA)**
- AES-256 data encryption
- Session timeout and audit logging
### 📋 Compliance Reports
Generate and export:
- DMCA Violation Reports
- Platform Analysis
- AI Confidence Reports
- Weekly Executive Summaries
- CRM Exports (Salesforce / HubSpot)
- SDG Impact Reports
### 📱 Fully Mobile Responsive
Works seamlessly on phones, tablets, and desktops with a collapsible sidebar navigation.
 
---
 
## 🛠️ Tech Stack
 
### Frontend
| Technology | Purpose |
|---|---|
| **React 18** | Component-based UI framework |
| **Vite 5** | Lightning-fast build tool |
| **Space Mono + Syne** | Typography (Google Fonts) |
| **CSS-in-JS** | Inline styling with CSS variables |
 
### Google Cloud APIs
| API | Purpose |
|---|---|
| **Gemini 2.0 Flash** | AI chat assistant & content analysis |
| **YouTube Data API v3** | Real-time cross-platform video search |
| **Google Cloud Vision API** | Image/video similarity fingerprinting |
| **Firebase Authentication** | Secure user auth with 2FA |
| **Cloud Run** | Serverless auto-scaling backend |
 
### Detection Engine
| Technology | Purpose |
|---|---|
| **pHash (Perceptual Hashing)** | Unique digital fingerprint per asset |
| **CLIP Embeddings** | Semantic visual similarity matching |
| **Motion Vector Extraction** | Detects re-encoded or cropped copies |
 
### Integrations
| Service | Purpose |
|---|---|
| **Salesforce / HubSpot** | CRM sync via webhooks |
| **Vercel** | Frontend deployment & hosting |
| **REST Webhooks** | Real-time event streaming |
 
---
 
## 🏁 Getting Started
 
### Prerequisites
 
Make sure you have the following installed:
 
```bash
node -v      # v18 or higher
git --version
```
 
> Download Node.js from [nodejs.org](https://nodejs.org) · Git from [git-scm.com](https://git-scm.com)
 
### Installation
 
```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/guardian-ai.git
 
# 2. Navigate into the project
cd guardian-ai
 
# 3. Install dependencies
npm install
 
# 4. Start the development server
npm run dev
```
 
Your app will be running at **http://localhost:5173** 🎉
 
### Build for Production
 
```bash
npm run build
```
 
### Deploy to Vercel
 
```bash
# Install Vercel CLI
npm install -g vercel
 
# Deploy
vercel
```
 
Your live MVP link will look like: `https://guardian-ai-xyz.vercel.app`
 
---
 
## ⚙️ Configuration
 
### API Keys Setup
 
GuardianAI requires two Google API keys to enable live AI features:
 
| Key | Where to Get It | Required For |
|---|---|---|
| **YouTube Data API v3** | [console.cloud.google.com](https://console.cloud.google.com) | Real-time YouTube search |
| **Gemini API Key** | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) | AI chat assistant |
| **Cloud Vision API** | [console.cloud.google.com](https://console.cloud.google.com) | Image fingerprinting |
 
### Option A — Via the App (Recommended)
1. Log in → Go to **Settings**
2. Paste your keys in the **Google API Configuration** section
3. Click **Save API Keys** — activates immediately, no restart needed ✅
### Option B — Hardcode in Source
Open `src/App.jsx` and replace at the top:
 
```js
let YOUTUBE_API_KEY = "YOUR_KEY_HERE";
let GEMINI_API_KEY  = "YOUR_KEY_HERE";
```
 
### Option C — Environment Variables (Production Best Practice)
 
Create a `.env` file in the project root:
 
```env
VITE_YOUTUBE_API_KEY=AIzaxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_GEMINI_API_KEY=AIzaxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```
 
Then reference in code:
```js
const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
const GEMINI_API_KEY  = import.meta.env.VITE_GEMINI_API_KEY;
```
 
> ⚠️ **Never commit API keys to GitHub.** Add `.env` to your `.gitignore`.
 
---
 
## 📁 Project Structure
 
```
guardian-ai/
│
├── public/
│   └── favicon.ico
│
├── src/
│   ├── App.jsx          # Main application (all components)
│   ├── main.jsx         # React entry point
│   └── index.css        # Global reset (kept minimal)
│
├── .env                 # API keys (DO NOT commit)
├── .gitignore
├── index.html
├── package.json
├── vite.config.js
└── README.md
```
 
---
 
## 🌍 SDG Alignment
 
GuardianAI is built with purpose. It directly addresses **6 UN Sustainable Development Goals**:
 
| SDG | Goal | How GuardianAI Contributes |
|---|---|---|
| **SDG 8** | Decent Work & Economic Growth | Protects creator revenue from piracy ($28B lost annually in sports) |
| **SDG 9** | Industry, Innovation & Infrastructure | AI-powered cloud infrastructure for next-gen IP protection |
| **SDG 16** | Peace, Justice & Strong Institutions | Automates DMCA enforcement and strengthens IP law compliance |
| **SDG 10** | Reduced Inequalities | Makes enterprise-grade IP protection accessible to small organisations |
| **SDG 17** | Partnerships for the Goals | Integrates with 8 platforms and CRM ecosystems |
| **SDG 4** | Quality Education | Gemini AI educates users on digital rights and IP law |
 
---
 
## 🗺️ Roadmap
 
- [x] Real-time YouTube search via YouTube Data API v3
- [x] Gemini AI conversational assistant
- [x] 2FA authentication
- [x] DMCA auto-flagging
- [x] CRM integration (Salesforce / HubSpot)
- [x] Mobile responsive UI
- [x] SDG impact tracking
- [ ] Google Cloud Vision API live fingerprinting
- [ ] Firebase real-time database for persistent detections
- [ ] Browser extension for instant page scanning
- [ ] Automated email alerts via SendGrid
- [ ] Multi-user team accounts with role-based access
- [ ] Native mobile app (React Native)
- [ ] Bulk asset upload and batch scanning
- [ ] API endpoints for third-party integration
---
 
## 🤝 Contributing
 
Contributions are welcome and appreciated! Here's how to get started:
 
```bash
# Fork the repo, then clone your fork
git clone https://github.com/YOUR_USERNAME/guardian-ai.git
 
# Create a feature branch
git checkout -b feature/your-feature-name
 
# Make your changes, then commit
git add .
git commit -m "feat: add your feature description"
 
# Push and open a Pull Request
git push origin feature/your-feature-name
```
 
Please follow [Conventional Commits](https://www.conventionalcommits.org/) for commit messages.
 
---
 
## 👤 Author
 
**Your Name**
- GitHub: [@your-username](https://github.com/your-username)
- LinkedIn: [your-linkedin](https://linkedin.com/in/your-linkedin)
- Email: your@email.com
---
 
## 📄 License
 
This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.
 
---
 
## 🙏 Acknowledgements
 
- [Google Gemini](https://deepmind.google/technologies/gemini/) — AI assistant engine
- [YouTube Data API](https://developers.google.com/youtube/v3) — Real-time video search
- [Google Cloud Vision](https://cloud.google.com/vision) — Visual similarity detection
- [React](https://react.dev) — UI framework
- [Vite](https://vitejs.dev) — Build tooling
- [Vercel](https://vercel.com) — Deployment platform
---
 
<div align="center">

 
⭐ If you found this useful, please star the repository!
 
</div>
 


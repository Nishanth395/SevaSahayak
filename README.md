# 🇮🇳 SevaSahayak — AI Voice Assistant for Indian Government Services

> Get government documents in 10 minutes with AI voice guidance in Hindi, English & Telugu

![License](https://img.shields.io/badge/license-MIT-green)
![Languages](https://img.shields.io/badge/languages-EN%20%7C%20HI%20%7C%20TE-blue)
![Status](https://img.shields.io/badge/status-production--ready-brightgreen)

## ✨ Features

- 🎤 **Voice-First Design** — Real Web Speech API integration for voice input/output
- 🌐 **Trilingual Support** — Full English, Hindi (हिंदी), and Telugu (తెలుగు) support
- 💬 **AI Chat Interface** — Step-by-step guided conversation flow
- 📧📱 **OTP Verification** — Email & SMS verification with 6-box input UI
- 📂 **Document Upload** — Upload required documents with previews
- 📋 **Form Review** — Inline editing before submission
- 💳 **Payment Flow** — Mock payment processing
- 🎉 **Success Page** — Confetti celebration with tracking ID
- 📱 **Mobile Responsive** — Works on all screen sizes

## 🏛️ Supported Government Services (12)

| Service | Processing | Price |
|---------|-----------|-------|
| 💳 PAN Card | 7-10 days | ₹99 |
| 🆔 Aadhaar Update | 3-5 days | ₹99 |
| 🛂 Passport | 30-45 days | ₹299 |
| 🚗 Driving License | 15-30 days | ₹299 |
| 👶 Birth Certificate | 7-15 days | ₹199 |
| 💑 Marriage Certificate | 15-30 days | ₹199 |
| 🗳️ Voter ID Card | 30-45 days | ₹99 |
| 🍚 Ration Card | 30-60 days | ₹199 |
| 💰 Income Certificate | 7-15 days | ₹149 |
| 📜 Caste Certificate | 15-30 days | ₹149 |
| 🏠 Domicile Certificate | 15-30 days | ₹149 |
| 👮 Police Verification | 7-15 days | ₹199 |

## 🚀 Quick Start

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/sevasahayak.git
cd sevasahayak

# Run locally (no build needed!)
python -m http.server 8765

# Open in browser
# http://localhost:8765
```

## 🧪 Demo Flow

1. **Landing Page** → Click "🎤 Start Speaking" on PAN Card
2. **Chat** → Enter name, DOB, father's name
3. **Email OTP** → Enter email → Copy OTP from toast notification
4. **Mobile OTP** → Enter mobile → Copy OTP from toast
5. **Address & Pincode** → Enter details
6. **Upload Documents** → Upload any image files
7. **Review Form** → Click "Looks Good! Continue →"
8. **Payment** → Click "Pay ₹116.82 →"
9. **🎉 Success!** — Confetti + tracking ID

> 💡 OTP codes appear as **toast notifications** in the top-right corner during demo mode.

## 📁 Project Structure

```
sevasahayak/
├── index.html              ← Entry point
├── server.js               ← Node.js server (for production/Replit)
├── css/
│   ├── main.css            ← Design system & utilities
│   ├── landing.css         ← Landing page styles
│   ├── chat.css            ← Chat interface styles
│   ├── otp.css             ← OTP modal styles
│   └── animations.css      ← Animations & success page
└── js/
    ├── translations.js     ← EN/HI/TE translations
    ├── services-data.js    ← All 12 services data
    ├── router.js           ← Navigation + toast + confetti
    ├── voice.js            ← Web Speech API engine
    ├── otp.js              ← OTP system + modal UI
    ├── chat-engine.js      ← Conversation flow engine
    ├── app.js              ← Entry point
    └── pages/
        ├── landing.js      ← Landing page
        ├── chat.js         ← Chat page
        └── success.js      ← Success page
```

## 🎨 Design System

| Token | Value |
|-------|-------|
| Primary | `#0F766E` (Teal) |
| Primary Light | `#14B8A6` (Cyan) |
| Success | `#10B981` (Green) |
| India Saffron | `#FF9933` |
| India Green | `#138808` |
| Font Heading | Poppins |
| Font Body | Inter |

## 🔌 API Integration Points

| Feature | Service | File |
|---------|---------|------|
| SMS OTP | Twilio API | `js/otp.js` |
| Email OTP | SendGrid | `js/otp.js` |
| Voice Output | Murf AI | `js/voice.js` |
| Payment | Razorpay | `js/pages/chat.js` |

## 🛠️ Tech Stack

- **Zero Dependencies** — Pure HTML, CSS, JavaScript
- **No Build Step** — Works directly in any browser
- **Web Speech API** — For voice input/output
- **Google Fonts** — Poppins + Inter

## 📄 License

MIT License — feel free to use for your hackathon or startup!

---

Built with ❤️ for Digital India 🇮🇳

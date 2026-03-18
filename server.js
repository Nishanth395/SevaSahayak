/**
 * SevaSahayak - Production Backend Server
 * ========================================
 * Express.js API server integrating:
 *   - Twilio   → SMS OTP delivery
 *   - SendGrid → Email OTP delivery
 *   - Murf AI  → Text-to-Speech (Indian voices)
 *   - Multer   → Document file uploads
 *
 * Environment variables (set in .env or Replit Secrets):
 *   TWILIO_ACCOUNT_SID
 *   TWILIO_AUTH_TOKEN
 *   TWILIO_PHONE_NUMBER       (e.g. +12345678901)
 *   SENDGRID_API_KEY
 *   SENDGRID_FROM_EMAIL       (verified sender, e.g. noreply@sevasahayak.in)
 *   MURF_API_KEY
 *   PORT                      (default: 3001)
 *   FRONTEND_ORIGIN           (e.g. https://your-replit.repl.co)
 *   OTP_EXPIRY_MINUTES        (default: 2)
 *   MAX_OTP_ATTEMPTS          (default: 3)
 */

'use strict';

// ─── Dependencies ────────────────────────────────────────────────────────────
const express       = require('express');
const cors          = require('cors');
const helmet        = require('helmet');
const rateLimit     = require('express-rate-limit');
const multer        = require('multer');
const path          = require('path');
const fs            = require('fs');
const crypto        = require('crypto');
const twilio        = require('twilio');
const sgMail        = require('@sendgrid/mail');

// Load .env if present (for local dev)
try { require('dotenv').config(); } catch (_) {}

// ─── Config ──────────────────────────────────────────────────────────────────
const CONFIG = {
  port:           parseInt(process.env.PORT             || '3001', 10),
  frontendOrigin: process.env.FRONTEND_ORIGIN           || '*',
  otpExpiryMs:    parseInt(process.env.OTP_EXPIRY_MINUTES || '2', 10) * 60 * 1000,
  maxAttempts:    parseInt(process.env.MAX_OTP_ATTEMPTS  || '3', 10),
  resendCooldownMs: 30 * 1000,  // 30 seconds before resend allowed

  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID  || '',
    authToken:  process.env.TWILIO_AUTH_TOKEN   || '',
    from:       process.env.TWILIO_PHONE_NUMBER || '',
  },

  sendgrid: {
    apiKey:   process.env.SENDGRID_API_KEY    || '',
    fromEmail: process.env.SENDGRID_FROM_EMAIL || 'noreply@sevasahayak.in',
    fromName:  'SevaSahayak',
  },

  murf: {
    apiKey:  process.env.MURF_API_KEY || '',
    baseUrl: 'https://api.murf.ai/v1',
    voices: {
      en: 'en-IN-rohan',    // Indian English Male
      hi: 'hi-IN-aarav',    // Hindi Male
      te: 'te-IN-sita',     // Telugu Female
    },
  },

  upload: {
    maxFileSize: 5 * 1024 * 1024, // 5 MB
    allowedMimes: ['image/jpeg', 'image/png', 'application/pdf'],
    uploadDir: path.join(__dirname, 'uploads'),
  },
};

// ─── Validate critical env vars ───────────────────────────────────────────────
const SERVICES_AVAILABLE = {
  twilio:   !!(CONFIG.twilio.accountSid && CONFIG.twilio.authToken && CONFIG.twilio.from),
  sendgrid: !!(CONFIG.sendgrid.apiKey),
  murf:     !!(CONFIG.murf.apiKey),
};

console.log('\n🚀 SevaSahayak Server Starting...');
console.log('─'.repeat(40));
console.log('📱 Twilio SMS:   ', SERVICES_AVAILABLE.twilio   ? '✅ LIVE' : '⚠️  MOCK (set TWILIO_* env vars)');
console.log('📧 SendGrid Email:', SERVICES_AVAILABLE.sendgrid ? '✅ LIVE' : '⚠️  MOCK (set SENDGRID_API_KEY)');
console.log('🔊 Murf AI TTS:  ', SERVICES_AVAILABLE.murf     ? '✅ LIVE' : '⚠️  MOCK (set MURF_API_KEY)');
console.log('─'.repeat(40) + '\n');

// ─── Initialize Third-party Clients ──────────────────────────────────────────
let twilioClient = null;
if (SERVICES_AVAILABLE.twilio) {
  twilioClient = twilio(CONFIG.twilio.accountSid, CONFIG.twilio.authToken);
}

if (SERVICES_AVAILABLE.sendgrid) {
  sgMail.setApiKey(CONFIG.sendgrid.apiKey);
}

// ─── App Setup ───────────────────────────────────────────────────────────────
const app = express();

// Security headers (relaxed for Replit)
app.use(helmet({
  contentSecurityPolicy: false,  // Allow inline scripts for demo
  crossOriginEmbedderPolicy: false,
}));

// CORS
app.use(cors({
  origin: CONFIG.frontendOrigin === '*' ? '*' : CONFIG.frontendOrigin.split(','),
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve frontend static files
app.use(express.static(path.join(__dirname)));

// ─── Rate Limiters ───────────────────────────────────────────────────────────
const otpSendLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,  // 10 minutes
  max: 5,
  message: { success: false, error: 'Too many OTP requests. Please wait 10 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const otpVerifyLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 15,
  message: { success: false, error: 'Too many verification attempts. Please wait 5 minutes.' },
});

const ttsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { success: false, error: 'TTS rate limit reached. Please wait a moment.' },
});

// ─── OTP Store (in-memory; use Redis in production) ──────────────────────────
/**
 * Structure: otpStore[key] = {
 *   otp: string,
 *   expiresAt: number (ms),
 *   attempts: number,
 *   lastSentAt: number (ms),
 *   target: string,   // email or +91XXXXXXXXXX
 *   type: 'email'|'mobile',
 * }
 */
const otpStore = new Map();

// Clean up expired OTPs every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of otpStore.entries()) {
    if (now > record.expiresAt + 5 * 60 * 1000) {
      otpStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

// ─── Helpers ─────────────────────────────────────────────────────────────────
function generateOTP(length = 6) {
  // Cryptographically secure random OTP
  const digits = crypto.randomInt(Math.pow(10, length - 1), Math.pow(10, length));
  return String(digits);
}

function requestId(req) {
  return req.headers['x-request-id'] || crypto.randomUUID();
}

function log(level, msg, data = {}) {
  const ts = new Date().toISOString();
  const prefix = { info: 'ℹ️', warn: '⚠️', error: '❌', success: '✅' }[level] || '•';
  console.log(`[${ts}] ${prefix} ${msg}`, Object.keys(data).length ? data : '');
}

// ─── Email Template ───────────────────────────────────────────────────────────
function buildEmailHTML(otp, email) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>SevaSahayak – Email Verification</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background:#F0FDFA; }
    .wrapper { max-width:580px; margin:40px auto; background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.1); }
    .header { background:linear-gradient(135deg,#0F766E,#14B8A6); padding:32px 40px; text-align:center; }
    .header-logo { font-size:32px; margin-bottom:8px; }
    .header h1 { color:#fff; font-size:22px; font-weight:700; margin-bottom:4px; }
    .header p  { color:rgba(255,255,255,0.85); font-size:14px; }
    .india-strip { height:4px; background:linear-gradient(90deg,#FF9933 33%,#fff 33% 66%,#138808 66%); }
    .body { padding:36px 40px; }
    .greeting { font-size:16px; color:#0F172A; margin-bottom:20px; }
    .otp-label { font-size:13px; color:#64748B; text-transform:uppercase; letter-spacing:1px; margin-bottom:12px; }
    .otp-box { background:#F0FDFA; border:2px solid #14B8A6; border-radius:12px; padding:28px; text-align:center; margin:0 0 24px; }
    .otp-digits { font-size:42px; font-weight:800; letter-spacing:14px; color:#0F766E; font-family:'Courier New',monospace; }
    .otp-validity { font-size:13px; color:#64748B; margin-top:10px; }
    .divider { height:1px; background:#E2E8F0; margin:24px 0; }
    .warning { font-size:13px; color:#64748B; line-height:1.7; }
    .warning strong { color:#EF4444; }
    .footer { background:#F8FAFC; padding:20px 40px; text-align:center; border-top:1px solid #E2E8F0; }
    .footer p { font-size:12px; color:#94A3B8; line-height:1.8; }
    .footer a { color:#0F766E; text-decoration:none; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="header-logo">📋</div>
      <h1>SevaSahayak</h1>
      <p>AI Voice Assistant for Government Services</p>
    </div>
    <div class="india-strip"></div>
    <div class="body">
      <p class="greeting">Hello,</p>
      <p style="color:#64748B;font-size:14px;margin-bottom:20px">
        You requested email verification for your SevaSahayak application.<br>
        Use the code below to continue:
      </p>
      <div class="otp-label">Your Verification Code</div>
      <div class="otp-box">
        <div class="otp-digits">${otp.split('').join(' ')}</div>
        <div class="otp-validity">⏱ Valid for <strong>2 minutes</strong> only</div>
      </div>
      <div class="divider"></div>
      <div class="warning">
        <strong>⚠️ Security Notice:</strong> Never share this code with anyone.<br>
        SevaSahayak will <strong>never</strong> call you and ask for this OTP.<br><br>
        If you did not request this, please ignore this email or
        <a href="mailto:support@sevasahayak.in" style="color:#0F766E">contact support</a>.
      </div>
    </div>
    <div class="footer">
      <p>
        © 2026 SevaSahayak — Making Digital India Accessible 🇮🇳<br>
        <a href="https://sevasahayak.in">sevasahayak.in</a> ·
        <a href="mailto:support@sevasahayak.in">support@sevasahayak.in</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

// ─── Upload Directory ─────────────────────────────────────────────────────────
if (!fs.existsSync(CONFIG.upload.uploadDir)) {
  fs.mkdirSync(CONFIG.upload.uploadDir, { recursive: true });
  log('info', `Created uploads directory: ${CONFIG.upload.uploadDir}`);
}

// Multer storage — unique filenames, organized by session
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const sessionDir = path.join(CONFIG.upload.uploadDir, req.body.sessionId || 'general');
    fs.mkdirSync(sessionDir, { recursive: true });
    cb(null, sessionDir);
  },
  filename: (req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase();
    const name = `${req.body.docType || 'doc'}_${Date.now()}${ext}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: CONFIG.upload.maxFileSize },
  fileFilter: (req, file, cb) => {
    if (CONFIG.upload.allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', `Unsupported file type: ${file.mimetype}`));
    }
  },
});

// ═══════════════════════════════════════════════════════════════════════════════
//  API ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: SERVICES_AVAILABLE,
    uptime: Math.round(process.uptime()),
  });
});

// ── Send SMS OTP (Twilio) ─────────────────────────────────────────────────────
app.post('/api/send-sms-otp', otpSendLimiter, async (req, res) => {
  const rid = requestId(req);
  const { mobile } = req.body;

  // Validate
  if (!mobile || !/^[6-9]\d{9}$/.test(mobile)) {
    return res.status(400).json({ success: false, error: 'Invalid Indian mobile number.' });
  }

  const key      = `mobile_${mobile}`;
  const existing = otpStore.get(key);

  // Resend cooldown
  if (existing && Date.now() - existing.lastSentAt < CONFIG.resendCooldownMs) {
    const remainingSecs = Math.ceil((CONFIG.resendCooldownMs - (Date.now() - existing.lastSentAt)) / 1000);
    return res.status(429).json({
      success: false,
      error: `Please wait ${remainingSecs} seconds before requesting a new OTP.`,
      retryAfterSeconds: remainingSecs,
    });
  }

  const otp      = generateOTP();
  const formattedNumber = `+91${mobile}`;
  const smsBody  = `Your SevaSahayak OTP is: ${otp}\nValid for ${CONFIG.otpExpiryMs / 60000} minutes. Do NOT share with anyone.\n– SevaSahayak`;

  // Store OTP before sending (atomic)
  otpStore.set(key, {
    otp,
    expiresAt:  Date.now() + CONFIG.otpExpiryMs,
    attempts:   0,
    lastSentAt: Date.now(),
    target:     formattedNumber,
    type:       'mobile',
  });

  if (SERVICES_AVAILABLE.twilio) {
    try {
      const message = await twilioClient.messages.create({
        body: smsBody,
        from: CONFIG.twilio.from,
        to:   formattedNumber,
      });

      log('success', `SMS OTP sent`, { rid, to: formattedNumber, sid: message.sid });
      return res.json({ success: true, message: 'OTP sent via SMS.', mode: 'live' });

    } catch (err) {
      log('error', 'Twilio SMS failed', { rid, error: err.message, code: err.code });
      otpStore.delete(key); // Clean up on failure

      // Twilio-specific error messages
      const friendlyErrors = {
        21211: 'Invalid phone number. Please check and try again.',
        21408: 'SMS not supported for this region.',
        21610: 'This number has opted out of SMS.',
        30003: 'Phone is unreachable. Check signal and try again.',
        30008: 'Unknown error sending SMS. Please try again.',
      };

      return res.status(502).json({
        success: false,
        error: friendlyErrors[err.code] || `Failed to send SMS (${err.code}). Please try again.`,
        fallback: true,
      });
    }

  } else {
    // Mock mode — OTP logged to console
    log('info', `[MOCK] SMS OTP for ${formattedNumber}: ${otp}`, { rid });
    console.log(`\n${'═'.repeat(40)}`);
    console.log(`📱 DEMO SMS OTP`);
    console.log(`   To:  ${formattedNumber}`);
    console.log(`   OTP: ${otp}`);
    console.log(`${'═'.repeat(40)}\n`);

    return res.json({
      success: true,
      message: 'OTP generated (mock mode — check server console).',
      mode: 'mock',
      // In production NEVER return OTP in response. Only for dev convenience:
      demoOtp: process.env.NODE_ENV !== 'production' ? otp : undefined,
    });
  }
});

// ── Send Email OTP (SendGrid) ─────────────────────────────────────────────────
app.post('/api/send-email-otp', otpSendLimiter, async (req, res) => {
  const rid = requestId(req);
  const { email } = req.body;

  // Validate
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return res.status(400).json({ success: false, error: 'Invalid email address.' });
  }

  const key      = `email_${email.toLowerCase()}`;
  const existing = otpStore.get(key);

  // Resend cooldown
  if (existing && Date.now() - existing.lastSentAt < CONFIG.resendCooldownMs) {
    const remainingSecs = Math.ceil((CONFIG.resendCooldownMs - (Date.now() - existing.lastSentAt)) / 1000);
    return res.status(429).json({
      success: false,
      error: `Please wait ${remainingSecs} seconds before requesting a new OTP.`,
      retryAfterSeconds: remainingSecs,
    });
  }

  const otp = generateOTP();

  otpStore.set(key, {
    otp,
    expiresAt:  Date.now() + CONFIG.otpExpiryMs,
    attempts:   0,
    lastSentAt: Date.now(),
    target:     email.toLowerCase(),
    type:       'email',
  });

  if (SERVICES_AVAILABLE.sendgrid) {
    const msg = {
      to:      email,
      from:    { email: CONFIG.sendgrid.fromEmail, name: CONFIG.sendgrid.fromName },
      subject: '🔐 Verify your email – SevaSahayak OTP',
      html:    buildEmailHTML(otp, email),
      text:    `Your SevaSahayak OTP is: ${otp}\nValid for ${CONFIG.otpExpiryMs / 60000} minutes.\nDo NOT share with anyone.`,
      trackingSettings: {
        clickTracking: { enable: false },
        openTracking:  { enable: false },
      },
    };

    try {
      await sgMail.send(msg);
      log('success', `Email OTP sent`, { rid, to: email });
      return res.json({ success: true, message: 'OTP sent to email.', mode: 'live' });

    } catch (err) {
      log('error', 'SendGrid email failed', { rid, error: err.message, responseBody: err.response?.body });
      otpStore.delete(key);

      const statusCode = err.code === 401 ? 401 : 502;
      return res.status(statusCode).json({
        success: false,
        error: 'Failed to send email. Please check your email address and try again.',
        fallback: true,
      });
    }

  } else {
    log('info', `[MOCK] Email OTP for ${email}: ${otp}`, { rid });
    console.log(`\n${'═'.repeat(40)}`);
    console.log(`📧 DEMO EMAIL OTP`);
    console.log(`   To:  ${email}`);
    console.log(`   OTP: ${otp}`);
    console.log(`${'═'.repeat(40)}\n`);

    return res.json({
      success: true,
      message: 'OTP generated (mock mode — check server console).',
      mode: 'mock',
      demoOtp: process.env.NODE_ENV !== 'production' ? otp : undefined,
    });
  }
});

// ── Verify OTP (universal for email + mobile) ─────────────────────────────────
app.post('/api/verify-otp', otpVerifyLimiter, (req, res) => {
  const rid = requestId(req);
  const { type, value, otp } = req.body;

  // Validate input
  if (!type || !['email', 'mobile'].includes(type)) {
    return res.status(400).json({ success: false, error: 'Invalid OTP type.' });
  }
  if (!value || !otp || !/^\d{6}$/.test(otp)) {
    return res.status(400).json({ success: false, error: 'Invalid request parameters.' });
  }

  const key    = `${type}_${type === 'email' ? value.toLowerCase() : value}`;
  const stored = otpStore.get(key);

  if (!stored) {
    return res.json({
      success: false,
      error: 'OTP not found or expired. Please request a new one.',
      code: 'NOT_FOUND',
    });
  }

  // Expired?
  if (Date.now() > stored.expiresAt) {
    otpStore.delete(key);
    log('warn', `OTP expired`, { rid, type, target: stored.target });
    return res.json({ success: false, error: 'OTP has expired. Please request a new one.', code: 'EXPIRED' });
  }

  // Too many attempts?
  if (stored.attempts >= CONFIG.maxAttempts) {
    log('warn', `OTP blocked (max attempts)`, { rid, type, target: stored.target });
    return res.json({
      success: false,
      error: 'Too many failed attempts. Please request a new OTP.',
      code: 'BLOCKED',
    });
  }

  // Timing-safe comparison (prevents timing attacks)
  const storedBuf  = Buffer.from(stored.otp);
  const enteredBuf = Buffer.from(otp);
  const match = storedBuf.length === enteredBuf.length &&
                crypto.timingSafeEqual(storedBuf, enteredBuf);

  if (match) {
    otpStore.delete(key);
    log('success', `OTP verified`, { rid, type, target: stored.target });
    return res.json({ success: true, message: 'OTP verified successfully!', type, verified: true });

  } else {
    stored.attempts += 1;
    const remaining = CONFIG.maxAttempts - stored.attempts;
    log('warn', `Wrong OTP`, { rid, type, attempts: stored.attempts, remaining });

    return res.json({
      success: false,
      error: 'Invalid OTP. Please try again.',
      code: 'INVALID',
      attemptsRemaining: remaining,
    });
  }
});

// ── Murf AI Text-to-Speech ────────────────────────────────────────────────────
app.post('/api/tts', ttsLimiter, async (req, res) => {
  const rid  = requestId(req);
  const { text, language = 'en', speed = 1.0, pitch = 0 } = req.body;

  if (!text || typeof text !== 'string' || text.length > 3000) {
    return res.status(400).json({ success: false, error: 'Invalid text (max 3000 chars).' });
  }

  const voiceId = CONFIG.murf.voices[language] || CONFIG.murf.voices.en;

  if (SERVICES_AVAILABLE.murf) {
    try {
      const response = await fetch(`${CONFIG.murf.baseUrl}/speech/generate`, {
        method: 'POST',
        headers: {
          'api-key': CONFIG.murf.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          voiceId,
          text,
          format: 'MP3',
          sampleRate: 24000,
          speed: Math.min(Math.max(speed, 0.5), 2.0),
          pitch: Math.min(Math.max(pitch, -50), 50),
          channelType: 'MONO',
          encodeAsBase64: false,
        }),
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.message || `Murf API error: ${response.status}`);
      }

      const data = await response.json();
      log('success', `TTS generated`, { rid, voiceId, textLength: text.length });

      return res.json({
        success: true,
        audioUrl: data.audioFile,
        durationMs: data.audioDurSecs ? Math.round(data.audioDurSecs * 1000) : undefined,
        voiceId,
        mode: 'live',
      });

    } catch (err) {
      log('error', 'Murf TTS failed', { rid, error: err.message });
      return res.status(502).json({
        success: false,
        error: 'TTS generation failed. Voice will use browser TTS as fallback.',
        fallback: true,
      });
    }

  } else {
    log('info', `[MOCK] TTS request`, { rid, language, textLength: text.length });
    return res.json({
      success: true,
      audioUrl: null,
      mode: 'mock',
      message: 'Murf API not configured. Browser TTS will be used.',
    });
  }
});

// ── Document Upload ───────────────────────────────────────────────────────────
app.post('/api/upload-document', upload.single('document'), async (req, res) => {
  const rid = requestId(req);

  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No file uploaded.' });
  }

  const { docType = 'unknown', sessionId = 'general' } = req.body;

  log('success', `Document uploaded`, {
    rid,
    docType,
    sessionId,
    filename: req.file.filename,
    size: req.file.size,
    mimetype: req.file.mimetype,
  });

  return res.json({
    success: true,
    message: 'Document uploaded successfully.',
    file: {
      id:       crypto.randomUUID(),
      docType,
      filename: req.file.filename,
      size:     req.file.size,
      mimetype: req.file.mimetype,
      path:     `/uploads/${sessionId}/${req.file.filename}`,
    },
  });
});

// Upload error handler
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    const messages = {
      LIMIT_FILE_SIZE:        `File too large. Maximum size is ${CONFIG.upload.maxFileSize / (1024 * 1024)} MB.`,
      LIMIT_UNEXPECTED_FILE:  err.message || 'Unexpected file field.',
    };
    return res.status(400).json({
      success: false,
      error: messages[err.code] || 'File upload error.',
      code: err.code,
    });
  }
  next(err);
});

// ── Submit Application ────────────────────────────────────────────────────────
app.post('/api/submit-application', async (req, res) => {
  const rid = requestId(req);
  const {
    serviceId,
    formData = {},
    uploadedDocs = [],
    paymentMethod = 'upi',
    language = 'en',
  } = req.body;

  if (!serviceId || !formData.name || !formData.email || !formData.mobile) {
    return res.status(400).json({ success: false, error: 'Missing required application fields.' });
  }

  // Generate IDs
  const now       = new Date();
  const year      = now.getFullYear();
  const rand      = Math.floor(10000 + Math.random() * 90000);
  const serviceCode = (serviceId || 'APP').toUpperCase().substr(0, 3);
  const trackingId  = `${serviceCode}-${year}-${rand}`;
  const orderId     = `ORD-${year}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}-${rand}`;

  const application = {
    trackingId,
    orderId,
    serviceId,
    formData: { ...formData, mobile: `+91${formData.mobile}` },
    uploadedDocs,
    paymentMethod,
    language,
    status:    'SUBMITTED',
    createdAt: now.toISOString(),
  };

  log('success', `Application submitted`, { rid, trackingId, orderId, serviceId });

  // Send confirmation email (non-blocking)
  if (SERVICES_AVAILABLE.sendgrid && formData.email) {
    const confirmMsg = {
      to:      formData.email,
      from:    { email: CONFIG.sendgrid.fromEmail, name: CONFIG.sendgrid.fromName },
      subject: `✅ Application Submitted – ${trackingId}`,
      html:    buildConfirmationEmail(application),
      text:    `Your application ${trackingId} has been submitted. Track status at sevasahayak.in`,
      trackingSettings: { clickTracking: { enable: false } },
    };
    sgMail.send(confirmMsg).catch(err =>
      log('error', 'Failed to send confirmation email', { rid, error: err.message })
    );
  }

  return res.json({ success: true, trackingId, orderId, application });
});

function buildConfirmationEmail(app) {
  return `<!DOCTYPE html>
<html>
<head><style>
  body { font-family:Arial,sans-serif; background:#F0FDFA; }
  .wrap { max-width:560px; margin:40px auto; background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.1); }
  .header { background:linear-gradient(135deg,#0F766E,#14B8A6); color:#fff; padding:32px; text-align:center; }
  .body { padding:32px; }
  .tracking { background:#0F766E; color:#fff; border-radius:12px; padding:20px; text-align:center; margin:20px 0; }
  .tracking .id { font-size:28px; font-weight:800; letter-spacing:2px; font-family:monospace; }
  .info-row { display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #E2E8F0; font-size:14px; }
  .footer { background:#F8FAFC; padding:20px; text-align:center; font-size:12px; color:#94A3B8; }
</style></head>
<body>
<div class="wrap">
  <div class="header"><h1>✅ Application Submitted!</h1><p>SevaSahayak – Making Digital India Accessible</p></div>
  <div class="body">
    <p>Dear <strong>${app.formData.name}</strong>,</p>
    <p style="color:#64748B;margin:12px 0">Your application has been successfully submitted.</p>
    <div class="tracking">
      <div style="font-size:12px;opacity:0.85;margin-bottom:8px;text-transform:uppercase;letter-spacing:1px">Tracking ID</div>
      <div class="id">${app.trackingId}</div>
    </div>
    <div class="info-row"><span>Order ID</span><span><strong>${app.orderId}</strong></span></div>
    <div class="info-row"><span>Service</span><span>${app.serviceId}</span></div>
    <div class="info-row"><span>Submitted</span><span>${new Date(app.createdAt).toLocaleString('en-IN')}</span></div>
    <div class="info-row"><span>Delivery Email</span><span>${app.formData.email}</span></div>
    <p style="margin-top:20px;font-size:13px;color:#64748B">
      We'll send you updates via email and SMS at every stage.<br>
      Need help? Email <a href="mailto:support@sevasahayak.in">support@sevasahayak.in</a>
    </p>
  </div>
  <div class="footer">© 2026 SevaSahayak — sevasahayak.in</div>
</div>
</body>
</html>`;
}

// ── Check OTP Status (for polling) ────────────────────────────────────────────
app.get('/api/otp-status', (req, res) => {
  const { type, value } = req.query;
  if (!type || !value) return res.status(400).json({ success: false });

  const key    = `${type}_${value.toLowerCase()}`;
  const stored = otpStore.get(key);

  if (!stored || Date.now() > stored.expiresAt) {
    return res.json({ exists: false });
  }

  res.json({
    exists: true,
    expiresIn: Math.max(0, Math.ceil((stored.expiresAt - Date.now()) / 1000)),
    attemptsRemaining: CONFIG.maxAttempts - stored.attempts,
  });
});

// ── Serve uploaded files ───────────────────────────────────────────────────────
app.use('/uploads', express.static(CONFIG.upload.uploadDir, {
  // Security: don't expose directory listings
  dotfiles: 'deny',
}));

// ── Catch-all → serve frontend ────────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  log('error', 'Unhandled server error', { error: err.message, stack: err.stack });
  res.status(500).json({ success: false, error: 'Internal server error.' });
});

// ─── Start ───────────────────────────────────────────────────────────────────
app.listen(CONFIG.port, '0.0.0.0', () => {
  console.log(`\n✅ SevaSahayak Server running on port ${CONFIG.port}`);
  console.log(`🌐 Frontend: http://localhost:${CONFIG.port}`);
  console.log(`📡 API Base: http://localhost:${CONFIG.port}/api`);
  console.log(`\n📋 API Endpoints:`);
  console.log(`   POST /api/send-sms-otp      → Twilio SMS OTP`);
  console.log(`   POST /api/send-email-otp    → SendGrid Email OTP`);
  console.log(`   POST /api/verify-otp        → Verify OTP`);
  console.log(`   POST /api/tts               → Murf AI Text-to-Speech`);
  console.log(`   POST /api/upload-document   → File upload (multer)`);
  console.log(`   POST /api/submit-application → Submit & send confirmation`);
  console.log(`   GET  /api/health            → Health check`);
  console.log(`\n${'─'.repeat(40)}\n`);
});

module.exports = app; // for testing

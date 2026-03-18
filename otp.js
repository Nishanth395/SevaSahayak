// =============================================
// OTP SYSTEM (Mock with real UI)
// =============================================

window.OTPSystem = {
  otpStore: {}, // key: { otp, expiresAt, attempts }

  generateOTP() {
    return String(Math.floor(100000 + Math.random() * 900000));
  },

  sendEmailOTP(email) {
    return new Promise((resolve) => {
      const otp = this.generateOTP();
      const key = `email_${email}`;

      this.otpStore[key] = {
        otp,
        expiresAt: Date.now() + 2 * 60 * 1000,
        attempts: 0
      };

      console.log(`📧 [MOCK] Email OTP for ${email}: ${otp}`);
      Toast.info(`📧 Demo OTP: ${otp} (for testing)`, 8000);

      setTimeout(() => resolve({ success: true }), 1200);
    });
  },

  sendSMSOTP(mobile) {
    return new Promise((resolve) => {
      const otp = this.generateOTP();
      const key = `mobile_${mobile}`;

      this.otpStore[key] = {
        otp,
        expiresAt: Date.now() + 2 * 60 * 1000,
        attempts: 0
      };

      console.log(`📱 [MOCK] SMS OTP for ${mobile}: ${otp}`);
      Toast.info(`📱 Demo OTP: ${otp} (for testing)`, 8000);

      setTimeout(() => resolve({ success: true }), 1500);
    });
  },

  verifyOTP(type, value, enteredOTP) {
    const key = `${type}_${value}`;
    const stored = this.otpStore[key];

    if (!stored) {
      return { success: false, error: 'OTP expired. Please request a new one.', code: 'NOT_FOUND' };
    }

    if (Date.now() > stored.expiresAt) {
      delete this.otpStore[key];
      return { success: false, error: 'OTP expired. Please request a new one.', code: 'EXPIRED' };
    }

    if (stored.attempts >= 3) {
      return { success: false, error: 'Too many attempts. Please request a new OTP.', code: 'BLOCKED' };
    }

    if (stored.otp === enteredOTP) {
      delete this.otpStore[key];
      return { success: true };
    } else {
      stored.attempts += 1;
      return {
        success: false,
        error: 'Invalid OTP. Please try again.',
        attemptsRemaining: 3 - stored.attempts,
        code: 'INVALID'
      };
    }
  },

  resendOTP(type, value) {
    if (type === 'email') return this.sendEmailOTP(value);
    return this.sendSMSOTP(value);
  }
};


// =============================================
// OTP UI COMPONENT
// =============================================

window.OTPModal = {
  currentType: null,   // 'email' | 'mobile'
  currentValue: null,
  onSuccess: null,
  phase: 'send',       // 'send' | 'enter' | 'success' | 'error' | 'expired' | 'blocked'
  timerInterval: null,
  resendCooldown: null,
  resendSeconds: 30,

  show(type, value, onSuccess) {
    this.currentType = type;
    this.currentValue = value;
    this.onSuccess = onSuccess;
    this.phase = 'send';

    this.createModal();
  },

  createModal() {
    // Remove existing
    const existing = document.getElementById('otp-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'otp-overlay';
    overlay.id = 'otp-overlay';
    overlay.innerHTML = this.renderCard();
    document.body.appendChild(overlay);

    this.bindEvents();
  },

  renderCard() {
    const isEmail = this.currentType === 'email';
    const icon = isEmail ? '📧' : '📱';
    const maskedValue = isEmail
      ? this.maskEmail(this.currentValue)
      : `+91 ${this.maskMobile(this.currentValue)}`;

    return `
      <div class="otp-card" id="otp-card">
        <div class="otp-header">
          <div class="otp-icon-wrap">${icon}</div>
          <div class="otp-title">${t(isEmail ? 'email_verify_title' : 'mobile_verify_title')}</div>
          <div class="otp-desc">We'll send a 6-digit verification code to<br><strong class="otp-target">${maskedValue}</strong></div>
        </div>
        <div class="otp-body" id="otp-body">
          ${this.renderSendPhase()}
        </div>
      </div>
    `;
  },

  renderSendPhase() {
    const isEmail = this.currentType === 'email';
    const whyItems = isEmail
      ? [t('verify_why_1'), t('verify_why_2'), t('verify_why_3'), t('verify_why_4')]
      : [t('sms_why_1'), t('sms_why_2'), t('sms_why_3'), t('sms_why_4')];

    return `
      <div class="send-otp-phase text-center">
        <div class="why-verify mb-16">
          ${whyItems.map(item => `<div class="why-verify-item">${item}</div>`).join('')}
        </div>
        <button class="btn btn-primary" style="width:100%" id="otp-send-btn" onclick="OTPModal.sendOTP()">
          ${t(isEmail ? 'send_code' : 'send_otp')}
        </button>
        <a class="change-link" onclick="OTPModal.close()">✏️ ${t(isEmail ? 'change_email' : 'change_number')}</a>
      </div>
    `;
  },

  renderEnterPhase(sent) {
    return `
      <div class="enter-otp-phase">
        <div class="otp-sent-info text-center">
          <div class="otp-sent-badge">✓ ${sent}</div>
          <div class="otp-sent-number">${this.currentType === 'email' ? '📧' : '📱'} ${this.currentType === 'email' ? this.currentValue : '+91 ' + this.currentValue}</div>
        </div>

        <div class="otp-boxes" id="otp-boxes">
          ${[0,1,2,3,4,5].map(i => `
            <input class="otp-box" id="otp-box-${i}" type="text" inputmode="numeric"
                   maxlength="1" placeholder="•" autocomplete="one-time-code"
                   onkeydown="OTPModal.onKeyDown(event, ${i})"
                   oninput="OTPModal.onInput(event, ${i})"
                   onpaste="OTPModal.onPaste(event)">
          `).join('')}
        </div>

        <div class="otp-timer text-center" id="otp-timer">
          ${t('code_valid')} <span class="timer-count" id="timer-count">2:00</span>
        </div>

        <div class="resend-help text-center">
          ${t('auto_verify')}
        </div>

        <div class="otp-resend-section">
          <button class="resend-btn" id="resend-btn" onclick="OTPModal.resend()" disabled>
            ${t('resend_code')} (${t('code_valid')} <span id="resend-timer">${this.resendSeconds}s</span>)
          </button>
          <div class="resend-help">
            Didn't receive? Check spam folder or wait 30 seconds.
          </div>
        </div>

        <a class="change-link" onclick="OTPModal.close()">✏️ ${t(this.currentType === 'email' ? 'change_email' : 'change_number')}</a>
      </div>
    `;
  },

  renderSuccessPhase() {
    const label = this.currentType === 'email'
      ? `📧 ${this.currentValue}`
      : `📱 +91 ${this.currentValue}`;

    return `
      <div class="otp-success-phase">
        <div class="success-check-wrap">✓</div>
        <div class="success-title">${t('otp_success_title')}</div>
        <div style="color: var(--text-secondary); margin-bottom:12px; font-size:0.88rem">${label} verified successfully!</div>

        <div class="success-info-list">
          ${['✓ Application status updates', '✓ Forms and receipts', '✓ Important notifications', '✓ Delivery confirmations'].map(i =>
            `<div class="success-info-item">${i}</div>`
          ).join('')}
        </div>

        <div class="auto-continue" id="auto-continue-text">Continuing in <strong>2</strong> seconds…</div>
        <div class="progress-bar mb-16"><div class="progress-fill" id="auto-progress" style="width:0%"></div></div>

        <button class="btn btn-success" style="width:100%" onclick="OTPModal.continueAfterSuccess()">
          ${t('continue_btn')}
        </button>
      </div>
    `;
  },

  renderErrorPhase(attemptsRemaining) {
    const dots = [1,2,3].map(i =>
      `<div class="attempt-dot ${i > attemptsRemaining ? '' : 'empty'}"></div>`
    ).join('');

    return `
      <div class="otp-error-phase">
        <div class="error-icon-wrap">✗</div>
        <div class="error-title">${t('otp_error_title')}</div>
        <p style="color:var(--text-secondary);font-size:0.88rem;margin-bottom:12px">${t('wrong_code')}</p>
        <div class="attempts-indicator">${dots}<span style="font-size:12px;color:var(--text-secondary);margin-left:8px">${attemptsRemaining} attempt${attemptsRemaining !== 1 ? 's' : ''} remaining</span></div>
        <div class="error-actions">
          <button class="btn btn-outline" style="flex:1" onclick="OTPModal.tryAgain()">${t('try_again')}</button>
          <button class="btn btn-primary" style="flex:1" onclick="OTPModal.resend()">${t('resend_code')}</button>
        </div>
      </div>
    `;
  },

  renderExpiredPhase() {
    return `
      <div class="otp-expired-phase">
        <div class="phase-icon">⏱️</div>
        <div class="phase-title">${t('otp_expired_title')}</div>
        <div class="phase-desc">${t('code_expired_desc')}</div>
        <button class="btn btn-primary" style="width:100%" onclick="OTPModal.resend()">${t('request_new')}</button>
      </div>
    `;
  },

  renderBlockedPhase() {
    return `
      <div class="otp-blocked-phase">
        <div class="phase-icon">🚫</div>
        <div class="phase-title">${t('otp_blocked_title')}</div>
        <div class="phase-desc">${t('blocked_desc')}</div>
        <button class="btn btn-primary" style="width:100%" onclick="OTPModal.resend()">${t('request_new')}</button>
        <div style="margin-top:16px;font-size:12px;color:var(--text-secondary);text-align:center">
          Need help? 📧 support@sevasahayak.in
        </div>
      </div>
    `;
  },

  async sendOTP() {
    const btn = document.getElementById('otp-send-btn');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<div class="spinner spinner-sm"></div> Sending…';
    }

    try {
      let result;
      if (this.currentType === 'email') {
        result = await OTPSystem.sendEmailOTP(this.currentValue);
      } else {
        result = await OTPSystem.sendSMSOTP(this.currentValue);
      }

      if (result.success) {
        this.phase = 'enter';
        document.getElementById('otp-body').innerHTML = this.renderEnterPhase(
          this.currentType === 'email' ? t('code_sent') : t('otp_sent_sms')
        );
        this.startTimer();
        this.startResendTimer();
        setTimeout(() => document.getElementById('otp-box-0')?.focus(), 100);
      }
    } catch (err) {
      Toast.error('Failed to send code. Please try again.');
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = t(this.currentType === 'email' ? 'send_code' : 'send_otp');
      }
    }
  },

  onInput(event, index) {
    const val = event.target.value.replace(/\D/g, '');
    event.target.value = val;

    if (val) {
      event.target.classList.add('filled');
      event.target.classList.remove('error');
      if (index < 5) {
        document.getElementById(`otp-box-${index + 1}`)?.focus();
      } else {
        this.autoVerify();
      }
    } else {
      event.target.classList.remove('filled');
    }
  },

  onKeyDown(event, index) {
    if (event.key === 'Backspace' && !event.target.value && index > 0) {
      const prev = document.getElementById(`otp-box-${index - 1}`);
      if (prev) {
        prev.value = '';
        prev.classList.remove('filled');
        prev.focus();
      }
    }
  },

  onPaste(event) {
    event.preventDefault();
    const text = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    for (let i = 0; i < 6; i++) {
      const box = document.getElementById(`otp-box-${i}`);
      if (box) {
        box.value = text[i] || '';
        box.classList.toggle('filled', !!text[i]);
      }
    }
    if (text.length === 6) this.autoVerify();
  },

  getEnteredOTP() {
    return [0,1,2,3,4,5].map(i => document.getElementById(`otp-box-${i}`)?.value || '').join('');
  },

  autoVerify() {
    const entered = this.getEnteredOTP();
    if (entered.length === 6) {
      this.verify(entered);
    }
  },

  verify(entered) {
    const result = OTPSystem.verifyOTP(this.currentType, this.currentValue, entered);

    if (result.success) {
      this.clearTimer();
      this.phase = 'success';
      document.getElementById('otp-body').innerHTML = this.renderSuccessPhase();
      launchConfetti(2000);

      // Auto-continue timer
      let secs = 2;
      const interval = setInterval(() => {
        secs--;
        const el = document.getElementById('auto-continue-text');
        const prog = document.getElementById('auto-progress');
        if (el) el.innerHTML = `Continuing in <strong>${secs}</strong> seconds…`;
        if (prog) prog.style.width = `${((2 - secs) / 2) * 100}%`;

        if (secs <= 0) {
          clearInterval(interval);
          this.continueAfterSuccess();
        }
      }, 1000);

    } else if (result.code === 'EXPIRED') {
      this.clearTimer();
      document.getElementById('otp-body').innerHTML = this.renderExpiredPhase();
    } else if (result.code === 'BLOCKED') {
      this.clearTimer();
      document.getElementById('otp-body').innerHTML = this.renderBlockedPhase();
    } else {
      // Show error, clear boxes
      [0,1,2,3,4,5].forEach(i => {
        const box = document.getElementById(`otp-box-${i}`);
        if (box) {
          box.classList.add('error');
          box.classList.remove('filled');
        }
      });
      setTimeout(() => {
        document.getElementById('otp-body').innerHTML = this.renderErrorPhase(result.attemptsRemaining || 0);
      }, 600);
      Toast.error(result.error);
    }
  },

  tryAgain() {
    document.getElementById('otp-body').innerHTML = this.renderEnterPhase(
      this.currentType === 'email' ? t('code_sent') : t('otp_sent_sms')
    );
    this.startTimer();
    setTimeout(() => document.getElementById('otp-box-0')?.focus(), 100);
  },

  async resend() {
    this.clearTimer();
    document.getElementById('otp-body').innerHTML = this.renderSendPhase();
    await this.sendOTP();
  },

  continueAfterSuccess() {
    this.clearTimer();
    const overlay = document.getElementById('otp-overlay');
    if (overlay) overlay.remove();

    if (this.currentType === 'email') {
      APP_STATE.emailVerified = true;
    } else {
      APP_STATE.mobileVerified = true;
    }

    if (this.onSuccess) this.onSuccess();
  },

  close() {
    this.clearTimer();
    const overlay = document.getElementById('otp-overlay');
    if (overlay) overlay.remove();
  },

  startTimer() {
    let seconds = 120;
    this.clearTimer();
    this.timerInterval = setInterval(() => {
      seconds--;
      const el = document.getElementById('timer-count');
      if (el) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        el.textContent = `${mins}:${String(secs).padStart(2, '0')}`;
        el.classList.toggle('urgent', seconds <= 30);
      }

      if (seconds <= 0) {
        this.clearTimer();
        // Auto-show expired
        const body = document.getElementById('otp-body');
        if (body && this.phase === 'enter') {
          body.innerHTML = this.renderExpiredPhase();
        }
      }
    }, 1000);
  },

  startResendTimer() {
    let secs = this.resendSeconds;
    this.clearResendTimer();
    this.resendCooldown = setInterval(() => {
      secs--;
      const el = document.getElementById('resend-timer');
      if (el) el.textContent = `${secs}s`;
      if (secs <= 0) {
        this.clearResendTimer();
        const btn = document.getElementById('resend-btn');
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = t('resend_code');
        }
      }
    }, 1000);
  },

  clearTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = null;
  },

  clearResendTimer() {
    if (this.resendCooldown) clearInterval(this.resendCooldown);
    this.resendCooldown = null;
  },

  bindEvents() {},

  maskEmail(email) {
    const [user, domain] = email.split('@');
    const masked = user.slice(0, 2) + '***' + user.slice(-1);
    return `${masked}@${domain}`;
  },

  maskMobile(mobile) {
    return mobile.slice(0, 2) + 'XXXX' + mobile.slice(-4);
  }
};

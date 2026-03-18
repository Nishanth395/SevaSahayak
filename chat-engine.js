// =============================================
// CHAT ENGINE — Drives the conversation flow
// =============================================

window.ChatEngine = {
  service: null,
  currentStep: 0,
  steps: [],
  formData: {},
  uploadedDocs: {},
  chatPhase: 'greeting', // greeting | questions | email_otp | mobile_otp | docs | review | payment | done

  init(service) {
    this.service = service;
    this.currentStep = 0;
    this.formData = {};
    this.uploadedDocs = {};
    this.chatPhase = 'greeting';

    this.steps = [
      { key: 'name', label: 'Full Name', type: 'text' },
      { key: 'dob', label: 'Date of Birth', type: 'dob' },
      { key: 'father_name', label: "Father's Name", type: 'text' },
      { key: 'email', label: 'Email Address', type: 'email' },
      { key: 'mobile', label: 'Mobile Number', type: 'mobile' },
      { key: 'address', label: 'Address', type: 'text' },
      { key: 'pincode', label: 'Pincode', type: 'pincode' },
    ];

    APP_STATE.formData = this.formData;
    APP_STATE.uploadedDocs = this.uploadedDocs;
  },

  // ---- Get AI Question ----
  getQuestion(step) {
    const questionMap = {
      name: t('q_name'),
      dob: t('q_dob'),
      father_name: t('q_father'),
      email: t('q_email'),
      mobile: t('q_mobile'),
      address: t('q_address'),
      pincode: t('q_pincode')
    };
    return questionMap[this.steps[step]?.key] || 'Please provide more information.';
  },

  // ---- Validation ----
  validate(key, value) {
    value = value.trim();
    switch(key) {
      case 'name':
      case 'father_name':
        if (!value || value.length < 2) return 'Name must be at least 2 characters.';
        if (!/^[A-Za-z\s\u0900-\u097F\u0C00-\u0C7F]+$/u.test(value)) return 'Name can only contain letters and spaces.';
        return null;

      case 'dob': {
        const parts = value.split('/');
        if (parts.length !== 3) return 'Please enter date as DD/MM/YYYY (e.g., 15/08/1999)';
        const [d, m, y] = parts.map(Number);
        if (!d || !m || !y || d < 1 || d > 31 || m < 1 || m > 12) return 'Please enter a valid date.';
        const date = new Date(y, m - 1, d);
        const now = new Date();
        const age = Math.floor((now - date) / (365.25 * 24 * 3600 * 1000));
        if (date > now) return 'Date of birth cannot be in the future.';
        if (age < 18) return 'You must be 18 or older to apply for this service.';
        if (age > 100) return 'Please check the date — age cannot exceed 100 years.';
        return null;
      }

      case 'email':
        if (!value.includes('@') || !value.includes('.')) return 'Please enter a valid email address (e.g., name@gmail.com).';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email address.';
        return null;

      case 'mobile':
        if (!/^\d{10}$/.test(value)) return 'Mobile number must be exactly 10 digits.';
        if (!/^[6-9]/.test(value)) return 'Mobile number must start with 6, 7, 8, or 9.';
        return null;

      case 'address':
        if (!value || value.length < 15) return 'Please enter your complete address (minimum 15 characters).';
        return null;

      case 'pincode':
        if (!/^\d{6}$/.test(value)) return 'Pincode must be exactly 6 digits.';
        return null;

      default:
        return null;
    }
  },

  // ---- Format display value ----
  formatValue(key, value) {
    if (key === 'mobile') return value.slice(0, 5) + ' ' + value.slice(5);
    if (key === 'name' || key === 'father_name') {
      return value.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    }
    return value;
  },

  // ---- Process spoken/typed input ----
  processInput(rawInput) {
    if (!rawInput || !rawInput.trim()) return;

    const step = this.steps[this.currentStep];
    if (!step) return;

    let value = rawInput.trim();

    // Auto-process DOB from speech
    if (step.key === 'dob') {
      value = this.parseDOB(value);
    }

    // Auto-lowercase email
    if (step.key === 'email') {
      value = value.toLowerCase().replace(/\s/g, '');
    }

    // Remove spaces from mobile
    if (step.key === 'mobile') {
      value = value.replace(/\D/g, '');
    }

    // Remove spaces from pincode
    if (step.key === 'pincode') {
      value = value.replace(/\D/g, '');
    }

    const error = this.validate(step.key, value);

    if (error) {
      ChatPage.addMessage({ role: 'user', text: rawInput });
      ChatPage.addMessage({ role: 'ai', text: `⚠️ ${error} Please try again.` });
      return;
    }

    // Valid — save and respond
    const formatted = this.formatValue(step.key, value);
    this.formData[step.key] = formatted;
    APP_STATE.setFormField(step.key, formatted);

    ChatPage.addMessage({ role: 'user', text: rawInput });

    const confirmMsg = this.getConfirmation(step.key, formatted);
    ChatPage.addMessage({ role: 'ai', text: confirmMsg });

    this.currentStep++;
    ChatPage.updateProgress(this.currentStep, this.steps.length + 2); // +2 for docs & review

    // Handle special steps
    if (step.key === 'email') {
      setTimeout(() => this.triggerEmailOTP(formatted), 800);
      return;
    }

    if (step.key === 'mobile') {
      setTimeout(() => this.triggerMobileOTP(formatted), 800);
      return;
    }

    if (this.currentStep >= this.steps.length) {
      setTimeout(() => this.startDocumentUpload(), 800);
      return;
    }

    // Next question
    setTimeout(() => {
      ChatPage.addMessage({ role: 'ai', text: this.getQuestion(this.currentStep) });
    }, 700);
  },

  getConfirmation(key, value) {
    const confirmations = {
      name: `Thank you, ${value}! I've saved your name. ✓`,
      dob: `Got it! Born on ${value}. Moving to the next question.`,
      father_name: `Noted! Father's name: ${value} ✓`,
      email: `Perfect! I'll send a verification code to ${value}.`,
      mobile: `Got it! Sending OTP to +91 ${value}…`,
      address: `Your address has been saved. ✓`,
      pincode: `Pincode ${value} saved! `
    };
    return confirmations[key] || `Saved: ${value} ✓`;
  },

  triggerEmailOTP(email) {
    ChatPage.addMessage({ role: 'ai', text: `📧 Sending email verification code to ${email}…` });
    setTimeout(() => {
      OTPModal.show('email', email, () => {
        APP_STATE.emailVerified = true;
        ChatPage.addMessage({ role: 'system', text: '✅ Email address verified!', type: 'success' });
        setTimeout(() => {
          ChatPage.addMessage({ role: 'ai', text: this.getQuestion(this.currentStep) });
        }, 800);
      });
    }, 800);
  },

  triggerMobileOTP(mobile) {
    ChatPage.addMessage({ role: 'ai', text: `📱 Sending OTP to +91 ${mobile} via SMS…` });
    setTimeout(() => {
      OTPModal.show('mobile', mobile, () => {
        APP_STATE.mobileVerified = true;
        ChatPage.addMessage({ role: 'system', text: '✅ Mobile number verified!', type: 'success' });
        setTimeout(() => {
          if (this.currentStep >= this.steps.length) {
            this.startDocumentUpload();
          } else {
            ChatPage.addMessage({ role: 'ai', text: this.getQuestion(this.currentStep) });
          }
        }, 800);
      });
    }, 800);
  },

  startDocumentUpload() {
    this.chatPhase = 'docs';
    ChatPage.addMessage({ role: 'ai', text: t('q_docs') });
    setTimeout(() => {
      ChatPage.addDocUploadCards();
    }, 600);
  },

  onAllDocsUploaded() {
    this.chatPhase = 'review';
    ChatPage.addMessage({ role: 'ai', text: "Perfect! ✓ All documents received. Let me prepare your application form for review." });
    setTimeout(() => {
      ChatPage.addMessage({ role: 'ai', text: "Here's your complete application form. Please review every detail carefully. You can edit any field by clicking the edit button." });
      ChatPage.addReviewCard();
    }, 1500);
  },

  onReviewConfirmed() {
    this.chatPhase = 'payment';
    ChatPage.addMessage({ role: 'ai', text: "Excellent! Everything verified ✓. Preparing payment details…" });
    setTimeout(() => {
      ChatPage.addPaymentCard();
    }, 800);
  },

  // ---- Parse spoken DOB ----
  parseDOB(input) {
    // If already DD/MM/YYYY format
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(input)) return input;

    const months = {
      'january': '01', 'february': '02', 'march': '03', 'april': '04',
      'may': '05', 'june': '06', 'july': '07', 'august': '08',
      'september': '09', 'october': '10', 'november': '11', 'december': '12',
      'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
      'jun': '06', 'jul': '07', 'aug': '08', 'sep': '09',
      'oct': '10', 'nov': '11', 'dec': '12',
      // Hindi months
      'जनवरी': '01', 'फरवरी': '02', 'मार्च': '03', 'अप्रैल': '04',
      'मई': '05', 'जून': '06', 'जुलाई': '07', 'अगस्त': '08',
      'सितंबर': '09', 'अक्टूबर': '10', 'नवंबर': '11', 'दिसंबर': '12'
    };

    const words = input.toLowerCase().split(/[\s,]+/);
    let day = null, month = null, year = null;

    for (const word of words) {
      const num = parseInt(word);
      if (!isNaN(num)) {
        if (num >= 1900 && num <= 2100) year = num;
        else if (!day) day = num;
      } else if (months[word]) {
        month = months[word];
      }
    }

    if (day && month && year) {
      return `${String(day).padStart(2, '0')}/${month}/${year}`;
    }

    return input; // Return as-is if can't parse
  },

  getSidebarSteps() {
    return this.steps.map((s, i) => ({
      label: s.label,
      done: i < this.currentStep,
      active: i === this.currentStep
    }));
  }
};

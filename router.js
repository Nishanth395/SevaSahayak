// =============================================
// ROUTER - Simple hash-based navigation
// =============================================

window.APP_STATE = {
  language: localStorage.getItem('sevasahayak_lang') || 'en',
  currentPage: 'landing',
  selectedService: null,
  formData: {},
  uploadedDocs: {},
  chatMessages: [],
  emailVerified: false,
  mobileVerified: false,
  paymentDone: false,
  applicationId: null,
  trackingId: null,

  setLanguage(lang) {
    this.language = lang;
    localStorage.setItem('sevasahayak_lang', lang);
  },

  selectService(serviceId) {
    this.selectedService = SERVICES_DATA.find(s => s.id === serviceId);
    this.formData = {};
    this.uploadedDocs = {};
    this.chatMessages = [];
    this.emailVerified = false;
    this.mobileVerified = false;
    this.paymentDone = false;
  },

  setFormField(field, value) {
    this.formData[field] = value;
  },

  addMessage(msg) {
    this.chatMessages.push(msg);
  },

  generateIds() {
    const now = new Date();
    const year = now.getFullYear();
    const rand = Math.floor(10000 + Math.random() * 90000);
    const service = (this.selectedService?.id || 'APP').toUpperCase().substr(0, 3);
    this.trackingId = `${service}-${year}-${rand}`;
    this.applicationId = `ORD-${year}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}-${rand}`;
  }
};

window.Router = {
  current: 'landing',

  navigate(page) {
    this.current = page;
    APP_STATE.currentPage = page;
    this.render();
    window.scrollTo(0, 0);
  },

  render() {
    const app = document.getElementById('app');
    if (!app) return;

    switch(this.current) {
      case 'landing':
        app.innerHTML = LandingPage.render();
        LandingPage.init();
        break;
      case 'chat':
        app.innerHTML = ChatPage.render();
        ChatPage.init();
        break;
      case 'success':
        app.innerHTML = SuccessPage.render();
        SuccessPage.init();
        break;
      default:
        app.innerHTML = LandingPage.render();
        LandingPage.init();
    }
  }
};

// =============================================
// TOAST NOTIFICATIONS
// =============================================
window.Toast = {
  show(message, type = 'info', duration = 3500) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }

    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${icons[type] || '💬'}</span><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('leaving');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  success(m) { this.show(m, 'success'); },
  error(m) { this.show(m, 'error'); },
  warning(m) { this.show(m, 'warning'); },
  info(m) { this.show(m, 'info'); }
};

// =============================================
// CONFETTI
// =============================================
window.launchConfetti = function(duration = 3000) {
  const container = document.createElement('div');
  container.className = 'confetti-container';
  document.body.appendChild(container);

  const colors = ['#0F766E', '#14B8A6', '#FF9933', '#138808', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

  for (let i = 0; i < 80; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.cssText = `
      left: ${Math.random() * 100}%;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      width: ${6 + Math.random() * 8}px;
      height: ${6 + Math.random() * 8}px;
      border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
      animation-duration: ${1.5 + Math.random() * 2}s;
      animation-delay: ${Math.random() * 1.5}s;
    `;
    container.appendChild(piece);
  }

  setTimeout(() => container.remove(), duration + 2000);
};

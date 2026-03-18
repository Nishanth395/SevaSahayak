// =============================================
// SERVICES DATA
// =============================================

window.SERVICES_DATA = [
  {
    id: 'pan',
    icon: '💳',
    name: 'PAN Card',
    desc: 'New PAN Card Application',
    price: '₹99',
    priceNum: 99,
    processing: '7-10 days',
    successRate: '98%',
    documents: 3,
    category: 'documents',
    steps: ['Personal Details', 'Date of Birth', 'Father\'s Name', 'Email (OTP)', 'Mobile (OTP)', 'Address', 'Pincode', 'Documents', 'Review', 'Payment'],
    totalSteps: 10,
    authority: 'NSDL e-Gov',
    deliveryDays: '7-10 business days',
    requiredDocs: [
      { id: 'aadhaar', label: 'Aadhaar Card', icon: '📄', desc: 'Both sides, clear scan', maxSize: '2MB' },
      { id: 'photo', label: 'Passport Photograph', icon: '📸', desc: 'White background, recent', maxSize: '500KB' },
      { id: 'signature', label: 'Signature Image', icon: '✍️', desc: 'On white paper, black/blue pen', maxSize: '500KB' }
    ]
  },
  {
    id: 'aadhaar',
    icon: '🆔',
    name: 'Aadhaar Update',
    desc: 'Update Address, Mobile, Name, DOB',
    price: '₹99',
    priceNum: 99,
    processing: '3-5 days',
    successRate: '99%',
    documents: 2,
    category: 'updates',
    steps: ['Update Type', 'Personal Details', 'Email (OTP)', 'Mobile (OTP)', 'Documents', 'Review', 'Payment'],
    totalSteps: 7,
    authority: 'UIDAI',
    deliveryDays: '3-5 business days',
    requiredDocs: [
      { id: 'aadhaar', label: 'Existing Aadhaar Card', icon: '📄', desc: 'Current Aadhaar copy', maxSize: '2MB' },
      { id: 'proof', label: 'Proof of Update', icon: '📋', desc: 'Document for the field being updated', maxSize: '2MB' }
    ]
  },
  {
    id: 'passport',
    icon: '🛂',
    name: 'Passport',
    desc: 'New Passport Application (Normal/Tatkal)',
    price: '₹299',
    priceNum: 299,
    processing: '30-45 days',
    successRate: '96%',
    documents: 5,
    category: 'documents',
    steps: ['Passport Type', 'Personal Details', 'Email (OTP)', 'Mobile (OTP)', 'Address', 'Documents', 'Review', 'Payment'],
    totalSteps: 8,
    authority: 'Passport Seva Kendra',
    deliveryDays: '30-45 business days',
    requiredDocs: [
      { id: 'aadhaar', label: 'Aadhaar Card', icon: '📄', desc: 'Both sides, clear scan', maxSize: '2MB' },
      { id: 'photo', label: 'Passport Photograph', icon: '📸', desc: 'White background, recent', maxSize: '500KB' },
      { id: 'birth_cert', label: 'Birth Certificate', icon: '📋', desc: 'Original or certified copy', maxSize: '2MB' },
      { id: 'address_proof', label: 'Address Proof', icon: '🏠', desc: 'Utility bill or bank statement', maxSize: '2MB' },
      { id: 'signature', label: 'Signature Image', icon: '✍️', desc: 'On white paper, black/blue pen', maxSize: '500KB' }
    ]
  },
  {
    id: 'license',
    icon: '🚗',
    name: 'Driving License',
    desc: 'Learner, Permanent, or Renewal',
    price: '₹299',
    priceNum: 299,
    processing: '15-30 days',
    successRate: '97%',
    documents: 3,
    category: 'documents',
    steps: ['License Type', 'Personal Details', 'Email (OTP)', 'Mobile (OTP)', 'Address', 'Documents', 'Review', 'Payment'],
    totalSteps: 8,
    authority: 'Regional Transport Office',
    deliveryDays: '15-30 business days',
    requiredDocs: [
      { id: 'aadhaar', label: 'Aadhaar Card', icon: '📄', desc: 'Identity & address proof', maxSize: '2MB' },
      { id: 'photo', label: 'Passport Photograph', icon: '📸', desc: 'White background, recent', maxSize: '500KB' },
      { id: 'signature', label: 'Signature Image', icon: '✍️', desc: 'On white paper', maxSize: '500KB' }
    ]
  },
  {
    id: 'birth',
    icon: '👶',
    name: 'Birth Certificate',
    desc: 'New, Duplicate, or Correction',
    price: '₹199',
    priceNum: 199,
    processing: '7-15 days',
    successRate: '98%',
    documents: 2,
    category: 'certificates',
    steps: ['Certificate Type', 'Personal Details', 'Email (OTP)', 'Mobile (OTP)', 'Documents', 'Review', 'Payment'],
    totalSteps: 7,
    authority: 'Municipal Corporation',
    deliveryDays: '7-15 business days',
    requiredDocs: [
      { id: 'hospital', label: 'Hospital Birth Record', icon: '🏥', desc: 'Discharge summary or birth record', maxSize: '2MB' },
      { id: 'parent_id', label: 'Parent ID Proof', icon: '📄', desc: 'Aadhaar or any government ID', maxSize: '2MB' }
    ]
  },
  {
    id: 'marriage',
    icon: '💑',
    name: 'Marriage Certificate',
    desc: 'New or Duplicate Certificate',
    price: '₹199',
    priceNum: 199,
    processing: '15-30 days',
    successRate: '97%',
    documents: 3,
    category: 'certificates',
    steps: ['Certificate Type', 'Couple Details', 'Email (OTP)', 'Mobile (OTP)', 'Documents', 'Review', 'Payment'],
    totalSteps: 7,
    authority: 'Marriage Office / Sub-Registrar',
    deliveryDays: '15-30 business days',
    requiredDocs: [
      { id: 'couple_id', label: 'Both ID Proofs', icon: '📄', desc: 'Aadhaar of bride and groom', maxSize: '2MB' },
      { id: 'photo', label: 'Marriage Photograph', icon: '📸', desc: 'Wedding photo', maxSize: '2MB' },
      { id: 'invitation', label: 'Marriage Invitation', icon: '💌', desc: 'Invitation card if available', maxSize: '2MB' }
    ]
  },
  {
    id: 'voter',
    icon: '🗳️',
    name: 'Voter ID Card',
    desc: 'New, Correction, or Duplicate',
    price: '₹99',
    priceNum: 99,
    processing: '30-45 days',
    successRate: '95%',
    documents: 2,
    category: 'documents',
    steps: ['Card Type', 'Personal Details', 'Email (OTP)', 'Mobile (OTP)', 'Address', 'Documents', 'Review', 'Payment'],
    totalSteps: 8,
    authority: 'Election Commission of India',
    deliveryDays: '30-45 business days',
    requiredDocs: [
      { id: 'aadhaar', label: 'Aadhaar Card', icon: '📄', desc: 'Identity & address proof', maxSize: '2MB' },
      { id: 'photo', label: 'Passport Photograph', icon: '📸', desc: 'White background, recent', maxSize: '500KB' }
    ]
  },
  {
    id: 'ration',
    icon: '🍚',
    name: 'Ration Card',
    desc: 'New, Add Member, or Update',
    price: '₹199',
    priceNum: 199,
    processing: '30-60 days',
    successRate: '94%',
    documents: 3,
    category: 'documents',
    steps: ['Request Type', 'Family Details', 'Email (OTP)', 'Mobile (OTP)', 'Address', 'Documents', 'Review', 'Payment'],
    totalSteps: 8,
    authority: 'Food & Civil Supplies Dept.',
    deliveryDays: '30-60 business days',
    requiredDocs: [
      { id: 'aadhaar', label: 'All Member Aadhaar', icon: '📄', desc: 'Aadhaar of all family members', maxSize: '2MB' },
      { id: 'address', label: 'Address Proof', icon: '🏠', desc: 'Utility bill or rent agreement', maxSize: '2MB' },
      { id: 'income', label: 'Income Certificate', icon: '💰', desc: 'For BPL/APL category', maxSize: '2MB' }
    ]
  },
  {
    id: 'income',
    icon: '💰',
    name: 'Income Certificate',
    desc: 'For Loan, Scholarship, etc.',
    price: '₹149',
    priceNum: 149,
    processing: '7-15 days',
    successRate: '96%',
    documents: 2,
    category: 'certificates',
    steps: ['Purpose', 'Personal Details', 'Email (OTP)', 'Mobile (OTP)', 'Address', 'Documents', 'Review', 'Payment'],
    totalSteps: 8,
    authority: 'Tahsildar Office',
    deliveryDays: '7-15 business days',
    requiredDocs: [
      { id: 'aadhaar', label: 'Aadhaar Card', icon: '📄', desc: 'Identity proof', maxSize: '2MB' },
      { id: 'salary', label: 'Income Proof', icon: '💼', desc: 'Salary slip or Form 16', maxSize: '2MB' }
    ]
  },
  {
    id: 'caste',
    icon: '📜',
    name: 'Caste Certificate',
    desc: 'Valid for Lifetime',
    price: '₹149',
    priceNum: 149,
    processing: '15-30 days',
    successRate: '95%',
    documents: 3,
    category: 'certificates',
    steps: ['Personal Details', 'Caste Details', 'Email (OTP)', 'Mobile (OTP)', 'Documents', 'Review', 'Payment'],
    totalSteps: 7,
    authority: 'Revenue Department / Tahsildar',
    deliveryDays: '15-30 business days',
    requiredDocs: [
      { id: 'aadhaar', label: 'Aadhaar Card', icon: '📄', desc: 'Identity proof', maxSize: '2MB' },
      { id: 'parent_cert', label: 'Parent Caste Certificate', icon: '📋', desc: 'Father\'s caste certificate', maxSize: '2MB' },
      { id: 'photo', label: 'Photograph', icon: '📸', desc: 'Passport size photo', maxSize: '500KB' }
    ]
  },
  {
    id: 'domicile',
    icon: '🏠',
    name: 'Domicile Certificate',
    desc: 'For Education, Jobs, etc.',
    price: '₹149',
    priceNum: 149,
    processing: '15-30 days',
    successRate: '96%',
    documents: 2,
    category: 'certificates',
    steps: ['Personal Details', 'Residence Details', 'Email (OTP)', 'Mobile (OTP)', 'Documents', 'Review', 'Payment'],
    totalSteps: 7,
    authority: 'Tehsildar / District Magistrate',
    deliveryDays: '15-30 business days',
    requiredDocs: [
      { id: 'aadhaar', label: 'Aadhaar Card', icon: '📄', desc: 'Identity & address proof', maxSize: '2MB' },
      { id: 'residence', label: 'Residence Proof', icon: '🏠', desc: 'Utility bill (10+ years old)', maxSize: '2MB' }
    ]
  },
  {
    id: 'police',
    icon: '👮',
    name: 'Police Verification',
    desc: 'For Passport, Visa, etc.',
    price: '₹199',
    priceNum: 199,
    processing: '7-15 days',
    successRate: '97%',
    documents: 2,
    category: 'certificates',
    steps: ['Purpose', 'Personal Details', 'Email (OTP)', 'Mobile (OTP)', 'Address', 'Documents', 'Review', 'Payment'],
    totalSteps: 8,
    authority: 'Local Police Station',
    deliveryDays: '7-15 business days',
    requiredDocs: [
      { id: 'aadhaar', label: 'Aadhaar Card', icon: '📄', desc: 'Identity & address proof', maxSize: '2MB' },
      { id: 'photo', label: 'Passport Photograph', icon: '📸', desc: 'White background, recent', maxSize: '500KB' }
    ]
  }
];

window.PRICING_COMPARISON = [
  { service: 'PAN Card', agent: '₹1,000', ours: '₹116', savings: '88%' },
  { service: 'Passport', agent: '₹3,000', ours: '₹352', savings: '88%' },
  { service: 'Driving License', agent: '₹2,500', ours: '₹352', savings: '86%' },
  { service: 'Birth Certificate', agent: '₹1,500', ours: '₹235', savings: '84%' },
  { service: 'Ration Card', agent: '₹2,000', ours: '₹235', savings: '88%' },
];

window.TESTIMONIALS = [
  {
    name: 'Ramesh Kumar',
    location: 'Bangalore',
    age: 62,
    rating: 5,
    avatar: '👴',
    service: 'PAN Card',
    text: '"Got my PAN card in just 8 days! The AI voice made it so easy – I didn\'t need to type anything. Perfect for senior citizens like me!"'
  },
  {
    name: 'Priya Sharma',
    location: 'Hyderabad',
    age: 28,
    rating: 5,
    avatar: '👩',
    service: 'Aadhaar Update',
    text: '"Updated my Aadhaar address in Hindi! The assistant understood me perfectly and the process was so smooth. Saved ₹900 compared to the agent."'
  },
  {
    name: 'Venkata Reddy',
    location: 'Vijayawada',
    age: 45,
    rating: 5,
    avatar: '👨',
    service: 'Driving License',
    text: '"తెలుగులో మాట్లాడి నా లైసెన్స్ పొందాను! చాలా సులభంగా ఉంది. Saved time and money both!"'
  }
];

window.FAQS = [
  {
    q: 'Is this service legal?',
    a: 'Yes, absolutely! We are a government-authorized information service. We help citizens prepare and submit applications through official government portals. All submissions are made to the real government departments.'
  },
  {
    q: 'How long does the process take?',
    a: 'The voice conversation to collect your information takes about 5-10 minutes. Document processing by the government department takes 7-45 days depending on the service type. We show you exact timelines for each service.'
  },
  {
    q: 'What if my application is rejected?',
    a: 'We have a 95%+ success rate. If your application is rejected, we offer free re-submission with corrections. If we cannot get your document approved, we provide a 100% refund – no questions asked.'
  },
  {
    q: 'Is my data safe and secure?',
    a: 'Absolutely. Your data is encrypted with 256-bit SSL. We are fully DPDP (Digital Personal Data Protection) Act compliant. Your information is automatically deleted after 30 days. We never share your data with third parties.'
  },
  {
    q: 'Can I get help if I am stuck?',
    a: 'Yes! We offer 24/7 support via WhatsApp, email, phone, and live chat. Our average response time is under 5 minutes. You can also switch languages anytime during the conversation.'
  }
];

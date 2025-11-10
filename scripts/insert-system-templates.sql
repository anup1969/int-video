-- Insert 6 system templates

-- Template 1: Lead Generation
INSERT INTO public.templates (name, description, category, steps, is_system, user_id)
VALUES (
  'Lead Generation',
  'Capture qualified leads with personalized video interactions. Perfect for sales teams to engage prospects and collect contact information.',
  'lead-generation',
  '[
    {
      "id": "step-1",
      "type": "text",
      "config": {
        "title": "Welcome! Let''s Get Started",
        "description": "Thanks for your interest! We''d love to learn more about your needs and show you how we can help. This will only take 2 minutes."
      }
    },
    {
      "id": "step-2",
      "type": "open-ended",
      "config": {
        "question": "What brings you here today? Tell us about your main challenge or goal.",
        "required": true,
        "maxDuration": 60
      }
    },
    {
      "id": "step-3",
      "type": "multiple-choice",
      "config": {
        "question": "Which best describes your role?",
        "options": [
          "Business Owner / CEO",
          "Marketing Manager",
          "Sales Professional",
          "Operations Manager",
          "Other"
        ],
        "required": true
      }
    },
    {
      "id": "step-4",
      "type": "multiple-choice",
      "config": {
        "question": "What''s your company size?",
        "options": [
          "Just me (Solo)",
          "2-10 employees",
          "11-50 employees",
          "51-200 employees",
          "200+ employees"
        ],
        "required": true
      }
    },
    {
      "id": "step-5",
      "type": "contact-form",
      "config": {
        "title": "Let''s stay connected!",
        "fields": [
          {"label": "Full Name", "type": "text", "required": true},
          {"label": "Email", "type": "email", "required": true},
          {"label": "Phone", "type": "tel", "required": false},
          {"label": "Company Name", "type": "text", "required": false}
        ]
      }
    },
    {
      "id": "step-6",
      "type": "button",
      "config": {
        "message": "Would you like to schedule a free consultation?",
        "buttons": [
          {"label": "Yes, let''s talk!", "action": "continue"},
          {"label": "Not right now", "action": "end"}
        ]
      }
    },
    {
      "id": "step-7",
      "type": "text",
      "config": {
        "title": "Thank You!",
        "description": "We''ve received your information and will reach out within 24 hours. Check your email for next steps!"
      }
    }
  ]'::jsonb,
  true,
  NULL
);

-- Template 2: Product Feedback
INSERT INTO public.templates (name, description, category, steps, is_system, user_id)
VALUES (
  'Product Feedback',
  'Collect valuable insights about your product or service. Understand what customers love and what needs improvement.',
  'product-feedback',
  '[
    {
      "id": "step-1",
      "type": "text",
      "config": {
        "title": "We Value Your Feedback!",
        "description": "Your opinion matters! Help us improve by sharing your thoughts about our product."
      }
    },
    {
      "id": "step-2",
      "type": "nps",
      "config": {
        "question": "How likely are you to recommend our product to a friend or colleague?",
        "lowLabel": "Not at all likely",
        "highLabel": "Extremely likely"
      }
    },
    {
      "id": "step-3",
      "type": "open-ended",
      "config": {
        "question": "What do you like most about our product?",
        "required": false,
        "maxDuration": 60
      }
    },
    {
      "id": "step-4",
      "type": "open-ended",
      "config": {
        "question": "What could we improve or add to make it better for you?",
        "required": false,
        "maxDuration": 60
      }
    },
    {
      "id": "step-5",
      "type": "multiple-choice",
      "config": {
        "question": "Which features do you use most often? (Select all that apply)",
        "options": [
          "Core feature A",
          "Analytics dashboard",
          "Reporting tools",
          "Integration options",
          "Mobile app",
          "Customer support"
        ],
        "multiple": true,
        "required": false
      }
    },
    {
      "id": "step-6",
      "type": "button",
      "config": {
        "message": "Would you be interested in beta testing new features?",
        "buttons": [
          {"label": "Yes, count me in!", "action": "continue"},
          {"label": "No thanks", "action": "skip"}
        ]
      }
    },
    {
      "id": "step-7",
      "type": "contact-form",
      "config": {
        "title": "Stay in the loop",
        "description": "Leave your email to get early access to new features!",
        "fields": [
          {"label": "Email", "type": "email", "required": true}
        ]
      }
    },
    {
      "id": "step-8",
      "type": "text",
      "config": {
        "title": "Thank You!",
        "description": "Your feedback helps us build a better product. We truly appreciate your time!"
      }
    }
  ]'::jsonb,
  true,
  NULL
);

-- Template 3: Customer Survey
INSERT INTO public.templates (name, description, category, steps, is_system, user_id)
VALUES (
  'Customer Satisfaction Survey',
  'Measure customer satisfaction and gather actionable feedback. Perfect for understanding your customer experience.',
  'customer-survey',
  '[
    {
      "id": "step-1",
      "type": "text",
      "config": {
        "title": "Quick Customer Survey",
        "description": "We''d love to hear about your experience! This brief survey will help us serve you better."
      }
    },
    {
      "id": "step-2",
      "type": "multiple-choice",
      "config": {
        "question": "How would you rate your overall experience with us?",
        "options": [
          "Excellent",
          "Good",
          "Fair",
          "Poor"
        ],
        "required": true
      }
    },
    {
      "id": "step-3",
      "type": "nps",
      "config": {
        "question": "How likely are you to recommend us to others?",
        "lowLabel": "Not likely",
        "highLabel": "Very likely"
      }
    },
    {
      "id": "step-4",
      "type": "open-ended",
      "config": {
        "question": "What did we do well?",
        "required": false,
        "maxDuration": 45
      }
    },
    {
      "id": "step-5",
      "type": "open-ended",
      "config": {
        "question": "What could we have done better?",
        "required": false,
        "maxDuration": 45
      }
    },
    {
      "id": "step-6",
      "type": "multiple-choice",
      "config": {
        "question": "How often do you use our product/service?",
        "options": [
          "Daily",
          "Weekly",
          "Monthly",
          "Rarely"
        ],
        "required": false
      }
    },
    {
      "id": "step-7",
      "type": "button",
      "config": {
        "message": "Would you like to be contacted about your feedback?",
        "buttons": [
          {"label": "Yes, please", "action": "continue"},
          {"label": "No, I''m good", "action": "skip"}
        ]
      }
    },
    {
      "id": "step-8",
      "type": "contact-form",
      "config": {
        "title": "Contact Information",
        "fields": [
          {"label": "Email", "type": "email", "required": true},
          {"label": "Phone (optional)", "type": "tel", "required": false}
        ]
      }
    },
    {
      "id": "step-9",
      "type": "text",
      "config": {
        "title": "Thank You!",
        "description": "Your feedback is invaluable to us. We''re committed to continuous improvement!"
      }
    }
  ]'::jsonb,
  true,
  NULL
);

-- Template 4: FAQ / Self-Service Support
INSERT INTO public.templates (name, description, category, steps, is_system, user_id)
VALUES (
  'FAQ Assistant',
  'Help customers find answers quickly with an interactive FAQ experience. Reduce support load with self-service.',
  'faq',
  '[
    {
      "id": "step-1",
      "type": "text",
      "config": {
        "title": "How Can We Help?",
        "description": "Welcome to our FAQ! Let''s get you the answers you need quickly."
      }
    },
    {
      "id": "step-2",
      "type": "multiple-choice",
      "config": {
        "question": "What do you need help with?",
        "options": [
          "Getting Started",
          "Account & Billing",
          "Technical Issues",
          "Features & How-To",
          "Something Else"
        ],
        "required": true
      }
    },
    {
      "id": "step-3",
      "type": "text",
      "config": {
        "title": "Getting Started Guide",
        "description": "Here are the basics:\\n\\n1. Create your account\\n2. Complete your profile\\n3. Explore the dashboard\\n4. Start your first project\\n\\nNeed more help? Check out our video tutorials in the resource center!"
      }
    },
    {
      "id": "step-4",
      "type": "button",
      "config": {
        "message": "Did this answer your question?",
        "buttons": [
          {"label": "Yes, thanks!", "action": "end"},
          {"label": "No, I need more help", "action": "continue"}
        ]
      }
    },
    {
      "id": "step-5",
      "type": "open-ended",
      "config": {
        "question": "Please describe your specific question or issue. Our support team will get back to you!",
        "required": true,
        "maxDuration": 120
      }
    },
    {
      "id": "step-6",
      "type": "contact-form",
      "config": {
        "title": "Contact Information",
        "description": "So we can reach you with an answer:",
        "fields": [
          {"label": "Email", "type": "email", "required": true},
          {"label": "Priority", "type": "select", "options": ["Low", "Medium", "High", "Urgent"], "required": false}
        ]
      }
    },
    {
      "id": "step-7",
      "type": "text",
      "config": {
        "title": "We''re On It!",
        "description": "Your support ticket has been created. Our team will respond within 24 hours (often much sooner!)."
      }
    }
  ]'::jsonb,
  true,
  NULL
);

-- Template 5: Customer Support
INSERT INTO public.templates (name, description, category, steps, is_system, user_id)
VALUES (
  'Support Ticket',
  'Streamline support requests with video. Let customers show you the issue instead of describing it.',
  'support',
  '[
    {
      "id": "step-1",
      "type": "text",
      "config": {
        "title": "We''re Here to Help",
        "description": "Having trouble? No worries! Let''s get your issue resolved quickly."
      }
    },
    {
      "id": "step-2",
      "type": "multiple-choice",
      "config": {
        "question": "What type of issue are you experiencing?",
        "options": [
          "Technical Problem",
          "Billing Question",
          "Feature Request",
          "Bug Report",
          "General Inquiry"
        ],
        "required": true
      }
    },
    {
      "id": "step-3",
      "type": "open-ended",
      "config": {
        "question": "Show or tell us what''s happening. Feel free to share your screen or describe the issue.",
        "required": true,
        "maxDuration": 180
      }
    },
    {
      "id": "step-4",
      "type": "multiple-choice",
      "config": {
        "question": "How urgent is this issue?",
        "options": [
          "Critical - I can''t work",
          "High - Major inconvenience",
          "Medium - Some impact",
          "Low - Minor issue"
        ],
        "required": true
      }
    },
    {
      "id": "step-5",
      "type": "file-upload",
      "config": {
        "title": "Any screenshots or files to share?",
        "description": "Upload screenshots, error logs, or any relevant files (optional)",
        "accept": "image/*,.pdf,.txt,.log",
        "required": false
      }
    },
    {
      "id": "step-6",
      "type": "contact-form",
      "config": {
        "title": "Your Contact Details",
        "fields": [
          {"label": "Full Name", "type": "text", "required": true},
          {"label": "Email", "type": "email", "required": true},
          {"label": "Account ID (if applicable)", "type": "text", "required": false}
        ]
      }
    },
    {
      "id": "step-7",
      "type": "text",
      "config": {
        "title": "Ticket Created!",
        "description": "We''ve received your support request (Ticket #{{ticketId}}). Our team will investigate and respond soon. Check your email for updates!"
      }
    }
  ]'::jsonb,
  true,
  NULL
);

-- Template 6: Training Assessment
INSERT INTO public.templates (name, description, category, steps, is_system, user_id)
VALUES (
  'Training Assessment',
  'Evaluate training effectiveness and knowledge retention. Perfect for onboarding, courses, and skill development.',
  'training',
  '[
    {
      "id": "step-1",
      "type": "text",
      "config": {
        "title": "Training Assessment",
        "description": "Let''s see how much you''ve learned! This quick assessment will help us understand your progress."
      }
    },
    {
      "id": "step-2",
      "type": "multiple-choice",
      "config": {
        "question": "Which training module did you complete?",
        "options": [
          "Introduction & Basics",
          "Intermediate Skills",
          "Advanced Techniques",
          "Certification Prep"
        ],
        "required": true
      }
    },
    {
      "id": "step-3",
      "type": "nps",
      "config": {
        "question": "How would you rate the training quality?",
        "lowLabel": "Poor",
        "highLabel": "Excellent"
      }
    },
    {
      "id": "step-4",
      "type": "open-ended",
      "config": {
        "question": "Explain a key concept you learned in your own words",
        "required": true,
        "maxDuration": 90
      }
    },
    {
      "id": "step-5",
      "type": "multiple-choice",
      "config": {
        "question": "How confident do you feel applying this knowledge?",
        "options": [
          "Very confident - Ready to go!",
          "Somewhat confident - Need some practice",
          "Not very confident - Need more training",
          "Not confident at all - Need help"
        ],
        "required": true
      }
    },
    {
      "id": "step-6",
      "type": "open-ended",
      "config": {
        "question": "What part of the training was most valuable to you?",
        "required": false,
        "maxDuration": 60
      }
    },
    {
      "id": "step-7",
      "type": "open-ended",
      "config": {
        "question": "What would you like to see in future training sessions?",
        "required": false,
        "maxDuration": 60
      }
    },
    {
      "id": "step-8",
      "type": "button",
      "config": {
        "message": "Would you recommend this training to colleagues?",
        "buttons": [
          {"label": "Absolutely!", "action": "continue"},
          {"label": "Maybe", "action": "skip"},
          {"label": "Probably not", "action": "skip"}
        ]
      }
    },
    {
      "id": "step-9",
      "type": "text",
      "config": {
        "title": "Assessment Complete!",
        "description": "Thank you for completing the assessment. Your instructor will review your responses and provide feedback soon."
      }
    }
  ]'::jsonb,
  true,
  NULL
);

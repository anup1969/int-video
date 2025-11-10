const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupTemplates() {
  console.log('🚀 Setting up templates system...\n');

  try {
    // Step 1: Create the templates table
    console.log('📋 Step 1: Creating templates table...');
    const createTableSQL = fs.readFileSync(
      path.join(__dirname, 'create-templates-table.sql'),
      'utf8'
    );

    const { error: tableError } = await supabase.rpc('exec_sql', {
      sql: createTableSQL
    });

    if (tableError) {
      // Try alternative method - direct table creation
      console.log('Trying alternative table creation method...');

      // Check if table already exists
      const { data: existingTable, error: checkError } = await supabase
        .from('templates')
        .select('id')
        .limit(1);

      if (checkError && checkError.code !== 'PGRST116') {
        console.log('⚠️  Table might not exist, attempting to create via SQL...');
        console.log('Please run the SQL manually in Supabase dashboard:');
        console.log('URL: https://supabase.com/dashboard/project/uwzzdxroqqynmqkmwlpk/sql/new');
        console.log('\nSQL file location: scripts/create-templates-table.sql');
        console.log('\nContinuing with template insertion (table might already exist)...\n');
      } else {
        console.log('✅ Table already exists or created successfully\n');
      }
    } else {
      console.log('✅ Templates table created successfully\n');
    }

    // Step 2: Insert system templates
    console.log('📝 Step 2: Inserting system templates...');

    const templates = [
      {
        name: 'Lead Generation',
        description: 'Capture qualified leads with personalized video interactions. Perfect for sales teams to engage prospects and collect contact information.',
        category: 'lead-generation',
        is_system: true,
        user_id: null,
        steps: [
          {
            id: 'step-1',
            type: 'text',
            config: {
              title: "Welcome! Let's Get Started",
              description: "Thanks for your interest! We'd love to learn more about your needs and show you how we can help. This will only take 2 minutes."
            }
          },
          {
            id: 'step-2',
            type: 'open-ended',
            config: {
              question: 'What brings you here today? Tell us about your main challenge or goal.',
              required: true,
              maxDuration: 60
            }
          },
          {
            id: 'step-3',
            type: 'multiple-choice',
            config: {
              question: 'Which best describes your role?',
              options: ['Business Owner / CEO', 'Marketing Manager', 'Sales Professional', 'Operations Manager', 'Other'],
              required: true
            }
          },
          {
            id: 'step-4',
            type: 'multiple-choice',
            config: {
              question: "What's your company size?",
              options: ['Just me (Solo)', '2-10 employees', '11-50 employees', '51-200 employees', '200+ employees'],
              required: true
            }
          },
          {
            id: 'step-5',
            type: 'contact-form',
            config: {
              title: "Let's stay connected!",
              fields: [
                { label: 'Full Name', type: 'text', required: true },
                { label: 'Email', type: 'email', required: true },
                { label: 'Phone', type: 'tel', required: false },
                { label: 'Company Name', type: 'text', required: false }
              ]
            }
          },
          {
            id: 'step-6',
            type: 'button',
            config: {
              message: 'Would you like to schedule a free consultation?',
              buttons: [
                { label: "Yes, let's talk!", action: 'continue' },
                { label: 'Not right now', action: 'end' }
              ]
            }
          },
          {
            id: 'step-7',
            type: 'text',
            config: {
              title: 'Thank You!',
              description: "We've received your information and will reach out within 24 hours. Check your email for next steps!"
            }
          }
        ]
      },
      {
        name: 'Product Feedback',
        description: 'Collect valuable insights about your product or service. Understand what customers love and what needs improvement.',
        category: 'product-feedback',
        is_system: true,
        user_id: null,
        steps: [
          {
            id: 'step-1',
            type: 'text',
            config: {
              title: 'We Value Your Feedback!',
              description: 'Your opinion matters! Help us improve by sharing your thoughts about our product.'
            }
          },
          {
            id: 'step-2',
            type: 'nps',
            config: {
              question: 'How likely are you to recommend our product to a friend or colleague?',
              lowLabel: 'Not at all likely',
              highLabel: 'Extremely likely'
            }
          },
          {
            id: 'step-3',
            type: 'open-ended',
            config: {
              question: 'What do you like most about our product?',
              required: false,
              maxDuration: 60
            }
          },
          {
            id: 'step-4',
            type: 'open-ended',
            config: {
              question: 'What could we improve or add to make it better for you?',
              required: false,
              maxDuration: 60
            }
          },
          {
            id: 'step-5',
            type: 'multiple-choice',
            config: {
              question: 'Which features do you use most often? (Select all that apply)',
              options: ['Core feature A', 'Analytics dashboard', 'Reporting tools', 'Integration options', 'Mobile app', 'Customer support'],
              multiple: true,
              required: false
            }
          },
          {
            id: 'step-6',
            type: 'button',
            config: {
              message: 'Would you be interested in beta testing new features?',
              buttons: [
                { label: 'Yes, count me in!', action: 'continue' },
                { label: 'No thanks', action: 'skip' }
              ]
            }
          },
          {
            id: 'step-7',
            type: 'contact-form',
            config: {
              title: 'Stay in the loop',
              description: 'Leave your email to get early access to new features!',
              fields: [
                { label: 'Email', type: 'email', required: true }
              ]
            }
          },
          {
            id: 'step-8',
            type: 'text',
            config: {
              title: 'Thank You!',
              description: 'Your feedback helps us build a better product. We truly appreciate your time!'
            }
          }
        ]
      },
      {
        name: 'Customer Satisfaction Survey',
        description: 'Measure customer satisfaction and gather actionable feedback. Perfect for understanding your customer experience.',
        category: 'customer-survey',
        is_system: true,
        user_id: null,
        steps: [
          {
            id: 'step-1',
            type: 'text',
            config: {
              title: 'Quick Customer Survey',
              description: "We'd love to hear about your experience! This brief survey will help us serve you better."
            }
          },
          {
            id: 'step-2',
            type: 'multiple-choice',
            config: {
              question: 'How would you rate your overall experience with us?',
              options: ['Excellent', 'Good', 'Fair', 'Poor'],
              required: true
            }
          },
          {
            id: 'step-3',
            type: 'nps',
            config: {
              question: 'How likely are you to recommend us to others?',
              lowLabel: 'Not likely',
              highLabel: 'Very likely'
            }
          },
          {
            id: 'step-4',
            type: 'open-ended',
            config: {
              question: 'What did we do well?',
              required: false,
              maxDuration: 45
            }
          },
          {
            id: 'step-5',
            type: 'open-ended',
            config: {
              question: 'What could we have done better?',
              required: false,
              maxDuration: 45
            }
          },
          {
            id: 'step-6',
            type: 'multiple-choice',
            config: {
              question: 'How often do you use our product/service?',
              options: ['Daily', 'Weekly', 'Monthly', 'Rarely'],
              required: false
            }
          },
          {
            id: 'step-7',
            type: 'button',
            config: {
              message: 'Would you like to be contacted about your feedback?',
              buttons: [
                { label: 'Yes, please', action: 'continue' },
                { label: "No, I'm good", action: 'skip' }
              ]
            }
          },
          {
            id: 'step-8',
            type: 'contact-form',
            config: {
              title: 'Contact Information',
              fields: [
                { label: 'Email', type: 'email', required: true },
                { label: 'Phone (optional)', type: 'tel', required: false }
              ]
            }
          },
          {
            id: 'step-9',
            type: 'text',
            config: {
              title: 'Thank You!',
              description: "Your feedback is invaluable to us. We're committed to continuous improvement!"
            }
          }
        ]
      },
      {
        name: 'FAQ Assistant',
        description: 'Help customers find answers quickly with an interactive FAQ experience. Reduce support load with self-service.',
        category: 'faq',
        is_system: true,
        user_id: null,
        steps: [
          {
            id: 'step-1',
            type: 'text',
            config: {
              title: 'How Can We Help?',
              description: "Welcome to our FAQ! Let's get you the answers you need quickly."
            }
          },
          {
            id: 'step-2',
            type: 'multiple-choice',
            config: {
              question: 'What do you need help with?',
              options: ['Getting Started', 'Account & Billing', 'Technical Issues', 'Features & How-To', 'Something Else'],
              required: true
            }
          },
          {
            id: 'step-3',
            type: 'text',
            config: {
              title: 'Getting Started Guide',
              description: "Here are the basics:\\n\\n1. Create your account\\n2. Complete your profile\\n3. Explore the dashboard\\n4. Start your first project\\n\\nNeed more help? Check out our video tutorials in the resource center!"
            }
          },
          {
            id: 'step-4',
            type: 'button',
            config: {
              message: 'Did this answer your question?',
              buttons: [
                { label: 'Yes, thanks!', action: 'end' },
                { label: 'No, I need more help', action: 'continue' }
              ]
            }
          },
          {
            id: 'step-5',
            type: 'open-ended',
            config: {
              question: 'Please describe your specific question or issue. Our support team will get back to you!',
              required: true,
              maxDuration: 120
            }
          },
          {
            id: 'step-6',
            type: 'contact-form',
            config: {
              title: 'Contact Information',
              description: 'So we can reach you with an answer:',
              fields: [
                { label: 'Email', type: 'email', required: true },
                { label: 'Priority', type: 'select', options: ['Low', 'Medium', 'High', 'Urgent'], required: false }
              ]
            }
          },
          {
            id: 'step-7',
            type: 'text',
            config: {
              title: "We're On It!",
              description: 'Your support ticket has been created. Our team will respond within 24 hours (often much sooner!).'
            }
          }
        ]
      },
      {
        name: 'Support Ticket',
        description: 'Streamline support requests with video. Let customers show you the issue instead of describing it.',
        category: 'support',
        is_system: true,
        user_id: null,
        steps: [
          {
            id: 'step-1',
            type: 'text',
            config: {
              title: "We're Here to Help",
              description: "Having trouble? No worries! Let's get your issue resolved quickly."
            }
          },
          {
            id: 'step-2',
            type: 'multiple-choice',
            config: {
              question: 'What type of issue are you experiencing?',
              options: ['Technical Problem', 'Billing Question', 'Feature Request', 'Bug Report', 'General Inquiry'],
              required: true
            }
          },
          {
            id: 'step-3',
            type: 'open-ended',
            config: {
              question: "Show or tell us what's happening. Feel free to share your screen or describe the issue.",
              required: true,
              maxDuration: 180
            }
          },
          {
            id: 'step-4',
            type: 'multiple-choice',
            config: {
              question: 'How urgent is this issue?',
              options: ["Critical - I can't work", 'High - Major inconvenience', 'Medium - Some impact', 'Low - Minor issue'],
              required: true
            }
          },
          {
            id: 'step-5',
            type: 'file-upload',
            config: {
              title: 'Any screenshots or files to share?',
              description: 'Upload screenshots, error logs, or any relevant files (optional)',
              accept: 'image/*,.pdf,.txt,.log',
              required: false
            }
          },
          {
            id: 'step-6',
            type: 'contact-form',
            config: {
              title: 'Your Contact Details',
              fields: [
                { label: 'Full Name', type: 'text', required: true },
                { label: 'Email', type: 'email', required: true },
                { label: 'Account ID (if applicable)', type: 'text', required: false }
              ]
            }
          },
          {
            id: 'step-7',
            type: 'text',
            config: {
              title: 'Ticket Created!',
              description: "We've received your support request (Ticket #{{ticketId}}). Our team will investigate and respond soon. Check your email for updates!"
            }
          }
        ]
      },
      {
        name: 'Training Assessment',
        description: 'Evaluate training effectiveness and knowledge retention. Perfect for onboarding, courses, and skill development.',
        category: 'training',
        is_system: true,
        user_id: null,
        steps: [
          {
            id: 'step-1',
            type: 'text',
            config: {
              title: 'Training Assessment',
              description: "Let's see how much you've learned! This quick assessment will help us understand your progress."
            }
          },
          {
            id: 'step-2',
            type: 'multiple-choice',
            config: {
              question: 'Which training module did you complete?',
              options: ['Introduction & Basics', 'Intermediate Skills', 'Advanced Techniques', 'Certification Prep'],
              required: true
            }
          },
          {
            id: 'step-3',
            type: 'nps',
            config: {
              question: 'How would you rate the training quality?',
              lowLabel: 'Poor',
              highLabel: 'Excellent'
            }
          },
          {
            id: 'step-4',
            type: 'open-ended',
            config: {
              question: 'Explain a key concept you learned in your own words',
              required: true,
              maxDuration: 90
            }
          },
          {
            id: 'step-5',
            type: 'multiple-choice',
            config: {
              question: 'How confident do you feel applying this knowledge?',
              options: ['Very confident - Ready to go!', 'Somewhat confident - Need some practice', 'Not very confident - Need more training', 'Not confident at all - Need help'],
              required: true
            }
          },
          {
            id: 'step-6',
            type: 'open-ended',
            config: {
              question: 'What part of the training was most valuable to you?',
              required: false,
              maxDuration: 60
            }
          },
          {
            id: 'step-7',
            type: 'open-ended',
            config: {
              question: 'What would you like to see in future training sessions?',
              required: false,
              maxDuration: 60
            }
          },
          {
            id: 'step-8',
            type: 'button',
            config: {
              message: 'Would you recommend this training to colleagues?',
              buttons: [
                { label: 'Absolutely!', action: 'continue' },
                { label: 'Maybe', action: 'skip' },
                { label: 'Probably not', action: 'skip' }
              ]
            }
          },
          {
            id: 'step-9',
            type: 'text',
            config: {
              title: 'Assessment Complete!',
              description: 'Thank you for completing the assessment. Your instructor will review your responses and provide feedback soon.'
            }
          }
        ]
      }
    ];

    // Insert each template
    for (const template of templates) {
      console.log(`  📌 Inserting: ${template.name}...`);

      const { error } = await supabase
        .from('templates')
        .insert([template]);

      if (error) {
        console.error(`  ❌ Error inserting ${template.name}:`, error.message);
      } else {
        console.log(`  ✅ ${template.name} inserted successfully`);
      }
    }

    console.log('\n🎉 Templates setup complete!');
    console.log('\n📊 Summary:');
    console.log('  - 6 system templates created');
    console.log('  - Categories: Lead Generation, Product Feedback, Customer Survey, FAQ, Support, Training');
    console.log('\n✨ You can now use the Templates button in your dashboard or campaign editor!');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

setupTemplates();

export const answerTypes = [
  {
    id: 'open-ended',
    label: 'Open-Ended',
    icon: '🎥',
    color: '#8b5cf6',
    description: 'Video, audio, or text'
  },
  {
    id: 'multiple-choice',
    label: 'Multiple Choice',
    icon: '☑️',
    color: '#3b82f6',
    description: 'Button options with logic'
  },
  {
    id: 'button',
    label: 'Button/CTA',
    icon: '📘',
    color: '#10b981',
    description: 'Multiple buttons with CTAs'
  },
  {
    id: 'calendar',
    label: 'Calendar',
    icon: '📅',
    color: '#f59e0b',
    description: 'Date/time picker'
  },
  {
    id: 'file-upload',
    label: 'File Upload',
    icon: '📎',
    color: '#ef4444',
    description: 'Upload documents'
  },
  {
    id: 'nps',
    label: 'NPS Scale',
    icon: '⭐',
    color: '#ec4899',
    description: '0-10 rating scale'
  },
  {
    id: 'contact-form',
    label: 'Contact Form',
    icon: '📋',
    color: '#06b6d4',
    description: 'Collect contact details'
  },
];

export const getDefaultLogicRules = (answerType, enabledTypes = { video: true, audio: true, text: true }) => {
  switch(answerType) {
    case 'open-ended':
      const rules = [];
      if (enabledTypes.video) rules.push({ condition: 'video', label: 'If video response', target: '', targetType: 'node' });
      if (enabledTypes.audio) rules.push({ condition: 'audio', label: 'If audio response', target: '', targetType: 'node' });
      if (enabledTypes.text) rules.push({ condition: 'text', label: 'If text response', target: '', targetType: 'node' });
      rules.push({ condition: 'skipped', label: 'If skipped', target: '', targetType: 'node' });
      return rules;
    case 'calendar':
      return [
        { condition: 'date_selected', label: 'When date/time selected', target: '', targetType: 'node' },
        { condition: 'skipped', label: 'If skipped', target: '', targetType: 'node' },
      ];
    case 'file-upload':
      return [
        { condition: 'text_submitted', label: 'When text submitted', target: '', targetType: 'node' },
        { condition: 'skipped', label: 'If skipped', target: '', targetType: 'node' },
      ];
    case 'nps':
      return [
        { condition: 'detractor', label: 'If score 0-6 (Detractor)', target: '', targetType: 'node' },
        { condition: 'passive', label: 'If score 7-8 (Passive)', target: '', targetType: 'node' },
        { condition: 'promoter', label: 'If score 9-10 (Promoter)', target: '', targetType: 'node' },
      ];
    case 'contact-form':
      return [
        { condition: 'form_submitted', label: 'When form submitted', target: '', targetType: 'node' },
        { condition: 'skipped', label: 'If skipped', target: '', targetType: 'node' },
      ];
    default:
      return [];
  }
};

export const updateLogicRulesForAnswerType = (answerType, mcOptions, buttonOptions, enabledResponseTypes) => {
  if (answerType === 'multiple-choice') {
    return mcOptions.map((opt, idx) => ({
      condition: `option_${idx}`,
      label: `If "${opt}" selected`,
      target: '',
      targetType: 'node'
    }));
  } else if (answerType === 'button') {
    return buttonOptions.map((btn, idx) => ({
      condition: `button_${idx}`,
      label: `If "${btn.text}" clicked`,
      target: '',
      targetType: 'node'
    }));
  } else {
    return getDefaultLogicRules(answerType, enabledResponseTypes);
  }
};

export const defaultContactFormFields = [
  { id: 'name', label: 'Name', type: 'text', required: true, enabled: true },
  { id: 'email', label: 'Email', type: 'email', required: true, enabled: true },
  { id: 'phone', label: 'Phone', type: 'tel', required: false, enabled: true },
  { id: 'company', label: 'Company', type: 'text', required: false, enabled: false },
];

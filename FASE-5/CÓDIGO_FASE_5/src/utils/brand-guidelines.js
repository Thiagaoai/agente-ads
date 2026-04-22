// Brand guidelines for Roberts Landscape
// Used by Supervisor agent for content validation

export const brandGuidelines = {
  company: {
    name: 'Roberts Landscape',
    tagline: 'Premier Landscaping Solutions',
    founded: 2010,
    serviceArea: 'Texas',
  },

  voice: {
    tone: 'Professional, trustworthy, expert',
    personality: 'Friendly but authoritative',
    keyWords: [
      'quality',
      'reliability',
      'excellence',
      'customer-focused',
      'innovative',
      'sustainable',
    ],
    avoidWords: ['cheap', 'quick-fix', 'temporary', 'basic'],
  },

  visualIdentity: {
    primaryColors: {
      green: '#2d5016',
      accent: '#4a7c2c',
      neutral: '#333333',
    },
    secondaryColors: {
      lightGreen: '#d4e8d0',
      lightGray: '#f5f5f5',
      white: '#ffffff',
    },
    fonts: {
      primary: 'Inter, sans-serif',
      secondary: 'Georgia, serif',
    },
    logoRequirements: {
      minSize: '100px',
      spacing: '10px minimum clearance',
      backgrounds: ['white', 'light gray'],
    },
  },

  messaging: {
    missionStatement:
      'Transforming outdoor spaces into exceptional landscapes that enhance property value and client satisfaction',
    coreBenefits: [
      'Expert design and installation',
      'Sustainable practices',
      '24/7 maintenance support',
      'Transparent pricing',
      'Customer-first approach',
    ],
  },

  contentRules: {
    copywriting: {
      minLength: 20, // words
      maxLength: 500, // words for social posts
      requiresCTA: true,
      ctaExamples: [
        'Get a free consultation',
        'Schedule your design review',
        'Transform your outdoor space',
      ],
    },

    imagery: {
      mustInclude: ['real customer projects', 'before/after photos', 'team members'],
      avoid: ['overly filtered', 'unrelated stock photos', 'competitor logos'],
      quality: 'High-resolution (1200px minimum width)',
      brandConsistency: 'Colors should align with visual identity',
    },

    video: {
      maxDuration: '60 seconds for ads, 120 seconds for content',
      mustInclude: 'Company logo/name in first 3 seconds and last 3 seconds',
      audioRequirements: 'Clear, professional voiceover or captions required',
      qualityStandard: '1080p minimum',
    },

    landing: {
      requiredSections: [
        'Hero section with value proposition',
        'Problem/solution section',
        'Portfolio/results',
        'Testimonials',
        'CTA button (above the fold)',
      ],
      formFields: [
        'Email',
        'Phone',
        'Property type',
        'Project scope',
        'Timeline',
      ],
      conversionOptimization: {
        ctaButtonColor: '#4a7c2c',
        formFields: 'Minimal (max 5)',
        trustSignals: 'Required (years in business, certifications)',
      },
    },
  },

  socialMedia: {
    platforms: ['Instagram', 'Facebook', 'LinkedIn', 'TikTok'],

    instagram: {
      postFrequency: '3-4 per week',
      contentMix: '60% before/after, 20% tips, 20% team culture',
      hashtagCount: '5-10 relevant hashtags',
      hashtags: [
        '#RobertsLandscape',
        '#LandscapeDesign',
        '#OutdoorSpaces',
        '#TexasLandscaping',
      ],
    },

    facebook: {
      postFrequency: '2-3 per week',
      contentMix: '50% portfolio, 30% educational, 20% promotions',
    },

    linkedin: {
      postFrequency: '2 per week',
      contentFocus: ['Industry insights', 'Company culture', 'Thought leadership'],
      targetAudience: 'Business owners, property managers, contractors',
    },

    tiktok: {
      postFrequency: '2-3 per week',
      contentFocus: ['Quick tips', 'Transformations', 'Behind-the-scenes'],
      durationTarget: '15-30 seconds',
    },
  },

  ads: {
    googleAds: {
      headlineFormat: '[Action] + [Benefit] + [CTA]',
      examples: [
        'Transform Your Yard - Expert Landscaping - Free Consultation',
        'Premium Landscape Design - Award-Winning Services - Book Today',
      ],
      descriptionFormat: 'Problem + Solution + Social Proof',
      targetingAudience: [
        'Homeowners in Texas',
        'Business property managers',
        'Real estate professionals',
      ],
    },

    metaAds: {
      imageRequirements: 'Landscape photos (1200x628px, <20% text)',
      copyLength: '125-150 characters',
      voiceRegionalVariations: false,
      culturalSensitivity: 'Always inclusive, respectful',
    },
  },

  approvalCriteria: {
    mandatory: [
      'Brand voice consistent',
      'No competitor mentions',
      'Correct company name and spelling',
      'Professional tone',
      'Clear CTA',
    ],

    scoring: {
      brandVoiceAlignment: { weight: 20, max: 10 },
      messagingClarity: { weight: 20, max: 10 },
      visualConsistency: { weight: 15, max: 10 },
      targetAudienceRelevance: { weight: 15, max: 10 },
      callToActionStrength: { weight: 15, max: 10 },
      technicalQuality: { weight: 15, max: 10 },
    },

    passingScore: 7, // Out of 10
  },

  complianceChecklist: {
    legal: [
      'No false claims',
      'No testimonials without permission',
      'Proper licensing visible where required',
    ],
    accessibility: [
      'Alt text on all images',
      'Captions on all videos',
      'Color contrast ratio >= 4.5:1',
    ],
    brand: [
      'Logo placement correct',
      'Colors from approved palette',
      'Fonts from approved list',
    ],
  },
};

// Validation function used by Supervisor
export const validateAgainstBrandGuidelines = (content, contentType) => {
  const violations = [];
  const warnings = [];

  if (contentType === 'copy') {
    const wordCount = content.split(/\s+/).length;
    if (wordCount < brandGuidelines.contentRules.copywriting.minLength) {
      violations.push('Copy too short');
    }
    if (wordCount > brandGuidelines.contentRules.copywriting.maxLength) {
      violations.push('Copy too long');
    }
    if (
      !brandGuidelines.contentRules.copywriting.ctaExamples.some((cta) =>
        content.toLowerCase().includes(cta.toLowerCase())
      )
    ) {
      warnings.push('Missing clear CTA');
    }
    if (
      brandGuidelines.contentRules.copywriting.avoidWords.some((word) =>
        content.toLowerCase().includes(word.toLowerCase())
      )
    ) {
      violations.push('Contains discouraged words');
    }
  }

  if (contentType === 'image') {
    if (!content.width || content.width < 1200) {
      violations.push('Image resolution too low');
    }
    if (content.filters && content.filters.length > 2) {
      warnings.push('Too many filters applied');
    }
  }

  if (contentType === 'landing') {
    const missingRequiredSections = brandGuidelines.contentRules.landing.requiredSections.filter(
      (section) => !content.includes(section)
    );
    if (missingRequiredSections.length > 0) {
      violations.push(`Missing sections: ${missingRequiredSections.join(', ')}`);
    }
  }

  return {
    isValid: violations.length === 0,
    violations,
    warnings,
    score: violations.length === 0 ? 10 : Math.max(1, 10 - violations.length * 2),
  };
};

export default brandGuidelines;

module.exports = {
  extends: [
    'next/core-web-vitals',
    'next/typescript'
  ],
  rules: {
    // Performance rules (warnings for now)
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-debugger': 'warn',
    
    // Code quality rules (warnings for gradual improvement)
    'prefer-const': 'warn',
    'no-unused-vars': ['warn', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_' 
    }],
    '@typescript-eslint/no-unused-vars': ['warn', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_' 
    }],
    '@typescript-eslint/no-explicit-any': 'warn',
    
    // React specific rules (warnings for gradual improvement)
    'react/no-unescaped-entities': 'warn',
    'react/jsx-key': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    
    // Next.js specific optimizations (warnings for now)
    '@next/next/no-img-element': 'warn',
    '@next/next/no-page-custom-font': 'warn',
    
    // JSX accessibility warnings
    'jsx-a11y/alt-text': 'warn',
  },
  settings: {
    react: {
      version: 'detect'
    }
  }
};
/**
 * Security utilities for the CRM application
 */

// Rate limiting utilities
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(ip: string, maxRequests: number = 100, windowMs: number = 60000): boolean {
  const now = Date.now();
  const windowStart = now - windowMs;
  
  if (!requestCounts.has(ip)) {
    requestCounts.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  const data = requestCounts.get(ip)!;
  
  if (now > data.resetTime) {
    // Reset window
    data.count = 1;
    data.resetTime = now + windowMs;
    return true;
  }
  
  if (data.count >= maxRequests) {
    return false;
  }
  
  data.count++;
  return true;
}

// Input sanitization
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/[<>]/g, '') // Remove potential XSS characters
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

// SQL injection prevention helpers
export function sanitizeForSearch(query: string): string {
  if (typeof query !== 'string') return '';
  
  return query
    .replace(/[%_]/g, '\\$&') // Escape SQL wildcards
    .replace(/['"]/g, '') // Remove quotes
    .trim()
    .substring(0, 100); // Limit length
}

// File upload security
export function isValidFileType(filename: string, allowedTypes: string[]): boolean {
  const extension = filename.toLowerCase().split('.').pop();
  return allowedTypes.includes(extension || '');
}

export function isValidFileSize(size: number, maxSizeMB: number = 50): boolean {
  const maxBytes = maxSizeMB * 1024 * 1024;
  return size <= maxBytes;
}

const ALLOWED_FILE_TYPES = [
  'jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 
  'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv'
];

export function validateFileUpload(file: { name: string; size: number }): { valid: boolean; error?: string } {
  if (!isValidFileType(file.name, ALLOWED_FILE_TYPES)) {
    return { valid: false, error: 'File type not allowed' };
  }
  
  if (!isValidFileSize(file.size)) {
    return { valid: false, error: 'File size exceeds 50MB limit' };
  }
  
  return { valid: true };
}

// Environment variable validation
export function validateRequiredEnvVars(): { valid: boolean; missing?: string[] } {
  const required = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  return {
    valid: missing.length === 0,
    missing: missing.length > 0 ? missing : undefined
  };
}

// Password strength validation
export function validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// CSRF token validation (simple implementation)
export function generateCSRFToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Email validation
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

// Phone number validation
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[\d+\-()\s]{10,}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

// URL validation
export function isValidURL(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

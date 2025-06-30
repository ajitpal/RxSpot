import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // Anonymous usage
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Generate anonymous user hash for device fingerprinting
export const generateUserHash = (): string => {
  if (typeof window !== 'undefined') {
    const fingerprint = navigator.userAgent + Date.now().toString();
    return btoa(fingerprint).slice(0, 12);
  }
  return Math.random().toString(36).substring(2, 14);
};

// Calculate confidence based on time decay
export const calculateConfidence = (report: any): number => {
  const hoursOld = (Date.now() - new Date(report.created_at).getTime()) / (1000 * 60 * 60);
  const decayRate = 0.0063; // 0.15/24 hourly decay for 24hr lifecycle
  return Math.max(0, report.confidence - (hoursOld * decayRate));
};

// Handle conflicting reports
export const resolveConflict = (oldConfidence: number, newConfidence: number = 1.0): number => {
  return (oldConfidence * 0.6) + (newConfidence * 0.4);
};
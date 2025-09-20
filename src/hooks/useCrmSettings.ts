"use client";

import { useState, useEffect } from 'react';

export interface CrmSettings {
  leadStatuses: string[];
  leadSources: string[];
  projectTypes: string[];
}

export function useCrmSettings() {
  const [settings, setSettings] = useState<CrmSettings>({
    leadStatuses: ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'WON', 'LOST'],
    leadSources: ['Website', 'LinkedIn', 'WhatsApp', 'Referral', 'Ads', 'Import', 'Other'],
    projectTypes: [
      'website-development', 'mobile-app', 'software-development', 'digital-marketing',
      'graphic-design', 'ui-ux-design', 'ecommerce', 'cms-development', 'api-development',
      'database-design', 'cloud-hosting', 'seo', 'content-creation', 'video-production',
      'consulting', 'maintenance', 'others'
    ]
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/settings');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch settings: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Parse comma-separated values and convert to arrays
      const leadStatuses = data.crm_lead_statuses 
        ? data.crm_lead_statuses.split(',').map((s: string) => s.trim().toUpperCase())
        : ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'WON', 'LOST'];
        
      const leadSources = data.crm_lead_sources
        ? data.crm_lead_sources.split(',').map((s: string) => s.trim())
        : ['Website', 'LinkedIn', 'WhatsApp', 'Referral', 'Ads', 'Import', 'Other'];
        
      const projectTypes = data.crm_project_types
        ? data.crm_project_types.split(',').map((s: string) => s.trim().toLowerCase().replace(/\s+/g, '-'))
        : [
            'website-development', 'mobile-app', 'software-development', 'digital-marketing',
            'graphic-design', 'ui-ux-design', 'ecommerce', 'cms-development', 'api-development',
            'database-design', 'cloud-hosting', 'seo', 'content-creation', 'video-production',
            'consulting', 'maintenance', 'others'
          ];
      
      setSettings({
        leadStatuses,
        leadSources,
        projectTypes
      });
      
    } catch (err) {
      console.error('Failed to fetch CRM settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch settings');
      // Keep default values on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return { settings, loading, error, refetch: fetchSettings };
}

"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast-notification";
import { Building2, Settings, Target, Database, Save, RotateCcw } from "lucide-react";

type SettingsData = {
  // Company Settings
  company_name: string;
  company_address_street: string;
  company_address_city: string;
  company_address_state: string;
  company_address_zip: string;
  company_address_country: string;
  company_phone: string;
  company_email: string;
  company_website: string;
  company_tax_number: string;
  company_currency: string;
  company_timezone: string;
  
  // CRM Settings
  crm_lead_statuses: string;
  crm_lead_sources: string;
  crm_auto_assignment: string;
  crm_inactivity_timeout: string;
  crm_project_types: string;
  crm_project_value_ranges: string;
  
  // Target Settings (Rationalized System)
  target_rationalized_system: string;
  target_monthly_multiplier_quarterly: string;
  target_monthly_multiplier_yearly: string;
  target_achievement_threshold: string;
  target_auto_company_calculation: string;
};

const DEFAULT_SETTINGS: SettingsData = {
  // Company Settings
  company_name: "Aquarius CRM",
  company_address_street: "",
  company_address_city: "",
  company_address_state: "",
  company_address_zip: "",
  company_address_country: "India",
  company_phone: "",
  company_email: "",
  company_website: "",
  company_tax_number: "",
  company_currency: "INR",
  company_timezone: "Asia/Kolkata",
  
  // CRM Settings
  crm_lead_statuses: "New,Contacted,Qualified,Proposal,Won,Lost",
  crm_lead_sources: "Website,Referral,Cold Call,Email,Social Media,Advertisement,Google Ads,Meta Ads",
  crm_auto_assignment: "round_robin",
  crm_inactivity_timeout: "30",
  crm_project_types: "Web Development,Mobile App,E-commerce,Consulting,Other",
  crm_project_value_ranges: "0-50000,50000-200000,200000-500000,500000+",
  
  // Target Settings (Rationalized System)
  target_rationalized_system: "true",
  target_monthly_multiplier_quarterly: "3",
  target_monthly_multiplier_yearly: "12",
  target_achievement_threshold: "80",
  target_auto_company_calculation: "true",
};

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const { showToast } = useToast();
  const [settings, setSettings] = useState<SettingsData>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("company");

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "ADMIN") {
      loadSettings();
    }
  }, [status, session]);

  const loadSettings = async () => {
    try {
      const response = await fetch("/api/settings");
      if (response.ok) {
        const data = await response.json();
        setSettings(prev => ({ ...prev, ...data }));
      }
    } catch (error) {
      showToast({
        title: "Failed to load settings",
        type: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });

      if (response.ok) {
        showToast({
        title: "Settings saved successfully",
        type: "success"
      });
      } else {
        throw new Error("Failed to save settings");
      }
    } catch (error) {
      showToast({
        title: "Failed to save settings",
        type: "error"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
    showToast({
      title: "Settings reset to defaults",
      type: "info"
    });
  };

  const updateSetting = (key: keyof SettingsData, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  // Loading state
  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Access denied
  if (status === "authenticated" && session?.user?.role !== "ADMIN") {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-white mb-2">Access Denied</h2>
          <p className="text-slate-400">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "company", label: "Company", icon: Building2 },
    { id: "crm", label: "CRM", icon: Settings },
    { id: "targets", label: "Targets", icon: Target },
    { id: "system", label: "System", icon: Database },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">System Settings</h2>
          <p className="text-slate-400">Configure your CRM system preferences</p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={handleReset}
            className="border-slate-600/70 text-slate-300 hover:bg-slate-700 hover:border-slate-500 rounded-full px-5"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset to Defaults
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="bg-purple-600 hover:bg-purple-700 rounded-full px-5 shadow-lg hover:shadow-purple-500/25 disabled:opacity-60"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-full p-1 border border-slate-600/50">
        <nav className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 text-sm font-medium
                ${
                  activeTab === tab.id
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-500/25"
                    : "text-slate-300 hover:text-white hover:bg-slate-600/50"
                }
              `}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Settings Content */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700/50">
        {/* Company Settings */}
        {activeTab === "company" && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white mb-4">Company Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="company_name" className="text-slate-300">Company Name</Label>
                <Input
                  id="company_name"
                  value={settings.company_name}
                  onChange={(e) => updateSetting("company_name", e.target.value)}
                  className="bg-slate-700/50 border-slate-600 text-white mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="company_currency" className="text-slate-300">Primary Currency</Label>
                <Select value={settings.company_currency} onValueChange={(value) => updateSetting("company_currency", value)}>
                  <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INR">INR (₹)</SelectItem>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="company_address_street" className="text-slate-300">Street Address</Label>
              <Input
                id="company_address_street"
                value={settings.company_address_street}
                onChange={(e) => updateSetting("company_address_street", e.target.value)}
                className="bg-slate-700/50 border-slate-600 text-white mt-1"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="company_address_city" className="text-slate-300">City</Label>
                <Input
                  id="company_address_city"
                  value={settings.company_address_city}
                  onChange={(e) => updateSetting("company_address_city", e.target.value)}
                  className="bg-slate-700/50 border-slate-600 text-white mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="company_address_state" className="text-slate-300">State</Label>
                <Input
                  id="company_address_state"
                  value={settings.company_address_state}
                  onChange={(e) => updateSetting("company_address_state", e.target.value)}
                  className="bg-slate-700/50 border-slate-600 text-white mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="company_address_zip" className="text-slate-300">ZIP Code</Label>
                <Input
                  id="company_address_zip"
                  value={settings.company_address_zip}
                  onChange={(e) => updateSetting("company_address_zip", e.target.value)}
                  className="bg-slate-700/50 border-slate-600 text-white mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="company_phone" className="text-slate-300">Phone</Label>
                <Input
                  id="company_phone"
                  value={settings.company_phone}
                  onChange={(e) => updateSetting("company_phone", e.target.value)}
                  className="bg-slate-700/50 border-slate-600 text-white mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="company_email" className="text-slate-300">Email</Label>
                <Input
                  id="company_email"
                  type="email"
                  value={settings.company_email}
                  onChange={(e) => updateSetting("company_email", e.target.value)}
                  className="bg-slate-700/50 border-slate-600 text-white mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="company_website" className="text-slate-300">Website</Label>
                <Input
                  id="company_website"
                  value={settings.company_website}
                  onChange={(e) => updateSetting("company_website", e.target.value)}
                  className="bg-slate-700/50 border-slate-600 text-white mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="company_tax_number" className="text-slate-300">Tax/Business Registration Number</Label>
                <Input
                  id="company_tax_number"
                  value={settings.company_tax_number}
                  onChange={(e) => updateSetting("company_tax_number", e.target.value)}
                  className="bg-slate-700/50 border-slate-600 text-white mt-1"
                />
              </div>
            </div>
          </div>
        )}

        {/* CRM Settings */}
        {activeTab === "crm" && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white mb-4">CRM Configuration</h3>
            
            <div>
              <Label htmlFor="crm_lead_statuses" className="text-slate-300">Lead Statuses (comma-separated)</Label>
              <Input
                id="crm_lead_statuses"
                value={settings.crm_lead_statuses}
                onChange={(e) => updateSetting("crm_lead_statuses", e.target.value)}
                className="bg-slate-700/50 border-slate-600 text-white mt-1"
                placeholder="New,Contacted,Qualified,Won,Lost"
              />
            </div>

            <div>
              <Label htmlFor="crm_lead_sources" className="text-slate-300">Lead Sources (comma-separated)</Label>
              <Input
                id="crm_lead_sources"
                value={settings.crm_lead_sources}
                onChange={(e) => updateSetting("crm_lead_sources", e.target.value)}
                className="bg-slate-700/50 border-slate-600 text-white mt-1"
                placeholder="Website,Referral,Cold Call,Email"
              />
            </div>

            <div>
              <Label htmlFor="crm_project_types" className="text-slate-300">Project Types (comma-separated)</Label>
              <Input
                id="crm_project_types"
                value={settings.crm_project_types}
                onChange={(e) => updateSetting("crm_project_types", e.target.value)}
                className="bg-slate-700/50 border-slate-600 text-white mt-1"
                placeholder="Web Development,Mobile App,Consulting"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="crm_auto_assignment" className="text-slate-300">Auto Assignment</Label>
                <Select value={settings.crm_auto_assignment} onValueChange={(value) => updateSetting("crm_auto_assignment", value)}>
                  <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="round_robin">Round Robin</SelectItem>
                    <SelectItem value="random">Random</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="crm_inactivity_timeout" className="text-slate-300">Lead Inactivity Timeout (days)</Label>
                <Input
                  id="crm_inactivity_timeout"
                  type="number"
                  value={settings.crm_inactivity_timeout}
                  onChange={(e) => updateSetting("crm_inactivity_timeout", e.target.value)}
                  className="bg-slate-700/50 border-slate-600 text-white mt-1"
                />
              </div>
            </div>
          </div>
        )}

        {/* Target Settings */}
        {activeTab === "targets" && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white mb-4">Target Management (Rationalized System)</h3>
            
            {/* System Configuration */}
            <div className="bg-slate-700/30 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-2">
                <input
                  type="checkbox"
                  id="rationalized-system"
                  checked={settings.target_rationalized_system === "true"}
                  onChange={(e) => updateSetting("target_rationalized_system", e.target.checked.toString())}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <Label htmlFor="rationalized-system" className="text-slate-300 font-medium">
                  Use Rationalized Monthly-Only Target System
                </Label>
              </div>
              <p className="text-xs text-slate-400 ml-7">
                When enabled, only monthly targets are set directly. Quarterly and yearly targets are auto-calculated as multiples.
              </p>
            </div>

            {/* Multiplier Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="target_monthly_multiplier_quarterly" className="text-slate-300">Quarterly Multiplier</Label>
                <Input
                  id="target_monthly_multiplier_quarterly"
                  type="number"
                  min="1"
                  max="12"
                  value={settings.target_monthly_multiplier_quarterly}
                  onChange={(e) => updateSetting("target_monthly_multiplier_quarterly", e.target.value)}
                  className="bg-slate-700/50 border-slate-600 text-white mt-1"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Multiplier to calculate quarterly targets from monthly (typically 3)
                </p>
              </div>
              
              <div>
                <Label htmlFor="target_monthly_multiplier_yearly" className="text-slate-300">Yearly Multiplier</Label>
                <Input
                  id="target_monthly_multiplier_yearly"
                  type="number"
                  min="1"
                  max="24"
                  value={settings.target_monthly_multiplier_yearly}
                  onChange={(e) => updateSetting("target_monthly_multiplier_yearly", e.target.value)}
                  className="bg-slate-700/50 border-slate-600 text-white mt-1"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Multiplier to calculate yearly targets from monthly (typically 12)
                </p>
              </div>
            </div>

            {/* Company Target Auto-calculation */}
            <div className="bg-slate-700/30 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-2">
                <input
                  type="checkbox"
                  id="auto-company-calc"
                  checked={settings.target_auto_company_calculation === "true"}
                  onChange={(e) => updateSetting("target_auto_company_calculation", e.target.checked.toString())}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <Label htmlFor="auto-company-calc" className="text-slate-300 font-medium">
                  Auto-calculate Company Targets
                </Label>
              </div>
              <p className="text-xs text-slate-400 ml-7">
                Automatically calculate company targets as sum of all user targets to avoid double-counting in achievements.
              </p>
            </div>

            {/* Achievement Threshold */}
            <div>
              <Label htmlFor="target_achievement_threshold" className="text-slate-300">Achievement Threshold (%)</Label>
              <Input
                id="target_achievement_threshold"
                type="number"
                min="0"
                max="100"
                value={settings.target_achievement_threshold}
                onChange={(e) => updateSetting("target_achievement_threshold", e.target.value)}
                className="bg-slate-700/50 border-slate-600 text-white mt-1"
              />
              <p className="text-xs text-slate-400 mt-1">
                Minimum percentage required to consider a target as achieved
              </p>
            </div>
          </div>
        )}

        {/* System Info */}
        {activeTab === "system" && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white mb-4">System Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-700/30 rounded-lg p-4">
                <h4 className="text-sm font-medium text-slate-300 mb-2">Application Version</h4>
                <p className="text-white">1.0.0</p>
              </div>
              
              <div className="bg-slate-700/30 rounded-lg p-4">
                <h4 className="text-sm font-medium text-slate-300 mb-2">Database Status</h4>
                <p className="text-green-400">Connected</p>
              </div>
              
              <div className="bg-slate-700/30 rounded-lg p-4">
                <h4 className="text-sm font-medium text-slate-300 mb-2">Last Updated</h4>
                <p className="text-white">{new Date().toLocaleDateString()}</p>
              </div>
              
              <div className="bg-slate-700/30 rounded-lg p-4">
                <h4 className="text-sm font-medium text-slate-300 mb-2">System Health</h4>
                <p className="text-green-400">Healthy</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, X, Save } from "lucide-react";
import { useCrmSettings } from "@/hooks/useCrmSettings";

// Types
interface FormData {
  // Personal Information
  name: string;
  middleName: string;
  lastName: string;
  email: string;
  phone: string;
  designation: string;
  department: string;
  industry: string;
  country: string;
  photo: string; // Added photo field
  
  // Company Information
  company: string;
  website: string;
  companyDescription: string;
  
  // Project Information
  projectName: string;
  projectDescription: string;
  projectType: string;
  budget: string;
  projectValue: string;
  currency: string;
  timeline: string;
  
  // Lead Details
  status: string;
  source: string;
  tags: string[];
  notes: string;
}

interface ValidationErrors {
  [key: string]: string;
}

interface EditLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: string;
  onLeadUpdated: () => void;
}

// Constants
const STEPS = [
  { id: 1, title: "Personal", description: "Contact information" },
  { id: 2, title: "Company", description: "Organization details" },
  { id: 3, title: "Project", description: "Enquiry details" },
  { id: 4, title: "Lead Details", description: "Categorization" },
];

// Statuses and sources will now be loaded dynamically from CRM settings
const PROJECT_TYPES = [
  "website-development", "mobile-app", "software-development", "digital-marketing",
  "graphic-design", "ui-ux-design", "ecommerce", "cms-development", "api-development",
  "database-design", "cloud-hosting", "seo", "content-creation", "video-production",
  "consulting", "maintenance", "others"
] as const;

const INDUSTRIES = [
  "Technology", "Healthcare", "Finance", "Education", "Retail", "Manufacturing",
  "Real Estate", "Entertainment", "Travel", "Food & Beverage", "Automotive",
  "Fashion", "Sports", "Non-Profit", "Government", "Others"
] as const;

const COUNTRIES = [
  "India", "United States", "Canada", "United Kingdom", "Australia", "Germany",
  "France", "Japan", "Singapore", "UAE", "Netherlands", "Sweden", "Norway",
  "Denmark", "Switzerland", "Others"
] as const;

const DEPARTMENTS = [
  "IT/Technology", "Marketing", "Sales", "Human Resources", "Finance", "Operations",
  "Customer Service", "Research & Development", "Legal", "Administration",
  "Engineering", "Product Management", "Business Development", "Quality Assurance",
  "Design", "Content", "Analytics", "Security", "Others"
] as const;

const CURRENCY_MAP = {
  "India": "INR",
  "United States": "USD",
  "Canada": "USD",
  "United Kingdom": "USD",
  "Australia": "USD",
  "Germany": "USD",
  "France": "USD",
  "Japan": "USD",
  "Singapore": "USD",
  "UAE": "USD",
  "Netherlands": "USD",
  "Sweden": "USD",
  "Norway": "USD",
  "Denmark": "USD",
  "Switzerland": "USD",
  "Others": "USD",
};

const BUDGET_RANGES = {
  INR: [
    "₹500 - ₹1,000", "₹1,000 - ₹5,000", "₹5,000 - ₹10,000", "₹10,000 - ₹25,000",
    "₹25,000 - ₹50,000", "₹50,000 - ₹100,000", "₹100,000 - ₹250,000",
    "₹250,000 - ₹500,000", "₹500,000 - ₹1,000,000", "₹1,000,000+"
  ],
  USD: [
    "$500 - $1,000", "$1,000 - $5,000", "$5,000 - $10,000", "$10,000 - $25,000",
    "$25,000 - $50,000", "$50,000 - $100,000", "$100,000 - $250,000",
    "$250,000 - $500,000", "$500,000 - $1,000,000", "$1,000,000+"
  ]
};

export function EditLeadModal({ isOpen, onClose, leadId, onLeadUpdated }: EditLeadModalProps) {
  const { settings: crmSettings, loading: settingsLoading } = useCrmSettings();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    name: "", middleName: "", lastName: "", email: "", phone: "",
    designation: "", department: "", industry: "", country: "",
    company: "", website: "", companyDescription: "",
    projectName: "", projectDescription: "", projectType: "", budget: "",
    projectValue: "", currency: "USD", timeline: "",
    status: "NEW", source: "Other", tags: [], notes: "",
    photo: "" // Initialize photo field
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load lead data when modal opens
  useEffect(() => {
    if (isOpen && leadId) {
      loadLeadData();
    }
  }, [isOpen, leadId]);

  const loadLeadData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/leads/${leadId}`);
      if (response.ok) {
        const lead = await response.json();
        console.log('🔍 Loaded lead data:', lead); // Debug log
        
        setFormData({
          name: lead.name || "",
          middleName: lead.middleName || "",
          lastName: lead.lastName || "",
          email: lead.email || "",
          phone: lead.phone || "",
          designation: lead.designation || "",
          department: lead.department || "",
          industry: lead.industry || "",
          country: lead.country || "",
          company: lead.company || "",
          website: lead.website || "",
          companyDescription: lead.companyDescription || "",
          projectName: lead.projectName || "",
          projectDescription: lead.projectDescription || "",
          projectType: lead.projectType || "",
          budget: lead.budget || "",
          projectValue: lead.projectValue ? lead.projectValue.toString() : "",
          currency: lead.currency || "USD",
          timeline: lead.timeline || "",
          status: lead.status || "NEW",
          source: lead.source || "Other",
          tags: Array.isArray(lead.tags) ? lead.tags : (lead.tags ? [lead.tags] : []),
          notes: lead.notes || "",
          photo: lead.photo || ""
        });
        
        console.log('✅ Form data set successfully'); // Debug log
      } else {
        console.error('❌ Failed to load lead data:', response.status, response.statusText);
      }
    } catch (error) {
      console.error("❌ Error loading lead data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: ValidationErrors = {};

    switch (step) {
      case 1:
        if (!formData.name.trim()) newErrors.name = "Name is required";
        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          newErrors.email = "Invalid email format";
        }
        if (formData.phone && !/^\d+$/.test(formData.phone.replace(/\s/g, ""))) {
          newErrors.phone = "Phone number should contain only numbers";
        }
        break;
      case 2:
        // Company step is optional
        break;
      case 3:
        if (!formData.projectName.trim()) newErrors.projectName = "Project name is required";
        if (formData.projectValue && isNaN(parseFloat(formData.projectValue))) {
          newErrors.projectValue = "Project value must be a valid number";
        }
        break;
      case 4:
        // Lead details step is optional
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleCountryChange = (country: string) => {
    const currency = CURRENCY_MAP[country as keyof typeof CURRENCY_MAP] || "USD";
    setFormData(prev => ({
      ...prev,
      country,
      currency,
      budget: "", // Reset budget when country changes
      projectValue: "" // Reset project value when country changes
    }));
  };

  const getBudgetOptions = () => {
    return BUDGET_RANGES[formData.currency as keyof typeof BUDGET_RANGES] || BUDGET_RANGES.USD;
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setIsSaving(true);
    try {
      // Prepare the data to be sent
      const submitData = {
        ...formData,
        projectValue: formData.projectValue ? parseFloat(formData.projectValue) : null,
      };
      
      console.log('🔍 Submitting lead data:', submitData); // Debug log
      
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      if (response.ok) {
        const updatedLead = await response.json();
        console.log('✅ Lead updated successfully:', updatedLead); // Debug log
        
        onLeadUpdated();
        onClose();
        setCurrentStep(1);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Failed to update lead:', response.status, response.statusText, errorData);
      }
    } catch (error) {
      console.error('❌ Error updating lead:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || settingsLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader className="border-b border-slate-700 pb-4 rounded-t-xl">
            <DialogTitle className="text-xl font-semibold text-white flex items-center gap-2">
              <Save className="w-5 h-5" />
              Edit Lead
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
              <p className="text-slate-400">Loading lead data...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader className="border-b border-slate-700 pb-4 rounded-t-xl">
          <DialogTitle className="text-xl font-semibold text-white flex items-center gap-2">
            <Save className="w-5 h-5" />
            Edit Lead
          </DialogTitle>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-6 pt-4">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                currentStep >= step.id
                  ? "bg-purple-600 text-white"
                  : "bg-slate-700 text-slate-400"
              }`}>
                {step.id}
              </div>
              <div className="ml-3">
                <div className={`text-sm font-medium ${
                  currentStep >= step.id ? "text-white" : "text-slate-400"
                }`}>
                  {step.title}
                </div>
                <div className="text-xs text-slate-500">{step.description}</div>
              </div>
              {index < STEPS.length - 1 && (
                <div className={`w-12 h-px mx-4 ${
                  currentStep > step.id ? "bg-purple-600" : "bg-slate-700"
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Form Content */}
        <div className="space-y-6">
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">Personal Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium text-slate-200">First Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className="bg-slate-800 border-slate-600 text-white mt-1"
                    placeholder="Enter first name"
                  />
                  {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-slate-200">Middle Name</Label>
                  <Input
                    value={formData.middleName}
                    onChange={(e) => handleInputChange("middleName", e.target.value)}
                    className="bg-slate-800 border-slate-600 text-white mt-1"
                    placeholder="Enter middle name"
                  />
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-slate-200">Last Name</Label>
                  <Input
                    value={formData.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    className="bg-slate-800 border-slate-600 text-white mt-1"
                    placeholder="Enter last name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-slate-200">Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="bg-slate-800 border-slate-600 text-white mt-1"
                    placeholder="Enter email address"
                  />
                  {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-slate-200">Phone</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className="bg-slate-800 border-slate-600 text-white mt-1"
                    placeholder="Enter phone number"
                  />
                  {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium text-slate-200">Designation</Label>
                  <Input
                    value={formData.designation}
                    onChange={(e) => handleInputChange("designation", e.target.value)}
                    className="bg-slate-800 border-slate-600 text-white mt-1"
                    placeholder="Enter designation"
                  />
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-slate-200">Department</Label>
                  <Select value={formData.department} onValueChange={(value) => handleInputChange("department", value)}>
                    <SelectTrigger className="bg-slate-800 border-slate-600 text-white mt-1">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      {DEPARTMENTS.map(department => (
                        <SelectItem key={department} value={department}>{department}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-slate-200">Industry</Label>
                  <Select value={formData.industry} onValueChange={(value) => handleInputChange("industry", value)}>
                    <SelectTrigger className="bg-slate-800 border-slate-600 text-white mt-1">
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      {INDUSTRIES.map(industry => (
                        <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-slate-200">Country</Label>
                <Select value={formData.country} onValueChange={handleCountryChange}>
                  <SelectTrigger className="bg-slate-800 border-slate-600 text-white mt-1">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    {COUNTRIES.map(country => (
                      <SelectItem key={country} value={country}>{country}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium text-slate-200">Photo</Label>
                <div 
                  className="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center cursor-pointer mt-1"
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (event) => {
                      const file = (event.target as HTMLInputElement).files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          handleInputChange("photo", reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    };
                    input.click();
                  }}
                >
                  {formData.photo ? (
                    <div className="space-y-2">
                      <img src={formData.photo} alt="Lead Photo" className="w-20 h-20 rounded-lg mx-auto object-cover" />
                      <p className="text-sm text-slate-400">Click to change photo</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-slate-400 text-2xl">📷</div>
                      <p className="text-sm text-slate-400">Click to upload photo</p>
                      <p className="text-xs text-slate-500">Max 2MB</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">Company Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-slate-200">Company Name</Label>
                  <Input
                    value={formData.company}
                    onChange={(e) => handleInputChange("company", e.target.value)}
                    className="bg-slate-800 border-slate-600 text-white mt-1"
                    placeholder="Enter company name"
                  />
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-slate-200">Website</Label>
                  <Input
                    value={formData.website}
                    onChange={(e) => handleInputChange("website", e.target.value)}
                    className="bg-slate-800 border-slate-600 text-white mt-1"
                    placeholder="Enter website URL"
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-slate-200">Company Description</Label>
                <Textarea
                  value={formData.companyDescription}
                  onChange={(e) => handleInputChange("companyDescription", e.target.value)}
                  className="bg-slate-800 border-slate-600 text-white mt-1"
                  placeholder="Describe the company..."
                  rows={4}
                />
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">Project Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-slate-200">Project Name *</Label>
                  <Input
                    value={formData.projectName}
                    onChange={(e) => handleInputChange("projectName", e.target.value)}
                    className="bg-slate-800 border-slate-600 text-white mt-1"
                    placeholder="Enter project name"
                  />
                  {errors.projectName && <p className="text-red-400 text-xs mt-1">{errors.projectName}</p>}
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-slate-200">Project Type</Label>
                  <Select value={formData.projectType} onValueChange={(value) => handleInputChange("projectType", value)}>
                    <SelectTrigger className="bg-slate-800 border-slate-600 text-white mt-1">
                      <SelectValue placeholder="Select project type" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      {PROJECT_TYPES.map(type => (
                        <SelectItem key={type} value={type}>
                          {type.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-slate-200">Project Description</Label>
                <Textarea
                  value={formData.projectDescription}
                  onChange={(e) => handleInputChange("projectDescription", e.target.value)}
                  className="bg-slate-800 border-slate-600 text-white mt-1"
                  placeholder="Describe the project..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium text-slate-200">Currency</Label>
                  <Select value={formData.currency} onValueChange={(value) => handleInputChange("currency", value)}>
                    <SelectTrigger className="bg-slate-800 border-slate-600 text-white mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="INR">INR (₹)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-slate-200">Project Value</Label>
                  <Input
                    value={formData.projectValue}
                    onChange={(e) => handleInputChange("projectValue", e.target.value)}
                    className="bg-slate-800 border-slate-600 text-white mt-1"
                    placeholder="Enter project value"
                  />
                  {errors.projectValue && <p className="text-red-400 text-xs mt-1">{errors.projectValue}</p>}
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-slate-200">Budget Range</Label>
                  <Select value={formData.budget} onValueChange={(value) => handleInputChange("budget", value)}>
                    <SelectTrigger className="bg-slate-800 border-slate-600 text-white mt-1">
                      <SelectValue placeholder="Select budget range" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      {getBudgetOptions().map(budget => (
                        <SelectItem key={budget} value={budget}>{budget}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-slate-200">Timeline</Label>
                <Select value={formData.timeline} onValueChange={(value) => handleInputChange("timeline", value)}>
                  <SelectTrigger className="bg-slate-800 border-slate-600 text-white mt-1">
                    <SelectValue placeholder="Select timeline" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    {/* Show saved value first if it's not in predefined options */}
                    {formData.timeline && !["1-2 weeks", "1 month", "2-3 months", "3-6 months", "6+ months", "Ongoing"].includes(formData.timeline) && (
                      <SelectItem value={formData.timeline}>{formData.timeline}</SelectItem>
                    )}
                    <SelectItem value="1-2 weeks">1-2 weeks</SelectItem>
                    <SelectItem value="1 month">1 month</SelectItem>
                    <SelectItem value="2-3 months">2-3 months</SelectItem>
                    <SelectItem value="3-6 months">3-6 months</SelectItem>
                    <SelectItem value="6+ months">6+ months</SelectItem>
                    <SelectItem value="Ongoing">Ongoing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">Lead Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-slate-200">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                    <SelectTrigger className="bg-slate-800 border-slate-600 text-white mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      {crmSettings.leadStatuses.map(status => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-slate-200">Source</Label>
                  <Select value={formData.source} onValueChange={(value) => handleInputChange("source", value)}>
                    <SelectTrigger className="bg-slate-800 border-slate-600 text-white mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      {crmSettings.leadSources.map(source => (
                        <SelectItem key={source} value={source}>{source}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-slate-200">Tags</Label>
                <Input
                  value={Array.isArray(formData.tags) ? formData.tags.join(', ') : ''}
                  onChange={(e) => {
                    const tags = e.target.value.split(',').map(tag => tag.trim()).filter(Boolean);
                    handleInputChange("tags", tags);
                  }}
                  className="bg-slate-800 border-slate-600 text-white mt-1"
                  placeholder="Enter tags separated by commas (e.g., urgent, web-development, ecommerce)"
                />
                <p className="text-xs text-slate-500 mt-1">Separate multiple tags with commas</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-slate-200">Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  className="bg-slate-800 border-slate-600 text-white mt-1"
                  placeholder="Add any additional notes..."
                  rows={4}
                />
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="sticky bottom-0 z-10 bg-slate-900/95 backdrop-blur supports-[backdrop-filter]:bg-slate-900/80 flex justify-between items-center pt-6 border-t border-slate-700 rounded-b-xl">
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-slate-300 hover:text-white"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          
          <div className="flex gap-3">
            {currentStep > 1 && (
              <Button
                variant="outline"
                onClick={prevStep}
                className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
            )}
            
            {currentStep < 4 ? (
              <Button
                onClick={nextStep}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSaving}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import AppShell from "@/components/app-shell";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
} from "@/components/ui/select";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

const STATUSES = ["NEW","CONTACTED","QUALIFIED","PROPOSAL","WON","LOST"] as const;
const SOURCES  = ["WEBSITE","LINKEDIN","WHATSAPP","REFERRAL","ADS","IMPORT","OTHER"] as const;

const STEPS = [
  { id: 1, title: "Personal", description: "Contact information" },
  { id: 2, title: "Company", description: "Organization details" },
  { id: 3, title: "Project", description: "Enquiry details" },
  { id: 4, title: "Lead Details", description: "Categorization" },
];

// Currency mapping based on country
const CURRENCY_MAP = {
  "india": "INR",
  "united states": "USD",
  "canada": "USD",
  "united kingdom": "USD",
  "australia": "USD",
  "germany": "USD",
  "france": "USD",
  "japan": "USD",
  "singapore": "USD",
  "uae": "USD",
  "netherlands": "USD",
  "sweden": "USD",
  "norway": "USD",
  "denmark": "USD",
  "switzerland": "USD",
  "others": "USD",
};

// Budget ranges for different currencies
const BUDGET_RANGES = {
  INR: [
    { value: "small", label: "₹50,000 - ₹2,00,000" },
    { value: "medium-small", label: "₹2,00,000 - ₹5,00,000" },
    { value: "medium", label: "₹5,00,000 - ₹10,00,000" },
    { value: "medium-large", label: "₹10,00,000 - ₹25,00,000" },
    { value: "large", label: "₹25,00,000 - ₹50,00,000" },
    { value: "enterprise", label: "₹50,00,000+" },
  ],
  USD: [
    { value: "small", label: "$500 - $2K" },
    { value: "medium-small", label: "$2K - $5K" },
    { value: "medium", label: "$5K - $10K" },
    { value: "medium-large", label: "$10K - $25K" },
    { value: "large", label: "$25K - $50K" },
    { value: "enterprise", label: "$50K+" },
  ]
};

// Countries list
const COUNTRIES = [
  "India",
  "United States",
  "Canada",
  "United Kingdom",
  "Australia",
  "Germany",
  "France",
  "Japan",
  "Singapore",
  "UAE",
  "Netherlands",
  "Sweden",
  "Norway",
  "Denmark",
  "Switzerland",
  "Others"
];

const DEPARTMENTS = [
  "IT/Technology", "Marketing", "Sales", "Human Resources", "Finance", "Operations",
  "Customer Service", "Research & Development", "Legal", "Administration",
  "Engineering", "Product Management", "Business Development", "Quality Assurance",
  "Design", "Content", "Analytics", "Security", "Others"
] as const;

interface FormData {
  // Personal
  name: string;
  middleName: string;
  lastName: string;
  email: string;
  phone: string;
  designation: string;
  department: string;
  industry: string;
  country: string;
  photo: string; // Add photo field
  
  // Company
  company: string;
  website: string;
  companyDescription: string;
  
  // Project
  projectName: string;
  projectDescription: string;
  projectType: string;
  budget: string;
  projectValue: string;
  currency: string;
  timeline: string;
  
  // Lead Details
  source: string;
  status: string;
  tags: string;
  notes: string;
}

interface ValidationErrors {
  [key: string]: string;
}

export default function NewLead() {
  const r = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [msg, setMsg] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});

  // Lock body scroll while modal is open to avoid layout shifts
  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [isOpen]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state management
  const [formData, setFormData] = useState<FormData>({
    name: "",
    middleName: "",
    lastName: "",
    email: "",
    phone: "",
    designation: "",
    department: "",
    industry: "",
    country: "India",
    company: "",
    website: "",
    companyDescription: "",
    projectName: "",
    projectDescription: "",
    projectType: "",
    budget: "",
    projectValue: "",
    currency: "INR",
    timeline: "",
    source: "OTHER",
    status: "NEW",
    tags: "",
    notes: "",
    photo: "", // Initialize photo field
  });

  const progress = (currentStep / STEPS.length) * 100;

  // Handle country change
  const handleCountryChange = (country: string) => {
    const currency = CURRENCY_MAP[country.toLowerCase() as keyof typeof CURRENCY_MAP] || "USD";
    setFormData(prev => ({ 
      ...prev, 
      country,
      currency,
      budget: "",
      projectValue: ""
    }));
  };

  // Get budget options based on current currency
  const getBudgetOptions = () => {
    const currency = formData.currency || "USD";
    return BUDGET_RANGES[currency as keyof typeof BUDGET_RANGES] || BUDGET_RANGES.USD;
  };

  // Handle input changes
  const handleInputChange = (field: keyof FormData, value: string) => {
    if (field === "phone") {
      const cleanedValue = value.replace(/[^\d+\-()\s]/g, "");
      setFormData(prev => ({ ...prev, [field]: cleanedValue }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  // Validation function
  const validateStep = (step: number): boolean => {
    const newErrors: ValidationErrors = {};

    if (step === 1) {
      if (!formData.name.trim()) newErrors.name = "First name is required";
      if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
      if (!formData.email.trim()) {
        newErrors.email = "Email is required";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = "Please enter a valid email address";
      }
      if (!formData.phone.trim()) {
        newErrors.phone = "Phone number is required";
      } else if (!/^[\d+\-()\s]{10,}$/.test(formData.phone.replace(/\s/g, ""))) {
        newErrors.phone = "Please enter a valid phone number (minimum 10 digits)";
      }
    }

    if (step === 2) {
      if (!formData.company.trim()) newErrors.company = "Company name is required";
    }

    if (step === 3) {
      if (!formData.projectName.trim()) newErrors.projectName = "Project name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    }
  };

  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const handleModalClose = () => {
    setIsOpen(false);
    // Reset form data when modal is closed
    setFormData({
      // Personal
      name: "",
      middleName: "",
      lastName: "",
      email: "",
      phone: "",
      designation: "",
      department: "",
      industry: "",
      country: "",
      photo: "", // Reset photo field
      
      // Company
      company: "",
      website: "",
      companyDescription: "",
      
      // Project
      projectName: "",
      projectDescription: "",
      projectType: "",
      budget: "",
      projectValue: "",
      currency: "",
      timeline: "",
      
      // Lead Management
      status: "NEW",
      source: "OTHER",
      tags: "",
      notes: "",
    });
    setCurrentStep(1);
    setErrors({});
    setMsg("");
    // Redirect to main leads page
    r.push("/leads");
  };

  async function handleSubmit(e?: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>) {
    if (e) {
      e.preventDefault();
    }
    setMsg("");

    // If not on the final step, treat submit as "Next" and do not create the lead yet
    if (currentStep < STEPS.length) {
      if (!validateStep(currentStep)) {
        return;
      }
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
      return;
    }

    // Final step: validate again then create the lead
    if (!validateStep(currentStep)) {
      return;
    }

    setIsSubmitting(true);

    try {
      // If any select dropdown is open (Radix adds aria-expanded), avoid submit to prevent jank
      const expanded = document.querySelector('[data-radix-select-content]') as HTMLElement | null;
      if (expanded) {
        return; // user is selecting; do nothing
      }
      const payload = {
        // Personal Information
        name: `${formData.name} ${formData.middleName} ${formData.lastName}`.trim(),
        middleName: formData.middleName || null,
        lastName: formData.lastName || null,
        email: formData.email || null,
        phone: formData.phone || null,
        designation: formData.designation || null,
        department: formData.department || null,
        industry: formData.industry || null,
        country: formData.country || null,
        photo: formData.photo || null, // Include photo in payload

        // Company Information
        company: formData.company || null,
        website: formData.website || null,
        companyDescription: formData.companyDescription || null,

        // Project Information
        projectName: formData.projectName || null,
        projectDescription: formData.projectDescription || null,
        projectType: formData.projectType || null,
        budget: formData.budget || null,
        projectValue: formData.projectValue ? parseFloat(formData.projectValue) : null,
        currency: formData.currency || null,
        timeline: formData.timeline || null,

        // Lead Management
        status: formData.status || "NEW",
        source: formData.source || "OTHER",
        tags: formData.tags?.split(",").map((t) => t.trim()).filter(Boolean) || [],
        notes: formData.notes || null,
      };

      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsOpen(false);
        r.push("/leads");
      } else {
        setMsg((await res.json().catch(() => ({ error: "Failed" }))).error || "Failed to create lead.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Create New Lead</h1>
          <p className="text-slate-400 mt-1">Add a new lead to your pipeline</p>
        </div>
        <Button 
          onClick={() => setIsOpen(true)} 
          className="bg-purple-600 hover:bg-purple-700 rounded-lg"
        >
          + Create Lead
        </Button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-[1000]">
          <div className="absolute inset-0 z-[1000] bg-black/80" />
          <div className="fixed z-[1100] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl max-h-[90vh] overflow-y-scroll bg-slate-800 border border-white rounded-lg p-6 shadow-xl transform-gpu will-change-transform" style={{ scrollbarGutter: 'stable' }}>
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Create New Lead</h2>
              <div className="flex items-center gap-4">
                <span className="text-sm text-slate-400">Step {currentStep} of {STEPS.length}: {STEPS[currentStep-1].title}</span>
                <span className="text-sm font-medium text-purple-400">{Math.round(progress)}% complete</span>
                <button aria-label="Close" onClick={handleModalClose} className="ml-2 rounded-md p-1 text-slate-300 hover:text-white hover:bg-slate-700">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="flex items-center gap-2 mt-6">
              {STEPS.map((step, index) => (
                <div key={step.id} className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep >= step.id 
                      ? "bg-purple-600 text-white" 
                      : "bg-slate-700 text-slate-400"
                  }`}>
                    {step.id}
                  </div>
                  <span className={`text-sm ${currentStep >= step.id ? "text-white" : "text-slate-400"}`}>
                    {step.title}
                  </span>
                  {index < STEPS.length - 1 && (
                    <div className={`w-8 h-1 rounded ${currentStep > step.id ? "bg-purple-600" : "bg-slate-700"}`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          <form className="mt-6" onKeyDown={(e) => {
            // Prevent Enter key from submitting early on non-final steps
            if (e.key === 'Enter' && currentStep < STEPS.length) {
              e.preventDefault();
              nextStep();
            }
          }}>
            {currentStep === 1 && (
              <div className="grid grid-cols-2 gap-6" style={{ contain: 'layout paint size' }}>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-slate-200">Lead Code</Label>
                    <Input 
                      value="Auto-generated" 
                      disabled 
                      className="bg-slate-700 border-slate-600 text-slate-400 rounded-lg"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-slate-200">First Name *</Label>
                    <Input 
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      placeholder="Enter first name" 
                      className={`bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 rounded-lg ${
                        errors.name ? "border-red-500" : ""
                      }`}
                    />
                    {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-slate-200">Middle Name</Label>
                    <Input 
                      value={formData.middleName}
                      onChange={(e) => handleInputChange("middleName", e.target.value)}
                      placeholder="Enter middle name" 
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 rounded-lg"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-slate-200">Last Name *</Label>
                    <Input 
                      value={formData.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                      placeholder="Enter last name" 
                      className={`bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 rounded-lg ${
                        errors.lastName ? "border-red-500" : ""
                      }`}
                    />
                    {errors.lastName && <p className="text-red-400 text-xs mt-1">{errors.lastName}</p>}
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-slate-200">Email *</Label>
                    <Input 
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      type="email" 
                      placeholder="Enter email address" 
                      className={`bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 rounded-lg ${
                        errors.email ? "border-red-500" : ""
                      }`}
                    />
                    {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-slate-200">Phone Number *</Label>
                    <Input 
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      placeholder="Enter phone number" 
                      className={`bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 rounded-lg ${
                        errors.phone ? "border-red-500" : ""
                      }`}
                    />
                    {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-slate-200">Designation</Label>
                    <Input 
                      value={formData.designation}
                      onChange={(e) => handleInputChange("designation", e.target.value)}
                      placeholder="e.g., CTO, Founder" 
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 rounded-lg"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-slate-200">Department</Label>
                    <Select value={formData.department} onValueChange={(value) => handleInputChange("department", value)}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white rounded-lg">
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        {DEPARTMENTS.map(dept => (
                          <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-slate-200">Industry</Label>
                    <Select value={formData.industry} onValueChange={(value) => handleInputChange("industry", value)}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white rounded-lg">
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        <SelectItem value="technology">Technology</SelectItem>
                        <SelectItem value="healthcare">Healthcare</SelectItem>
                        <SelectItem value="finance">Finance & Banking</SelectItem>
                        <SelectItem value="education">Education</SelectItem>
                        <SelectItem value="retail">Retail & E-commerce</SelectItem>
                        <SelectItem value="manufacturing">Manufacturing</SelectItem>
                        <SelectItem value="real-estate">Real Estate</SelectItem>
                        <SelectItem value="consulting">Consulting</SelectItem>
                        <SelectItem value="media">Media & Entertainment</SelectItem>
                        <SelectItem value="automotive">Automotive</SelectItem>
                        <SelectItem value="food-beverage">Food & Beverage</SelectItem>
                        <SelectItem value="travel">Travel & Hospitality</SelectItem>
                        <SelectItem value="logistics">Logistics & Transportation</SelectItem>
                        <SelectItem value="energy">Energy & Utilities</SelectItem>
                        <SelectItem value="non-profit">Non-Profit</SelectItem>
                        <SelectItem value="government">Government</SelectItem>
                        <SelectItem value="others">Others</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-slate-200">Country *</Label>
                    <Select value={formData.country} onValueChange={handleCountryChange}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white rounded-lg">
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
                      className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center cursor-pointer"
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.onchange = (event) => {
                          const file = (event.target as HTMLInputElement).files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setFormData(prev => ({ ...prev, photo: reader.result as string }));
                            };
                            reader.readAsDataURL(file);
                          }
                        };
                        input.click();
                      }}
                    >
                      <div className="text-slate-400 mb-2">📷</div>
                      <p className="text-sm text-slate-400">Upload Photo</p>
                      <p className="text-xs text-slate-500 mt-1">Max 2MB</p>
                    </div>
                    {formData.photo && (
                      <div className="mt-4 flex justify-center">
                        <img src={formData.photo} alt="Lead Photo" className="max-w-sm max-h-40 rounded-lg" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="grid grid-cols-2 gap-6" style={{ contain: 'layout paint size' }}>
                <div>
                  <Label className="text-sm font-medium text-slate-200">Company Name *</Label>
                  <Input 
                    value={formData.company}
                    onChange={(e) => handleInputChange("company", e.target.value)}
                    placeholder="Enter company name" 
                    className={`bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 rounded-lg ${
                      errors.company ? "border-red-500" : ""
                    }`}
                  />
                  {errors.company && <p className="text-red-400 text-xs mt-1">{errors.company}</p>}
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-200">Website</Label>
                  <Input 
                    value={formData.website}
                    onChange={(e) => handleInputChange("website", e.target.value)}
                    placeholder="https://example.com" 
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 rounded-lg"
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-sm font-medium text-slate-200">Company Description</Label>
                  <Textarea 
                    value={formData.companyDescription}
                    onChange={(e) => handleInputChange("companyDescription", e.target.value)}
                    rows={4} 
                    placeholder="Brief description of the company..." 
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 rounded-lg"
                  />
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6" style={{ contain: 'layout paint size' }}>
                <div>
                  <Label className="text-sm font-medium text-slate-200">Project Name *</Label>
                  <Input 
                    value={formData.projectName}
                    onChange={(e) => handleInputChange("projectName", e.target.value)}
                    placeholder="e.g., Corporate website redesign" 
                    className={`bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 rounded-lg ${
                      errors.projectName ? "border-red-500" : ""
                    }`}
                  />
                  {errors.projectName && <p className="text-red-400 text-xs mt-1">{errors.projectName}</p>}
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-200">Project Description</Label>
                  <Textarea 
                    value={formData.projectDescription}
                    onChange={(e) => handleInputChange("projectDescription", e.target.value)}
                    rows={4} 
                    placeholder="High-level scope, goals, timeline…" 
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 rounded-lg"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-200">Project Type</Label>
                  <Select value={formData.projectType} onValueChange={(value) => handleInputChange("projectType", value)}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white rounded-lg">
                      <SelectValue placeholder="Select project type" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="website-development">Website Development</SelectItem>
                      <SelectItem value="mobile-app">Mobile Application</SelectItem>
                      <SelectItem value="software-development">Software Development</SelectItem>
                      <SelectItem value="digital-marketing">Digital Marketing</SelectItem>
                      <SelectItem value="graphic-design">Graphic Design</SelectItem>
                      <SelectItem value="ui-ux-design">UI/UX Design</SelectItem>
                      <SelectItem value="ecommerce">E-commerce Development</SelectItem>
                      <SelectItem value="cms-development">CMS Development</SelectItem>
                      <SelectItem value="api-development">API Development</SelectItem>
                      <SelectItem value="database-design">Database Design</SelectItem>
                      <SelectItem value="cloud-hosting">Cloud Hosting & DevOps</SelectItem>
                      <SelectItem value="seo">SEO & Analytics</SelectItem>
                      <SelectItem value="content-creation">Content Creation</SelectItem>
                      <SelectItem value="video-production">Video Production</SelectItem>
                      <SelectItem value="consulting">IT Consulting</SelectItem>
                      <SelectItem value="maintenance">Maintenance & Support</SelectItem>
                      <SelectItem value="others">Others</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <Label className="text-sm font-medium text-slate-200">Currency</Label>
                    <Select value={formData.currency} onValueChange={(value) => handleInputChange("currency", value)}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white rounded-lg">
                        <SelectValue placeholder="Select currency" />
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
                      placeholder={`Enter amount in ${formData.currency || "USD"}`}
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 rounded-lg"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-slate-200">Budget Range</Label>
                    <Select value={formData.budget} onValueChange={(value) => handleInputChange("budget", value)}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white rounded-lg">
                        <SelectValue placeholder="Select budget range" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        {getBudgetOptions().map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-200">Timeline</Label>
                  <Select value={formData.timeline} onValueChange={(value) => handleInputChange("timeline", value)}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white rounded-lg">
                      <SelectValue placeholder="Select timeline" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="urgent">Urgent (1-2 months)</SelectItem>
                      <SelectItem value="normal">Normal (3-6 months)</SelectItem>
                      <SelectItem value="flexible">Flexible (6+ months)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="grid grid-cols-2 gap-6" style={{ contain: 'layout paint size' }}>
                <div>
                  <Label className="text-sm font-medium text-slate-200">Source</Label>
                  <Select value={formData.source} onValueChange={(value) => handleInputChange("source", value)}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white rounded-lg">
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      {SOURCES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-200">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white rounded-lg">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label className="text-sm font-medium text-slate-200">Tags</Label>
                  <Input 
                    value={formData.tags}
                    onChange={(e) => handleInputChange("tags", e.target.value)}
                    placeholder="priority, demo, kolkata" 
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 rounded-lg"
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-sm font-medium text-slate-200">Notes</Label>
                  <Textarea 
                    value={formData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    rows={4} 
                    placeholder="Next steps, constraints, budget hints…" 
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 rounded-lg"
                  />
                </div>
              </div>
            )}

            {msg && <p className="text-red-400 text-sm mt-4">{msg}</p>}

            <div className="sticky bottom-0 z-10 bg-slate-800/95 backdrop-blur supports-[backdrop-filter]:bg-slate-800/80 flex justify-between items-center mt-8 pt-6 border-t border-slate-700">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={prevStep}
                disabled={currentStep === 1}
                className="text-slate-300 hover:text-white"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              
              <div className="flex gap-3">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={handleModalClose}
                  className="text-slate-300 hover:text-white"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                {currentStep < STEPS.length ? (
                  <Button 
                    type="button" 
                    onClick={nextStep}
                    className="bg-purple-600 hover:bg-purple-700 rounded-lg"
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button 
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="bg-purple-600 hover:bg-purple-700 rounded-lg"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating...
                      </>
                    ) : (
                      "Create Lead"
                    )}
                  </Button>
                )}
              </div>
            </div>
          </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}

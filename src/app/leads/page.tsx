"use client";

import AppShell from "@/components/app-shell";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/status-badge";
import { SourceBadge } from "@/components/source-badge";
import { AgingBadge } from "@/components/aging-badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Search, Filter, Download, MoreHorizontal, Plus, X, ChevronLeft, ChevronRight, Users, TrendingUp, DollarSign, Calendar, MessageSquare, Check, Edit3, User } from "lucide-react";
import { CommentDialog } from "@/components/comment-dialog";
import { EditLeadModal } from "@/components/edit-lead-modal";
import { useAlertDialog } from "@/components/ui/alert-dialog";
import { useSession } from "next-auth/react";
import { CreateLeadModal } from "@/components/create-lead-modal";
import { useCrmSettings } from "@/hooks/useCrmSettings";

type Lead = {
  id: string;
  // enquiry
  projectName?: string | null;
  projectValue?: number | null;
  projectType?: string | null;
  currency?: string | null;
  // contact
  name: string; email?: string | null; phone?: string | null; designation?: string | null;
  // company
  company?: string | null; website?: string | null;
  // misc
  status: string; source: string; createdAt: string; statusChangedAt?: string;
  // photo
  photo?: string | null;
  // active status
  isActive: boolean;
  // owner information (for admins)
  owner?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
};

// Statuses and sources will now be loaded dynamically from CRM settings
const PROJECT_TYPES = [
  "website-development",
  "mobile-app",
  "software-development",
  "digital-marketing",
  "graphic-design",
  "ui-ux-design",
  "ecommerce",
  "cms-development",
  "api-development",
  "database-design",
  "cloud-hosting",
  "seo",
  "content-creation",
  "video-production",
  "consulting",
  "maintenance",
  "others"
] as const;

const ITEMS_PER_PAGE = 20;

// Editable Status Badge Component
function EditableStatusBadge({ 
  value, 
  leadId, 
  onUpdate, 
  isUpdating,
  leadStatuses 
}: { 
  value: string; 
  leadId: string; 
  onUpdate: (leadId: string, newStatus: string) => void;
  isUpdating: boolean;
  leadStatuses: string[];
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);

  const handleSave = () => {
    if (tempValue !== value) {
      onUpdate(leadId, tempValue);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempValue(value);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <Select value={tempValue} onValueChange={setTempValue}>
          <SelectTrigger className="h-6 px-2 text-xs bg-slate-700 border-slate-600 text-white rounded-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-700 border-slate-600">
            {leadStatuses.map(status => (
              <SelectItem key={status} value={status} className="text-xs">
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleSave}
          disabled={isUpdating}
          className="h-5 w-5 p-0 text-green-400 hover:text-green-300 hover:bg-green-500/20"
        >
          <Check className="w-3 h-3" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCancel}
          disabled={isUpdating}
          className="h-5 w-5 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/20"
        >
          <X className="w-3 h-3" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 group">
      <StatusBadge value={value} />
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setIsEditing(true)}
        disabled={isUpdating}
        className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-300 hover:bg-slate-600/50 transition-all duration-200"
      >
        <Edit3 className="w-3 h-3" />
      </Button>
    </div>
  );
}

// Editable Source Badge Component
function EditableSourceBadge({ 
  value, 
  leadId, 
  onUpdate, 
  isUpdating,
  leadSources 
}: { 
  value: string; 
  leadId: string; 
  onUpdate: (leadId: string, newSource: string) => void;
  isUpdating: boolean;
  leadSources: string[];
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);

  const handleSave = () => {
    if (tempValue !== value) {
      onUpdate(leadId, tempValue);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempValue(value);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <Select value={tempValue} onValueChange={setTempValue}>
          <SelectTrigger className="h-6 px-2 text-xs bg-slate-700 border-slate-600 text-white rounded-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-700 border-slate-600">
            {leadSources.map(source => (
              <SelectItem key={source} value={source} className="text-xs">
                {source}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleSave}
          disabled={isUpdating}
          className="h-5 w-5 p-0 text-green-400 hover:text-green-300 hover:bg-green-500/20"
        >
          <Check className="w-3 h-3" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCancel}
          disabled={isUpdating}
          className="h-5 w-5 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/20"
        >
          <X className="w-3 h-3" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 group">
      <SourceBadge value={value} />
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setIsEditing(true)}
        disabled={isUpdating}
        className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-300 hover:bg-slate-600/50 transition-all duration-200"
      >
        <Edit3 className="w-3 h-3" />
      </Button>
    </div>
  );
}

// Editable Owner Component
function EditableOwner({ 
  owner, 
  leadId, 
  onUpdate, 
  isUpdating 
}: { 
  owner: { id: string; firstName: string; lastName: string; email: string } | null | undefined; 
  leadId: string; 
  onUpdate: (leadId: string, newOwnerId: string) => void;
  isUpdating: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempOwnerId, setTempOwnerId] = useState(owner?.id || "");
  const [users, setUsers] = useState<Array<{ id: string; firstName: string; lastName: string; email: string }>>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // Load users when editing starts
  const loadUsers = async () => {
    if (users.length === 0) {
      setIsLoadingUsers(true);
      try {
        const response = await fetch('/api/users?isActive=true');
        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error('Error loading users:', error);
      } finally {
        setIsLoadingUsers(false);
      }
    }
  };

  const handleSave = () => {
    if (tempOwnerId !== owner?.id) {
      onUpdate(leadId, tempOwnerId);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempOwnerId(owner?.id || "");
    setIsEditing(false);
  };

  const handleEditClick = () => {
    loadUsers();
    setIsEditing(true);
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <Select value={tempOwnerId} onValueChange={setTempOwnerId}>
          <SelectTrigger className="h-6 px-2 text-xs bg-slate-700 border-slate-600 text-white rounded-full min-w-[120px]">
            <SelectValue placeholder={isLoadingUsers ? "Loading..." : "Select user"} />
          </SelectTrigger>
          <SelectContent className="bg-slate-700 border-slate-600">
            {users.map(user => (
              <SelectItem key={user.id} value={user.id} className="text-xs">
                {user.firstName} {user.lastName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleSave}
          disabled={isUpdating || isLoadingUsers}
          className="h-5 w-5 p-0 text-green-400 hover:text-green-300 hover:bg-green-500/20"
        >
          <Check className="w-3 h-3" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCancel}
          disabled={isUpdating || isLoadingUsers}
          className="h-5 w-5 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/20"
        >
          <X className="w-3 h-3" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 group">
      {owner ? (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center">
            <User className="w-3 h-3 text-purple-400" />
          </div>
          <div className="text-sm">
            <div className="font-medium text-white">
              {owner.firstName} {owner.lastName}
            </div>
            <div className="text-xs text-slate-400 truncate" title={owner.email}>
              {owner.email}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-slate-500/20 rounded-full flex items-center justify-center">
            <User className="w-3 h-3 text-slate-400" />
          </div>
          <span className="text-sm text-slate-400">Unassigned</span>
        </div>
      )}
      <Button
        size="sm"
        variant="ghost"
        onClick={handleEditClick}
        disabled={isUpdating}
        className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-300 hover:bg-slate-600/50 transition-all duration-200"
      >
        <Edit3 className="w-3 h-3" />
      </Button>
    </div>
  );
}

// Empty State Component for missing data
function EmptyState({ type = "text" }: { type?: "text" | "badge" }) {
  if (type === "badge") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs text-slate-500 bg-slate-700/30 rounded-md border border-slate-600/30">
        <span className="w-1 h-1 bg-slate-500 rounded-full"></span>
        No data
      </span>
    );
  }
  
  return (
    <span className="text-slate-500 text-xs italic">—</span>
  );
}

// Helper function to format project value
const formatProjectValue = (value: number | null | undefined, currency: string | null | undefined) => {
  if (!value) return "—";
  const symbol = currency === "USD" ? "$" : "₹";
  
  // Split the number into integer and decimal parts
  const parts = value.toString().split('.');
  const integerPart = parts[0];
  const decimalPart = parts[1] || '';
  
  // Add commas only to the integer part
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  
  // Reconstruct the number with proper formatting
  const formatted = decimalPart ? `${formattedInteger}.${decimalPart}` : formattedInteger;
  
  return `${symbol}${formatted}`;
};

// Helper function to format project type
const formatProjectType = (type: string | null | undefined) => {
  return type || "—";
};

// Project Type Badge Component
function ProjectTypeBadge({ value }: { value: string | null | undefined }) {
  if (!value) return <EmptyState type="badge" />;
  
  const v = value.toLowerCase();
  const map: Record<string, string> = {
    "website-development": "bg-blue-500/10 text-blue-300 ring-1 ring-blue-500/20",
    "mobile-app": "bg-purple-500/10 text-purple-300 ring-1 ring-purple-500/20",
    "software-development": "bg-indigo-500/10 text-indigo-300 ring-1 ring-indigo-500/20",
    "digital-marketing": "bg-green-500/10 text-green-300 ring-1 ring-green-500/20",
    "graphic-design": "bg-pink-500/10 text-pink-300 ring-1 ring-pink-500/20",
    "ui-ux-design": "bg-cyan-500/10 text-cyan-300 ring-1 ring-cyan-500/20",
    "ecommerce": "bg-orange-500/10 text-orange-300 ring-1 ring-orange-500/20",
    "cms-development": "bg-teal-500/10 text-teal-300 ring-1 ring-teal-500/20",
    "api-development": "bg-yellow-500/10 text-yellow-300 ring-1 ring-yellow-500/20",
    "database-design": "bg-red-500/10 text-red-300 ring-1 ring-red-500/20",
    "cloud-hosting": "bg-sky-500/10 text-sky-300 ring-1 ring-sky-500/20",
    "seo": "bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/20",
    "content-creation": "bg-violet-500/10 text-violet-300 ring-1 ring-violet-500/20",
    "video-production": "bg-rose-500/10 text-rose-300 ring-1 ring-rose-500/20",
    "consulting": "bg-amber-500/10 text-amber-300 ring-1 ring-amber-500/20",
    "maintenance": "bg-slate-500/10 text-slate-300 ring-1 ring-slate-500/20",
    "others": "bg-gray-500/10 text-gray-300 ring-1 ring-gray-500/20",
  };
  
  const displayText = value.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${map[v] ?? map.others}`} title={displayText}>
      {displayText}
    </span>
  );
}

// Helper function to format total value in INR
const formatTotalValue = (value: number) => {
  // Split the number into integer and decimal parts
  const parts = value.toString().split('.');
  const integerPart = parts[0];
  const decimalPart = parts[1] || '';
  
  // Add commas only to the integer part
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  
  // Reconstruct the number with proper formatting
  const formatted = decimalPart ? `${formattedInteger}.${decimalPart}` : formattedInteger;
  
  return `₹${formatted}`;
};

const handleCommentAdded = () => {
  // Optionally refresh the page or show a success message
  console.log("Comment added successfully");
};

export default function LeadsPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  const { showConfirm, showError, AlertComponent } = useAlertDialog();
  const { settings: crmSettings, loading: settingsLoading } = useCrmSettings();
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [source, setSource] = useState<string>("all");
  // Active filter: 'active' (default), 'inactive', 'all'
  const [activeFilter, setActiveFilter] = useState<'active' | 'inactive' | 'all'>("active");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  
  // Filter dialog state
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterProjectType, setFilterProjectType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterSource, setFilterSource] = useState<string>("all");
  const [filterMinValue, setFilterMinValue] = useState<string>("");
  const [filterMaxValue, setFilterMaxValue] = useState<string>("");
  const [filterCurrency, setFilterCurrency] = useState<string>("all");

  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Comment modal state
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // Inline editing state
  const [updatingLead, setUpdatingLead] = useState<string | null>(null);

  // Edit lead modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingLeadId, setEditingLeadId] = useState<string>("");

  // Create lead modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  async function load() {
    try {
      setIsLoading(true);
      const p = new URLSearchParams();
      if (q) p.set("q", q);
      if (status && status !== "all") p.set("status", status);
      if (source && source !== "all") p.set("source", source);
      if (activeFilter === 'inactive') p.set('isActive', 'false');
      else if (activeFilter === 'all') p.set('isActive', 'all');
      const res = await fetch(`/api/leads?${p.toString()}`, { cache: "no-store" });
      const data = await res.json();
      
      // Data is already sorted by the API (orderBy: { createdAt: "desc" })
      setAllLeads(data);
      setFilteredLeads(data);
      setCurrentPage(1); // Reset to first page when data changes
    } catch (error) {
      console.error("Error loading leads:", error);
      setAllLeads([]);
      setFilteredLeads([]);
    } finally {
      setIsLoading(false);
      setIsInitialLoad(false);
    }
  }
  useEffect(() => { load();   }, [q, status, source, activeFilter]);

  // Handle edit lead
  const handleEditLead = (leadId: string) => {
    setEditingLeadId(leadId);
    setIsEditModalOpen(true);
  };

  // Handle lead updated
  const handleLeadUpdated = () => {
    load(); // Refresh the leads data
  };

  // Handle inline status update
  const handleStatusUpdate = async (leadId: string, newStatus: string) => {
    setUpdatingLead(leadId);
    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        // Update local state
        setAllLeads(prev => prev.map(lead => 
          lead.id === leadId ? { ...lead, status: newStatus } : lead
        ));
        setFilteredLeads(prev => prev.map(lead => 
          lead.id === leadId ? { ...lead, status: newStatus } : lead
        ));
      } else {
        console.error('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setUpdatingLead(null);
    }
  };

  // Handle inline source update
  const handleSourceUpdate = async (leadId: string, newSource: string) => {
    setUpdatingLead(leadId);
    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ source: newSource }),
      });

      if (response.ok) {
        // Update local state
        setAllLeads(prev => prev.map(lead => 
          lead.id === leadId ? { ...lead, source: newSource } : lead
        ));
        setFilteredLeads(prev => prev.map(lead => 
          lead.id === leadId ? { ...lead, source: newSource } : lead
        ));
      } else {
        console.error('Failed to update source');
      }
    } catch (error) {
      console.error('Error updating source:', error);
    } finally {
      setUpdatingLead(null);
    }
  };

  // Handle inline owner update
  const handleOwnerUpdate = async (leadId: string, newOwnerId: string) => {
    setUpdatingLead(leadId);
    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ownerId: newOwnerId }),
      });

      if (response.ok) {
        // Get the updated lead with owner information
        const updatedLeadResponse = await fetch(`/api/leads/${leadId}`);
        if (updatedLeadResponse.ok) {
          const updatedLead = await updatedLeadResponse.json();
          
          // Update local state with the new owner information
          setAllLeads(prev => prev.map(lead => 
            lead.id === leadId ? { ...lead, owner: updatedLead.owner } : lead
          ));
          setFilteredLeads(prev => prev.map(lead => 
            lead.id === leadId ? { ...lead, owner: updatedLead.owner } : lead
          ));
        }
      } else {
        console.error('Failed to update owner');
      }
    } catch (error) {
      console.error('Error updating owner:', error);
    } finally {
      setUpdatingLead(null);
    }
  };

  // Pagination calculations
  const totalPages = Math.ceil((filteredLeads?.length || 0) / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentLeads = Array.isArray(filteredLeads) ? filteredLeads.slice(startIndex, endIndex) : [];

  // Statistics calculations
  const USD_TO_INR_RATE = 83; // Current approximate exchange rate
  
  const totalValue = (Array.isArray(filteredLeads) ? filteredLeads : []).reduce((sum, lead) => {
    // Ensure value is a number
    const value = typeof lead.projectValue === 'number' ? lead.projectValue : parseFloat(lead.projectValue || '0');
    if (isNaN(value) || value === 0) return sum;
    
    // Convert to INR based on currency
    if (lead.currency === "USD") {
      const convertedValue = value * USD_TO_INR_RATE;
      return sum + convertedValue;
    } else {
      // Already in INR or null currency (assume INR)
      return sum + value;
    }
  }, 0);
  
  // Calculate leads this month
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  const leadsThisMonth = (Array.isArray(filteredLeads) ? filteredLeads : []).filter(lead => {
    const leadDate = new Date(lead.createdAt);
    return leadDate.getMonth() === currentMonth && leadDate.getFullYear() === currentYear;
  }).length;
  
  const newLeads = (Array.isArray(filteredLeads) ? filteredLeads : []).filter(lead => lead.status === "NEW").length;
  const qualifiedLeads = (Array.isArray(filteredLeads) ? filteredLeads : []).filter(lead => lead.status === "QUALIFIED").length;
  const wonLeads = (Array.isArray(filteredLeads) ? filteredLeads : []).filter(lead => lead.status === "WON").length;

  // Apply filters
  const applyFilters = () => {
    let filtered = allLeads;

    // Filter by project type
    if (filterProjectType !== "all") {
      filtered = filtered.filter(lead => lead.projectType === filterProjectType);
    }

    // Filter by status
    if (filterStatus !== "all") {
      filtered = filtered.filter(lead => lead.status === filterStatus);
    }

    // Filter by source
    if (filterSource !== "all") {
      filtered = filtered.filter(lead => lead.source === filterSource);
    }

    // Filter by project value range
    if (filterMinValue || filterMaxValue) {
      filtered = filtered.filter(lead => {
        if (!lead.projectValue) return false;
        
        const value = lead.projectValue;
        const min = filterMinValue ? parseFloat(filterMinValue) : 0;
        const max = filterMaxValue ? parseFloat(filterMaxValue) : Infinity;
        
        return value >= min && value <= max;
      });
    }

    // Filter by currency
    if (filterCurrency !== "all") {
      filtered = filtered.filter(lead => lead.currency === filterCurrency);
    }

    // Sort filtered results by creation date (newest first) to maintain consistent ordering
    const sortedFiltered = filtered.sort((a: Lead, b: Lead) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    setFilteredLeads(sortedFiltered);
    setCurrentPage(1); // Reset to first page
    setIsFilterOpen(false);
  };

  // Clear all filters
  const clearFilters = () => {
    setFilterProjectType("all");
    setFilterStatus("all");
    setFilterSource("all");
    setFilterMinValue("");
    setFilterMaxValue("");
    setFilterCurrency("all");
    setFilteredLeads(allLeads);
    setCurrentPage(1);
  };

  // Show loading state while CRM settings are being fetched
  if (settingsLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading CRM configuration...</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      {/* Enhanced Header with Stats */}
      <div className="mb-8">
                 <div className="flex items-center justify-between mb-4">
           <div>
             <h1 className="text-2xl font-bold text-white mb-1">Lead Master</h1>
             <p className="text-slate-400 text-sm">Manage and track your lead pipeline</p>
           </div>
             <Button 
               onClick={() => setIsCreateModalOpen(true)}
               className="bg-purple-600 hover:bg-purple-700 rounded-xl px-4 py-2 text-sm font-semibold shadow-lg hover:shadow-purple-500/25 transition-all duration-200">
               <Plus className="w-4 h-4 mr-2" />
               Create Lead
             </Button>
        </div>

                                   {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
           <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl p-4 border border-slate-600/50 hover:border-slate-500/50 transition-all duration-200">
             <div className="flex items-center justify-between">
               <div>
                 <p className="text-slate-400 text-xs font-medium">Total Leads</p>
                 <p className="text-xl font-bold text-white mt-1">{filteredLeads.length}</p>
               </div>
               <div className="w-10 h-10 min-w-[2.5rem] min-h-[2.5rem] bg-blue-500/20 rounded-lg flex items-center justify-center">
                 <Users className="w-5 h-5 text-blue-400" />
               </div>
             </div>
           </div>

                     <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl p-4 border border-slate-600/50 hover:border-slate-500/50 transition-all duration-200">
             <div className="flex items-center justify-between">
               <div>
                 <p className="text-slate-400 text-xs font-medium">Leads This Month</p>
                 <p className="text-xl font-bold text-white mt-1">{leadsThisMonth}</p>
               </div>
               <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                 <Calendar className="w-5 h-5 text-green-400" />
               </div>
             </div>
           </div>

                     <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl p-4 border border-slate-600/50 hover:border-slate-500/50 transition-all duration-200">
             <div className="flex items-center justify-between">
               <div>
                 <p className="text-slate-400 text-xs font-medium">Qualified</p>
                 <p className="text-xl font-bold text-white mt-1">{qualifiedLeads}</p>
               </div>
               <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                 <TrendingUp className="w-5 h-5 text-purple-400" />
               </div>
             </div>
           </div>

                                           <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl p-4 border border-slate-600/50 hover:border-slate-500/50 transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-xs font-medium">Leads Won</p>
                  <p className="text-xl font-bold text-white mt-1">{wonLeads}</p>
                </div>
                <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                  <Check className="w-5 h-5 text-yellow-400" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl p-4 border border-slate-600/50 hover:border-slate-500/50 transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-xs font-medium">Total Value</p>
                  <p className="text-xl font-bold text-white mt-1">{formatTotalValue(totalValue)}</p>
                </div>
                <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-orange-400" />
                </div>
              </div>
            </div>
         </div>
      </div>

             {/* Enhanced Search and Filter Bar */}
       <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl p-6 mb-6 border border-slate-600/50 shadow-xl">
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1fr,200px,200px,220px,auto] gap-4 items-start">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Search</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400/80 w-5 h-5 pointer-events-none z-10" />
              <Input
                placeholder="Search leads by name, email, company, or project..."
                value={q} 
                onChange={(e)=>setQ(e.target.value)}
                className="pl-12 pr-4 py-3 bg-slate-700/70 border-slate-600/70 text-white placeholder:text-slate-400/80 rounded-lg text-sm focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 focus:bg-slate-700 focus:shadow-lg focus:shadow-purple-500/10 hover:bg-slate-700/80 hover:border-slate-600/90 transition-all duration-200 w-full h-auto shadow-inner"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Status</label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white rounded-xl py-2 h-auto">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="all">All Statuses</SelectItem>
                {crmSettings.leadStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Source</label>
            <Select value={source} onValueChange={setSource}>
              <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white rounded-xl py-2 h-auto">
                <SelectValue placeholder="Filter by source" />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="all">All Sources</SelectItem>
                {crmSettings.leadSources.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {/* Active/Inactive/All filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Status Filter</label>
            <div className="flex bg-slate-700/50 border border-slate-600 rounded-xl overflow-hidden">
              {(["active","inactive","all"] as const).map(key => (
                <button
                  key={key}
                  onClick={() => setActiveFilter(key)}
                  className={`px-3 py-2 text-sm transition-colors ${
                    activeFilter === key
                      ? 'bg-purple-600 text-white'
                      : 'text-slate-300 hover:text-white hover:bg-slate-600/50'
                  }`}
                >
                  {key === 'active' ? 'Active' : key === 'inactive' ? 'Inactive' : 'All'}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Actions</label>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white rounded-xl px-4 py-2 text-sm transition-all duration-200"
                onClick={() => setIsFilterOpen(true)}
              >
                <Filter className="w-4 h-4 mr-2" />
                Advanced Filters
              </Button>
              <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white rounded-xl px-4 py-2 text-sm transition-all duration-200">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </div>

             {/* Enhanced Table */}
       <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl overflow-hidden border border-slate-600/50 shadow-xl">
         <div className="overflow-x-hidden">
           <table className="w-full table-auto text-sm">
             <thead className="bg-slate-700/20 rounded-t-xl">
               <tr>
                 <th className="text-left px-4 py-4 font-semibold text-slate-300 text-xs uppercase tracking-wider border-b border-slate-600/20">Lead Code</th>
                 <th className="text-left px-4 py-4 font-semibold text-slate-300 text-xs uppercase tracking-wider border-b border-slate-600/20">Photo</th>
                 <th className="text-left px-4 py-4 font-semibold text-slate-300 text-xs uppercase tracking-wider border-b border-slate-600/20">Contact Info</th>
                 <th className="text-left px-4 py-4 font-semibold text-slate-300 text-xs uppercase tracking-wider border-b border-slate-600/20">Company</th>
                 <th className="text-left px-4 py-4 font-semibold text-slate-300 text-xs uppercase tracking-wider border-b border-slate-600/20">Project Details</th>
                 <th className="text-left px-4 py-4 font-semibold text-slate-300 text-xs uppercase tracking-wider border-b border-slate-600/20">Status & Source</th>
                 {isAdmin && (
                   <th className="text-left px-4 py-4 font-semibold text-slate-300 text-xs uppercase tracking-wider border-b border-slate-600/20 w-[200px]">Assigned To</th>
                 )}
                 <th className="text-left px-4 py-4 font-semibold text-slate-300 text-xs uppercase tracking-wider border-b border-slate-600/20 w-[120px]">Created</th>
                 <th className="text-left px-4 py-4 font-semibold text-slate-300 text-xs uppercase tracking-wider border-b border-slate-600/20 w-[170px]">Actions</th>
               </tr>
             </thead>
            <tbody>
              {isLoading ? (
                // Show skeleton loading while data is being fetched
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={`skeleton-${index}`} className="animate-pulse border-t border-slate-600/20">
                    <td className="px-4 py-5">
                      <div className="h-4 bg-slate-700/60 rounded w-20"></div>
                    </td>
                    <td className="px-4 py-5">
                      <div className="w-10 h-10 bg-slate-700/60 rounded-full"></div>
                    </td>
                    <td className="px-4 py-5">
                      <div className="space-y-2">
                        <div className="h-4 bg-slate-700/60 rounded w-32"></div>
                        <div className="h-3 bg-slate-700/60 rounded w-24"></div>
                        <div className="h-3 bg-slate-700/60 rounded w-20"></div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-2">
                        <div className="h-4 bg-slate-700 rounded w-28"></div>
                        <div className="h-3 bg-slate-700 rounded w-20"></div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-2">
                        <div className="h-4 bg-slate-700 rounded w-36"></div>
                        <div className="h-3 bg-slate-700 rounded w-24"></div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-2">
                        <div className="h-6 bg-slate-700 rounded-full w-20"></div>
                        <div className="h-4 bg-slate-700 rounded w-16"></div>
                      </div>
                    </td>
                    {isAdmin && (
                      <td className="p-4">
                        <div className="h-4 bg-slate-700 rounded w-24"></div>
                      </td>
                    )}
                    <td className="p-4">
                      <div className="h-4 bg-slate-700 rounded w-20"></div>
                    </td>
                    <td className="p-4">
                      <div className="flex space-x-2">
                        <div className="h-8 bg-slate-700 rounded w-16"></div>
                        <div className="h-8 bg-slate-700 rounded w-16"></div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : currentLeads.length ? currentLeads.map((l, index) => (
                 <tr key={l.id} className="border-t border-slate-600/20 hover:bg-slate-700/10 transition-all duration-200 group">
                   <td className="px-4 py-5">
                     <div className="font-semibold text-purple-400 text-sm tracking-wide">
                       {(() => {
                         // Find the lead's position in the original unsorted list (by creation time)
                         // Since allLeads is sorted by newest first, we need to reverse the index
                         const leadIndex = allLeads.findIndex(lead => lead.id === l.id);
                         const leadNumber = allLeads.length - leadIndex;
                         return `LEAD${String(leadNumber).padStart(3, "0")}`;
                       })()}
                     </div>
                   </td>
                   <td className="px-4 py-5">
                     {l.photo ? (
                       <img 
                         src={l.photo} 
                         alt={`${l.name}'s photo`} 
                         className="w-10 h-10 rounded-full object-cover border-2 border-slate-600/70 shadow-sm"
                       />
                     ) : (
                       <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-700 rounded-full flex items-center justify-center text-slate-200 text-sm font-semibold shadow-sm">
                         {l.name.charAt(0).toUpperCase()}
                       </div>
                     )}
                   </td>
                   <td className="px-4 py-5 max-w-[260px]">
                     <div className="space-y-1.5">
                       <div className="font-semibold text-white text-sm truncate" title={l.name}>
                         {l.name}
                       </div>
                       <div className="text-slate-400 text-xs truncate" title={l.email || "No email"}>
                         {l.email || "No email"}
                       </div>
                       <div className="text-slate-400 text-xs truncate" title={l.phone || "No phone"}>
                         {l.phone || "No phone"}
                       </div>
                       {l.designation && (
                         <div className="text-xs text-slate-400 bg-slate-700/40 px-2 py-1 rounded-full inline-block truncate max-w-full" title={l.designation}>
                           {l.designation}
                         </div>
                       )}
                     </div>
                   </td>
                   <td className="px-4 py-5 max-w-[200px]">
                     <div className="space-y-1.5">
                       <div className="font-semibold text-white text-sm truncate" title={l.company || "No company"}>
                         {l.company || "No company"}
                       </div>
                       {l.website && (
                         <div className="text-slate-400 text-xs hover:text-purple-400 transition-colors truncate" title={l.website}>
                           <a href={l.website} target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:underline">
                             {l.website}
                           </a>
                         </div>
                       )}
                     </div>
                   </td>
                   <td className="px-4 py-5 max-w-[260px]">
                     <div className="space-y-1.5">
                       <div className="font-semibold text-white text-sm truncate" title={l.projectName || "No project name"}>
                         {l.projectName || "No project name"}
                       </div>
                       <div className="text-sm font-semibold text-emerald-400">
                         {formatProjectValue(l.projectValue, l.currency)}
                       </div>
                       <div className="text-slate-400 text-xs truncate" title={formatProjectType(l.projectType)}>
                        <ProjectTypeBadge value={l.projectType} />
                       </div>
                     </div>
                   </td>
                   <td className="px-4 py-5">
                     <div className="flex flex-col gap-2">
                       <EditableStatusBadge 
                         value={l.status} 
                         leadId={l.id} 
                         onUpdate={handleStatusUpdate} 
                         isUpdating={updatingLead === l.id}
                         leadStatuses={crmSettings.leadStatuses}
                       />
                       {l.statusChangedAt && (
                         <AgingBadge 
                           statusChangedAt={l.statusChangedAt}
                           className="self-start"
                         />
                       )}
                       <EditableSourceBadge 
                         value={l.source} 
                         leadId={l.id} 
                         onUpdate={handleSourceUpdate} 
                         isUpdating={updatingLead === l.id}
                         leadSources={crmSettings.leadSources}
                       />
                     </div>
                   </td>
                   {isAdmin && (
                     <td className="px-4 py-5 w-[170px] max-w-[170px] overflow-hidden">
                       <EditableOwner
                         owner={l.owner}
                         leadId={l.id}
                         onUpdate={handleOwnerUpdate}
                         isUpdating={updatingLead === l.id}
                       />
                     </td>
                   )}
                   <td className="px-4 py-5 w-[120px] whitespace-nowrap">
                     <div className="flex items-center text-slate-400 text-xs">
                       <Calendar className="w-3 h-3 mr-1.5 text-slate-500" />
                       <span className="font-medium">
                         {new Date(l.createdAt).toLocaleDateString("en-US", {
                           year: "numeric",
                           month: "short",
                           day: "numeric"
                         })}
                       </span>
                     </div>
                   </td>
                   <td className="px-4 py-5">
                     <div className="flex items-center gap-1.5 flex-wrap max-w-[170px]">
                       <Button
                         variant="ghost"
                         size="sm"
                         onClick={() => {
                           setSelectedLead(l);
                           setCommentDialogOpen(true);
                         }}
                         className="h-8 w-8 p-0 text-slate-400 hover:text-purple-400 hover:bg-purple-500/10 rounded-md transition-all duration-200"
                         title="Comments"
                       >
                         <MessageSquare className="w-4 h-4" />
                       </Button>
                       <Button
                         variant="ghost"
                         size="sm"
                         onClick={() => handleEditLead(l.id)}
                         className="h-8 w-8 p-0 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-md transition-all duration-200"
                         title="Edit Lead"
                       >
                         <Edit3 className="w-4 h-4" />
                       </Button>
                       {/* Toggle active/inactive (all users) */}
                       <Button
                         variant="ghost"
                         size="sm"
                         onClick={() => {
                           showConfirm(
                             l.isActive ? 'Deactivate Lead' : 'Activate Lead',
                             l.isActive ? 'Are you sure you want to deactivate this lead? You can activate it later.' : 'Activate this lead?',
                             async () => {
                               try {
                                 const res = await fetch(`/api/leads/${l.id}`, {
                                   method: 'PUT',
                                   headers: { 'Content-Type': 'application/json' },
                                   body: JSON.stringify({ isActive: !l.isActive })
                                 });
                                 if (res.ok) {
                                   load();
                                 } else {
                                   showError('Action failed', 'Could not update lead status.');
                                 }
                               } catch (e) {
                                 showError('Network error', 'Failed to reach server.');
                               }
                             },
                             l.isActive ? 'Deactivate' : 'Activate'
                           );
                         }}
                         className={`h-8 w-8 p-0 text-slate-400 rounded-md transition-all duration-200 ${
                           l.isActive 
                             ? 'hover:text-red-400 hover:bg-red-500/10' 
                             : 'hover:text-green-400 hover:bg-green-500/10'
                         }`}
                         title={l.isActive ? 'Deactivate Lead' : 'Activate Lead'}
                       >
                         {/* power icon style */}
                         <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={l.isActive ? 'text-red-400' : 'text-green-400'}>
                           <path d="M12 2v10"/>
                           <path d="M5.5 7a7 7 0 1 0 13 0"/>
                         </svg>
                       </Button>
                       {/* Delete (admin only) */}
                       {isAdmin && (
                         <Button
                           variant="ghost"
                           size="sm"
                           onClick={() => {
                             showConfirm(
                               'Delete Lead',
                               'This will permanently delete the lead and cannot be undone.',
                               async () => {
                                 try {
                                   const res = await fetch(`/api/leads/${l.id}`, { method: 'DELETE' });
                                   if (res.ok) {
                                     load();
                                   } else {
                                     showError('Delete failed', 'Could not delete the lead.');
                                   }
                                 } catch (e) {
                                   showError('Network error', 'Failed to reach server.');
                                 }
                               },
                               'Delete'
                             );
                           }}
                           className="h-8 w-8 p-0 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-all duration-200"
                           title="Delete Lead"
                         >
                           {/* trash icon */}
                           <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                             <polyline points="3 6 5 6 21 6" />
                             <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                             <path d="M10 11v6" />
                             <path d="M14 11v6" />
                             <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
                           </svg>
                         </Button>
                       )}
                     </div>
                   </td>
                </tr>
              )) : !isLoading && (
                                 <tr>
                   <td className="p-8 text-center text-slate-400" colSpan={isAdmin ? 8 : 7}>
                     <div className="space-y-3">
                       <div className="text-4xl">??</div>
                       <div className="text-lg font-semibold">No leads found</div>
                       <div className="text-slate-500 text-sm">Try adjusting your search or filters</div>
                         <Button 
                           onClick={() => setIsCreateModalOpen(true)}
                           className="bg-purple-600 hover:bg-purple-700 rounded-xl px-4 py-2 mt-3 text-sm">
                           <Plus className="w-4 h-4 mr-2" />
                           Create Your First Lead
                         </Button>
                     </div>
                   </td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>

                 {/* Enhanced Pagination */}
         {filteredLeads.length > 0 && (
           <div className="bg-slate-700/30 px-4 py-3 border-t border-slate-600/30 rounded-b-xl">
             <div className="flex items-center justify-between">
               <div className="text-slate-400 text-xs">
                 Showing {startIndex + 1} to {Math.min(endIndex, filteredLeads.length)} of {filteredLeads.length} leads
               </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white rounded-xl transition-all duration-200"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-10 h-10 rounded-lg transition-all duration-200 ${
                          currentPage === pageNum
                            ? "bg-purple-600 text-white"
                            : "border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                        }`}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white rounded-xl transition-all duration-200"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filter Dialog */}
      <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <DialogContent className="max-w-2xl bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-white">Advanced Filters</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Project Type Filter */}
            <div>
              <Label className="text-sm font-medium text-slate-200">Project Type</Label>
              <Select value={filterProjectType} onValueChange={setFilterProjectType}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white rounded-xl mt-1">
                  <SelectValue placeholder="Select project type" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="all">All Project Types</SelectItem>
                  {PROJECT_TYPES.map(type => (
                    <SelectItem key={type} value={type}>
                      {type.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div>
              <Label className="text-sm font-medium text-slate-200">Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white rounded-xl mt-1">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="all">All Statuses</SelectItem>
                  {crmSettings.leadStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Source Filter */}
            <div>
              <Label className="text-sm font-medium text-slate-200">Source</Label>
              <Select value={filterSource} onValueChange={setFilterSource}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white rounded-xl mt-1">
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="all">All Sources</SelectItem>
                  {crmSettings.leadSources.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Project Value Range */}
            <div>
              <Label className="text-sm font-medium text-slate-200">Project Value Range</Label>
              <div className="grid grid-cols-2 gap-4 mt-1">
                <div>
                  <Label className="text-xs text-slate-400">Minimum Value</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={filterMinValue}
                    onChange={(e) => setFilterMinValue(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 rounded-xl"
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-400">Maximum Value</Label>
                  <Input
                    type="number"
                    placeholder="8"
                    value={filterMaxValue}
                    onChange={(e) => setFilterMaxValue(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 rounded-xl"
                  />
                </div>
              </div>
            </div>

            {/* Currency Filter */}
            <div>
              <Label className="text-sm font-medium text-slate-200">Currency</Label>
              <Select value={filterCurrency} onValueChange={setFilterCurrency}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white rounded-xl mt-1">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="all">All Currencies</SelectItem>
                  <SelectItem value="INR">INR (?)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Filter Actions */}
          <div className="flex justify-between items-center pt-6 border-t border-slate-700 rounded-b-xl">
            <Button 
              variant="ghost" 
              onClick={clearFilters}
              className="text-slate-300 hover:text-white"
            >
              Clear All
            </Button>
            
            <div className="flex gap-3">
              <Button 
                variant="ghost" 
                onClick={() => setIsFilterOpen(false)}
                className="text-slate-300 hover:text-white"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button 
                onClick={applyFilters}
                className="bg-purple-600 hover:bg-purple-700 rounded-xl"
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Comment Components */}
      {selectedLead && (
        <>
          <CommentDialog
            isOpen={commentDialogOpen}
            onClose={() => {
              setCommentDialogOpen(false);
              setSelectedLead(null);
            }}
            leadId={selectedLead.id}
            leadName={selectedLead.name}
          />
          {/* <CommentDialog
            leadId={selectedLead.id}
            isOpen={commentListOpen}
            onClose={() => {
              setCommentListOpen(false);
              setSelectedLead(null);
            }}
          /> */}
        </>
      )}

      {AlertComponent}

      {/* Edit Lead Modal */}
      <EditLeadModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        leadId={editingLeadId}
        onLeadUpdated={handleLeadUpdated}
      />

      {/* Create Lead Modal */}
      <CreateLeadModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onLeadCreated={load}
      />
    </AppShell>
  );
}

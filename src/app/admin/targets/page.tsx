"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Calendar, DollarSign, Target, AlertCircle } from "lucide-react";
import { useAlertDialog } from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/toast-notification";
import { useSession } from "next-auth/react";

type TargetData = {
  id: string;
  amount: string;
  currency: string;
  period: string;
  year: number;
  month?: number | null;
  quarter?: number | null;
  userId?: string | null;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  admin?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  createdAt: string;
  updatedAt: string;
};

type UserOption = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

type TargetForm = {
  amount: string;
  currency: string;
  year: string;
  month: string;
  userId: string;
};

const CURRENCIES = ["INR", "USD"];
// Only monthly targets in rationalized system
const PERIOD_DISPLAY = "MONTHLY";

// Generate years from current year to 10 years in the future
const YEARS = Array.from({ length: 11 }, (_, i) => {
  const year = new Date().getFullYear() + i;
  return { value: year.toString(), label: year.toString() };
});

const MONTHS = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

export default function TargetManagementPage() {
  const { data: session, status } = useSession();
  const [targets, setTargets] = useState<TargetData[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTarget, setEditingTarget] = useState<TargetData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState<TargetForm>({
    amount: "",
    currency: "INR",
    year: new Date().getFullYear().toString(),
    month: (new Date().getMonth() + 1).toString(),
    userId: "",
  });

  // Custom alert and toast hooks
  const { showConfirm, showError, AlertComponent } = useAlertDialog();
  const { showSuccess, showError: showToastError } = useToast();

  const loadTargets = async () => {
    try {
      setIsLoading(true);
      // Only fetch monthly USER targets for the admin interface
      // Company targets are calculated automatically, quarterly/yearly are shown as calculated values
      const response = await fetch("/api/targets?period=MONTHLY&targetType=USER");
      if (response.ok) {
        const data = await response.json();
        console.log("Loaded targets data:", data);
        // Filter out any calculated targets that might still be returned
        const monthlyUserTargets = Array.isArray(data) 
          ? data.filter(target => 
              target.period === "MONTHLY" && 
              target.user && 
              !target.id.includes('company-') && 
              !target.id.includes('quarterly-') && 
              !target.id.includes('yearly-')
            )
          : [];
        setTargets(monthlyUserTargets);
      } else {
        const errorData = await response.json();
        console.error("Failed to load targets:", response.status, errorData);
        setTargets([]);
        showToastError("Failed to load targets", errorData.error || "Unknown error");
      }
    } catch (error) {
      console.error("Error loading targets:", error);
      setTargets([]);
      showToastError("Network Error", "Failed to load targets. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await fetch("/api/users?isActive=true&role=USER");
      if (response.ok) {
        const data = await response.json();
        setUsers(Array.isArray(data) ? data : []);
      } else {
        console.error("Failed to load users:", response.status);
        setUsers([]);
      }
    } catch (error) {
      console.error("Error loading users:", error);
      setUsers([]);
    }
  };

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "ADMIN") {
      // Add a small delay to ensure session is fully established
      const timer = setTimeout(() => {
        loadTargets();
        loadUsers();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [status, session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.amount || !form.year || !form.month || !form.userId) {
      showError("Validation Error", "Please fill in all required fields");
      return;
    }

    try {
      setIsLoading(true);
      const payload = {
        amount: parseFloat(form.amount),
        currency: form.currency,
        year: parseInt(form.year),
        month: parseInt(form.month),
        userId: form.userId,
      };

      const response = await fetch("/api/targets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        await loadTargets();
        handleCloseModal();
        showSuccess(
          editingTarget ? "Target Updated!" : "Target Created!",
          `${form.currency} ${parseFloat(form.amount).toLocaleString()} target has been ${editingTarget ? 'updated' : 'created'} successfully.`
        );
      } else {
        const error = await response.json();
        showToastError("Save Failed", error.error || "Failed to save target");
      }
    } catch (error) {
      console.error("Error saving target:", error);
      showToastError("Network Error", "Failed to save target. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (target: TargetData) => {
    setEditingTarget(target);
    setForm({
      amount: target.amount,
      currency: target.currency,
      year: target.year.toString(),
      month: target.month?.toString() || "",
      userId: target.userId || "",
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (targetId: string, targetName: string) => {
    showConfirm(
      "Delete Target",
      `Are you sure you want to delete the ${targetName} target? This action cannot be undone and will affect your pipeline calculations.`,
      async () => {
        try {
          setIsLoading(true);
          const response = await fetch(`/api/targets?id=${targetId}`, {
            method: "DELETE",
          });

          if (response.ok) {
            await loadTargets();
            showSuccess("Target Deleted", "The target has been successfully removed from your system.");
          } else {
            const error = await response.json();
            showToastError("Delete Failed", error.error || "Failed to delete target");
          }
        } catch (error) {
          console.error("Error deleting target:", error);
          showToastError("Network Error", "Failed to delete target. Please check your connection.");
        } finally {
          setIsLoading(false);
        }
      },
      "Delete Target",
      "Cancel"
    );
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTarget(null);
    setForm({
      amount: "",
      currency: "INR",
      year: new Date().getFullYear().toString(),
      month: (new Date().getMonth() + 1).toString(),
      userId: "",
    });
  };

  const formatCurrency = (amount: string, currency: string) => {
    const value = parseFloat(amount);
    const symbol = currency === "USD" ? "$" : "₹";
    const formatted = value.toLocaleString();
    return `${symbol}${formatted}`;
  };

  const formatPeriodDisplay = (target: TargetData) => {
    // In the rationalized system, all targets are monthly
    const monthName = MONTHS.find(m => m.value === target.month?.toString())?.label;
    return `${monthName} ${target.year}`;
  };

  // Show loading while session is loading
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Check if user is admin
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Monthly Target Management</h2>
          <p className="text-slate-400">Set monthly revenue targets for each user. Quarterly and yearly targets are automatically calculated.</p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-purple-600 hover:bg-purple-700 rounded-lg px-4 py-2 text-sm font-semibold shadow-lg hover:shadow-purple-500/25 transition-all duration-200"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Target
        </Button>
      </div>

      {/* Targets List */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl border border-slate-600/50 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-400">
            <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            Loading targets...
          </div>
        ) : targets.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-white mb-2">No targets found</h3>
            <p className="text-sm">Create your first target to start tracking performance</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700/50">
                <tr>
                  <th className="text-left p-4 font-semibold text-slate-200 text-sm">User</th>
                  <th className="text-left p-4 font-semibold text-slate-200 text-sm">Month & Year</th>
                  <th className="text-left p-4 font-semibold text-slate-200 text-sm">Monthly Target</th>
                  <th className="text-left p-4 font-semibold text-slate-200 text-sm">Quarterly (Calculated)</th>
                  <th className="text-left p-4 font-semibold text-slate-200 text-sm">Yearly (Calculated)</th>
                  <th className="text-left p-4 font-semibold text-slate-200 text-sm">Currency</th>
                  <th className="text-left p-4 font-semibold text-slate-200 text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {targets.map((target) => {
                  const monthlyAmount = parseFloat(target.amount);
                  const quarterlyAmount = monthlyAmount * 3;
                  const yearlyAmount = monthlyAmount * 12;
                  
                  return (
                    <tr key={target.id} className="border-t border-slate-600/30 hover:bg-slate-700/20 transition-colors">
                      <td className="p-4">
                        {target.user ? (
                          <div>
                            <div className="text-sm font-medium text-white">
                              {target.user.firstName} {target.user.lastName}
                            </div>
                            <div className="text-xs text-slate-400">{target.user.email}</div>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-500">User not found</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-slate-300">{formatPeriodDisplay(target)}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-lg font-bold text-emerald-400">{formatCurrency(target.amount, target.currency)}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-slate-300">{formatCurrency(quarterlyAmount.toString(), target.currency)}</span>
                        <div className="text-xs text-slate-500">×3 months</div>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-slate-300">{formatCurrency(yearlyAmount.toString(), target.currency)}</span>
                        <div className="text-xs text-slate-500">×12 months</div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          target.currency === "USD" ? "bg-blue-500/20 text-blue-300" : "bg-green-500/20 text-green-300"
                        }`}>
                          {target.currency}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(target)}
                            className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-600/50"
                            title="Edit target"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(target.id, formatPeriodDisplay(target))}
                            className="h-8 w-8 p-0 text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                            title="Delete target"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Target Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-slate-800 border-slate-600 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {editingTarget ? "Edit Target" : "Add New Target"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-blue-300 text-sm">
                💡 You only set monthly targets. Quarterly (×3) and yearly (×12) targets are automatically calculated.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount" className="text-sm font-medium text-slate-300">
                  Monthly Target Amount *
                </Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="50000"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                  required
                />
              </div>

              <div>
                <Label htmlFor="currency" className="text-sm font-medium text-slate-300">
                  Currency
                </Label>
                <Select value={form.currency} onValueChange={(value) => setForm({ ...form, currency: value })}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    {CURRENCIES.map((currency) => (
                      <SelectItem key={currency} value={currency}>
                        {currency}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="userId" className="text-sm font-medium text-slate-300">
                  Assign to User *
                </Label>
                <Select value={form.userId} onValueChange={(value) => setForm({ ...form, userId: value })}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.firstName} {user.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="year" className="text-sm font-medium text-slate-300">
                  Year *
                </Label>
                <Select value={form.year} onValueChange={(value) => setForm({ ...form, year: value })}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    {YEARS.map((year) => (
                      <SelectItem key={year.value} value={year.value}>
                        {year.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="month" className="text-sm font-medium text-slate-300">
                Month *
              </Label>
              <Select value={form.month} onValueChange={(value) => setForm({ ...form, month: value })}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  {MONTHS.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="bg-slate-700/50 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-slate-300">
                  <strong>About Monthly Targets:</strong> 
                  <ul className="mt-1 space-y-1">
                    <li>• Only monthly targets are set manually by admin</li>
                    <li>• Quarterly targets = Monthly × 3</li>
                    <li>• Yearly targets = Monthly × 12</li>
                    <li>• Company targets are calculated as the sum of all user targets</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={handleCloseModal}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
              >
                {isLoading ? "Saving..." : editingTarget ? "Update Target" : "Create Target"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Custom Alert Dialog */}
      {AlertComponent}
    </div>
  );
}

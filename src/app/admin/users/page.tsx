"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, RefreshCw, Shield, Users, UserCheck, UserX, Key, Copy, Eye, EyeOff } from "lucide-react";
import { useAlertDialog } from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/toast-notification";

type UserData = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  role: "ADMIN" | "USER";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  _count: {
    leads: number;
    comments: number;
    createdUsers?: number;
  };
};

type UserForm = {
  firstName: string;
  lastName: string;
  email: string;
  role: "ADMIN" | "USER";
};

const ROLES = ["ADMIN", "USER"];

export default function UserManagementPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showPassword, setShowPassword] = useState(false);
  const [temporaryPassword, setTemporaryPassword] = useState("");

  const [form, setForm] = useState<UserForm>({
    firstName: "",
    lastName: "",
    email: "",
    role: "USER",
  });

  // Custom alert and toast hooks
  const { showConfirm, showError, showSuccess: showAlertSuccess, AlertComponent } = useAlertDialog();
  const { showSuccess, showError: showToastError, showInfo } = useToast();

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.set("q", searchQuery);
      if (roleFilter !== "all") params.set("role", roleFilter);
      if (statusFilter !== "all") params.set("isActive", statusFilter);

      const response = await fetch(`/api/users?${params.toString()}`);
      const data = await response.json();
      setUsers(data);
      setFilteredUsers(data);
    } catch (error) {
      console.error("Error loading users:", error);
      showToastError("Load Failed", "Failed to load users");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    // Apply filters
    let filtered = users;

    if (searchQuery) {
      filtered = filtered.filter(user =>
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.username.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (roleFilter !== "all") {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(user => user.isActive === (statusFilter === "true"));
    }

    setFilteredUsers(filtered);
  }, [users, searchQuery, roleFilter, statusFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.firstName || !form.lastName || !form.email) {
      showError("Validation Error", "Please fill in all required fields");
      return;
    }

    try {
      setIsLoading(true);
      const payload = {
        ...form,
        // TODO: Get createdBy from session when auth is implemented
      };

      const url = editingUser ? `/api/users/${editingUser.id}` : "/api/users";
      const method = editingUser ? "PATCH" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json();
        await loadUsers();
        handleCloseModal();

        if (result.temporaryPassword) {
          setTemporaryPassword(result.temporaryPassword);
          showAlertSuccess(
            "User Created Successfully!",
            `User ${form.firstName} ${form.lastName} has been created. Make sure to copy the temporary password.`
          );
        } else {
          showSuccess(
            "User Updated!",
            `${form.firstName} ${form.lastName} has been updated successfully.`
          );
        }
      } else {
        const error = await response.json();
        showToastError("Save Failed", error.error || "Failed to save user");
      }
    } catch (error) {
      console.error("Error saving user:", error);
      showToastError("Network Error", "Failed to save user. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (user: UserData) => {
    setEditingUser(user);
    setForm({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (userId: string, userName: string) => {
    showConfirm(
      "Delete User",
      `Are you sure you want to delete ${userName}? This action cannot be undone. Make sure the user has no associated leads or comments.`,
      async () => {
        try {
          setIsLoading(true);
          const response = await fetch(`/api/users/${userId}`, {
            method: "DELETE",
          });

          if (response.ok) {
            await loadUsers();
            showSuccess("User Deleted", "The user has been successfully removed from the system.");
          } else {
            const error = await response.json();
            showToastError("Delete Failed", error.error || "Failed to delete user");
          }
        } catch (error) {
          console.error("Error deleting user:", error);
          showToastError("Network Error", "Failed to delete user. Please check your connection.");
        } finally {
          setIsLoading(false);
        }
      },
      "Delete User",
      "Cancel"
    );
  };

  const handleResetPassword = async (userId: string, userName: string) => {
    showConfirm(
      "Reset Password",
      `Are you sure you want to reset the password for ${userName}? This will generate a new temporary password.`,
      async () => {
        try {
          setIsLoading(true);
          const response = await fetch(`/api/users/${userId}/reset-password`, {
            method: "POST",
          });

          if (response.ok) {
            const result = await response.json();
            setTemporaryPassword(result.temporaryPassword);
            showAlertSuccess(
              "Password Reset",
              `Password has been reset for ${userName}. Make sure to copy the new temporary password.`
            );
          } else {
            const error = await response.json();
            showToastError("Reset Failed", error.error || "Failed to reset password");
          }
        } catch (error) {
          console.error("Error resetting password:", error);
          showToastError("Network Error", "Failed to reset password. Please check your connection.");
        } finally {
          setIsLoading(false);
        }
      },
      "Reset Password",
      "Cancel"
    );
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    setTemporaryPassword("");
    setForm({
      firstName: "",
      lastName: "",
      email: "",
      role: "USER",
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showInfo("Copied!", "Password copied to clipboard");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getRoleIcon = (role: string) => {
    return role === "ADMIN" ? <Shield className="w-4 h-4" /> : <Users className="w-4 h-4" />;
  };

  const getStatusIcon = (isActive: boolean) => {
    return isActive ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">User Management</h1>
          <p className="text-slate-400">Create and manage user accounts for your CRM system</p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl p-6 border border-slate-600/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Total Users</p>
              <p className="text-2xl font-bold text-white">{users.length}</p>
            </div>
            <Users className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl p-6 border border-slate-600/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Active Users</p>
              <p className="text-2xl font-bold text-white">
                {users.filter(u => u.isActive).length}
              </p>
            </div>
            <UserCheck className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl p-6 border border-slate-600/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Administrators</p>
              <p className="text-2xl font-bold text-white">
                {users.filter(u => u.role === "ADMIN").length}
              </p>
            </div>
            <Shield className="w-8 h-8 text-purple-400" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl p-6 border border-slate-600/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Regular Users</p>
              <p className="text-2xl font-bold text-white">
                {users.filter(u => u.role === "USER").length}
              </p>
            </div>
            <Users className="w-8 h-8 text-orange-400" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl p-6 border border-slate-600/50">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="search" className="text-sm font-medium text-slate-300 mb-2 block">
              Search Users
            </Label>
            <Input
              id="search"
              placeholder="Search by name, email, or username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
            />
          </div>

          <div>
            <Label htmlFor="role-filter" className="text-sm font-medium text-slate-300 mb-2 block">
              Role
            </Label>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="all">All Roles</SelectItem>
                {ROLES.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="status-filter" className="text-sm font-medium text-slate-300 mb-2 block">
              Status
            </Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button
              onClick={loadUsers}
              variant="ghost"
              className="w-full bg-slate-600 hover:bg-slate-500 text-white"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl border border-slate-600/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-600/30">
                <th className="text-left p-4 text-sm font-semibold text-slate-300">User</th>
                <th className="text-left p-4 text-sm font-semibold text-slate-300">Contact</th>
                <th className="text-left p-4 text-sm font-semibold text-slate-300">Role</th>
                <th className="text-left p-4 text-sm font-semibold text-slate-300">Status</th>
                <th className="text-left p-4 text-sm font-semibold text-slate-300">Activity</th>
                <th className="text-left p-4 text-sm font-semibold text-slate-300">Created</th>
                <th className="text-left p-4 text-sm font-semibold text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className="border-t border-slate-600/30 hover:bg-slate-700/20 transition-colors"
                >
                  <td className="p-4">
                    <div>
                      <div className="font-semibold text-white">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="text-sm text-slate-400">@{user.username}</div>
                    </div>
                  </td>
                  
                  <td className="p-4">
                    <div className="text-sm text-slate-300">{user.email}</div>
                  </td>
                  
                  <td className="p-4">
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                      user.role === "ADMIN" 
                        ? "bg-purple-500/20 text-purple-300 border border-purple-500/30" 
                        : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                    }`}>
                      {getRoleIcon(user.role)}
                      {user.role}
                    </div>
                  </td>
                  
                  <td className="p-4">
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                      user.isActive 
                        ? "bg-green-500/20 text-green-300 border border-green-500/30" 
                        : "bg-red-500/20 text-red-300 border border-red-500/30"
                    }`}>
                      {getStatusIcon(user.isActive)}
                      {user.isActive ? "Active" : "Inactive"}
                    </div>
                  </td>
                  
                  <td className="p-4">
                    <div className="text-sm text-slate-300">
                      <div>{user._count.leads} leads</div>
                      <div className="text-xs text-slate-400">{user._count.comments} comments</div>
                    </div>
                  </td>
                  
                  <td className="p-4">
                    <div className="text-sm text-slate-400">
                      {formatDate(user.createdAt)}
                    </div>
                  </td>
                  
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(user)}
                        className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-600/50"
                        title="Edit user"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleResetPassword(user.id, `${user.firstName} ${user.lastName}`)}
                        className="h-8 w-8 p-0 text-slate-400 hover:text-orange-400 hover:bg-orange-500/10"
                        title="Reset password"
                      >
                        <Key className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(user.id, `${user.firstName} ${user.lastName}`)}
                        className="h-8 w-8 p-0 text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                        title="Delete user"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-400">No users found</p>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit User Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-slate-800 border-slate-600 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-white">
              {editingUser ? "Edit User" : "Add New User"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName" className="text-sm font-medium text-slate-300">
                  First Name *
                </Label>
                <Input
                  id="firstName"
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                  required
                />
              </div>

              <div>
                <Label htmlFor="lastName" className="text-sm font-medium text-slate-300">
                  Last Name *
                </Label>
                <Input
                  id="lastName"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email" className="text-sm font-medium text-slate-300">
                Email Address *
              </Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                required
              />
            </div>

            <div>
              <Label htmlFor="role" className="text-sm font-medium text-slate-300">
                Role *
              </Label>
              <Select value={form.role} onValueChange={(value) => setForm({ ...form, role: value as "ADMIN" | "USER" })}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  {ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {temporaryPassword && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Key className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-medium text-amber-300">Temporary Password</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-slate-700 rounded px-3 py-2 text-sm font-mono text-white">
                    {showPassword ? temporaryPassword : "••••••••••••"}
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowPassword(!showPassword)}
                    className="h-8 w-8 p-0 text-amber-400 hover:text-amber-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(temporaryPassword)}
                    className="h-8 w-8 p-0 text-amber-400 hover:text-amber-300"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-amber-300 mt-2">
                  Make sure to copy this password and share it securely with the user.
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={handleCloseModal}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white border border-slate-600"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
              >
                {isLoading ? "Saving..." : editingUser ? "Update User" : "Create User"}
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

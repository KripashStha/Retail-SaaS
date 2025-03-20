"use client";

import { useState, useEffect } from "react";
import { MoreVertical, Pencil, Trash2, Plus, Search } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { auth, db } from "@/firebase/dbConfig";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function Employee() {
  const { toast } = useToast();
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentBusiness, setCurrentBusiness] = useState(null);
  const [editForm, setEditForm] = useState({
    id: "",
    role: "",
  });

  // Fetch employees for the current business
  useEffect(() => {
    const fetchEmployeesAndInvitations = async () => {
      try {
        // Get current user's business ID
        const userDoc = await getDocs(
          query(
            collection(db, "Users"),
            where("email", "==", auth.currentUser.email)
          )
        );
        if (userDoc.empty) {
          console.error("No user document found");
          return;
        }

        const businessId = userDoc.docs[0].data().businessId;
        setCurrentBusiness(businessId);

        // Fetch employees and invitations from API using query params
        const response = await fetch(
          `/api/employees?businessId=${businessId}`,
          {
            method: "GET",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch employees");
        }

        const data = await response.json();
        setUsers(data.users);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load employees",
        });
      } finally {
        setLoading(false);
      }
    };

    if (auth.currentUser) {
      fetchEmployeesAndInvitations();
    }
  }, []);

  const handleInviteEmployee = async (employeeData) => {
    try {
      const inviteData = {
        email: employeeData.email,
        role: employeeData.role,
        businessId: currentBusiness,
        status: "pending_invite",
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };

      // First, create the invitation
      const createResponse = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inviteData),
      });

      if (!createResponse.ok) {
        throw new Error("Failed to create invitation");
      }

      const newInvitation = await createResponse.json();

      // Then, send the invitation email
      const emailResponse = await fetch("/api/send-invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: employeeData.email,
          role: employeeData.role,
          token: newInvitation.id, // Use the ID from the created invitation
        }),
      });

      if (!emailResponse.ok) {
        // If email fails, we might want to delete the invitation
        // or mark it as failed in the database
        throw new Error("Failed to send invitation email");
      }

      // Update the UI with the new invitation
      setUsers([...users, newInvitation]);

      toast({
        title: "Success",
        description: "Invitation sent successfully",
      });
    } catch (error) {
      console.error("Error inviting employee:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send invitation",
      });
    }
  };

  const handleDeleteUser = async (id) => {
    try {
      const response = await fetch("/api/employees", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, type: "user" }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete employee");
      }

      setUsers(users.filter((user) => user.id !== id));
      toast({
        title: "Success",
        description: "Employee removed successfully",
      });
    } catch (error) {
      console.error("Error deleting employee:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to remove employee",
      });
    }
  };

  const handleCancelInvitation = async (invitationId) => {
    try {
      const response = await fetch("/api/employees", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: invitationId, type: "invitation" }),
      });

      if (!response.ok) {
        throw new Error("Failed to cancel invitation");
      }

      // Update the UI to reflect the cancellation (removes the user/invitation)
      setUsers(users.filter((user) => user.id !== invitationId));

      toast({
        title: "Success",
        description: "Invitation cancelled successfully",
      });
    } catch (error) {
      console.error("Error cancelling invitation:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to cancel invitation",
      });
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending_invite":
        return <Badge variant="secondary" className="text-red-500 bg-red-50">Pending</Badge>;
      case "active":
        return <Badge variant="success" className="text-green-500 bg-green-50">Accepted</Badge>;
      case "expired":
        return <Badge variant="warning">Expired</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      (user.userName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (user.email?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (user.role?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

  const handleUpdateRole = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/employees", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editForm.id,
          role: editForm.role,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update employee role");
      }

      // Update local state
      setUsers(
        users.map((user) =>
          user.id === editForm.id ? { ...user, role: editForm.role } : user
        )
      );

      toast({
        title: "Success",
        description: "Employee role updated successfully",
      });

      // Reset form and close dialog
      setEditForm({ id: "", role: "" });
    } catch (error) {
      console.error("Error updating employee:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update employee",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 text-white">
              <Plus className="mr-2 h-4 w-4" /> Invite Employees
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
            </DialogHeader>
            <UserForm onSubmit={handleInviteEmployee} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-gray-400 py-28"
                >
                  No employees or pending invitations found.
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.userName}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>{getStatusBadge(user.status)}</TableCell>
                  <TableCell>
                    {user.status === "pending_invite" ? (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleCancelInvitation(user.id)}
                      >
                        Cancel Invitation
                      </Button>
                    ) : (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent align="end" className="w-36 p-2 ">
                          
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  className="w-full flex items-center justify-start"
                                  variant="ghost"
                                  size="sm"
                                >
                                  <Pencil className="h-4 w-4" /> Edit
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Edit Permissions</DialogTitle>
                                  <DialogDescription>
                                    Change employee roles and permissions.
                                  </DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleUpdateRole}>
                                  <div className="space-y-4">
                                    <div>
                                      <Label htmlFor="role">Role</Label>
                                      <Select
                                        value={editForm.role || user.role || ""}
                                        onValueChange={(value) =>
                                          setEditForm((prev) => ({
                                            ...prev,
                                            id: user.id,
                                            role: value,
                                          }))
                                        }
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select a role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="manager">
                                            Manager
                                          </SelectItem>
                                          <SelectItem value="cashier">
                                            Cashier
                                          </SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <DialogFooter>
                                      <Button type="submit">Update Role</Button>
                                    </DialogFooter>
                                  </div>
                                </form>
                              </DialogContent>
                            </Dialog>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  className="w-full flex items-center justify-start text-red-500"
                                  variant="ghost"
                                  size="sm"
                                >
                                  <Trash2 className="h-4 w-4" /> Delete
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Confirm Delete</DialogTitle>
                                  <DialogDescription>
                                    Are you sure you want to remove this
                                    employee? This action cannot be undone.
                                  </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                  <DialogClose asChild>
                                    <Button variant="outline">Cancel</Button>
                                  </DialogClose>
                                  <Button
                                    variant="destructive"
                                    onClick={() => {
                                      handleDeleteUser(user.id);
                                    }}
                                  >
                                    Delete
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                        
                        </PopoverContent>
                      </Popover>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function UserForm({ onSubmit, initialData = {} }) {
  const [formData, setFormData] = useState(initialData);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({});
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          value={formData.email || ""}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, email: e.target.value }))
          }
          required
        />
      </div>
      <div>
        <Label htmlFor="role">Role</Label>
        <Select
          value={formData.role || ""}
          onValueChange={(value) =>
            setFormData((prev) => ({ ...prev, role: value }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="manager">Manager</SelectItem>
            <SelectItem value="cashier">Cashier</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" className="w-full">
        Send Invitation
      </Button>
    </form>
  );
}

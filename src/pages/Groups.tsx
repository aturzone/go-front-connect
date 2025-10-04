import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Users, FolderKanban } from "lucide-react";
import { getGroups, createGroup, updateGroup, deleteGroup, getUsers } from "@/lib/api";
import { getUserAuth, isOwner, isGroupAdmin } from "@/lib/auth";

interface Group {
  id: number;
  name: string;
  admin_id: number;
  created_at?: string;
  updated_at?: string;
}

interface User {
  id: number;
  full_name: string;
  email: string;
  role: string;
}

export default function Groups() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    admin_id: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const auth = getUserAuth();
      // Load groups and users in parallel
      const [groupsRes, usersRes] = await Promise.all([
        getGroups(),
        getUsers()
      ]);
      
      console.log("Groups response:", groupsRes);
      console.log("Users response:", usersRes);
      
      let allGroups = groupsRes.data?.groups || [];
      
      // Filter groups based on role
      if (isGroupAdmin() && auth?.groupId) {
        // Group admin can only see their own group
        allGroups = allGroups.filter((g: Group) => g.id === auth.groupId);
      }
      
      setGroups(allGroups);
      
      // Filter users who can be admins (group_admin or owner)
      const adminUsers = (usersRes.data?.users || []).filter(
        (u: User) => u.role === 'group_admin' || u.role === 'owner'
      );
      setUsers(adminUsers);
      
    } catch (error: any) {
      console.error("Failed to load data:", error);
      toast.error("Failed to load data: " + error.message);
      setGroups([]);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate admin_id is selected
    if (!formData.admin_id) {
      toast.error("Please select a group admin");
      return;
    }

    // Validate name is not empty
    if (!formData.name.trim()) {
      toast.error("Please enter a group name");
      return;
    }
    
    try {
      const payload = {
        name: formData.name.trim(),
        admin_id: parseInt(formData.admin_id),
      };

      console.log("Submitting payload:", payload);
      
      if (editingGroup) {
        await updateGroup(editingGroup.id, payload);
        toast.success("Group updated successfully");
      } else {
        await createGroup(payload);
        toast.success("Group created successfully");
      }
      
      setDialogOpen(false);
      setEditingGroup(null);
      setFormData({ name: "", admin_id: "" });
      loadData(); // Reload data
      
    } catch (error: any) {
      console.error("Operation failed:", error);
      toast.error("Operation failed: " + error.message);
    }
  };

  const handleEdit = (group: Group) => {
    setEditingGroup(group);
    setFormData({
      name: group.name,
      admin_id: group.admin_id.toString(),
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this group? This will remove all users from this group.")) {
      return;
    }

    try {
      await deleteGroup(id);
      toast.success("Group deleted successfully");
      loadData(); // Reload data
    } catch (error: any) {
      console.error("Delete failed:", error);
      toast.error("Delete failed: " + error.message);
    }
  };

  const getAdminName = (adminId: number) => {
    const admin = users.find(u => u.id === adminId);
    return admin ? admin.full_name : `User #${adminId}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Groups</h1>
          <p className="text-muted-foreground">
            Manage user groups and their administrators
          </p>
        </div>
        
        {isOwner() && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingGroup(null);
                setFormData({ name: "", admin_id: "" });
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Group
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingGroup ? "Edit Group" : "Create New Group"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Group Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Engineering Team"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="admin_id">Group Administrator *</Label>
                <select
                  id="admin_id"
                  value={formData.admin_id}
                  onChange={(e) => setFormData({ ...formData, admin_id: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  required
                >
                  <option value="">Select an admin...</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.full_name} ({user.role})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  Only users with 'group_admin' or 'owner' role can be selected
                </p>
              </div>
              
              <Button type="submit" className="w-full">
                {editingGroup ? "Update Group" : "Create Group"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-muted-foreground">
            Loading groups...
          </div>
        </div>
      ) : groups.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="flex flex-col items-center gap-4">
              <FolderKanban className="h-16 w-16 text-muted-foreground/50" />
              <div>
                <p className="text-lg font-medium mb-1">No groups found</p>
                <p className="text-sm text-muted-foreground">
                  Create your first group to organize users
                </p>
              </div>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Group
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <Card 
              key={group.id} 
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(`/groups/${group.id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{group.name}</CardTitle>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">
                        Admin: {getAdminName(group.admin_id)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ID: {group.id}
                      </p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="gap-1">
                    <Users className="h-3 w-3" />
                    Group #{group.id}
                  </Badge>
                  {isOwner() && (
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(group)}
                        title="Edit group"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(group.id)}
                        className="text-destructive hover:text-destructive"
                        title="Delete group"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
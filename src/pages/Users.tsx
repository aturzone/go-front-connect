import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Search, Users as UsersIcon, CheckSquare } from "lucide-react";
import { getUsers, createUser, updateUser, deleteUser, searchUsers, createTask, getGroups } from "@/lib/api";

interface User {
  id: number;
  full_name: string;
  email: string;
  role: string;
  group_ids: number[];
  created_at?: string;
}

interface Group {
  id: number;
  name: string;
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    role: "user",
    password: "",
  });
  const [taskFormData, setTaskFormData] = useState({
    title: "",
    information: "",
    priority: "2",
    deadline: "",
    group_id: "",
  });

  useEffect(() => {
    loadUsers();
    loadGroups();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await getUsers();
      console.log("Users response:", response);
      
      // ✅ FIX: Access nested users array
      setUsers(response.data?.users || []);
    } catch (error: any) {
      console.error("Failed to load users:", error);
      toast.error("Failed to load users: " + error.message);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const loadGroups = async () => {
    try {
      const response = await getGroups();
      setGroups(response.data?.groups || []);
    } catch (error: any) {
      console.error("Failed to load groups:", error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadUsers();
      return;
    }

    try {
      const response = await searchUsers(searchQuery);
      console.log("Search response:", response);
      
      // ✅ FIX: Access nested results array  
      setUsers(response.data?.results || []);
    } catch (error: any) {
      console.error("Search failed:", error);
      toast.error("Search failed: " + error.message);
      setUsers([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.full_name.trim() || !formData.email.trim()) {
      toast.error("Name and email are required");
      return;
    }

    if (!editingUser && !formData.password) {
      toast.error("Password is required for new users");
      return;
    }
    
    try {
      const payload: any = {
        full_name: formData.full_name,
        email: formData.email,
        role: formData.role,
      };

      if (formData.password) {
        payload.password = formData.password;
      }

      if (editingUser) {
        await updateUser(editingUser.id, payload);
        toast.success("User updated successfully");
      } else {
        await createUser(payload);
        toast.success("User created successfully");
      }
      
      setDialogOpen(false);
      setEditingUser(null);
      setFormData({ full_name: "", email: "", role: "user", password: "" });
      loadUsers();
    } catch (error: any) {
      toast.error("Operation failed: " + error.message);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      password: "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this user? This will also delete all their tasks.")) {
      return;
    }

    try {
      await deleteUser(id);
      toast.success("User deleted successfully");
      loadUsers();
    } catch (error: any) {
      toast.error("Delete failed: " + error.message);
    }
  };

  const handleOpenTaskDialog = (user: User) => {
    setSelectedUser(user);
    setTaskFormData({
      title: "",
      information: "",
      priority: "2",
      deadline: "",
      group_id: user.group_ids?.[0]?.toString() || "",
    });
    setTaskDialogOpen(true);
  };

  const handleCreateTask = async () => {
    if (!selectedUser) return;

    if (!taskFormData.title.trim()) {
      toast.error("Task title is required");
      return;
    }

    if (!taskFormData.group_id) {
      toast.error("Please select a group");
      return;
    }

    try {
      await createTask(selectedUser.id, {
        title: taskFormData.title,
        information: taskFormData.information,
        priority: parseInt(taskFormData.priority),
        deadline: taskFormData.deadline || undefined,
        group_id: parseInt(taskFormData.group_id),
      });

      toast.success(`Task created for ${selectedUser.full_name}`);
      setTaskDialogOpen(false);
      setSelectedUser(null);
    } catch (error: any) {
      console.error("Failed to create task:", error);
      toast.error("Failed to create task: " + error.message);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "owner":
        return "destructive";
      case "group_admin":
        return "default";
      default:
        return "secondary";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Users</h1>
          <p className="text-muted-foreground">
            Manage system users and their roles
          </p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingUser(null);
              setFormData({ full_name: "", email: "", role: "user", password: "" });
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingUser ? "Edit User" : "Create New User"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="John Doe"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <select
                  id="role"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  required
                >
                  <option value="user">User</option>
                  <option value="group_admin">Group Admin</option>
                  <option value="owner">Owner</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">
                  Password {editingUser ? "(leave empty to keep current)" : "*"}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter password"
                  required={!editingUser}
                />
              </div>
              
              <Button type="submit" className="w-full">
                {editingUser ? "Update User" : "Create User"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <Input
              placeholder="Search users by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button onClick={handleSearch} variant="secondary">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
            {searchQuery && (
              <Button onClick={() => { setSearchQuery(""); loadUsers(); }} variant="outline">
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-muted-foreground">
            Loading users...
          </div>
        </div>
      ) : users.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="flex flex-col items-center gap-4">
              <UsersIcon className="h-16 w-16 text-muted-foreground/50" />
              <div>
                <p className="text-lg font-medium mb-1">No users found</p>
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? "Try a different search term" : "Create your first user to get started"}
                </p>
              </div>
              {!searchQuery && (
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First User
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Users ({users.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Groups</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.id}</TableCell>
                    <TableCell>{user.full_name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeColor(user.role)}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {user.group_ids?.length || 0} groups
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenTaskDialog(user)}
                          title="Create task for user"
                        >
                          <CheckSquare className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(user)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(user.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Create Task Dialog */}
      <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Create Task for {selectedUser?.full_name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="task-title">Title *</Label>
              <Input
                id="task-title"
                value={taskFormData.title}
                onChange={(e) => setTaskFormData({ ...taskFormData, title: e.target.value })}
                placeholder="Task title"
              />
            </div>
            
            <div>
              <Label htmlFor="task-information">Description</Label>
              <textarea
                id="task-information"
                value={taskFormData.information}
                onChange={(e) => setTaskFormData({ ...taskFormData, information: e.target.value })}
                placeholder="Task description"
                rows={3}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            
            <div>
              <Label htmlFor="task-priority">Priority</Label>
              <select
                id="task-priority"
                value={taskFormData.priority}
                onChange={(e) => setTaskFormData({ ...taskFormData, priority: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="1">High (1)</option>
                <option value="2">Medium (2)</option>
                <option value="3">Low (3)</option>
              </select>
            </div>
            
            <div>
              <Label htmlFor="task-group">Group *</Label>
              <select
                id="task-group"
                value={taskFormData.group_id}
                onChange={(e) => setTaskFormData({ ...taskFormData, group_id: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                required
              >
                <option value="">Select a group</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id.toString()}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <Label htmlFor="task-deadline">Deadline</Label>
              <Input
                id="task-deadline"
                type="date"
                value={taskFormData.deadline}
                onChange={(e) => setTaskFormData({ ...taskFormData, deadline: e.target.value })}
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setTaskDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTask}>Create Task</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
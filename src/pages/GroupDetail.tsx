import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { ArrowLeft, Users, FolderKanban, UserCheck } from "lucide-react";
import { getGroup, getUsers } from "@/lib/api";
import { isOwner, isGroupAdmin } from "@/lib/auth";

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
  group_id?: number;
  created_at?: string;
}

export default function GroupDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [group, setGroup] = useState<Group | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [admin, setAdmin] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadGroupDetails();
    }
  }, [id]);

  const loadGroupDetails = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      // Load group and all users in parallel
      const [groupRes, usersRes] = await Promise.all([
        getGroup(parseInt(id)),
        getUsers()
      ]);

      const groupData = groupRes.data?.group;
      if (!groupData) {
        toast.error("Group not found");
        navigate("/groups");
        return;
      }

      setGroup(groupData);

      // Get all users
      const allUsers = usersRes.data?.users || [];
      
      // Filter users belonging to this group
      const groupUsers = allUsers.filter((u: User) => u.group_id === parseInt(id));
      setUsers(groupUsers);

      // Find the admin
      const adminUser = allUsers.find((u: User) => u.id === groupData.admin_id);
      setAdmin(adminUser || null);

    } catch (error: any) {
      console.error("Failed to load group details:", error);
      toast.error("Failed to load group details: " + error.message);
      navigate("/groups");
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "owner":
        return <Badge variant="destructive">Owner</Badge>;
      case "group_admin":
        return <Badge variant="default">Group Admin</Badge>;
      default:
        return <Badge variant="secondary">User</Badge>;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading group details...</div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="text-center py-16">
        <p className="text-lg text-muted-foreground">Group not found</p>
        <Button onClick={() => navigate("/groups")} className="mt-4">
          Back to Groups
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate("/groups")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-2">{group.name}</h1>
          <p className="text-muted-foreground">Group ID: {group.id}</p>
        </div>
      </div>

      {/* Group Info */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Group ID</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{group.id}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administrator</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold truncate">
              {admin?.full_name || `User #${group.admin_id}`}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admin Details */}
      {admin && (
        <Card>
          <CardHeader>
            <CardTitle>Group Administrator</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Name:</span>
                <span className="font-medium">{admin.full_name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Email:</span>
                <span className="font-medium">{admin.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Role:</span>
                {getRoleBadge(admin.role)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">User ID:</span>
                <Badge variant="outline">#{admin.id}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Group Members */}
      <Card>
        <CardHeader>
          <CardTitle>Group Members ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-lg font-medium mb-1">No members yet</p>
              <p className="text-sm text-muted-foreground">
                This group doesn't have any members assigned
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Badge variant="outline">#{user.id}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{user.full_name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(user.created_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Group Metadata</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Created At:</span>
              <span className="font-medium">{formatDate(group.created_at)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Last Updated:</span>
              <span className="font-medium">{formatDate(group.updated_at)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

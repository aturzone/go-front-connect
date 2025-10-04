import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Server, Lock, Save, Shield } from "lucide-react";
import { getApiConfig, saveApiConfig, healthCheck } from "@/lib/api";
import { getUserAuth, saveUserAuth, UserRole } from "@/lib/auth";

export default function Settings() {
  const navigate = useNavigate();
  const [baseUrl, setBaseUrl] = useState("");
  const [ownerPassword, setOwnerPassword] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [testing, setTesting] = useState(false);
  const [role, setRole] = useState<UserRole>("owner");
  const [userId, setUserId] = useState("");
  const [groupId, setGroupId] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const config = getApiConfig();
    if (config) {
      setBaseUrl(config.baseUrl);
      setOwnerPassword(config.ownerPassword || "");
      setUserPassword(config.userPassword || "");
    }
    
    const auth = getUserAuth();
    if (auth) {
      setRole(auth.role);
      setUserId(auth.userId?.toString() || "");
      setGroupId(auth.groupId?.toString() || "");
      setEmail(auth.email || "");
    }
  }, []);

  const handleTestConnection = async () => {
    if (!baseUrl) {
      toast.error("Please enter API Base URL");
      return;
    }

    setTesting(true);
    try {
      // Temporarily save config for testing
      saveApiConfig({ baseUrl, ownerPassword, userPassword });
      await healthCheck();
      toast.success("Connection successful!");
    } catch (error: any) {
      toast.error("Connection failed: " + error.message);
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    if (!baseUrl) {
      toast.error("Please enter API Base URL");
      return;
    }

    // Validate role-specific requirements
    if (role === 'owner' && !ownerPassword) {
      toast.error("Owner password is required for owner role");
      return;
    }
    if (role === 'user') {
      if (!userId) {
        toast.error("User ID is required for user role");
        return;
      }
      if (!userPassword) {
        toast.error("User password is required for user role");
        return;
      }
    }
    if (role === 'group-admin') {
      if (!groupId) {
        toast.error("Group ID is required for group-admin role");
        return;
      }
      if (!userPassword) {
        toast.error("Password is required for group-admin role");
        return;
      }
    }

    // Prevent privilege confusion: owner and user passwords must not be identical
    if (ownerPassword && userPassword && ownerPassword === userPassword) {
      toast.error("Owner and user passwords must be different");
      return;
    }

    saveApiConfig({ baseUrl, ownerPassword, userPassword });
    saveUserAuth({
      role,
      userId: userId ? parseInt(userId) : undefined,
      groupId: groupId ? parseInt(groupId) : undefined,
      email: email || undefined,
    });
    
    toast.success("Settings saved successfully! Redirecting...");
    setTimeout(() => {
      window.location.href = "/";
    }, 1000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Configure your GASK API connection settings
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>API Configuration</CardTitle>
          <CardDescription>
            Enter the IP address, port, and authentication details for your GASK API server
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="baseUrl" className="flex items-center gap-2">
              <Server className="h-4 w-4" />
              API Base URL
            </Label>
            <Input
              id="baseUrl"
              placeholder="http://localhost:8080"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Example: http://192.168.1.100:8080 or http://localhost:8080
            </p>
          </div>

          {role === 'owner' && (
            <div className="space-y-2">
              <Label htmlFor="ownerPassword" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Owner Password
              </Label>
              <Input
                id="ownerPassword"
                type="password"
                placeholder="Enter owner password"
                value={ownerPassword}
                onChange={(e) => setOwnerPassword(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                This is the owner password for full system access
              </p>
            </div>
          )}

          {(role === 'group-admin' || role === 'user') && (
            <div className="space-y-2">
              <Label htmlFor="userPassword" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                {role === 'group-admin' ? 'Group Admin Password' : 'User Password'}
              </Label>
              <Input
                id="userPassword"
                type="password"
                placeholder={role === 'group-admin' ? 'Enter your group admin password' : 'Enter your user password'}
                value={userPassword}
                onChange={(e) => setUserPassword(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {role === 'group-admin' 
                  ? 'Your password as a group administrator'
                  : 'Your password for accessing your tasks'}
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleTestConnection}
              disabled={testing || !baseUrl}
            >
              {testing ? "Testing..." : "Test Connection"}
            </Button>
            <Button
              onClick={handleSave}
              disabled={!baseUrl || (role === 'owner' ? !ownerPassword : !userPassword)}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              Save Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            User Role Configuration
          </CardTitle>
          <CardDescription>
            Configure your role and credentials based on your access level in the system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
              <SelectTrigger id="role">
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="owner">Owner - Full Access</SelectItem>
                <SelectItem value="group-admin">Group Admin - Group Management</SelectItem>
                <SelectItem value="user">User - Personal Tasks</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {role === 'owner' && "Full access to all features and data. Requires owner password."}
              {role === 'group-admin' && "Access to manage a specific group and its tasks. Requires group ID and your password."}
              {role === 'user' && "Access to manage your own tasks. Requires user ID and your password."}
            </p>
          </div>

          {role === 'user' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="userId">User ID</Label>
                <Input
                  id="userId"
                  type="number"
                  placeholder="Enter your user ID"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Your user ID from the system
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email (Optional)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </>
          )}

          {role === 'group-admin' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="groupId">Group ID</Label>
                <Input
                  id="groupId"
                  type="number"
                  placeholder="Enter your group ID"
                  value={groupId}
                  onChange={(e) => setGroupId(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  The group ID you manage
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="userId">Your User ID (Optional)</Label>
                <Input
                  id="userId"
                  type="number"
                  placeholder="Enter your user ID"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

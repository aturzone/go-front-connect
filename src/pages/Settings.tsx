import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Server, Lock, Save } from "lucide-react";
import { getApiConfig, saveApiConfig, healthCheck } from "@/lib/api";

export default function Settings() {
  const navigate = useNavigate();
  const [baseUrl, setBaseUrl] = useState("");
  const [ownerPassword, setOwnerPassword] = useState("");
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    const config = getApiConfig();
    if (config) {
      setBaseUrl(config.baseUrl);
      setOwnerPassword(config.ownerPassword);
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
      saveApiConfig({ baseUrl, ownerPassword });
      await healthCheck();
      toast.success("Connection successful!");
    } catch (error: any) {
      toast.error("Connection failed: " + error.message);
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    if (!baseUrl || !ownerPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    saveApiConfig({ baseUrl, ownerPassword });
    toast.success("Settings saved successfully!");
    navigate("/");
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
              This is the X-Owner-Password used for API authentication
            </p>
          </div>

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
              disabled={!baseUrl || !ownerPassword}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              Save Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

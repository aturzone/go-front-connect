import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { RefreshCw, Database, ArrowUpCircle, ArrowDownCircle, BarChart3 } from "lucide-react";
import { adminSync, getAdminStatus, getAdminStats } from "@/lib/api";

export default function Admin() {
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [status, setStatus] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statusData, statsData] = await Promise.all([
        getAdminStatus().catch(() => ({ data: null })),
        getAdminStats().catch(() => ({ data: null })),
      ]);
      setStatus(statusData.data);
      setStats(statsData.data);
    } catch (error: any) {
      console.error("Failed to load admin data:", error);
      toast.error("Failed to load admin data: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async (action: 'force' | 'restore' | 'backup') => {
    setSyncing(true);
    try {
      await adminSync(action);
      toast.success(`Sync ${action} completed successfully`);
      loadData();
    } catch (error: any) {
      toast.error(`Sync failed: ${error.message}`);
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse text-muted-foreground">Loading admin panel...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>
        <p className="text-muted-foreground">
          System administration and synchronization controls
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <RefreshCw className="h-5 w-5 text-primary" />
              Force Sync
            </CardTitle>
            <CardDescription>
              Immediately sync Redis data to PostgreSQL
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => handleSync('force')}
              disabled={syncing}
              className="w-full"
            >
              {syncing ? "Syncing..." : "Force Sync Now"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ArrowDownCircle className="h-5 w-5 text-success" />
              Restore
            </CardTitle>
            <CardDescription>
              Restore Redis data from PostgreSQL
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => handleSync('restore')}
              disabled={syncing}
              variant="outline"
              className="w-full"
            >
              {syncing ? "Restoring..." : "Restore from DB"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ArrowUpCircle className="h-5 w-5 text-warning" />
              Backup
            </CardTitle>
            <CardDescription>
              Emergency backup to PostgreSQL
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => handleSync('backup')}
              disabled={syncing}
              variant="outline"
              className="w-full"
            >
              {syncing ? "Backing up..." : "Emergency Backup"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {status && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Last Sync</p>
                <p className="font-medium">{status.last_sync || "Never"}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground mb-1">Sync Interval</p>
                <p className="font-medium">
                  {status.configuration?.sync_interval || "N/A"}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Environment</p>
                <Badge>{status.configuration?.environment || "Unknown"}</Badge>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">API Port</p>
                <p className="font-medium">
                  {status.configuration?.api_port || "N/A"}
                </p>
              </div>
            </div>

            {status.redis && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Redis Connection</p>
                <div className="bg-muted p-3 rounded-md">
                  <p className="text-sm font-mono">{JSON.stringify(status.redis, null, 2)}</p>
                </div>
              </div>
            )}

            {status.postgres && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">PostgreSQL Connection</p>
                <div className="bg-muted p-3 rounded-md">
                  <p className="text-sm font-mono">{JSON.stringify(status.postgres, null, 2)}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Database Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-3">Redis Cache</h3>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="bg-muted p-3 rounded-md">
                    <p className="text-sm text-muted-foreground">Users</p>
                    <p className="text-2xl font-bold">{stats.redis?.users || 0}</p>
                  </div>
                  <div className="bg-muted p-3 rounded-md">
                    <p className="text-sm text-muted-foreground">Groups</p>
                    <p className="text-2xl font-bold">{stats.redis?.groups || 0}</p>
                  </div>
                  <div className="bg-muted p-3 rounded-md">
                    <p className="text-sm text-muted-foreground">Tasks</p>
                    <p className="text-2xl font-bold">{stats.redis?.tasks || 0}</p>
                  </div>
                </div>
              </div>

              {stats.postgresql && (
                <div>
                  <h3 className="font-semibold mb-3">PostgreSQL Database</h3>
                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="bg-muted p-3 rounded-md">
                      <p className="text-sm text-muted-foreground">Users</p>
                      <p className="text-2xl font-bold">{stats.postgresql.users || 0}</p>
                    </div>
                    <div className="bg-muted p-3 rounded-md">
                      <p className="text-sm text-muted-foreground">Groups</p>
                      <p className="text-2xl font-bold">{stats.postgresql.groups || 0}</p>
                    </div>
                    <div className="bg-muted p-3 rounded-md">
                      <p className="text-sm text-muted-foreground">Tasks</p>
                      <p className="text-2xl font-bold">{stats.postgresql.tasks || 0}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

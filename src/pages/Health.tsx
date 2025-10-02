import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Activity, CheckCircle2, XCircle, AlertCircle, RefreshCw } from "lucide-react";
import { healthCheck } from "@/lib/api";

export default function Health() {
  const [loading, setLoading] = useState(false);
  const [health, setHealth] = useState<any>(null);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    setLoading(true);
    try {
      const response = await healthCheck();
      setHealth(response);
      setLastCheck(new Date());
      
      if (response.status === "healthy") {
        toast.success("System is healthy");
      } else if (response.status === "degraded") {
        toast.warning("System is degraded");
      } else {
        toast.error("System is unhealthy");
      }
    } catch (error: any) {
      toast.error("Health check failed: " + error.message);
      setHealth({ status: "unhealthy", error: error.message });
      setLastCheck(new Date());
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle2 className="h-8 w-8 text-success" />;
      case "degraded":
        return <AlertCircle className="h-8 w-8 text-warning" />;
      default:
        return <XCircle className="h-8 w-8 text-destructive" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "healthy":
        return <Badge className="bg-success">Healthy</Badge>;
      case "degraded":
        return <Badge className="bg-warning">Degraded</Badge>;
      default:
        return <Badge variant="destructive">Unhealthy</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Health Check</h1>
          <p className="text-muted-foreground">
            Monitor system health and connectivity
          </p>
        </div>
        <Button onClick={checkHealth} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Activity className="h-6 w-6 text-primary" />
              <CardTitle>System Status</CardTitle>
            </div>
            {health && getStatusBadge(health.status)}
          </div>
          <CardDescription>
            {lastCheck && `Last checked: ${lastCheck.toLocaleString()}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && !health ? (
            <div className="flex flex-col items-center justify-center py-12">
              <RefreshCw className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Checking system health...</p>
            </div>
          ) : health ? (
            <div className="space-y-6">
              <div className="flex flex-col items-center justify-center py-8">
                {getStatusIcon(health.status)}
                <h3 className="text-2xl font-bold mt-4 mb-2">
                  System is {health.status}
                </h3>
                {health.timestamp && (
                  <p className="text-sm text-muted-foreground">
                    {new Date(health.timestamp).toLocaleString()}
                  </p>
                )}
              </div>

              {health.error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                  <p className="text-sm text-destructive font-medium">Error Details:</p>
                  <p className="text-sm text-destructive/80 mt-1">{health.error}</p>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-3">
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Redis</p>
                  <div className="flex items-center gap-2">
                    {health.status !== "unhealthy" ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-success" />
                        <span className="font-medium">Connected</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-destructive" />
                        <span className="font-medium">Disconnected</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">PostgreSQL</p>
                  <div className="flex items-center gap-2">
                    {health.status !== "unhealthy" ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-success" />
                        <span className="font-medium">Connected</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-destructive" />
                        <span className="font-medium">Disconnected</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Sync Service</p>
                  <div className="flex items-center gap-2">
                    {health.status === "healthy" ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-success" />
                        <span className="font-medium">Running</span>
                      </>
                    ) : health.status === "degraded" ? (
                      <>
                        <AlertCircle className="h-4 w-4 text-warning" />
                        <span className="font-medium">Degraded</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-destructive" />
                        <span className="font-medium">Stopped</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              Click refresh to check system health
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

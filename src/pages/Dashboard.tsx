import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, FolderKanban, CheckSquare, Activity, Settings } from "lucide-react";
import { isApiConfigured, getUsers, getGroups, getTaskStats, getAdminStatus } from "@/lib/api";
import { toast } from "sonner";

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    users: 0,
    groups: 0,
    tasks: 0,
    completedTasks: 0,
  });
  const [systemStatus, setSystemStatus] = useState<any>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    if (!isApiConfigured()) {
      navigate("/settings");
      return;
    }

    setLoading(true);
    try {
      const [usersData, groupsData, taskStatsData, statusData] = await Promise.all([
        getUsers().catch(() => ({ data: [] })),
        getGroups().catch(() => ({ data: [] })),
        getTaskStats().catch(() => ({ data: { total: 0, completed: 0 } })),
        getAdminStatus().catch(() => null),
      ]);

      setStats({
        users: usersData?.data?.length || 0,
        groups: groupsData?.data?.length || 0,
        tasks: taskStatsData?.data?.total || 0,
        completedTasks: taskStatsData?.data?.completed || 0,
      });

      if (statusData?.data) {
        setSystemStatus(statusData.data);
      }
    } catch (error: any) {
      console.error("Dashboard data load error:", error);
      toast.error("Failed to load dashboard data: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Users",
      value: stats.users,
      icon: Users,
      color: "text-primary",
      link: "/users",
    },
    {
      title: "Groups",
      value: stats.groups,
      icon: FolderKanban,
      color: "text-accent",
      link: "/groups",
    },
    {
      title: "Total Tasks",
      value: stats.tasks,
      icon: CheckSquare,
      color: "text-success",
      link: "/tasks",
    },
    {
      title: "Completed Tasks",
      value: stats.completedTasks,
      icon: Activity,
      color: "text-warning",
      link: "/tasks",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to GASK Task Manager
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate("/settings")}>
          <Settings className="h-4 w-4 mr-2" />
          Configure API
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <Card
            key={card.title}
            className="cursor-pointer transition-all hover:shadow-lg hover:scale-105"
            onClick={() => navigate(card.link)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {systemStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-success" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Last Sync</p>
                <p className="font-medium">{systemStatus.last_sync || "Never"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sync Interval</p>
                <p className="font-medium">
                  {systemStatus.configuration?.sync_interval || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Environment</p>
                <p className="font-medium">
                  {systemStatus.configuration?.environment || "Unknown"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">API Port</p>
                <p className="font-medium">
                  {systemStatus.configuration?.api_port || "N/A"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

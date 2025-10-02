import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, FolderKanban, CheckSquare, Activity, Settings, TrendingUp } from "lucide-react";
import { isApiConfigured, getUsers, getGroups, getTaskStats, getAdminStatus, getUserTasks } from "@/lib/api";
import { toast } from "sonner";
import { getUserAuth, isOwner, isGroupAdmin, isUser } from "@/lib/auth";

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
      const auth = getUserAuth();
      
      if (isOwner()) {
        // Owner sees everything
        const [usersData, groupsData, taskStatsData, statusData] = await Promise.all([
          getUsers().catch(() => ({ data: { users: [] } })),
          getGroups().catch(() => ({ data: { groups: [] } })),
          getTaskStats().catch(() => ({ data: { total_tasks: 0, completed_tasks: 0 } })),
          getAdminStatus().catch(() => ({ data: null })),
        ]);

        setStats({
          users: usersData?.data?.users?.length || 0,
          groups: groupsData?.data?.groups?.length || 0,
          tasks: taskStatsData?.data?.total_tasks || 0,
          completedTasks: taskStatsData?.data?.completed_tasks || 0,
        });

        if (statusData?.data) {
          setSystemStatus(statusData.data);
        }
      } else if (isGroupAdmin() && auth?.groupId) {
        // Group admin sees their group data
        const [usersData, groupsData] = await Promise.all([
          getUsers().catch(() => ({ data: { users: [] } })),
          getGroups().catch(() => ({ data: { groups: [] } })),
        ]);

        const groupUsers = usersData?.data?.users?.filter((u: any) => 
          u.group_ids?.includes(auth.groupId)
        ) || [];
        
        const myGroup = groupsData?.data?.groups?.find((g: any) => g.id === auth.groupId);

        setStats({
          users: groupUsers.length,
          groups: myGroup ? 1 : 0,
          tasks: 0, // Will be calculated from group tasks
          completedTasks: 0,
        });
      } else if (isUser() && auth?.userId) {
        // Regular user sees only their tasks
        const tasksData = await getUserTasks(auth.userId).catch(() => ({ data: { tasks: [] } }));
        const userTasks = tasksData?.data?.tasks || [];
        
        setStats({
          users: 1,
          groups: 0,
          tasks: userTasks.length,
          completedTasks: userTasks.filter((t: any) => t.status).length,
        });
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
      color: "text-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-950",
      link: "/users",
    },
    {
      title: "Groups",
      value: stats.groups,
      icon: FolderKanban,
      color: "text-purple-500",
      bgColor: "bg-purple-50 dark:bg-purple-950",
      link: "/groups",
    },
    {
      title: "Total Tasks",
      value: stats.tasks,
      icon: CheckSquare,
      color: "text-green-500",
      bgColor: "bg-green-50 dark:bg-green-950",
      link: "/tasks",
    },
    {
      title: "Completed",
      value: stats.completedTasks,
      icon: Activity,
      color: "text-orange-500",
      bgColor: "bg-orange-50 dark:bg-orange-950",
      link: "/tasks",
    },
  ];

  const completionRate = stats.tasks > 0 
    ? ((stats.completedTasks / stats.tasks) * 100).toFixed(1)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to GASK Task Manager - Overview of your system
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate("/settings")}>
          <Settings className="h-4 w-4 mr-2" />
          Configure API
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card
              key={card.title}
              className="cursor-pointer transition-all hover:shadow-lg hover:scale-105"
              onClick={() => navigate(card.link)}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <div className={`${card.bgColor} p-2 rounded-lg`}>
                  <Icon className={`h-5 w-5 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Click to view details
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Completion Rate Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Task Completion Rate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="text-5xl font-bold text-primary">{completionRate}%</div>
            <div className="flex-1">
              <div className="h-4 bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {stats.completedTasks} of {stats.tasks} tasks completed
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Status - Owner only */}
      {isOwner() && systemStatus && (
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Redis</p>
                <p className="text-lg font-semibold">
                  {systemStatus.redis?.status || 'Connected'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">PostgreSQL</p>
                <p className="text-lg font-semibold">
                  {systemStatus.postgres?.status || 'Connected'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Last Sync</p>
                <p className="text-lg font-semibold">
                  {systemStatus.last_sync 
                    ? new Date(systemStatus.last_sync).toLocaleString()
                    : 'Never'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-4">
          {isOwner() && (
            <>
              <Button onClick={() => navigate("/users")} variant="outline" className="w-full">
                <Users className="h-4 w-4 mr-2" />
                Manage Users
              </Button>
              <Button onClick={() => navigate("/groups")} variant="outline" className="w-full">
                <FolderKanban className="h-4 w-4 mr-2" />
                Manage Groups
              </Button>
              <Button onClick={() => navigate("/tasks")} variant="outline" className="w-full">
                <CheckSquare className="h-4 w-4 mr-2" />
                View Tasks
              </Button>
              <Button onClick={() => navigate("/admin")} variant="outline" className="w-full">
                <Activity className="h-4 w-4 mr-2" />
                Admin Panel
              </Button>
            </>
          )}
          {isGroupAdmin() && (
            <>
              <Button onClick={() => navigate("/users")} variant="outline" className="w-full">
                <Users className="h-4 w-4 mr-2" />
                Group Users
              </Button>
              <Button onClick={() => navigate("/groups")} variant="outline" className="w-full">
                <FolderKanban className="h-4 w-4 mr-2" />
                My Group
              </Button>
              <Button onClick={() => navigate("/tasks")} variant="outline" className="w-full">
                <CheckSquare className="h-4 w-4 mr-2" />
                Group Tasks
              </Button>
            </>
          )}
          {isUser() && (
            <Button onClick={() => navigate("/my-tasks")} variant="outline" className="w-full">
              <CheckSquare className="h-4 w-4 mr-2" />
              My Tasks
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
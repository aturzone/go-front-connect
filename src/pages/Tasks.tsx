import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Search, Filter, BarChart3, CheckSquare, Plus } from "lucide-react";
import { searchTasks, getTaskStats, getTasksWithFilters, updateTask, createTask, getUsers } from "@/lib/api";
import { getUserAuth, isOwner, isGroupAdmin, isUser } from "@/lib/auth";

interface Task {
  id: number;
  title: string;
  information?: string;
  status: boolean;
  priority: number;
  deadline?: string;
  user_id: number;
  group_id: number;
  created_at?: string;
  updated_at?: string;
}

interface User {
  id: number;
  full_name: string;
  email: string;
  group_id?: number;
}

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [stats, setStats] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    information: "",
    priority: "2",
    deadline: "",
    user_id: "",
  });

  useEffect(() => {
    loadStats();
    loadTasks();
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await getUsers();
      setUsers(response.data?.users || []);
    } catch (error: any) {
      console.error("Failed to load users:", error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await getTaskStats();
      console.log("Task stats response:", response);
      
      // ✅ FIX: Access nested data correctly
      setStats(response.data || null);
    } catch (error: any) {
      console.error("Failed to load stats:", error);
      // Silently fail for stats
      setStats(null);
    }
  };

  const loadTasks = async () => {
    setLoading(true);
    try {
      const auth = getUserAuth();
      const filters: any = {};
      
      // Map frontend filter values to backend values
      if (filterStatus !== "all") {
        filters.status = filterStatus === "completed" ? "completed" : "pending";
      }
      
      if (filterPriority !== "all") {
        // Priority: 1=high, 2=medium, 3=low in backend
        const priorityMap: any = { "1": 1, "2": 2, "3": 3 };
        filters.priority = priorityMap[filterPriority] || filterPriority;
      }

      console.log("Loading tasks with filters:", filters);
      
      const response = await getTasksWithFilters(filters);
      console.log("Tasks filter response:", response);
      
      let allTasks = response.data?.tasks || [];
      
      // Filter tasks based on role
      if (isGroupAdmin() && auth?.groupId) {
        // Group admin can only see tasks from their group
        allTasks = allTasks.filter((task: Task) => task.group_id === auth.groupId);
      } else if (isUser() && auth?.userId) {
        // Regular user can only see own tasks
        allTasks = allTasks.filter((task: Task) => task.user_id === auth.userId);
      }
      
      setTasks(allTasks);
      
    } catch (error: any) {
      console.error("Failed to load tasks:", error);
      toast.error("Failed to load tasks: " + error.message);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadTasks();
      return;
    }

    setLoading(true);
    try {
      const response = await searchTasks(searchQuery);
      console.log("Search response:", response);
      
      // ✅ FIX: Backend returns array of SearchTask objects with nested Task
      const searchResults = response.data?.results || [];
      const extractedTasks = searchResults.map((result: any) => result.task || result);
      
      setTasks(extractedTasks);
      
    } catch (error: any) {
      console.error("Search failed:", error);
      toast.error("Search failed: " + error.message);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    loadTasks();
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    loadTasks();
  };

  const getStatusBadge = (status: boolean) => {
    return status ? (
      <Badge variant="default" className="bg-green-500">Completed</Badge>
    ) : (
      <Badge variant="secondary">Pending</Badge>
    );
  };

  const getPriorityBadge = (priority: number) => {
    switch (priority) {
      case 1:
        return <Badge variant="destructive">High</Badge>;
      case 2:
        return <Badge variant="default">Medium</Badge>;
      case 3:
        return <Badge variant="secondary">Low</Badge>;
      default:
        return <Badge variant="outline">Priority {priority}</Badge>;
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

  const handleToggleTaskStatus = async (task: Task) => {
    try {
      await updateTask(task.user_id, task.id, {
        status: !task.status
      });
      
      // Update local state
      setTasks(tasks.map(t => 
        t.id === task.id ? { ...t, status: !t.status } : t
      ));
      
      toast.success(task.status ? "Task marked as pending" : "Task completed!");
      
      // Reload stats
      loadStats();
    } catch (error: any) {
      console.error("Failed to update task:", error);
      toast.error("Failed to update task: " + error.message);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.user_id) {
      toast.error("Please select a user");
      return;
    }

    if (!formData.title.trim()) {
      toast.error("Please enter a task title");
      return;
    }

    try {
      const payload = {
        title: formData.title.trim(),
        information: formData.information.trim() || undefined,
        priority: parseInt(formData.priority),
        deadline: formData.deadline || undefined,
        status: false,
      };

      await createTask(parseInt(formData.user_id), payload);
      toast.success("Task created successfully");
      
      setDialogOpen(false);
      setFormData({
        title: "",
        information: "",
        priority: "2",
        deadline: "",
        user_id: "",
      });
      
      loadTasks();
      loadStats();
      
    } catch (error: any) {
      console.error("Failed to create task:", error);
      toast.error("Failed to create task: " + error.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Tasks</h1>
          <p className="text-muted-foreground">Browse and search all tasks in the system</p>
        </div>
        
        {(isOwner() || isGroupAdmin()) && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setFormData({
                  title: "",
                  information: "",
                  priority: "2",
                  deadline: "",
                  user_id: "",
                });
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Create Task
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateTask} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="user_id">Assign To *</Label>
                  <Select
                    value={formData.user_id}
                    onValueChange={(value) => setFormData({ ...formData, user_id: value })}
                  >
                    <SelectTrigger id="user_id">
                      <SelectValue placeholder="Select a user..." />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.full_name} (ID: {user.id})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="title">Task Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Complete project documentation"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="information">Description</Label>
                  <Textarea
                    id="information"
                    value={formData.information}
                    onChange={(e) => setFormData({ ...formData, information: e.target.value })}
                    placeholder="Additional details about the task..."
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority *</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData({ ...formData, priority: value })}
                  >
                    <SelectTrigger id="priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">High (1)</SelectItem>
                      <SelectItem value="2">Medium (2)</SelectItem>
                      <SelectItem value="3">Low (3)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="deadline">Deadline</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  />
                </div>
                
                <Button type="submit" className="w-full">
                  Create Task
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_tasks || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckSquare className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">
                {stats.completed_tasks || 0}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <BarChart3 className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">
                {stats.pending_tasks || 0}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <BarChart3 className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {stats.completion_rate ? `${stats.completion_rate.toFixed(1)}%` : "0%"}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          {/* Search Bar */}
          <div className="flex gap-2">
            <Input
              placeholder="Search tasks by title or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} variant="secondary">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
            {searchQuery && (
              <Button onClick={handleClearSearch} variant="outline">
                Clear
              </Button>
            )}
          </div>
          
          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="1">High (1)</SelectItem>
                <SelectItem value="2">Medium (2)</SelectItem>
                <SelectItem value="3">Low (3)</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={handleFilter} variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Apply Filters
            </Button>
            
            {(filterStatus !== "all" || filterPriority !== "all") && (
              <Button 
                onClick={() => {
                  setFilterStatus("all");
                  setFilterPriority("all");
                  loadTasks();
                }} 
                variant="ghost"
              >
                Reset Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tasks Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Tasks {tasks.length > 0 && `(${tasks.length})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-pulse text-muted-foreground">
                Loading tasks...
              </div>
            </div>
          ) : tasks.length === 0 ? (
            <div className="p-8 text-center">
              <CheckSquare className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-lg font-medium mb-1">No tasks found</p>
              <p className="text-sm text-muted-foreground">
                {searchQuery || filterStatus !== "all" || filterPriority !== "all"
                  ? "Try adjusting your search or filters"
                  : "No tasks available in the system"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead className="w-[60px]">ID</TableHead>
                    <TableHead className="min-w-[200px]">Title</TableHead>
                    <TableHead className="min-w-[150px]">Information</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Deadline</TableHead>
                    <TableHead>User ID</TableHead>
                    <TableHead>Group ID</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell>
                        <Checkbox
                          checked={task.status}
                          onCheckedChange={() => handleToggleTaskStatus(task)}
                          aria-label="Toggle task completion"
                        />
                      </TableCell>
                      <TableCell className="font-medium">{task.id}</TableCell>
                      <TableCell className="font-medium">{task.title}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                        {task.information || "—"}
                      </TableCell>
                      <TableCell>{getStatusBadge(task.status)}</TableCell>
                      <TableCell>{getPriorityBadge(task.priority)}</TableCell>
                      <TableCell className="text-sm">
                        {formatDate(task.deadline)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">User #{task.user_id}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">Group #{task.group_id}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(task.created_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Footer */}
      {tasks.length > 0 && (
        <Card>
          <CardContent className="py-3">
            <p className="text-sm text-muted-foreground text-center">
              Showing {tasks.length} task{tasks.length !== 1 ? "s" : ""}
              {searchQuery && ` matching "${searchQuery}"`}
              {(filterStatus !== "all" || filterPriority !== "all") && " with applied filters"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
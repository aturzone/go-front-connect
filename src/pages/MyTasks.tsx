import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, CheckSquare, Trash2, Edit } from "lucide-react";
import { getUserTasks, createTask, updateTask, deleteTask, getGroups } from "@/lib/api";

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

interface Group {
  id: number;
  name: string;
}

export default function MyTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  
  // Form state for creating/editing tasks
  const [formData, setFormData] = useState({
    title: "",
    information: "",
    priority: "2",
    deadline: "",
    group_id: "",
  });

  // Get current user ID from localStorage (you should implement proper auth)
  const getCurrentUserId = () => {
    // TODO: Implement proper user authentication
    // For now, return a placeholder
    return 1;
  };

  useEffect(() => {
    loadTasks();
    loadGroups();
  }, []);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const userId = getCurrentUserId();
      const response = await getUserTasks(userId);
      setTasks(response.data?.tasks || []);
    } catch (error: any) {
      console.error("Failed to load tasks:", error);
      toast.error("Failed to load tasks: " + error.message);
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

  const handleCreate = async () => {
    if (!formData.title.trim()) {
      toast.error("Task title is required");
      return;
    }

    if (!formData.group_id) {
      toast.error("Please select a group");
      return;
    }

    try {
      const userId = getCurrentUserId();
      await createTask(userId, {
        title: formData.title,
        information: formData.information,
        priority: parseInt(formData.priority),
        deadline: formData.deadline || undefined,
        group_id: parseInt(formData.group_id),
      });

      toast.success("Task created successfully");
      setIsCreateOpen(false);
      resetForm();
      loadTasks();
    } catch (error: any) {
      console.error("Failed to create task:", error);
      toast.error("Failed to create task: " + error.message);
    }
  };

  const handleEdit = async () => {
    if (!selectedTask) return;

    if (!formData.title.trim()) {
      toast.error("Task title is required");
      return;
    }

    try {
      const userId = getCurrentUserId();
      await updateTask(userId, selectedTask.id, {
        title: formData.title,
        information: formData.information,
        priority: parseInt(formData.priority),
        deadline: formData.deadline || undefined,
        status: selectedTask.status,
      });

      toast.success("Task updated successfully");
      setIsEditOpen(false);
      setSelectedTask(null);
      resetForm();
      loadTasks();
    } catch (error: any) {
      console.error("Failed to update task:", error);
      toast.error("Failed to update task: " + error.message);
    }
  };

  const handleToggleStatus = async (task: Task) => {
    try {
      const userId = getCurrentUserId();
      await updateTask(userId, task.id, {
        ...task,
        status: !task.status,
      });

      toast.success(task.status ? "Task marked as pending" : "Task completed!");
      loadTasks();
    } catch (error: any) {
      console.error("Failed to toggle task status:", error);
      toast.error("Failed to update task: " + error.message);
    }
  };

  const handleDelete = async (taskId: number) => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    try {
      const userId = getCurrentUserId();
      await deleteTask(userId, taskId);
      toast.success("Task deleted successfully");
      loadTasks();
    } catch (error: any) {
      console.error("Failed to delete task:", error);
      toast.error("Failed to delete task: " + error.message);
    }
  };

  const openEditDialog = (task: Task) => {
    setSelectedTask(task);
    setFormData({
      title: task.title,
      information: task.information || "",
      priority: task.priority.toString(),
      deadline: task.deadline ? task.deadline.split("T")[0] : "",
      group_id: task.group_id.toString(),
    });
    setIsEditOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      information: "",
      priority: "2",
      deadline: "",
      group_id: "",
    });
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Tasks</h1>
          <p className="text-muted-foreground">Manage your personal tasks</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              New Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Task title"
                />
              </div>
              
              <div>
                <Label htmlFor="information">Description</Label>
                <Textarea
                  id="information"
                  value={formData.information}
                  onChange={(e) => setFormData({ ...formData, information: e.target.value })}
                  placeholder="Task description"
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">High (1)</SelectItem>
                    <SelectItem value="2">Medium (2)</SelectItem>
                    <SelectItem value="3">Low (3)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="group">Group *</Label>
                <Select
                  value={formData.group_id}
                  onValueChange={(value) => setFormData({ ...formData, group_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a group" />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((group) => (
                      <SelectItem key={group.id} value={group.id.toString()}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="deadline">Deadline</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate}>Create Task</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Task title"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-information">Description</Label>
              <Textarea
                id="edit-information"
                value={formData.information}
                onChange={(e) => setFormData({ ...formData, information: e.target.value })}
                placeholder="Task description"
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor="edit-priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">High (1)</SelectItem>
                  <SelectItem value="2">Medium (2)</SelectItem>
                  <SelectItem value="3">Low (3)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="edit-deadline">Deadline</Label>
              <Input
                id="edit-deadline"
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit}>Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tasks Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Your Tasks {tasks.length > 0 && `(${tasks.length})`}
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
              <p className="text-lg font-medium mb-1">No tasks yet</p>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first task to get started
              </p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Task
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">ID</TableHead>
                    <TableHead className="min-w-[200px]">Title</TableHead>
                    <TableHead className="min-w-[150px]">Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Deadline</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell className="font-medium">{task.id}</TableCell>
                      <TableCell className="font-medium">{task.title}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                        {task.information || "—"}
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => handleToggleStatus(task)}
                          className="cursor-pointer hover:opacity-80 transition-opacity"
                        >
                          {getStatusBadge(task.status)}
                        </button>
                      </TableCell>
                      <TableCell>{getPriorityBadge(task.priority)}</TableCell>
                      <TableCell className="text-sm">
                        {formatDate(task.deadline)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(task)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(task.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

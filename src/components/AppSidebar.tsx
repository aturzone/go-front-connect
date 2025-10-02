import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  CheckSquare,
  ClipboardList,
  Settings,
  ShieldCheck,
  Activity,
  Bug,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { getUserAuth, UserRole } from "@/lib/auth";

interface MenuItem {
  title: string;
  url: string;
  icon: any;
  roles: UserRole[];
}

const mainItems: MenuItem[] = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard, roles: ['owner', 'group-admin', 'user'] },
  { title: "Users", url: "/users", icon: Users, roles: ['owner'] },
  { title: "Groups", url: "/groups", icon: FolderKanban, roles: ['owner', 'group-admin'] },
  { title: "All Tasks", url: "/tasks", icon: CheckSquare, roles: ['owner'] },
  { title: "My Tasks", url: "/my-tasks", icon: ClipboardList, roles: ['owner', 'group-admin', 'user'] },
];

const adminItems: MenuItem[] = [
  { title: "Admin Panel", url: "/admin", icon: ShieldCheck, roles: ['owner'] },
  { title: "Health Check", url: "/health", icon: Activity, roles: ['owner', 'group-admin', 'user'] },
  { title: "API Debug", url: "/api-debug", icon: Bug, roles: ['owner', 'group-admin', 'user'] },
];

const settingsItems: MenuItem[] = [
  { title: "Settings", url: "/settings", icon: Settings, roles: ['owner', 'group-admin', 'user'] },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const location = useLocation();
  const auth = getUserAuth();

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const getNavClass = (path: string) => {
    return isActive(path)
      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
      : "hover:bg-sidebar-accent/50 text-sidebar-foreground/80 hover:text-sidebar-foreground";
  };

  const filterByRole = (items: MenuItem[]) => {
    if (!auth) return items;
    return items.filter(item => item.roles.includes(auth.role));
  };

  const visibleMainItems = filterByRole(mainItems);
  const visibleAdminItems = filterByRole(adminItems);
  const visibleSettingsItems = filterByRole(settingsItems);

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
            GT
          </div>
          {open && (
            <div className="flex flex-col">
              <span className="font-semibold text-sidebar-foreground">GASK</span>
              <span className="text-xs text-sidebar-foreground/60">Task Management</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {visibleMainItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Main</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleMainItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url} className={getNavClass(item.url)}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {visibleAdminItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleAdminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url} className={getNavClass(item.url)}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleSettingsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavClass(item.url)}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

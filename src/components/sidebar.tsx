import {
  NavigationMenu,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import {
  Users,
  FileText,
  Gavel,
  LayoutDashboard,
  ListTodo,
  ShieldCheck,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useUserStore } from "@/stores/user-store";

export default function Sidebar() {
  const location = useLocation();
  const { isCurrentUserAdmin } = useUserStore();

  const navItems = [
    { name: "Dashboard", icon: <LayoutDashboard size={18} />, path: "/" },
    { name: "Clients", icon: <Users size={18} />, path: "/clients" },
    { name: "Cases", icon: <Gavel size={18} />, path: "/cases" },
    { name: "Tasks", icon: <ListTodo size={18} />, path: "/task" },
    { name: "Documents", icon: <FileText size={18} />, path: "/docs" },
    // Only include the Users nav item if the user is admin
    ...(isCurrentUserAdmin() ? [
      { name: "Users", icon: <ShieldCheck size={18} />, path: "/user_management" }
    ] : [])
  ];

  return (
    <div className="relative h-1/2 translate-y-1/2 z-10 bg-background text-foreground" dir="rtl">
      <div className="group absolute left-0 top-0 h-full w-14 hover:w-36 transition-all duration-300 bg-background rounded-r-lg border-2 flex flex-col py-4 overflow-hidden z-10">
        <NavigationMenu orientation="vertical">
          <NavigationMenuList className="flex flex-col items-start ml-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={cn(
                  "flex items-center w-full gap-4 rounded-md px-2 py-2 text-sm font-medium transition-colors hover:bg-muted",
                  location.pathname === item.path && "bg-muted font-semibold"
                )}
              >
                <div
                  className={cn(
                    "min-w-[20px] flex justify-center transition-all duration-300",
                    "ml-20 group-hover:ml-0"
                  )}
                >
                  {item.icon}
                </div>
                <span
                  className={cn(
                    "transform transition-all duration-300 whitespace-nowrap mr-2",
                    "group-hover:translate-x-0 group-hover:opacity-100",
                    "translate-x-14 opacity-0"
                  )}
                >
                  {item.name}
                </span>
              </Link>
            ))}
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </div>
  );
}

import {
  NavigationMenu,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import {
  Home,
  Users,
  Briefcase,
  Calendar,
  Files,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
const navItems = [
  { name: "Dashboard", icon: <Home size={18} />, path: "/" },
  { name: "Clients", icon: <Users size={18} />, path: "/clients" },
  { name: "Cases", icon: <Briefcase size={18} />, path: "/cases" },
  { name: "Tasks", icon: <Calendar size={18} />, path: "/task" },
  { name: "Documents", icon: <Files size={18} />, path: "/docs" },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <div
      className="relative h-1/2 translate-y-1/2 z-10"
      dir="rtl"
    >
      <div
        className="group absolute left-0 top-0 h-full w-14 hover:w-36 transition-all duration-300 bg-[var(--color-sidebar)] rounded-r-lg border-2 flex flex-col py-4 overflow-hidden z-10"
      >
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
                <div className={cn(
                  "min-w-[20px] flex justify-center transition-all duration-300",
                  "ml-20 group-hover:ml-0"
                )}>{item.icon}</div>
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

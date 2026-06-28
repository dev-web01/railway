import { Link, useNavigate } from "@tanstack/react-router";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LogOut, User, Shield } from "lucide-react";
import { useAuth } from "@/lib/auth";

export function UserMenu() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("r-ams-user");
    navigate({ to: "/login" });
  };

  const name = user?.name || "Guest";
  const role = user?.role || "Visitor";
  const initials = name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2 px-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className={`text-xs ${user?.color || 'bg-primary text-primary-foreground'}`}>{initials}</AvatarFallback>
          </Avatar>
          <div className="hidden text-left md:block leading-tight">
            <div className="text-sm font-medium">{name}</div>
            <div className="text-[11px] text-muted-foreground">{role}</div>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem><User className="mr-2 h-4 w-4" /> Profile</DropdownMenuItem>
        <DropdownMenuItem><Shield className="mr-2 h-4 w-4" /> Roles & Access</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

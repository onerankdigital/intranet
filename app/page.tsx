"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, Webhook, User, Shield, Key, Network, Package, TrendingUp, Activity, FileEdit, Receipt, UserCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { usePermissions } from "@/lib/use-permissions";
import { useAuth } from "@/lib/auth-context";

export default function Home() {
  const { canRead, loading: permissionsLoading } = usePermissions();
  const { user } = useAuth();
  
  const allStats = [
    {
      title: "Auth",
      description: "User authentication & tokens",
      icon: User,
      href: "/auth",
      module: "Auth",
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
    },
    {
      title: "Clients",
      description: "Client management & settings",
      icon: Users,
      href: "/clients",
      module: "Clients",
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-50 dark:bg-purple-950/20",
    },
    {
      title: "Transactions",
      description: "Payment transactions & verifications",
      icon: Receipt,
      href: "/transactions",
      module: "Transactions",
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/20",
    },
    {
      title: "API Keys",
      description: "Manage API keys for integrations",
      icon: Key,
      href: "/api-keys",
      module: "API Keys",
      color: "text-teal-600 dark:text-teal-400",
      bgColor: "bg-teal-50 dark:bg-teal-950/20",
    },
    {
      title: "Leads",
      description: "Lead ingestion & tracking",
      icon: FileText,
      href: "/leads",
      module: "Leads",
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-950/20",
    },
    {
      title: "Webhooks",
      description: "Meta webhook handling",
      icon: Webhook,
      href: "/webhooks",
      module: "Webhooks",
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-50 dark:bg-orange-950/20",
    },
    {
      title: "Roles",
      description: "Role-based access control",
      icon: Shield,
      href: "/roles",
      module: "Roles",
      color: "text-indigo-600 dark:text-indigo-400",
      bgColor: "bg-indigo-50 dark:bg-indigo-950/20",
    },
    {
      title: "Permissions",
      description: "API endpoint permissions",
      icon: Key,
      href: "/permissions",
      module: "Permissions",
      color: "text-pink-600 dark:text-pink-400",
      bgColor: "bg-pink-50 dark:bg-pink-950/20",
    },
    {
      title: "Role Permissions",
      description: "Assign permissions to roles",
      icon: Shield,
      href: "/role-permissions",
      module: "Roles",
      color: "text-rose-600 dark:text-rose-400",
      bgColor: "bg-rose-50 dark:bg-rose-950/20",
    },
    {
      title: "User-Clients",
      description: "User-client assignments",
      icon: UserCheck,
      href: "/user-clients",
      module: "User Clients",
      color: "text-sky-600 dark:text-sky-400",
      bgColor: "bg-sky-50 dark:bg-sky-950/20",
    },
    {
      title: "Hierarchy",
      description: "Organizational structure",
      icon: Network,
      href: "/hierarchy",
      module: "Hierarchy",
      color: "text-cyan-600 dark:text-cyan-400",
      bgColor: "bg-cyan-50 dark:bg-cyan-950/20",
    },
    {
      title: "Products",
      description: "Industry → Category → Product",
      icon: Package,
      href: "/products",
      module: "Products",
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-50 dark:bg-amber-950/20",
    },
    {
      title: "Content",
      description: "Manage About Us & Contact Details",
      icon: FileEdit,
      href: "/content",
      module: "Content",
      color: "text-violet-600 dark:text-violet-400",
      bgColor: "bg-violet-50 dark:bg-violet-950/20",
    },
  ];
  
  // Filter stats based on permissions
  // Admin users see everything, non-admin users only see what they have permission for
  const stats = allStats.filter((stat) => {
    // Always show dashboard (no module check needed)
    if (!stat.module) return true;
    
    // Admin users see everything
    const isAdmin = user?.is_admin === true || user?.is_admin === "true" || user?.is_admin === "True";
    if (isAdmin) return true;
    
    // Wait for permissions to load
    if (permissionsLoading) return false;
    
    // Check if user has READ permission for this module
    return canRead(stat.module);
  });

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Welcome to the Lead Automation Platform
            </p>
          </div>
          <Badge variant="default" className="text-sm px-4 py-1.5">
            <Activity className="h-3 w-3 mr-1.5" />
            System Active
          </Badge>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.href} href={stat.href} className="block group" style={{ animationDelay: `${index * 0.1}s` }}>
              <Card 
                className="cursor-pointer border-2  relative h-full"
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
                  <CardTitle className="text-sm font-semibold">{stat.title}</CardTitle>
                    <div className={`${stat.color} p-2.5 rounded-xl bg-background/90 shadow-lg group-hover:shadow-xl`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </CardHeader>
                <CardContent className="relative z-10">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {stat.description}
                  </p>
                  <div className="mt-4 flex items-center text-xs text-primary font-semibold group-hover:translate-x-1 transition-transform duration-300">
                    Manage
                    <TrendingUp className="h-3 w-3 ml-1 " />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Quick Start Card */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              Quick Start
            </CardTitle>
            <CardDescription>
              Get started by managing your backend services
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/50 transition-all duration-300 hover:translate-x-2 hover:shadow-md border border-transparent">
                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-lg">
                  <span className="text-xs font-bold text-primary">1</span>
                </div>
                <p className="text-sm leading-relaxed pt-0.5">
                  Use the sidebar to navigate between different services
                </p>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/50 transition-all duration-300 hover:translate-x-2 hover:shadow-md border border-transparent">
                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-lg">
                  <span className="text-xs font-bold text-primary">2</span>
                </div>
                <p className="text-sm leading-relaxed pt-0.5">
                  All API endpoints are accessible through the frontend
                </p>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/50 transition-all duration-300 hover:translate-x-2 hover:shadow-md border border-transparent">
                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-lg">
                  <span className="text-xs font-bold text-primary">3</span>
                </div>
                <p className="text-sm leading-relaxed pt-0.5">
                  Authentication is handled automatically via JWT tokens
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              System Overview
            </CardTitle>
            <CardDescription>
              Platform capabilities and features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-background/60 border border-border/50 transition-all duration-300 hover:translate-x-1 hover:shadow-lg">
                <span className="text-sm font-medium">Microservices</span>
                <Badge variant="default" className="shadow-md">11 Active</Badge>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-background/60 border border-border/50 transition-all duration-300 hover:translate-x-1 hover:shadow-lg">
                <span className="text-sm font-medium">API Endpoints</span>
                <Badge variant="secondary" className="shadow-md">Auto-Registered</Badge>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-background/60 border border-border/50 transition-all duration-300 hover:translate-x-1 hover:shadow-lg">
                <span className="text-sm font-medium">RBAC System</span>
                <Badge variant="default" className="shadow-md">Hierarchical</Badge>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-background/60 border border-border/50 transition-all duration-300 hover:translate-x-1 hover:shadow-lg">
                <span className="text-sm font-medium">Background Jobs</span>
                <Badge variant="destructive" className="shadow-md">Celery + Redis</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, Tag, Clock, TrendingUp, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { getSubsectionsByGroup } from "@/lib/api/api-client";

interface SidebarProps {
  isCollapsed: boolean;
  onCollapseChange: (collapsed: boolean) => void;
}

const quickLinks = [
  { icon: TrendingUp, label: "Popular Articles", href: "/search?sort=views" },
  { icon: Clock, label: "Recently Updated", href: "/search?sort=date" }
];

const topTags = ["Getting Started", "Configuration", "Best Practices", "API", "Security"];

// This is our new dynamic section component
const DynamicNavSection = ({ title, group }: { title: string, group: 'departments' | 'resource-centre' | 'tools' }) => {
  const location = useLocation();
  const { data: items, isLoading } = useQuery({
    queryKey: ['sidebar-subsections', group],
    queryFn: () => getSubsectionsByGroup(group)
  });

  const isActiveRoute = (href: string) => location.pathname === href;

  if (isLoading) {
    return (
      <div className="space-y-2 px-3">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {items?.map((item) => (
        <Link
          key={item.id}
          to={`/page/${item.id}`} // <-- CORRECT ID-BASED LINK
          className={cn(
            "flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors",
            "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            isActiveRoute(`/page/${item.id}`) && "bg-sidebar-primary text-sidebar-primary-foreground"
          )}
        >
          <span className="truncate">{item.title}</span>
          <Badge variant="secondary" className="ml-2 h-5 text-xs">{item.articleCount}</Badge>
        </Link>
      ))}
    </div>
  );
};

export function SiteSidebar({ isCollapsed, onCollapseChange }: SidebarProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    Departments: true,
    'Resource Centre': true,
    Tools: true,
  });

  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved !== null) onCollapseChange(JSON.parse(saved));
  }, [onCollapseChange]);

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  const toggleSection = (sectionTitle: string) => {
    setExpandedSections(prev => ({ ...prev, [sectionTitle]: !prev[sectionTitle] }));
  };

  const navSections = [
    { title: 'Departments', group: 'departments' as const },
    { title: 'Resource Centre', group: 'resource-centre' as const },
    { title: 'Tools', group: 'tools' as const },
  ];

  return (
    <aside className={cn("flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300", isCollapsed ? "w-16" : "w-64")}>
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        {!isCollapsed && <h2 className="font-semibold text-sidebar-foreground">Navigation</h2>}
        <Button variant="ghost" size="sm" onClick={() => onCollapseChange(!isCollapsed)} className="h-8 w-8 p-0 text-sidebar-foreground hover:bg-sidebar-accent">
          <ChevronRight className={cn("h-4 w-4 transition-transform", isCollapsed && "rotate-180")} />
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {navSections.map((section) => (
            <div key={section.title}>
              <Button variant="ghost" onClick={() => !isCollapsed && toggleSection(section.title)} className={cn("w-full justify-start text-sidebar-foreground font-medium mb-2", isCollapsed && "justify-center px-0")}>
                {!isCollapsed && (
                  <>
                    <span>{section.title}</span>
                    <ChevronDown className={cn("ml-auto h-4 w-4 transition-transform", !expandedSections[section.title] && "-rotate-90")} />
                  </>
                )}
                {isCollapsed && <div className="h-2 w-2 rounded-full bg-sidebar-primary" />}
              </Button>
              {(!isCollapsed && expandedSections[section.title]) && <DynamicNavSection title={section.title} group={section.group} />}
            </div>
          ))}
          {!isCollapsed && (
            <>
              <div>
                <h3 className="font-medium text-sidebar-foreground mb-2">Quick Links</h3>
                <div className="space-y-1">
                  {quickLinks.map((link) => (
                    <Link key={link.href} to={link.href} className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors">
                      <link.icon className="h-4 w-4" />{link.label}
                    </Link>
                  ))}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2"><Tag className="h-4 w-4 text-sidebar-foreground" /><h3 className="font-medium text-sidebar-foreground">Popular Tags</h3></div>
                <div className="flex flex-wrap gap-2">
                  {topTags.map((tag) => (
                    <Link key={tag} to={`/search?tags=${encodeURIComponent(tag.toLowerCase().replace(/\s+/g, '-'))}`}>
                      <Badge variant="outline" className="text-xs cursor-pointer hover:bg-sidebar-accent transition-colors">{tag}</Badge>
                    </Link>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </aside>
  );
}
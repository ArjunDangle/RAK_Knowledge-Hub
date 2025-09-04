import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, Tag, Clock, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { getSubsectionsByGroup } from "@/lib/api/api-client";
import { SidebarNode } from "./SidebarNode";

interface SidebarProps {
  isCollapsed: boolean;
  onCollapseChange: (collapsed: boolean) => void;
}

const quickLinks = [
  { icon: TrendingUp, label: "Popular Articles", href: "/search?sort=views" },
  { icon: Clock, label: "Recently Updated", href: "/search?sort=date" }
];
const topTags = ["Getting Started", "Configuration", "Best Practices", "API", "Security"];

const SidebarSection = ({ group }: { group: 'departments' | 'resource-centre' | 'tools' }) => {
  const { data: items, isLoading } = useQuery({
    queryKey: ['sidebar-subsections', group],
    queryFn: () => getSubsectionsByGroup(group)
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {items?.map((item) => <SidebarNode key={item.id} item={item} level={0} />)}
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
    <aside className={cn(
      "flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-colors duration-300 w-full h-full"
    )}>
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        {!isCollapsed && <h2 className="font-semibold text-sidebar-foreground">Navigation</h2>}
        <Button variant="ghost" size="sm" onClick={() => onCollapseChange(!isCollapsed)} className="h-8 w-8 p-0 text-sidebar-foreground hover:bg-sidebar-accent">
          <ChevronRight className={cn("h-4 w-4 transition-transform", isCollapsed && "rotate-180")} />
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-4">
          {navSections.map((section) => (
            <div key={section.title}>
              <Button variant="ghost" onClick={() => !isCollapsed && toggleSection(section.title)} className={cn("w-full justify-start text-sidebar-foreground font-medium mb-1", isCollapsed && "justify-center px-0")}>
                {!isCollapsed && (
                  <>
                    <span className="text-sm">{section.title}</span>
                    <ChevronDown className={cn("ml-auto h-4 w-4 transition-transform", !expandedSections[section.title] && "-rotate-90")} />
                  </>
                )}
                {isCollapsed && <div className="h-1.5 w-1.5 rounded-full bg-sidebar-primary" />}
              </Button>
              {(!isCollapsed && expandedSections[section.title]) && <SidebarSection group={section.group} />}
            </div>
          ))}
          {!isCollapsed && (
            <>
              <div>
                <h3 className="font-medium text-sidebar-foreground mb-2 px-3 text-sm">Quick Links</h3>
                <div className="space-y-1">
                  {quickLinks.map((link) => (
                    <Link key={link.href} to={link.href} className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors">
                      <link.icon className="h-4 w-4" />{link.label}
                    </Link>
                  ))}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2 px-3"><Tag className="h-4 w-4 text-sidebar-foreground" /><h3 className="font-medium text-sidebar-foreground text-sm">Popular Tags</h3></div>
                <div className="flex flex-wrap gap-2 px-3">
                  {topTags.map((tag) => (
                    <Link key={tag} to={`/search?tags=${encodeURIComponent(tag.toLowerCase().replace(/\s+/g, '-'))}`}>
                      <Badge
                        variant="outline"
                        className="text-xs cursor-pointer text-sidebar-foreground border-sidebar-border hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                      >
                        {tag}
                      </Badge>
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
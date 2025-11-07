// client/src/components/layout/SiteSidebar.tsx
import { useState, useEffect } from "react"; // <-- FIX: Import useEffect
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, Tag, Clock, TrendingUp, PanelLeftClose } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { getSubsectionsByGroup } from "@/lib/api/api-client";
import { SidebarNode } from "./SidebarNode";
import { useLayout } from "@/pages/KnowledgeLayout"; // <-- FIX: Import useLayout
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
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

export function SiteSidebar({ isCollapsed, onToggle }: SidebarProps) {
  // --- THIS IS THE FIX ---
  const { activeGroup } = useLayout();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const navSections = [
    { title: 'Departments', group: 'departments' as const },
    { title: 'Resource Centre', group: 'resource-centre' as const },
    { title: 'Tools', group: 'tools' as const },
  ];

  // This effect runs when the page changes, setting the active section to be expanded.
  useEffect(() => {
    const newExpandedState: Record<string, boolean> = {};
    if (activeGroup) {
      const activeSection = navSections.find(s => s.group === activeGroup);
      if (activeSection) {
        newExpandedState[activeSection.title] = true;
      }
    }
    setExpandedSections(newExpandedState);
  }, [activeGroup]); // Dependency array ensures this runs when activeGroup changes

  const toggleSection = (sectionTitle: string) => {
    setExpandedSections(prev => ({ ...prev, [sectionTitle]: !prev[sectionTitle] }));
  };
  // --- END OF FIX ---

  return (
    <TooltipProvider delayDuration={0}>
        <aside className="flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border w-full h-full">
        <div className="flex items-center justify-between p-2 h-16 border-b border-sidebar-border">
            <h2 className="font-semibold text-sidebar-foreground pl-2">Navigation</h2>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={onToggle}>
                        <PanelLeftClose className="h-5 w-5" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                    <p>Collapse Sidebar</p>
                </TooltipContent>
            </Tooltip>
        </div>
        <ScrollArea className="flex-1">
            <div className="p-2 space-y-4">
            {navSections.map((section) => (
                <div key={section.title}>
                <Button variant="ghost" onClick={() => toggleSection(section.title)} className="w-full justify-start text-sidebar-foreground font-medium mb-1">
                    <span className="text-sm">{section.title}</span>
                    <ChevronDown className={cn("ml-auto h-4 w-4 transition-transform", !expandedSections[section.title] && "-rotate-90")} />
                </Button>
                {expandedSections[section.title] && <SidebarSection group={section.group} />}
                </div>
            ))}
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
            </div>
        </ScrollArea>
        </aside>
    </TooltipProvider>
  );
}
// client/src/components/layout/SiteSidebar.tsx
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, Tag, Clock, TrendingUp, PanelLeftClose } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { getSubsectionsByGroup, getGroups } from "@/lib/api/api-client";
import { SidebarNode } from "./SidebarNode";
import { useLayout } from "@/pages/KnowledgeLayout";
import { Group, GroupInfo } from "@/lib/types/content"; // MODIFIED: Import both Group and GroupInfo
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

const SidebarSection = ({ group }: { group: Group }) => { // MODIFIED: This now correctly uses the dynamic Group type
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
  const { activeGroup } = useLayout();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  // Fetch the navigation sections dynamically and strongly type the response
  const { data: navSections, isLoading: isLoadingGroups } = useQuery<GroupInfo[]>({ // MODIFIED: Specify the return type here
    queryKey: ['sidebarGroups'],
    queryFn: getGroups,
    staleTime: 60 * 60 * 1000, // 1 hour
  });

  useEffect(() => {
    const newExpandedState: Record<string, boolean> = {};
    if (activeGroup && navSections) {
      const activeSection = navSections.find(s => s.id === activeGroup);
      if (activeSection) {
        newExpandedState[activeSection.title] = true;
      }
    }
    setExpandedSections(newExpandedState);
  }, [activeGroup, navSections]);

  const toggleSection = (sectionTitle: string) => {
    setExpandedSections(prev => ({ ...prev, [sectionTitle]: !prev[sectionTitle] }));
  };
  
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
            {isLoadingGroups ? (
                <div className="p-2 space-y-3">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                </div>
            ) : (
                navSections?.map((section) => (
                    <div key={section.id}>
                        <Button variant="ghost" onClick={() => toggleSection(section.title)} className="w-full justify-start text-sidebar-foreground font-medium mb-1">
                            <span className="text-sm">{section.title}</span>
                            <ChevronDown className={cn("ml-auto h-4 w-4 transition-transform", !expandedSections[section.title] && "-rotate-90")} />
                        </Button>
                        {/* THE FIX IS HERE: TypeScript now understands that section.id is a valid Group, so no `any` or other casting is needed! */}
                        {expandedSections[section.title] && <SidebarSection group={section.id} />}
                    </div>
                ))
            )}
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
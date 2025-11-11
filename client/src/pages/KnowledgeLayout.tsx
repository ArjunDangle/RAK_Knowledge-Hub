import { useState, ReactNode, createContext, useContext, useRef } from "react";
import { useParams, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteSidebar } from "@/components/layout/SiteSidebar";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { getAncestors, getPageById, getArticleById } from "@/lib/api/api-client";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { ImperativePanelHandle } from "react-resizable-panels";
import { cn } from "@/lib/utils";

interface LayoutContextType {
  activePath: string[];
  isSidebarCollapsed: boolean;
  activeGroup?: string;
}
const LayoutContext = createContext<LayoutContextType>({
  activePath: [],
  isSidebarCollapsed: false,
  activeGroup: undefined,
});
export const useLayout = () => useContext(LayoutContext);

interface KnowledgeLayoutProps {
  breadcrumbs?: Array<{ label: string; href?: string }>;
  children?: ReactNode;
}

export function KnowledgeLayout({ breadcrumbs, children }: KnowledgeLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { pageId, group } = useParams<{ pageId?: string; group?: string }>();
  const location = useLocation();
  const isMobile = useIsMobile();
  
  const idToFetch = pageId;

  const sidebarPanelRef = useRef<ImperativePanelHandle>(null);

  const { data: ancestors } = useQuery({
    queryKey: ['ancestors', idToFetch],
    queryFn: () => getAncestors(idToFetch!),
    enabled: !!idToFetch,
  });

  const { data: pageDetails } = useQuery({
      queryKey: ['pageGroup', idToFetch],
      queryFn: () => {
        if (!idToFetch) return Promise.resolve(null);
        
        if (location.pathname.startsWith('/article/')) {
          return getArticleById(idToFetch);
        }
        return getPageById(idToFetch);
      },
      enabled: !!idToFetch && !group,
      staleTime: 5 * 60 * 1000,
  });
  
  const activeGroup = group || pageDetails?.group;

  const activePath = [...(ancestors?.map(a => a.id) || []), idToFetch].filter(Boolean) as string[];

  const toggleSidebar = () => {
    const panel = sidebarPanelRef.current;
    if (panel) {
      if (panel.isCollapsed()) {
        panel.expand();
      } else {
        panel.collapse();
      }
    }
  };
  
  if (isMobile) {
    return (
        <LayoutContext.Provider value={{ activePath, isSidebarCollapsed: sidebarCollapsed, activeGroup }}>
            <div className="min-h-screen bg-background">
                <SiteHeader
                    showSidebarToggle={true}
                    onSidebarToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
                    logoSrc="/rak-logo.png"
                />
                <Sheet open={sidebarCollapsed} onOpenChange={setSidebarCollapsed}>
                    <SheetContent side="left" className="w-[280px] p-0">
                        <SiteSidebar isCollapsed={false} onToggle={() => setSidebarCollapsed(false)} />
                    </SheetContent>
                </Sheet>
                <main className="h-full flex-1 overflow-y-auto">
                    <div className="container mx-auto px-6 py-8">
                    {breadcrumbs && breadcrumbs.length > 0 && (
                        <Breadcrumbs items={breadcrumbs} className="mb-6" />
                    )}
                    {children}
                    </div>
                </main>
            </div>
        </LayoutContext.Provider>
    )
  }

  return (
    <LayoutContext.Provider value={{ activePath, isSidebarCollapsed: sidebarCollapsed, activeGroup }}>
      <div className="min-h-screen bg-background flex flex-col">
        <SiteHeader
          showSidebarToggle={true}
          onSidebarToggle={toggleSidebar}
          logoSrc="/rak-logo.png"
        />
        <ResizablePanelGroup 
          direction="horizontal" 
          className="flex-1"
          autoSaveId="knowledge-hub-sidebar-layout"
        >
          <ResizablePanel
            ref={sidebarPanelRef}
            defaultSize={22}
            minSize={18}
            maxSize={35}
            collapsible={true}
            collapsedSize={0}
            onCollapse={() => setSidebarCollapsed(true)}
            onExpand={() => setSidebarCollapsed(false)}
            className={cn(
              "transition-all duration-300 ease-in-out",
              sidebarCollapsed && "min-w-0 w-0"
            )}
          >
            <SiteSidebar
              isCollapsed={sidebarCollapsed}
              onToggle={toggleSidebar}
            />
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={78} className="flex flex-col">
            <main className="flex-1 overflow-auto">
              <div className="container mx-auto px-6 py-8">
                {breadcrumbs && breadcrumbs.length > 0 && (
                  <Breadcrumbs items={breadcrumbs} className="mb-6" />
                )}
                {children}
              </div>
            </main>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </LayoutContext.Provider>
  );
}
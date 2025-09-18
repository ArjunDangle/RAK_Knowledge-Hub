import { useState, ReactNode, createContext, useContext, useRef } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteSidebar } from "@/components/layout/SiteSidebar";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { getAncestors } from "@/lib/api/api-client";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { ImperativePanelHandle } from "react-resizable-panels";

interface LayoutContextType {
  activePath: string[];
}
const LayoutContext = createContext<LayoutContextType>({ activePath: [] });
export const useLayout = () => useContext(LayoutContext);

interface KnowledgeLayoutProps {
  breadcrumbs?: Array<{ label: string; href?: string }>;
  children?: ReactNode;
}

export function KnowledgeLayout({ breadcrumbs, children }: KnowledgeLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { pageId, articleId } = useParams<{ pageId?: string; articleId?: string }>();
  const isMobile = useIsMobile();
  
  const idToFetch = pageId || articleId;

  const sidebarPanelRef = useRef<ImperativePanelHandle>(null);

  const { data: ancestors } = useQuery({
    queryKey: ['ancestors', idToFetch],
    queryFn: () => getAncestors(idToFetch!),
    enabled: !!idToFetch,
  });

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
        <LayoutContext.Provider value={{ activePath }}>
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
                    <div className="container max-w-6xl mx-auto px-6 py-8">
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
    <LayoutContext.Provider value={{ activePath }}>
      <div className="min-h-screen bg-background">
        <SiteHeader
          showSidebarToggle={true}
          onSidebarToggle={toggleSidebar}
          logoSrc="/rak-logo.png"
        />
        <ResizablePanelGroup 
          direction="horizontal" 
          className="h-[calc(100vh-4rem)]"
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
            className="transition-all duration-300 ease-in-out"
          >
            <SiteSidebar
              isCollapsed={sidebarCollapsed}
              onToggle={toggleSidebar}
            />
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={78}>
            <main className="flex-1 overflow-auto h-full">
              <div className="container max-w-6xl mx-auto px-6 py-8">
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
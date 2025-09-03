import { useState, ReactNode, createContext, useContext } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteSidebar } from "@/components/layout/SiteSidebar";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { getAncestors } from "@/lib/api//api-client";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";

// --- CONTEXT ---
interface LayoutContextType {
  activePath: string[];
}
const LayoutContext = createContext<LayoutContextType>({ activePath: [] });
export const useLayout = () => useContext(LayoutContext);
// --- END CONTEXT ---

interface KnowledgeLayoutProps {
  breadcrumbs?: Array<{ label: string; href?: string }>;
  children?: ReactNode;
}

export function KnowledgeLayout({ breadcrumbs, children }: KnowledgeLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { pageId, articleId } = useParams<{ pageId?: string; articleId?: string }>();
  
  const idToFetch = pageId || articleId;

  const { data: ancestors } = useQuery({
    queryKey: ['ancestors', idToFetch],
    queryFn: () => getAncestors(idToFetch!),
    enabled: !!idToFetch,
  });

  const activePath = [...(ancestors?.map(a => a.id) || []), idToFetch].filter(Boolean) as string[];

  return (
    <LayoutContext.Provider value={{ activePath }}>
      <div className="min-h-screen bg-background">
        <SiteHeader
          variant="knowledge"
          showSidebarToggle={true}
          onSidebarToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        {/* --- THIS IS THE RESIZABLE LAYOUT STRUCTURE --- */}
        <ResizablePanelGroup direction="horizontal" className="h-[calc(100vh-4rem)]">
          <ResizablePanel
            defaultSize={20}
            minSize={15}
            maxSize={25}
            collapsible={true}
            collapsedSize={4}
            onCollapse={() => setSidebarCollapsed(true)}
            onExpand={() => setSidebarCollapsed(false)}
            className="hidden md:block"
          >
            <SiteSidebar
              isCollapsed={sidebarCollapsed}
              onCollapseChange={setSidebarCollapsed}
            />
          </ResizablePanel>

          <ResizableHandle withHandle className="hidden md:flex" />

          <ResizablePanel defaultSize={80}>
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
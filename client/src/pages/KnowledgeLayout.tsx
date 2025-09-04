import { ReactNode, createContext, useContext } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteSidebar } from "@/components/layout/SiteSidebar";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { getAncestors } from "@/lib/api//api-client";

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
        <SiteHeader variant="knowledge" />
        
        {/* --- LAYOUT UPDATED TO USE STICKY SIDEBAR --- */}
        <div className="flex items-start border-t">
          {/* --- Sidebar is now sticky --- */}
          <div className="w-[30%] h-[calc(100vh-4rem)] sticky top-16 hidden md:block">
            <SiteSidebar />
          </div>
          
          {/* --- Main content now handles all scrolling --- */}
          <main className="w-[70%]">
            <div className="container max-w-6xl mx-auto px-6 py-8">
              {breadcrumbs && breadcrumbs.length > 0 && (
                <Breadcrumbs items={breadcrumbs} className="mb-6" />
              )}
              {children}
            </div>
          </main>
        </div>
      </div>
    </LayoutContext.Provider>
  );
}
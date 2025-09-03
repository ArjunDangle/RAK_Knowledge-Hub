import { useState, ReactNode } from "react";
import { Outlet } from "react-router-dom";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteSidebar } from "@/components/layout/SiteSidebar";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { cn } from "@/lib/utils";

interface KnowledgeLayoutProps {
  breadcrumbs?: Array<{ label: string; href?: string }>;
  children?: ReactNode;
}

export function KnowledgeLayout({ breadcrumbs, children }: KnowledgeLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader
        variant="knowledge"
        showSidebarToggle={true}
        onSidebarToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      
      <div className="flex h-[calc(100vh-4rem)]">
        <SiteSidebar
          isCollapsed={sidebarCollapsed}
          onCollapseChange={setSidebarCollapsed}
        />
        
        <main className="flex-1 overflow-auto">
          <div className="container max-w-6xl mx-auto px-6 py-8">
            {breadcrumbs && breadcrumbs.length > 0 && (
              <Breadcrumbs items={breadcrumbs} className="mb-6" />
            )}
            {children || <Outlet />}
          </div>
        </main>
      </div>
    </div>
  );
}

// Wrapper component for pages that need the layout with specific breadcrumbs
export function withKnowledgeLayout<P extends object>(
  Component: React.ComponentType<P>,
  getBreadcrumbs?: (props: P) => Array<{ label: string; href?: string }>
) {
  return function WrappedComponent(props: P) {
    const breadcrumbs = getBreadcrumbs ? getBreadcrumbs(props) : undefined;
    
    return (
      <KnowledgeLayout breadcrumbs={breadcrumbs}>
        <Component {...props} />
      </KnowledgeLayout>
    );
  };
}
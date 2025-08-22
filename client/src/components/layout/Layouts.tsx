import React, { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
  className?: string;
}

/**
 * Base layout component that provides consistent styling and structure
 */
export function BaseLayout({ children, className = '' }: LayoutProps) {
  return (
    <div className={`min-h-screen bg-background text-foreground dark ${className}`}>
      {children}
    </div>
  );
}

/**
 * Dashboard layout with navigation
 */
export function DashboardLayout({ children }: LayoutProps) {
  return (
    <BaseLayout>
      {/* You can add a shared header or navigation here */}
      <main className="flex-1">
        {children}
      </main>
    </BaseLayout>
  );
}

/**
 * Authentication layout (login/register)
 */
export function AuthLayout({ children }: LayoutProps) {
  return (
    <BaseLayout className="flex items-center justify-center">
      <div className="w-full max-w-md">
        {children}
      </div>
    </BaseLayout>
  );
}

/**
 * Content layout for video player pages
 */
export function ContentLayout({ children }: LayoutProps) {
  return (
    <BaseLayout>
      <div className="flex flex-col min-h-screen">
        {children}
      </div>
    </BaseLayout>
  );
}

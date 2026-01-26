import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { FilterProvider } from '@/contexts/FilterContext';
import { Sidebar } from './Sidebar';
import { LoadingScreen } from '@/components/ui/loading';
export function AppLayout() {
  const {
    user,
    profile,
    loading
  } = useAuth();
  if (loading) {
    return <LoadingScreen />;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect to onboarding if not completed
  if (profile && !profile.onboarding_done) {
    return <Navigate to="/onboarding" replace />;
  }
  return <FilterProvider>
      <div className="min-h-screen bg-background flex">
        <Sidebar />
        <main className="flex-1 lg:ml-0 overflow-auto">
          <div className="pt-20 lg:pt-0 pb-24 lg:pb-8 px-4 sm:px-6 lg:px-8 min-h-screen py-[24px]">
            <div className="max-w-7xl mx-auto py-6 sm:py-[24px]">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </FilterProvider>;
}
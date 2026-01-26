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
          <div className="lg:pt-0 lg:pb-8 sm:px-6 lg:px-8 min-h-screen px-[16px] py-[8px] pb-[80px] pt-[8px]">
            <div className="max-w-7xl mx-auto sm:py-[24px] py-0">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </FilterProvider>;
}
import { Search, Zap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PeriodFilterSelector } from '@/components/filters/PeriodFilterSelector';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
interface HeaderProps {
  showFilter?: boolean;
  showSearch?: boolean;
}
export function Header({
  showFilter = true,
  showSearch = false
}: HeaderProps) {
  const {
    profile
  } = useAuth();
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };
  return <header className="flex-col mb-6 sm:mb-8 sm:flex-row flex sm:items-end justify-between gap-[8px]">
      

      <div className="flex items-center gap-3">
        {showSearch && <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar..." className="pl-9 w-48 bg-muted/50 border-transparent focus:border-primary/50" />
          </div>}

        {showFilter && <PeriodFilterSelector />}

        <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
          <Zap className="h-5 w-5" />
          <span className="absolute top-1 right-1 h-2 w-2 bg-primary rounded-full" />
        </Button>
      </div>
    </header>;
}
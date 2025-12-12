import { BarChart3, LogOut, User, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface DashboardHeaderProps {
  userName?: string;
  userRole?: 'vendedor' | 'gerente' | 'admin';
  onLogout?: () => void;
}

export function DashboardHeader({ userName = 'Usuário', userRole = 'vendedor', onLogout }: DashboardHeaderProps) {
  const navigate = useNavigate();
  
  const roleLabel = {
    vendedor: 'Vendedor',
    gerente: 'Gerente',
    admin: 'Administrador',
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Dashboard de Vendas</h1>
            <p className="text-xs text-muted-foreground">Acompanhe seu desempenho</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {userRole === 'admin' && (
            <Button variant="outline" size="sm" onClick={() => navigate('/admin')} className="gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Admin</span>
            </Button>
          )}
          <div className="hidden items-center gap-2 sm:flex">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">{userName}</p>
              <p className="text-xs text-muted-foreground">{roleLabel[userRole]}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onLogout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}

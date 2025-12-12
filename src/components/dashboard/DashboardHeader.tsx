import { LogOut, User, Shield, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import logoConquista from '@/assets/logo-conquista.png';

interface DashboardHeaderProps {
  userName?: string;
  userRole?: 'vendedor' | 'gerente' | 'admin';
  onLogout?: () => void;
  onSync?: () => void;
  syncing?: boolean;
}

export function DashboardHeader({ 
  userName = 'Usuário', 
  userRole = 'vendedor', 
  onLogout,
  onSync,
  syncing = false
}: DashboardHeaderProps) {
  const navigate = useNavigate();
  
  const roleLabel = {
    vendedor: 'Vendedor',
    gerente: 'Gerente',
    admin: 'Administrador',
  };

  const canSync = userRole === 'admin';

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-gradient-to-r from-[hsl(180,70%,50%)] to-[hsl(200,80%,35%)] backdrop-blur-xl">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <img 
            src={logoConquista} 
            alt="Conquista Atacadista" 
            className="h-10 w-auto"
          />
          {canSync && onSync && (
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={onSync}
              disabled={syncing}
              className="ml-2 bg-white/20 text-white border-white/30 hover:bg-white/30"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{syncing ? 'Sincronizando...' : 'Sincronizar'}</span>
            </Button>
          )}
        </div>

        <div className="flex items-center gap-4">
          {userRole === 'admin' && (
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={() => navigate('/admin')} 
              className="gap-2 bg-white/20 text-white border-white/30 hover:bg-white/30"
            >
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Admin</span>
            </Button>
          )}
          <div className="hidden items-center gap-2 sm:flex">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
              <User className="h-4 w-4 text-white" />
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-white">{userName}</p>
              <p className="text-xs text-white/70">{roleLabel[userRole]}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onLogout} className="text-white hover:bg-white/20">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}

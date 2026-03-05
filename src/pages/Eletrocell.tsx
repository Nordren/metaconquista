import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopPodium } from '@/components/dashboard/TopPodium';
import { RankingCard } from '@/components/dashboard/RankingCard';
import { StatsOverview } from '@/components/dashboard/StatsOverview';
import { getCurrentMonth, MonthSelector } from '@/components/dashboard/MonthSelector';
import { useVendedores, useVendedorLink, triggerEletrocellSync } from '@/hooks/useVendedores';
import { useAuth } from '@/hooks/useAuth';
import { RefreshCw, Loader2, LogOut, User, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ChangePasswordDialog } from '@/components/dashboard/ChangePasswordDialog';
import { cn } from '@/lib/utils';
import logoEletrocell from '@/assets/logo-eletrocell.png';

const Eletrocell = () => {
  const navigate = useNavigate();
  const { user, profile, role, loading: authLoading, isAuthenticated, signOut } = useAuth();
  const [syncing, setSyncing] = useState(false);
  const currentMonth = getCurrentMonth();
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const effectiveMonth = role === 'vendedor' ? currentMonth : selectedMonth;
  const { data: vendedores, isLoading, refetch } = useVendedores(effectiveMonth);
  const { data: vendedorLink } = useVendedorLink(user?.id);

  // Only admin or users with loja=Eletrocell can access
  const isAdmin = role === 'admin';
  const isEletrocellUser = profile?.loja === 'Eletrocell';
  const canAccess = isAdmin || isEletrocellUser;

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/auth', { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (!authLoading && isAuthenticated && !canAccess) {
      navigate('/', { replace: true });
    }
  }, [authLoading, isAuthenticated, canAccess, navigate]);

  // Filter only Eletrocell vendedores
  const eletrocellVendedores = useMemo(() => {
    if (!vendedores) return [];
    return vendedores
      .filter((v) => v.loja === 'Eletrocell')
      .sort((a, b) => b.realizado - a.realizado)
      .map((v, index) => ({ ...v, posicao: index + 1 }));
  }, [vendedores]);

  // Find linked vendedor for vendedor role
  const linkedVendedor = useMemo(() => {
    if (role !== 'vendedor') return null;
    if (!vendedorLink) return null;
    const linkNome = vendedorLink.nome.toLowerCase().trim();
    const linkLoja = vendedorLink.loja.toLowerCase().trim();
    return eletrocellVendedores.find(v =>
      v.nome.toLowerCase().trim() === linkNome &&
      v.loja.toLowerCase().trim() === linkLoja
    );
  }, [eletrocellVendedores, role, vendedorLink]);

  const canSeeValues = isAdmin || role === 'gerente';

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await triggerEletrocellSync();
      if (result.error) {
        toast.error('Erro ao sincronizar: ' + result.error.message);
      } else {
        toast.success('Dados Eletrocell sincronizados!');
        refetch();
      }
    } catch {
      toast.error('Erro ao sincronizar dados');
    } finally {
      setSyncing(false);
    }
  };

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error('Erro ao sair: ' + error.message);
    } else {
      toast.success('Você saiu da conta');
      navigate('/auth', { replace: true });
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated || !canAccess) return null;

  const userName = profile?.nome || user?.email || 'Usuário';

  return (
    <div className="min-h-screen bg-background">
      {/* Eletrocell Header */}
      <header className="sticky top-0 z-50 border-b border-red-700/50 bg-gradient-to-r from-red-600 to-red-700 backdrop-blur-xl">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <img src={logoEletrocell} alt="Eletrô.cell" className="h-9 w-auto" />
            </div>
            {isAdmin && (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleSync}
                  disabled={syncing}
                  className="ml-2 bg-white/20 text-white border-white/30 hover:bg-white/30"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">{syncing ? 'Sincronizando...' : 'Sincronizar'}</span>
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate('/')}
                  className="bg-white/20 text-white border-white/30 hover:bg-white/30"
                >
                  <span className="hidden sm:inline">Conquista</span>
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate('/admin')}
                  className="gap-2 bg-white/20 text-white border-white/30 hover:bg-white/30"
                >
                  <Shield className="h-4 w-4" />
                  <span className="hidden sm:inline">Admin</span>
                </Button>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {(isAdmin || role === 'gerente') && (
              <div className="hidden md:block">
                <MonthSelector selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} />
              </div>
            )}
            <div className="hidden items-center gap-2 sm:flex">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                <User className="h-4 w-4 text-white" />
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-white">{userName}</p>
              </div>
            </div>
            <ChangePasswordDialog />
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={handleLogout} className="text-white hover:bg-white/20">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {(isAdmin || role === 'gerente') && (
          <div className="md:hidden px-4 pb-3">
            <MonthSelector selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} />
          </div>
        )}
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats for admin/gerente */}
        {canSeeValues && (
          <StatsOverview vendedores={eletrocellVendedores} showValues={canSeeValues} />
        )}

        {isLoading && (
          <div className="flex justify-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Vendedor view - own card + store ranking */}
        {!isLoading && role === 'vendedor' && linkedVendedor && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4 text-foreground">Seu Desempenho</h2>
            <RankingCard vendedor={linkedVendedor} showValues={false} showOwnValues={true} highlighted />
            <h2 className="text-lg font-semibold mb-4 mt-8 text-foreground">Ranking</h2>
            <div className="space-y-2">
              {eletrocellVendedores.map((vendedor, idx) => {
                const isOwn = vendedorLink &&
                  vendedor.nome.toLowerCase().trim() === vendedorLink.nome.toLowerCase().trim();
                return (
                  <div
                    key={vendedor.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border",
                      isOwn ? "bg-primary/10 border-primary/30" : "bg-card/80 border-border/60"
                    )}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground font-bold text-sm">
                      {idx + 1}º
                    </div>
                    <span className={cn("font-medium", isOwn && "text-primary")}>{vendedor.nome}</span>
                    <span className="ml-auto text-sm text-muted-foreground">{vendedor.percentual}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Admin/gerente view - podium + grid */}
        {!isLoading && role !== 'vendedor' && eletrocellVendedores.length >= 3 && (
          <TopPodium vendedores={eletrocellVendedores} showValues={canSeeValues} />
        )}

        {!isLoading && role !== 'vendedor' && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {eletrocellVendedores.map((vendedor, index) => (
              <RankingCard key={vendedor.id} vendedor={vendedor} showValues={canSeeValues} index={index} />
            ))}
          </div>
        )}

        {!isLoading && eletrocellVendedores.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-lg text-muted-foreground">Nenhum vendedor encontrado.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Eletrocell;

import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { StoreFilter } from '@/components/dashboard/StoreFilter';
import { TopPodium } from '@/components/dashboard/TopPodium';
import { RankingCard } from '@/components/dashboard/RankingCard';
import { StatsOverview } from '@/components/dashboard/StatsOverview';
import { getCurrentMonth } from '@/components/dashboard/MonthSelector';
import { useVendedores, useVendedorLink, triggerSync } from '@/hooks/useVendedores';
import { useAuth } from '@/hooks/useAuth';
import { mockVendedores, lojas } from '@/data/mockVendedores';
import { RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const Index = () => {
  const navigate = useNavigate();
  const { user, profile, role, loading: authLoading, isAuthenticated, canViewValues, signOut } = useAuth();
  const [selectedLoja, setSelectedLoja] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const currentMonth = getCurrentMonth();
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const effectiveMonth = role === 'vendedor' ? currentMonth : selectedMonth;
  const { data: vendedores, isLoading, refetch } = useVendedores(effectiveMonth);
  const { data: vendedorLink } = useVendedorLink(user?.id);

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/auth', { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Use database data if available; fallback to mock ONLY for the current month
  const shouldUseMock = (!vendedores || vendedores.length === 0) && effectiveMonth === currentMonth;
  const sourceVendedores = shouldUseMock ? mockVendedores : (vendedores || []);

  // Filtrar dados baseado na role do usuário
  const filteredVendedores = useMemo(() => {
    let filtered = [...sourceVendedores];
    
    // Gerente só vê a loja dele (baseado no profile.loja)
    if (role === 'gerente' && profile?.loja) {
      filtered = filtered.filter((v) => v.loja === profile.loja);
    }
    
    // Aplicar filtro de loja selecionado (apenas admin pode filtrar)
    if (role === 'admin' && selectedLoja) {
      filtered = filtered.filter((v) => v.loja === selectedLoja);
    }

    // Recalcular posições após filtro - ordenar por faturamento (realizado)
    return filtered
      .sort((a, b) => b.realizado - a.realizado)
      .map((v, index) => ({ ...v, posicao: index + 1 }));
  }, [sourceVendedores, selectedLoja, role, profile?.loja]);

  // Encontrar o vendedor vinculado ao usuário atual (para vendedor comum)
  const linkedVendedor = useMemo(() => {
    if (role !== 'vendedor') return null;
    if (!vendedorLink) return null;

    // Match pelo nome e loja do vendedor_link (case insensitive)
    const linkNome = vendedorLink.nome.toLowerCase().trim();
    const linkLoja = vendedorLink.loja.toLowerCase().trim();

    return sourceVendedores.find(v => 
      v.nome.toLowerCase().trim() === linkNome && 
      v.loja.toLowerCase().trim() === linkLoja
    );
  }, [sourceVendedores, role, vendedorLink]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await triggerSync(selectedMonth);
      if (result.error) {
        toast.error('Erro ao sincronizar: ' + result.error.message);
      } else {
        toast.success(`Dados de ${selectedMonth} sincronizados com sucesso!`);
        refetch();
      }
    } catch (error) {
      toast.error('Erro ao sincronizar dados');
    } finally {
      setSyncing(false);
    }
  };

  const handleMonthChange = (month: string) => {
    // vendedor sempre fica no mês atual
    if (role === 'vendedor') return;
    setSelectedMonth(month);
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

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  const userName = profile?.nome || user?.email || 'Usuário';
  const userRole = role || 'vendedor';

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader 
        userName={userName} 
        userRole={userRole} 
        onLogout={handleLogout}
        onSync={handleSync}
        syncing={syncing}
        selectedMonth={selectedMonth}
        onMonthChange={handleMonthChange}
      />

      <main className="container mx-auto px-4 py-8">

        {/* Stats Overview - apenas para gerente e admin */}
        {(role === 'admin' || role === 'gerente') && (
          <StatsOverview vendedores={filteredVendedores} showValues={canViewValues} />
        )}

        {/* Filter - apenas para admin */}
        {role === 'admin' && (
          <div className="my-8">
            <StoreFilter 
              lojas={lojas} 
              selected={selectedLoja} 
              onSelect={setSelectedLoja} 
            />
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Card destacado do vendedor logado */}
        {!isLoading && role === 'vendedor' && linkedVendedor && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4 text-foreground">Seu Desempenho</h2>
            <RankingCard 
              vendedor={linkedVendedor} 
              showValues={false}
              showOwnValues={true}
              highlighted
            />
            
            {/* Ranking simplificado para vendedor - apenas posições da mesma loja */}
            <h2 className="text-lg font-semibold mb-4 mt-8 text-foreground">Ranking da Loja</h2>
            <div className="space-y-2">
              {filteredVendedores
                .filter((v) => v.loja === linkedVendedor.loja)
                .map((vendedor, idx) => {
                  const isOwn = vendedorLink && 
                    vendedor.nome.toLowerCase().trim() === vendedorLink.nome.toLowerCase().trim() &&
                    vendedor.loja.toLowerCase().trim() === vendedorLink.loja.toLowerCase().trim();
                  return (
                    <div 
                      key={vendedor.id}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border",
                        isOwn 
                          ? "bg-primary/10 border-primary/30" 
                          : "bg-card/80 border-border/60"
                      )}
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground font-bold text-sm">
                        {idx + 1}º
                      </div>
                      <span className={cn("font-medium", isOwn && "text-primary")}>
                        {vendedor.nome}
                      </span>
                      <span className="ml-auto text-sm text-muted-foreground">
                        {vendedor.percentual}%
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Podium - apenas para admin e gerente */}
        {!isLoading && role !== 'vendedor' && filteredVendedores.length >= 3 && (
          <TopPodium vendedores={filteredVendedores} showValues={canViewValues} />
        )}

        {/* Ranking Grid - apenas para admin e gerente */}
        {!isLoading && role !== 'vendedor' && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredVendedores.map((vendedor, index) => (
              <RankingCard 
                key={vendedor.id} 
                vendedor={vendedor} 
                showValues={canViewValues}
                index={index}
              />
            ))}
          </div>
        )}

        {!isLoading && filteredVendedores.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-lg text-muted-foreground">
              Nenhum vendedor encontrado.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;

import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { StoreFilter } from '@/components/dashboard/StoreFilter';
import { TopPodium } from '@/components/dashboard/TopPodium';
import { RankingCard } from '@/components/dashboard/RankingCard';
import { StatsOverview } from '@/components/dashboard/StatsOverview';
import { useVendedores, triggerSync } from '@/hooks/useVendedores';
import { useAuth } from '@/hooks/useAuth';
import { mockVendedores, lojas } from '@/data/mockVendedores';
import { Button } from '@/components/ui/button';
import { RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const Index = () => {
  const navigate = useNavigate();
  const { user, profile, role, loading: authLoading, isAuthenticated, canViewValues, signOut } = useAuth();
  const [selectedLoja, setSelectedLoja] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const { data: vendedores, isLoading, refetch } = useVendedores();

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/auth', { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Use database data if available, otherwise fall back to mock data
  const sourceVendedores = vendedores && vendedores.length > 0 ? vendedores : mockVendedores;

  const filteredVendedores = useMemo(() => {
    let filtered = [...sourceVendedores];
    
    if (selectedLoja) {
      filtered = filtered.filter((v) => v.loja === selectedLoja);
    }

    // Recalcular posições após filtro
    return filtered
      .sort((a, b) => b.percentual - a.percentual)
      .map((v, index) => ({ ...v, posicao: index + 1 }));
  }, [sourceVendedores, selectedLoja]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await triggerSync();
      if (result.error) {
        toast.error('Erro ao sincronizar: ' + result.error.message);
      } else {
        toast.success('Dados sincronizados com sucesso!');
        refetch();
      }
    } catch (error) {
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
      />

      <main className="container mx-auto px-4 py-8">

        {/* Stats Overview */}
        <StatsOverview vendedores={filteredVendedores} showValues={canViewValues} />

        {/* Filter */}
        <div className="my-8">
          <StoreFilter 
            lojas={lojas} 
            selected={selectedLoja} 
            onSelect={setSelectedLoja} 
          />
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Podium */}
        {!isLoading && filteredVendedores.length >= 3 && (
          <TopPodium vendedores={filteredVendedores} showValues={canViewValues} />
        )}

        {/* Ranking Grid */}
        {!isLoading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredVendedores.map((vendedor) => (
              <RankingCard 
                key={vendedor.id} 
                vendedor={vendedor} 
                showValues={canViewValues} 
              />
            ))}
          </div>
        )}

        {!isLoading && filteredVendedores.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-lg text-muted-foreground">
              Nenhum vendedor encontrado para esta loja.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;

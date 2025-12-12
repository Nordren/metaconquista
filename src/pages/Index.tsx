import { useState, useMemo } from 'react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { StoreFilter } from '@/components/dashboard/StoreFilter';
import { TopPodium } from '@/components/dashboard/TopPodium';
import { RankingCard } from '@/components/dashboard/RankingCard';
import { StatsOverview } from '@/components/dashboard/StatsOverview';
import { useVendedores, triggerSync } from '@/hooks/useVendedores';
import { mockVendedores, lojas } from '@/data/mockVendedores';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

// Simular usuário logado (depois virá do backend)
const mockUser = {
  name: 'João Gerente',
  role: 'gerente' as const,
};

const Index = () => {
  const [selectedLoja, setSelectedLoja] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const { data: vendedores, isLoading, refetch } = useVendedores();

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

  const showValues = mockUser.role === 'gerente' || mockUser.role === 'admin';

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

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader 
        userName={mockUser.name} 
        userRole={mockUser.role} 
        onLogout={() => console.log('Logout')} 
      />

      <main className="container mx-auto px-4 py-8">
        {/* Sync Button */}
        <div className="flex justify-end mb-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleSync}
            disabled={syncing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Sincronizando...' : 'Sincronizar Planilha'}
          </Button>
        </div>

        {/* Stats Overview */}
        <StatsOverview vendedores={filteredVendedores} showValues={showValues} />

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
          <TopPodium vendedores={filteredVendedores} showValues={showValues} />
        )}

        {/* Ranking Grid */}
        {!isLoading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredVendedores.map((vendedor) => (
              <RankingCard 
                key={vendedor.id} 
                vendedor={vendedor} 
                showValues={showValues} 
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

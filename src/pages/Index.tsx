import { useState, useMemo } from 'react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { StoreFilter } from '@/components/dashboard/StoreFilter';
import { TopPodium } from '@/components/dashboard/TopPodium';
import { RankingCard } from '@/components/dashboard/RankingCard';
import { StatsOverview } from '@/components/dashboard/StatsOverview';
import { mockVendedores, lojas } from '@/data/mockVendedores';

// Simular usuário logado (depois virá do backend)
const mockUser = {
  name: 'João Gerente',
  role: 'gerente' as const, // 'vendedor' | 'gerente' | 'admin'
};

const Index = () => {
  const [selectedLoja, setSelectedLoja] = useState<string | null>(null);

  const filteredVendedores = useMemo(() => {
    let vendedores = [...mockVendedores];
    
    if (selectedLoja) {
      vendedores = vendedores.filter((v) => v.loja === selectedLoja);
    }

    // Recalcular posições após filtro
    return vendedores
      .sort((a, b) => b.percentual - a.percentual)
      .map((v, index) => ({ ...v, posicao: index + 1 }));
  }, [selectedLoja]);

  const showValues = mockUser.role === 'gerente' || mockUser.role === 'admin';

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader 
        userName={mockUser.name} 
        userRole={mockUser.role} 
        onLogout={() => console.log('Logout')} 
      />

      <main className="container mx-auto px-4 py-8">
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

        {/* Podium */}
        {filteredVendedores.length >= 3 && (
          <TopPodium vendedores={filteredVendedores} showValues={showValues} />
        )}

        {/* Ranking Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredVendedores.map((vendedor) => (
            <RankingCard 
              key={vendedor.id} 
              vendedor={vendedor} 
              showValues={showValues} 
            />
          ))}
        </div>

        {filteredVendedores.length === 0 && (
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

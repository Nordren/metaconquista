import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Vendedor } from '@/types/dashboard';

async function fetchVendedores(): Promise<Vendedor[]> {
  const { data, error } = await supabase
    .from('vendedores')
    .select('*')
    .order('realizado', { ascending: false }); // Ordenar por faturamento

  if (error) {
    console.error('Error fetching vendedores:', error);
    throw error;
  }

  // Transform snake_case to camelCase
  return (data || []).map((v, index) => ({
    id: v.id,
    nome: v.nome,
    loja: v.loja as Vendedor['loja'],
    meta: Number(v.meta),
    realizado: Number(v.realizado),
    percentual: Number(v.percentual),
    vendaDia: Number(v.venda_dia),
    posicao: index + 1, // Posição baseada no faturamento
  }));
}

export function useVendedores() {
  return useQuery({
    queryKey: ['vendedores'],
    queryFn: fetchVendedores,
    refetchInterval: 60000, // Refetch every minute for near-realtime
  });
}

export async function triggerSync() {
  const response = await supabase.functions.invoke('sync-google-sheets');
  return response;
}

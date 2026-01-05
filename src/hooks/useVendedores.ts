import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Vendedor } from '@/types/dashboard';

async function fetchVendedores(period: string): Promise<Vendedor[]> {
  const { data, error } = await supabase
    .from('vendedores')
    .select('*')
    .eq('period', period)
    .order('realizado', { ascending: false }); // Ordenar por faturamento

  if (error) {
    console.error('Error fetching vendedores:', error);
    throw error;
  }

  // Transform snake_case to camelCase
  return (data || []).map((v, index) => ({
    id: v.id,
    nome: v.nome,
    loja: v.loja,
    meta: Number(v.meta),
    realizado: Number(v.realizado),
    percentual: Number(v.percentual),
    vendaDia: Number(v.venda_dia),
    posicao: index + 1, // Posição baseada no faturamento
    period: v.period,
    userId: v.user_id,
  }));
}

export function useVendedores(period: string) {
  return useQuery({
    queryKey: ['vendedores', period],
    queryFn: () => fetchVendedores(period),
    refetchInterval: 60000, // Refetch every minute for near-realtime
  });
}

export async function triggerSync(month?: string) {
  const response = await supabase.functions.invoke('sync-google-sheets', {
    body: month ? { month } : undefined,
  });
  return response;
}

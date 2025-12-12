export interface Vendedor {
  id: string;
  nome: string;
  loja: 'Ubá' | 'GV' | 'Itabira' | 'Serra';
  meta: number;
  realizado: number;
  percentual: number;
  vendaDia: number;
  posicao: number;
}

export interface DashboardFilters {
  loja: string | null;
}

export interface Vendedor {
  id: string;
  nome: string;
  loja: string;
  meta: number;
  realizado: number;
  percentual: number;
  vendaDia: number;
  posicao: number;
  period: string; // formato MM-YY
  userId?: string | null;
}

export interface DashboardFilters {
  loja: string | null;
}

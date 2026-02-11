import { Vendedor } from '@/types/dashboard';
import { getCurrentMonth } from '@/components/dashboard/MonthSelector';

const period = getCurrentMonth();

export const mockVendedores: Vendedor[] = [
  // Ubá
  { id: '1', nome: 'Carlos Silva', loja: 'Ubá', meta: 50000, realizado: 42000, percentual: 84, vendaDia: 2800, posicao: 1, period },
  { id: '2', nome: 'Ana Santos', loja: 'Ubá', meta: 45000, realizado: 36000, percentual: 80, vendaDia: 2400, posicao: 2, period },
  { id: '3', nome: 'Pedro Lima', loja: 'Ubá', meta: 40000, realizado: 28000, percentual: 70, vendaDia: 1867, posicao: 3, period },
  { id: '4', nome: 'Maria Costa', loja: 'Ubá', meta: 35000, realizado: 21000, percentual: 60, vendaDia: 1400, posicao: 4, period },
  
  // GV
  { id: '5', nome: 'João Oliveira', loja: 'GV', meta: 55000, realizado: 49500, percentual: 90, vendaDia: 3300, posicao: 1, period },
  { id: '6', nome: 'Fernanda Souza', loja: 'GV', meta: 50000, realizado: 40000, percentual: 80, vendaDia: 2667, posicao: 2, period },
  { id: '7', nome: 'Lucas Pereira', loja: 'GV', meta: 45000, realizado: 31500, percentual: 70, vendaDia: 2100, posicao: 3, period },
  { id: '8', nome: 'Juliana Rocha', loja: 'GV', meta: 40000, realizado: 24000, percentual: 60, vendaDia: 1600, posicao: 4, period },
  
  // Itabira
  { id: '9', nome: 'Ricardo Alves', loja: 'Itabira', meta: 48000, realizado: 45600, percentual: 95, vendaDia: 3040, posicao: 1, period },
  { id: '10', nome: 'Camila Dias', loja: 'Itabira', meta: 42000, realizado: 35700, percentual: 85, vendaDia: 2380, posicao: 2, period },
  { id: '11', nome: 'Bruno Martins', loja: 'Itabira', meta: 38000, realizado: 28500, percentual: 75, vendaDia: 1900, posicao: 3, period },
  { id: '12', nome: 'Patrícia Nunes', loja: 'Itabira', meta: 35000, realizado: 22750, percentual: 65, vendaDia: 1517, posicao: 4, period },
  
  // Serra
  { id: '13', nome: 'Marcos Ribeiro', loja: 'Serra', meta: 52000, realizado: 46800, percentual: 90, vendaDia: 3120, posicao: 1, period },
  { id: '14', nome: 'Aline Ferreira', loja: 'Serra', meta: 47000, realizado: 37600, percentual: 80, vendaDia: 2507, posicao: 2, period },
  { id: '15', nome: 'Thiago Gomes', loja: 'Serra', meta: 43000, realizado: 30100, percentual: 70, vendaDia: 2007, posicao: 3, period },
  { id: '16', nome: 'Beatriz Cardoso', loja: 'Serra', meta: 38000, realizado: 22800, percentual: 60, vendaDia: 1520, posicao: 4, period },
];

export const lojas = ['Ubá', 'GV', 'Itabira', 'Serra', 'BH'] as const;

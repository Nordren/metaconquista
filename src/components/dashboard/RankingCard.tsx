import { Vendedor } from '@/types/dashboard';
import { Trophy, Medal, Award, TrendingUp, Target } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface RankingCardProps {
  vendedor: Vendedor;
  showValues?: boolean;
  highlighted?: boolean;
  showOwnValues?: boolean; // Para mostrar valores apenas do próprio vendedor
}

const getMedalIcon = (posicao: number) => {
  switch (posicao) {
    case 1:
      return <Trophy className="h-8 w-8 text-yellow-500 drop-shadow-lg" />;
    case 2:
      return <Medal className="h-7 w-7 text-gray-400" />;
    case 3:
      return <Award className="h-6 w-6 text-amber-600" />;
    default:
      return (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground font-bold">
          {posicao}º
        </div>
      );
  }
};

const getCardStyle = (posicao: number) => {
  switch (posicao) {
    case 1:
      return 'bg-gradient-to-br from-yellow-500/20 via-amber-500/10 to-orange-500/20 border-yellow-500/50 shadow-lg shadow-yellow-500/20';
    case 2:
      return 'bg-gradient-to-br from-gray-300/20 via-slate-400/10 to-gray-500/20 border-gray-400/50';
    case 3:
      return 'bg-gradient-to-br from-amber-600/20 via-orange-600/10 to-amber-700/20 border-amber-600/50';
    default:
      return 'bg-card border-border';
  }
};

const getProgressColor = (percentual: number) => {
  if (percentual >= 90) return 'bg-green-500';
  if (percentual >= 70) return 'bg-yellow-500';
  if (percentual >= 50) return 'bg-orange-500';
  return 'bg-red-500';
};

export function RankingCard({ vendedor, showValues = true, highlighted = false, showOwnValues = false }: RankingCardProps) {
  const faltaMeta = 100 - vendedor.percentual;
  const valorFaltante = vendedor.meta - vendedor.realizado;
  const diasRestantes = 15; // Exemplo: dias restantes no mês
  const vendaNecessariaDia = valorFaltante > 0 ? valorFaltante / diasRestantes : 0;
  
  // Mostrar valores se tiver permissão OU se for o próprio card destacado
  const canSeeValues = showValues || showOwnValues;

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl',
        getCardStyle(vendedor.posicao),
        highlighted && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
      )}
    >
      {/* Position badge */}
      <div className="absolute -right-2 -top-2 flex h-12 w-12 items-center justify-center">
        {getMedalIcon(vendedor.posicao)}
      </div>

      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 text-xl font-bold text-primary">
          {vendedor.nome.charAt(0)}
        </div>
        <div>
          <h3 className="font-semibold text-foreground">{vendedor.nome}</h3>
          <span className="text-sm text-muted-foreground">{vendedor.loja}</span>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Progresso da Meta</span>
          <span className="font-bold text-foreground">{vendedor.percentual}%</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-muted">
          <div
            className={cn('h-full rounded-full transition-all duration-500', getProgressColor(vendedor.percentual))}
            style={{ width: `${Math.min(vendedor.percentual, 100)}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-background/50 p-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Target className="h-3.5 w-3.5" />
            Falta p/ meta
          </div>
          <p className="mt-1 text-lg font-bold text-foreground">
            {canSeeValues ? `R$ ${Math.max(valorFaltante, 0).toLocaleString('pt-BR')}` : `${Math.max(faltaMeta, 0).toFixed(0)}%`}
          </p>
        </div>
        <div className="rounded-xl bg-background/50 p-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <TrendingUp className="h-3.5 w-3.5" />
            Precisa/dia
          </div>
          <p className="mt-1 text-lg font-bold text-foreground">
            {canSeeValues ? `R$ ${vendaNecessariaDia.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}` : '---'}
          </p>
        </div>
      </div>

      {canSeeValues && (
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-background/50 p-3">
            <p className="text-xs text-muted-foreground">Meta</p>
            <p className="text-sm font-semibold text-foreground">
              R$ {vendedor.meta.toLocaleString('pt-BR')}
            </p>
          </div>
          <div className="rounded-xl bg-background/50 p-3">
            <p className="text-xs text-muted-foreground">Faturamento</p>
            <p className="text-sm font-semibold text-primary">
              R$ {vendedor.realizado.toLocaleString('pt-BR')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

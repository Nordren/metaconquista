import { Vendedor } from '@/types/dashboard';
import { Trophy, Medal, Award, TrendingUp, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface RankingCardProps {
  vendedor: Vendedor;
  showValues?: boolean;
  highlighted?: boolean;
  showOwnValues?: boolean;
  index?: number;
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
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground font-bold text-sm">
          {posicao}º
        </div>
      );
  }
};

const getCardStyle = (posicao: number) => {
  switch (posicao) {
    case 1:
      return 'bg-gradient-to-br from-yellow-400/30 via-amber-400/20 to-orange-400/30 border-yellow-500 shadow-xl shadow-yellow-500/30 dark:from-yellow-500/40 dark:via-amber-500/30 dark:to-orange-500/40';
    case 2:
      return 'bg-gradient-to-br from-slate-300/40 via-gray-300/30 to-slate-400/40 border-slate-400 shadow-lg shadow-slate-400/25 dark:from-slate-400/50 dark:via-gray-400/40 dark:to-slate-500/50';
    case 3:
      return 'bg-gradient-to-br from-amber-500/30 via-orange-500/20 to-amber-600/30 border-amber-500 shadow-lg shadow-amber-500/25 dark:from-amber-500/40 dark:via-orange-500/30 dark:to-amber-600/40';
    default:
      return 'bg-card/95 border-border/80 shadow-lg dark:bg-card/90';
  }
};

const getProgressColor = (percentual: number) => {
  if (percentual >= 90) return 'bg-green-500';
  if (percentual >= 70) return 'bg-yellow-500';
  if (percentual >= 50) return 'bg-orange-500';
  return 'bg-red-500';
};

export function RankingCard({ 
  vendedor, 
  showValues = true, 
  highlighted = false, 
  showOwnValues = false,
  index = 0 
}: RankingCardProps) {
  const faltaMeta = 100 - vendedor.percentual;
  const valorFaltante = vendedor.meta - vendedor.realizado;
  const diasRestantes = 15;
  const vendaNecessariaDia = valorFaltante > 0 ? valorFaltante / diasRestantes : 0;
  
  const canSeeValues = showValues || showOwnValues;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.4, 
        delay: index * 0.08,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      whileHover={{ 
        scale: 1.02,
        transition: { duration: 0.2 }
      }}
      className={cn(
        'relative overflow-hidden rounded-2xl border-2 p-5 backdrop-blur-sm',
        getCardStyle(vendedor.posicao),
        highlighted && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
      )}
    >
      {/* Position badge */}
      <motion.div 
        className="absolute -right-2 -top-2 flex h-12 w-12 items-center justify-center"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: index * 0.08 + 0.2, type: "spring", stiffness: 200 }}
      >
        {getMedalIcon(vendedor.posicao)}
      </motion.div>

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
        <div className="h-3 overflow-hidden rounded-full bg-muted/60 dark:bg-muted/40">
          <motion.div
            className={cn('h-full rounded-full', getProgressColor(vendedor.percentual))}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(vendedor.percentual, 100)}%` }}
            transition={{ duration: 0.8, delay: index * 0.08 + 0.3, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-background/60 dark:bg-background/40 border border-border/60 p-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Target className="h-3.5 w-3.5" />
            Falta p/ meta
          </div>
          <p className="mt-1 text-lg font-bold text-foreground">
            {canSeeValues ? `R$ ${Math.max(valorFaltante, 0).toLocaleString('pt-BR')}` : `${Math.max(faltaMeta, 0).toFixed(0)}%`}
          </p>
        </div>
        <div className="rounded-xl bg-background/60 dark:bg-background/40 border border-border/60 p-3">
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
          <div className="rounded-xl bg-background/60 dark:bg-background/40 border border-border/60 p-3">
            <p className="text-xs text-muted-foreground">Meta</p>
            <p className="text-sm font-semibold text-foreground">
              R$ {vendedor.meta.toLocaleString('pt-BR')}
            </p>
          </div>
          <div className="rounded-xl bg-background/60 dark:bg-background/40 border border-border/60 p-3">
            <p className="text-xs text-muted-foreground">Faturamento</p>
            <p className="text-sm font-semibold text-primary">
              R$ {vendedor.realizado.toLocaleString('pt-BR')}
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
}

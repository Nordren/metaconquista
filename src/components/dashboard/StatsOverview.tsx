import { Vendedor } from '@/types/dashboard';
import { Target, TrendingUp, Users, Trophy } from 'lucide-react';

interface StatsOverviewProps {
  vendedores: Vendedor[];
  showValues?: boolean;
}

export function StatsOverview({ vendedores, showValues = true }: StatsOverviewProps) {
  const totalMeta = vendedores.reduce((acc, v) => acc + v.meta, 0);
  const totalRealizado = vendedores.reduce((acc, v) => acc + v.realizado, 0);
  const mediaPercentual = vendedores.length > 0 
    ? vendedores.reduce((acc, v) => acc + v.percentual, 0) / vendedores.length 
    : 0;
  const topVendedor = vendedores[0];

  const stats = [
    {
      label: 'Total Vendedores',
      value: vendedores.length.toString(),
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'Meta Total',
      value: showValues ? `R$ ${(totalMeta / 1000).toFixed(0)}k` : '---',
      icon: Target,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      label: 'Realizado',
      value: showValues ? `R$ ${(totalRealizado / 1000).toFixed(0)}k` : '---',
      icon: TrendingUp,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      label: 'Média %',
      value: `${mediaPercentual.toFixed(0)}%`,
      icon: Trophy,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-2xl border border-border bg-card p-4 transition-all hover:shadow-lg"
        >
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.bgColor}`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="text-xl font-bold text-foreground">{stat.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

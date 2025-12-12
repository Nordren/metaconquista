import { Vendedor } from '@/types/dashboard';
import { Trophy, Medal, Award } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TopPodiumProps {
  vendedores: Vendedor[];
  showValues?: boolean;
}

export function TopPodium({ vendedores, showValues = true }: TopPodiumProps) {
  const top3 = vendedores.slice(0, 3);
  
  if (top3.length < 3) return null;

  const [first, second, third] = top3;

  return (
    <div className="mb-8 flex items-end justify-center gap-4">
      {/* 2nd Place */}
      <div className="flex flex-col items-center">
        <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-gray-300 to-gray-500 text-2xl font-bold text-white shadow-lg">
          {second.nome.charAt(0)}
        </div>
        <Medal className="mb-1 h-6 w-6 text-gray-400" />
        <div className="flex h-24 w-24 flex-col items-center justify-center rounded-t-xl bg-gradient-to-b from-gray-400 to-gray-500 text-white">
          <span className="text-2xl font-bold">2º</span>
          {showValues && <span className="text-xs opacity-80">R$ {(second.realizado / 1000).toFixed(0)}k</span>}
        </div>
        <p className="mt-2 text-center text-sm font-medium text-foreground">{second.nome}</p>
      </div>

      {/* 1st Place */}
      <div className="flex flex-col items-center">
        <div className="mb-2 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-3xl font-bold text-white shadow-xl ring-4 ring-primary/30">
          {first.nome.charAt(0)}
        </div>
        <Trophy className="mb-1 h-8 w-8 text-primary drop-shadow-lg" />
        <div className="flex h-32 w-28 flex-col items-center justify-center rounded-t-xl bg-gradient-to-b from-primary to-accent text-white shadow-lg">
          <span className="text-3xl font-bold">1º</span>
          {showValues && <span className="text-sm opacity-90">R$ {(first.realizado / 1000).toFixed(0)}k</span>}
        </div>
        <p className="mt-2 text-center font-semibold text-foreground">{first.nome}</p>
      </div>

      {/* 3rd Place */}
      <div className="flex flex-col items-center">
        <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-amber-600 to-amber-800 text-xl font-bold text-white shadow-lg">
          {third.nome.charAt(0)}
        </div>
        <Award className="mb-1 h-5 w-5 text-amber-600" />
        <div className="flex h-20 w-20 flex-col items-center justify-center rounded-t-xl bg-gradient-to-b from-amber-600 to-amber-800 text-white">
          <span className="text-xl font-bold">3º</span>
          {showValues && <span className="text-xs opacity-80">R$ {(third.realizado / 1000).toFixed(0)}k</span>}
        </div>
        <p className="mt-2 text-center text-sm font-medium text-foreground">{third.nome}</p>
      </div>
    </div>
  );
}

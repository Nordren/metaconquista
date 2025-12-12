import { Button } from '@/components/ui/button';
import { Store } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StoreFilterProps {
  lojas: readonly string[];
  selected: string | null;
  onSelect: (loja: string | null) => void;
}

export function StoreFilter({ lojas, selected, onSelect }: StoreFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Store className="h-5 w-5 text-muted-foreground" />
      <Button
        variant={selected === null ? 'default' : 'outline'}
        size="sm"
        onClick={() => onSelect(null)}
        className="rounded-full"
      >
        Todas
      </Button>
      {lojas.map((loja) => (
        <Button
          key={loja}
          variant={selected === loja ? 'default' : 'outline'}
          size="sm"
          onClick={() => onSelect(loja)}
          className="rounded-full"
        >
          {loja}
        </Button>
      ))}
    </div>
  );
}

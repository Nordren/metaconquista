import { Calendar } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface MonthSelectorProps {
  selectedMonth: string;
  onMonthChange: (month: string) => void;
}

// Gerar opções de meses (últimos 12 meses + próximo mês)
function generateMonthOptions(): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];
  const now = new Date();
  
  // Gerar dos últimos 12 meses até o mês atual
  for (let i = 11; i >= -1; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2);
    
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    
    options.push({
      value: `${month}-${year}`,
      label: `${monthNames[date.getMonth()]} de ${date.getFullYear()}`,
    });
  }
  
  return options.reverse();
}

// Obter o mês atual no formato MM-YY
export function getCurrentMonth(): string {
  const now = new Date();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const year = now.getFullYear().toString().slice(-2);
  return `${month}-${year}`;
}

export function MonthSelector({ selectedMonth, onMonthChange }: MonthSelectorProps) {
  const options = generateMonthOptions();
  
  return (
    <div className="flex items-center gap-2">
      <Calendar className="h-4 w-4 text-muted-foreground" />
      <Select value={selectedMonth} onValueChange={onMonthChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Selecione o mês" />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

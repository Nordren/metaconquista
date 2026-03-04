import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SPREADSHEET_ID = '1RqkywXRBaYpdCJ2lzfa8ClQbw6TRfs2aJJu0TAdpE3U';
const LOJA_NAME = 'Eletrocell';

function getCurrentMonthCode(): string {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yy = String(now.getFullYear()).slice(-2);
  return `${mm}-${yy}`;
}

function getSheetUrl(): string {
  // Default first sheet (gid=0)
  return `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv`;
}

function normalizeKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const monthCode = getCurrentMonthCode();
    console.log('Starting Eletrocell sync for period:', monthCode);

    const sheetUrl = getSheetUrl();
    console.log('Fetching CSV:', sheetUrl);

    const csvResponse = await fetch(sheetUrl);
    if (!csvResponse.ok) {
      throw new Error(`Failed to fetch spreadsheet: ${csvResponse.statusText}`);
    }

    const csvText = await csvResponse.text();
    const rows = parseCSV(csvText);
    console.log(`Parsed ${rows.length} rows from CSV`);

    if (rows.length === 0) {
      return new Response(JSON.stringify({ success: true, message: 'No data to sync', period: monthCode }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Load vendedor_links for Eletrocell
    const { data: links } = await supabase
      .from('vendedor_links')
      .select('nome, loja, user_id')
      .eq('loja', LOJA_NAME);

    const linkMap = new Map<string, string>();
    for (const l of links || []) {
      linkMap.set(normalizeKey(l.nome), l.user_id);
    }

    // Delete existing Eletrocell data for this period
    const { error: deleteError } = await supabase
      .from('vendedores')
      .delete()
      .eq('period', monthCode)
      .eq('loja', LOJA_NAME);

    if (deleteError) {
      throw new Error(`Failed to clear existing data: ${deleteError.message}`);
    }

    // Transform data
    const rawVendedores = rows
      .map((row) => {
        const nome = row['Nome do Vendedor'] || '';
        const realizado = parseNumber(row['Valor Total Vendido']);
        const meta = parseNumber(row['Meta']);
        const percentual = meta > 0 ? Math.round((realizado / meta) * 100) : 0;

        const user_id = linkMap.get(normalizeKey(nome)) ?? null;

        return {
          nome,
          loja: LOJA_NAME,
          meta,
          realizado,
          percentual,
          venda_dia: 0,
          user_id,
          period: monthCode,
        };
      })
      .filter((v) => v.nome);

    // Sort by realizado desc and set posicao
    const vendedores = rawVendedores
      .sort((a, b) => b.realizado - a.realizado)
      .map((v, index) => ({ ...v, posicao: index + 1 }));

    console.log(`Inserting ${vendedores.length} vendedores for Eletrocell...`);

    const { data, error: insertError } = await supabase
      .from('vendedores')
      .insert(vendedores)
      .select();

    if (insertError) {
      throw new Error(`Failed to insert data: ${insertError.message}`);
    }

    console.log(`Eletrocell sync completed. Inserted ${data?.length || 0} records.`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Synced ${data?.length || 0} vendedores Eletrocell`,
        period: monthCode,
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Eletrocell sync error:', error);
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function parseCSV(csvText: string): Record<string, string>[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]);
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === headers.length) {
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header.trim()] = values[index]?.trim() || '';
      });
      rows.push(row);
    }
  }
  return rows;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function parseNumber(value: string | undefined): number {
  if (!value) return 0;
  const normalized = value.replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '');
  return parseFloat(normalized) || 0;
}

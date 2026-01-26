import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Google Sheets
const SPREADSHEET_ID = '1vpiD3Qxk1G3rvpTXH2aJ2piWTzIaxknyi-eSiE9KsCM';

function getCurrentMonthCode(): string {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yy = String(now.getFullYear()).slice(-2);
  return `${mm}-${yy}`;
}

function getSheetUrl(monthCode: string): string {
  const sheetName = `Acompanhamento ${monthCode}`;
  // gviz CSV export supports selecting the sheet by name
  return `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Read period/month code from body
    let monthCode = getCurrentMonthCode();
    try {
      const body = await req.json();
      if (body?.month && typeof body.month === 'string') {
        monthCode = body.month;
      }
    } catch {
      // ignore
    }

    console.log('Starting Google Sheets sync for period:', monthCode);

    const sheetUrl = getSheetUrl(monthCode);
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

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Load persistent links (nome+loja -> user_id)
    const { data: links, error: linksError } = await supabase
      .from('vendedor_links')
      .select('nome, loja, user_id');

    if (linksError) {
      console.error('Error fetching vendedor_links:', linksError);
      throw new Error(`Failed to fetch links: ${linksError.message}`);
    }

    const linkMap = new Map<string, string>();
    for (const l of links || []) {
      const key = `${normalizeKey(l.nome)}::${normalizeKey(l.loja)}`;
      linkMap.set(key, l.user_id);
    }

    // Replace only the selected month period (do NOT wipe all history)
    const { error: deleteError } = await supabase
      .from('vendedores')
      .delete()
      .eq('period', monthCode);

    if (deleteError) {
      console.error('Delete error:', deleteError);
      throw new Error(`Failed to clear existing data for period ${monthCode}: ${deleteError.message}`);
    }

    // Transform and insert data
    const rawVendedores = rows
      .map((row) => {
        // Mapeamento exato das colunas da planilha:
        // Vendedora (B) → nome
        // Loja (D) → loja
        // Meta Atual (F) → meta
        // Venda (G) → realizado
        // % (H) → percentual
        // Venda/Dia (K) → venda_dia
        const nome = row['Vendedora'] || row.Vendedora || row.vendedora || '';
        const loja = row['Loja'] || row.Loja || row.loja || '';
        const meta = parseNumber(row['Meta Atual'] || row['Meta atual'] || row.meta);
        const realizado = parseNumber(row['Venda'] || row.Venda || row.venda);
        const percentual = parseNumber(row['%'] || row.percentual);
        const venda_dia = parseNumber(row['Venda/Dia Hoje'] || row['Venda/Dia hoje'] || row['Venda/Dia'] || row['Venda/dia'] || row.venda_dia);

        const key = `${normalizeKey(nome)}::${normalizeKey(loja)}`;
        const user_id = linkMap.get(key) ?? null;

        return {
          nome,
          loja,
          meta,
          realizado,
          percentual,
          venda_dia,
          user_id,
          period: monthCode,
        };
      })
      .filter((v) => v.nome && v.loja);

    // Sort by realizado desc and set posicao
    const vendedores = rawVendedores
      .sort((a, b) => (b.realizado as number) - (a.realizado as number))
      .map((v, index) => ({ ...v, posicao: index + 1 }));

    console.log(`Inserting ${vendedores.length} vendedores for ${monthCode}...`);

    const { data, error: insertError } = await supabase
      .from('vendedores')
      .insert(vendedores)
      .select();

    if (insertError) {
      console.error('Insert error:', insertError);
      throw new Error(`Failed to insert data: ${insertError.message}`);
    }

    console.log(`Sync completed successfully. Inserted ${data?.length || 0} records.`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Synced ${data?.length || 0} vendedores`,
        period: monthCode,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Sync error:', error);
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function parseCSV(csvText: string): Record<string, string>[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  // Parse header row
  const headers = parseCSVLine(lines[0]);

  // Parse data rows
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
  // Handle Brazilian number format (comma as decimal separator)
  const normalized = value.replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '');
  return parseFloat(normalized) || 0;
}

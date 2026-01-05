import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Google Sheets CSV export URL
const SPREADSHEET_ID = '1vpiD3Qxk1G3rvpTXH2aJ2piWTzIaxknyi-eSiE9KsCM';

// Função para construir a URL do CSV com o nome da aba específica
function getSheetUrl(monthCode?: string): string {
  const sheetName = monthCode ? `Acompanhamento ${monthCode}` : undefined;
  if (sheetName) {
    return `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
  }
  return `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv`;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body to get month parameter
    let monthCode: string | undefined;
    try {
      const body = await req.json();
      monthCode = body.month; // formato: "01-26" para janeiro de 2026
      console.log('Month code received:', monthCode);
    } catch {
      // Se não houver body, usa a aba padrão
      console.log('No month specified, using default sheet');
    }

    console.log('Starting Google Sheets sync...');
    
    const sheetUrl = getSheetUrl(monthCode);
    console.log('Fetching from URL:', sheetUrl);
    
    // Fetch CSV from Google Sheets
    const csvResponse = await fetch(sheetUrl);
    if (!csvResponse.ok) {
      throw new Error(`Failed to fetch spreadsheet: ${csvResponse.statusText}`);
    }
    
    const csvText = await csvResponse.text();
    console.log('CSV fetched successfully, parsing...');
    
    // Parse CSV
    const rows = parseCSV(csvText);
    console.log(`Parsed ${rows.length} rows from CSV`);
    
    if (rows.length === 0) {
      return new Response(JSON.stringify({ success: true, message: 'No data to sync' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Clear existing data and insert new
    const { error: deleteError } = await supabase
      .from('vendedores')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows

    if (deleteError) {
      console.error('Delete error:', deleteError);
      throw new Error(`Failed to clear existing data: ${deleteError.message}`);
    }

    // Transform and insert data
    const vendedores = rows
      .map((row, index) => {
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
        const venda_dia = parseNumber(row['Venda/Dia'] || row['Venda/dia'] || row.venda_dia);

        return {
          nome,
          loja,
          meta,
          realizado,
          percentual,
          venda_dia,
          posicao: index + 1,
        };
      })
      .filter((v) => v.nome && v.loja);

    console.log(`Inserting ${vendedores.length} vendedores...`);

    const { data, error: insertError } = await supabase
      .from('vendedores')
      .insert(vendedores)
      .select();

    if (insertError) {
      console.error('Insert error:', insertError);
      throw new Error(`Failed to insert data: ${insertError.message}`);
    }

    console.log(`Sync completed successfully. Inserted ${data?.length || 0} records.`);

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Synced ${data?.length || 0} vendedores`,
      month: monthCode,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Sync error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
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

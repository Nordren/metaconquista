import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Google Sheets CSV export URL
const SPREADSHEET_ID = '1vpiD3Qxk1G3rvpTXH2aJ2piWTzIaxknyi-eSiE9KsCM';
const SHEET_CSV_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv`;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting Google Sheets sync...');
    
    // Fetch CSV from Google Sheets
    const csvResponse = await fetch(SHEET_CSV_URL);
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
    const vendedores = rows.map((row, index) => ({
      nome: row.nome || row.Nome || '',
      loja: row.loja || row.Loja || '',
      meta: parseNumber(row.meta || row.Meta),
      realizado: parseNumber(row.realizado || row.Realizado),
      percentual: parseNumber(row.percentual || row.Percentual || row['%']),
      venda_dia: parseNumber(row.venda_dia || row.vendaDia || row['Venda Dia'] || row['Venda/Dia']),
      posicao: parseInt(row.posicao || row.Posicao || row['Posição'] || String(index + 1)) || (index + 1),
    })).filter(v => v.nome && v.loja);

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

/// <reference types="vite/client" />
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const DEFAULT_SUPABASE_PROJECT_ID = 'tedohrisefskbgpuadvp';
export const DEFAULT_SUPABASE_URL = `https://${DEFAULT_SUPABASE_PROJECT_ID}.supabase.co`;
export const DEFAULT_SUPABASE_ANON_KEY = 
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlZG9ocmlzZWZza2JncHVhZHZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkxODYyODgsImV4cCI6MjEwNDc2MjI4OH0.MSxcPuG1doOBDO6JK2atX1DDWddrMXKk6-UedmZxeAI';

export function getSupabaseProjectId(): string {
  return localStorage.getItem('sams_supabase_project_id') || DEFAULT_SUPABASE_PROJECT_ID;
}

export function getSupabaseUrl(): string {
  const custom = localStorage.getItem('sams_supabase_url');
  if (custom && custom.trim()) return custom.trim();
  const projId = getSupabaseProjectId();
  return `https://${projId}.supabase.co`;
}

export function getSupabaseAnonKey(): string {
  return localStorage.getItem('sams_supabase_anon_key') || DEFAULT_SUPABASE_ANON_KEY;
}

export function saveSupabaseConfig(projectId: string, anonKey?: string, url?: string): void {
  const cleanId = projectId.trim() || DEFAULT_SUPABASE_PROJECT_ID;
  localStorage.setItem('sams_supabase_project_id', cleanId);
  if (url && url.trim()) {
    localStorage.setItem('sams_supabase_url', url.trim());
  } else {
    localStorage.setItem('sams_supabase_url', `https://${cleanId}.supabase.co`);
  }
  if (anonKey && anonKey.trim()) {
    localStorage.setItem('sams_supabase_anon_key', anonKey.trim());
  }
  // Re-instantiate client
  supabase = createClientInstance();
}

export function resetSupabaseConfig(): void {
  localStorage.removeItem('sams_supabase_project_id');
  localStorage.removeItem('sams_supabase_url');
  localStorage.removeItem('sams_supabase_anon_key');
  supabase = createClientInstance();
}

function createClientInstance(): SupabaseClient {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  return createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

// Global active client
export let supabase: SupabaseClient = createClientInstance();

export interface TableCheckStatus {
  name: string;
  exists: boolean;
  count?: number;
  error?: string;
}

export interface SupabaseConnectionStatus {
  isConnected: boolean;
  hasTables: boolean;
  message: string;
  projectId: string;
  url: string;
  tableDetails: TableCheckStatus[];
}

/**
 * Checks connection to the Supabase instance and verifies all attendance tables.
 */
export async function checkSupabaseConnection(): Promise<SupabaseConnectionStatus> {
  const projId = getSupabaseProjectId();
  const currentUrl = getSupabaseUrl();
  const tables = ['users', 'classes', 'subjects', 'students', 'attendance_records', 'attendance_entries'];
  const tableDetails: TableCheckStatus[] = [];

  let anyTableOnline = false;
  let connectionFailed = false;
  let generalErrorMsg = '';

  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        if (error.code === '42P01' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
          tableDetails.push({ name: table, exists: false, error: 'Table does not exist yet' });
        } else {
          tableDetails.push({ name: table, exists: false, error: error.message });
          if (error.message?.includes('FetchError') || error.message?.includes('Failed to fetch')) {
            connectionFailed = true;
            generalErrorMsg = error.message;
          }
        }
      } else {
        tableDetails.push({ name: table, exists: true, count: count ?? (data ? data.length : 0) });
        anyTableOnline = true;
      }
    } catch (err: any) {
      tableDetails.push({ name: table, exists: false, error: err?.message || 'Query failed' });
      connectionFailed = true;
      generalErrorMsg = err?.message || 'Network request failed';
    }
  }

  if (connectionFailed && !anyTableOnline) {
    return {
      isConnected: false,
      hasTables: false,
      message: generalErrorMsg || 'Could not reach Supabase endpoint. Check Project ID or Anon Key.',
      projectId: projId,
      url: currentUrl,
      tableDetails,
    };
  }

  const allTablesOnline = tableDetails.every((t) => t.exists);

  if (allTablesOnline) {
    return {
      isConnected: true,
      hasTables: true,
      message: 'Active Supabase Connection • All 6 Tables Online & Synchronized',
      projectId: projId,
      url: currentUrl,
      tableDetails,
    };
  }

  if (anyTableOnline) {
    const missing = tableDetails.filter((t) => !t.exists).map((t) => t.name).join(', ');
    return {
      isConnected: true,
      hasTables: false,
      message: `Connected! Missing tables: [${missing}]. Run the provided SQL script to create them.`,
      projectId: projId,
      url: currentUrl,
      tableDetails,
    };
  }

  return {
    isConnected: true,
    hasTables: false,
    message: 'Connected to Supabase project! No tables found yet. Please copy the schema SQL into the Supabase SQL editor and run it.',
    projectId: projId,
    url: currentUrl,
    tableDetails,
  };
}

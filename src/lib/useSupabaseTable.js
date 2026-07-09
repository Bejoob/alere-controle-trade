import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../db.js';

/** Busca todas as linhas de uma tabela e mantém em sincronia via Supabase Realtime. */
export function useSupabaseTable(table) {
  const [dados, setDados] = useState([]);

  const recarregar = useCallback(async () => {
    const { data, error } = await supabase.from(table).select('*').order('id', { ascending: true });
    if (error) {
      console.error(`Erro ao carregar "${table}":`, error.message);
      return;
    }
    setDados(data ?? []);
  }, [table]);

  useEffect(() => {
    recarregar();
    const canal = supabase
      .channel(`public:${table}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, recarregar)
      .subscribe();
    return () => {
      supabase.removeChannel(canal);
    };
  }, [table, recarregar]);

  return dados;
}

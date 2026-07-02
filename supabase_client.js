(function () {
  'use strict';

  const SUPABASE_URL = 'https://ytygsnmirkarrtqeawqm.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0eWdzbm1pcmthcnJ0cWVhd3FtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1NDE2NTgsImV4cCI6MjA5ODExNzY1OH0.cw5miEqfwD1zKl98cyLXYt2_lWpqvpm79I4ZCQwfqa4';

  const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    }
  });

  // ==================
  // Auth
  // ==================
  async function signUp(email, password, name, farmName) {
    const { data, error } = await sb.auth.signUp({
      email,
      password,
      options: { data: { name, farm_name: farmName } },
    });
    if (error) throw error;
    return data;
  }

  async function signIn(email, password) {
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  async function signOut() {
    const { error } = await sb.auth.signOut();
    if (error) throw error;
  }

  async function getSession() {
    const { data } = await sb.auth.getSession();
    return data.session;
  }

  async function getUserProfile() {
    const session = await getSession();
    if (!session) return null;
    const { data, error } = await sb
      .from('profiles')
      .select('name, farm_name')
      .eq('id', session.user.id)
      .single();
    if (error) return null;
    return data;
  }

  // ==================
  // 内検履歴
  // ==================
  async function loadInspRecords() {
    const { data, error } = await sb
      .from('insp_records')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(r => ({
      id: r.id,
      colony: r.colony,
      date: r.date,
      time: r.time,
      weather: r.weather,
      frames: r.frames,
      frameMemo: r.frame_memo,
      aiMemo: r.ai_memo,
    }));
  }

  async function saveInspRecord(record) {
    const session = await getSession();
    if (!session) throw new Error('ログインが必要です');
    const { error } = await sb.from('insp_records').insert({
      user_id: session.user.id,
      colony: record.colony,
      date: record.date,
      time: record.time,
      weather: record.weather,
      frames: record.frames,
      count_mode: record.countMode || 'frame',
      frame_details: record.countMode === 'frame' ? (record.frameDetails || {}) : (record.spaceLevels || {}),
      space_count: record.spaceCount || null,
      frame_memo: record.frameMemo || '',
      ai_memo: record.aiMemo || '',
    });
    if (error) throw error;
  }

  // ==================
  // 作業履歴
  // ==================
  async function loadWorkRecords() {
    const { data, error } = await sb
      .from('work_records')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(r => ({
      id: r.id,
      type: r.type,
      colony: r.colony,
      date: r.date,
      time: r.time,
      memo: r.memo,
      detail: (r.colony ? r.colony + ' ' : '') + (r.memo || r.type),
    }));
  }

  async function updateProfile(name, farmName) {
    const session = await getSession();
    if (!session) throw new Error('ログインが必要です');
    const { error } = await sb.from('profiles').update({
      name,
      farm_name: farmName,
    }).eq('id', session.user.id);
    if (error) throw error;
  }

  async function saveWorkRecord(record) {
    const session = await getSession();
    if (!session) throw new Error('ログインが必要です');
    const { error } = await sb.from('work_records').insert({
      user_id: session.user.id,
      type: record.type,
      colony: record.colony,
      date: record.date,
      time: record.time,
      memo: record.memo || '',
      yield_kg: record.yieldKg || null,
    });
    if (error) throw error;
  }

  // Expose API
  window.HoneyDB = {
    signUp,
    signIn,
    signOut,
    getSession,
    getUserProfile,
    updateProfile,
    loadInspRecords,
    saveInspRecord,
    loadWorkRecords,
    saveWorkRecord,
  };
})();

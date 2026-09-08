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
    if (error) {
      if (!error.message || error.message === '{}') {
        const e = new Error(error.status === 429 ? 'リクエストが多すぎます。しばらく待ってから再試行してください' : 'サーバーエラーが発生しました');
        throw e;
      }
      throw error;
    }
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

  async function resetPassword(email) {
    const { error } = await sb.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/HoneyOS/',
    });
    if (error) throw error;
  }

  // ==================
  // プロファイル
  // ==================
  async function updateProfile(name, farmName) {
    const session = await getSession();
    if (!session) throw new Error('ログインが必要です');
    const { error } = await sb.from('profiles').update({
      name,
      farm_name: farmName,
    }).eq('id', session.user.id);
    if (error) throw error;
  }

  // ==================
  // 養蜂場管理
  // ==================
  async function loadFarms() {
    const { data, error } = await sb
      .from('farms')
      .select('*')
      .is('archived_at', null)
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return (data || []).map(r => ({
      id: r.id,
      name: r.name,
      latitude: r.latitude || null,
      longitude: r.longitude || null,
      sortOrder: r.sort_order,
      archivedAt: r.archived_at || null,
    }));
  }

  async function saveFarm(name, id, opts = {}) {
    const session = await getSession();
    if (!session) throw new Error('ログインが必要です');
    const payload = {
      name,
      latitude: opts.latitude ?? null,
      longitude: opts.longitude ?? null,
    };
    if (id) {
      const { error } = await sb.from('farms').update(payload).eq('id', id).eq('user_id', session.user.id);
      if (error) throw error;
    } else {
      const { error } = await sb.from('farms').insert({ user_id: session.user.id, ...payload });
      if (error) throw error;
    }
  }

  async function archiveFarm(id) {
    const { error } = await sb.from('farms').update({ archived_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
  }

  async function deleteFarm(id) {
    const { error } = await sb.from('farms').delete().eq('id', id);
    if (error) throw error;
  }

  // ==================
  // 蜂群管理
  // ==================
  async function loadColonies() {
    const { data, error } = await sb
      .from('colonies')
      .select('*')
      .is('archived_at', null)
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return (data || []).map(r => ({
      id: r.id,
      name: r.name,
      farmId: r.farm_id || null,
      colonyType: r.colony_type || null,
      sortOrder: r.sort_order,
      archivedAt: r.archived_at || null,
    }));
  }

  async function saveColony(id, name, sortOrder, opts = {}) {
    const session = await getSession();
    if (!session) throw new Error('ログインが必要です');
    const { error } = await sb.from('colonies').upsert({
      id,
      user_id: session.user.id,
      name: name || id,
      farm_id: opts.farmId ?? null,
      colony_type: opts.colonyType ?? null,
      sort_order: sortOrder || 0,
    }, { onConflict: 'id,user_id' });
    if (error) throw error;
  }

  async function archiveColony(id) {
    const { error } = await sb.from('colonies').update({ archived_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
  }

  async function deleteColony(id) {
    const { error } = await sb.from('colonies').delete().eq('id', id);
    if (error) throw error;
  }

  async function initDefaultColonies(ids) {
    const session = await getSession();
    if (!session) return;
    const existing = await loadColonies();
    if (existing.length > 0) return;
    for (let i = 0; i < ids.length; i++) {
      await saveColony(ids[i], ids[i], i);
    }
  }

  // ==================
  // 内検記録
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
      frames: r.frames || [],
      countMode: r.count_mode || 'frame',
      frameDetails: r.frame_details || {},
      spaceCount: r.space_count || 10,
      spaceLevels: r.space_levels && Object.keys(r.space_levels).length
        ? r.space_levels
        : (r.frame_details && r.count_mode === 'space' ? r.frame_details : {}),
      structure: r.structure || {},
      queenPresent: r.queen_present != null ? r.queen_present : null,
      queenStatus: r.queen_status || null,
      beesTotal: r.bees_total != null ? r.bees_total : null,
      frameMemo: r.frame_memo || '',
      aiMemo: r.ai_memo || '',
      swarmRisk: r.swarm_risk || false,
    }));
  }

  async function saveInspRecord(record) {
    const session = await getSession();
    if (!session) throw new Error('ログインが必要です');
    const { data, error } = await sb.from('insp_records').insert({
      user_id: session.user.id,
      colony: record.colony,
      date: record.date,
      time: record.time,
      weather: record.weather,
      frames: record.frames || [],
      count_mode: record.countMode || 'frame',
      frame_details: record.frameDetails || {},
      space_count: record.spaceCount || null,
      space_levels: record.spaceLevels || {},
      structure: record.structure || {},
      queen_present: record.queenPresent != null ? record.queenPresent : null,
      queen_status: record.queenStatus || null,
      bees_total: record.beesTotal != null ? record.beesTotal : null,
      frame_memo: record.frameMemo || '',
      ai_memo: record.aiMemo || '',
      swarm_risk: record.swarmRisk || false,
    }).select('id').single();
    if (error) throw error;
    return data ? data.id : null;
  }

  async function updateInspRecord(id, record) {
    const { error } = await sb.from('insp_records').update({
      colony: record.colony,
      date: record.date,
      time: record.time,
      weather: record.weather,
      frames: record.frames || [],
      count_mode: record.countMode || 'frame',
      frame_details: record.frameDetails || {},
      space_count: record.spaceCount || null,
      space_levels: record.spaceLevels || {},
      structure: record.structure || {},
      queen_present: record.queenPresent != null ? record.queenPresent : null,
      queen_status: record.queenStatus || null,
      bees_total: record.beesTotal != null ? record.beesTotal : null,
      frame_memo: record.frameMemo || '',
      ai_memo: record.aiMemo || '',
      swarm_risk: record.swarmRisk != null ? record.swarmRisk : false,
    }).eq('id', id);
    if (error) throw error;
  }

  async function deleteInspRecord(id) {
    const { error } = await sb.from('insp_records').delete().eq('id', id);
    if (error) throw error;
  }

  // ==================
  // 作業記録
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
      colony: r.colony || '',
      colonyIds: r.colony_ids && r.colony_ids.length ? r.colony_ids : (r.colony ? [r.colony] : []),
      date: r.date,
      time: r.time,
      memo: r.memo || '',
      yieldKg: r.yield_kg != null ? r.yield_kg : null,
      harvestMethod: r.harvest_method || null,
      feedType: r.feed_type || null,
      feedAmount: r.feed_amount || null,
      medicationName: r.medication_name || null,
      nextTreatmentDate: r.next_treatment_date || null,
      swarmType: r.swarm_type || null,
      photoUrls: r.photo_urls || [],
      detail: (r.colony ? r.colony + ' ' : '') + (r.memo || r.type),
    }));
  }

  async function saveWorkRecord(record) {
    const session = await getSession();
    if (!session) throw new Error('ログインが必要です');
    const colonyIds = record.colonyIds && record.colonyIds.length
      ? record.colonyIds
      : (record.colony ? [record.colony] : []);
    const { error } = await sb.from('work_records').insert({
      user_id: session.user.id,
      type: record.type,
      colony: colonyIds[0] || '',
      colony_ids: colonyIds,
      date: record.date,
      time: record.time,
      memo: record.memo || '',
      yield_kg: record.yieldKg != null ? record.yieldKg : null,
      harvest_method: record.harvestMethod || null,
      feed_type: record.feedType || null,
      feed_amount: record.feedAmount || null,
      medication_name: record.medicationName || null,
      next_treatment_date: record.nextTreatmentDate || null,
      swarm_type: record.swarmType || null,
      photo_urls: record.photoUrls || [],
    });
    if (error) throw error;
  }

  async function updateWorkRecord(id, record) {
    const colonyIds = record.colonyIds && record.colonyIds.length
      ? record.colonyIds
      : (record.colony ? [record.colony] : []);
    const { error } = await sb.from('work_records').update({
      type: record.type,
      colony: colonyIds[0] || '',
      colony_ids: colonyIds,
      date: record.date,
      time: record.time,
      memo: record.memo || '',
      yield_kg: record.yieldKg != null ? record.yieldKg : null,
      harvest_method: record.harvestMethod || null,
      feed_type: record.feedType || null,
      feed_amount: record.feedAmount || null,
      medication_name: record.medicationName || null,
      next_treatment_date: record.nextTreatmentDate || null,
      swarm_type: record.swarmType || null,
      photo_urls: record.photoUrls || [],
    }).eq('id', id);
    if (error) throw error;
  }

  async function deleteWorkRecord(id) {
    const { error } = await sb.from('work_records').delete().eq('id', id);
    if (error) throw error;
  }

  // ==================
  // タスク
  // ==================
  async function loadTasks() {
    const { data, error } = await sb
      .from('tasks')
      .select('*')
      .order('due_date', { ascending: true });
    if (error) throw error;
    return (data || []).map(r => ({
      id: r.id,
      title: r.title,
      dueDate: r.due_date || null,
      priority: r.priority || 'medium',
      colonyIds: r.colony_ids || [],
      farmId: r.farm_id || null,
      memo: r.memo || '',
      isCompleted: r.is_completed || false,
      completedAt: r.completed_at || null,
      reminderEnabled: r.reminder_enabled || false,
      recurrenceRule: r.recurrence_rule || null,
      createdAt: r.created_at,
    }));
  }

  async function getTasks() {
    const session = await getSession();
    if (!session) return [];
    const { data, error } = await sb.from('tasks').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(r => ({
      id: r.id, title: r.title || '', type: r.title || '', colony: (r.colony_ids||[])[0] || '',
      dueDate: r.due_date || '', priority: r.priority || 'medium', memo: r.memo || '',
      status: r.is_completed ? 'done' : 'todo', date: r.due_date || '',
    }));
  }

  async function saveTask(task) {
    const session = await getSession();
    if (!session) throw new Error('ログインが必要です');
    const { data, error } = await sb.from('tasks').insert({
      user_id: session.user.id,
      title: task.title,
      due_date: task.dueDate || null,
      priority: task.priority || 'medium',
      colony_ids: task.colonyIds || [],
      farm_id: task.farmId || null,
      memo: task.memo || '',
      is_completed: task.isCompleted || false,
      completed_at: task.completedAt || null,
      reminder_enabled: task.reminderEnabled || false,
      recurrence_rule: task.recurrenceRule || null,
    }).select('id').single();
    if (error) throw error;
    return data ? data.id : null;
  }

  async function updateTask(id, task) {
    const patch = {};
    if (task.title !== undefined)           patch.title = task.title;
    if (task.dueDate !== undefined)         patch.due_date = task.dueDate;
    if (task.priority !== undefined)        patch.priority = task.priority;
    if (task.colonyIds !== undefined)       patch.colony_ids = task.colonyIds;
    if (task.farmId !== undefined)          patch.farm_id = task.farmId;
    if (task.memo !== undefined)            patch.memo = task.memo;
    if (task.isCompleted !== undefined)     patch.is_completed = task.isCompleted;
    if (task.completedAt !== undefined)     patch.completed_at = task.completedAt;
    if (task.reminderEnabled !== undefined) patch.reminder_enabled = task.reminderEnabled;
    if (task.recurrenceRule !== undefined)  patch.recurrence_rule = task.recurrenceRule;
    const { error } = await sb.from('tasks').update(patch).eq('id', id);
    if (error) throw error;
  }

  async function completeTask(id) {
    const { error } = await sb.from('tasks').update({
      is_completed: true,
      completed_at: new Date().toISOString(),
    }).eq('id', id);
    if (error) throw error;
  }

  async function deleteTask(id) {
    const { error } = await sb.from('tasks').delete().eq('id', id);
    if (error) throw error;
  }

  // ==================
  // Realtime
  // ==================
  let _realtimeChannel = null;

  function subscribeRealtime(onInspChange, onWorkChange, onTaskChange) {
    if (_realtimeChannel) return;
    _realtimeChannel = sb
      .channel('honeyos-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'insp_records' }, async () => {
        try { onInspChange(await loadInspRecords()); } catch(e) {}
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'work_records' }, async () => {
        try { onWorkChange(await loadWorkRecords()); } catch(e) {}
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, async () => {
        try { if (onTaskChange) onTaskChange(await loadTasks()); } catch(e) {}
      })
      .subscribe();
  }

  function unsubscribeRealtime() {
    if (_realtimeChannel) {
      sb.removeChannel(_realtimeChannel);
      _realtimeChannel = null;
    }
  }

  // ==================
  // Push通知購読
  // ==================
  async function savePushSubscription(sub) {
    const session = await getSession();
    if (!session) throw new Error('ログインが必要です');
    const keys = sub.toJSON ? sub.toJSON().keys : sub.keys;
    const { error } = await sb.from('push_subscriptions').upsert({
      user_id: session.user.id,
      endpoint: sub.endpoint,
      p256dh: keys.p256dh,
      auth_key: keys.auth,
    }, { onConflict: 'user_id,endpoint' });
    if (error) throw error;
  }

  async function deletePushSubscription(endpoint) {
    const { error } = await sb.from('push_subscriptions').delete().eq('endpoint', endpoint);
    if (error) throw error;
  }

  // ==================
  // データエクスポート
  // ==================
  async function exportAllData() {
    const session = await getSession();
    if (!session) throw new Error('ログインが必要です');
    const [inspRecs, workRecs, tasks, profile] = await Promise.all([
      loadInspRecords(),
      loadWorkRecords(),
      loadTasks(),
      getUserProfile(),
    ]);
    return {
      exportedAt: new Date().toISOString(),
      profile,
      inspRecords: inspRecs,
      workRecords: workRecs,
      tasks,
    };
  }

  // ==================
  // 匿名ベンチマーク
  // ==================
  async function upsertBenchmark(avgHealth, colonyCount) {
    const session = await getSession();
    if (!session) return;
    const { error } = await sb.from('benchmarks').upsert({
      user_id: session.user.id,
      avg_health: avgHealth,
      colony_count: colonyCount,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
    if (error) throw error;
  }

  async function loadBenchmarkStats() {
    const { data, error } = await sb.from('benchmarks').select('avg_health, colony_count');
    if (error) throw error;
    const rows = data || [];
    if (!rows.length) return null;
    const avgAll = Math.round(rows.reduce((s, r) => s + (r.avg_health || 0), 0) / rows.length);
    const totalUsers = rows.length;
    const totalColonies = rows.reduce((s, r) => s + (r.colony_count || 0), 0);
    return { avgAll, totalUsers, totalColonies };
  }

  // Expose API
  window.HoneyDB = {
    // Auth
    signUp,
    signIn,
    signOut,
    getSession,
    getUserProfile,
    updateProfile,
    resetPassword,
    // Farms
    loadFarms,
    saveFarm,
    archiveFarm,
    deleteFarm,
    // Colonies
    loadColonies,
    saveColony,
    archiveColony,
    deleteColony,
    initDefaultColonies,
    // Insp records
    loadInspRecords,
    saveInspRecord,
    updateInspRecord,
    deleteInspRecord,
    // Work records
    loadWorkRecords,
    saveWorkRecord,
    updateWorkRecord,
    deleteWorkRecord,
    // Tasks
    loadTasks,
    getTasks,
    saveTask,
    updateTask,
    completeTask,
    deleteTask,
    // Push
    savePushSubscription,
    deletePushSubscription,
    // Realtime
    subscribeRealtime,
    unsubscribeRealtime,
    // Data
    exportAllData,
    upsertBenchmark,
    loadBenchmarkStats,
  };
})();

(function () {
  'use strict';

  // ===================================================
  // HoneyOS ユーティリティ
  // Component クラスに依存しない純粋関数のみここに置く。
  // Component 側は this._calcHealthScore() → 中で
  //   window.HoneyUtils.calcHealthScore() を呼ぶ形に移行中。
  // ===================================================

  // 健康スコア計算
  // @param colony      string  蜂群ID
  // @param inspHistory array   全内検履歴
  // @returns { score: number, label: string, color: string }
  function calcHealthScore(colony, inspHistory) {
    const recs = (inspHistory || [])
      .filter(r => r.colony === colony)
      .sort((a, b) => (b.date || '') > (a.date || '') ? 1 : -1);
    if (!recs.length) return { score: 0, label: '未記録', color: '#aaa' };

    const latest = recs[0];
    let score = 100;

    const daysSince = (Date.now() - new Date(latest.date || '').getTime()) / 86400000;
    if (daysSince > 21) score -= 30;
    else if (daysSince > 14) score -= 15;

    if (latest.queenPresent === false) score -= 35;

    const spaceUsed = Object.values(latest.spaceLevels || {}).filter(v => v && v !== 'empty').length;
    const spaceTotal = latest.spaceCount || 10;
    const usePct = spaceUsed / spaceTotal;
    if (usePct < 0.2) score -= 20;
    else if (usePct < 0.4) score -= 10;

    if (recs.length >= 3) score += 5;

    score = Math.max(0, Math.min(100, score));
    const label = score >= 80 ? '良好' : score >= 55 ? '普通' : score >= 30 ? '要観察' : '要対処';
    const color = score >= 80 ? '#3E9D6B' : score >= 55 ? '#E8961B' : score >= 30 ? '#C98A00' : '#D9534F';
    return { score, label, color };
  }

  // 越冬リスクスコア計算
  // @param colony      string  蜂群ID
  // @param inspHistory array   全内検履歴
  // @returns { score: number, level: 'high'|'medium'|'low'|'unknown', label: string, color: string }
  function calcWinterRisk(colony, inspHistory) {
    const recs = (inspHistory || [])
      .filter(r => r.colony === colony)
      .sort((a, b) => (b.date || '') > (a.date || '') ? 1 : -1);
    if (!recs.length) return { score: 0, level: 'unknown', label: '記録なし', color: '#aaa' };

    const latest = recs[0];
    let risk = 0;

    if (latest.queenPresent === false) risk += 40;

    const beesTotal = latest.beesTotal;
    if (beesTotal != null && beesTotal <= 1) risk += 30;
    else if (beesTotal === 2) risk += 10;

    const honeyCount = Object.values(latest.spaceLevels || {}).filter(v => v === 'honey').length;
    const spaceCount = latest.spaceCount || 10;
    const honeyPct = honeyCount / spaceCount;
    if (honeyPct < 0.2) risk += 30;
    else if (honeyPct < 0.4) risk += 15;

    const daysSince = (Date.now() - new Date(latest.date || '').getTime()) / 86400000;
    if (daysSince > 30) risk += 15;

    risk = Math.min(100, risk);
    const level = risk >= 60 ? 'high' : risk >= 30 ? 'medium' : 'low';
    const label = level === 'high' ? '要対処' : level === 'medium' ? '要注意' : '問題なし';
    const color = level === 'high' ? '#D9534F' : level === 'medium' ? '#E8961B' : '#3E9D6B';
    return { score: risk, level, label, color };
  }

  // 採蜜適期チェック
  // @param colony      string
  // @param inspHistory array
  // @returns boolean
  function isHarvestReady(colony, inspHistory) {
    const recs = (inspHistory || [])
      .filter(r => r.colony === colony)
      .sort((a, b) => (b.date || '') > (a.date || '') ? 1 : -1);
    if (!recs.length) return false;
    const lat = recs[0];
    const honeyCount = Object.values(lat.spaceLevels || {}).filter(v => v === 'honey').length;
    return honeyCount / (lat.spaceCount || 10) >= 0.6;
  }

  // 分蜂リスクチェック (最新内検で王台確認済みの群)
  // @param colony      string
  // @param inspHistory array
  // @returns boolean
  function hasSwarmRisk(colony, inspHistory) {
    const recs = (inspHistory || [])
      .filter(r => r.colony === colony)
      .sort((a, b) => (b.date || '') > (a.date || '') ? 1 : -1);
    return recs.length > 0 && !!recs[0].swarmRisk;
  }

  window.HoneyUtils = { calcHealthScore, calcWinterRisk, isHarvestReady, hasSwarmRisk };
})();

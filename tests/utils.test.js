'use strict';
const { calcHealthScore, calcWinterRisk, isHarvestReady, hasSwarmRisk } = require('../utils');

// ---------------------------------------------------------------------------
// テスト用ヘルパー
// ---------------------------------------------------------------------------

const TODAY = new Date().toISOString().slice(0, 10);
const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);

function makeInsp(overrides = {}) {
  return {
    colony: 'A-01',
    date: TODAY,
    queenPresent: true,
    spaceCount: 10,
    spaceLevels: { 1: 'honey', 2: 'honey', 3: 'brood', 4: 'brood', 5: 'empty',
                   6: 'empty', 7: 'empty', 8: 'empty', 9: 'empty', 10: 'empty' },
    beesTotal: 4,
    swarmRisk: false,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// calcHealthScore
// ---------------------------------------------------------------------------

describe('calcHealthScore', () => {
  test('記録なし → score 0', () => {
    const result = calcHealthScore('A-01', []);
    expect(result.score).toBe(0);
    expect(result.label).toBe('未記録');
  });

  test('直近内検・女王あり・適度な使用率 → 良好', () => {
    const insp = makeInsp({ spaceLevels: { 1:'honey',2:'honey',3:'brood',4:'brood',5:'brood',6:'brood',7:'honey',8:'empty',9:'empty',10:'empty' } });
    const { score, label } = calcHealthScore('A-01', [insp]);
    expect(score).toBeGreaterThanOrEqual(80);
    expect(label).toBe('良好');
  });

  test('21日以上前の内検 → スコアが30減る', () => {
    const recent = makeInsp();
    const old = makeInsp({ date: daysAgo(25) });
    const scoreRecent = calcHealthScore('A-01', [recent]).score;
    const scoreOld    = calcHealthScore('A-01', [old]).score;
    expect(scoreOld).toBeLessThan(scoreRecent);
    expect(scoreRecent - scoreOld).toBeGreaterThanOrEqual(30);
  });

  test('女王不在 → スコアが35減る', () => {
    const withQueen    = makeInsp({ queenPresent: true });
    const withoutQueen = makeInsp({ queenPresent: false });
    const diff = calcHealthScore('A-01', [withQueen]).score - calcHealthScore('A-01', [withoutQueen]).score;
    expect(diff).toBe(35);
  });

  test('使用率20%未満 → スコアが20減る', () => {
    const busy  = makeInsp({ spaceLevels: { 1:'honey',2:'honey',3:'brood',4:'brood',5:'brood',6:'brood',7:'honey',8:'honey',9:'honey',10:'honey' } });
    const empty = makeInsp({ spaceLevels: { 1:'empty',2:'empty',3:'empty',4:'empty',5:'empty',6:'empty',7:'empty',8:'empty',9:'empty',10:'empty' } });
    const diff = calcHealthScore('A-01', [busy]).score - calcHealthScore('A-01', [empty]).score;
    expect(diff).toBeGreaterThanOrEqual(20);
  });

  test('3件以上の記録があると +5 ボーナス（スコアが100未満の場合に確認）', () => {
    // 直近14日以上前の内検（-15）でベーススコアを85にしてからボーナスを確認
    const baseDate = daysAgo(16);
    const one   = [makeInsp({ date: baseDate })];
    const three = [makeInsp({ date: baseDate }), makeInsp({ date: daysAgo(23) }), makeInsp({ date: daysAgo(30) })];
    expect(calcHealthScore('A-01', three).score - calcHealthScore('A-01', one).score).toBe(5);
  });

  test('他の群の記録は無視される', () => {
    const inspB = makeInsp({ colony: 'A-02' });
    const result = calcHealthScore('A-01', [inspB]);
    expect(result.score).toBe(0);
    expect(result.label).toBe('未記録');
  });

  test('score は 0〜100 の範囲に収まる', () => {
    const worst = makeInsp({
      date: daysAgo(30),
      queenPresent: false,
      spaceLevels: {},
      spaceCount: 10,
    });
    const { score } = calcHealthScore('A-01', [worst]);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});

// ---------------------------------------------------------------------------
// calcWinterRisk
// ---------------------------------------------------------------------------

describe('calcWinterRisk', () => {
  test('記録なし → level unknown', () => {
    const result = calcWinterRisk('A-01', []);
    expect(result.level).toBe('unknown');
  });

  test('全条件クリア → low リスク', () => {
    const insp = makeInsp({
      queenPresent: true,
      beesTotal: 5,
      spaceLevels: { 1:'honey',2:'honey',3:'honey',4:'honey',5:'honey',6:'honey',7:'brood',8:'brood',9:'brood',10:'brood' },
    });
    const { level } = calcWinterRisk('A-01', [insp]);
    expect(level).toBe('low');
  });

  test('女王不在 → リスク 40 以上', () => {
    const insp = makeInsp({ queenPresent: false, beesTotal: 5 });
    const { score } = calcWinterRisk('A-01', [insp]);
    expect(score).toBeGreaterThanOrEqual(40);
  });

  test('蜂数 1 以下 → リスク 30 以上加算', () => {
    const low  = makeInsp({ beesTotal: 1 });
    const high = makeInsp({ beesTotal: 5 });
    const diff = calcWinterRisk('A-01', [low]).score - calcWinterRisk('A-01', [high]).score;
    expect(diff).toBeGreaterThanOrEqual(30);
  });

  test('蜜貯蔵 20% 未満 → リスク 30 以上加算', () => {
    const noHoney  = makeInsp({ spaceLevels: {}, spaceCount: 10 });
    const withHoney = makeInsp({ spaceLevels: { 1:'honey',2:'honey',3:'honey',4:'honey',5:'honey',6:'honey',7:'honey',8:'honey',9:'honey',10:'honey' } });
    const diff = calcWinterRisk('A-01', [noHoney]).score - calcWinterRisk('A-01', [withHoney]).score;
    expect(diff).toBeGreaterThanOrEqual(30);
  });

  test('score は 100 以下に収まる', () => {
    const worst = makeInsp({
      date: daysAgo(35),
      queenPresent: false,
      beesTotal: 0,
      spaceLevels: {},
      spaceCount: 10,
    });
    expect(calcWinterRisk('A-01', [worst]).score).toBeLessThanOrEqual(100);
  });
});

// ---------------------------------------------------------------------------
// isHarvestReady
// ---------------------------------------------------------------------------

describe('isHarvestReady', () => {
  test('記録なし → false', () => {
    expect(isHarvestReady('A-01', [])).toBe(false);
  });

  test('蜜 60% 以上 → true', () => {
    const insp = makeInsp({
      spaceLevels: { 1:'honey',2:'honey',3:'honey',4:'honey',5:'honey',6:'honey',7:'brood',8:'brood',9:'empty',10:'empty' },
      spaceCount: 10,
    });
    expect(isHarvestReady('A-01', [insp])).toBe(true);
  });

  test('蜜 50% → false', () => {
    const insp = makeInsp({
      spaceLevels: { 1:'honey',2:'honey',3:'honey',4:'honey',5:'honey',6:'brood',7:'brood',8:'empty',9:'empty',10:'empty' },
      spaceCount: 10,
    });
    expect(isHarvestReady('A-01', [insp])).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// hasSwarmRisk
// ---------------------------------------------------------------------------

describe('hasSwarmRisk', () => {
  test('記録なし → false', () => {
    expect(hasSwarmRisk('A-01', [])).toBe(false);
  });

  test('swarmRisk: true の記録あり → true', () => {
    expect(hasSwarmRisk('A-01', [makeInsp({ swarmRisk: true })])).toBe(true);
  });

  test('swarmRisk: false の記録 → false', () => {
    expect(hasSwarmRisk('A-01', [makeInsp({ swarmRisk: false })])).toBe(false);
  });

  test('最新記録のみ参照（古い王台記録は無視）', () => {
    const old    = makeInsp({ date: daysAgo(10), swarmRisk: true });
    const recent = makeInsp({ date: daysAgo(1),  swarmRisk: false });
    expect(hasSwarmRisk('A-01', [old, recent])).toBe(false);
  });
});

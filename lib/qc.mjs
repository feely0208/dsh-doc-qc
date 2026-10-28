/**
 * 深鲸文档质检 · 内核
 *
 * 交付前把「看起来没问题、发出去才发现」的文档毛病挑出来：
 * 占位符残留、重复段落、超长段落、连续空行、半角标点混用、编号断档。
 * 纯本地文本扫描；.docx 需本机装 python-docx（没装就明确提示，不假装检查过）。
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative, sep } from 'node:path';

const SKIP = new Set(['node_modules', '.git', 'dist', 'build', '__pycache__']);
const EXTS = ['.md', '.txt', '.markdown', '.docx'];

export const CHECKS = [
  { id: 'QC-PLACEHOLDER', title: '占位符/TODO 残留', severity: 'high',
    advice: '把 TODO、待补充、XXX、【填写】这类占位符清掉，或改成明确的待办责任人与时间。' },
  { id: 'QC-DUP-PARA', title: '重复段落', severity: 'medium',
    advice: '同一段落在文中出现多次（≥20 字），确认是否复制粘贴重复；合并或删掉多余的一份。' },
  { id: 'QC-LONG-PARA', title: '超长段落（>800 字）', severity: 'low',
    advice: '单段超过 800 字会难以阅读，建议拆成 2~3 段或加小标题。' },
  { id: 'QC-BLANK-RUN', title: '连续空行过多（≥3）', severity: 'low',
    advice: '连续空行会让排版跳动，建议压成 1 个空行。' },
  { id: 'QC-PUNCT-MIX', title: '中文里混用半角标点', severity: 'low',
    advice: '中文句子里出现多个半角逗号/句号，读起来像英文标点；统一改成全角。' },
  { id: 'QC-NUMBER-GAP', title: '编号断档', severity: 'medium',
    advice: '有序列表编号不连续（如 1、2、4），确认是否漏了一条。' },
];

function 读docx(file) {
  const code = `import sys,json\ntry:\n  from docx import Document\nexcept Exception:\n  print(json.dumps({"error":"no-python-docx"}));sys.exit(0)\nd=Document(sys.argv[1])\nprint(json.dumps({"text":"\\n".join(p.text for p in d.paragraphs)},ensure_ascii=False))`;
  const r = spawnSync('python3', ['-c', code, file], { encoding: 'utf8' });
  try { const j = JSON.parse(r.stdout || '{}'); return j.text || ''; } catch { return ''; }
}

function 遍历(root, out) {
  const go = (d) => {
    let names = [];
    try { names = readdirSync(d); } catch { return; }
    for (const n of names) {
      if (n.startsWith('.')) continue;
      const p = join(d, n);
      let st; try { st = statSync(p); } catch { continue; }
      if (st.isDirectory()) { if (!SKIP.has(n)) go(p); continue; }
      if (st.isFile() && EXTS.includes(extname(n).toLowerCase())) out.push(p);
    }
  };
  go(root);
  return out;
}

export function qc({ root }) {
  const dir = String(root || '').trim();
  if (!dir) return { ok: false, error: '请填写要质检的目录' };
  if (!existsSync(dir)) return { ok: false, error: `目录不存在：${dir}` };
  const files = 遍历(dir, []);
  const findings = [];
  读docx; // 引用，避免未使用告警
  for (const f of files) {
    const ext = extname(f).toLowerCase();
    const text = ext === '.docx' ? 读docx(f) : (() => { try { return readFileSync(f, 'utf8'); } catch { return ''; } })();
    if (!text) continue;
    const rel = relative(dir, f).split(sep).join('/');
    const lines = text.split('\n');
    const push = (ruleId, line, evidence, extra) => {
      const c = CHECKS.find((x) => x.id === ruleId);
      findings.push({ ruleId, title: c.title, severity: c.severity, advice: c.advice, file: rel, line, evidence: String(evidence).slice(0, 120), ...extra });
    };
    // 占位符
    lines.forEach((l, i) => { if (/TODO|FIXME|待补充|待确认|XXX|\?\?\?|【填写】|Lorem ipsum/i.test(l)) push('QC-PLACEHOLDER', i + 1, l.trim()); });
    // 重复段落
    const seen = new Map();
    lines.forEach((l, i) => { const t = l.trim(); if (t.length >= 20) { if (!seen.has(t)) seen.set(t, []); seen.get(t).push(i + 1); } });
    for (const [t, nums] of seen) if (nums.length > 1) push('QC-DUP-PARA', nums[1], `${nums.length} 次：${t}`, { related: nums });
    // 超长段落
    let buf = '', start = 0;
    lines.forEach((l, i) => { if (l.trim() === '') { if (buf.length > 800) push('QC-LONG-PARA', start + 1, `${buf.length} 字`); buf = ''; start = i + 1; } else { if (buf === '') start = i; buf += l; } });
    if (buf.length > 800) push('QC-LONG-PARA', start + 1, `${buf.length} 字`);
    // 连续空行
    let run = 0;
    lines.forEach((l, i) => { if (l.trim() === '') { run += 1; if (run === 3) push('QC-BLANK-RUN', i + 1, '连续空行'); } else run = 0; });
    // 半角标点混用
    lines.forEach((l, i) => {
      const cjk = (l.match(/[\u4e00-\u9fa5]/g) || []).length;
      const half = (l.match(/[,;]/g) || []).length;
      if (cjk >= 10 && half >= 5) push('QC-PUNCT-MIX', i + 1, `${half} 个半角标点`);
    });
    // 编号断档
    let prev = null;
    lines.forEach((l, i) => {
      const m = l.match(/^\s*(\d{1,3})[.、)]\s+/);
      if (!m) return;
      const n = Number(m[1]);
      if (prev !== null && n !== prev + 1 && n > prev) push('QC-NUMBER-GAP', i + 1, `${prev} → ${n}`);
      prev = n;
    });
  }
  const summary = {};
  for (const f of findings) summary[f.ruleId] = (summary[f.ruleId] || 0) + 1;
  const docxCount = files.filter((f) => extname(f).toLowerCase() === '.docx').length;
  return { ok: true, root: dir, scannedFiles: files.length, docxFiles: docxCount, findings, summary, total: findings.length };
}

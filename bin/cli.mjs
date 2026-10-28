#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { qc } from '../lib/qc.mjs';
const args = process.argv.slice(2);
const get = (n) => { const i = args.indexOf(n); return i >= 0 && args[i + 1] ? args[i + 1] : ''; };
const has = (n) => args.includes(n);
if (!args.length || has('--help')) {
  console.log(`dsh-doc-qc —— 深鲸文档质检（交付前自查）
  --root <目录> [--json]
检查：占位符残留 / 重复段落 / 超长段落 / 连续空行 / 半角标点混用 / 编号断档
说明：.md/.txt 直接读；.docx 需 python3 + python-docx（缺库会跳过并在输出里提示）。`);
  process.exit(0);
}
const root = get('--root'); if (!root) { console.error('缺少 --root'); process.exit(2); }
const r = qc({ root });
if (!r.ok) { console.error('❌', r.error); process.exit(1); }
if (has('--json')) { console.log(JSON.stringify(r, null, 2)); process.exit(r.total ? 1 : 0); }
console.log(`质检 ${r.scannedFiles} 个文件（其中 docx ${r.docxFiles} 个），命中 ${r.total} 项`);
for (const [k, v] of Object.entries(r.summary)) console.log(`  ${k}: ${v}`);
for (const f of r.findings) console.log(`- [${f.severity}] ${f.ruleId} ${f.file}:${f.line}  ${f.evidence}\n    → ${f.advice}`);
process.exit(r.total ? 1 : 0);

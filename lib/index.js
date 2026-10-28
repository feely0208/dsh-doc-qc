import { createPlugin, pkgRootFrom } from '@deepwhale-cn/dsh-guard-core/plugin';
import { registerQcApi } from './api.js';
const base = createPlugin({
  name: 'doc-qc',
  pkgRoot: pkgRootFrom(import.meta.url),
  skillFile: 'skill/doc-qc.md',
  binFile: 'bin/cli.mjs',
  description: '深鲸文档质检：交付前把占位符残留、重复段落、超长段落、连续空行、半角标点混用、编号断档挑出来',
  whenToUse: '当用户要把文档交出去、或问「这份文档有没有问题」时使用：扫描 .md/.txt/.docx，逐条报出位置与修法。典型说法：「帮我看下这份合同有没有漏」「文档里有没有 TODO 没删」。',
});
export const name = base.name;
export const inject = [...base.inject, 'webServer'];
export function apply(ctx) {
  base.apply(ctx);
  try { if (ctx.webServer?.register) registerQcApi(ctx); } catch (e) { ctx.logger?.warn?.('[doc-qc] 面板出口注册失败: ' + (e?.message || e)); }
}

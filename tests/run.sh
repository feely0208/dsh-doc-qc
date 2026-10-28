#!/bin/bash
set -uo pipefail
cd "$(dirname "$0")/.."
PASS=0; FAIL=0
ok(){ echo "  ✅ $1"; PASS=$((PASS+1)); }
bad(){ echo "  ❌ $1"; FAIL=$((FAIL+1)); }
echo ""; echo "  深鲸文档质检 · 回归"
J=$(node bin/cli.mjs --root tests/fixtures/fail --json)
cnt(){ echo "$J" | python3 -c "import json,sys;d=json.load(sys.stdin);print(len([f for f in d['findings'] if f['ruleId']=='$1']))" 2>/dev/null; }
for r in QC-PLACEHOLDER QC-DUP-PARA QC-LONG-PARA QC-BLANK-RUN QC-PUNCT-MIX QC-NUMBER-GAP; do
  [ "$(cnt $r)" -gt 0 ] && ok "$r 报出" || bad "$r 漏报"
done
P=$(node bin/cli.mjs --root tests/fixtures/pass --json | python3 -c "import json,sys;print(json.load(sys.stdin)['total'])")
[ "${P:-1}" = "0" ] && ok "干净样本 0 误报" || bad "干净样本误报 $P"
node bin/cli.mjs --root tests/fixtures/fail >/dev/null; [ $? -eq 1 ] && ok "有命中退出码 1" || bad "退出码异常"
node bin/cli.mjs --root /nonexistent >/dev/null 2>&1; [ $? -eq 1 ] && ok "目录不存在退出码 1" || bad "错误处理异常"
echo "  ────────────────────────────────────────"; echo "  通过 $PASS · 失败 $FAIL"; [ "$FAIL" -eq 0 ]

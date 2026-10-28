# 深鲸文档质检（@deepwhale-cn/dsh-doc-qc）

交付前把「看起来没问题、发出去才发现」的文档毛病挑出来。

## 安装

```bash
dsh plugin --profile web add @deepwhale-cn/dsh-doc-qc
```

## 用法

```bash
dsh-doc-qc --root ./交付材料
dsh-doc-qc --root ./交付材料 --json     # 有命中退出码 1，可接 CI
```

面板：侧栏「深鲸文档质检」。

## 检查项

占位符残留 / 重复段落 / 超长段落（>800 字）/ 连续空行 / 半角标点混用 / 编号断档。

.md/.txt 直接读；.docx 需 `python3 + python-docx`（缺库会跳过并标注）。纯本地，不上传。

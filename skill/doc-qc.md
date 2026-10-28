# 深鲸文档质检（dsh-doc-qc）

**什么时候用**：文档要交出去/发布前，或用户问「这份文档有没有问题」「有没有漏掉的地方」。

## 怎么用

```bash
<cli 路径> --root <目录> [--json]
```

## 检查项

| 规则 | 查什么 |
|---|---|
| QC-PLACEHOLDER | TODO / 待补充 / XXX / 【填写】残留 |
| QC-DUP-PARA | 重复段落（≥20 字出现多次） |
| QC-LONG-PARA | 单段 >800 字 |
| QC-BLANK-RUN | 连续空行 ≥3 |
| QC-PUNCT-MIX | 中文里混用半角逗号/分号 |
| QC-NUMBER-GAP | 有序编号断档（1、2、4） |

## 规则

- .md/.txt 直接读；.docx 需 python3 + python-docx，缺库会跳过并标注，不假装检查过；
- 纯本地，不上传文件。

# HCI 报告自查记录（趁你出门跑的一遍）

对象：`assignment30068298.docx` · 完成时间 2026-11-06 18:05
备份：`hci-assignment/backup-assignment30068298-before-QA.docx`（改之前的版本）

---

## 一、发现并修好的三个问题

### 1. 报告里有 21 段中文/符号乱码（严重）

现象：`HCI-UX Assignment 1 鈥?Design Report` —— 本该是破折号 `—` 的地方变成了 `鈥?`，还有 `it鈥檚`。

原因：我之前用 PowerShell 的 `Get-Content -Raw` + `Set-Content -Encoding UTF8` 改 `build_assignment.py`，PowerShell 按 GBK 读 UTF-8 文件，把非 ASCII 字符写坏了，然后一路带进了 docx。

修复：写了个替换脚本，`鈥?` → `— `、`鈥檚` → `’`，重建后全文 **0 处乱码**，31 个破折号正常显示。

> 这条最要紧：老师一眼就能看出"这是翻译/机器处理过的"，而且直接拉低印象分。

### 2. 5.4 文件表漏了 4 个文件、还写错了报告名

简报原文要求：「必须列出提交中所有文件，并简明准确说明每个文件作用。」

原来的表只有 11 行，而且最后一行写的是 `ASSIGNMENT.docx`（实际提交的文件叫 `assignment30068298.docx`）。

补进去：

| 新增行 | 作用 |
|---|---|
| `site/assets/mascot/idle.webm` | 待机循环（VP9 带透明通道） |
| `site/assets/mascot/look.webm` | 每 18 秒东张西望 |
| `site/assets/mascot/tap.webm` | 点击时的反应 |
| `site/assets/mascot/README.txt` | 素材来源与授权 |
| `assignment30068298.docx` | 报告本身（替换掉错的 `ASSIGNMENT.docx`） |

现在 15 行，和实际交的文件一一对应。

### 3. 5.3 媒体来源与事实不符

原文写着「**No stock photography or third-party artwork is used**」，但站点现在用了 dsh-pet 的鲸鱼娘动画——这是第三方素材，必须申报。

改成：说明三张图是手写 SVG、吉祥物来自 dsh-pet（PC2005-cloud，MIT 协议）、未修改、已在 `assets/mascot/README.txt` 署名、且该项目的素材本身是 AI 生成。

### 4. 5.1 功能清单补上了两样新东西

加了「a small assistant that answers questions from a knowledge base written into the page」和「a mascot that plays three short clips stored with the site」。

---

## 二、现在的状态

| 项 | 值 |
|---|---|
| 词数 | **3,771**（目标 3,500 ± 20%，区间 2,800–4,200 ✅） |
| 页数 | 10 |
| 表格 / 图片 | 3 / 5 |
| 乱码 | **0** |
| 文件表行数 | 15（与实际文件一一对应） |
| 包大小 | 1.71 MB（含三个 webm） |

## 三、还剩下的（需要你决定）

1. **AI coversheet** —— 只有你能填，而且要和 5.5 的声明一致
2. **问卷那条「注意：第4、6、8、10题」是不是你自己填的** —— 是的话 3.4 的样本要改成 n=9
3. 报告正文仍是我写的英文，GPTZero 那件事没有解决（我也不打算再代写规避）

## 四、这次学到的教训

**以后不再用 PowerShell 的 `Get-Content`/`Set-Content` 读写带中文或特殊符号的源码文件**，一律用 Python（显式 `encoding='utf-8'`）。这次差点把整份报告交上去。

# Web Guide Skill 使用说明

## 概述

Web Guide 是一个浏览器自动化操作指导与经验归档系统。它能够：

1. 逐步引导用户完成复杂的浏览器自动化操作
2. 在操作成功后自动归档为可复用的固定方法
3. 下次执行相同任务时自动调用归档方法，无需再次指导

## 目录结构

```
web-guide/
├── SKILL.md                    # Skill 定义文件
├── README.md                   # 使用说明
├── scripts/
│   ├── guide-runner.js         # 引导模式核心脚本
│   ├── method-executor.js      # 自动模式执行器
│   └── method-archiver.js      # 方法归档器
├── methods/                    # 归档的方法存储目录
│   └── jif8-v2ray-subscribe.json
└── guides/                    # 流程模板目录
    └── automation-template.json
```

## 快速开始

### 方式一：通过自然语言触发

当用户描述需要浏览器自动化操作时：
```
用户: 帮我登录 jif8.net 并获取 V2Ray 订阅
系统: 分析意图 -> 匹配归档方法 -> 自动执行
```

### 方式二：直接调用执行器

```bash
node scripts/method-executor.js "jif8"
```

## 核心脚本

### guide-runner.js - 引导模式

用于逐步执行浏览器操作，每步需要用户确认：

```javascript
const { GuideRunner } = require('./scripts/guide-runner');

const runner = new GuideRunner();
await runner.startBrowser();

runner.addStep('goto', 'https://example.com', '打开网站');
runner.addStep('fill', { selector: '#email', value: 'test@test.com' }, '填写邮箱');
runner.addStep('click', '#submit', '点击提交');

await runner.executeAllSteps();
await runner.closeBrowser();
```

### method-executor.js - 自动模式

用于执行已归档的方法：

```javascript
const { MethodExecutor } = require('./scripts/method-executor');

const executor = new MethodExecutor();
await executor.run('jif8');  // 传入关键字或方法名
```

### method-archiver.js - 归档管理

```bash
# 列出所有归档方法
node scripts/method-archiver.js list

# 删除指定方法
node scripts/method-archiver.js delete jif8-v2ray

# 导出为独立脚本
node scripts/method-archiver.js export jif8-v2ray-subscribe
```

## 归档方法格式

```json
{
  "name": "方法名称",
  "keywords": ["触发关键字"],
  "description": "方法描述",
  "steps": [
    {
      "action": "goto",
      "target": "https://...",
      "description": "打开网站"
    }
  ]
}
```

## 支持的操作类型

| action | target 示例 | 说明 |
|--------|------------|------|
| goto | URL 字符串 | 导航到指定页面 |
| fill | { selector, value } | 填写表单字段 |
| click | CSS 选择器字符串 | 点击元素 |
| wait | 毫秒数 | 等待指定时间 |
| scroll | Y 轴位置数字 | 滚动页面 |
| evaluate | { fn, args } | 执行 JavaScript |

## 最佳实践

1. **首次操作**: 使用引导模式，逐步确认每一步操作正确
2. **成功后归档**: 操作成功后立即归档，保存完整的步骤流程
3. **关键字命名**: 使用清晰的关键字便于后续匹配
4. **定期整理**: 用 `list` 命令查看归档方法，删除不再使用的

## 浏览器配置

默认使用 Chrome 浏览器，路径：
```
C:\Program Files\Google\Chrome\Application\chrome.exe
```

如需修改，可编辑各脚本中的 `executablePath`。

## 注意事项

- 引导模式会逐步执行，每步之间有短暂等待
- 自动模式静默执行，不输出详细步骤
- 浏览器权限弹窗会自动点击"确认"
- 归档方法包含账号密码等敏感信息，请妥善保管

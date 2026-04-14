<div align="center">

<br/>
<br/>

<div align="center">
    <strong>Browser automation guidance and experience archival system for OpenCode.</strong>
    <br />
    <br />
</div>
  
[![Awesome](https://awesome.re/badge.svg)](https://awesome.re)
[![Skills Count](https://img.shields.io/badge/skills-1-blue?style=flat-square)](#table-of-contents)
[![Last Update](https://img.shields.io/github/last-commit/YuTaoV5/Web-guide-skill?label=Last%20update&style=flat-square)](https://github.com/YuTaoV5/Web-guide-skill)
<a href="https://github.com/YuTaoV5">
  <img alt="Author" src="https://github.com/YuTaoV5.png" height="20" />
</a> 

</div>

---

# Awesome Web Guide

Web Guide is a browser automation guidance and experience archival system for AI agents. It helps agents learn browser automation workflows through step-by-step guidance, archive successful methods after completion, and automatically execute archived methods on subsequent identical tasks.

## Features

- **Step-by-Step Guidance**: Guide users through complex browser automation operations step by step
- **Experience Archival**: Automatically archive successful operations as reusable methods
- **Auto-Execution**: Match archived methods by keywords and execute automatically
- **Method Management**: List, delete, and export archived methods

## Installation

### Manual Installation

Copy the skill folder to one of these locations:

| Location | Path |
|----------|------|
| Global | `~/.openclaw/skills/` |
| Workspace | `<project>/skills/` |

### Alternative

Paste the skill's GitHub repository link directly into your assistant's chat and ask it to use it.

## Quick Start

### Natural Language Trigger

When a user describes a browser automation task:
```
User: Help me log in to jif8.net and get the V2Ray subscription
System: Analyze intent -> Match archived method -> Execute automatically
```

### Direct Execution

```bash
node scripts/method-executor.js "jif8"
```

## Directory Structure

```
web-guide/
├── SKILL.md                           # Skill definition
├── README.md                          # This file
├── scripts/
│   ├── guide-runner.js                # Step-by-step guide mode
│   ├── method-executor.js             # Auto execution for archived methods
│   └── method-archiver.js             # Method archival management
├── methods/                           # Archived methods storage
│   └── jif8-v2ray-subscribe.json      # Example: JIF8 subscription
└── guides/
    └── automation-template.json       # Workflow template
```

## Core Scripts

### guide-runner.js - Guide Mode

Used for step-by-step browser operations, requires user confirmation at each step:

```javascript
const { GuideRunner } = require('./scripts/guide-runner');

const runner = new GuideRunner();
await runner.startBrowser();

runner.addStep('goto', 'https://example.com', 'Open website');
runner.addStep('fill', { selector: '#email', value: 'test@test.com' }, 'Fill email');
runner.addStep('click', '#submit', 'Click submit');

await runner.executeAllSteps();
await runner.closeBrowser();
```

### method-executor.js - Auto Mode

Used for executing archived methods:

```javascript
const { MethodExecutor } = require('./scripts/method-executor');

const executor = new MethodExecutor();
await executor.run('jif8');  // Pass keyword or method name
```

### method-archiver.js - Archival Management

```bash
# List all archived methods
node scripts/method-archiver.js list

# Delete specified method
node scripts/method-archiver.js delete jif8-v2ray

# Export as standalone script
node scripts/method-archiver.js export jif8-v2ray-subscribe
```

## Archived Method Format

```json
{
  "name": "Method Name",
  "keywords": ["trigger keyword"],
  "description": "Method description",
  "steps": [
    {
      "action": "goto",
      "target": "https://...",
      "description": "Open website"
    }
  ]
}
```

## Supported Action Types

| Action | Target Example | Description |
|--------|---------------|-------------|
| goto | URL string | Navigate to specified page |
| fill | { selector, value } | Fill form field |
| click | CSS selector string | Click element |
| wait | Milliseconds | Wait specified time |
| scroll | Y-axis position number | Scroll page |
| evaluate | { fn, args } | Execute JavaScript |

## Best Practices

1. **First Operation**: Use guide mode, confirm each step is correct
2. **Archive After Success**: Archive immediately after successful operation, save complete workflow
3. **Clear Keywords**: Use clear keywords for easy subsequent matching
4. **Regular Cleanup**: Use `list` command to view archived methods, delete unused ones

## Browser Configuration

Default Chrome browser path:
```
C:\Program Files\Google\Chrome\Application\chrome.exe
```

Modify `executablePath` in scripts to change browser.

## Security Notice

Archived methods may contain sensitive information like account passwords. Please:
- Store archived methods securely
- Do not commit sensitive information to public repositories
- Use placeholder values like `YOUR_EMAIL` / `YOUR_PASSWORD` for shared methods

## Contributing

Contributions welcome! Please open an issue or pull request.

## License

MIT License

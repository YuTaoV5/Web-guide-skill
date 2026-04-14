const fs = require('fs');
const path = require('path');

const BASE_DIR = path.dirname(__dirname);
const METHODS_DIR = path.join(BASE_DIR, 'methods');

class MethodArchiver {
  constructor() {
    this.method = null;
  }

  createMethod(name, keywords, description) {
    this.method = {
      name,
      keywords: Array.isArray(keywords) ? keywords : [keywords],
      description,
      createdAt: new Date().toISOString(),
      lastUsedAt: new Date().toISOString(),
      useCount: 0,
      steps: [],
      filename: `${name.toLowerCase().replace(/\s+/g, '-')}.json`
    };
    return this.method;
  }

  addStep(action, target, description) {
    if (!this.method) {
      throw new Error('请先调用 createMethod() 创建方法');
    }
    this.method.steps.push({ action, target, description });
  }

  addGotoStep(url, description) {
    this.addStep('goto', url, description);
  }

  addFillStep(selector, value, description) {
    this.addStep('fill', { selector, value }, description);
  }

  addClickStep(selector, description) {
    this.addStep('click', selector, description);
  }

  addWaitStep(milliseconds, description) {
    this.addStep('wait', milliseconds, description);
  }

  addScrollStep(position, description) {
    this.addStep('scroll', position, description);
  }

  addEvaluateStep(fn, args, description) {
    this.addStep('evaluate', { fn, args: args || [] }, description);
  }

  save() {
    if (!this.method) {
      throw new Error('没有可保存的方法');
    }

    if (!fs.existsSync(METHODS_DIR)) {
      fs.mkdirSync(METHODS_DIR, { recursive: true });
    }

    const filepath = path.join(METHODS_DIR, this.method.filename);
    fs.writeFileSync(filepath, JSON.stringify(this.method, null, 2), 'utf-8');
    console.log(`[已归档]: ${this.method.name}`);
    console.log(`[路径]: ${filepath}`);
    return filepath;
  }

  load(nameOrFilename) {
    if (!fs.existsSync(METHODS_DIR)) {
      return null;
    }

    const files = fs.readdirSync(METHODS_DIR);
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      if (file === nameOrFilename || file.replace('.json', '') === nameOrFilename.replace('.json', '')) {
        const filepath = path.join(METHODS_DIR, file);
        this.method = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
        return this.method;
      }
    }
    return null;
  }

  list() {
    if (!fs.existsSync(METHODS_DIR)) {
      return [];
    }

    const files = fs.readdirSync(METHODS_DIR);
    const methods = [];
    
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      const filepath = path.join(METHODS_DIR, file);
      const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
      methods.push(data);
    }
    
    return methods.sort((a, b) => 
      new Date(b.lastUsedAt) - new Date(a.lastUsedAt)
    );
  }

  delete(nameOrFilename) {
    const loaded = this.load(nameOrFilename);
    if (!loaded) {
      console.log(`[警告]: 未找到方法 "${nameOrFilename}"`);
      return false;
    }

    const filepath = path.join(METHODS_DIR, loaded.filename);
    fs.unlinkSync(filepath);
    console.log(`[已删除]: ${loaded.name}`);
    this.method = null;
    return true;
  }

  updateUseCount(nameOrFilename) {
    const loaded = this.load(nameOrFilename);
    if (!loaded) return null;

    loaded.useCount = (loaded.useCount || 0) + 1;
    loaded.lastUsedAt = new Date().toISOString();
    this.method = loaded;
    this.save();
    return loaded;
  }

  exportAsScript(nameOrFilename) {
    const method = this.load(nameOrFilename);
    if (!method) {
      console.log(`[错误]: 未找到方法 "${nameOrFilename}"`);
      return null;
    }

    const scriptContent = `const { chromium } = require('playwright');
const path = require('path');

async function run() {
  const browser = await chromium.launch({
    headless: false,
    executablePath: 'C:\\\\Program Files\\\\Google\\\\Chrome\\\\Application\\\\chrome.exe',
    args: ['--start-maximized']
  });

  const context = await browser.newContext({
    permissions: ['clipboard-read', 'clipboard-write']
  });

  const page = await context.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });

  page.on('dialog', async dialog => {
    console.log('[浏览器弹窗]:', dialog.message());
    await dialog.accept();
  });

  try {
${method.steps.map((step, i) => {
  switch (step.action) {
    case 'goto':
      return `    // 步骤 ${i + 1}: ${step.description}\n    await page.goto('${step.target}');`;
    case 'fill':
      return `    // 步骤 ${i + 1}: ${step.description}\n    await page.fill('${step.target.selector}', '${step.target.value}');`;
    case 'click':
      return `    // 步骤 ${i + 1}: ${step.description}\n    await page.click('${step.target}');`;
    case 'wait':
      return `    // 步骤 ${i + 1}: ${step.description}\n    await page.waitForTimeout(${step.target});`;
    case 'scroll':
      return `    // 步骤 ${i + 1}: ${step.description}\n    await page.evaluate(() => window.scrollTo(0, ${step.target}));`;
    default:
      return `    // 步骤 ${i + 1}: ${step.description}\n    // 未识别操作: ${step.action}`;
  }
}).join('\n\n')}
  } finally {
    await browser.close();
  }
}

run().catch(console.error);
`;

    const scriptsDir = path.join(BASE_DIR, 'scripts');
    const exportPath = path.join(scriptsDir, `${method.filename.replace('.json', '')}-runner.js`);
    fs.writeFileSync(exportPath, scriptContent, 'utf-8');
    console.log(`[已导出]: ${exportPath}`);
    return exportPath;
  }
}

module.exports = { MethodArchiver };

if (require.main === module) {
  const archiver = new MethodArchiver();
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === 'list') {
    console.log('\n========== 已归档方法 ==========\n');
    const methods = archiver.list();
    if (methods.length === 0) {
      console.log('(暂无归档方法)\n');
    } else {
      methods.forEach(m => {
        console.log(`名称: ${m.name}`);
        console.log(`关键字: ${m.keywords?.join(', ')}`);
        console.log(`使用次数: ${m.useCount}`);
        console.log(`最后使用: ${m.lastUsedAt}`);
        console.log(`步骤数: ${m.steps.length}`);
        console.log('---');
      });
    }
  } else if (command === 'delete') {
    const name = args[1];
    if (name) {
      archiver.delete(name);
    } else {
      console.log('请指定要删除的方法名');
    }
  } else if (command === 'export') {
    const name = args[1];
    if (name) {
      archiver.exportAsScript(name);
    } else {
      console.log('请指定要导出的方法名');
    }
  } else {
    console.log('用法: node method-archiver.js [list|delete|export] [方法名]');
    console.log('  list   - 列出所有归档方法');
    console.log('  delete - 删除指定方法');
    console.log('  export - 导出为独立运行脚本');
  }
}

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_DIR = path.dirname(__dirname);
const METHODS_DIR = path.join(BASE_DIR, 'methods');

class MethodExecutor {
  constructor() {
    this.browser = null;
    this.context = null;
    this.page = null;
    this.method = null;
  }

  loadMethod(nameOrKeyword) {
    const files = fs.readdirSync(METHODS_DIR);
    
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      const filepath = path.join(METHODS_DIR, file);
      const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
      
      if (data.name.toLowerCase().includes(nameOrKeyword.toLowerCase())) {
        this.method = data;
        return data;
      }
      
      if (data.keywords && data.keywords.some(k => 
        k.toLowerCase().includes(nameOrKeyword.toLowerCase())
      )) {
        this.method = data;
        return data;
      }
    }
    
    return null;
  }

  listMethods() {
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
    
    return methods;
  }

  async startBrowser(options = {}) {
    const config = {
      headless: false,
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      args: ['--start-maximized'],
      ...options
    };

    this.browser = await chromium.launch(config);
    this.context = await this.browser.newContext({
      permissions: ['clipboard-read', 'clipboard-write']
    });
    this.page = await this.context.newPage();
    await this.page.setViewportSize({ width: 1280, height: 800 });

    this.page.on('dialog', async dialog => {
      console.log('[浏览器弹窗]:', dialog.message());
      await dialog.accept();
    });

    console.log('[浏览器已启动]');
    return this.page;
  }

  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      console.log('[浏览器已关闭]');
    }
  }

  async executeStep(step) {
    const { action, target, description } = step;
    
    switch (action) {
      case 'goto':
        await this.page.goto(target);
        break;
      case 'fill':
        await this.page.fill(target.selector, target.value);
        break;
      case 'click':
        await this.page.click(target);
        break;
      case 'wait':
        await this.page.waitForTimeout(target);
        break;
      case 'scroll':
        await this.page.evaluate((pos) => window.scrollTo(0, pos), target);
        break;
      case 'evaluate':
        return await this.page.evaluate(target.fn, ...(target.args || []));
      case 'waitForSelector':
        await this.page.waitForSelector(target, { state: 'visible' });
        break;
      default:
        console.log(`[未知操作]: ${action}`);
    }
    
    return null;
  }

  async executeMethod() {
    if (!this.method) {
      throw new Error('未加载方法，请先调用 loadMethod()');
    }

    console.log(`\n========== 执行方法: ${this.method.name} ==========\n`);
    console.log(`描述: ${this.method.description}`);
    console.log(`步骤数: ${this.method.steps.length}\n`);

    const results = [];

    for (let i = 0; i < this.method.steps.length; i++) {
      const step = this.method.steps[i];
      console.log(`[${i + 1}/${this.method.steps.length}] ${step.description}`);
      
      try {
        const result = await this.executeStep(step);
        results.push({ step: i, result, success: true });
        console.log(`  ✓ 完成`);
      } catch (err) {
        console.log(`  ✗ 失败: ${err.message}`);
        results.push({ step: i, error: err.message, success: false });
      }
      
      await this.page.waitForTimeout(500);
    }

    this.method.useCount = (this.method.useCount || 0) + 1;
    this.method.lastUsedAt = new Date().toISOString();
    this.saveMethod();

    console.log('\n========== 执行完成 ==========\n');
    return results;
  }

  saveMethod() {
    if (!this.method) return;
    
    const filepath = path.join(METHODS_DIR, this.method.filename);
    fs.writeFileSync(filepath, JSON.stringify(this.method, null, 2), 'utf-8');
  }

  async run(keyword) {
    console.log(`\n[Web Guide] 正在搜索方法: "${keyword}"`);
    
    const method = this.loadMethod(keyword);
    if (!method) {
      console.log('[Web Guide] 未找到匹配的方法');
      console.log('[Web Guide] 可用方法列表:');
      const methods = this.listMethods();
      if (methods.length === 0) {
        console.log('  (暂无归档方法)');
      } else {
        methods.forEach(m => console.log(`  - ${m.name} (${m.keywords?.join(', ')})`));
      }
      return null;
    }

    await this.startBrowser();
    
    try {
      const results = await this.executeMethod();
      const successCount = results.filter(r => r.success).length;
      console.log(`执行结果: ${successCount}/${results.length} 步骤成功`);
      return { method, results };
    } finally {
      await this.closeBrowser();
    }
  }
}

module.exports = { MethodExecutor };

if (require.main === module) {
  const args = process.argv.slice(2);
  const keyword = args[0] || 'v2ray';
  
  const executor = new MethodExecutor();
  executor.run(keyword).catch(console.error);
}

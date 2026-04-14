const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_DIR = path.dirname(__dirname);
const METHODS_DIR = path.join(BASE_DIR, 'methods');

class GuideRunner {
  constructor() {
    this.browser = null;
    this.context = null;
    this.page = null;
    this.steps = [];
    this.currentStep = 0;
    this.stepResults = [];
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

  addStep(action, target, description) {
    this.steps.push({ action, target, description, result: null });
  }

  async executeStep(step) {
    const { action, target, description } = step;
    console.log(`\n[执行]: ${description}`);
    console.log(`[操作]: ${action} -> ${target}`);

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
        step.result = await this.page.evaluate(target.fn, ...(target.args || []));
        break;
      case 'waitForSelector':
        await this.page.waitForSelector(target, { state: 'visible' });
        break;
      default:
        console.log(`[未知操作]: ${action}`);
    }

    this.currentStep++;
    return step.result;
  }

  async executeAllSteps() {
    console.log('\n========== 开始执行引导流程 ==========\n');
    console.log(`共计 ${this.steps.length} 个步骤\n`);

    for (let i = 0; i < this.steps.length; i++) {
      const step = this.steps[i];
      console.log(`\n--- 步骤 ${i + 1}/${this.steps.length} ---`);
      await this.executeStep(step);
      await this.page.waitForTimeout(500);
    }

    console.log('\n========== 执行完成 ==========\n');
    return this.stepResults;
  }

  archiveMethod(name, keywords, description) {
    const methodData = {
      name,
      keywords,
      description,
      createdAt: new Date().toISOString(),
      lastUsedAt: new Date().toISOString(),
      useCount: 0,
      steps: this.steps,
      filename: `${name.toLowerCase().replace(/\s+/g, '-')}.json`
    };

    if (!fs.existsSync(METHODS_DIR)) {
      fs.mkdirSync(METHODS_DIR, { recursive: true });
    }

    const filepath = path.join(METHODS_DIR, methodData.filename);
    fs.writeFileSync(filepath, JSON.stringify(methodData, null, 2), 'utf-8');
    console.log(`[已归档]: 方法已保存到 ${filepath}`);
    return filepath;
  }

  getLastResult() {
    return this.stepResults[this.stepResults.length - 1];
  }

  async getElementInfo(selector) {
    return await this.page.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      return {
        tagName: el.tagName,
        text: el.textContent?.substring(0, 100),
        attributes: Array.from(el.attributes).reduce((acc, attr) => {
          acc[attr.name] = attr.value;
          return acc;
        }, {}),
        rect: el.getBoundingClientRect()
      };
    }, selector);
  }

  async getPageHTML() {
    return await this.page.content();
  }

  async takeScreenshot(filename) {
    const screenshotsDir = path.join(BASE_DIR, 'screenshots');
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }
    const filepath = path.join(screenshotsDir, filename);
    await this.page.screenshot({ path: filepath });
    console.log(`[截图已保存]: ${filepath}`);
    return filepath;
  }
}

module.exports = { GuideRunner };

if (require.main === module) {
  const runner = new GuideRunner();
  
  runner.startBrowser().then(async () => {
    runner.addStep('goto', 'https://jif8.net/user', '打开 JFCLOUD 登录页面');
    runner.addStep('wait', 2000, '等待页面加载');
    await runner.executeAllSteps();
    await runner.closeBrowser();
  });
}

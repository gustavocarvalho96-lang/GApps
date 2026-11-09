import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const browser = await chromium.launch({ headless: true, executablePath: process.env.BROWSER_EXECUTABLE });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
try {
  await page.setContent('<style>.hidden{display:none}textarea{width:600px;height:200px}</style><div><textarea id="area"></textarea></div>');
  await page.evaluate(() => {
    window.state = {}; window.saves = 0;
    window.saveAnamneseDraft = () => { window.saves++; };
    window.div = className => { const el = document.createElement('div'); el.className = className; return el; };
    window.textButton = (text, className, callback) => { const el = document.createElement('button'); el.textContent = text; el.className = className; el.onclick = callback; return el; };
  });
  for (const file of ['plantao-ap-inline.js', 'plantao-muc-inline.js']) await page.addScriptTag({ content: await readFile(new URL('../Apps/GPlantao/' + file, import.meta.url), 'utf8') });
  await page.evaluate(() => { mountInlineAp(document.querySelector('textarea')); mountInlineMuc(document.querySelector('textarea')); });
  const area = page.locator('textarea');
  const reset = async (value = '# AP : \n# MUC : ') => { await area.evaluate((el, text) => { el.value = text; el.focus(); el.setSelectionRange(text.length, text.length); }, value); };
  await reset('# AP : '); await area.pressSequentially('di');
  assert.equal(await area.inputValue(), '# AP : di');
  assert.ok(await page.locator('.inline-ap-panel:not(.hidden) .allergy-chip').count() > 1);
  await area.pressSequentially('sl'); assert.equal(await area.inputValue(), '# AP : Dislipidemia | ');
  await reset('# AP : '); await area.pressSequentially('av'); assert.equal(await area.inputValue(), '# AP : AVC prévio | ');
  await reset(); await area.pressSequentially('met'); assert.match(await area.inputValue(), /MUC : met$/);
  await area.pressSequentially('f'); assert.match(await area.inputValue(), /MUC : Metformina \| $/);
  await reset(); await area.pressSequentially('los'); assert.match(await area.inputValue(), /MUC : Losartana \| $/);
  assert.equal(await page.evaluate(() => state.editableText === document.querySelector('textarea').value && saves > 0), true);
  await reset('# AP : HAS | \n# MUC : Losartana | '); await area.pressSequentially('los'); assert.equal(await area.inputValue(), '# AP : HAS | \n# MUC : Losartana | ');
  await reset('# MUC : metfo'); await area.press('Backspace'); assert.equal(await area.inputValue(), '# MUC : metf');
  await reset('# MUC : Losartana'); await area.press('ArrowLeft'); await area.press('ArrowLeft'); await area.press('x'); assert.equal(await area.inputValue(), '# MUC : Losartaxna');
  await reset('# MUC : '); await area.pressSequentially('zzzz'); assert.equal(await area.inputValue(), '# MUC : zzzz');
  await reset('# MUC : '); await area.pressSequentially('val'); assert.equal(await area.inputValue(), '# MUC : Ácido valproico | ');
  await reset('# MUC : met'); await area.dispatchEvent('input', { inputType: 'insertCompositionText', isComposing: true }); assert.equal(await area.inputValue(), '# MUC : met');
  await reset('# MUC : met'); await area.dispatchEvent('click'); await page.getByRole('button', { name: 'Metformina', exact: true }).click(); assert.equal(await area.inputValue(), '# MUC : Metformina | ');
  assert.deepEqual(errors, []);
  console.log('PASS: AP e MUC completam só resultado único, sem mínimo de letras; ambiguidade, acentos, aliases, duplicatas, exclusão, edição e seleção manual.');
} finally { await browser.close(); }

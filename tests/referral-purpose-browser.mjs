import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const browser = await chromium.launch({ headless: true, executablePath: process.env.BROWSER_EXECUTABLE });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const choices = [
  ['Investigação ambulatorial', 'Investigação ambulatorial.'],
  ['Reavaliação após atendimento no PS', 'Reavaliação após atendimento no PS.'],
  ['Acompanhamento de condição crônica', 'Acompanhamento de condição crônica.'],
];
try {
  await page.goto(new URL('../GPlantao.html', import.meta.url).href);
  await page.getByRole('button', { name: 'Encaminhamento', exact: true }).click();
  const editor = page.locator('#content textarea');
  const prefix = 'À UBS / Estratégia Saúde da Família\n\nMotivo do encaminhamento:\nMotivo preenchido\n\nResumo do atendimento no PS:\nResumo preenchido\n\nExames e conduta realizados:\nExames preenchidos\n\nSolicitação:\nSolicitação personalizada\n\nFinalidade:\n';
  const suffix = '\n\nObservação adicional preservada.';
  await editor.fill(prefix + 'Acompanhamento de condição crônica.' + suffix);
  for (const [label, purpose] of [...choices, ...choices]) {
    await page.getByRole('button', { name: label, exact: true }).click();
    assert.equal(await editor.inputValue(), prefix + purpose + suffix);
  }
  // A manually changed purpose is retained too, beneath the newly selected one.
  await editor.fill(prefix + 'Detalhe manual da finalidade.' + suffix);
  await page.getByRole('button', { name: choices[0][0], exact: true }).click();
  assert.equal(await editor.inputValue(), prefix + choices[0][1] + '\nDetalhe manual da finalidade.' + suffix);
  await page.getByRole('button', { name: choices[1][0], exact: true }).click();
  assert.equal(await editor.inputValue(), prefix + choices[1][1] + '\nDetalhe manual da finalidade.' + suffix);
  await editor.fill('Encaminhamento escrito livremente.');
  await page.getByRole('button', { name: choices[2][0], exact: true }).click();
  assert.equal(await editor.inputValue(), 'Encaminhamento escrito livremente.\n\nFinalidade:\n' + choices[2][1]);
  const crlf = await page.evaluate(() => updateReferralPurpose('Motivo: preservado\r\nFinalidade:\r\nAcompanhamento de condição crônica.\r\nObservação', 'investigacao'));
  assert.equal(crlf, 'Motivo: preservado\r\nFinalidade:\r\nInvestigação ambulatorial.\r\nObservação');
  assert.deepEqual(errors, []);
  console.log('PASS: os três botões preservam todos os demais campos, observações, finalidade manual e texto livre, inclusive em trocas repetidas.');
} finally { await browser.close(); }

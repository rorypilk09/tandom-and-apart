// Run with the bundled Playwright path passed via PLAYWRIGHT_MODULE.
import {mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
await mkdir('test-results',{recursive:true});
const browser=await chromium.launch({headless:true,channel:process.env.TEST_BROWSER||'msedge'});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:5173');await page.screenshot({path:'test-results/desktop.png',fullPage:true});
assert.equal(await page.locator('#concept').isVisible(),false);
await page.getByRole('button',{name:'Help shape the idea'}).click();
await page.getByRole('button',{name:'Continue',exact:true}).click();
assert.match(await page.locator('#question-error').innerText(),/choose an answer/);
for(let i=0;i<4;i++){await page.locator('#choices input').first().check();await page.locator('#next').click();if(i<3)assert.equal(await page.locator('#concept').isVisible(),false);}
assert.equal(await page.locator('#concept').isVisible(),true);
assert.equal(await page.locator('#concept img').evaluate(i=>i.complete&&i.naturalWidth>0),true);
await page.screenshot({path:'test-results/concept.png',fullPage:true});
await page.locator('#concept-back').click();assert.equal(await page.locator('#choices input').first().isChecked(),true);
await page.locator('#next').click();await page.locator('#concept-continue').click();
for(let i=4;i<8;i++){await page.locator('#choices input').first().check();if(i===6){for(let j=1;j<4;j++)await page.locator('#choices input').nth(j).click();assert.equal(await page.locator('#choices input:checked').count(),3);}await page.locator('#next').click();}
await page.locator('#email').fill('parent@example.com');await page.locator('#research-consent').check();await page.locator('#submit-button').click();assert.match(await page.locator('#submit-error').innerText(),/opt in/);
await page.locator('#email-consent').check();await page.locator('#submit-button').click();assert.match(await page.locator('#thanks-copy').innerText(),/No answers or email have been sent or saved/);
await page.locator('#restart').click();await page.locator('[data-privacy]').last().click();assert.equal(await page.locator('#privacy').isVisible(),true);await page.keyboard.press('Escape');assert.equal(await page.locator('#privacy').isVisible(),false);
await page.setViewportSize({width:390,height:844});await page.screenshot({path:'test-results/mobile.png',fullPage:true});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true);
await page.getByRole('button',{name:'Help shape the idea'}).click();await page.screenshot({path:'test-results/mobile-question.png',fullPage:true});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true);
assert.deepEqual(errors,[]);console.log('PASS: reveal gating, required answers, back navigation, priority limit, consent, preview submission, privacy dialog, mobile overflow, image load, and runtime errors.');
await browser.close();

from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
import threading
import shutil
from playwright.sync_api import sync_playwright

server=ThreadingHTTPServer(('127.0.0.1',0),partial(SimpleHTTPRequestHandler,directory=str(Path(__file__).resolve().parents[1])))
threading.Thread(target=server.serve_forever,daemon=True).start()
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path=shutil.which('chromium'))
    page=browser.new_page(viewport={'width':390,'height':844},device_scale_factor=1)
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto(f'http://127.0.0.1:{server.server_port}/colony/')
    assert page.locator('.slot').count()==5
    assert page.locator('#stacks button').count()==4
    page.screenshot(path='/tmp/colony-mobile.png',full_page=True)
    # Repeated real clicks must fill every slot while previous ants are working.
    for _ in range(5):
        page.locator('#stacks button').first.click()
        page.wait_for_timeout(120)
    assert page.locator('.slot .box').count()==5
    assert page.locator('#stacks button:disabled').count()==4
    assert page.evaluate('missions.length')>=5
    # Pixels stay present during the outbound walk, then disappear after the bite.
    page.wait_for_function('missions.some(m=>!m.collected && simulationTime-m.born>=m.travel && simulationTime-m.born<m.travel+420)')
    assert page.evaluate('missions.some(m=>!m.collected && state.pixels[m.index]===m.color)')
    page.screenshot(path='/tmp/colony-ants-working.png',full_page=True)
    page.wait_for_function('missions.some(m=>m.carrying && state.pixels[m.index]===-1)')
    page.evaluate('start(1)')
    initial=page.evaluate('state.pixels.slice()')
    page.locator('#stacks button').first.click()
    page.wait_for_function('state.removed>0')
    page.locator('#pause').click()
    assert page.locator('#overlay-title').inner_text()=='休息一下'
    removed=page.evaluate('state.removed')
    page.wait_for_timeout(400)
    assert page.evaluate('state.removed')==removed
    page.locator('#overlay-action').click()
    page.locator('#undo').click()
    assert page.evaluate('state.moves')==0
    assert page.evaluate('state.pixels')==initial
    page.locator('#hint').click()
    assert page.locator('.hinted').count()==1
    page.locator('.hinted').click()
    page.wait_for_function('state.removed>0')
    page.locator('#pause').click()
    saved=page.evaluate('JSON.parse(localStorage.getItem("ant-colony-v1"))')
    page.reload()
    # Pause immediately after reload to check the stored state before animation progresses.
    page.evaluate('paused=true;render()')
    assert page.evaluate('state.moves')==saved['moves']
    assert page.evaluate('state.removed')>=saved['removed']
    page.locator('#help').click()
    assert page.locator('#instructions').is_visible()
    page.locator('#close-help').click()
    # Run an entire generated solution through the real browser engine/UI.
    page.evaluate('''() => {
      start(2);paused=true;
      const order=state.stacks.flat().sort((a,b)=>a.id-b.id);
      for(const box of order){
        const col=state.stacks.findIndex(s=>s[0]?.id===box.id);
        if(!Colony.activate(state,col))throw Error('Activation failed');
        let guard=0;while(state.slots.some(Boolean)&&guard++<100)Colony.tick(state,3);
        if(guard>=100)throw Error('Stalled');
      }
      paused=false;render();save();
    }''')
    assert page.locator('#overlay-title').inner_text()=='搬运完成！'
    page.locator('#overlay-action').click()
    assert page.locator('#level').inner_text()=='3'
    page.evaluate('state.pixels.fill(0);state.slots=Array.from({length:5},()=>({color:1,count:5,id:0}));Colony.tick(state);render()')
    assert page.locator('#overlay-title').inner_text()=='工作槽堵住了'
    page.locator('#overlay-action').click()
    assert page.evaluate('state.status')=='playing'
    for width in [320,390,1280]:
        page.set_viewport_size({'width':width,'height':900})
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
    assert not errors,errors
    browser.close()
server.shutdown()
print('PASS: placement, animation, pause, undo, hints, persistence, help, win/lose, next level, responsive layout')

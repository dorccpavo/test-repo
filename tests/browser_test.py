from pathlib import Path
import shutil
import threading
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler

server = ThreadingHTTPServer(("127.0.0.1", 0), partial(SimpleHTTPRequestHandler, directory=str(Path(__file__).resolve().parents[1])))
threading.Thread(target=server.serve_forever, daemon=True).start()
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, executable_path=shutil.which("chromium"))
    page = browser.new_page(viewport={"width": 390, "height": 844})
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto(f'http://127.0.0.1:{server.server_port}/')
    assert page.locator('.cell').count() == 81
    state = page.evaluate('JSON.parse(localStorage.getItem("sudoku-web-v1"))')
    index = state['puzzle'].index(0)
    cell = page.locator('.cell').nth(index)
    cell.click()
    page.locator('#notes').click()
    page.keyboard.press('3')
    assert cell.inner_text().strip() == '3'
    page.locator('#notes').click()
    wrong = state['solution'][index] % 9 + 1
    page.keyboard.press(str(wrong))
    assert 'error' in cell.get_attribute('class')
    assert '错误 1' in page.locator('#stats').inner_text()
    page.locator('#undo').click()
    assert 'error' not in cell.get_attribute('class')
    page.locator('#hint').click()
    assert cell.inner_text() == str(state['solution'][index])
    page.reload()
    assert page.locator('.cell').nth(index).inner_text() == str(state['solution'][index])
    page.once('dialog', lambda dialog: dialog.accept())
    page.select_option('#difficulty', '2')
    assert page.evaluate('JSON.parse(localStorage.getItem("sudoku-web-v1")).difficulty') == 2
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
    page.set_viewport_size({"width": 320, "height": 700})
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
    page.evaluate('game.board=game.solution.slice(); change()')
    assert '恭喜完成' in page.locator('#status').inner_text()
    assert page.locator('#keyboard button:disabled').count() == 9
    assert not errors, errors
    browser.close()
    server.shutdown()
    print('PASS: browser input, notes, errors, undo, hints, persistence, difficulty, mobile layout, completion')

import subprocess
import time
import os
from playwright.sync_api import sync_playwright

def main():
    os.makedirs('screenshots', exist_ok=True)
    server = subprocess.Popen(['node', 'serve.ts', '--port', '8123'])
    time.sleep(2)

    with sync_playwright() as p:
        browser = p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader'])
        
        shots = [
            ('start', '1-start.png'),
            ('play', '2-play.png'),
            ('buy', '3-buy.png'),
            ('end', '4-end.png')
        ]

        for mode, filename in shots:
            page = browser.new_page(viewport={'width': 1280, height: 720})
            url = f'http://localhost:8123/?shot={mode}'
            print(f'Loading {url}...')
            page.goto(url)
            try:
                page.wait_for_function('window.__shotReady === true', timeout=10000)
            except Exception as e:
                print(f'Timeout waiting for shot {mode}: {e}')
            time.sleep(0.5)
            path = os.path.join('screenshots', filename)
            page.screenshot(path=path)
            print(f'Saved {path}')
            page.close()

        browser.close()
    server.terminate()

if __name__ == '__main__':
    main()

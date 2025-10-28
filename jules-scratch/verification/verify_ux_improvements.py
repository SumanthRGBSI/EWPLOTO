
import os
from playwright.sync_api import sync_playwright, Page, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # Get the absolute path to the index.html file
    file_path = os.path.abspath('index.html')
    page.goto(f'file://{file_path}')

    # 1. Verify Template View Empty States
    page.evaluate("navigate('templates')")
    page.wait_for_selector('#templates-view.active')
    page.screenshot(path='jules-scratch/verification/01-templates-view.png')

    # 2. Verify Dashboard View
    page.evaluate("navigate('dashboard')")
    page.wait_for_selector('#dashboard-content .permit-card')
    page.screenshot(path='jules-scratch/verification/02-dashboard-view.png')

    # 3. Verify Dashboard Table View
    page.click('#view-toggle')
    page.wait_for_selector('table')
    page.screenshot(path='jules-scratch/verification/03-dashboard-table-view.png')

    # 4. Verify Permit Details View (Permit 2 has LOTO)
    page.evaluate("navigate('permit-details', 2)")
    page.wait_for_selector('#permit-details-card')
    page.screenshot(path='jules-scratch/verification/04-permit-details-view.png')

    # 5. Verify LOTO Tab
    page.locator('.tab-btn', has_text='LOTO').click()
    page.wait_for_selector('#loto-tab.active')
    page.screenshot(path='jules-scratch/verification/05-loto-tab.png')

    # 6. Verify Disabled Button Tooltip (by hovering)
    page.evaluate("navigate('permit-details', 1)")
    page.wait_for_selector('#permit-details-card')
    page.hover('button[disabled]')
    page.screenshot(path='jules-scratch/verification/06-disabled-button-tooltip.png')

    browser.close()

with sync_playwright() as playwright:
    run(playwright)

import {test,expect} from '@playwright/test'
import { visitProviderPages } from './provider-pages.mjs'

test('Orange location shows county-wide records in one table without asking for a second city',async({page})=>{
 await page.addInitScript(()=>{navigator.geolocation.getCurrentPosition=ok=>ok({coords:{latitude:33.8366,longitude:-117.9143,accuracy:30}})})
 await page.goto('/')
 const requests=[]
 page.on('request',r=>{if(r.method()!=='GET')requests.push(r.url())})
 await page.getByRole('button',{name:'Use current location'}).click()
 await expect(page.getByLabel('California county')).toHaveValue('Orange')
 await expect(page.locator('tr[data-provider="county-Orange"]')).toBeVisible()
 const entries=await visitProviderPages(page.locator('section[aria-labelledby="local-support-heading"]'))
 expect(entries.filter(entry=>entry.id.startsWith('oc-')).length).toBeGreaterThan(3)
 await expect(page.locator('#local-city-filter')).toHaveCount(0)
 await expect(page.locator('section[aria-labelledby="local-support-heading"] table')).toHaveCount(1)
 await expect(page.locator('section[aria-labelledby="local-support-heading"]')).toContainText('County-wide listings, not nearest matches.')
 await expect(page.getByText(/Confirm it, then/)).toHaveCount(0)
 expect(requests).toEqual([])
})

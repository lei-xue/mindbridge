import {test,expect} from '@playwright/test'

test('Orange location immediately shows county contact and a bounded site preview without confirmation',async({page})=>{
 await page.addInitScript(()=>{navigator.geolocation.getCurrentPosition=ok=>ok({coords:{latitude:33.8366,longitude:-117.9143,accuracy:30}})})
 await page.goto('/')
 const requests=[]
 page.on('request',r=>{if(r.method()!=='GET')requests.push(r.url())})
 await page.getByRole('button',{name:'Use current location'}).click()
 await expect(page.getByLabel('California county')).toHaveValue('Orange')
 await expect(page.locator('section[aria-label="County mental health plan"]')).toBeVisible()
 await expect(page.locator('section[aria-label="Orange County Behavioral Health Plan sites"] article')).toHaveCount(20)
 await expect(page.getByText(/Confirm it, then/)).toHaveCount(0)
 expect(requests).toEqual([])
})

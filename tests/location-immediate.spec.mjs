import {test,expect} from '@playwright/test'

test('Orange location completes with the county contact without a second city form or arbitrary sites',async({page})=>{
 await page.addInitScript(()=>{navigator.geolocation.getCurrentPosition=ok=>ok({coords:{latitude:33.8366,longitude:-117.9143,accuracy:30}})})
 await page.goto('/')
 const requests=[]
 page.on('request',r=>{if(r.method()!=='GET')requests.push(r.url())})
 await page.getByRole('button',{name:'Use current location'}).click()
 await expect(page.getByLabel('California county')).toHaveValue('Orange')
 await expect(page.locator('section[aria-label="County mental health plan"]')).toBeVisible()
 await expect(page.locator('section[aria-label="Orange County Behavioral Health Plan sites"]')).toHaveCount(0)
 await expect(page.locator('#orange-county-city')).toHaveCount(0)
 await expect(page.getByText(/Confirm it, then/)).toHaveCount(0)
 expect(requests).toEqual([])
})

import {test,expect} from '@playwright/test'

test('unavailable position ends once without a precise-retry loop and manual search clears its one message',async({page})=>{
 await page.clock.install()
 await page.addInitScript(()=>{
  window.geoOptions=[]
  navigator.geolocation.getCurrentPosition=(ok,fail,options)=>{
   window.geoOptions.push(options)
   fail({code:2})
  }
 })
 await page.goto('/')
 await page.getByRole('button',{name:'Use current location',exact:true}).click()
 await expect(page.getByRole('status')).toHaveCount(1)
 await expect(page.getByRole('status')).toContainText('Your device could not determine a location')
 await expect(page.getByRole('button',{name:'Try precise location'})).toHaveCount(0)
 await page.clock.runFor(60000)
 const options=await page.evaluate(()=>window.geoOptions)
 expect(options).toHaveLength(1)
 expect(options[0]).toEqual({maximumAge:60000,timeout:6000,enableHighAccuracy:false})
 await page.getByLabel('California county').selectOption('Colusa')
 await expect(page.getByRole('status')).toHaveCount(0)
 await page.getByRole('button',{name:'Find support options'}).click()
 await expect(page.locator('tr[data-provider="county-Colusa"]')).toBeVisible()
})

test('timeout is distinguished from denial and coordinates are not needed for manual search',async({page})=>{
 await page.addInitScript(()=>{navigator.geolocation.getCurrentPosition=(ok,fail)=>fail({code:3})})
 await page.goto('/')
 await page.getByRole('button',{name:'Use current location'}).click()
 await expect(page.getByRole('status')).toContainText('Location timed out')
 await page.getByLabel('California county').selectOption('Colusa')
 await page.getByRole('button',{name:'Find support options'}).click()
 await expect(page.getByRole('link',{name:'Call county plan'})).toBeVisible()
})

test('mobile hero mascot retains full size',async({page})=>{
 await page.setViewportSize({width:390,height:844})
 await page.goto('/')
 const height=await page.locator('main section').first().locator('svg').evaluate(e=>e.getBoundingClientRect().height)
 expect(height).toBeGreaterThanOrEqual(96)
})

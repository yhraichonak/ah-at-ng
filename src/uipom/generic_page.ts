import {Page, expect, test, Locator} from '@playwright/test';
import {TableComponent} from "./table_component";
import * as allure from "allure-js-commons";
import {sleep} from "../api/utils";

export class GenericPage {
    constructor(public page: Page) {}

    async go_to(url:string) {
            return this.page.goto(url);
    }

    async refresh() {
        await this.page.reload({ waitUntil: 'networkidle' });
        await sleep(1)
    }

    async getUserMenu() {
        return await test.step(`Get user menu`, async()=> {
            let result= await this.page.locator('css=span[data-test-id="user-menu"]');
            await expect(result).toBeVisible({timeout:20000});
            return result
        })
    }


    async clickStatusButton() {
        return await test.step(`Open Status page`, async()=> {
            await this.page.locator('xpath=//a[contains(.,"Status")]').click();
        })
    }
    async getDialog(title:string) {
        return await test.step(`Get dialog ${title}`, async()=> {
            return await this.page.locator("xpath=//div[@role='dialog' and @data-state='open' and contains(., '" + title + "')]");
        })
    }
    async openTab(tab:string) {
        await test.step(`Open tab ${tab}`, async()=> {
            let tabElemnt = await this.page.locator("xpath=//button[@role='tab' and contains(., '" + tab + "')]");
            await tabElemnt.click();
            this.sleep(500)
        })
    }

    async getNotificationBarItems() :Promise<Locator>{
       return await test.step(`Get Global Notification bar items`, async()=> {
           let res = this.page.locator("div[role='alert']");
            return res;
        })
    }
    async getSidePanelTabs():Promise<Locator> {
        return await this.page.locator("xpath=//ul[@data-sidebar='menu']//a[@data-sidebar='menu-button']");
    }
    async getElement(loc:string):Promise<Locator> {
        return await this.page.locator(loc);
    }
    async clickButton(title:string) {
        await test.step(`Click button ${title}`, async()=> {
            let tabElemnt = await this.page.locator("xpath=//button[.= '" + title + "']|//a[contains(., '" + title + "')]");
            await tabElemnt.click();
        })
    }
    async waitForNotification(notification:string) {
        await test.step(`Wait for notification ${notification}`, async()=> {
            await expect(this.page.locator("xpath=//div[@role='region' and contains(@aria-label,'Notifications') and contains(., '"+notification+"')]//li[@data-state='open']")).toBeVisible();
        })
    }
    async getTextContent() {
        return await test.step(`Get page text content`, async()=> {
            return await this.page.locator("xpath=//main").first().textContent();
        })
    }
    async getNavBreadCrumbs() {
        return await test.step(`Get navigation breadcrimbs`, async()=> {
            return await this.page.locator("css=nav[aria-label='breadcrumb']").first().textContent();
        })
    }
    async textIsLoadedOnPage(text:string) {
        await this.sleep(200)
        expect(await this.page.locator(`xpath=//div[contains(@class,'tracking-tigh') and contains(.,'${text}')] | //h2[contains(.,'${text}')]`).all()).toHaveLength(1)
    }

    async getActiveTab() {
        return await test.step(`Get active tab`, async()=> {
            let tab=await this.page.locator("xpath=//button[@role='tab' and  @aria-selected='true']");
            if (await tab.count()==0){
               throw new Error("Unable to detect active tab");
            }
            return tab;
        })
    }

    async getSecondaryTabs() {
        return await test.step(`Get all tabs`, async()=> {
            return await this.page.locator("button[role='tab']").allTextContents();
        })
    }
    async getTable() {
       return await test.step(`Get table`, async()=> {
            return await new TableComponent(await this.page.locator("body"));
        })
    }

    async getSearchInput() {
        return await this.page.locator(`xpath=//input[@placeholder="Search"]`);
    }
    async navigateMenu(menu:string) {
        await test.step(`Navigate menu ${menu}`, async()=> {
            let menuItem = await this.page.locator(`xpath=//a[@data-sidebar="menu-button" and contains(.,'${menu}')]`);
            await menuItem.click();
            await this.sleep(500)
        })
    }

    async waitForLoading(){
        await expect( this.page.getByText('Loading...')).toHaveCount(0);
        await this.page.waitForLoadState('domcontentloaded')
    }

    async setStatusFilters(filters:string[]) {
        await test.step(`Set status filters ${filters}`, async()=> {
            await (await this.page.locator(`xpath=//button[@aria-haspopup='dialog' and contains(.,'Status')]`)).click();
            let elements=(await this.page.$$(`xpath=//div[@role='dialog']//div[@role='option']`))
            for (const element of elements) {
                const data_value = await element.getAttribute("data-value");
                const selected = (await (await element.$(`svg.lucide-check`)).getAttribute('class')).toString().includes("opacity-100")
                if (filters.includes(data_value)) {
                    if (!selected) {await  element.click()}
                }else {
                    if (selected) {await  element.click()}
                }
            }
            await (await this.page.locator(`xpath=//button[@aria-haspopup='dialog' and contains(.,'Status')]`)).click();
        })
    }

    async toggleShowPricedFilter() {
        await test.step(`Toggle Show Priced filter`, async()=> {
            await (await this.page.locator(`xpath=//button[@id='switch-input-Has End Customer Price']`)).click();
            await this.sleep(500)
        })
    }
    async setLanguage(lang:string) {
        await test.step(`Set language to ${lang}`, async()=> {
            await (await this.getTopMenuIcon("language")).click();
            await  this.selectMenuOption(lang);
            await this.sleep(500)
        })
    }
    async setOrganization(org:string) {
        return await test.step(`Set organization to ${org}`, async()=> {
            let currentOrg=await this.getCurrentOrganizationText()
            if (currentOrg!==org) {
                if ((await this.page.locator(`css=input[placeholder='Find organizations']`).count()) == 0) {
                    await this.page.click(`css=div[data-sidebar='header'] button`);
                }
                await this.selectOrg(org);
                await sleep(1)
                return true
            }
            return false
        })
    }

    getCurrentOrganizationIcon() {
            return this.page.locator(`css=div[data-sidebar='header'] button img`);
    }

    getCurrentOrganizationText() {
        return this.page.locator(`css=div[data-sidebar='header'] button`).textContent();
    }

    async selectOrg(org:string) {
        await test.step(`Select organization ${org}`, async()=> {
            let orgItem= await this.page.locator(`xpath=.//div[@role='option' and contains(., "${org}")]`);
            await orgItem.click();
        })
    }

     async getOrgIconInDropdown(org:string) {
        if ((await this.page.locator(`css=input[placeholder='Find organizations']`).count())==0) {
            await this.page.click(`css=div[data-sidebar='header'] button`);
        }
        return this.page.locator(`xpath=.//div[@role='option' and contains(., "${org}")]//img`);
    }

    async getTopMenuIcon(menu:string) {
        return await test.step(`Get top menu icon ${menu}`, async()=> {
            if (menu.includes("language")){
                return await this.page.locator(`css=span[data-test-id='language-menu']`)
            } else{
                return await this.page.locator(`css=span[data-test-id='user-menu']`)
            }
        })
    }

    async selectMenuOption(menu:string) {
         await test.step(`Select menu option ${menu}`, async()=> {
            let menuItem= await this.page.locator(`xpath=.//div[@role='menu']/div[@role='menuitem' and contains(., "${menu}")]`);
            await menuItem.click();
        })
    }
    async openUserMenu(menuItem:string) {
        await test.step(`Open user menu ${menuItem}`, async()=> {
            await (await this.getTopMenuIcon("user")).click();
            await  this.selectMenuOption(menuItem);
            await this.sleep(500)
        })
    }

    async expandUserMenu():Promise<Locator> {
        return await test.step(`Expand user menu`, async()=> {
            await (await this.getTopMenuIcon("user")).click();
            return  this.page.locator(`div[role='menu']`)
        })
    }
    async sleep(ms) {
        return allure.step(`Wait for [${ms}] ms `, async()=> {
            return new Promise(resolve => setTimeout(resolve, ms));
        })
    }
    async scrollDown() {
        await this.page.locator(`css=.infinite-scroll-component tbody tr:last-child`).scrollIntoViewIfNeeded();
        await sleep(1)
    }


    async globalSearch(value:string): Promise<Locator>  {
       return await test.step(`Global search [${value}]`, async()=> {
            await (await this.page.locator(`xpath=//button[contains(.,"Search") or contains(.,"Suche") ]`)).click();
            let menuItem = await this.page.locator(`xpath=//input[contains(@placeholder,"Search in Asset Hub")]`);
            await menuItem.fill(value);
            await this.sleep(1000);
            await expect(await  this.page.locator(".lucide-loader-circle")).toHaveCount(0);
            let search_results = await this.page.locator(`xpath=//div[@aria-label="Suggestions"]`);
            return search_results
        })
    }

    async getGlobalSearchResults(resultsPanel:Locator,category:string) {
        return await test.step(`Get global search results from category [${category}]`, async()=> {
            let results=await resultsPanel.locator("xpath=//div[@role='presentation'][@data-value='"+category+"']//div[@role='option']").allTextContents();
            return results
        })
    }
    async clickGlobalSearchResultItem(resultsPanel:Locator,category:string, text:string) {
         await test.step(`Get global search results from category [${category}]`, async()=> {
           await (await resultsPanel.locator("xpath=//div[@role='presentation'][@data-value='"+category+"']//div[@role='option' and contains(.,'"+text+"')]").first()).click();
        })
    }
    async clearGlobalSearch() {
        await test.step(`Clear global search`, async()=> {
            await this.page.locator(`xpath=//header//button[contains(@innerHTML, "Clear")], )`).click();
        })
    }
}
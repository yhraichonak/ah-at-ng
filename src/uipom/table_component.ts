import {Locator, Page, test} from '@playwright/test';
import commonHelper from "../api/CommonHelper";
import {sleep} from "../api/utils";
export class TableComponent {
    constructor(private container: Locator) {
    }

    async searchAndOpen(query:string): Promise<void>  {
      await this.search(query);
      await this.open(query);
    }

    async search(query:string): Promise<void>  {
        await test.step(`Search [${query}]`, async()=> {
            await this.container.locator('xpath=//input[@placeholder="Search"]').fill(query);
        });
        await sleep(2)
    }

    async loadMore(): Promise<void>  {
        await test.step(`Load more`, async()=> {
            await this.container.locator('xpath=//button[contains(.,"Load More")]').click();
        })
        await commonHelper.sleep(500)
    }


    async getText(): Promise<String>  {
       return await test.step(`Get table text more`, async()=> {
            return await this.container.textContent();
        })
    }

    async open(query:string): Promise<void>  {
        await test.step(`Open item [${query}]`, async()=> {
            let cells=await (await this.findRow(query)).locator("td").all();
            await cells[1].click();
        });
        await commonHelper.sleep(500)
    }

    async openAction(query:string,action:string): Promise<void>  {
        await test.step(`Open row [${query}] action [${action}]`, async()=> {
            let targetRow = await this.findRow(query);
            let menuSwitcher= await targetRow.locator("xpath=//button[@aria-haspopup='menu']")
                if (await menuSwitcher.count()>0){
                    await menuSwitcher.first().click()
                    await this.container.locator("xpath=//div[@role='menu' and @data-state='open']//button[.='" + action + "']").click();
                }       else{
                    throw new Error(`Unable to open Actions menu for row [${query}]`)
                }
        })
        }

    async getBodyAsText()  {
        return await test.step(`Get body as text`, async()=> {
            return await this.container.locator('xpath=//tbody').textContent();
        })
    }

    async getHeaders()  {
        return await test.step(`Get headers`, async()=> {
            const headers = await this.container.locator('//th');
            const headerString = await headers.evaluateAll((elements) =>
                elements.map((el) => el.textContent.trim())
            );
            return headerString;
        })
    }
    async getColumn(index:number)  {
        return await test.step(`Get column [${index}]`, async()=> {
            return await this.container.locator('//td[' + index + ']').allTextContents();
        })
    }
    async getColumnElement(index:number)  {
        return await test.step(`Get column element [${index}]`, async()=> {
            return await this.container.locator('//th[' + index + ']/button').first();
        })
    }
    async getRows():Promise<Locator>{
        return await test.step(`Get rows`, async()=> {
           return await this.container.locator('//tbody/tr');
        })
    }

    async selectARow( ){
        await test.step(`Select any row`, async()=> {
            await this.container.locator('xpath=//tbody/tr//button[@role="checkbox"]').first().click();
        })
    }
    async findRow(query:string) {
        return await test.step(`Find row [${query}]`, async()=> {
            return (await this.container.locator('//tbody/tr')).filter({hasText: new RegExp(`.*${query}.*`)}).first();
        })
    }

    async findRowAsMap(query:string) {
        return await test.step(`Find row as map [${query}]`, async()=> {
            let headers = await this.getHeaders()
            let cells = await (await this.findRow(query)).locator("td").evaluateAll((elements) =>
                elements.map((el) => el.textContent.trim())
            );
            if (headers.length !== cells.length) {
                throw new Error("The number of headers and cells must be the same.");
            }
            const result: { [key: string]: string } = headers.reduce((map, key, index) => {
                map[key] = cells[index];
                return map;
            }, {});
            return result;
        })
    }
    async getTableColumn(column:string) {
        return await test.step(`Get table column [${column}]`, async()=> {
            let headers = await this.getHeaders();
            let colIndex = headers.indexOf(column);
            if (colIndex==-1){throw new Error(`Column ${column} not found`);}
            const result = await this.getColumn(colIndex + 1);
            return result;
        })
    }

    async getTableColumnElement(column:string) {
        return await test.step(`Get table column element [${column}]`, async()=> {
            let headers = await this.getHeaders();
            let colIndex = headers.indexOf(column);
            return await this.getColumnElement(colIndex + 1);
        })
    }
    async toggleColumnVisibilityMenu() {
        return await test.step(`Toggle column visibility menu`, async()=> {
            let viewLink = await this.container.locator("//main//button[@aria-haspopup='menu']");
            if ((await viewLink.last().getAttribute("aria-expanded"))=="false") {
                await viewLink.last().click();
            }
            return this.container.locator("//div[@role='menu']");
        })
    }

    async setColumnVisibility(column:string, visible:boolean): Promise<void>  {
        return await test.step(`Set column [${column}] visibility [${visible}]`, async()=> {
            let menu = await this.toggleColumnVisibilityMenu();
            let menu_items =  await menu.locator("//div[@role='menuitemcheckbox' and contains(.,'" + column + "')]");
            if ( await menu_items.count() !=0) {
                let actual_visible = await menu_items.first().getAttribute("aria-checked")
                if (`${visible}` != `${actual_visible}`) {
                    await menu_items.first().click();
                }
            }else{
                throw new Error(`Column [${column}] is not available for selection`)
            }
        })
    }
}
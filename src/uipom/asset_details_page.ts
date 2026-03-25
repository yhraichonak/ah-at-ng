import {GenericPage} from "./generic_page";
import {test} from "@playwright/test";
import {ENV} from "../../environment";

export class AssetDetailsPage extends GenericPage  {
    async navigate(sku:string, suffix="" ) {
        await test.step(`Open page`, async()=> {
            await this.page.goto(`${ENV.BASE_FRONTEND_URL}/assets/${sku}${suffix}`,{waitUntil:"networkidle"});
        })
    }
}
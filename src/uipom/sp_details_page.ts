import {GenericPage} from "./generic_page";
import {test} from "@playwright/test";
import {ENV} from "../../environment";

export class ServicePackDetailsPage extends GenericPage  {
    async navigate(sp_id:string, suffix="" ) {
        await test.step(`Open page`, async()=> {
            await this.page.goto(`${ENV.BASE_FRONTEND_URL}/service-packs/${sp_id}${suffix}`,{waitUntil:"networkidle"});
        })
    }
}
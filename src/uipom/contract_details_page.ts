import {GenericPage} from "./generic_page";
import {RequestQuoteFromContractDialog} from "./request_quote_from_contract_dialog";

export class ContractDetailsPage extends GenericPage  {
    async openRequestChangeDialog() {
        await this.clickButton("Request Quote");
        this.sleep(500)
        return new RequestQuoteFromContractDialog(this.page);
    }
}
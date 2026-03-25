import {ENV} from "../../environment";
import TestData from "../tests/testdata";
import commonAPIHelper from "./CommonAPIHelper";
import * as allure from "allure-js-commons";
import request from "supertest";
import { serialize } from 'object-to-formdata';
import pdfParse from "pdf-parse";
import { execSync} from "node:child_process";
import {sleep} from "./utils";
import fs from "fs";
class supertestAHAPIHelper {

     BASE_URL: string = ENV.BASE_URL;
     WEBHOOK_URL: string = ENV.WEBHOOK_URL;
     WH_CLIENT_ID: string = ENV.WH_CLIENT_ID;
     WH_CLIENT_SECRET: string = ENV.WH_CLIENT_SECRET;
     COMMON_TOKEN: string = "";
     COMMON_SA_TOKEN: string = "";
     WEBHOOKS_TOKEN: string = "";
     async getStatus() {return commonAPIHelper.send("GET", this.BASE_URL,"/", null, null);}
    async getHealth() {return commonAPIHelper.send("GET", this.BASE_URL,"/health", null, null);}
     async clearCommonSession() {
          return await allure.step(`API: Clear common session`, async()=> {
               if (this.COMMON_TOKEN) {
                    const payload = {"access_token": this.COMMON_TOKEN}
                    await commonAPIHelper
                        .send("POST", this.BASE_URL, "/auth/api/revoke-session",
                            {"Authorization": "Bearer " + this.COMMON_TOKEN,
                            "x-organization-id":TestData.defaultOrgId}, payload)
                    this.COMMON_TOKEN = "";
               }
          })
     }
     async sendWebhook(payload:object, name:string, multiname:string) {
         let objectIdAttribute;
         switch(name) {
             case "quote": {objectIdAttribute = "QuoteId"; break;}
             case "contract": {objectIdAttribute = "ContractId";break;}
             default: {
                 throw new Error("Unrecognized object webhook payload provided: " + name);
             }
         }
          return await allure.step(`API: Send ${name} webhook`, async()=> {
               let result=await commonAPIHelper
                   .send("POST", this.WEBHOOK_URL, "/"+multiname+"/"+payload[objectIdAttribute],
                       {"Authorization": "Bearer " + this.WEBHOOKS_TOKEN}, payload).then((r) => {
                        expect(r.statusCode).toBe(200);
                        return r;
                   });
               return result
          })
     }

     async sendEntitiesWebhook(payload:object, id:string, name:string, multiname:string) {
          return await allure.step(`API: Send ${name} entities [${JSON.stringify(payload)}]`, async()=> {
               let result=await commonAPIHelper
                   .send("POST", this.WEBHOOK_URL, "/"+multiname+"/"+id+"/"+name+"Entities", null, payload).then((r) => {
                        expect(r.statusCode).toBe(200);
                        return r;
                   });
               return result
          })
     }
     async sendItemsWebhook(payload:object, id: string, name:string, multiname:string) {
          return await allure.step(`API: Send address ${name} [${JSON.stringify(payload)}]`, async()=> {
               let result=await commonAPIHelper
                   .send("POST", this.WEBHOOK_URL, "/"+multiname+"/"+id+"/"+name+"Items", null, payload).then((r) => {
                        expect(r.statusCode).toBe(200);
                        return r;
                   });
               return result
          })
     }

     async sendDevAsset(token:string, orgid:string,  payload:object) {
          return await allure.step(`API: Send dev asset [${JSON.stringify(payload)}] to organization [${orgid}]`, async()=> {
               return await commonAPIHelper
                   .send("POST", this.BASE_URL, "/assets/dev", {
                        "Authorization": "Bearer " + token,
                        "x-organization-id": orgid
                   }, payload)
          })
     }

    async getAsset(token:string,  assetSerial:string,orgid:string,  ) {
        return await allure.step(`API: Get asset with SN [${assetSerial}] from organization [${orgid}]`, async()=> {
            return await commonAPIHelper
                .send("GET", this.BASE_URL, "/assets/" + assetSerial, {
                    "Authorization": "Bearer " + token,
                    "x-organization-id": orgid
                }, null)
        })
    }

    async getWarrantyHistory(token:string,  serialNumber:string, productSKU:string,orgid:string,  ) {
        return await allure.step(`API: Get asset Warranty for SN [${serialNumber}] and  productSKU [${productSKU}]from organization [${orgid}]`, async()=> {
            return await commonAPIHelper
                .send("GET", this.BASE_URL, `/assets/warranty/${serialNumber}/${productSKU}`  , {
                    "Authorization": "Bearer " + token,
                    "x-organization-id": orgid
                }, null)
        })
    }
     async getQuote(token:string, orgid:string,  quoteId:string) {
          return await allure.step(`API: Get quote [${quoteId}] from organization [${orgid}]`, async()=> {
               return await commonAPIHelper
                   .send("GET", this.BASE_URL, "/quotes/" + quoteId, {
                        "Authorization": "Bearer " + token,
                        "x-organization-id": orgid
                   }, null)
          })
     }
    async getQuoteRequestHistory(token:string, orgid:string,  quoteId:string, suffix="") {
        return await allure.step(`API: Get quote [${quoteId}] requests history from organization [${orgid}]`, async()=> {
            return await commonAPIHelper
                .send("GET", this.BASE_URL, "/quotes/" + quoteId+`/requests${suffix}`, {
                    "Authorization": "Bearer " + token,
                    "x-organization-id": orgid
                }, null)
        })
    }

    async getQuoteRequestHistoryWithParams(token:string, orgid:string,  quoteId:string, limit:string, cursor: string,) {
        return await allure.step(`API: Get quote [${quoteId}] requests history from organization [${orgid}]`, async()=> {
            return await commonAPIHelper
                .send("GET", this.BASE_URL, "/quotes/" + quoteId+"/requests"+"?limit="+limit+"&cursor="+cursor, {
                    "Authorization": "Bearer " + token,
                    "x-organization-id": orgid
                }, null)
        })
    }
    async getQuoteAssets(token:string, orgid:string,  quoteId:string,url_suffix="") {
        return await allure.step(`API: Get quote [${quoteId}] assets suffix [${url_suffix}] from organization [${orgid}]`, async()=> {
            return await commonAPIHelper
                .send("GET", this.BASE_URL, "/quotes/" + quoteId+`/assets${url_suffix}`, {
                    "Authorization": "Bearer " + token,
                    "x-organization-id": orgid
                }, null)
        })
    }
    async getQuotesAssetsWithParams(token:string, orgid:string, quoteId:string, limit:string, cursor: string, search: string, filters: string ) {
        return await allure.step(`API: Get quote [${quoteId}] assets with params`, async()=> {
            return await commonAPIHelper
                .send("GET", this.BASE_URL, "/quotes/" + quoteId+"/assets"+"?limit="+limit+"&cursor="+cursor+"&search="+search+"&"+filters, {
                    "Authorization": "Bearer " + token,
                    "x-organization-id": orgid
                }, null)
        })
    }
    async getQuoteContracts(token:string, orgid:string,  quoteId:string,url_suffix="") {
        return await allure.step(`API: Get quote [${quoteId}] contracts from organization [${orgid}]`, async()=> {
            return await commonAPIHelper
                .send("GET", this.BASE_URL, "/quotes/" + quoteId+"/contracts"+url_suffix, {
                    "Authorization": "Bearer " + token,
                    "x-organization-id": orgid
                }, null)
        })
    }

    async getUrl(token:string,url:string, orgid=TestData.defaultOrgId ) {

              let result= await commonAPIHelper.send("GET", this.BASE_URL, url, {
                    "Authorization": "Bearer " + token,
                    "x-organization-id": orgid
                }, null)
            return result;
    }

    async sendUrl(token:string,requestType,url:string, body,orgid ) {
        let result= await commonAPIHelper.send(requestType, this.BASE_URL, url, {
            "Authorization": "Bearer " + token,
            "x-organization-id": orgid
        }, body)
        return result;
    }

    async getQuotesContractsWithParams(token:string, orgid:string, quoteId:string, limit:string, cursor: string, search: string, filters: string ) {
        return await allure.step(`API: Get quote [${quoteId}] assets with params`, async()=> {
            return await commonAPIHelper
                .send("GET", this.BASE_URL, "/quotes/" + quoteId+"/contracts"+"?limit="+limit+"&cursor="+cursor+"&search="+search+"&"+filters, {
                    "Authorization": "Bearer " + token,
                    "x-organization-id": orgid
                }, null)
        })
    }
    async sendQuoteChangeRequest(token:string, orgid:string, quoteId:string, payload:object) {
        return await allure.step(`API: P0st quote [${quoteId}] change request`, async()=> {
            return await commonAPIHelper
                .send("POST", this.BASE_URL, "/quotes/" + quoteId+"/change-request", {
                    "Authorization": "Bearer " + token,
                    "x-organization-id": orgid
                }, payload)
        })
    }

    async sendQuotesRequest(token:string, orgid:string, payload:object) {
        return await allure.step(`API: Post quotes request`, async()=> {
            return await commonAPIHelper
                .send("POST", this.BASE_URL, "/quotes", {
                    "Authorization": "Bearer " + token,
                    "x-organization-id": orgid
                }, payload)
        })
    }
    async sendQuotesRequestMultipart(token:string, orgid:string, payload:object) {
        let req=request(this.BASE_URL).post(`/quotes`)
        let data=serialize(payload,{ indices: true });
        for (const [k, v] of (data as any).entries()) {
            req = req.field(k, String(v));
        }
        return await req.set( {"Authorization": "Bearer " + token,"x-organization-id": orgid});
    }

    async sendQuoteApproveRequest(token:string, quoteid:string , attachment:string, comment:string, poNumber:string, orgid:string) {
        return await request(this.BASE_URL)
            .post(`/quotes/${quoteid}/approve`)
            .attach("attachPo",attachment)
            .field("comment",comment)
            .field("poNumber",poNumber)
            .set( {
                "Authorization": "Bearer " + token,
                "x-organization-id": orgid
            });
    }

    async sendSPQuoteApproveRequest(token:string,spid:string, quoteid:string, request_details:object, orgid:string) {
        return await request(this.BASE_URL)
            .post(`/service-packs/${spid}/quotes/${quoteid}/approve`)
            .field("legalAgreementId",request_details['agreement'])
            .field("serviceGroupSku",request_details['sgSKU'])
            .field("serviceGroupName",request_details['sgName'])
            .field("serviceGroupYears",request_details['sgYears'])
            .field("serviceGroupPrice",request_details['sgPrice'])
            .field("serviceGroupCurrency",request_details['sgCurrency'])
            .field("poNumber",request_details['poNumber'])
            .attach("attachPo",request_details['attachment'])
            .field("comment",request_details['comment'])
            .set( {
                "Authorization": "Bearer " + token,
                "x-organization-id": orgid
            });
    }
    async sendQuoteDeclineRequest(token:string, quoteid:string , reason:string, orgid:string) {
        return await commonAPIHelper
            .send("POST", this.BASE_URL, "/quotes/" + quoteid + "/decline", {
                "Authorization": "Bearer " + token,
                "x-organization-id": orgid
            }, {
                "declineReason": reason
            })
    }

    async sendRenewalReportRequest(token:string) {
        return await commonAPIHelper
            .send("POST", this.BASE_URL, "/dev/quotes/renewal-report", {
                "Authorization": "Bearer " + token
            }, null)
    }
    async getQuoteContacts(token:string, orgid:string,  quoteId:string) {
        return await allure.step(`API: Get quote [${quoteId}] contacts from organization [${orgid}]`, async()=> {
            return await commonAPIHelper
                .send("GET", this.BASE_URL, "/quotes/" + quoteId+"/contacts", {
                    "Authorization": "Bearer " + token,
                    "x-organization-id": orgid
                }, null)
        })
    }

    async getQuoteBillingSummary(token:string, orgid:string,  quoteId:string) {
        return await allure.step(`API: Get quote [${quoteId}] billing summary from organization [${orgid}]`, async()=> {
            return await commonAPIHelper
                .send("GET", this.BASE_URL, "/quotes/" + quoteId+"/billing-summaries", {
                    "Authorization": "Bearer " + token,
                    "x-organization-id": orgid
                }, null)
        })
    }

    async getQuoteEntities(token:string, orgid:string,  quoteId:string) {
        return await allure.step(`API: Get quote [${quoteId}] entities from organization [${orgid}]`, async()=> {
            return await commonAPIHelper
                .send("GET", this.BASE_URL, "/quotes/" + quoteId+"/entities", {
                    "Authorization": "Bearer " + token,
                    "x-organization-id": orgid
                }, null)
        })
    }

    async getContractEntities(token:string, orgid:string,  contractId:string) {
        return await allure.step(`API: Get contract [${contractId}] entities from organization [${orgid}]`, async()=> {
            return await commonAPIHelper
                .send("GET", this.BASE_URL, "/contracts/" + contractId+"/entities", {
                    "Authorization": "Bearer " + token,
                    "x-organization-id": orgid
                }, null)
        })
    }

    async getQuotePDF(token:string, orgid:string,  quoteId:string, url="?printName=Quote Netto") {
        //'Quote Netto' | 'Brutto Quote' | 'Quote No Pricing' | 'Microfocus Quote Netto' | 'Microfocus Quote Brutto' | 'Microfocus Quote No Pricing'
        return await allure.step(`API: Get quote [${quoteId}] PDF from organization [${orgid}]`, async()=> {
            let result =  await request(this.BASE_URL)
                .get(`/quotes/${quoteId}/pdf${url}`)
                .set( {
                    "Authorization": "Bearer " + token,
                    "Content-Type" : "application/pdf",
                    "x-organization-id": orgid
                });
            await sleep(3)
            return result;
        })
    }

    async getQuotePDFAndParse(token: string, orgid: string, quoteId: string, url = "", retries = 5) {
        let response
        for (let i = 0; i < retries; i++) {
            try {
                console.log(`Attmpt #${i}`)
                response = await this.getQuotePDF(token, orgid, quoteId, url)
                expect(response.statusCode).toBe(200);
                return await pdfParse(response.body);
            } catch (Error) {}
        }
        throw new Error("Unable to download PDF.")
    }

    async exportQuoteAssets(token:string, orgid:string,  quoteId:string, format:string) {
        return await this.exportAssets(token, orgid,"quote", "quotes",quoteId,format)
     }

    async exportContractAssets(token:string, orgid:string,  contractId:string, format:string) {
        return await this.exportAssets(token, orgid,"contract", "contracts",contractId,format)
    }

    async exportEntityAssets(token:string, orgid:string,  entityId:string, format:string) {
        return await this.exportAssets(token, orgid,"entity", "entities",entityId,format)
    }

    async exportAssets(token:string, orgid:string, parentType:string, parentTypeMulti:string, parentId:string, format:string) {
        let result;
        if (format=="xlsx") {
            result = await allure.step(`API: Export ${parentType} [${parentId}] assets as XLSX from organization [${orgid}]`, async()=> {
                return await request(this.BASE_URL).get(`/${parentTypeMulti}/${parentId}/assets/export?format=${format}`).responseType('blob').set({
                    "Authorization": "Bearer " + token,
                    "x-organization-id": orgid,
                    "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                });
            })
        }else{
            result= await allure.step(`API: Export ${parentType} [${parentId}] assets as CSV from organization [${orgid}]`, async()=> {
                return await commonAPIHelper
                    .send("GET", this.BASE_URL, `/${parentTypeMulti}/${parentId}/assets/export?format=${format}`, {
                        "Authorization": "Bearer " + token,
                        "x-organization-id": orgid,
                        "Content-Type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    }, null)
            })
        }
        return result;
    }

    async getCustomers(token:string, orgid:string,url_suffix="") {
        return await allure.step(`API: Get customers from organization [${orgid}]`, async()=> {
            return await commonAPIHelper
                .send("GET", this.BASE_URL, `/customers${url_suffix}`, {
                    "Authorization": "Bearer " + token,
                    "x-organization-id": orgid
                }, null)
        })
    }

    async createCustomer(token:string, payload:object,orgid:string,url_suffix="") {
        return await allure.step(`API: Create customer in organization [${orgid}]`, async()=> {
            return await commonAPIHelper
                .send("POST", this.BASE_URL, `/customers`, {
                    "Authorization": "Bearer " + token,
                    "x-organization-id": orgid
                }, payload)
        })
    }

    async getCustomerDetails(token:string, orgid:string, customerId:string) {
        return await allure.step(`API: Get customer [${customerId}] from organization [${orgid}]`, async()=> {
            return await commonAPIHelper
                .send("GET", this.BASE_URL, `/customers/${customerId}`, {
                    "Authorization": "Bearer " + token,
                    "x-organization-id": orgid
                }, null)
        })
    }

     async getContract(token:string, orgid:string,  contractId:string) {
          return await allure.step(`API: Get contract [${contractId}] from organization [${orgid}]`, async()=> {
               return await commonAPIHelper
                   .send("GET", this.BASE_URL, "/contracts/" + contractId, {
                        "Authorization": "Bearer " + token,
                        "x-organization-id": orgid
                   }, null)
          })
     }
    async getContractAssets(token:string, orgid:string,  contractId:string, url_suffix="" ) {
        return await allure.step(`API: Get contract [${contractId}] assets from organization [${orgid}]`, async()=> {
            return await commonAPIHelper
                .send("GET", this.BASE_URL, "/contracts/" + contractId+`/assets${url_suffix}`, {
                    "Authorization": "Bearer " + token,
                    "x-organization-id": orgid
                }, null)
        })
    }
    async getContractQuotes(token:string, orgid:string, contractId:string, url_suffix="") {
        return await allure.step(`API: Get contract [${contractId}] quotes from organization [${orgid}]`, async()=> {
            return await commonAPIHelper
                .send("GET", this.BASE_URL, "/contracts/" + contractId+`/quotes${url_suffix}`, {
                    "Authorization": "Bearer " + token,
                    "x-organization-id": orgid
                }, null)
        })
    }
    async getContractQuotesWithParams(token:string, orgid:string, contractId:string, limit:string, cursor: string, search: string, filters: string ) {
        return await allure.step(`API: Get contract [${contractId}] quotes with params`, async()=> {
            return await commonAPIHelper
                .send("GET", this.BASE_URL, "/contracts/" + contractId+"/quotes"+"?limit="+limit+"&cursor="+cursor+"&search="+search+"&"+filters, {
                    "Authorization": "Bearer " + token,
                    "x-organization-id": orgid
                }, null)
        })
    }

    async getContractContacts(token:string, orgid:string,  contractId:string) {
        return await allure.step(`API: Get contract [${contractId}] contacts from organization [${orgid}]`, async()=> {
            return await commonAPIHelper
                .send("GET", this.BASE_URL, "/contracts/" + contractId+"/contacts", {
                    "Authorization": "Bearer " + token,
                    "x-organization-id": orgid
                }, null)
        })
    }
    async getContractPDF(token:string, orgid:string,  contractId:string,url="") {
        return await allure.step(`API: Get contract [${contractId}] PDF from organization [${orgid}]`, async()=> {
            let result= await commonAPIHelper
                .send("GET", this.BASE_URL, "/contracts/" + contractId+`/pdf${url}`, {
                    "Authorization": "Bearer " + token,
                    "Content-Type": "application/pdf",
                    "x-organization-id": orgid
                }, null)
            await sleep(3)
            return result;
        })
    }

    async downloadBatchContractPDF(token:string, orgid:string,  contractIds:string, mode:String) {
        return await allure.step(`API: Get contract [${contractIds}] PDF from organization [${orgid}]`, async()=> {
            let result= await commonAPIHelper
                .send("GET", this.BASE_URL, `/contracts/batch-download-pdf?contractIds=${contractIds}&contractPrintName=${mode}`, {
                    "Authorization": "Bearer " + token,
                    "Content-Type": "application/pdf",
                    "x-organization-id": orgid
                }, null)
            await sleep(2)
            return result;
        })
    }
    async downloadBatchContractPDFAndParse(token:string, orgid:string,  contractIds:string, mode:String, retries = 5) {
        let response
        for (let i = 0; i < retries; i++) {
            try {
                console.log(`Attmpt #${i}`)
                response = await this.downloadBatchContractPDF(token, orgid, contractIds, mode)
                expect(response.statusCode).toBe(200);
                return await pdfParse(response.body);
            } catch (Error) {}
        }
        throw new Error("Unable to download PDF.")
    }
    async  runSystemCommand(command:string) {
            const output= await execSync(command);
            console.log(`curl command output:`, output);
    }

    async getPDFViaCURL(token:string, orgid:string, objType:string ,objId:string) {
        return await allure.step(`API: Get ${objType} [${objId}] PDF from organization [${orgid}]`, async()=> {
            return await this.runSystemCommand(`curl --location '${ENV.BASE_URL}/api//${objType}/${objId}/pdf' --header 'x-organization-id: ${orgid}' --header 'Content-Type: application/pdf'  --header 'Authorization: Bearer ${token}' --output file.pdf`)
        })
    }

    async requestQuoteForContract(token:string, orgid:string, contractId:string, groupId:string, customerId:string,
                                  generalRequest:string,requestForContractGroupId:string, attachment:string) {

        return await request(this.BASE_URL)
            .post(`/contracts/request-quote`)
            .attach("files",attachment)
            .field("requestForContractGroupId",requestForContractGroupId)
            .field("customerId",customerId)
            .field("contractNo",contractId)
            .field("groupId",groupId)
            .field("generalRequest",generalRequest)
            .set( {
                "Authorization": "Bearer " + token,
                "x-organization-id": orgid
            });
    }

    async requestQuoteForMultipleContracts(token:string, orgid:string, contracts:string, groupId:string, customerId:string,
                                  generalRequest:string,requestForContractGroupId:string, attachment:string) {

        return await request(this.BASE_URL)
            .post(`/contracts/request-quote`)
            .attach("files",attachment)
            .field("requestForContractGroupId",requestForContractGroupId)
            .field("customerId",customerId)
            .field("generalRequest",generalRequest)
            .field("groupId",groupId)
            .field("contractNumbers",contracts)
            .set( {
                "Authorization": "Bearer " + token,
                "x-organization-id": orgid
            });
    }

    async createContract(token:string, orgid:string,payload:object) {
        return await allure.step(`API: Post contract [${payload}]`, async()=> {
            return await commonAPIHelper
                .send("POST", this.BASE_URL, "/contracts", {
                    "Authorization": "Bearer " + token,
                    "x-organization-id": orgid
                }, payload)
        })
    }

    async validateContractAssets(token:string, assetsPayload:object,orgid:string) {
        return await allure.step(`API: Validate assets [${assetsPayload}]`, async()=> {
            return await commonAPIHelper
                .send("POST", this.BASE_URL, "/contracts/import/validate", {
                    "Authorization": "Bearer " + token,
                    "x-organization-id": orgid
                }, assetsPayload)
        })
    }

    async importContractAssets(token:string, payload:object,orgid:string,) {
        return await allure.step(`API: Post contract [${payload}]`, async()=> {
            return await commonAPIHelper
                .send("POST", this.BASE_URL, "/contracts/assets", {
                    "Authorization": "Bearer " + token,
                    "x-organization-id": orgid
                }, payload)
        })
    }

     async getEntityItems(token:string, entityId:string,itemsType:string, orgid:string, url_suffix=""  ) {
          return await allure.step(`API: Get entity [${entityId}] [${itemsType}]`, async()=> {
               return await commonAPIHelper
                   .send("GET", this.BASE_URL, "/entities/" + entityId+"/"+itemsType+`${url_suffix}`, {
                        "Authorization": "Bearer " + token,
                        "x-organization-id": orgid
                   }, null)
          })
     }

    async getCustomerItems(token:string, entityId:string,itemsType:string, orgid:string, url_suffix=""  ) {
        return await allure.step(`API: Get entity [${entityId}] [${itemsType}]`, async()=> {
            return await commonAPIHelper
                .send("GET", this.BASE_URL, "/customers/" + entityId+"/"+itemsType+`${url_suffix}`, {
                    "Authorization": "Bearer " + token,
                    "x-organization-id": orgid
                }, null)
        })
    }

    async createCustomerContact(token:string, customerId:string,contactPayload:object, orgid:string ) {
        return await allure.step(`API: Create customer [${customerId}] contact [${contactPayload}]`, async()=> {
            return await commonAPIHelper
                .send("POST", this.BASE_URL, "/customers/" + customerId+"/contacts", {
                    "Authorization": "Bearer " + token,
                    "x-organization-id": orgid
                }, contactPayload)
        })
    }
    async getContracts(token:string, orgid:string, url_suffix="" ) {
        return await allure.step(`API: Get organization [${orgid}] contracts`, async()=> {
            return await commonAPIHelper
                .send("GET", this.BASE_URL, `/contracts${url_suffix}`, {
                    "Authorization": "Bearer " + token,
                    "x-organization-id": orgid
                }, null)
        })
    }

    async getServicePacks(token:string, orgid:string, url_suffix="" ) {
        return await allure.step(`API: Get Service Packs [${orgid}] contracts`, async()=> {
            return await commonAPIHelper
                .send("GET", this.BASE_URL, `/service-packs${url_suffix}`, {
                    "Authorization": "Bearer " + token,
                    "x-organization-id": orgid
                }, null)
        })
    }

    async getEntityServicePacks(token:string, entityId:string, orgid:string, url_suffix="" ) {
        return await allure.step(`API: Get Service Packs [${orgid}] contracts`, async()=> {
            return await commonAPIHelper
                .send("GET", this.BASE_URL, `/entities/${entityId}/service-packs${url_suffix}`, {
                    "Authorization": "Bearer " + token,
                    "x-organization-id": orgid
                }, null)
        })
    }

    async getEntityServicePacksWithParams(token:string, entityId:string, limit:string, cursor: string, search: string, filters: string,orgid:string, ) {
        return await allure.step(`API: Get entity [${entityId}] service packs with params`, async()=> {
            return await commonAPIHelper
                .send("GET", this.BASE_URL, `/entities/${entityId}/service-packs`+"?limit="+limit+"&cursor="+cursor+"&search="+search+"&"+filters, {
                    "Authorization": "Bearer " + token,
                    "x-organization-id": orgid
                }, null)
        })
    }



    async createServicePacks(token:string, payload:object,orgid:string) {
        return await allure.step(`API: Create service packs [${payload}]`, async()=> {
            return await commonAPIHelper
                .send("POST", this.BASE_URL, "/service-packs/many", {
                    "Authorization": "Bearer " + token,
                    "x-organization-id": orgid
                }, payload)
        })
    }

    async importServicePacks(token:string,payload:object, orgid:string, ) {
        return await allure.step(`API: Import service packs [${payload}]`, async()=> {
            return await commonAPIHelper
                .send("POST", this.BASE_URL, "/service-packs/import", {
                    "Authorization": "Bearer " + token,
                    "x-organization-id": orgid
                }, payload)
        })
    }

    async getServicePack(token:string, spId:string, orgid:string) {
        return await allure.step(`API: Get service pack [${spId}]`, async()=> {
            return await commonAPIHelper
                .send("GET", this.BASE_URL, `/service-packs/${spId}`, {
                    "Authorization": "Bearer " + token,
                    "x-organization-id": orgid
                }, null)
        })
    }
    async validateServicePack(token:string, endUserId:string, productSKU:string, sn:string, orgid:string) {
        return await allure.step(`API: Validate service pack for endUser:[${endUserId}];productSKU:[${productSKU}];sn:[${sn}];`, async()=> {
            return await commonAPIHelper
                .send("POST", this.BASE_URL, `/service-packs/hpe-validate`, {
                    "Authorization": "Bearer " + token,
                    "x-organization-id": orgid
                }, {"serialNumber":sn,"productSku":productSKU,"endUserId":endUserId})
        })
    }
    async bulkValidateServicePack(token:string, resellerId:string , attachment:string, orgid:string) {
        return await request(this.BASE_URL)
            .post(`/service-packs/bulk-validate`)
            .attach("file",attachment)
            .field("resellerId",resellerId)
            .set( {
                "Authorization": "Bearer " + token,
                "x-organization-id": orgid
            });
    }

    async deleteServicePacksByQuery(token:string, query:string, orgid:string) {
        return await allure.step(`API: Delete service packs by query [${query}]`, async()=> {
            let response = (await this.getServicePacksWithParams(token, "", "", query, "", orgid));
            if (response.body.data && (response.body.data.length > 0))
            {
                for (var sp of response.body.data) await this.deleteServicePack(token, sp.id, orgid);
            }
        })
    }

    async deleteServicePack(token:string, spId:string, orgid:string) {
        return await allure.step(`API: Delete service pack [${spId}]`, async()=> {
            let result= await commonAPIHelper
                .send("DELETE", this.BASE_URL, `/service-packs/${spId}`, {
                    "Authorization": "Bearer " + token,
                    "x-organization-id": orgid
                }, null)
            return result
        })
    }
   // {"packNo":"33333","serialNumber":"3333","serviceGroupSku":"HU4A4AC","productSku":"3333","endDate":"2025-08-31T21:59:59.999Z","customerId":"9900307602","resellerId":"9900301986"}

    async updateServicePack(token:string, spId:string, payload,orgid:string) {
        return await allure.step(`API: Update service packs [${spId}] with payload ${payload}`, async()=> {
            return await commonAPIHelper
                .send("PATCH", this.BASE_URL, `/service-packs/${spId}`, {
                    "Authorization": "Bearer " + token,
                    "x-organization-id": orgid
                }, payload)
        })
    }

    async updateServicePackQuote(token:string, spId:string, quoteId:string, payload,orgid:string) {
        return await allure.step(`API: Update service packs [${spId}] quote [${quoteId}] payload ${payload}`, async()=> {
            let result=await commonAPIHelper
                .send("PATCH", this.BASE_URL, `/service-packs/${spId}/quotes/${quoteId}`, {
                    "Authorization": "Bearer " + token,
                    "x-organization-id": orgid
                }, payload)
            return result
        })
    }
    async getQuotes(token:string, orgid:string, url_suffix="") {
        return await allure.step(`API: Get organization [${orgid}] quotes suffix [${url_suffix}]`, async()=> {
            let res= await commonAPIHelper
                .send("GET", this.BASE_URL, `/quotes${url_suffix}`, {
                    "Authorization": "Bearer " + token,
                    "x-organization-id": orgid
                }, null)
            return res
        })
    }

    async waitForNewQuote(token:string, orgid:string, url_suffix, initialQuotes, attempts=20) {
         for(let i=0; i<attempts; i++){
           let newQuotes=(await this.getQuotes(token,orgid,url_suffix)).body.data;
           const result = newQuotes.filter(x => !new Set(initialQuotes).has(x.id));
           if (result.length>0) return result[0]
        }
         throw new Error(`Unable to wait for new quote [${url_suffix}] after ${attempts} attempts`)
    }

    async getAllQuotes(token:string, orgid:string) {
         let allQuotes=[]
         let result=await this.getQuotes(token,orgid,"?limit=100");
         allQuotes.push(...result.body.data)
         for (let i =0; i<10; i++){
             if (result.body.meta.hasNextPage) {
                 result=await this.getQuotes(token,orgid, `?cursor=${result.body.meta.nextCursor}&limit=100`);
                 allQuotes.push(...result.body.data)
             }else{
                 return allQuotes;
             }
         }
         return allQuotes;
    }

    async getAllCustomers(token:string, orgid:string) {
        let allCustomers=[]
        let result=await this.getCustomers(token,orgid,"?limit=100&withValidAgreement=true");
        allCustomers.push(...result.body.data)
        for (let i =0; i<10; i++){
            if (result.body.meta.hasNextPage) {
                result=await this.getCustomers(token,orgid, `?cursor=${result.body.meta.nextCursor}&limit=100&withValidAgreement=true`);
                allCustomers.push(...result.body.data)
            }else{
                return allCustomers;
            }
        }
        return allCustomers;
    }

    async getAllContracts(token:string, orgid:string) {
        let allContracts=[]
        let result=await this.getContracts(token,orgid,"?limit=100");
        allContracts.push(...result.body.data)
        for (let i =0; i<10; i++){
            if (result.body.meta.hasNextPage) {
                result=await this.getContract(token,orgid, `?cursor=${result.body.meta.nextCursor}&limit=100`);
                allContracts.push(...result.body.data)
            }else{
                return allContracts;
            }
        }
        return allContracts;
    }
    async getCustomersWithParams(token:string, limit:string, cursor: string, search: string, orgid:string, ) {
        return await allure.step(`API: Get organization [${orgid}] customers with params`, async()=> {
            return await commonAPIHelper
                .send("GET", this.BASE_URL, "/customers/"+"?limit="+limit+"&cursor="+cursor+"&search="+search, {
                    "Authorization": "Bearer " + token,
                    "x-organization-id": orgid
                }, null)
        })
    }
    async getContractsWithParams(token:string, limit:string, cursor: string, search: string, filters: string,orgid:string, ) {
        return await allure.step(`API: Get organization [${orgid}] contracts with params`, async()=> {
            return await commonAPIHelper
                .send("GET", this.BASE_URL, "/contracts/"+"?limit="+limit+"&cursor="+cursor+"&search="+search+"&"+filters, {
                    "Authorization": "Bearer " + token,
                    "x-organization-id": orgid
                }, null)
        })
    }
    async getServicePacksWithParams(token:string, limit:string, cursor: string, search: string, filters: string,orgid:string, ) {
        return await allure.step(`API: Get organization [${orgid}] service packs with params`, async()=> {
            return await commonAPIHelper
                .send("GET", this.BASE_URL, "/service-packs"+"?limit="+limit+"&cursor="+cursor+"&search="+search+"&"+filters, {
                    "Authorization": "Bearer " + token,
                    "x-organization-id": orgid
                }, null)
        })
    }

    async getServicePackByName(token:string, search: string, orgid:string) {
        let response = await this.getServicePacksWithParams(token, "", "", search, "", orgid);
        return response.body.data[0]
    }

    async getContractAssetsWithParams(token:string, orgid:string,  contractId:string, limit:string, cursor: string, search: string, filters: string,) {
        return await allure.step(`API: Get contract [${contractId}] assets with params`, async()=> {
            return await commonAPIHelper
                .send("GET", this.BASE_URL, "/contracts/" + contractId+"/assets"+"?limit="+limit+"&cursor="+cursor+"&search="+search+"&"+filters, {
                    "Authorization": "Bearer " + token,
                    "x-organization-id": orgid
                }, null)
        })
    }
    async getQuotesWithParams(token:string, limit:string, cursor: string, search: string, filters: string,orgid:string, ) {
        return await allure.step(`API: Get organization [${orgid}] quotes with params`, async()=> {
            return await commonAPIHelper
                .send("GET", this.BASE_URL, "/quotes/"+"?limit="+limit+"&cursor="+cursor+"&search="+search+"&"+filters, {
                    "Authorization": "Bearer " + token,
                    "x-organization-id": orgid
                },null)
        })
    }
    async globalSearchWithLimit(token:string, limit:string, query: string, orgid:string ) {
        return await allure.step(`API: Global search for [${query}] query`, async()=> {
            return await commonAPIHelper
                .send("GET", this.BASE_URL, "/search/"+"?limit="+limit+"&query="+query, {
                    "Authorization": "Bearer " + token,
                    "x-organization-id": orgid
                },null)
        })
    }
    async globalSearch(token:string, query: string, orgid:string ) {
        return await this.globalSearchWithLimit(token, "",query, orgid)
    }
    async getEntityItemsWithParams(token:string, entityId:string,itemsType:string,limit:string, cursor: string, search: string, filters: string, orgid:string ) {
        return await allure.step(`API: Get entity [${entityId}] [${itemsType}]`, async()=> {
            return await commonAPIHelper
                .send("GET", this.BASE_URL, "/entities/" + entityId+"/"+itemsType+"?limit="+limit+"&cursor="+cursor+"&search="+search+"&"+filters, {
                    "Authorization": "Bearer " + token,
                    "x-organization-id": orgid
                }, null)
        })
    }

    async getEntities(token:string, orgid:string, url_suffix="" ) {
        return await allure.step(`API: Get entities`, async()=> {
            return await commonAPIHelper
                .send("GET", this.BASE_URL, `/entities${url_suffix}`, {
                    "Authorization": "Bearer " + token,
                    "x-organization-id": orgid
                }, null)
        })
    }

    async getEntitiesDistinctNames(token:string, orgid:string, url_suffix="" ) {
        return await allure.step(`API: Get entities distinct names`, async()=> {
            return await commonAPIHelper
                .send("GET", this.BASE_URL, `/entities/distinct/names${url_suffix}`, {
                    "Authorization": "Bearer " + token,
                    "x-organization-id": orgid
                }, null)
        })
    }



    async getEntity(token:string, entityId:string, orgid:string) {
        return await allure.step(`API: Get entity`, async()=> {
            return await commonAPIHelper
                .send("GET", this.BASE_URL, `/entities/${entityId}`, {
                    "Authorization": "Bearer " + token,
                    "x-organization-id": orgid
                }, null)
        })
    }

    async getEntityDetails(token:string, entity_id:string, orgid:string ) {
        return await allure.step(`API: Get entity [${entity_id}] details`, async()=> {
            return await commonAPIHelper
                .send("GET", this.BASE_URL, `/entities/${entity_id}`, {
                    "Authorization": "Bearer " + token,
                    "x-organization-id": orgid
                }, null)
        })
    }
     async getOrganizations(token:string, orgid:string ) {
          return await allure.step(`API: Get organizations`, async()=> {
               return await commonAPIHelper
                   .send("GET", this.BASE_URL, "/organizations", {"Authorization": "Bearer " + token,"x-organization-id": orgid}, null)
          })
     }

    async getOrganizationByName(token:string, name:string ,superOrgid=TestData.superOrgId ) {
        return await allure.step(`API: Get organizations`, async()=> {
            let allOrgs= (await commonAPIHelper
                .send("GET", this.BASE_URL, "/organizations/admin/all?limit=100", {"Authorization": "Bearer " + token,"x-organization-id": superOrgid}, null)).body
            let orgDetails=allOrgs.data.find((t) => t["name"] === name);
            return orgDetails
        })
    }

    async createOrganization(token:string, orgName:string, entityIds, orgid=TestData.superOrgId ) {
        entityIds=entityIds==undefined ? [] : entityIds;
        return await allure.step(`API: create organization [${orgName}] and entity [${entityIds}]`, async()=> {
            return await commonAPIHelper
                .send("POST", this.BASE_URL,
                    "/organizations", {"Authorization": "Bearer " + token,"x-organization-id": orgid},
                    {"name":orgName,"locale":"de","entityIds":entityIds},)
        })
    }

    async createOrganizationByPayload(token:string, payload, orgId:string ) {
        return await allure.step(`API: create organization by payload [${payload}]`, async()=> {
            return await commonAPIHelper
                .send("POST", this.BASE_URL,
                    "/organizations", {"Authorization": "Bearer " + token, "x-organization-id": orgId},
                    payload,)
        })
    }

    async deleteOrganization(token:string, orgId:string,authOrgId=TestData.superOrgId) {
        return await allure.step(`API:archive organization [${orgId}]`, async()=> {
            return await commonAPIHelper
                .send("POST", this.BASE_URL,
                    "/organizations/archive", {"Authorization": "Bearer " + token, "x-organization-id": authOrgId},
                    {"id":orgId,})
        })
    }
    async updateOrganization(token:string, orgId:string, orgName:string, emailable:boolean , authOrgId:string ) {
        return await allure.step(`API: edit organization [${orgId}] with name=[${orgName}] and emailable=[${emailable}]`, async()=> {
            return await commonAPIHelper
                .send("PATCH", this.BASE_URL,
                    `/organizations/${orgId}`, {"Authorization": "Bearer " + token,"x-organization-id": authOrgId},
                    {"name":orgName,"emailable":emailable},)
        })
    }


    async updateOrganizationByPayload(token:string,orgId:string,payload,authOrgId:string ) {
        return await allure.step(`API: update organization by payload [${payload}]`, async()=> {
            return await commonAPIHelper
                .send("PATCH", this.BASE_URL,
                    `/organizations/${orgId}`, {"Authorization": "Bearer " + token, "x-organization-id": authOrgId},
                    payload,)
        })
    }

    async setOrganizationLogo(token:string, orgId:string, filePath:string, authOrgId:string ) {
        return await request(this.BASE_URL).post(`/organizations/${orgId}/logo`)
                .set({"Authorization": "Bearer " + token,"x-organization-id": authOrgId})
                .attach("logo", fs.createReadStream(filePath));
    }

    async deleteOrganizationLogo(token:string, orgId:string, authOrgId:string ) {
        return await allure.step(`API: delete organization logo`, async()=> {
            return await commonAPIHelper
                .send("DELETE", this.BASE_URL,
                    `/organizations/${orgId}/logo`, {"Authorization": "Bearer " + token, "x-organization-id": authOrgId},null)
        })
    }

    async getAdminOrganizations(token:string, authOrgId:string=TestData.superOrgId) {
        return await allure.step(`API: Get ALL organizations (admin)`, async()=> {
            return await commonAPIHelper
                .send("GET", this.BASE_URL, `/organizations/admin/all`,
                    {"Authorization": "Bearer " + token, "x-organization-id": authOrgId}, null);
        });
    }

    async getAdminOrganizationsWithParams(token: string, authOrgId: string, qs: string) {
        return await allure.step(`API: Get admin organizations with query ${qs}`, async()=> {
            return await commonAPIHelper
                .send("GET", this.BASE_URL, `/organizations/admin/all${qs}`,
                    { Authorization: "Bearer " + token, "x-organization-id": authOrgId }, null);
        })
    }

    async getAllUsers(token: string, authOrgId: string, url_suffix="") {
        return await allure.step(`API: Get all users with query ${url_suffix}`, async()=> {
            return await commonAPIHelper
                .send("GET", this.BASE_URL, `/users${url_suffix}`,
                    { Authorization: "Bearer " + token, "x-organization-id": authOrgId }, null);
        })
    }

    async updateTestOrganization(payload) {
     await this.getCommonSessionForSA();
     let testOrgId=(await this.getOrganizationByName(this.COMMON_SA_TOKEN,TestData.defaultOrganization)).id;
     return await commonAPIHelper
        .send("PATCH", this.BASE_URL,
            `/organizations/${testOrgId}`,
            {"Authorization": "Bearer " + this.COMMON_SA_TOKEN,"x-organization-id": TestData.superOrgId}, payload,).then((r) => {
             return r;
         });
    }

    async linkEntitiesToOrganization(token:string, orgId:string, payload, authOrgId:string) {
        return await allure.step(`API: link entity [${payload}] to organization [${orgId}]`, async()=> {
            return await commonAPIHelper
                .send("POST", this.BASE_URL,
                    `/organizations/${orgId}/entities`,
                    {"Authorization": "Bearer " + token,"x-organization-id": authOrgId},
                    payload,)
        })
    }

     async getOrganization(token:string, orgId:string,authOrgId=TestData.superOrgId) {
          return await allure.step(`API: Get organization [${orgId}]`, async()=> {
               return await commonAPIHelper
                   .send("GET", this.BASE_URL, `/organizations/${orgId}`,
                       {"Authorization": "Bearer " + token,"x-organization-id": authOrgId}, null)
          })
     }
    async getOrganizationEntities(token:string, orgId:string,authOrgId=TestData.superOrgId) {
        return await allure.step(`API: Get organization [${orgId}] entities`, async()=> {
            return await commonAPIHelper
                .send("GET", this.BASE_URL, `/organizations/${orgId}/entities`,
                    {"Authorization": "Bearer " + token,"x-organization-id": authOrgId}, null)
        })
    }
     async getOrganizationRoles(token:string, orgId:string) {
          return await allure.step(`API: Get organization [${orgId}] roles`, async()=> {
              let res=await commonAPIHelper
                  .send("GET", this.BASE_URL, `/organizations/${orgId}/roles`,
                      {"Authorization": "Bearer " + token,"x-organization-id": orgId}, null)
               return res
          })
     }

    async getOrganizationRole(role:string,token:string, orgId:string) {
       let roles=await this.getOrganizationRoles(token, orgId)
        if (roles.statusCode!==200){
            throw new Error(`Unable to get organization [${orgId}] role [${role}]`)
        }
        return roles.body.find(t=>t.name===role)
    }
    async getOrganizationUsers(token:string, orgId:string, authOrgId=TestData.superOrgId) {
            return await commonAPIHelper
                .send("GET", this.BASE_URL, `/organizations/${orgId}/users`,
                    {"Authorization": "Bearer " + token, "x-organization-id": authOrgId}, null)
    }

    async getOrganizationUsersWithParams(token: string, orgId:string, authOrgId: string, qs: string) {
        return await allure.step(`API: Get organizations ${orgId} users query ${qs}`, async()=> {
            return await commonAPIHelper
                .send("GET", this.BASE_URL, `/organizations/${orgId}/users${qs}`,
                    { Authorization: "Bearer " + token, "x-organization-id": authOrgId }, null);
        })
    }

    async getOrganizationUser(orgId:string, email:string) {
        let sessionToken=await this.getCommonSessionForSA()
        let users = (await this.getOrganizationUsers(sessionToken, orgId)).body;
        return   users.find((t) => t["email"] === email);
    }

    async getUserDetails(user) {
        let sessionToken=await this.getCommonSessionForSA()
        let users = (await this.getOrganizationUsers(sessionToken, user['orgId'])).body;
        return   users.find((t) => t["email"] === user['email']);
    }

    async getMatchingUserDetails(user) {
        let sessionToken=await this.getCommonSessionForSA()
        let users = (await this.getOrganizationUsers(sessionToken, user['orgId'])).body;
        return   users.find((t) => t["email"].includes(user['email']));
    }
    async getOrganizationUserId(userObject:object) {
         let userId=(await this.getOrganizationUser(userObject['orgId'],userObject['email']))['id']
         return userId;
    }
    async getCommonSessionForUser(userObject) {
        if(this.COMMON_TOKEN==="")
        {this.COMMON_TOKEN = await this.getUserToken({email:userObject["email"], pass:userObject["pass"]});}
        return this.COMMON_TOKEN;
    }
    async getCommonSessionForSA() {
         let userObject=TestData.saUserDetails
        if(this.COMMON_SA_TOKEN==="")
        {this.COMMON_SA_TOKEN = await this.getUserToken({email:userObject["email"], pass:userObject["pass"]});}
        return this.COMMON_SA_TOKEN;
    }
    async getCommonWebHooksSession() {
        if(this.WEBHOOKS_TOKEN==="")
        {this.WEBHOOKS_TOKEN = await this.getWebHooksToken(this.WH_CLIENT_ID,this.WH_CLIENT_SECRET);}
        return this.WEBHOOKS_TOKEN;
    }

    async doLoginAsUser(user:object) {
        return (await this.getUserToken({email:user["email"],pass:user["pass"]}))
    }

    async getUserToken(user) {
            const payload = {"email": user['email'],"password": user['pass'] }
            let result= (await commonAPIHelper
                .send("POST", this.BASE_URL, "/auth/api/sign-in/email", {}, payload));
            return result.body.token;
    }

    async authenticateUser(payload) {
        return (await commonAPIHelper
            .send("POST", this.BASE_URL, "/auth/api/sign-in/email", {}, payload));
    }
    async getWebHooksToken(client_id,client_secret,grant_type='client_credentials') {
        return await allure.step(`API: Get WebHooks token`, async()=> {
            const payload = {"client_id": client_id,
                             "client_secret": client_secret,
                              "grant_type":grant_type}
            return (await commonAPIHelper
                .send("POST", this.WEBHOOK_URL, "/oauth/token", {}, payload)).body.access_token;
        })
    }
     async getPermissions(token:string) {
          return await allure.step(`API: Get permission`, async()=> {
               return await commonAPIHelper
                   .send("GET", this.BASE_URL, "/users/permissions", {"Authorization": "Bearer " + token}, null)
          })
     }
     async revoke(token:string) {
          return await allure.step(`API: Revoke token`, async()=> {
               const payload = {"token": token}
               return await commonAPIHelper
                   .send("POST", this.BASE_URL, "/auth/api/revoke-session", {"Authorization": "Bearer " + token}, payload)
          })
     }
    async logout(token:string) {
        return await allure.step(`API: Logout`, async()=> {
            const payload = {"token": token}
            return await commonAPIHelper
                .send("POST", this.BASE_URL, "/auth/api/sign-out", {"Authorization": "Bearer " + token}, payload)
        })
    }

     async getLoginUrl() {
          return await allure.step(`API: Get login url`, async()=> {
               return await commonAPIHelper
                   .send("GET", this.BASE_URL, "/auth/get-login-url", null, null)
          })
     }

     async refreshToken(auth_token:string, refresh_token: string) {
          return await allure.step(`API: Refresh token [${refresh_token}]`, async()=> {
               const payload = {"refresh_token": refresh_token}
               return await commonAPIHelper
                   .send("POST", this.BASE_URL, "/auth/refresh", {"Authorization": "Bearer " + auth_token}, payload)
          })
     }

     async getMetrics(token:string, orgid:string) {
          let api_key= ENV.API_KEY;
          let api_secret= ENV.API_SECRET;
          return await allure.step(`API: Get metrics`, async()=> {
               return await commonAPIHelper
                   .send("GET", this.BASE_URL, "/metrics",
                       {
                           "Authorization": "Bearer " + token,
                           "x-organization-id": orgid,
                           "x-api-key": api_key,
                           "x-api-secret": api_secret

                       }, null)
          })
     }
    async getGlobalNotifications(token:string, orgId:string) {
        return await allure.step(`API: Get Global Notifications`, async()=> {
            return await commonAPIHelper
                .send("GET", this.BASE_URL, "/global-notifications", {"Authorization": "Bearer " + token}, null)
        })
    }

    async getFeatureFlags(token:string) {
        return await allure.step(`API: Feature flags`, async()=> {
            return await commonAPIHelper
                .send("GET", this.BASE_URL, "/feature-flags",
                    {"Authorization": "Bearer " + token,}, null)
        })
    }

    async processEmailQueue(token:string,orgid:string) {
        return await allure.step(`API: Feature flags`, async()=> {
            return await commonAPIHelper
                .send("POST", this.BASE_URL, "/email/process-queue", {"Authorization": "Bearer " + token, "x-organization-id": orgid,}, null)
        })
    }

    async getKPIs(token:string, orgid:string) {
        return await allure.step(`API: Get KPIs`, async()=> {
            return await commonAPIHelper
                .send("GET", this.BASE_URL, "/reporting/kpis",
                    {
                        "Authorization": "Bearer " + token,
                        "x-organization-id": orgid,
                    }, null)
        })
    }

    async getProducts(token:string, vendorid:string, orgid:string, showInDropdown=true) {
        return await allure.step(`API: Get products`, async()=> {
            return await commonAPIHelper
                .send("GET", this.BASE_URL, `/products?vendor=${vendorid}&showInDropdown=${showInDropdown}`, {
                    "Authorization": "Bearer " + token,
                    "x-organization-id": orgid
                }, null)
        })
    }

    async getLinkedProducts(token:string, vendorid:string, productSku:string, orgid:string,limit=10) {
        return await allure.step(`API: Get linked products by productSKU [${productSku}]`, async()=> {
            return await commonAPIHelper
                .send("GET", this.BASE_URL, `/products/linked?vendor=${vendorid}&productSku=${productSku}&limit=${limit}`, {
                    "Authorization": "Bearer " + token,
                    "x-organization-id": orgid
                }, null)
        })
    }

    async getLinkedProductsWithUrlSuffix(token:string, orgid:string, url:string) {
        return await allure.step(`API: Get linked products`, async()=> {
            return await commonAPIHelper
                .send("GET", this.BASE_URL, `/products/linked${url}`, {
                    "Authorization": "Bearer " + token,
                    "x-organization-id": orgid
                }, null)
        })
    }


    async getRequests(token:string,orgid:string, url_suffix="") {
        return await allure.step(`API: Get requests`, async()=> {
            return await commonAPIHelper
                .send("GET", this.BASE_URL, `/quotes/requests${url_suffix}`, {
                    "Authorization": "Bearer " + token,
                    "x-organization-id": orgid
                }, null)
        })
    }

    async getRequestDetails(token:string,requestId:string, orgid:string) {
        return await allure.step(`API: Get request details [${requestId}]`, async()=> {
            return await commonAPIHelper
                .send("GET", this.BASE_URL, `/quotes/requests/${requestId}`, {
                    "Authorization": "Bearer " + token,
                    "x-organization-id": orgid
                }, null)
        })
    }

    async getQuotesRequestsWithParams(token:string, limit:string, cursor: string, search: string, filters: string,orgid:string, ) {
        return await allure.step(`API: Get organization [${orgid}] quotes requests with params`, async()=> {
            return await commonAPIHelper
                .send("GET", this.BASE_URL, "/quotes/requests"+"?limit="+limit+"&cursor="+cursor+"&search="+search+"&"+filters, {
                    "Authorization": "Bearer " + token,
                    "x-organization-id": orgid
                },null)
        })
    }


    async getAssetQuotes(token:string, orgid:string, assetSN:string, url_suffix="") {
        return await allure.step(`API: Get asset [${assetSN}] quotes from organization [${orgid}]`, async()=> {
            return await commonAPIHelper
                .send("GET", this.BASE_URL, "/assets/" + assetSN+`/quotes${url_suffix}`, {
                    "Authorization": "Bearer " + token,
                    "x-organization-id": orgid
                }, null)
        })
    }

    async getAssetContracts(token:string, orgid:string, assetSN:string, url_suffix="") {
        return await allure.step(`API: Get asset [${assetSN}] contracts from organization [${orgid}]`, async()=> {
            return await commonAPIHelper
                .send("GET", this.BASE_URL, "/assets/" + assetSN+`/contracts${url_suffix}`, {
                    "Authorization": "Bearer " + token,
                    "x-organization-id": orgid
                }, null)
        })
    }

    async getAssetQuotesWithParams(token:string, orgid:string, assetSN:string, limit:string, cursor: string, search: string, filters: string ) {
        return await allure.step(`API: Get Asset [${assetSN}] quotes with params`, async()=> {
            return await commonAPIHelper
                .send("GET", this.BASE_URL, "/assets/" + assetSN+"/quotes"+"?limit="+limit+"&cursor="+cursor+"&search="+search+"&"+filters, {
                    "Authorization": "Bearer " + token,
                    "x-organization-id": orgid
                }, null)
        })
    }
    async getAssetContractsWithParams(token:string, orgid:string, assetSN:string, limit:string, cursor: string, search: string, filters: string ) {
        return await allure.step(`API: Get Asset [${assetSN}] contracts with params`, async()=> {
            return await commonAPIHelper
                .send("GET", this.BASE_URL, "/assets/" + assetSN+"/contracts"+"?limit="+limit+"&cursor="+cursor+"&search="+search+"&"+filters, {
                    "Authorization": "Bearer " + token,
                    "x-organization-id": orgid
                }, null)
        })
    }
     async whoami(token:string, orgid:string) {
          return await allure.step(`API: Who am I`, async()=> {
               return await commonAPIHelper
                   .send("GET", this.BASE_URL, "/whoAmI", {
                        "Authorization": "Bearer " + token,
                        "x-organization-id": orgid
                   }, null)
          })
     }
    async forgotPassword(email:string) {
        return await commonAPIHelper
            .send("POST", this.BASE_URL,"/auth/api/request-password-reset", {}, {"email":email})
    }
     async invite(token:string, email:string,roleId:string, orgid:string) {
          const payload={  "email":email, "roleId" : roleId, "organizationIds" :[orgid]}
          return await commonAPIHelper
              .send("POST", this.BASE_URL,"/users/invite",{"Authorization": "Bearer "+ token,"x-organization-id":orgid }, payload)
     }

    async resendInvite(token:string, email:string, orgid:string) {
        const payload={  "email":email, "organizationIds" :[orgid]}
        return await commonAPIHelper
            .send("POST", this.BASE_URL,"/users/invite/resend",{"Authorization": "Bearer "+ token,"x-organization-id":orgid }, payload)
    }

     async inviteWithPayload(token:string, payload:object) {
          return await commonAPIHelper
              .send("POST", this.BASE_URL,"/users/invite",{"Authorization": "Bearer "+ token }, payload);
     }
     async register(token:string, fname:string, lname:string, pass:string, passConf:string,
                       invite_token:string, orgid:string) {
          const payload={"firstName" : fname, "lastName" : lname, "password":pass, "token":invite_token,
               "passwordConfirm":passConf,"organizations" :[orgid]}
          return await commonAPIHelper
              .send("POST", this.BASE_URL,"/users/register",{"Authorization": "Bearer "+ token,"x-organization-id":orgid }, payload);
     }

    async registerWithPayload(payload,orgid:string) {
        return await commonAPIHelper
            .send("POST", this.BASE_URL,"/users/register",{"x-organization-id":orgid }, payload);
    }
    async registerAsUser(user:object, invite_token:string) {
        const payload={"firstName" : user['fname'], "lastName" : user['lname'], "password":user['pass'], "token":invite_token}
        return await commonAPIHelper
            .send("POST", this.BASE_URL,"/users/register",{"x-organization-id":user["orgId"] }, payload);
    }

    async resetPassword(password:string, invite_token:string) {
        const payload={"newPassword" : password, "token":invite_token}
        return await commonAPIHelper
            .send("POST", this.BASE_URL,"/auth/api/reset-password",{}, payload);
    }

     async me(token:string, orgid:string) {
          return await allure.step(`API: Me`, async()=> {
               return await commonAPIHelper
                   .send("GET", this.BASE_URL, "/users/me", {"Authorization": "Bearer " + token,"x-organization-id":orgid  }, null);
          })
     }
     async mePermissions(token:string, orgid:string) {
          return await allure.step(`API: Me`, async()=> {
               return await commonAPIHelper
                   .send("GET", this.BASE_URL, "/users/me/permissions", {"Authorization": "Bearer " + token,"x-organization-id":orgid  }, null);
          })
     }
     async meRoles(token:string, orgid:string) {
          return await allure.step(`API: Me`, async()=> {
               return await commonAPIHelper
                   .send("GET", this.BASE_URL, "/users/me/roles", {"Authorization": "Bearer " + token,"x-organization-id":orgid  }, null);
          })
     }

     async postMe(token:string, payload:object) {
          return await allure.step(`API: Post me [${payload}]`, async()=> {
               return await commonAPIHelper
                   .send("POST", this.BASE_URL, "/users/me",
                       {"Authorization": "Bearer " + token,"x-organization-id":TestData.defaultOrgId }, payload);
          })
     }
    async postMePassword(token:string, payload:object, orgId=TestData.defaultOrgId ) {
        return await allure.step(`API: Post me password request`, async()=> {
            return await commonAPIHelper
                .send("POST", this.BASE_URL, "/users/me/password",
                    {"Authorization": "Bearer " + token,"x-organization-id":orgId }, payload);
        })
    }
     async get_org_user(token:string, user_id:string,org_id:string,) {
          return await allure.step(`API: Get user [${user_id}] from organization [${org_id}]`, async()=> {
               return await commonAPIHelper
                   .send("GET", this.BASE_URL, "/users/" + user_id, {
                        "Authorization": "Bearer " + token,
                        "x-organization-id": org_id
                   }, null);
          })

     }
     async get_user(token:string, user_id:string) {
          return await allure.step(`API: Get user [${user_id}]`, async()=> {
               return await this.get_org_user(token, user_id, TestData.defaultOrgId);
          })
     }

     async get_role_permissions(token:string, role_id:string, org_id:string) {
          return await allure.step(`API: Get role [${role_id}] permissions`, async()=> {
               return await commonAPIHelper
                   .send("GET", this.BASE_URL, "/roles/" + role_id+"/permissions", {
                        "Authorization": "Bearer " + token,
                        "x-organization-id": org_id
                   }, null);
          })
     }
     async putRolePermissions(token:string, role_id:string, org_id:string, payload:object) {
          return await allure.step(`API: Put role [${role_id}] permissions`, async()=> {
               return await commonAPIHelper
                   .send("PUT", this.BASE_URL, "/roles/" + role_id+"/permissions", {
                        "Authorization": "Bearer " + token,
                        "x-organization-id": org_id
                   }, payload);
          })
     }


    async get_organizations_roles(token:string, org_id:string) {
        return await allure.step(`API: Get organizations roles`, async()=> {
            return await commonAPIHelper
                .send("GET", this.BASE_URL, "/roles/organizations/"+org_id , {
                    "Authorization": "Bearer " + token,
                    "x-organization-id": org_id
                }, null);
        })
    }

    async post_roles(token:string, payload:object, org_id:string) {
        return await allure.step(`API: Post organization roles [${payload}] `, async()=> {
            return await commonAPIHelper
                .send("POST", this.BASE_URL, "/roles" , {
                    "Authorization": "Bearer " + token,
                    "x-organization-id": org_id
                }, payload);
        })
    }


    async patch_role(token:string, role_id:String ,payload:object, org_id:string) {
        return await allure.step(`API: Path role [${payload}] `, async()=> {
            return await commonAPIHelper
                .send("PATCH", this.BASE_URL, "/roles/"+role_id , {
                    "Authorization": "Bearer " + token,
                    "x-organization-id": org_id
                }, payload);
        })
    }

    async delete_role(token:string, role_id:String ,org_id:string) {
        return await allure.step(`API: Delete role [${role_id}] `, async()=> {
            let result=await commonAPIHelper
                .send("DELETE", this.BASE_URL, "/roles/"+role_id , {
                    "Authorization": "Bearer " + token,
                    "x-organization-id": org_id
                }, null);
            return result;
        })
    }


    async get_organization_roles(token:string, org_id:string) {
        return await allure.step(`API: Get organization [${org_id}] roles`, async()=> {
            return await commonAPIHelper
                .send("GET", this.BASE_URL, "/roles/organizations/" + org_id, {
                    "Authorization": "Bearer " + token,
                    "x-organization-id": org_id
                }, null);
        })
    }

    async get_organization_role_details(token:string, role_name:string, org_id:string) {
        return await allure.step(`API: Get organization [${org_id}] role [${role_name}] id`, async()=> {
             let roles=await this.get_organization_roles(token, org_id)
              return roles.body.data.find(t => t.name.includes(role_name))
        })
    }

     async postUserRoles(token:string, user_id:string, role_id:string, org_id:string) {
          return await allure.step(`API: Post user [${user_id}] with role [${role_id}]`, async()=> {
                    return await commonAPIHelper
                        .send("POST", this.BASE_URL, `/users/${user_id}/roles`, {
                             "Authorization": "Bearer " + token,
                             "x-organization-id": org_id
                        }, {"roleId":role_id});

          })
     }
    async getUsers(token:string, org_id:string,url_suffix="" ) {
        return await allure.step(`API: Get users from otg [${org_id}]`, async()=> {
            return await commonAPIHelper
                .send("GET", this.BASE_URL, `/users${url_suffix}`, {
                    "Authorization": "Bearer " + token,
                    "x-organization-id": org_id
                });
        })
    }


    async findUsersByEmails( targetemails:string,url_suffix="") {
            let users= (await this.getUsers(this.COMMON_SA_TOKEN, TestData.superOrgId,url_suffix)).body
            return users.data.filter(t=>t.email.match(targetemails))

    }

     async disable(token:string,userId:string, reason:string) {
          return await allure.step(`API: Disable user [${userId}] with reason [${reason}]`, async()=> {
               return await this.disableOrgUser(token, userId, reason, TestData.defaultOrgId);
          })
     }
    async enableUser(userId:string, org_id=TestData.defaultOrgId) {
        return await allure.step(`API: Enable user [${userId}] `, async()=> {
           await this.postUserEnable(this.COMMON_TOKEN,userId,org_id);
        })
    }

    async postUserEnable(token:string, user_id:string,org_id:string) {
        return await allure.step(`API: Enable user [${user_id}]`, async()=> {
            return await commonAPIHelper
                .send("POST", this.BASE_URL, `/users/enable`, {
                    "Authorization": "Bearer " + token,
                    "x-organization-id": org_id
                }, {"userId":user_id});

        })
    }

    async unlinkUser(token:string, userId:string, roleId:string,org_id:string) {
        return await allure.step(`API: Unlink user [${userId}] `, async()=> {
                   return await commonAPIHelper
                    .send("POST", this.BASE_URL, "/users/unlink", {
                        "Authorization": "Bearer " + token,
                        "x-organization-id": org_id
                    }, {"userId":userId,"roleId":roleId});

        })
    }

    async removeInvitedUser(token:string, userId:string,org_id:string, auth_org_id=TestData.superOrgId) {
        return await allure.step(`API: Remove invites user [${userId}] `, async()=> {
            return await commonAPIHelper
                .send("POST", this.BASE_URL, "/users/invited/remove", {
                    "Authorization": "Bearer " + token,
                    "x-organization-id": auth_org_id
                }, {"userId":userId,"organizationId":org_id});

        })
    }

    async disableUser(token:string, userId:string, org_id:string) {
        return await allure.step(`API: Disable user [${userId}] `, async()=> {
            return await commonAPIHelper
                .send("POST", this.BASE_URL, "/users/disable", {
                    "Authorization": "Bearer " + token,
                    "x-organization-id": org_id
                }, {"userId":userId});

        })
    }


    async changeUserEmail(token:string, userId:string,email:string, org_id:string) {
        return await allure.step(`API: chnage user [${userId}] email to [${email}] `, async()=> {
            return await commonAPIHelper
                .send("POST", this.BASE_URL, `/users/${userId}/change-email`, {
                    "Authorization": "Bearer " + token,
                    "x-organization-id": org_id
                }, {"email":email});

        })
    }

     async disableOrgUser(token:string, userId:string, reason:string, org_id:string) {
          return await allure.step(`API: Disable user [${userId}] from organization [${org_id}] with reason [${reason}]`, async()=> {
               const payload = {"userId": userId, "reason": reason}
               return await commonAPIHelper
                   .send("POST", this.BASE_URL, "/users/disable", {
                        "Authorization": "Bearer " + token,
                        "x-organization-id": org_id
                   }, payload);
          })
     }
}

export default new supertestAHAPIHelper();
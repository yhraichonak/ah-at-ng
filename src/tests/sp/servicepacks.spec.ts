import ahAPI from "../../api/SupertestAHAPIHelper";
import commonHelper from "../../api/CommonHelper";
const { matchersWithOptions } = require('jest-json-schema');
import TestData from "../testdata";
import {test} from "@jest/globals";
let spToDel="ATSP-TO-DELETE";
let sp_prefix="AT_SP_PG";
let defaultSpDetails;
expect.extend(matchersWithOptions({schemas: [TestData.schema]}));
jest.setTimeout(30000);
let sp_mock1=TestData.sp_mock_data["MOCK-ACTIVE-FUTURE"]
let sp_mock2=TestData.sp_mock_data["MOCK-EXPIRED-OLD"]
let defaultSPPayloads={
    "inputs": [{ "packNo": `${spToDel}_0001`, "serviceGroupSku": sp_mock1.sgSKU, "productSku": sp_mock1.productSKU,
                "serialNumber": sp_mock1.sn, "endDate": "2026-09-30T21:59:59.999Z",
                "customerId": TestData.defaultCustomerDetails.id,
                "contactId": TestData.defaultCustomerContact.id,
                 "resellerId": TestData.defaultOrganizationEntityDetails.id },
                {"packNo": `${spToDel}_0002`, "serviceGroupSku": sp_mock2.sgSKU, "productSku": sp_mock2.productSKU,
                  "serialNumber": sp_mock2.sn, "endDate": "2026-09-30T21:59:59.999Z",
                  "customerId": TestData.defaultCustomerDetails.id,
                  "contactId": TestData.defaultCustomerContact.id,
                  "resellerId": TestData.defaultOrganizationEntityDetails.id }]
}
let defaultSPPayload={"inputs": [structuredClone(defaultSPPayloads.inputs[0])]}

describe("[jest] Service Packs", () => {
    afterEach(async () => {
        await ahAPI.clearCommonSession();
    });

    beforeAll(async () => {
        await ahAPI.getCommonSessionForUser(TestData.defaultUserDetails);
        await ahAPI.getCommonSessionForSA();
        let response = (await  ahAPI.getServicePacksWithParams(ahAPI.COMMON_TOKEN, "", "", sp_prefix, "", TestData.defaultOrgId));
        if (response.body.data.length == 0) {
            let inputsArray=[];
            for (let i = 0; i < 51; i++) {
                inputsArray[i]=structuredClone(defaultSPPayloads.inputs[0]);
                inputsArray[i].packNo=`${sp_prefix}_00${i}`
            }
            let payload={"inputs": inputsArray}
            await ahAPI.createServicePacks(ahAPI.COMMON_TOKEN,payload, TestData.defaultOrgId);
        }
        defaultSpDetails = await ahAPI.getServicePackByName(ahAPI.COMMON_TOKEN, sp_prefix, TestData.defaultOrgId);
        await  ahAPI.deleteServicePacksByQuery(ahAPI.COMMON_TOKEN, spToDel,TestData.defaultOrgId)
    },20000);

    afterAll(async () => {
        await ahAPI.getCommonSessionForUser(TestData.defaultUserDetails);
        await  ahAPI.deleteServicePacksByQuery(ahAPI.COMMON_TOKEN, spToDel,TestData.defaultOrgId )
        await ahAPI.clearCommonSession();
    });

    beforeEach(async () => {
        await ahAPI.getCommonSessionForUser(TestData.defaultUserDetails);
    });

    describe("List SPs",  () => {
        test("Get Service Packs", async () => {
            const response = await ahAPI.getServicePacks(ahAPI.COMMON_TOKEN, TestData.defaultOrgId);
            expect(response.statusCode).toBe(200);
            expect(response.body.data).toMatchSchema({$ref: "schema#/definitions/service_packs"});
        });

        test.each([
            {attribute: "packNo", query: `${sp_prefix}_0020`},
            { attribute: "packNo", query: "0020" }
        ])
        ("Get Service Packs - Search - by $attribute", async ({attribute, query}) => {
            let response = (await ahAPI.getServicePacksWithParams(ahAPI.COMMON_TOKEN, "", "", query, "", TestData.defaultOrgId));
            expect(response.statusCode).toBe(200)
            expect(response.body.data.map(u => u[attribute]).join(",")).toBe(response.body.data.filter(u => u[attribute].includes(query)).map(u => u[attribute]).join(","))
        })


        test("Get Service Packs - Search without results", async () => {
            let response = (await ahAPI.getServicePacksWithParams(ahAPI.COMMON_TOKEN, "", "", "NONEXISTING", "", TestData.defaultOrgId));
            expect(response.statusCode).toBe(200)
            expect(response.body.data).toHaveLength(0)
        })


        test.each([
            { attr:"packNo",order:"asc" },
            { attr:"packNo",order:"desc" },
            { attr:"status",order:"asc" },
            { attr:"status",order:"desc" },
            { attr:"endUser",order:"asc" },
            { attr:"endUser",order:"desc" },
            { attr:"endDate",order:"asc" },
            { attr:"endDate",order:"desc" },
        ])

        (`Get Service Packs - Sorting by $attr in $order order`, async ({attr, order}) => {
            let response =await ahAPI.getServicePacks(ahAPI.COMMON_TOKEN,TestData.defaultOrgId,`?sortBy=${attr}&sortOrder=${order}`);
            let origOrder:[]= response.body.data.map(t=>( t[attr]?.name!==undefined)?t[attr].name:t[attr]);
            let actualOrderString=origOrder.join(",");
            let expectedOrderString=await commonHelper.verifySorting(origOrder,attr,order,false);
            expect(actualOrderString).toEqual(expectedOrderString);
        })


        test("Get Service Packs - Filter - Status", async () => {
            let response =(await ahAPI.getServicePacksWithParams(ahAPI.COMMON_TOKEN,"","","","status[]=active",TestData.defaultOrgId));
            expect(response.statusCode).toBe(200)
            expect(response.body.data.map(u=>u.status).join(",")).toBe(response.body.data.filter(u=>u.status.match("active")).map(u=>u.status).join(","))
        })

        test("Get Service Packs - Filter - Status - Non-Exising", async () => {
            let response =(await ahAPI.getServicePacksWithParams(ahAPI.COMMON_TOKEN,"","","","status[]=BLAH",TestData.defaultOrgId));
            expect(response.statusCode).toBe(400)
            expect(response.body.message).toMatch("[\"status.0: Invalid enum value. Expected 'active' | 'expired' | 'unknown' | 'renewed', received 'BLAH'\"]");
        })

        test("Get Service Packs - Pagination", async () => {
            const response = await ahAPI.getServicePacks(ahAPI.COMMON_TOKEN, TestData.defaultOrgId);
            expect(response.statusCode).toBe(200);
            expect(response.body.data).toHaveLength(50)
            expect(response.body.meta.hasNextPage).toBe(true)
            expect(response.body.meta.nextCursor).not.toBeNull();
        });

        test.each([{ pages:"10" },])
        ("Get Service Packs - Pagination - $pages pages", async ({pages}) => {
            let response =await ahAPI.getServicePacksWithParams(ahAPI.COMMON_TOKEN,pages,"","","",TestData.defaultOrgId);
            expect(response.statusCode).toBe(200);
            expect(response.body.data).toHaveLength(parseInt(pages))
            expect(response.body.meta.hasNextPage).toBe(true)
            expect(response.body.meta.nextCursor).not.toBeNull();
        })


        test("Get Service Packs - Pagination - Invalid page size", async () => {
            let response =await ahAPI.getServicePacksWithParams(ahAPI.COMMON_TOKEN,"blah","","","",TestData.defaultOrgId);
            expect(response.statusCode).toBe(400);
            expect(response.body.message).toContain("limit: Expected number, received nan");
        })

        test("Get Service Packs - Pagination - Cursor", async () => {
            let entities20 =(await ahAPI.getServicePacksWithParams(ahAPI.COMMON_TOKEN,"20","","","",TestData.defaultOrgId)).body.data;
            let response=await ahAPI.getServicePacksWithParams(ahAPI.COMMON_TOKEN,"10","","","",TestData.defaultOrgId);
            let nextCursor=response.body.meta.nextCursor
            let quotesFirst10 =response.body.data;
            let quotesLast10 =(await ahAPI.getServicePacksWithParams(ahAPI.COMMON_TOKEN,"10",nextCursor,"","",TestData.defaultOrgId)).body.data;
            expect(entities20.map(u=>u.id).join(",")).toContain(quotesFirst10.map(u=>u.id).join(","));
            expect(entities20.map(u=>u.id).join(",")).toContain((quotesLast10.map(u=>u.id)).join(","));
        })

        test("Get Service Packs - Pagination - No next page", async () => {
            let response =(await ahAPI.getServicePacksWithParams(ahAPI.COMMON_TOKEN,"100","","CH11","",TestData.defaultOrgId));
            expect(response.statusCode).toBe(200);
            expect(response.body.data.length).toBeLessThanOrEqual(100)
            expect(response.body.meta.hasNextPage).toBe(false)
            expect(response.body.meta.nextCursor).toBeNull();
        })

        test("Get Service Packs - Pagination - Non-Existing cursor", async () => {
            let response =(await ahAPI.getServicePacksWithParams(ahAPI.COMMON_TOKEN,"20","CH99999" ,"","",TestData.defaultOrgId));
            expect(response.statusCode).toBe(500);
        })

        test("Get Service Packs - Unauthorized", async () => {
            const response = await ahAPI.getServicePacks("blah", TestData.defaultOrgId);
            expect(response.statusCode).toBe(401);
        });

        test("Get Service Packs - Unprivileged", async () => {
            let TOKEN=await ahAPI.getUserToken(TestData.defaultViewerUser)
            const response = await ahAPI.getServicePacks(TOKEN, TestData.defaultOrgId);
            expect(response.statusCode).toBe(401);
        });

        test("Get Service Packs - Non existing orgId", async () => {
            const response = await ahAPI.getServicePacks(ahAPI.COMMON_TOKEN, TestData.nonExisingId);
            expect(response.statusCode).toBe(403);
        });

    })

    describe("Create SPs",  () => {

        test("Service Packs - Create Multiple", async () => {
            let response =await ahAPI.createServicePacks(ahAPI.COMMON_TOKEN,defaultSPPayloads, TestData.defaultOrgId);
            expect(response.statusCode).toBe(201);
            expect(response.body.length).toBe(2);
        })

        test("Service Packs - Create Single", async () => {
            let response =await ahAPI.createServicePacks(ahAPI.COMMON_TOKEN,defaultSPPayload, TestData.defaultOrgId);
            expect(response.statusCode).toBe(201);
            expect(response.body.length).toBe(1);
        })

        test("Service Packs - Create Multiple", async () => {
            let inputsArray=[];
            for (let i = 0; i < 5; i++) {
                inputsArray[i]=structuredClone(defaultSPPayloads.inputs[0]);
                inputsArray[i].packNo=`${spToDel}_00${i}`
            }
            let payload={"inputs": inputsArray}
            let response =await ahAPI.createServicePacks(ahAPI.COMMON_TOKEN,payload, TestData.defaultOrgId);
            expect(response.statusCode).toBe(201);
            expect(response.body.length).toBe(5);
        },60000)


        test("Service Packs - Create Empty", async () => {
            let response =await ahAPI.createServicePacks(ahAPI.COMMON_TOKEN,{"inputs": []}, TestData.defaultOrgId);
            expect(response.statusCode).toBe(400);
            expect(response.body.message).toMatch(/inputs: Array must contain at least 1 element/);
        })

      //TODO: need SN with warranty expired in the past
      //   test.skip("Service Packs - Create - With End Date in the past", async () => {
      //           let payload=structuredClone(defaultSPPayload);
      //           payload.inputs[0].endDate="2022-09-30T21:59:59.999Z";
      //           let response =await ahAPI.createServicePacks(ahAPI.COMMON_TOKEN,payload, TestData.defaultOrgId);
      //           expect(response.statusCode).toBe(201);
      //           expect(response.body[0].status).toMatch(/expired/);
      //   })

        test("Service Packs - Create - With empty End Date", async () => {
            let response
            try {
                let payload=structuredClone(defaultSPPayload);
                payload.inputs[0].endDate="";
                response =await ahAPI.createServicePacks(ahAPI.COMMON_TOKEN,payload, TestData.defaultOrgId);
                expect(response.statusCode).toBe(400);
                expect(response.body.message).toMatch(/inputs.0.endDate: Invalid datetime/);
            }catch (e){throw e}
            finally {
                if (response.body.length>0) await ahAPI.deleteServicePack(ahAPI.COMMON_TOKEN,response.body[0].id,TestData.defaultOrgId );
            }
        })

        test("Service Packs - Create - With invalid End Date", async () => {
            let response
            try {
                let payload=structuredClone(defaultSPPayload);
                payload.inputs[0].endDate="qwe";
                response =await ahAPI.createServicePacks(ahAPI.COMMON_TOKEN,payload, TestData.defaultOrgId);
                expect(response.statusCode).toBe(400);
                expect(response.body.message).toMatch(/inputs.0.endDate: Invalid datetime/);
            }catch (e){throw e}
            finally {
                if (response.body.length>0) await ahAPI.deleteServicePack(ahAPI.COMMON_TOKEN,response.body[0].id,TestData.defaultOrgId );
            }
        })

        test.each([
            {attrName: "productSku", attrValue:``, msg:"productSku: String must contain at least 1 character", descr:"Empty packNo"},
            {attrName: "packNo", attrValue:TestData.string4100, msg:"String must contain at most 255 character", descr:"Prolonged packNo"},
            {attrName: "serviceGroupSku", attrValue:null, msg:"serviceGroupSku: Expected string, received null", descr:"Null Service Group"},
            {attrName: "serialNumber", attrValue:TestData.string4100, msg:"serialNumber: String must contain at most 255 character", descr:"Prolonged SN"},
            {attrName: "productSku",  attrValue:TestData.string4100, msg:"productSku: String must contain at most 255 characte", descr:"Prolonged productSku"},
            {attrName: "endDate",attrValue:"", msg:"endDate: Invalid datetime", descr:"Empty End Date"},
            {attrName: "customerId",attrValue:null, msg:"customerId: Expected string, received null", descr:"Empty customerId"},
            {attrName: "resellerId",attrValue:null, msg:"resellerId: Expected string, received null", descr:"Empty customerId"}
        ])("Service Packs - Create negative - $descr", async ({attrName, attrValue,msg, descr}) => {
            let response
            try {
                let payload=structuredClone(defaultSPPayload);
                payload.inputs[0][attrName] = attrValue
                response = await ahAPI.createServicePacks(ahAPI.COMMON_TOKEN, payload, TestData.defaultOrgId)
                expect(response.statusCode).toBe(400);
                expect(response.body.message).toMatch(new RegExp(msg));
            }catch (e){throw e}
            finally {
                if (response.body.length>0)  await ahAPI.deleteServicePack(ahAPI.COMMON_TOKEN,response.body[0].id,TestData.defaultOrgId );
            }
        },20000)

        test.each([
            {attrName: "productSku", attrValue:"blah", descr:"No warranty info"},
            {attrName: "customerId",attrValue:TestData.nonExisingId,descr:"Non-existing customerId"},
            {attrName: "resellerId",attrValue:TestData.nonExisingId,  descr:"Non-existing resellerId"}

        ])("Service Packs - Create negative - $descr", async ({attrName, attrValue}) => {
            let response
            try {
                let payload=structuredClone(defaultSPPayload);
                payload.inputs[0][attrName] = attrValue
                response = await ahAPI.createServicePacks(ahAPI.COMMON_TOKEN, payload, TestData.defaultOrgId)
                expect(response.statusCode).toBe(404);
            }catch (e){throw e}
            finally {
                if (response.body.length>0)  await ahAPI.deleteServicePack(ahAPI.COMMON_TOKEN,response.body[0].id,TestData.defaultOrgId );
            }
        },60000)

        test.each([
            {attribute: "packNo"},
            { attribute: "serviceGroupSku" }
        ])("Service Packs - Create - With empty $attribute", async ({attribute}) => {
            let payload=structuredClone(defaultSPPayload);
            payload.inputs[0][attribute]="";
            let response =await ahAPI.createServicePacks(ahAPI.COMMON_TOKEN,payload, TestData.defaultOrgId);
            expect(response.statusCode).toBe(201);
        },60000)

        test("Service Packs - Create - Unprivileged", async () => {
            let TOKEN=await ahAPI.getUserToken(TestData.defaultViewerDetails)
            let response =await ahAPI.createServicePacks(TOKEN,defaultSPPayload, TestData.defaultOrgId);
            expect(response.statusCode).toBe(403);
        });

        test("Service Packs - Create - Non existing orgId", async () => {
            let response =await ahAPI.createServicePacks(ahAPI.COMMON_TOKEN,defaultSPPayload, TestData.nonExisingId);
            expect(response.statusCode).toBe(403);
        });

        test("Se`rvice Packs - Create - Unauthorized", async () => {
            let response =await ahAPI.createServicePacks("BLAH",defaultSPPayload, TestData.defaultOrgId);
            expect(response.statusCode).toBe(401);
        });

    })

    describe("Import SPs",  () => {

        test("Service Packs - Import - Multiple", async () => {
            let response =await ahAPI.importServicePacks(ahAPI.COMMON_TOKEN,defaultSPPayloads, TestData.defaultOrgId);
            expect(response.statusCode).toBe(201);
            expect(response.body.data.length).toBe(2);
            expect(response.body.success).toBe(true);
            expect(response.body.status).toBe("imported");
        })


        test("Service Packs - Import - Unprivileged", async () => {
            let TOKEN=await ahAPI.getUserToken(TestData.defaultViewerDetails)
            let response =await ahAPI.importServicePacks(TOKEN,defaultSPPayload, TestData.defaultOrgId);
            expect(response.statusCode).toBe(403);
        });

        test("Service Packs - Import - Non existing orgId", async () => {
            let response =await ahAPI.importServicePacks(ahAPI.COMMON_TOKEN,defaultSPPayload, TestData.nonExisingId);
            expect(response.statusCode).toBe(403);
        });

        test("Service Packs - Import - Unauthorized", async () => {
            let response =await ahAPI.importServicePacks("BLAH",defaultSPPayload, TestData.defaultOrgId);
            expect(response.statusCode).toBe(401);
        });

    })


    describe("Update SPs",  () => {
        let defaultUpdatePayload=
            {
                "packNo": defaultSPPayloads.inputs[0].packNo,
                "serialNumber": defaultSPPayloads.inputs[0].serialNumber,
                "serviceGroupSku": defaultSPPayloads.inputs[0].serviceGroupSku,
                "productSku": defaultSPPayloads.inputs[0].productSku,
                "endDate": defaultSPPayloads.inputs[0].endDate,
                "customerId":  TestData.defaultCustomerDetails.id,
                "resellerId": defaultSPPayloads.inputs[0].resellerId
            }
        test.each([
            {attrName: "packNo", attrValue:`${spToDel}_UPDATE`},
            {attrName: "serialNumber", attrValue:`${spToDel}_SN_UPDATE`},
            {attrName: "serviceGroupSku", attrValue: defaultSPPayloads.inputs[1].serviceGroupSku},
            {attrName: "productSku", attrValue:`${spToDel}_SKU_UPDATE`},
            {attrName: "endDate", attrValue: "2027-09-30T21:59:59.999Z"},
            {attrName: "customerId", attrValue:  TestData.altCustomerDetails.id},
            {attrName: "resellerId", attrValue:  TestData.defaultOrganizationAltEntityDetails.id }

        ])("Service Packs - Update positive - $attrName", async ({attrName, attrValue}) => {
            let spDetails=(await ahAPI.createServicePacks(ahAPI.COMMON_TOKEN, defaultSPPayload,TestData.defaultOrgId)).body[0];
            let updatePayload=structuredClone(defaultUpdatePayload)
            updatePayload[attrName]=attrValue
            let response =await ahAPI.updateServicePack(ahAPI.COMMON_TOKEN,spDetails.id, updatePayload, TestData.defaultOrgId);
            expect(response.statusCode).toBe(200);
        },20000)

        test.each([
            {attrName: "productSku", attrValue:``, msg:"productSku: String must contain at least 1 character", descr:"Empty productSku"},
            {attrName: "serialNumber", attrValue:null, msg:"serialNumber: Expected string, received null", descr:"Null serialNumber"},
            {attrName: "endDate",attrValue:"", msg:"endDate: Invalid datetime", descr:"Empty End Date"},
            {attrName: "customerId",attrValue:null, msg:"customerId: Expected string, received null", descr:"Empty customerId"},
            {attrName: "resellerId",attrValue:null, msg:"resellerId: Expected string, received null", descr:"Empty customerId"},
        ])("Service Packs - Update negative - $descr", async ({attrName, attrValue,msg, descr}) => {
            let spDetails=(await ahAPI.createServicePacks(ahAPI.COMMON_TOKEN, defaultSPPayload,TestData.defaultOrgId)).body[0];
            let updatePayload=structuredClone(defaultUpdatePayload)
            updatePayload[attrName]=attrValue
            let response =await ahAPI.updateServicePack(ahAPI.COMMON_TOKEN,spDetails.id, updatePayload, TestData.defaultOrgId);
            expect(response.statusCode).toBe(400);
            expect(response.body.message).toMatch(new RegExp(msg));
        })

        test.each([
            {attrName: "serviceGroupSku", attrValue:"blah", descr:"Unknown Service Group"},
            {attrName: "customerId",attrValue:TestData.nonExisingId,  descr:"Non-existing customerId"},
            {attrName: "resellerId",attrValue:TestData.nonExisingId, descr:"Non-existing resellerId"}

        ])("Service Packs - Update negative - empty $descr", async ({attrName, attrValue}) => {
            let spDetails=(await ahAPI.createServicePacks(ahAPI.COMMON_TOKEN, defaultSPPayload,TestData.defaultOrgId)).body[0];
            let updatePayload=structuredClone(defaultUpdatePayload)
            updatePayload[attrName]=attrValue
            let response =await ahAPI.updateServicePack(ahAPI.COMMON_TOKEN,spDetails.id, updatePayload, TestData.defaultOrgId);
            expect(response.statusCode).toBe(404);
        })


        test("Service Packs - Update - Non existing spId", async () => {
            const response = await ahAPI.updateServicePack(
                ahAPI.COMMON_TOKEN, TestData.nonExisingId,defaultUpdatePayload,TestData.defaultOrgId );
            expect(response.statusCode).toBe(404);
        });

        test("Service Packs - Update - Unauthorized", async () => {
            let spDetails=(await ahAPI.createServicePacks(ahAPI.COMMON_TOKEN, defaultSPPayload,TestData.defaultOrgId)).body[0];
            const response = await ahAPI.updateServicePack("blah", spDetails.id, defaultUpdatePayload,TestData.defaultOrgId);
            expect(response.statusCode).toBe(401);
        });

        test("Service Packs - Update - Unprivileged", async () => {
            let spDetails=(await ahAPI.createServicePacks(ahAPI.COMMON_TOKEN, defaultSPPayload,TestData.defaultOrgId)).body[0];
            let TOKEN=await ahAPI.getUserToken(TestData.defaultViewerUser)
            const response = await ahAPI.updateServicePack(TOKEN, spDetails.id, defaultUpdatePayload, TestData.defaultOrgId);
            expect(response.statusCode).toBe(401);
        });

        test("Service Packs - Update - Non existing orgId", async () => {
            let spDetails=(await ahAPI.createServicePacks(ahAPI.COMMON_TOKEN, defaultSPPayload,TestData.defaultOrgId)).body[0];
            const response = await ahAPI.updateServicePack(ahAPI.COMMON_TOKEN, spDetails.id,defaultUpdatePayload,TestData.nonExisingId);
            expect(response.statusCode).toBe(403);
        });


    })

    describe("Delete Service Pack",  () => {
        test("Service Packs - Delete", async () => {
            let spDetails=(await ahAPI.createServicePacks(ahAPI.COMMON_TOKEN, defaultSPPayload,TestData.defaultOrgId)).body[0];
            let response=await ahAPI.deleteServicePack(ahAPI.COMMON_TOKEN,spDetails.id,TestData.defaultOrgId );
            expect(response.statusCode).toBe(204);
        })

        test("Service Packs - Delete - Non existing spId", async () => {
            const response = await ahAPI.deleteServicePack(ahAPI.COMMON_TOKEN, TestData.nonExisingId,TestData.defaultOrgId );
            expect(response.statusCode).toBe(404);
        });

        test("Service Packs - Delete - Unauthorized", async () => {
            let spDetails=(await ahAPI.createServicePacks(ahAPI.COMMON_TOKEN, defaultSPPayload,TestData.defaultOrgId)).body[0];
            const response = await ahAPI.deleteServicePack("blah", spDetails.id, TestData.defaultOrgId);
            expect(response.statusCode).toBe(401);
        });

        test("Service Packs - Delete - Unprivileged", async () => {
            let spDetails=(await ahAPI.createServicePacks(ahAPI.COMMON_TOKEN, defaultSPPayload,TestData.defaultOrgId)).body[0];
            let TOKEN=await ahAPI.getUserToken(TestData.defaultViewerUser)
            const response = await ahAPI.deleteServicePack(TOKEN, spDetails.id, TestData.defaultOrgId);
            expect(response.statusCode).toBe(401);
        });

        test("Service Packs - Delete - Non existing orgId", async () => {
            let spDetails=(await ahAPI.createServicePacks(ahAPI.COMMON_TOKEN, defaultSPPayload,TestData.defaultOrgId)).body[0];
            const response = await ahAPI.deleteServicePack(ahAPI.COMMON_TOKEN, spDetails.id,TestData.nonExisingId);
            expect(response.statusCode).toBe(403);
        });
    })

    describe("Get Service Pack",  () => {
        test("Service Pack - Get", async () => {
            const spDetails = await ahAPI.getServicePackByName(ahAPI.COMMON_TOKEN, sp_prefix, TestData.defaultOrgId);
            const response = await ahAPI.getServicePack(ahAPI.COMMON_TOKEN, spDetails.id,TestData.defaultOrgId);
            expect(response.statusCode).toBe(200);
            expect(response.body).toMatchSchema({$ref: "schema#/definitions/service_pack"});
        })

        test("Service Pack - Get - Info", async () => {
            const spDetails = await ahAPI.getServicePackByName(ahAPI.COMMON_TOKEN, sp_prefix, TestData.defaultOrgId);
            const response = await ahAPI.getServicePack(ahAPI.COMMON_TOKEN, spDetails.id,TestData.defaultOrgId);
            expect(response.statusCode).toBe(200);
            expect(response.body.id).toEqual(spDetails.id);
            expect(response.body.packNo).toEqual(spDetails.packNo);
            expect(response.body.serviceGroupSku).toEqual(spDetails.serviceGroupSku);
            expect(response.body.serialNumber).toEqual(spDetails.serialNumber);
            expect(response.body.productSku).toEqual(spDetails.productSku);
            expect(response.body.endDate).toEqual(spDetails.endDate);
            expect(response.body.startDate).toEqual(spDetails.startDate);
            expect(response.body.endUserId).toEqual(spDetails.endUserId);
            expect(response.body.status).toEqual(spDetails.status);
            expect(response.body.resellerId).toEqual(spDetails.resellerId);
            expect(response.body.vendor).toEqual(spDetails.vendor);
            expect(response.body.vendorId).toEqual(spDetails.vendorId);
        })

        test("Service Pack - Get - Non existing spId", async () => {
            const response = await ahAPI.getServicePack(ahAPI.COMMON_TOKEN, TestData.nonExisingId,TestData.defaultOrgId );
            expect(response.statusCode).toBe(404);
        });

        test("Service Pack - Get - Unauthorized", async () => {
            const response = await ahAPI.getServicePack("blah", defaultSpDetails.id, TestData.defaultOrgId);
            expect(response.statusCode).toBe(401);
        });

        test("Service Pack - Get - Unprivileged", async () => {
            let TOKEN=await ahAPI.getUserToken(TestData.defaultViewerUser)
            const response = await ahAPI.getServicePack(TOKEN, defaultSpDetails.id, TestData.defaultOrgId);
            expect(response.statusCode).toBe(401);
        });

        test("Service Pack - Get - Non existing orgId", async () => {
            const response = await ahAPI.getServicePack(ahAPI.COMMON_TOKEN, defaultSpDetails.id,TestData.nonExisingId);
            expect(response.statusCode).toBe(403);
        });
    })


    describe("Validate Service Pack",  () => {
        let hpeData=TestData.realHPEValidation;
        test("Service Pack - Validate", async () => {
            const response = await ahAPI.validateServicePack(ahAPI.COMMON_TOKEN, TestData.defaultEndUserDetails.id,hpeData.productSKU,hpeData.sn,TestData.altOrgId);
            expect(response.statusCode).toBe(201);
            expect(response.body).toMatchSchema({$ref: "schema#/definitions/sp_verify"});
        })

        test("Service Pack - Validate - Info", async () => {
            const response = await ahAPI.validateServicePack(ahAPI.COMMON_TOKEN, TestData.defaultEndUserDetails.id,hpeData.productSKU,hpeData.sn,TestData.altOrgId);
            expect(response.statusCode).toBe(201);
            expect(hpeData.statuses).toMatch(response.body.status);
            expect(response.body.productSku).toMatch(hpeData.productSKU);
            expect(response.body.productDescription).toMatch(hpeData.productDescription);
            expect(response.body.serviceGroupSku).toMatch(hpeData.serviceGroupSku);
            expect(response.body.serviceGroupDescription).toMatch(hpeData.serviceGroupDescription);
            expect(response.body.endDate).toMatch(hpeData.endDate);
        })


        test("Service Pack - Validate - Non-existing SKU-SN combination", async () => {
            const response = await ahAPI.validateServicePack(ahAPI.COMMON_TOKEN, TestData.defaultEndUserDetails.id,"BLAH","BLAH",TestData.altOrgId);
            expect(response.statusCode).toBe(404);
        });

        test("Service Pack - Validate - Non-existing endUser id", async () => {
            const response = await ahAPI.validateServicePack(ahAPI.COMMON_TOKEN,TestData.nonExisingId,hpeData.productSKU,hpeData.sn,TestData.altOrgId);
            expect(response.statusCode).toBe(401);
        });

        test("Service Pack - Validate - Unauthorized", async () => {
            const response = await ahAPI.validateServicePack("BLAH", TestData.defaultEndUserDetails.id,hpeData.productSKU,hpeData.sn,TestData.altOrgId);
            expect(response.statusCode).toBe(401);
        });

        test("Service Pack - Validate -  Non existing orgId", async () => {
            const response = await ahAPI.validateServicePack(ahAPI.COMMON_TOKEN, TestData.defaultEndUserDetails.id,hpeData.productSKU,hpeData.sn,TestData.nonExisingId);
            expect(response.statusCode).toBe(403);
        });

        test("Service Pack - Validate - Unprivileged", async () => {
            let TOKEN=await ahAPI.getUserToken(TestData.defaultViewerUser)
            const response = await ahAPI.validateServicePack(TOKEN, TestData.defaultEndUserDetails.id,hpeData.productSKU,hpeData.sn,TestData.altOrgId);
            expect(response.statusCode).toBe(401);
        });
    })

    describe("Bulk Validate Service Pack",  () => {
        test("Service Pack - Bulk Validate", async () => {
            const response = await ahAPI.bulkValidateServicePack(ahAPI.COMMON_SA_TOKEN,TestData.altOrganizationEntityDetails.id,"src/tests/bulk_sp_import.xls",TestData.superOrgId);
            expect(response.statusCode).toBe(200);
            expect(response.body).toMatchSchema({$ref: "schema#/definitions/sp_bulk_verify"});
        })

        test.each([
            { format: "xls", },
            { format: "xlsx", }
        ])
        (`Service Pack - Bulk Validate - Info - $format`, async ({format}) => {
            const response = await ahAPI.bulkValidateServicePack(ahAPI.COMMON_SA_TOKEN,TestData.altOrganizationEntityDetails.id,"src/tests/bulk_sp_import."+format,TestData.superOrgId);
            expect(response.statusCode).toBe(200);
            expect(JSON.stringify(response.body.failed[0])).toMatch(/"row":2,"serialNumber":"MOCK-EXPIRED-RECENT-PE","productSku":"MOCK-SKU-EXPIRED-RECENT-PE","servicePackSerialNumber":"SP-MOCK-EXPIRED-RECENT","error":"Kontakt nicht gefunden","endUserName":"BitHawk AG","contactEmail":"robert.kruppa@netgo.de","errorType":"CONTACT_NOT_FOUND","endUserId":"308247"/)
            expect(JSON.stringify(response.body.success[0])).toMatch(/"row":6,"serialNumber":"MOCK-ACTIVE-FUTURE-PE","productSku":"MOCK-SKU-ACTIVE-FUTURE-PE","servicePackSerialNumber":"BULK-MOCK-ACTIVE-FUTURE","endUserId":"308247","contactId":"0b7f322b-c109-4128-bf8d-983e034cdcca","endUserName":"BitHawk AG","contactEmail":"tesedi.assethub.test@gmail.com","status":"active","productDescription":"Mock HPE Server - Active with distant expiration 2x UPPER BOUNDARY","serviceGroupSku":"MOCK-SERVICE-ACTIVE-FUTURE-PE","serviceGroupDescription":"Mock HPE Service - Active Long Term","endDate":".*","productPrice":"7500","servicePrice":"1100","currency":"CHF","address":{"id":"540815","address":"Allee 1A","zip":"6210","city":"Sursee","country":"CH"}/)
        })

        test("Service Pack - Bulk Validate - Big", async () => {
            const response = await ahAPI.bulkValidateServicePack(ahAPI.COMMON_SA_TOKEN,TestData.altOrganizationEntityDetails.id,"src/tests/bulk_sp_import_big.xls",TestData.superOrgId);
            expect(response.statusCode).toBe(200);
            expect(response.body).toMatchSchema({$ref: "schema#/definitions/sp_bulk_verify"});
        })

        test("Service Pack - Bulk Validate - Negative", async () => {
            const response = await ahAPI.bulkValidateServicePack(ahAPI.COMMON_SA_TOKEN,TestData.altOrganizationEntityDetails.id,"src/tests/bulk_sp_import_negative.xls",TestData.superOrgId);
            expect(response.statusCode).toBe(200);
            expect(JSON.stringify(response.body.failed[0].error)).toMatch(/Name des Endbenutzers ist erforderlich/)
            expect(JSON.stringify(response.body.failed[1].error)).toMatch(/Kunde nicht gefunden/)
            expect(JSON.stringify(response.body.failed[2].error)).toMatch(/Kontakt-E-Mail ist erforderlich/)
            expect(JSON.stringify(response.body.failed[3].error)).toMatch(/Kontakt nicht gefunden/)
            expect(JSON.stringify(response.body.failed[4].error)).toMatch(/Kontakt nicht gefunden/)
            expect(JSON.stringify(response.body.failed[5].error)).toMatch(/Keine Seriennummer angegeben/)
            expect(JSON.stringify(response.body.failed[6].error)).toMatch(/Keine Produkt-SKU angegeben/)
            expect(JSON.stringify(response.body.failed[7].error)).toMatch(/Kein Care-Pack dem Asset zugewiesen/)
            expect(JSON.stringify(response.body.failed[8].error)).toMatch(/Kein Care-Pack dem Asset zugewiesen/)
            expect(JSON.stringify(response.body.failed[9].error)).toMatch(/Kein Care-Pack dem Asset zugewiesen/)
            expect(JSON.stringify(response.body.failed[10].error)).toMatch(/Kein Care-Pack dem Asset zugewiesen/)
        },60000)

        test("Service Pack - Bulk Validate - Unauthorized", async () => {
            const response = await ahAPI.bulkValidateServicePack("BLAH",TestData.altOrganizationEntityDetails.id,"src/tests/bulk_sp_import.xls",TestData.superOrgId);
            expect(response.statusCode).toBe(401);
        })

        test("Service Pack - Bulk Validate - not SA", async () => {
            const response = await ahAPI.bulkValidateServicePack(ahAPI.COMMON_TOKEN,TestData.altOrganizationEntityDetails.id,"src/tests/bulk_sp_import.xls",TestData.defaultOrgId);
            expect(response.statusCode).toBe(403);
        })

        test("Service Pack - Bulk Validate - non-existing Org id", async () => {
            const response = await ahAPI.bulkValidateServicePack(ahAPI.COMMON_SA_TOKEN,TestData.altOrganizationEntityDetails.id,"src/tests/bulk_sp_import.xls",TestData.nonExisingId);
            expect(response.statusCode).toBe(403);
        })

        test("Service Pack - Bulk Validate - Invalid file", async () => {
            const response = await ahAPI.bulkValidateServicePack(ahAPI.COMMON_SA_TOKEN,TestData.altOrganizationEntityDetails.id,"src/tests/poFile.pdf",TestData.superOrgId);
            expect(response.statusCode).toBe(500);
        })

    })
});


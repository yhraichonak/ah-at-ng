import {ENV} from "../../environment";
import genericAPIHelper from "./GenericAPIHelper";

class AHAPIHelper {

     BASE_URL: string = ENV.BASE_URL;
     headers = {};

     async getStatus() {
          return await genericAPIHelper.get(this.BASE_URL, this.headers);
     }
}

export default new AHAPIHelper();
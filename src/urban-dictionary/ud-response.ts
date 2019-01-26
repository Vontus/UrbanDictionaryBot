import { UdDefinition } from "./ud-definition";

export class UdResponse {
  list: UdDefinition[];

  constructor (jsonObject: any) {
    this.list = [];
    jsonObject.list.forEach((element: any) => {
      this.list.push(new UdDefinition(element));
    });
  }
  
  hasDefinitions() {
    return this.list && this.list.length > 0;
  }
}

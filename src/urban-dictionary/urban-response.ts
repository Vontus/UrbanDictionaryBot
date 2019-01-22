import { UrbanDefinition } from "./urban-definition";

export class UrbanResponse {
  list: UrbanDefinition[];

  constructor (jsonObject: any) {
    this.list = [];
    jsonObject.list.forEach((element: any) => {
      this.list.push(new UrbanDefinition(element));
    });
  }
}

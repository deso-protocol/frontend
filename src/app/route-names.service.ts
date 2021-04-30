import { RouteNames } from "./app-routing.module";
import { Injectable } from "@angular/core";

@Injectable({
  providedIn: "root",
})
export default class RouteNamesService extends RouteNames {
  constructor() {
    super();
  }
}

import { Component } from "@angular/core";
import { BackendApiService } from "src/app/backend-api.service";
import { RouteNames } from "../../app-routing.module";

@Component({
  selector: "get-starter-bitclout",
  templateUrl: "./get-starter-bitclout.component.html",
  styleUrls: ["./get-starter-bitclout.component.scss"],
})
export class GetStarterBitcloutComponent {
  jumioSuccessRoute: string;
  jumioErrorRoute: string;

  constructor(private backendApi: BackendApiService) {
    this.jumioSuccessRoute = this.backendApi._makeRequestURL(
      window.location.origin,
      "/" + RouteNames.SIGN_UP + "?stepNum=4"
    );
    this.jumioErrorRoute = this.backendApi._makeRequestURL(
      window.location.origin,
      "/" + RouteNames.SIGN_UP + encodeURI("?stepNum=3&jumioError=true")
    );
  }
}

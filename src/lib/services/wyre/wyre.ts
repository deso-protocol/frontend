import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { GlobalVarsService } from "../../../app/global-vars.service";
import { BackendApiService } from "../../../app/backend-api.service";

@Injectable({
  providedIn: "root",
})
export class WyreService {
  constructor(
    private httpClient: HttpClient,
    private globalVars: GlobalVarsService,
    private backendApi: BackendApiService
  ) {}

  makeWalletOrderReservation(btcAddress: string, sourceAmount: number): Observable<any> {
    return this.backendApi.GetWyreWalletOrderReservation(this.globalVars.localNode, btcAddress, sourceAmount);
  }

  makeWalletOrderQuotation(btcAddress: string, sourceAmount: number): Observable<any> {
    return this.backendApi.GetWyreWalletOrderQuotation(this.globalVars.localNode, btcAddress, sourceAmount);
  }
}

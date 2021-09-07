import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { BackendApiService } from './backend-api.service';
import { GlobalVarsService } from './global-vars.service';
import { IdentityService } from './identity.service';

@Injectable({
  providedIn: 'root'
})
export class CloutcastApiService {
  private ccToken: string = "";

  constructor(
    private httpClient: HttpClient,
    private backendApi: BackendApiService,
    private identityService: IdentityService,
    private globalVars: GlobalVarsService
  ) {

  }

  public async getCastCount(): Promise<number> {
    return 0;
  }

  public async getActive(): Promise<any> {
    try {
      let tToken = await this.getToken();

      let getActiveReq = await this.httpClient.get(`${environment.cloutcastUri}/api/promotion/get/all/Active.json`, {
        headers: {
          "Content-Type" : 'application/json',
          "Authorization" : `Bearer ${tToken}`
        }
      }).toPromise();

      // console.dir(getActiveReq);
      return getActiveReq;


    } catch (ex) {
      throw ex;
    }
  }

  public async getInbox(): Promise<any> {
    try {
      let tToken = await this.getToken();
      let getInboxReq = await this.httpClient.get(`${environment.cloutcastUri}/api/promotion/get/my.json`, {
        headers: {
          "Content-Type" : "application/json",
          "Authorization" : `Bearer ${tToken}`
        }
      }).toPromise();

      return getInboxReq;

    } catch (ex) {
      throw ex;
    }
  }

  public async getForMe(): Promise<any> {
    try {
      let tToken = await this.getToken();
      let followerCount = 0;
      let CoinPriceBitCloutNanos = 0;

      if (this.globalVars.loggedInUser.ProfileEntryResponse) {
        const getFollowers = await this.backendApi
        .GetFollows(
          this.globalVars.localNode,
          this.globalVars.loggedInUser.ProfileEntryResponse.Username,
          "" /* PublicKeyBase58Check */,
          true /* get followers */,
          "" /* GetEntriesFollowingUsername */,
          0 /* NumToFetch */
        )
        .toPromise();
        CoinPriceBitCloutNanos = this.globalVars.loggedInUser.ProfileEntryResponse.CoinPriceBitCloutNanos;
        followerCount = getFollowers.NumFollowers;

      }

      let getInboxReq = await this.httpClient.post(`${environment.cloutcastUri}/api/promotion/get/my.json`,{
        CoinPriceBitCloutNanos,
        followerCount
      },{
        headers: {
          "Content-Type" : "application/json",
          "Authorization" : `Bearer ${tToken}`
        }
      }).toPromise();

      return getInboxReq;

    } catch (ex) {
      throw ex;
    }
  }

  public async proveWork(id: number): Promise<any> {
    try {
      let tToken = await this.getToken();
      let proveWorkRequest = await this.httpClient.get(`${environment.cloutcastUri}/api/promotion/provework/${id}.json`, {
        headers: {
          'Content-Type' : 'application/json',
          "Authorization": `Bearer ${tToken}`
        },
        responseType: "arraybuffer"
      }).toPromise();
      let tt = String.fromCharCode.apply(null, new Uint8Array(proveWorkRequest));
      if (tt == 'OK') {
        return true;
      } else {
        console.warn(tt);
        throw new Error("Something happened while trying to prove CloutCast work.");
      }
    } catch (ex) {
      throw ex;
    }
  }

  private async getToken(): Promise<string> {
    let currentUser = this.globalVars.loggedInUser;

    if (typeof currentUser == 'undefined') {
      // 'protected service'
      throw new Error("auth needed");
    }

    if (this.ccToken !== "") {
      return this.ccToken;
    }


    const tokenReq = await this.identityService.jwt({
      ...this.identityService.identityServiceParamsForKey(currentUser.PublicKeyBase58Check)
    }).toPromise();

    let {approvalRequired = false, jwt = ""} = tokenReq;

    if (approvalRequired == true || jwt == "") {
      throw new Error("auth needed");
    }

    let ccTokenReq = await this.httpClient.post(`${environment.cloutcastUri}/api/auth/${currentUser.PublicKeyBase58Check}.json`, jwt, {
      headers: {
        'Content-Type': 'text/plain'
      },
      responseType: 'arraybuffer'
    }).toPromise();

    const tt = String.fromCharCode.apply(null, new Uint8Array(ccTokenReq));
    console.log(tt);

    this.ccToken = tt;
    return tt;

  }

}

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
  private ccTokenUser: string;

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
        CoinPriceBitCloutNanos = this.globalVars.loggedInUser.ProfileEntryResponse.CoinPriceDeSoNanos;
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

      // the angular httpClient doesn't give me access to response body if there's an error. Using fetch instead.
      // let proveWorkRequest = await this.httpClient.get(`${environment.cloutcastUri}/api/promotion/provework/${id}.json`, {
      //   headers: {
      //     'Content-Type' : 'application/json',
      //     "Authorization": `Bearer ${tToken}`
      //   },
      //   responseType: "arraybuffer"

      // }).toPromise();
      // let tt = String.fromCharCode.apply(null, new Uint8Array(proveWorkRequest));
      // if (tt == 'OK') {
      //   return true;
      // } else {
      //   console.warn(tt);
      //   throw new Error("Something happened while trying to prove CloutCast work.");
      // }

      let proveWorkRequest = await fetch(`${environment.cloutcastUri}/api/promotion/provework/${id}.json`, {
        headers: [
          ['Content-Type', 'application/json'],
          ['Authorization', `Bearer ${tToken}`],
          ['Accept', 'txt/plain']
        ]
      });
      let response = await proveWorkRequest.text();
      if (response == 'OK') {
        return true;
      } else {
        console.warn(response);
        throw new Error(response);
      }
    } catch (ex) {
      throw ex;
    }
  }

  public async getWallet(): Promise<any> {
    try {
      let tToken = await this.getToken();
      let getWalletReq = await this.httpClient.get(`${environment.cloutcastUri}/api/user/${this.ccTokenUser}/wallet.json`, {
        headers: {
          "Content-Type" : "application/json",
          "Authorization" : `Bearer ${tToken}`
        }
      }).toPromise();

      return getWalletReq;
    } catch (ex) {
      // throw ex;
      console.error(ex);
      return {data: {
        settled: 0,
        unSettled: 0
      }};
    }
  }

  public async createCast(castPayload: any): Promise<boolean> {
    try {
      let tToken = await this.getToken();
      await this.httpClient.post(`${environment.cloutcastUri}/api/promotion/create.ext.json`, castPayload, {
        headers: {
          "Content-Type" : 'application/json', 
          "Authorization" : `Bearer ${tToken}`
        }
      }).toPromise();

      return true;

    } catch (ex) {
      console.error(ex);
      throw ex;
    }
  }

  public async createWithdrawlRequest(amountNanos: any): Promise<boolean> {
    try {
      let tToken = await this.getToken();
      let withdrawReq = await this.httpClient.get(`${environment.cloutcastUri}/api/user/${this.ccTokenUser}/withdraw/${amountNanos}.json`, {
        headers: {
          "Content-Type" : "application/json",
          "Authorization" : `Bearer ${tToken}`
        },
        responseType: 'arraybuffer'
      }).toPromise();
      const tt = String.fromCharCode.apply(null, new Uint8Array(withdrawReq));
      if (tt == 'OK') {
        return true;
      } else {
        throw new Error(tt);
      }
    } catch (ex) {
      console.error(ex);
      throw ex;
    }
  }

  private async getToken(): Promise<string> {
    let currentUser = this.globalVars.loggedInUser;

    if (typeof currentUser == 'undefined') {
      // 'protected service'
      throw new Error("auth needed");
    }

    if (this.ccToken !== "" && this.ccTokenUser == currentUser.PublicKeyBase58Check) {
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
    // console.log(tt);

    this.ccToken = tt;
    this.ccTokenUser = currentUser.PublicKeyBase58Check;
    return tt;

  }

}

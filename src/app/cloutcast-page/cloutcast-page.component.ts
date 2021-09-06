import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { BackendApiService } from '../backend-api.service';
import { CloutcastApiService } from '../cloutcast-api.service';
import { GlobalVarsService } from '../global-vars.service';
import { IdentityService } from '../identity.service';

@Component({
  selector: 'app-cloutcast-page',
  templateUrl: './cloutcast-page.component.html',
  styleUrls: ['./cloutcast-page.component.scss']
})
export class CloutCastPageComponent implements OnInit {
  needsApproval: boolean;
  selectedTab: any;
  selectedCast: any; 
  allCasts: any;
  showCasts: any = [];
  showListLoading: boolean = false;
  showContentLoading: boolean = false;
  constructor(
    public globalVars: GlobalVarsService,
    private cloutcastApi: CloutcastApiService,
    private backendApi: BackendApiService,
    private identityService: IdentityService,
    private router: Router,
    private titleService: Title
  ) { 
    
  }
 
  async ngOnInit(): Promise<void> {
    try {
      console.log(history.state);
      let {
        selectedTab = "Inbox",
        selectedCast = null
      } = history.state
      this.showListLoading = true;
      this.selectedTab = selectedTab;
      if (selectedCast !== null) {
        this.selectedCast = selectedCast;
      }
      let getActive = await this.cloutcastApi.getActive();
      // let getInbox = await this.cloutcastApi.getInbox();
      // let getForMe = await this.cloutcastApi.getForMe();
    

      this.allCasts = getActive;
      // this.myCasts = getForMe;
      console.log({a: this.allCasts});
      // this.showCasts = this.allCasts;
      await this.ccTabClick(this.selectedTab);

    } catch (ex) {
      console.error(ex);  
      let {message = "Unspecified error"} = ex;
      if (message == "auth needed") {
        // reroute
        this.router.navigateByUrl("/", {replaceUrl: true});
      }
    } 
  }

  ccListItemClick(castID) {
    if (this.selectedCast != castID) {
      this.selectedCast = castID;
      this.router.navigateByUrl("/casts/" + castID, {
        state: {
          selectedTab: this.selectedTab,
          selectedCast: this.selectedCast
        }
      });
      console.log(castID);
    }
  }

  async ccTabClick(tabName) {
    this.selectedTab = tabName;
    if (Array.isArray(this.allCasts)) {
      if (this.allCasts.length > 0) {
        this.showCasts = [];
        this.showListLoading = true;
        try {
        switch(tabName) {
          case "Inbox":
            for (var cast of this.allCasts) {
              let isFound = false;
              if (Array.isArray(cast.AllowedUsers)) {
                if (cast.AllowedUsers.length) {
                  for (var aU of cast.AllowedUsers) {
                    if (aU == this.globalVars.loggedInUser.PublicKeyBase58Check) {
                      isFound = true;
                    }
                  }
                }
              }
              if (isFound == true) {
                this.showCasts.push(cast);
              }
            }
            break;
          case "For Me": 
            let coinPrice = 0;
            let followerCount = 0;

            if (this.globalVars.loggedInUser.ProfileEntryResponse !== null) {
              coinPrice = this.globalVars.loggedInUser.ProfileEntryResponse.CoinPriceBitCloutNanos;
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
              followerCount = getFollowers.NumFollowers;
            }
            for (var cast of this.allCasts) {
              let isFound = false;
              if (Array.isArray(cast.AllowedUsers)) {
                if (cast.AllowedUsers.length) {
                  for (var aU of cast.AllowedUsers) {
                    if (aU == this.globalVars.loggedInUser.PublicKeyBase58Check) {
                      isFound = true;
                    }
                  }
                }
              }
              if (isFound == true) {
                this.showCasts.push(cast);
              } else {
                if (cast.MinCoinPriceNanos <= coinPrice && cast.MinFollowerCount <= followerCount) {
                  this.showCasts.push(cast);
                }
              }
            }
            break;
          case "All": 
            this.showCasts = this.allCasts;
            break;
        }
        console.log(tabName);
        } catch (ex) {
          console.error(ex);
        } finally {
          this.showListLoading = false;
        }
      }
    }
  }
  stringifyItem(item:any): string {
    return JSON.stringify(item, null, 4);
  }

  bitcloutToUSD(clout:number): number {
    // console.log()
    
    let t = Math.round(100 * ((this.globalVars.ExchangeUSDCentsPerBitClout / 100) * clout)) / 100;
    console.log({t, clout, ex: this.globalVars.ExchangeUSDCentsPerBitClout / 100});
    return t;
  }

  rounded(num: number, roundTo: number = 1): number {
    return Math.round(roundTo * num) / roundTo; 
  }
  floored(num: number, flooredTo: number = 1): number {
    return Math.floor(flooredTo* num) / flooredTo; 
  }


}


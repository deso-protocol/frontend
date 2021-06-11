import { Component, Input, OnInit } from "@angular/core";
import { GlobalVarsService } from "../../global-vars.service";
import { ActivatedRoute, Router } from "@angular/router";
import { BackendApiService, DiamondsPost, PostEntryResponse } from "../../backend-api.service";
import { HttpClient } from "@angular/common/http";
import { PulseService } from "../../../lib/services/pulse/pulse-service";
import { BithuntService } from "../../../lib/services/bithunt/bithunt-service";
import { RightBarCreatorsComponent, RightBarTabOption } from "../../right-bar-creators/right-bar-creators.component";
import { Datasource, IAdapter, IDatasource } from "ngx-ui-scroll";

@Component({
  selector: "trends",
  templateUrl: "./trends.component.html",
  styleUrls: ["./trends.component.scss"],
})
export class TrendsComponent implements OnInit {
  RightBarCreatorsComponent = RightBarCreatorsComponent;

  tabs: string[] = Object.keys(RightBarCreatorsComponent.chartMap);
  activeTab: string;
  activeRightTabOption: RightBarTabOption;
  selectedOptionWidth: string;

  defaultTab: RightBarTabOption = RightBarCreatorsComponent.GAINERS;

  pagedRequests = {
    "-1": new Promise((resolve) => {
      resolve([]);
    }),
  };

  // stores a mapping of page number to public key to fetch
  // pagedKeys = {
  //   0: "",
  // };

  pagedRequestsByTab = {};
  // pagedKeysByTab = {};
  lastPageByTab = {};
  lastPage = null;
  loading = false;

  static PAGE_SIZE = 20;

  bithuntService: BithuntService;
  pulseService: PulseService;
  bithuntProjectsLoaded = false;

  constructor(
    public globalVars: GlobalVarsService,
    private route: ActivatedRoute,
    private _router: Router,
    private backendApi: BackendApiService,
    private httpClient: HttpClient
  ) {
    this.tabs.forEach((tab) => {
      this.pagedRequestsByTab[tab] = {
        "-1": new Promise((resolve) => {
          resolve([]);
        }),
      };
      this.lastPageByTab[tab] = null;
      // this.pagedKeysByTab[tab] = {
      //   0: "",
      // };
    });
    this.route.queryParams.subscribe((params) => {
      this.activeTab = params.tab && params.tab in this.tabs ? params.tab : this.tabs[0];
      this.pagedRequests = this.pagedRequestsByTab[this.activeTab];
      this.lastPage = this.lastPageByTab[this.activeTab];
      this.selectTab();
      // this.pagedKeys = this.pagedKeys[this.activeTab];
    });
    this.bithuntService = new BithuntService(this.httpClient, this.backendApi, this.globalVars);
    this.pulseService = new PulseService(this.httpClient, this.backendApi, this.globalVars);
  }

  selectTab() {
    const rightTabOption = RightBarCreatorsComponent.chartMap[this.activeTab];
    this.activeRightTabOption = rightTabOption;
    this.selectedOptionWidth = rightTabOption.width + "px";
    this.pagedRequests = this.pagedRequestsByTab[this.activeTab];
    // this.loading = true;
    this.datasource.adapter.reset().then(() => (this.loading = false));
  }

  ngOnInit() {
    if (this.globalVars.allCommunityProjectsLeaderboard.length === 0) {
      this.bithuntService
        .getCommunityProjectsLeaderboard()
        .subscribe((res) => {
          this.globalVars.allCommunityProjectsLeaderboard = res;
          this.globalVars.topCommunityProjectsLeaderboard = this.globalVars.allCommunityProjectsLeaderboard.slice(
            0,
            10
          );
        })
        .add(() => (this.bithuntProjectsLoaded = true));
    } else {
      this.bithuntProjectsLoaded = true;
    }
    // if (!this.activeTab) {
    //   this.activeTab = this.defaultTab.name;
    // }
    // if (this.globalVars.rightBarLeaderboard.length > 0) {
    //   return;
    // }
    //
    // const pulseService = new PulseService(this.httpClient, this.backendApi, this.globalVars);
    //
    // if (this.globalVars.topGainerLeaderboard.length === 0) {
    //   pulseService.getBitCloutLockedLeaderboard().subscribe((res) => (this.globalVars.topGainerLeaderboard = res));
    // }
    // if (this.globalVars.topDiamondedLeaderboard.length === 0) {
    //   pulseService.getDiamondsReceivedLeaderboard().subscribe((res) => (this.globalVars.topDiamondedLeaderboard = res));
    // }
    //
    // const bithuntService = new BithuntService(this.httpClient, this.backendApi, this.globalVars);
    // if (this.globalVars.topCommunityProjectsLeaderboard.length === 0) {
    //   bithuntService.getCommunityProjectsLeaderboard().subscribe((res) => {
    //     this.globalVars.allCommunityProjectsLeaderboard = res;
    //     this.globalVars.topCommunityProjectsLeaderboard = this.globalVars.allCommunityProjectsLeaderboard.slice(0, 10);
    //   });
    // }

    // if (this.globalVars.topCreatorsAllTimeLeaderboard.length === 0) {
    //   let readerPubKey = "";
    //   if (this.globalVars.loggedInUser) {
    //     readerPubKey = this.globalVars.loggedInUser.PublicKeyBase58Check;
    //   }
    //   this.backendApi
    //     .GetProfiles(
    //       this.globalVars.localNode,
    //       null /*PublicKeyBase58Check*/,
    //       null /*Username*/,
    //       null /*UsernamePrefix*/,
    //       null /*Description*/,
    //       BackendApiService.GET_PROFILES_ORDER_BY_INFLUENCER_COIN_PRICE /*Order by*/,
    //       10 /*NumEntriesToReturn*/,
    //       readerPubKey /*ReaderPublicKeyBase58Check*/,
    //       "leaderboard" /*ModerationType*/,
    //       false /*FetchUsersThatHODL*/,
    //       false /*AddGlobalFeedBool*/
    //     )
    //     .subscribe(
    //       (response) => {
    //         this.globalVars.topCreatorsAllTimeLeaderboard = response.ProfilesFound.slice(
    //           0,
    //           TrendsComponent.MAX_PROFILE_ENTRIES
    //         ).map((profile) => {
    //           return {
    //             Profile: profile,
    //           };
    //         });
    //       },
    //       (err) => {
    //         console.error(err);
    //         this.globalVars._alertError("Error loading profiles: " + this.backendApi.stringifyError(err));
    //       }
    //     );
    // }
  }

  datasource: IDatasource<IAdapter<any>> = this.getDatasource();
  getDatasource() {
    return new Datasource<IAdapter<any>>({
      get: (index, count, success) => {
        const startIdx = Math.max(index, 0);
        const endIdx = index + count - 1;
        if (startIdx > endIdx) {
          success([]);
          return;
        }
        const startPage = Math.floor(startIdx / TrendsComponent.PAGE_SIZE);
        const endPage = Math.floor(endIdx / TrendsComponent.PAGE_SIZE);

        const pageRequests: any[] = [];
        for (let i = startPage; i <= endPage; i++) {
          const existingRequest = this.pagedRequests[i];
          if (existingRequest) {
            pageRequests.push(existingRequest);
          } else {
            const newRequest = this.pagedRequests[i - 1].then((_) => {
              return this.getPage(i);
            });
            this.pagedRequests[i] = newRequest;
            pageRequests.push(newRequest);
          }
        }

        return Promise.all(pageRequests).then((pageResults) => {
          pageResults = pageResults.reduce((acc, result) => [...acc, ...result], []);
          const start = startIdx - startPage * TrendsComponent.PAGE_SIZE;
          const end = start + endIdx - startIdx + 1;
          return pageResults.slice(start, end);
        });
      },
      settings: {
        startIndex: 0,
        minIndex: 0,
        bufferSize: 10,
        windowViewport: true,
      },
    });
  }

  getPage(page: number) {
    if (this.activeTab === RightBarCreatorsComponent.GAINERS.name) {
      console.log("get gainers");
      return this.pulseService
        .getBitCloutLockedPage(page, TrendsComponent.PAGE_SIZE)
        .toPromise()
        .then(
          (res) => {
            // this.pagedKeys[page + 1] = ;
            if (res.length < TrendsComponent.PAGE_SIZE) {
              this.lastPageByTab[this.activeTab] = page;
              this.lastPage = page;
            }
            return res;
          },
          (err) => {
            console.error(this.backendApi.stringifyError(err));
          }
        );
    }
    if (this.activeTab === RightBarCreatorsComponent.DIAMONDS.name) {
      console.log("get diamonds");
      return this.pulseService
        .getDiamondsReceivedPage(page, TrendsComponent.PAGE_SIZE)
        .toPromise()
        .then(
          (res) => {
            // this.pagedKeys[page + 1] = ;
            if (res.length < TrendsComponent.PAGE_SIZE) {
              this.lastPageByTab[this.activeTab] = page;
              this.lastPage = page;
            }
            return res;
          },
          (err) => {
            console.error(this.backendApi.stringifyError(err));
          }
        );
    }
    if (this.activeTab === RightBarCreatorsComponent.COMMUNITY.name) {
      console.log("community projects");
      const start = TrendsComponent.PAGE_SIZE * page;
      let end = start + TrendsComponent.PAGE_SIZE;
      if (end > this.globalVars.allCommunityProjectsLeaderboard.length) {
        end = this.globalVars.allCommunityProjectsLeaderboard.length;
      }
      return this.globalVars.allCommunityProjectsLeaderboard.slice(TrendsComponent.PAGE_SIZE * page, end);
    }
  }

  _tabClicked(event: string) {
    this.activeTab = event;
    this.pagedRequests = this.pagedRequestsByTab[this.activeTab];
    this.loading = true;
    this.datasource.adapter.reset(this.getDatasource()).then(() => (this.loading = false));
    console.log(event);
  }
}

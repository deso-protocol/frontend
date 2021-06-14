import { Component, OnInit } from "@angular/core";
import { GlobalVarsService } from "../../global-vars.service";
import { ActivatedRoute, Router } from "@angular/router";
import { BackendApiService } from "../../backend-api.service";
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

  tabs: string[] = Object.keys(RightBarCreatorsComponent.chartMap).filter(
    (tab: string) => tab !== RightBarCreatorsComponent.ALL_TIME.name
  );
  activeTab: string = RightBarCreatorsComponent.GAINERS.name;
  activeRightTabOption: RightBarTabOption;
  selectedOptionWidth: string;

  pagedRequests = {
    "-1": new Promise((resolve) => {
      resolve([]);
    }),
  };

  pagedRequestsByTab = {};
  lastPageByTab = {};
  lastPage = null;
  loading = true;
  loadingNextPage = false;

  static PAGE_SIZE = 20;

  bithuntService: BithuntService;
  pulseService: PulseService;

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
    });
    this.bithuntService = new BithuntService(this.httpClient, this.backendApi, this.globalVars);
    this.pulseService = new PulseService(this.httpClient, this.backendApi, this.globalVars);
    this.selectTab();
  }

  selectTab() {
    const rightTabOption = RightBarCreatorsComponent.chartMap[this.activeTab];
    this.activeRightTabOption = rightTabOption;
    this.selectedOptionWidth = rightTabOption.width + "px";
    this.pagedRequests = this.pagedRequestsByTab[this.activeTab];
    this.loading = true;
    this.datasource.adapter.reset().then(() => (this.loading = false));
  }

  ngOnInit() {
    this.globalVars.updateLeaderboard(true);
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
        bufferSize: 5,
        padding: 0.25,
        windowViewport: true,
        infinite: true,
      },
    });
  }

  getPage(page: number) {
    if (this.activeTab === RightBarCreatorsComponent.GAINERS.name) {
      this.loadingNextPage = page !== 0;
      return this.pulseService
        .getBitCloutLockedPage(page + 1, TrendsComponent.PAGE_SIZE, true)
        .toPromise()
        .then(
          (res) => {
            if (res.length < TrendsComponent.PAGE_SIZE) {
              this.lastPageByTab[this.activeTab] = page;
              this.lastPage = page;
            }
            this.loadingNextPage = false;
            return res;
          },
          (err) => {
            console.error(this.backendApi.stringifyError(err));
          }
        );
    }
    if (this.activeTab === RightBarCreatorsComponent.DIAMONDS.name) {
      this.loadingNextPage = page !== 0;
      return this.pulseService
        .getDiamondsReceivedPage(page + 1, TrendsComponent.PAGE_SIZE, true)
        .toPromise()
        .then(
          (res) => {
            if (res.length < TrendsComponent.PAGE_SIZE) {
              this.lastPageByTab[this.activeTab] = page;
              this.lastPage = page;
            }
            this.loadingNextPage = true;
            return res;
          },
          (err) => {
            console.error(this.backendApi.stringifyError(err));
          }
        );
    }
    if (this.activeTab === RightBarCreatorsComponent.COMMUNITY.name) {
      const start = TrendsComponent.PAGE_SIZE * page;
      let end = start + TrendsComponent.PAGE_SIZE;
      if (end > this.globalVars.allCommunityProjectsLeaderboard.length) {
        end = this.globalVars.allCommunityProjectsLeaderboard.length;
      }
      return this.globalVars.allCommunityProjectsLeaderboard.slice(TrendsComponent.PAGE_SIZE * page, end);
    }
  }
}

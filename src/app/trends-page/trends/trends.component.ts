import { Component, OnInit } from "@angular/core";
import { GlobalVarsService } from "../../global-vars.service";
import { BackendApiService } from "../../backend-api.service";
import { HttpClient } from "@angular/common/http";
import { PulseService } from "../../../lib/services/pulse/pulse-service";
import { BithuntService } from "../../../lib/services/bithunt/bithunt-service";
import { RightBarCreatorsComponent, RightBarTabOption } from "../../right-bar-creators/right-bar-creators.component";
import { IAdapter, IDatasource } from "ngx-ui-scroll";
import { InfiniteScroller } from "src/app/infinite-scroller";

@Component({
  selector: "trends",
  templateUrl: "./trends.component.html",
  styleUrls: ["./trends.component.scss"],
})
export class TrendsComponent implements OnInit {
  static BUFFER_SIZE = 5;
  static PADDING = 0.25;
  static PAGE_SIZE = 20;
  static WINDOW_VIEWPORT = true;

  RightBarCreatorsComponent = RightBarCreatorsComponent;

  tabs: string[] = Object.keys(RightBarCreatorsComponent.chartMap).filter(
    (tab: string) => tab !== RightBarCreatorsComponent.ALL_TIME.name
  );
  activeTab: string = RightBarCreatorsComponent.GAINERS.name;
  activeRightTabOption: RightBarTabOption;
  selectedOptionWidth: string;

  pagedRequestsByTab = {};
  lastPageByTab = {};
  lastPage = null;
  loading = true;
  loadingNextPage = false;

  bithuntService: BithuntService;
  pulseService: PulseService;

  constructor(
    public globalVars: GlobalVarsService,
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
    this.loading = true;
    this.datasource.adapter.reset().then(() => (this.loading = false));
  }

  ngOnInit() {
    this.globalVars.updateLeaderboard(true);
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

  infiniteScroller: InfiniteScroller = new InfiniteScroller(
    TrendsComponent.PAGE_SIZE,
    this.getPage.bind(this),
    TrendsComponent.WINDOW_VIEWPORT,
    TrendsComponent.BUFFER_SIZE,
    TrendsComponent.PADDING
  );
  datasource: IDatasource<IAdapter<any>> = this.infiniteScroller.getDatasource();
}

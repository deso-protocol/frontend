import { Component, OnInit, Input } from "@angular/core";
import { GlobalVarsService } from "../../global-vars.service";
import { BackendApiService, ProfileEntryResponse } from "../../backend-api.service";
import { Datasource, IAdapter, IDatasource } from "ngx-ui-scroll";
import { Subscription } from "rxjs";

@Component({
  selector: "creator-diamonds",
  templateUrl: "./creator-diamonds.component.html",
  styleUrls: ["./creator-diamonds.component.scss"],
})
export class CreatorDiamondsComponent implements OnInit {
  static GIVEN = "Given";
  static RECEIVED = "Received";

  @Input() profile: ProfileEntryResponse;
  isLoading: boolean = false;
  globalVars: GlobalVarsService;
  diamondSummaryList = [];
  totalDiamonds = 0;
  showDiamondsGiven = false;
  activeTab = CreatorDiamondsComponent.RECEIVED;
  CreatorDiamondsComponent = CreatorDiamondsComponent;
  datasource: IDatasource<IAdapter<any>> = this.getDatasource();
  loadingNewSelection = false;

  constructor(private _globalVars: GlobalVarsService, private backendApi: BackendApiService) {
    this.globalVars = _globalVars;
  }

  ngOnInit(): void {
    this.fetchDiamonds();
  }

  fetchDiamonds(): Subscription {
    this.isLoading = true;
    return this.backendApi
      .GetDiamondsForPublicKey(this.globalVars.localNode, this.profile.PublicKeyBase58Check, this.showDiamondsGiven)
      .subscribe(
        (res) => {
          this.diamondSummaryList = res.DiamondSenderSummaryResponses;
          if (this.diamondSummaryList.length) {
            this.diamondSummaryList.push({ totalRow: true });
          }
          this.totalDiamonds = res.TotalDiamonds;
        },
        (err) => {
          this.globalVars._alertError(this.backendApi.parseProfileError(err));
        }
      )
      .add(() => {
        this.isLoading = false;
      });
  }
  counter(num: number) {
    return Array(num);
  }

  onChange(event): void {
    if (this.activeTab !== event) {
      this.activeTab = event;
      this.showDiamondsGiven = this.activeTab === CreatorDiamondsComponent.GIVEN;
      this.loadingNewSelection = true;
      this.fetchDiamonds().add(() => this.datasource.adapter.reset().then(() => (this.loadingNewSelection = false)));
    }
  }

  valueOfAllDiamonds(): number {
    let total = 0;
    this.diamondSummaryList.map((diamondSummary) => {
      for (const diamondLevel in diamondSummary.DiamondLevelMap) {
        if (diamondLevel in this.globalVars.diamondLevelMap) {
          total += this.globalVars.diamondLevelMap[diamondLevel] * diamondSummary.DiamondLevelMap[diamondLevel];
        }
      }
    });
    return this.globalVars.nanosToUSDNumber(total);
  }

  getDatasource(): IDatasource<IAdapter<any>> {
    return new Datasource<IAdapter>({
      get: (index, count, success) => {
        const startIdx = Math.max(index, 0);
        const endIdx = index + count - 1;
        if (startIdx > endIdx) {
          success([]);
          return;
        }
        if (endIdx + 1 > this.diamondSummaryList.length) {
          success(this.diamondSummaryList.slice(startIdx, this.diamondSummaryList.length));
          return;
        }
        success(this.diamondSummaryList.slice(startIdx, endIdx + 1));
        return;
      },
      settings: {
        startIndex: 0,
        minIndex: 0,
        bufferSize: 5,
        padding: 0.5,
        windowViewport: true,
        infinite: true,
      },
    });
  }
}

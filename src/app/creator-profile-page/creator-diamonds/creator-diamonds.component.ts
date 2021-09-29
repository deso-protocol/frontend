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
  totalAnonDiamonds = 0;
  totalAnonDiamondValue = 0;
  highestAnonDiamondLevel = 0;

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

          // Calculate the number of diamonds that have come from
          // anonymous sources, and reformat the list to remove the
          // anonymous entries.
          let diamondListWithoutAnon = [];
          for (let ii = 0; ii < this.diamondSummaryList?.length; ii++) {
            if (
              !this.diamondSummaryList[ii].ProfileEntryResponse &&
              this.diamondSummaryList[ii].SenderPublicKeyBase58Check
            ) {
              this.totalAnonDiamonds += this.diamondSummaryList[ii].TotalDiamonds;
              this.totalAnonDiamondValue += this.sumDiamondValueForUser(this.diamondSummaryList[ii]);

              if (this.diamondSummaryList[ii].HighestDiamondLevel > this.highestAnonDiamondLevel) {
                this.highestAnonDiamondLevel = this.diamondSummaryList[ii].HighestDiamondLevel;
              }
            } else {
              diamondListWithoutAnon.push(this.diamondSummaryList[ii]);
            }
          }
          this.diamondSummaryList = diamondListWithoutAnon;

          if (this.totalAnonDiamonds) {
            this.diamondSummaryList.push({ anonDiamondsRow: true });
          }

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

  sumDiamondValueForUser(diamondSummary: any): number {
    let total = 0;
    for (const diamondLevel in diamondSummary.DiamondLevelMap) {
      if (diamondLevel in this.globalVars.diamondLevelMap) {
        total += this.globalVars.diamondLevelMap[diamondLevel] * diamondSummary.DiamondLevelMap[diamondLevel];
      }
    }
    return total;
  }

  valueOfAllDiamonds(): number {
    let total = 0;
    this.diamondSummaryList.map((diamondSummary) => {
      total += this.sumDiamondValueForUser(diamondSummary);
    });
    // Add the total amount from anon diamonds
    total += this.totalAnonDiamondValue;
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

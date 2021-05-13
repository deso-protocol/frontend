import { Component, OnInit, Input } from "@angular/core";
import { GlobalVarsService } from "../../global-vars.service";
import {
  BackendApiService,
  ProfileEntryResponse,
  BalanceEntryResponse,
  PostEntryResponse,
} from "../../backend-api.service";
import * as _ from "lodash";

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

  constructor(private _globalVars: GlobalVarsService, private backendApi: BackendApiService) {
    this.globalVars = _globalVars;
  }

  ngOnInit(): void {
    this.fetchDiamonds();
  }

  fetchDiamonds(): void {
    this.isLoading = true;
    this.backendApi
      .GetDiamondsForPublicKey(this.globalVars.localNode, this.profile.PublicKeyBase58Check, this.showDiamondsGiven)
      .subscribe(
        (res) => {
          this.diamondSummaryList = res.DiamondSenderSummaryResponses;
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

  getNoDiamondsMessage() {
    return this.showDiamondsGiven
      ? `@${this.profile.Username} has not given any diamonds yet.`
      : `No has sent @${this.profile.Username} a diamond yet.`;
  }

  getDiamondPostsLink(row): string[] {
    return [
      '/' + this.globalVars.RouteNames.USER_PREFIX,
      this.showDiamondsGiven ? row.ProfileEntryResponse.Username : this.profile.Username,
      this.globalVars.RouteNames.DIAMONDS,
      this.showDiamondsGiven ? this.profile.Username : row.ProfileEntryResponse.Username
    ];
  }

  onChange(event): void {
    if (this.activeTab !== event) {
      this.activeTab = event;
      this.showDiamondsGiven = this.activeTab === CreatorDiamondsComponent.GIVEN;
      this.fetchDiamonds();
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
}

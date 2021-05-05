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
  @Input() profile: ProfileEntryResponse;
  isLoading: boolean = false;
  globalVars: GlobalVarsService;
  diamondSummaryList = [];
  totalDiamonds = 0;

  constructor(private _globalVars: GlobalVarsService, private backendApi: BackendApiService) {
    this.globalVars = _globalVars;
  }

  ngOnInit(): void {
    this.isLoading = true;
    this.backendApi
      .GetDiamondsForPublicKey(this.globalVars.localNode, this.profile.PublicKeyBase58Check)
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

  usernameTruncationLength(): number {
    return this.globalVars.isMobile() ? 10 : 12;
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

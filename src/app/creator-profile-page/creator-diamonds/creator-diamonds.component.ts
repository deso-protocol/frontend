import { Component, OnInit, Input } from "@angular/core";
import { GlobalVarsService } from "../../global-vars.service";
import { BackendApiService, ProfileEntryResponse  } from "../../backend-api.service";

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

  usernameTruncationLength(): number {
    return this.globalVars.isMobile() ? 10 : 12;
  }

  _handleTabClick(tabName) {
    if (tabName !== this.activeTab) {
      this.activeTab = tabName;
      this.showDiamondsGiven = tabName === CreatorDiamondsComponent.GIVEN;
      this.fetchDiamonds();
    }
  }

  getNoDiamondsMessage() {
    return this.showDiamondsGiven
      ? `@${this.profile.Username} has not given any diamonds yet.`
      : `No has sent @${this.profile.Username} a diamond yet.`;
  }
}

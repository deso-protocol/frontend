import { Component, OnInit, Input } from '@angular/core';
import { GlobalVarsService } from "../../global-vars.service";
import { BackendApiService, ProfileEntryResponse, BalanceEntryResponse } from "../../backend-api.service";

@Component({
  selector: 'creator-diamonds',
  templateUrl: './creator-diamonds.component.html',
  styleUrls: ['./creator-diamonds.component.scss']
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
}

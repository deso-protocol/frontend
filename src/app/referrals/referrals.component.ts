import { Component, OnInit } from '@angular/core';
import { GlobalVarsService } from "../global-vars.service";

@Component({
  selector: 'referrals',
  templateUrl: './referrals.component.html',
})
export class ReferralsComponent implements OnInit {
  globalVars: GlobalVarsService;
  linkCopied = [];

  constructor(private _globalVars: GlobalVarsService) {
    this.globalVars = _globalVars;
  }

  ngOnInit(): void {
  }

  _copyLink(linkNum: number) {
    this.globalVars._copyText(
      this.globalVars.getLinkForReferralHash(
        this.globalVars.loggedInUser.ReferralInfoResponses[linkNum].Info.ReferralHashBase58)
    );

    this.linkCopied[linkNum] = true;
    setTimeout(() => {
      this.linkCopied[linkNum] = false;
    }, 500);
  }

}

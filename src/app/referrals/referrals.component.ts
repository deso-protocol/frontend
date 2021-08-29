import { Component, OnInit } from '@angular/core';
import { GlobalVarsService } from "../global-vars.service";

@Component({
  selector: 'referrals',
  templateUrl: './referrals.component.html',
})
export class ReferralsComponent implements OnInit {
  globalVars: GlobalVarsService;

  constructor(private _globalVars: GlobalVarsService) {
    this.globalVars = _globalVars;
  }

  ngOnInit(): void {
  }

}

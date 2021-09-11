import { Component, Input, OnInit } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { ProfileEntryResponse } from '../backend-api.service';
import { CloutcastApiService } from '../cloutcast-api.service';
import { GlobalVarsService } from "../global-vars.service";

@Component({
  selector: 'app-cloutcast-modal',
  templateUrl: './cloutcast-modal.component.html',
  styleUrls: ['./cloutcast-modal.component.scss']
})
export class CloutCastModalComponent implements OnInit {
  @Input() postHashHex: string;
  @Input() nanosAvailableInCloutCastWallet: string;

  loading = false;
  errorLoading = false;
  startingSearchText = "";
  selectedCreators: Array<ProfileEntryResponse>;

  criteriaAmountEngagements: number = 0;
  criteriaMinFollowers: number = 50;
  criteriaMinCoinPrice: number = 50;
  useCriteria: boolean = false;

  castAmountUSD: string = "0";
  castAmountUSDFloat: number = 0;
  castAmountCLOUT: number = 0;
  castDurationHours: number  = 48;
  creatingCast = false;
  castType: any;

  userCastBalances: any;

  constructor(
    public bsModalRef: BsModalRef,
    public globalVars: GlobalVarsService,
    private cloutcastApi: CloutcastApiService
  ) { }

  async ngOnInit(): Promise<void> {
    // this.loading = true;
    this.selectedCreators = [];
    this.castType = 1;
    try {
      let t = await this.cloutcastApi.getWallet();
      console.log(t);
      this.userCastBalances = t;
      // this.userCastBalances = JSON.stringify(t);
    } catch (ex) {
      console.error(ex);
    }

  }


  _handleCreatorSelectedInSearch(creator: ProfileEntryResponse) {
    // console.log(creator);
    this.selectedCreators.push(creator);
  }

  updateCastAmountUSD(v: any) {
    this.castAmountUSD = this.globalVars.nanosToUSDNumber(v * 1e9).toFixed(2);
    this.castAmountUSDFloat = this.globalVars.nanosToUSDNumber(v * 1e9)
  }

  updateCastAmountCLOUT(v: any) {
    this.castAmountCLOUT = Math.trunc(this.globalVars.usdToNanosNumber(v)) / 1e9;
    this.castAmountUSDFloat = parseFloat(v);
  }
  updateCastAmountHours(v: any) {
    if (v > 168) {
      this.castDurationHours = 168;
      return false;
    } else {
      this.castDurationHours = v;
    }
    // this.castDurationHours = v > 168 ? 168 : v;
  }

  removeCreator(i: number) {
    this.selectedCreators.splice(i);
  }

  stopEvent(event: any) {
    event.stopPropagation();
    event.preventDefault();
  }

  criteriaSwitch(switchOption: boolean) {
    if (!!switchOption) {
      this.useCriteria = true;
      this.selectedCreators = [];
    } else {
      this.useCriteria = false;
      this.criteriaAmountEngagements = 0;
      this.criteriaMinCoinPrice = 0;
    }
  }

  async createCast(): Promise<void> {
    let outPayload = {

    }
    if (this.useCriteria) {

    }
  }

}

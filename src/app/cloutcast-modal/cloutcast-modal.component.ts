import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { SwalHelper } from 'src/lib/helpers/swal-helper';
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
  castAmountHours: number  = 48;
  creatingCast = false;
  castType: any;
  castError: string;

  userCastBalances: any;

  constructor(
    public bsModalRef: BsModalRef,
    public globalVars: GlobalVarsService,
    private cloutcastApi: CloutcastApiService,
    private router: Router
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
      this.castAmountHours = 168;
      return false;
    } else {
      this.castAmountHours = v;
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
  bitcloutToUSD(clout:number): number {
    let t = Math.round(100 * ((this.globalVars.ExchangeUSDCentsPerBitClout / 100) * clout)) / 100;
    // console.log({t, clout, ex: this.globalVars.ExchangeUSDCentsPerBitClout / 100});
    return t;
  }

  async createCast(): Promise<void> {
    try {
      this.creatingCast = true;
      let action = 
        parseInt(this.castType) == 0 ? 
          "Comment" : parseInt(this.castType) == 1 ? "Quote" : "Reclout";
      let engagements = this.useCriteria == true ? this.criteriaAmountEngagements : this.selectedCreators.length;
      let criteria = this.useCriteria == true ? {
        minCoinPrice: this.criteriaMinCoinPrice * 1e9,
        minFollowerCount: this.criteriaMinFollowers
      } : {
        allowedUsers: this.selectedCreators.map(v => v.PublicKeyBase58Check)
      };
      
      let outPayload: any = {
        header: {
          engagements,
          duration: this.castAmountHours * 60,
          rate: this.castAmountCLOUT * 1e9,
          fee: 1,
          bitCloutToUsdRate: this.bitcloutToUSD(1)
        },
        criteria,
        target: {
          action,
          hex: this.postHashHex
        }
      }

      await this.cloutcastApi.createCast(outPayload);

      this.globalVars._alertSuccess("Your cast has been created.", "Success!");

      this.bsModalRef.hide();
    } catch (ex) {
      console.error(ex);
      let errorMessage = ex.message || "Unspecified Error."
      this.castError = errorMessage;
    } finally {
      this.creatingCast = false;
    }

  }
  async doDeposit() {
    let res = await SwalHelper.fire({
      target: this.globalVars.getTargetComponentSelector(),
      title: "Heads Up!",
      html: `Deposits are handled by sending $CLOUT to our broker wallet. Deposits take 15-20 minutes to confirm. Click 'OK' to be sent to the send $CLOUT page.`,
      showCancelButton: true,
      showConfirmButton: true,
      customClass: {
        confirmButton: "btn btn-light",
        cancelButton: "btn btn-light no",
      },
      reverseButtons: true,
    });
    if (res.isConfirmed == true) {
      await this.router.navigateByUrl("/send-bitclout?public_key=BC1YLiVetFBCYjuHZY5MPwBSY7oTrzpy18kCdUnTjuMrdx9A22xf5DE");
      this.bsModalRef.hide();
    }
    console.log(res);
  }

}

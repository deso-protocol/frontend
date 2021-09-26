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
  nanosAvailableInCloutCastWallet: number;

  loading = false;
  errorLoading = false;
  startingSearchText = "";
  selectedCreators: Array<ProfileEntryResponse>;

  criteriaAmountEngagements: number = 0;
  criteriaMinFollowers: number = 50;
  criteriaMinCoinPriceUSD: number;
  criteriaMinCoinPriceCLOUT: number;
  useCriteria: boolean = false;

  castAmountUSD: string = "0";
  castAmountUSDFloat: number = 0;
  castAmountCLOUT: number = 0;
  castAmountHours: number  = 48;
  creatingCast = false;
  castType: any;
  castError: string;

  // userCastBalances: any;

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
      // console.log(t);
      // this.userCastBalances = t;
      let {data = {settled: 0}} = t;
      this.nanosAvailableInCloutCastWallet = data.settled;
      
      if (data.settled <= 0) {
        let res = await SwalHelper.fire({
          target: this.globalVars.getTargetComponentSelector(),
          title: "Not Enough $CLOUT in CloutCast wallet!",
          html: `Before creating casts, please send $CLOUT to the CloutCast wallet public key, and wait 15-20 minutes. Click 'OK' to be sent to the 'Send $CLOUT' page.`,
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
      }
      // this.userCastBalances = JSON.stringify(t);
    } catch (ex) {
      console.error(ex);
    }

    // let coll = 
    // Array.from(document.querySelectorAll<HTMLElement>('[tip]')).forEach(el => {
    //   let tip = document.createElement('div');
    //   tip.classList.add('cctooltip');
    //   tip.innerText = el.getAttribute('tip');
    //   let delay = el.getAttribute('tip-delay');
    //   if (delay) {
    //     tip.style.transitionDelay = delay + 's';
    //   }
    //   tip.style.transform =
    //     'translate(' +
    //       (el.hasAttribute('tip-left') ? 'calc(-100% - 5px)' : '15px') + ', ' +
    //       (el.hasAttribute('tip-top') ? '-100%' : '0') +
    //     ')';
    //   el.appendChild(tip);
    //   el.onmousemove = e => {
    //     tip.style.left = e.clientX + 'px'
    //     tip.style.top = e.clientY + 'px';
    //   };
    // });

  }


  async _handleCreatorSelectedInSearch(creator: ProfileEntryResponse) {
    // console.log(creator);
    let isFound = false;
    for (var ctor of this.selectedCreators) {
      if (ctor.PublicKeyBase58Check == creator.PublicKeyBase58Check) {
        isFound = true;
      }
    }

    if (isFound == false) {
      this.criteriaAmountEngagements++;
      this.selectedCreators.push(creator);
    }
    
  }

  floored(num: number, flooredTo: number = 1): number {
    return Math.floor(flooredTo* num) / flooredTo;
  }

  updateCastAmountUSD(v: any) {
    this.castAmountUSD = this.globalVars.nanosToUSDNumber(v * 1e9).toFixed(2);
    this.castAmountUSDFloat = this.globalVars.nanosToUSDNumber(v * 1e9)
  }

  updateCastAmountCLOUT(v: any) {
    this.castAmountCLOUT = Math.trunc(this.globalVars.usdToNanosNumber(v)) / 1e9;
    this.castAmountUSDFloat = parseFloat(v);
  }


  updateCoinAmountUSD(v: any) {
    this.criteriaMinCoinPriceCLOUT = this.globalVars.usdToNanosNumber(v) / 1e9;
    // this.criteriaMinCoinPriceCLOUT = v / 1e9;
    // this.castAmountUSD = this.globalVars.nanosToUSDNumber(v * 1e9).toFixed(2);
    // this.castAmountUSDFloat = this.globalVars.nanosToUSDNumber(v * 1e9)
  }

  updateCoinAmountCLOUT(v: any) {
    // this.criteriaMinCoinPriceCLOUT = Math.trunc(v * 1e9);
    this.criteriaMinCoinPriceUSD = this.globalVars.nanosToUSDNumber(v * 1e9)
    // this.castAmountUSDFloat = parseFloat(v);
  }

  showFixed(v:number, fixTo = 2) {
    return v.toFixed(fixTo);
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
    this.selectedCreators.splice(i, 1);
    this.criteriaAmountEngagements--;

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
      // this.criteriaAmountEngagements = 0;
      this.criteriaMinCoinPriceCLOUT = 0;
      this.criteriaMinCoinPriceUSD = 0;
    }
  }
  bitcloutToUSD(clout:number): number {
    let t = Math.round(100 * ((this.globalVars.ExchangeUSDCentsPerDeSo / 100) * clout)) / 100;
    return t;
  }

  async createCast(): Promise<void> {
    try {
      this.creatingCast = true;
      let action = 
        parseInt(this.castType) == 0 ? 
          "Comment" : parseInt(this.castType) == 1 ? "Quote" : "Reclout";
      let engagements = this.criteriaAmountEngagements;
      let criteria = this.useCriteria == true ? {
        minCoinPrice: this.criteriaMinCoinPriceCLOUT * 1e9,
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

      if (this.nanosAvailableInCloutCastWallet < (this.criteriaAmountEngagements * this.castAmountCLOUT) * 1.12) {
        let res = await SwalHelper.fire({
          target: this.globalVars.getTargetComponentSelector(),
          title: "Not Enough CLOUT in CloutCast wallet!",
          html: `There isn't enough $CLOUT available in your CloutCast wallet. Before creating casts, please send $CLOUT to the CloutCast wallet public key, and wait 15-20 minutes. Click 'OK' to be sent to the 'Send $CLOUT' page.`,
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
      } else {
        if (engagements == 0 || ((criteria.minCoinPrice <= 0 && criteria.minFollowerCount <= 0) && criteria.allowedUsers.length <= 0) ) {
          throw new Error("Please enter values greater than 0");
        }
        if (this.globalVars.nanosToUSDNumber(outPayload.header.rate) <= 0.1 ) {
          throw new Error("Please enter a rate greater than $0.10 USD");
  
        } 
        if (outPayload.header.duration <= 0) {
          throw new Error("Please enter a duration greater than 0");
        }
        await this.cloutcastApi.createCast(outPayload);
        this.globalVars._alertSuccess("Your cast has been created.", "Success!");
        this.bsModalRef.hide();
      }

      
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
    // console.log(res);
  }
  async showTotalAlert() {
    let msg = "All unused payment and fee amount is returned upon completion of the cast.";
    let res = await SwalHelper.fire({
      target: this.globalVars.getTargetComponentSelector(),
      title: "Total Explanation",
      html: msg,
      showCancelButton: false,
      showConfirmButton: true,
      customClass: {
        confirmButton: "btn btn-light",
        cancelButton: "btn btn-light no",
      },
      reverseButtons: true,
    });
  }
  async showFeeAlert() {
    let msg = "This represents the total possible fee amount for this cast, assuming all users engage with this post. Fee is split by engagement, and is only paid if a user engages with the cast.";
    let res = await SwalHelper.fire({
      target: this.globalVars.getTargetComponentSelector(),
      title: "Fee Explanation",
      html: msg,
      showCancelButton: false,
      showConfirmButton: true,
      customClass: {
        confirmButton: "btn btn-light",
        cancelButton: "btn btn-light no",
      },
      reverseButtons: true,
    });
  }
}


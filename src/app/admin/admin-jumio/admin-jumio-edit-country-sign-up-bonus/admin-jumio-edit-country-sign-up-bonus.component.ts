import { Component, Input, OnInit } from '@angular/core';
import {
  BackendApiService,
  CountryCodeDetails,
  CountryLevelSignUpBonus,
  CountryLevelSignUpBonusResponse,
} from '../../../backend-api.service';
import { GlobalVarsService } from '../../../global-vars.service';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { BsModalService } from 'ngx-bootstrap/modal';
import { Router } from '@angular/router';

@Component({
  selector: 'admin-jumio-edit-country-sign-up-bonus',
  templateUrl: './admin-jumio-edit-country-sign-up-bonus.component.html',
})
export class AdminJumioEditCountrySignUpBonusComponent implements OnInit {
  @Input() countryLevelSignUpBonusResponse: CountryLevelSignUpBonusResponse;

  newAllowCustomReferralAmount: boolean;
  newAllowCustomKickbackAmount: boolean;
  newReferralAmountOverrideUSD: number;
  newKickbackAmountOverrideUSD: number;
  updatingCountryLevelBonus: boolean = false;

  constructor(
    private globalVars: GlobalVarsService,
    private backendApi: BackendApiService,
    private modalService: BsModalService,
    private router: Router,
    public bsModalRef: BsModalRef
  ) {}

  ngOnInit(): void {
    this.newAllowCustomKickbackAmount = this.getAllowCustomKickbackAmount();
    this.newAllowCustomReferralAmount = this.getAllowCustomReferralAmount();
    this.newReferralAmountOverrideUSD =
      this.getReferralAmountOverrideUSDCents() / 100;
    this.newKickbackAmountOverrideUSD =
      this.getKickbackAmountOverrideUSDCents() / 100;
  }

  getCountryCodeDetails(): CountryCodeDetails {
    return this.countryLevelSignUpBonusResponse.CountryCodeDetails;
  }

  getCountryLevelSignUpBonus(): CountryLevelSignUpBonus {
    return this.countryLevelSignUpBonusResponse.CountryLevelSignUpBonus;
  }

  getCountryName(): string {
    return this.getCountryCodeDetails().Name;
  }

  getCountryAlpha3(): string {
    return this.getCountryCodeDetails().Alpha3;
  }

  getAllowCustomReferralAmount(): boolean {
    return this.getCountryLevelSignUpBonus().AllowCustomReferralAmount;
  }

  getAllowCustomKickbackAmount(): boolean {
    return this.getCountryLevelSignUpBonus().AllowCustomKickbackAmount;
  }

  getReferralAmountOverrideUSDCents(): number {
    return this.getCountryLevelSignUpBonus().ReferralAmountOverrideUSDCents;
  }

  getKickbackAmountOverrideUSDCents(): number {
    return this.getCountryLevelSignUpBonus().KickbackAmountOverrideUSDCents;
  }

  updateSignUpBonus() {
    this.updatingCountryLevelBonus = true;
    this.backendApi
      .AdminUpdateJumioCountrySignUpBonus(
        this.globalVars.localNode,
        this.globalVars.loggedInUser?.PublicKeyBase58Check,
        this.getCountryAlpha3(),
        {
          AllowCustomKickbackAmount: this.newAllowCustomKickbackAmount,
          AllowCustomReferralAmount: this.newAllowCustomReferralAmount,
          ReferralAmountOverrideUSDCents: Math.trunc(
            this.newReferralAmountOverrideUSD * 100
          ),
          KickbackAmountOverrideUSDCents: Math.trunc(
            this.newKickbackAmountOverrideUSD * 100
          ),
        }
      )
      .subscribe(
        () => {
          this.modalService.setDismissReason('sign-up-bonus-updated');
          this.bsModalRef.hide();
        },
        (err) => {
          console.error(err);
        }
      )
      .add(() => (this.updatingCountryLevelBonus = false));
  }
}

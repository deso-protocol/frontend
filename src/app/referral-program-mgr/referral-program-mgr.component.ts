import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { GlobalVarsService } from "../global-vars.service";
import { BackendApiService, ProfileEntryResponse } from "../backend-api.service";
import * as _ from 'lodash';

@Component({
  selector: 'referral-program-mgr',
  templateUrl: './referral-program-mgr.component.html',
})
export class ReferralProgramMgrComponent implements OnInit {
  tabs = ["Single User", "Bulk CSV Upload"];
  activeTab = "Single User";
  selectedCreator: ProfileEntryResponse;
  requiresJumio: boolean = true;
  refereeAmountUSD: number = 0;
  referrerAmountUSD: number = 0;
  creatingNewLink: boolean = false;
  fetchingExistingLinks: boolean = false;
  existingLinks = [];
  linkCopied = [];
  updatingLink = [];

  constructor(
    private globalVars: GlobalVarsService,
    private ref: ChangeDetectorRef,
    private backendApi: BackendApiService
  ) { }

  ngOnInit(): void {
  }

  _tabClicked(tabName: any) {
    this.activeTab = tabName;
  }

  _handleCreatorSelectedInSearch(creator: ProfileEntryResponse) {
    this.selectedCreator = creator;
    this._getExistingLinks();
  }

  _getCreatorPubKey(creator: ProfileEntryResponse) {
    return creator?.Username || creator?.PublicKeyBase58Check || ""
  } 

  _setExistingLinkStatusArrays() {
    this.linkCopied = [];
    this.updatingLink = [];
    for(let ii=0; ii < this.existingLinks.length; ii++) {
      this.linkCopied.push(false);
      this.updatingLink.push(false);
    }
  }

  _createNewLink() {
    this.creatingNewLink = true;
    this.backendApi
      .AdminCreateReferralHash(
        this.globalVars.localNode,
        this.globalVars.loggedInUser.PublicKeyBase58Check,
        this.selectedCreator?.PublicKeyBase58Check,
        this.selectedCreator?.Username,
        this.referrerAmountUSD*100,
        this.refereeAmountUSD*100,
        this.requiresJumio,
      ).subscribe(
        (res) => {
          res.ReferralInfoResponse.Info["referrerAmountUSD"] = 
            res.ReferralInfoResponse.Info.ReferrerAmountUSDCents / 100;
          res.ReferralInfoResponse.Info["refereeAmountUSD"] = 
            res.ReferralInfoResponse.Info.RefereeAmountUSDCents / 100;
          this.existingLinks.unshift(res.ReferralInfoResponse)
          this._setExistingLinkStatusArrays();
        },
        (err) => {
          this.globalVars._alertError(err.error.error);
          console.error(err);
        }
      ).add(() => (this.creatingNewLink = false));
  }

  _getExistingLinks() {
    this.fetchingExistingLinks = true;
    this.backendApi
      .RoutePathAdminGetAllReferralInfoForUser(
        this.globalVars.localNode,
        this.globalVars.loggedInUser.PublicKeyBase58Check,
        this.selectedCreator?.PublicKeyBase58Check,
        this.selectedCreator?.Username,
      ).subscribe(
        (res) => {
          if(res.ReferralInfoResponses) {
            this.existingLinks = res.ReferralInfoResponses; 
            for(let ii=0; ii < this.existingLinks.length; ii++) {
              this.existingLinks[ii].Info["referrerAmountUSD"] =
                this.existingLinks[ii].Info.ReferrerAmountUSDCents / 100;
              this.existingLinks[ii].Info["refereeAmountUSD"] =
                this.existingLinks[ii].Info.RefereeAmountUSDCents / 100;
            }
            this.existingLinks = _.sortBy(
              this.existingLinks, [(o) => {return -o.Info.DateCreatedTStampNanos}])
            this._setExistingLinkStatusArrays();
          }
        },
        (err) => {
          this.globalVars._alertError(err.error.error);
          console.error(err);
        }
      ).add(() => (this.fetchingExistingLinks = false));
  }

  _updateExistingLink(linkNum: number) {
    if(linkNum >= this.existingLinks.length) {
      return
    }

    this.updatingLink[linkNum] = true;
    let existingLink = this.existingLinks[linkNum];
    this.backendApi
      .AdminUpdateReferralHash(
        this.globalVars.localNode,
        this.globalVars.loggedInUser.PublicKeyBase58Check,
        existingLink.Info.ReferralHashBase58,
        existingLink.Info.referrerAmountUSD*100,
        existingLink.Info.refereeAmountUSD*100,
        existingLink.Info.RequiresJumio,
        existingLink.IsActive,
      ).subscribe(
        (res) => {
          res.ReferralInfoResponse.Info["referrerAmountUSD"] = 
            res.ReferralInfoResponse.Info.ReferrerAmountUSDCents / 100;
          res.ReferralInfoResponse.Info["refereeAmountUSD"] = 
            res.ReferralInfoResponse.Info.RefereeAmountUSDCents / 100;
          this.existingLinks[linkNum] = res.ReferralInfoResponse;
          this.globalVars._alertSuccess("Successfully updated referral link.");
        },
        (err) => {
          this.globalVars._alertError(err.error.error);
          console.error(err);
        }
      ).add(() => (this.updatingLink[linkNum] = false));
  }

  _copyLink(linkNum: number) {
    this.globalVars._copyText(
      this._getLinkForReferralHash(this.existingLinks[linkNum].Info.ReferralHashBase58)
    );

    this.linkCopied[linkNum] = true;
    setTimeout(() => {
      this.linkCopied[linkNum] = false;
    }, 500);
  }

  _getLinkForReferralHash(referralHash: string) {
    return "https://bitclout.com/r/" + referralHash
  }

}

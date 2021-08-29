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
  maxReferrals: number = 0;
  creatingNewLink: boolean = false;
  fetchingExistingLinks: boolean = false;
  downloadingReferralCSV: boolean = false;
  uploadingReferralCSV: boolean = false;
  existingLinks = [];
  linkCopied = [];
  updatingLink = [];
  fileInput = "";

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
        this.maxReferrals,
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
      .AdminGetAllReferralInfoForUser(
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
        existingLink.Info.MaxReferrals,
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

  _getDateString() {
    let date = new Date();
    let mm = (date.getMonth() + 1).toString();
    mm = mm.length == 1 ? '0'+mm : mm;
    let dd = date.getDate().toString();
    let yyyy = date.getFullYear().toString();
    return yyyy+mm+dd
  }

  _downloadReferralCSV() {
    this.downloadingReferralCSV = true;
    this.backendApi
      .AdminDownloadReferralCSV(
        this.globalVars.localNode,
        this.globalVars.loggedInUser.PublicKeyBase58Check,
      ).subscribe(
        (res) => {
          // We construct the CSV on the client side so that we can use our standard JWT post 
          // request. Thanks to @isherwood and @Default for the code: https://bit.ly/3zoQRGY.
          let csvContent = "data:text/csv;charset=utf-8,";

          res.CSVRows.forEach(function(rowArray) {
            let row = rowArray.join(",");
            csvContent += row + "\r\n";
          });

          var encodedUri = encodeURI(csvContent);
          var link = document.createElement("a");
          link.setAttribute("href", encodedUri);
          link.setAttribute("download", this._getDateString() + "_referral_links.csv");
          document.body.appendChild(link);

          link.click();
        },
        (err) => {
        }
      ).add(() => (this.downloadingReferralCSV = false));
  }

  _handleCSVInput(files: FileList) {
    this.uploadingReferralCSV = true;
    // Get the CSV file.
    let fileToUpload = files.item(0);
    if (fileToUpload.type !== "text/csv") {
      this.globalVars._alertError("File must have type 'text/csv'.");
      return;
    }

    // Process the file. The CSV has a simple, expected input format so we can parse it manually.
    fileToUpload.text().then(text => {
      let rowStrings = text.split("\n")
      let rows = [];
      for(let ii=0; ii < rowStrings.length; ii++) {
        if(rowStrings[ii].length == 0) {
          break;
        }
        let row = rowStrings[ii].split(',');
        rows.push(row);
      }
      this._uploadCSVRows(rows);
    })
  }

  _uploadCSVRows(csvRows: Array<Array<String>>) {
    this.backendApi
      .AdminUploadReferralCSV(
        this.globalVars.localNode,
        this.globalVars.loggedInUser.PublicKeyBase58Check,
        csvRows,
      ).subscribe(
        (res) => {
          this.globalVars._alertSuccess(
            "Successfully uploaded CSV! " + res.LinksUpdated.toString() + " links updated and " 
            + res.LinksCreated.toString() + " links created.")
        },
        (err) => { 
          this.globalVars._alertError(err.error.error) 
        }
      ).add(() => (this.uploadingReferralCSV = false));
  }

  _copyLink(linkNum: number) {
    this.globalVars._copyText(
      this.globalVars.getLinkForReferralHash(this.existingLinks[linkNum].Info.ReferralHashBase58)
    );

    this.linkCopied[linkNum] = true;
    setTimeout(() => {
      this.linkCopied[linkNum] = false;
    }, 500);
  }

}

import { Component, OnInit } from "@angular/core";
import { GlobalVarsService } from "../global-vars.service";
import {
  BackendApiService,
  CreatorCoinLimitOperationString,
  DAOCoinLimitOperationString,
  NFTLimitOperationString,
  TransactionSpendingLimitResponse,
} from "../backend-api.service";
import { Title } from "@angular/platform-browser";
import { ThemeService } from "../theme/theme.service";
import { environment } from "src/environments/environment";
import { SwalHelper } from "../../lib/helpers/swal-helper";
import { Router } from "@angular/router";
import { IdentityService } from "../identity.service";

@Component({
  selector: "settings",
  templateUrl: "./settings.component.html",
  styleUrls: ["./settings.component.scss"],
})
export class SettingsComponent implements OnInit {
  loading = false;
  emailAddress = "";
  invalidEmailEntered = false;
  updatingSettings = false;
  showSuccessMessage = false;
  successMessageTimeout: any;
  deletingPII = false;

  constructor(
    public globalVars: GlobalVarsService,
    private backendApi: BackendApiService,
    private titleService: Title,
    public themeService: ThemeService,
    private router: Router,
    private identityService: IdentityService
  ) {}

  selectChangeHandler(event: any) {
    const newTheme = event.target.value;
    this.themeService.setTheme(newTheme);
  }

  ngOnInit() {
    this._getUserMetadata();
    this.makeTransactionSpendingLimitResponse();
    this.titleService.setTitle(`Settings - ${environment.node.name}`);
  }

  // makeDerivedKey()
  makeTransactionSpendingLimitResponse() {
    const x: TransactionSpendingLimitResponse = {
      GlobalDESOLimit: 10021.123456789 * 1e9,
      DerivedKeyMemo: "woohoo!",
      TransactionCountLimitMap: {
        BASIC_TRANSFER: 10, // basic transfer
        AUTHORIZE_DERIVED_KEY: 1,
      },
      CreatorCoinOperationLimitMap: {
        tBCKVERmG9nZpHTk2AVPqknWc1Mw9HHAnqrTpW1RnXpXMQ4PsQgnmV: {
          [CreatorCoinLimitOperationString.BUY]: 10,
          [CreatorCoinLimitOperationString.TRANSFER]: 2,
        },
        tBCKYYbGp3iLwhienWLzbLJM1Yi4WKmWRwNNCchhDLtniDqiHPMGK1: {
          [CreatorCoinLimitOperationString.BUY]: 2,
        },
        tBCKW665XZnvVZcCfcEmyeecSZGKAdaxwV2SH9UFab6PpSRikg4EJ2: {
          [CreatorCoinLimitOperationString.ANY]: 3,
        },
        tBCKUvZnSitfCu8odocnPHoxZsZWpPZpmrc4vBJVtSzV6DQyKs9bYB: {
          [CreatorCoinLimitOperationString.BUY]: 410928389,
        },
        tBCKYZbR5v9cWVTWQ1YwJMbusFFvMtEq8xzPEiQuLaXqr1Eu7HVwrE: {
          [CreatorCoinLimitOperationString.ANY]: 39012,
          [CreatorCoinLimitOperationString.BUY]: 190232,
          [CreatorCoinLimitOperationString.TRANSFER]: 10000,
          [CreatorCoinLimitOperationString.SELL]: 129038,
        },
        tBCKVv5H1Gz6RTRhjxJwdzcfwfwoUo8b4PYWSKkayG4dy76Jsjt2Ro: {
          [CreatorCoinLimitOperationString.TRANSFER]: 123,
          [CreatorCoinLimitOperationString.BUY]: 4,
        },
        "": {
          [CreatorCoinLimitOperationString.ANY]: 5,
        },
      },
      DAOCoinOperationLimitMap: {
        tBCKW665XZnvVZcCfcEmyeecSZGKAdaxwV2SH9UFab6PpSRikg4EJ2: {
          [DAOCoinLimitOperationString.ANY]: 2,
          [DAOCoinLimitOperationString.TRANSFER]: 10,
        },
        tBCKVERmG9nZpHTk2AVPqknWc1Mw9HHAnqrTpW1RnXpXMQ4PsQgnmV: {
          [DAOCoinLimitOperationString.ANY]: 2,
          [DAOCoinLimitOperationString.TRANSFER]: 10,
        },
      },
      NFTOperationLimitMap: {
        "3e42215a120a6e9d4848117f5829a2c4d9f692360fd14b78daea483a72d142dc": {
          0: {
            [NFTLimitOperationString.BID]: 2,
          },
          1: {
            [NFTLimitOperationString.ANY]: 4,
          },
          2: {
            [NFTLimitOperationString.ANY]: 2,
          },
          3: {
            [NFTLimitOperationString.ACCEPT_BID]: 10,
          },
          4: {
            [NFTLimitOperationString.UPDATE]: 2,
          },
          5: {
            [NFTLimitOperationString.ANY]: 3,
          },
          6: {
            [NFTLimitOperationString.TRANSFER]: 2,
          },
          7: {
            [NFTLimitOperationString.ACCEPT_TRANSFER]: 3,
          },
        },
        "6a90e18da20d76eaa031a1d381a70a48f6f2d413a04bae101c993a47866b2d13": {
          0: {
            [NFTLimitOperationString.ACCEPT_BID]: 1,
          },
          2: {
            [NFTLimitOperationString.TRANSFER]: 2,
          },
        },
        "8bfc40f565fcbbf1c1af9c9f01b6003bada6074ef2d5bfe5de3c153ceed7b69f": {
          1: {
            [NFTLimitOperationString.BURN]: 3,
          },
        },
        dd5126c89dd61a7bc5143d03396560f272686b42fca6c6dac5fd34ef992b346e: {
          0: {
            [NFTLimitOperationString.ACCEPT_BID]: 5,
          },
        },
        d3bc3295f6f74b60794a29ee8f9552401147a86350605ddd149c35d916f1215f: {
          0: {
            [NFTLimitOperationString.BID]: 1,
          },
        },
        "": {
          0: {
            [NFTLimitOperationString.ACCEPT_BID]: 2,
            [NFTLimitOperationString.BID]: 5,
          },
        },
      },
    };
    this.identityService
      .derive(
        this.globalVars.loggedInUser?.PublicKeyBase58Check,
        x
        // "tBCKYfSan7WBkpFUV2ctLh5cbv2K7DHnxV6s68JnXghq98mCrEoxUz"
      )
      .subscribe((res) => {
        console.log(res);
        this.backendApi
          .AuthorizeDerivedKey(
            this.globalVars.localNode,
            res.publicKeyBase58Check,
            res.derivedPublicKeyBase58Check,
            res.expirationBlock,
            res.accessSignature,
            false,
            false,
            res.transactionSpendingLimitHex,
            "xxyyzz",
            this.globalVars.defaultFeeRateNanosPerKB
          )
          .subscribe((res) => {
            console.log(res);
          });
      });
  }

  _getUserMetadata() {
    this.loading = true;
    this.backendApi
      .GetUserGlobalMetadata(
        this.globalVars.localNode,
        this.globalVars.loggedInUser.PublicKeyBase58Check /*UpdaterPublicKeyBase58Check*/
      )
      .subscribe(
        (res) => {
          this.emailAddress = res.Email;
        },
        (err) => {
          console.log(err);
        }
      )
      .add(() => {
        this.loading = false;
      });
  }

  _validateEmail(email) {
    if (email === "" || this.globalVars.emailRegExp.test(email)) {
      this.invalidEmailEntered = false;
    } else {
      this.invalidEmailEntered = true;
    }
  }

  _updateSettings() {
    if (this.showSuccessMessage) {
      this.showSuccessMessage = false;
      clearTimeout(this.successMessageTimeout);
    }

    this.updatingSettings = true;
    this.backendApi
      .UpdateUserGlobalMetadata(
        this.globalVars.localNode,
        this.globalVars.loggedInUser.PublicKeyBase58Check /*UpdaterPublicKeyBase58Check*/,
        this.emailAddress /*EmailAddress*/,
        null /*MessageReadStateUpdatesByContact*/
      )
      .subscribe(
        (res) => {},
        (err) => {
          console.log(err);
        }
      )
      .add(() => {
        this.showSuccessMessage = true;
        this.updatingSettings = false;
        this.successMessageTimeout = setTimeout(() => {
          this.showSuccessMessage = false;
        }, 500);
      });
  }

  deletePII() {
    SwalHelper.fire({
      target: GlobalVarsService.getTargetComponentSelectorFromRouter(this.router),
      icon: "warning",
      title: `Delete Your Personal Information`,
      html: `Clicking confirm will remove your phone number, email address, and any other personal information associated with your public key.`,
      showCancelButton: true,
      showConfirmButton: true,
      focusConfirm: true,
      customClass: {
        confirmButton: "btn btn-light",
        cancelButton: "btn btn-light no",
      },
      confirmButtonText: "Confirm",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    }).then((res) => {
      if (res.isConfirmed) {
        this.deletingPII = true;
        this.backendApi
          .DeletePII(this.globalVars.localNode, this.globalVars.loggedInUser?.PublicKeyBase58Check)
          .subscribe(
            (res) => {
              this.globalVars._alertSuccess("PII Deleted successfully");
              this.emailAddress = "";
              this.globalVars.updateEverything();
            },
            (err) => {
              console.error(err);
              this.globalVars._alertError(err.error.error);
            }
          )
          .add(() => (this.deletingPII = false));
      }
    });
  }
}

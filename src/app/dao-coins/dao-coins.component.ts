import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { GlobalVarsService } from "../global-vars.service";
import { AppRoutingModule } from "../app-routing.module";
import {
  BackendApiService,
  BalanceEntryResponse,
  DAOCoinEntryResponse,
  DAOCoinOperationTypeString,
  TransferRestrictionStatusString,
} from "../backend-api.service";
import { Title } from "@angular/platform-browser";
import { ActivatedRoute, Router } from "@angular/router";
import { InfiniteScroller } from "../infinite-scroller";
import { IAdapter, IDatasource } from "ngx-ui-scroll";
import { Observable, Subscription, throwError, zip } from "rxjs";
import { environment } from "src/environments/environment";
import { fromWei, toBN, toHex, toWei } from "web3-utils";
import { catchError, map } from "rxjs/operators";
import { Hex } from "web3-utils/types";
import { BsModalService } from "ngx-bootstrap/modal";
import { TransferDAOCoinModalComponent } from "./transfer-dao-coin-modal/transfer-dao-coin-modal.component";
import { BurnDaoCoinModalComponent } from "./burn-dao-coin-modal/burn-dao-coin-modal.component";
import { split } from "lodash";
import { SwalHelper } from "../../lib/helpers/swal-helper";

@Component({
  selector: "dao-coins",
  templateUrl: "./dao-coins.component.html",
})
export class DaoCoinsComponent implements OnInit, OnDestroy {
  static PAGE_SIZE = 20;
  static BUFFER_SIZE = 10;
  static WINDOW_VIEWPORT = true;
  static PADDING = 0.5;

  @Input() inTutorial: boolean;

  globalVars: GlobalVarsService;
  AppRoutingModule = AppRoutingModule;
  hasUnminedCreatorCoins: boolean;

  sortedCoinsFromHighToLow: number = 0;
  sortedUsernameFromHighToLow: number = 0;
  hideMyDAOTab: boolean = false;
  showDAOCoinHoldings: boolean = false;

  myDAOCoin: DAOCoinEntryResponse;
  myDAOCapTable: BalanceEntryResponse[] = [];
  daoCoinHoldings: BalanceEntryResponse[] = [];

  loadingMyDAOCapTable: boolean = false;
  loadingMyDAOCoinHoldings: boolean = false;
  loadingNewSelection: boolean = false;

  static myDAOTab: string = "My DAO";
  static daoCoinsTab: string = "DAO Holdings";
  tabs = [DaoCoinsComponent.myDAOTab, DaoCoinsComponent.daoCoinsTab];
  activeTab: string = DaoCoinsComponent.myDAOTab;
  balanceEntryToHihlight: BalanceEntryResponse;

  TransferRestrictionStatusString = TransferRestrictionStatusString;
  transferRestrictionStatus: TransferRestrictionStatusString;
  coinsToMint: number = 0;
  coinsToBurn: number = 0;
  mintingDAOCoin: boolean = false;
  disablingMinting: boolean = false;
  burningDAOCoin: boolean = false;
  updatingTransferRestrictionStatus: boolean = false;

  transferRestrictionStatusOptions = [
    TransferRestrictionStatusString.UNRESTRICTED,
    TransferRestrictionStatusString.PROFILE_OWNER_ONLY,
    TransferRestrictionStatusString.DAO_MEMBERS_ONLY,
    TransferRestrictionStatusString.PERMANENTLY_UNRESTRICTED,
  ];

  constructor(
    private appData: GlobalVarsService,
    private titleService: Title,
    private router: Router,
    private route: ActivatedRoute,
    public backendApi: BackendApiService,
    private modalService: BsModalService
  ) {
    this.globalVars = appData;
  }

  subscriptions = new Subscription();

  ngOnInit() {
    // Don't look up my DAO if I don't have a profile
    if (this.globalVars.loggedInUser?.ProfileEntryResponse) {
      this.myDAOCoin = this.globalVars.loggedInUser.ProfileEntryResponse.DAOCoinEntry;
      this.transferRestrictionStatus = this.myDAOCoin.TransferRestrictionStatus;
      this.loadMyDAOCapTable().subscribe((res) => {});
    } else {
      this.hideMyDAOTab = true;
      this.showDAOCoinHoldings = true;
      this.activeTab = DaoCoinsComponent.daoCoinsTab;
      this.tabs = [DaoCoinsComponent.daoCoinsTab];
    }
    this.loadMyDAOCoinHoldings().subscribe((res) => {});
    this.titleService.setTitle(`DAO Coins - ${environment.node.name}`);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  loadMyDAOCapTable(): Observable<BalanceEntryResponse[]> {
    this.loadingMyDAOCapTable = true;
    return this.backendApi
      .GetHodlersForPublicKey(
        this.globalVars.localNode,
        this.globalVars.loggedInUser?.PublicKeyBase58Check,
        "",
        "",
        0,
        false,
        true,
        true
      )
      .pipe(
        map((res) => {
          this.myDAOCapTable = res.Hodlers || [];
          this.loadingMyDAOCapTable = false;
          return res.Hodlers;
        }),
        catchError((err) => {
          console.error(err);
          this.loadingMyDAOCapTable = false;
          return throwError(err);
        })
      );
  }

  loadMyDAOCoinHoldings(): Observable<BalanceEntryResponse[]> {
    this.loadingMyDAOCoinHoldings = true;
    return this.backendApi
      .GetHodlersForPublicKey(
        this.globalVars.localNode,
        this.globalVars.loggedInUser?.PublicKeyBase58Check,
        "",
        "",
        0,
        true,
        true,
        true
      )
      .pipe(
        map((res) => {
          this.daoCoinHoldings = res.Hodlers || [];
          this.loadingMyDAOCoinHoldings = false;
          this.loadingMyDAOCoinHoldings = false;
          return res.Hodlers;
        }),
        catchError((err) => {
          console.error(err);
          this.loadingMyDAOCoinHoldings = false;
          return throwError(err);
        })
      );
  }

  // Thanks to @brabenetz for the solution on forward padding with the ngx-ui-scroll component.
  // https://github.com/dhilt/ngx-ui-scroll/issues/111#issuecomment-697269318
  correctDataPaddingForwardElementHeight(viewportElement: HTMLElement): void {
    const dataPaddingForwardElement: HTMLElement = viewportElement.querySelector(`[data-padding-forward]`);
    if (dataPaddingForwardElement) {
      dataPaddingForwardElement.setAttribute("style", "height: 0px;");
    }
  }

  // sort by Coins held
  sortHodlingsCoins(hodlings: BalanceEntryResponse[], descending: boolean): void {
    this.sortedUsernameFromHighToLow = 0;
    this.sortedCoinsFromHighToLow = descending ? -1 : 1;
    hodlings.sort((a: BalanceEntryResponse, b: BalanceEntryResponse) => {
      return this.sortedCoinsFromHighToLow * (a.BalanceNanos - b.BalanceNanos);
    });
  }

  // sort by username
  sortHodlingsUsername(hodlings: BalanceEntryResponse[], descending: boolean): void {
    this.sortedUsernameFromHighToLow = descending ? -1 : 1;
    this.sortedCoinsFromHighToLow = 0;
    hodlings.sort((a: BalanceEntryResponse, b: BalanceEntryResponse) => {
      return (
        this.sortedUsernameFromHighToLow *
        b.ProfileEntryResponse.Username.localeCompare(a.ProfileEntryResponse.Username)
      );
    });
  }

  sortWallet(column: string) {
    let descending: boolean;
    switch (column) {
      case "username":
        // code block
        descending = this.sortedUsernameFromHighToLow !== -1;
        this.sortHodlingsUsername(this.myDAOCapTable, descending);
        this.sortHodlingsUsername(this.daoCoinHoldings, descending);
        break;
      case "coins":
        descending = this.sortedCoinsFromHighToLow !== -1;
        this.sortHodlingsCoins(this.myDAOCapTable, descending);
        this.sortHodlingsCoins(this.daoCoinHoldings, descending);
        break;
      default:
      // do nothing
    }
    this.scrollerReset();
  }

  mintDAOCoin(): void {
    if (this.myDAOCoin.MintingDisabled || this.mintingDAOCoin || this.coinsToMint <= 0) {
      return;
    }
    SwalHelper.fire({
      target: this.globalVars.getTargetComponentSelector(),
      title: "Mint DAO Coins",
      html: `Click confirm to mint ${this.coinsToMint} ${this.globalVars.loggedInUser?.ProfileEntryResponse?.Username} DAO coins`,
      showCancelButton: true,
      customClass: {
        confirmButton: "btn btn-light",
        cancelButton: "btn btn-light no",
      },
      reverseButtons: true,
    }).then((res: any) => {
      if (res.isConfirmed) {
        this.loadingNewSelection = true;
        this.mintingDAOCoin = true;
        this.doDAOCoinTxn(this.globalVars.loggedInUser?.PublicKeyBase58Check, DAOCoinOperationTypeString.MINT)
          .subscribe(
            (res) => {
              this.myDAOCoin.CoinsInCirculationNanos = toBN(this.myDAOCoin.CoinsInCirculationNanos)
                .add(toBN(this.globalVars.toHexNanos(this.coinsToMint)))
                .toString("hex");
              zip(this.loadMyDAOCapTable(), this.loadMyDAOCoinHoldings()).subscribe(() => {
                this.loadingNewSelection = false;
                this._handleTabClick(this.activeTab);
              });
              this.coinsToMint = 0;
            },
            (err) => {
              this.globalVars._alertError(err.error.error);
              console.error(err);
            }
          )
          .add(() => {
            this.mintingDAOCoin = false;
            this.loadingNewSelection = false;
          });
      }
    });
  }

  disableMinting(): void {
    if (this.myDAOCoin.MintingDisabled || this.disablingMinting) {
      return;
    }
    SwalHelper.fire({
      target: this.globalVars.getTargetComponentSelector(),
      title: "Disable Minting",
      html: `Click confirm to disable minting for ${this.globalVars.loggedInUser?.ProfileEntryResponse?.Username} DAO coins. Please note, this is irreversible.`,
      showCancelButton: true,
      customClass: {
        confirmButton: "btn btn-light",
        cancelButton: "btn btn-light no",
      },
      reverseButtons: true,
    }).then((res: any) => {
      if (res.isConfirmed) {
        this.disablingMinting = true;
        this.doDAOCoinTxn(
          this.globalVars.loggedInUser?.PublicKeyBase58Check,
          DAOCoinOperationTypeString.DISABLE_MINTING
        )
          .subscribe(
            (res) => {
              this.myDAOCoin.MintingDisabled = true;
            },
            (err) => {
              this.globalVars._alertError(err.error.error);
              console.error(err);
            }
          )
          .add(() => (this.disablingMinting = false));
      }
    });
  }

  updateTransferRestrictionStatus(): void {
    if (
      this.myDAOCoin.TransferRestrictionStatus === TransferRestrictionStatusString.PERMANENTLY_UNRESTRICTED ||
      this.updatingTransferRestrictionStatus ||
      this.transferRestrictionStatus === this.myDAOCoin.TransferRestrictionStatus
    ) {
      return;
    }
    SwalHelper.fire({
      target: this.globalVars.getTargetComponentSelector(),
      title: "Update Transfer Restriction Status",
      html: `Click confirm to update the transfer restriction status to ${this.getDisplayTransferRestrictionStatus(
        this.transferRestrictionStatus
      )} for ${this.globalVars.loggedInUser?.ProfileEntryResponse?.Username} DAO coins`,
      showCancelButton: true,
      customClass: {
        confirmButton: "btn btn-light",
        cancelButton: "btn btn-light no",
      },
      reverseButtons: true,
    }).then((res: any) => {
      if (res.isConfirmed) {
        this.updatingTransferRestrictionStatus = true;
        this.doDAOCoinTxn(
          this.globalVars.loggedInUser?.PublicKeyBase58Check,
          DAOCoinOperationTypeString.UPDATE_TRANSFER_RESTRICTION_STATUS
        )
          .subscribe(
            (res) => {
              this.myDAOCoin.TransferRestrictionStatus = this.transferRestrictionStatus;
            },
            (err) => {
              this.globalVars._alertError(err.error.error);
              console.error(err);
            }
          )
          .add(() => (this.updatingTransferRestrictionStatus = false));
      }
    });
  }

  burnDAOCoin(profilePublicKeyBase58Check: string): void {
    if (this.burningDAOCoin || this.coinsToBurn <= 0) {
      return;
    }
    SwalHelper.fire({
      target: this.globalVars.getTargetComponentSelector(),
      title: "Burn DAO Coins",
      html: `Click confirm to burn ${this.coinsToBurn} ${this.globalVars.loggedInUser?.ProfileEntryResponse?.Username} DAO coins`,
      showCancelButton: true,
      customClass: {
        confirmButton: "btn btn-light",
        cancelButton: "btn btn-light no",
      },
      reverseButtons: true,
    }).then((res: any) => {
      if (res.isConfirmed) {
        this.burningDAOCoin = true;
        this.loadingNewSelection = true;
        this.doDAOCoinTxn(this.globalVars.loggedInUser?.PublicKeyBase58Check, DAOCoinOperationTypeString.BURN)
          .subscribe(
            (res) => {
              if (profilePublicKeyBase58Check === this.globalVars.loggedInUser?.PublicKeyBase58Check) {
                this.myDAOCoin.CoinsInCirculationNanos = toBN(this.myDAOCoin.CoinsInCirculationNanos)
                  .add(toBN(this.globalVars.toHexNanos(this.coinsToBurn)))
                  .toString("hex");
              }
              this.coinsToBurn = 0;
            },
            (err) => {
              this.globalVars._alertError(err.error.error);
              console.error(err);
            }
          )
          .add(() => {
            this.burningDAOCoin = false;
            this.loadingNewSelection = false;
          });
      }
    });
  }

  doDAOCoinTxn(profilePublicKeyBase58Check: string, operationType: DAOCoinOperationTypeString): Observable<any> {
    if (
      profilePublicKeyBase58Check !== this.globalVars.loggedInUser?.PublicKeyBase58Check &&
      operationType !== DAOCoinOperationTypeString.BURN
    ) {
      return throwError("invalid dao coin operation - must be owner to perform " + operationType);
    }
    return this.backendApi.DAOCoin(
      this.globalVars.localNode,
      this.globalVars.loggedInUser?.PublicKeyBase58Check,
      profilePublicKeyBase58Check,
      operationType,
      operationType === DAOCoinOperationTypeString.UPDATE_TRANSFER_RESTRICTION_STATUS
        ? this.transferRestrictionStatus
        : undefined,
      operationType === DAOCoinOperationTypeString.MINT ? this.globalVars.toHexNanos(this.coinsToMint) : undefined,
      operationType === DAOCoinOperationTypeString.BURN ? this.globalVars.toHexNanos(this.coinsToBurn) : undefined,
      this.globalVars.defaultFeeRateNanosPerKB
    );
  }

  unminedDeSoToolTip() {
    return (
      "Mining in progress. Feel free to transact in the meantime.\n\n" +
      "Mined balance:\n" +
      this.globalVars.nanosToDeSo(this.globalVars.loggedInUser.BalanceNanos, 9) +
      " DeSo.\n\n" +
      "Unmined balance:\n" +
      this.globalVars.nanosToDeSo(this.globalVars.loggedInUser.UnminedBalanceNanos, 9) +
      " DeSo."
    );
  }

  unminedCreatorCoinToolTip(creator: any) {
    return (
      "Mining in progress. Feel free to transact in the meantime.\n\n" +
      "Net unmined transactions:\n" +
      this.globalVars.nanosToDeSo(creator.NetBalanceInMempool, 9) +
      " DeSo.\n\n" +
      "Balance w/unmined transactions:\n" +
      this.globalVars.nanosToDeSo(creator.BalanceNanos, 9) +
      " DeSo.\n\n"
    );
  }

  usernameTruncationLength(): number {
    return this.globalVars.isMobile() ? 14 : 20;
  }

  emptyHodlerListMessage(): string {
    return this.showDAOCoinHoldings ? "You don't hold any DAO coins" : "Your DAO doesn't have any coins yet.";
  }

  _handleTabClick(tab: string) {
    this.showDAOCoinHoldings = tab === DaoCoinsComponent.daoCoinsTab;
    this.lastPage = Math.floor(
      (this.showDAOCoinHoldings ? this.daoCoinHoldings : this.myDAOCapTable).length / DaoCoinsComponent.PAGE_SIZE
    );
    this.activeTab = tab;
    this.scrollerReset();
  }

  scrollerReset() {
    this.infiniteScroller.reset();
    this.datasource.adapter.reset().then(() => this.datasource.adapter.check());
  }

  lastPage = null;
  infiniteScroller: InfiniteScroller = new InfiniteScroller(
    DaoCoinsComponent.PAGE_SIZE,
    this.getPage.bind(this),
    DaoCoinsComponent.WINDOW_VIEWPORT,
    DaoCoinsComponent.BUFFER_SIZE,
    DaoCoinsComponent.PADDING
  );
  datasource: IDatasource<IAdapter<any>> = this.infiniteScroller.getDatasource();

  getPage(page: number) {
    if (this.lastPage != null && page > this.lastPage) {
      return [];
    }

    const startIdx = page * DaoCoinsComponent.PAGE_SIZE;
    const endIdx = (page + 1) * DaoCoinsComponent.PAGE_SIZE;

    return new Promise((resolve, reject) => {
      resolve(
        this.showDAOCoinHoldings
          ? this.daoCoinHoldings.slice(startIdx, Math.min(endIdx, this.daoCoinHoldings.length))
          : this.myDAOCapTable.slice(startIdx, Math.min(endIdx, this.myDAOCapTable.length))
      );
    });
  }

  getDisplayTransferRestrictionStatus(transferRestrictionStatus: TransferRestrictionStatusString): string {
    return transferRestrictionStatus
      .split("_")
      .map((status) => status.charAt(0).toUpperCase() + status.slice(1))
      .join(" ")
      .replace("Dao", "DAO");
  }

  openTransferDAOCoinModal(creator: BalanceEntryResponse): void {
    const modalDetails = this.modalService.show(TransferDAOCoinModalComponent, {
      class: "modal-dialog-centered",
      initialState: { balanceEntryResponse: creator },
    });
    const onHideEvent = modalDetails.onHide;
    onHideEvent.subscribe((response) => {
      if (response === "dao coins transferred") {
        this.loadingNewSelection = true;
        zip(this.loadMyDAOCoinHoldings(), this.loadMyDAOCapTable()).subscribe((res) => {
          this.loadingNewSelection = false;
          this._handleTabClick(this.activeTab);
        });
      }
    });
  }

  openBurnDAOCoinModal(creator: BalanceEntryResponse): void {
    const modalDetails = this.modalService.show(BurnDaoCoinModalComponent, {
      class: "modal-dialog-centered",
      initialState: { balanceEntryResponse: creator },
    });
    const onHideEvent = modalDetails.onHide;
    onHideEvent.subscribe((response) => {
      if (response.startsWith("dao coins burned")) {
        this.loadingNewSelection = true;
        zip(this.loadMyDAOCoinHoldings(), this.loadMyDAOCapTable()).subscribe((res) => {
          // If we burned our own coin in the modal, update the coins in circulation.
          if (creator.CreatorPublicKeyBase58Check === this.globalVars.loggedInUser?.PublicKeyBase58Check) {
            const splitResponse = response.split("|");
            if (splitResponse.length === 2) {
              const burnAmountHex = splitResponse[1];
              this.myDAOCoin.CoinsInCirculationNanos = toBN(this.myDAOCoin.CoinsInCirculationNanos)
                .sub(toBN(burnAmountHex))
                .toString("hex");
            }
          }
          this.loadingNewSelection = false;
          this._handleTabClick(this.activeTab);
        });
      }
    });
  }
}

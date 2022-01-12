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
import { Observable, Subscription, throwError } from "rxjs";
import { environment } from "src/environments/environment";
import { fromWei, hexToNumber, toHex, toBN, toWei } from "web3-utils";
import { Hex } from "web3-utils/types";

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

  static myDAOTab: string = "My DAO";
  static daoCoinsTab: string = "DAO Holdings";
  tabs = [DaoCoinsComponent.myDAOTab, DaoCoinsComponent.daoCoinsTab];
  activeTab: string = DaoCoinsComponent.myDAOTab;
  balanceEntryToHihlight: BalanceEntryResponse;

  transferRestrictionStatus: TransferRestrictionStatusString;
  coinsToMint: number;
  coinsToBurn: number;

  constructor(
    private appData: GlobalVarsService,
    private titleService: Title,
    private router: Router,
    private route: ActivatedRoute,
    private backendApi: BackendApiService
  ) {
    this.globalVars = appData;
  }

  subscriptions = new Subscription();

  ngOnInit() {
    // Don't look up my DAO if I don't have a profile
    if (this.globalVars.loggedInUser?.ProfileEntryResponse) {
      this.myDAOCoin = this.globalVars.loggedInUser.ProfileEntryResponse.DAOCoinEntry;
      this.backendApi
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
        .subscribe((res) => {
          this.myDAOCapTable = res.HODLers || [];
        });
    } else {
      this.hideMyDAOTab = true;
      this.showDAOCoinHoldings = true;
    }
    this.backendApi
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
      .subscribe((res) => {
        this.daoCoinHoldings = res.HODLers || [];
      });
    this.titleService.setTitle(`DAO Coins - ${environment.node.name}`);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
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
    this.doDAOCoinTxn(this.globalVars.loggedInUser?.PublicKeyBase58Check, DAOCoinOperationTypeString.MINT).subscribe(
      (res) => {
        console.log(res);
      },
      (err) => {
        console.error(err);
      }
    );
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
      operationType === DAOCoinOperationTypeString.MINT ? toHex(this.coinsToMint * 1e9) : undefined,
      operationType === DAOCoinOperationTypeString.BURN ? toHex(this.coinsToBurn * 1e9) : undefined,
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
}

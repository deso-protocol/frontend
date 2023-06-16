import {
  Component,
  OnInit,
} from '@angular/core';
import { GlobalVarsService } from '../../global-vars.service';
import { WyreService } from '../../../lib/services/wyre/wyre';


@Component({
  selector: 'buy-deso',
  templateUrl: './buy-deso.component.html',
  styleUrls: ['./buy-deso.component.scss'],
})
export class BuyDeSoComponent implements OnInit {
  appData: GlobalVarsService;

  waitingOnTxnConfirmation = false;
  queryingBitcoinAPI = false;
  wyreService: WyreService;
  showBuyComplete: boolean = false;

  BuyDeSoComponent = BuyDeSoComponent;

  static BUY_WITH_MEGASWAP = 'Buy with Crypto';
  // static BUY_WITH_USD = 'Buy with USD';
  static BUY_ON_CB = "Buy on Coinbase";
  static CB_LINK = "https://www.coinbase.com/price/decentralized-social";

  buyTabs = [BuyDeSoComponent.BUY_WITH_MEGASWAP, BuyDeSoComponent.BUY_ON_CB];
  activeTab = BuyDeSoComponent.BUY_WITH_MEGASWAP;
  linkTabs = { [BuyDeSoComponent.BUY_ON_CB]: BuyDeSoComponent.CB_LINK };

  constructor(
    private globalVars: GlobalVarsService,
  ) {
    this.appData = globalVars;
  }

  stringify(x: any): any {
    return JSON.stringify(x);
  }

  ngOnInit() {
    window.scroll(0, 0);
    // if (this.globalVars.showBuyWithUSD) {
    //   this.buyTabs.push(BuyDeSoComponent.BUY_WITH_USD);
    // }

    // Force an update of the exchange rate when loading the Buy DeSo page to ensure our computations are using the
    // latest rates.
    this.globalVars._updateDeSoExchangeRate();
  }

  _handleTabClick(tab: string): void {
    this.activeTab = tab;
  }
}

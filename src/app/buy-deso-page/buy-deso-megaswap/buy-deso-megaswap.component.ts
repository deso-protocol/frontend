import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl, Title } from '@angular/platform-browser';
import { GlobalVarsService } from 'src/app/global-vars.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'buy-deso-megaswap',
  templateUrl: './buy-deso-megaswap.component.html',
  styleUrls: ['./buy-deso-megaswap.component.scss'],
})
export class BuyDeSoMegaSwapComponent implements OnInit {
  iframeURL: SafeResourceUrl = '';

  constructor(
    public globalVars: GlobalVarsService,
    private sanitizer: DomSanitizer,
  ) {
    if (!environment.megaswapURL) {
      return;
    }

    const isDarkMode = localStorage.getItem('theme') !== 'light' ||
      window.matchMedia('(prefers-color-scheme: dark)').matches;

    this.iframeURL = this.sanitizer.bypassSecurityTrustResourceUrl(
      [
        environment.megaswapURL,
        '/#/iframe/v1?',
        `network=${environment.production ? 'mainnet' : 'testnet'}`,
        `&theme=${isDarkMode ? 'dark-black' : 'default'}`,
        '&destinationTickers=DESO',
        '&destinationTicker=DESO',
        `&destinationAddress=${this.globalVars.loggedInUser?.PublicKeyBase58Check || ''}`,
      ].join('')
    );
  }

  ngOnInit() {
    window.scroll(0, 0);
  }
}

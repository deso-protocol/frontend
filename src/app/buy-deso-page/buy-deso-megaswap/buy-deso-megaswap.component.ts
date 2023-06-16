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

    // Map theme to MegaSwap theme.
    let theme = {
      'cake': 'light-peach',
      'dark': 'dark-gray',
      'greenish': 'dark-green',
      'icydark': 'dark-icy',
      'legends': 'dark-brown',
      'light': 'default',
    }[localStorage.getItem('theme')] || 'default';

    if (theme === 'default' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      theme = 'dark-gray';
    }

    this.iframeURL = this.sanitizer.bypassSecurityTrustResourceUrl(
      [
        environment.megaswapURL,
        '/widget?',
        `network=${environment.production ? 'mainnet' : 'testnet'}`,
        `&theme=${theme}`,
        '&destinationTickers=DESO',
        '&destinationTicker=DESO',
        `&destinationAddress=${this.globalVars.loggedInUser?.PublicKeyBase58Check || ''}`,
        `&now=${Date.now()}`,
      ].join('')
    );
  }

  ngOnInit() {
    window.scroll(0, 0);
  }
}

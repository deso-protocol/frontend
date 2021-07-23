import { Component, OnInit } from '@angular/core';
import { BackendApiService } from "../backend-api.service";
import { GlobalVarsService } from "../global-vars.service";

@Component({
  selector: 'nft-marketplace',
  templateUrl: './nft-marketplace.component.html',
})
export class NftMarketplaceComponent implements OnInit {
  globalVars: GlobalVarsService;
  loading: boolean = false;
  nftCollections: any;

  constructor(
    private _globalVars: GlobalVarsService,
    private backendApi: BackendApiService,
  ) {
    this.globalVars = _globalVars;
  }

  ngOnInit(): void {
    this.loading = true;
    this.backendApi.GetNFTShowcase(
      this.globalVars.localNode, 
      this.globalVars.loggedInUser.PublicKeyBase58Check,
      this.globalVars.loggedInUser.PublicKeyBase58Check,
    ).subscribe(
      (res: any) => {
        this.nftCollections = res.NFTCollections;
      },
      (error) => { this.globalVars._alertError(error.error.error) }
    ).add(() => {this.loading = false});

  }

}

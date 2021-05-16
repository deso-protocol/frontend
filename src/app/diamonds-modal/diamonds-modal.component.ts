import { Component, OnInit, Input } from '@angular/core';
import { BackendApiService } from "../backend-api.service";
import { GlobalVarsService } from "../global-vars.service";

@Component({
  selector: 'diamonds-modal',
  templateUrl: './diamonds-modal.component.html',
})
export class DiamondsModalComponent implements OnInit {
  @Input() postHashHex: string;
  diamonds = [];
  loading = false;
  errorLoading = false;

  constructor(
    private backendApi: BackendApiService,
    public globalVars: GlobalVarsService,
  ) { }

  ngOnInit(): void {
    this.loading = true;

    let readerPubKey = "";
    if(this.globalVars.loggedInUser) {
      readerPubKey = this.globalVars.loggedInUser.PublicKeyBase58Check
    }

    this.backendApi.GetDiamondsForPost(
      this.globalVars.localNode, 
      this.postHashHex, 
      0 /*Offset*/, 
      100 /*Limit*/, 
      this.globalVars.loggedInUser.PublicKeyBase58Check
    ).subscribe(
      (res) => { this.diamonds = res.DiamondSenders },
      (err) => { this.errorLoading = true }
    ).add(() => { this.loading = false })
  }

}

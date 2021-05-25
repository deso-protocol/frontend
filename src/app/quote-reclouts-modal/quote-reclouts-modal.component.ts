import { Component, OnInit, Input } from '@angular/core';
import { BackendApiService } from "../backend-api.service";
import { GlobalVarsService } from "../global-vars.service";
import { BsModalRef } from "ngx-bootstrap/modal";
import { InfiniteScroller } from "../infinite-scroller"
import { Datasource, IAdapter, IDatasource } from "ngx-ui-scroll";

@Component({
  selector: 'quote-reclouts-modal',
  templateUrl: './quote-reclouts-modal.component.html',
})
export class QuoteRecloutsModalComponent implements OnInit {
  @Input() postHashHex: string;
  diamonds = [];
  loading = false;
  errorLoading = false;

  constructor(
    private backendApi: BackendApiService,
    public globalVars: GlobalVarsService,
    public bsModalRef: BsModalRef
  ) { }

  ngOnInit(): void {
    this.loading = true;

    let readerPubKey = "";
    if(this.globalVars.loggedInUser) {
      readerPubKey = this.globalVars.loggedInUser.PublicKeyBase58Check
    }

  }

  // Infinite scroll metadata.
  pageOffset = 0;
  lastPage = null;
  pageSize = 50;

  getPage = (page: number) => {
    // After we have filled the lastPage, do not honor any more requests.
    if (this.lastPage != null && page > this.lastPage) { return []; }
    this.loading = true;
    return this.backendApi.
      GetQuoteRecloutsForPost(
        this.globalVars.localNode, 
        this.postHashHex, 
        this.pageOffset, 
        this.pageSize, 
        this.globalVars.loggedInUser.PublicKeyBase58Check)
      .toPromise()
      .then((res) => {
        let quoteRecloutsPage = res.QuoteReclouts;

        // Update the pageOffset now that we have successfully fetched a page. 
        this.pageOffset += quoteRecloutsPage.length;

        // If we've hit the end of the followers with profiles, set last page and anonymous follower count.
        if (quoteRecloutsPage.length < this.pageSize) { this.lastPage = page; }

        this.loading = false;

        // Return the page.
        return quoteRecloutsPage;
      },(err) => { 
        this.errorLoading = true
      });
  }

  infiniteScroller: InfiniteScroller = new InfiniteScroller(this.pageSize, this.getPage, false);
  datasource: IDatasource<IAdapter<any>> = this.infiniteScroller.getDatasource();
}

import { Component, OnInit, Input } from '@angular/core';
import { BackendApiService } from "../backend-api.service";
import { GlobalVarsService } from "../global-vars.service";
import { BsModalRef } from "ngx-bootstrap/modal";
import { Datasource, IAdapter, IDatasource } from "ngx-ui-scroll";

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
  pagedRequests = { 
    "-1": new Promise((resolve) => {
      resolve([]);
    }),
  };
  lastPage = null;
  pageSize = 25;

  // TODO: Cleanup - Create InfiniteScroller class to de-duplicate this logic.
  datasource: IDatasource<IAdapter<any>> = new Datasource<IAdapter<any>>({
    get: (index, count, success) => {
      const startIdx = Math.max(index, 0);
      const endIdx = index + count - 1;
      if (startIdx > endIdx) {
        success([]);
        return;
      }

      const startPage = Math.floor(startIdx / this.pageSize);
      const endPage = Math.floor(endIdx / this.pageSize);

      const pageRequests: any[] = [];
      for (let i = startPage; i <= endPage; i++) {
        const existingRequest = this.pagedRequests[i];
        if (existingRequest) {
          pageRequests.push(existingRequest);
        } else {
          const newRequest = this.pagedRequests[i - 1].then((_) => {
            return this.getPage(i);
          });
          this.pagedRequests[i] = newRequest;
          pageRequests.push(newRequest);
        }
      }

      return Promise.all(pageRequests).then((pageResults) => {
        pageResults = pageResults.reduce((acc, result) => [...acc, ...result], []);
        const start = startIdx - startPage * this.pageSize;
        const end = start + endIdx - startIdx + 1;
        return pageResults.slice(start, end);
      });
    },
    settings: {
      startIndex: 0,
      minIndex: 0,
      bufferSize: 50,
      windowViewport: false,
    },
  });

  getPage(page: number) {
    // After we have filled the lastPage, do not honor any more requests.
    if (this.lastPage != null && page > this.lastPage) { return []; }
    this.loading = true;
    return this.backendApi.
      GetDiamondsForPost(
        this.globalVars.localNode, 
        this.postHashHex, 
        this.pageOffset, 
        this.pageSize, 
        this.globalVars.loggedInUser.PublicKeyBase58Check)
      .toPromise()
      .then((res) => {
        let diamondSendersPage = res.DiamondSenders;

        // Update the pageOffset now that we have successfully fetched a page. 
        this.pageOffset += diamondSendersPage.length;

        // If we've hit the end of the followers with profiles, set last page and anonymous follower count.
        if (diamondSendersPage.length < this.pageSize) { this.lastPage = page; }

        this.loading = false;

        // Return the page.
        return diamondSendersPage;
      },(err) => { 
        this.errorLoading = true
      });
  }
}

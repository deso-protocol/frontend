import { Component, OnInit, Input } from "@angular/core";
import { BackendApiService } from "../backend-api.service";
import { GlobalVarsService } from "../global-vars.service";
import { InfiniteScroller } from "../infinite-scroller";
import { IAdapter, IDatasource } from "ngx-ui-scroll";
import { ActivatedRoute, Router } from "@angular/router";

@Component({
  selector: "diamonds-modal",
  templateUrl: "./diamonds-modal.component.html",
})
export class DiamondsModalComponent implements OnInit {
  postHashHex: string;
  diamonds = [];
  loading = false;
  errorLoading = false;

  constructor(
    private backendApi: BackendApiService,
    public globalVars: GlobalVarsService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.postHashHex = this.route.snapshot.params.postHashHex;
  }

  // Infinite scroll metadata.
  pageOffset = 0;
  lastPage = null;
  pageSize = 25;

  getPage = (page: number) => {
    // After we have filled the lastPage, do not honor any more requests.
    if (this.lastPage != null && page > this.lastPage) {
      return [];
    }
    this.loading = true;
    return this.backendApi
      .GetDiamondsForPost(
        this.globalVars.localNode,
        this.postHashHex,
        this.pageOffset,
        this.pageSize,
        this.globalVars.loggedInUser.PublicKeyBase58Check
      )
      .toPromise()
      .then(
        (res) => {
          let diamondSendersPage = res.DiamondSenders;

          // Update the pageOffset now that we have successfully fetched a page.
          this.pageOffset += diamondSendersPage.length;

          // If we've hit the end of the followers with profiles, set last page and anonymous follower count.
          if (diamondSendersPage.length < this.pageSize) {
            this.lastPage = page;
          }

          this.loading = false;

          // Return the page.
          return diamondSendersPage;
        },
        (err) => {
          this.errorLoading = true;
        }
      );
  };

  navigateToPost() {
    this.router.navigate(["/" + this.globalVars.RouteNames.POSTS, this.postHashHex], {
      queryParamsHandling: "merge",
    });
  }

  infiniteScroller: InfiniteScroller = new InfiniteScroller(this.pageSize, this.getPage, false);
  datasource: IDatasource<IAdapter<any>> = this.infiniteScroller.getDatasource();
}

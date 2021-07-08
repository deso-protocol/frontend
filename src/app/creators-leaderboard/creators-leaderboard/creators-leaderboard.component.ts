import { Component, EventEmitter, OnInit, Output } from "@angular/core";
import { GlobalVarsService } from "../../global-vars.service";
import { BackendApiService } from "../../backend-api.service";
import { AppRoutingModule } from "../../app-routing.module";
import { CanPublicKeyFollowTargetPublicKeyHelper } from "../../../lib/helpers/follows/can_public_key_follow_target_public_key_helper";
import { Datasource, IDatasource } from "ngx-ui-scroll";
import { Title } from "@angular/platform-browser";

@Component({
  selector: "creators-leaderboard",
  templateUrl: "./creators-leaderboard.component.html",
  styleUrls: ["./creators-leaderboard.component.scss"],
})
export class CreatorsLeaderboardComponent implements OnInit {
  static PAGE_SIZE = 100;

  AppRoutingModule = AppRoutingModule;
  appData: GlobalVarsService;
  profileEntryResponses = [];
  isLeftBarMobileOpen = false;
  isLoadingProfilesForFirstTime = false;
  profilesToShow = [];

  // FIME: Replace with real value
  fakeNumHodlers = Math.ceil(Math.random() * 1000) + 1000;

  // stores a mapping of page number to promises
  pagedRequests = {
    "-1": new Promise((resolve) => {
      resolve([]);
    }),
  };

  // stores a mapping of page number to public key to fetch
  pagedKeys = {
    0: "",
  };

  // tracks if we've reached the end of all notifications
  lastPage = null;

  // TODO: Cleanup - Use InfiniteScroller class to de-duplicate this logic
  datasource: IDatasource = new Datasource({
    get: (index, count, success) => {
      const startIndex = Math.max(index, 0);
      const endIndex = index + count - 1;
      if (startIndex > endIndex) {
        success([]); // empty result
        return;
      }

      const startPage = Math.floor(startIndex / CreatorsLeaderboardComponent.PAGE_SIZE);
      const endPage = Math.floor(endIndex / CreatorsLeaderboardComponent.PAGE_SIZE);

      const pageRequests: any[] = [];
      for (let i = startPage; i <= endPage; i++) {
        const existingRequest = this.pagedRequests[i];
        if (existingRequest) {
          pageRequests.push(existingRequest);
        } else {
          // we need to wait for the previous page before we can fetch the next one
          const newRequest = this.pagedRequests[i - 1].then((_) => {
            return this.getPage(i);
          });
          this.pagedRequests[i] = newRequest;
          pageRequests.push(newRequest);
        }
      }

      return Promise.all(pageRequests).then((pageResults) => {
        pageResults = pageResults.reduce((acc, result) => [...acc, ...result], []);
        const start = startIndex - startPage * CreatorsLeaderboardComponent.PAGE_SIZE;
        const end = start + endIndex - startIndex + 1;
        return pageResults.slice(start, end);
      });
    },
    settings: {
      startIndex: 0,
      minIndex: 0,
      bufferSize: 5,
      windowViewport: true,
      infinite: true,
    },
  });

  constructor(
    private globalVars: GlobalVarsService,
    private backendApi: BackendApiService,
    private titleService: Title
  ) {
    this.appData = globalVars;
  }

  getPage(page: number) {
    if (this.lastPage != null && page > this.lastPage) {
      return [];
    }

    const fetchPubKey = this.pagedKeys[page];
    let readerPubKey = "";
    if (this.globalVars.loggedInUser) {
      readerPubKey = this.globalVars.loggedInUser.PublicKeyBase58Check;
    }

    return this.backendApi
      .GetProfiles(
        this.appData.localNode,
        fetchPubKey /*PublicKeyBase58Check*/,
        null /*Username*/,
        null /*UsernamePrefix*/,
        null /*Description*/,
        BackendApiService.GET_PROFILES_ORDER_BY_INFLUENCER_COIN_PRICE /*Order by*/,
        CreatorsLeaderboardComponent.PAGE_SIZE /*NumToFetch*/,
        readerPubKey /*ReaderPublicKeyBase58Check*/,
        "leaderboard" /*ModerationType*/,
        false /*FetchUsersThatHODL*/,
        false /*AddGlobalFeedBool*/
      )
      .toPromise()
      .then(
        (res) => {
          const chunk = res.ProfilesFound;

          // Index 0 means we're done. if the array is empty we're done.
          // subtract one so we don't fetch the last notification twice
          this.pagedKeys[page + 1] = res.NextPublicKey;

          // if the chunk was incomplete or the Index was zero we're done
          if (chunk.length < CreatorsLeaderboardComponent.PAGE_SIZE || this.pagedKeys[page + 1] === "") {
            this.lastPage = page;
          }

          // We successfully loaded some profiles, so we're no longer loading for the first time
          this.isLoadingProfilesForFirstTime = false;

          return chunk;
        },
        (err) => {
          console.error(this.backendApi.stringifyError(err));
        }
      );
  }

  ngOnInit() {
    this.isLoadingProfilesForFirstTime = true;
    this.titleService.setTitle("Buy Creator Coins - BitClout");
  }

  canLoggedInUserFollowTargetPublicKey(targetPubKeyBase58Check) {
    return CanPublicKeyFollowTargetPublicKeyHelper.execute(
      this.appData.loggedInUser.PublicKeyBase58Check,
      targetPubKeyBase58Check
    );
  }
}

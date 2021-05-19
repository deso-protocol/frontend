import { Component, Input, OnInit } from "@angular/core";
import { GlobalVarsService } from "../../global-vars.service";
import { ActivatedRoute, Router } from "@angular/router";
import { BackendApiService, ProfileEntryResponse } from "../../backend-api.service";
import { RightBarCreatorsComponent } from "../right-bar-creators.component";
import { HttpClient } from "@angular/common/http";
import { forkJoin, of } from "rxjs";
import { catchError } from "rxjs/operators";

@Component({
  selector: "right-bar-creators-leaderboard",
  templateUrl: "./right-bar-creators-leaderboard.component.html",
  styleUrls: ["./right-bar-creators-leaderboard.component.scss"],
})
export class RightBarCreatorsLeaderboardComponent implements OnInit {
  @Input() activeTab: string;

  static MAX_PROFILE_ENTRIES = 10;
  static rando = Math.random();
  RightBarCreatorsComponent = RightBarCreatorsComponent;

  topGainers: any[];
  topGainerProfiles: any[] = [];
  topGainersLoaded = false;

  topDiamonded: any[];
  topDiamondProfiles: any[] = [];
  topDiamondedLoaded = false;

  constructor(
    public globalVars: GlobalVarsService,
    private route: ActivatedRoute,
    private _router: Router,
    private backendApi: BackendApiService,
    private httpClient: HttpClient
  ) {}

  ngOnInit() {
    if (this.globalVars.rightBarLeaderboard.length > 0) {
      return;
    }

    let readerPubKey = "";
    if (this.globalVars.loggedInUser) {
      readerPubKey = this.globalVars.loggedInUser.PublicKeyBase58Check;
    }
    this.backendApi
      .GetProfiles(
        this.globalVars.localNode,
        null /*PublicKeyBase58Check*/,
        null /*Username*/,
        null /*UsernamePrefix*/,
        null /*Description*/,
        BackendApiService.GET_PROFILES_ORDER_BY_INFLUENCER_COIN_PRICE /*Order by*/,
        10 /*NumEntriesToReturn*/,
        readerPubKey /*ReaderPublicKeyBase58Check*/,
        "leaderboard" /*ModerationType*/,
        false /*FetchUsersThatHODL*/,
        false /*AddGlobalFeedBool*/
      )
      .subscribe(
        (response) => {
          this.globalVars.rightBarLeaderboard = response.ProfilesFound.slice(
            0,
            RightBarCreatorsLeaderboardComponent.MAX_PROFILE_ENTRIES
          );
        },
        (err) => {
          console.error(err);
          this.globalVars._alertError("Error loading profiles: " + this.backendApi.stringifyError(err));
        }
      );
    this.httpClient
      .get("https://www.bitcloutpulse.com/api/bitclout/leaderboard/bitclout_locked_24h?ref=bcl")
      .subscribe((res: any) => {
        this.topGainers = res.results;
        forkJoin(
          this.topGainers.map((gainer) =>
            this.backendApi
              .GetSingleProfile(this.globalVars.localNode, gainer["public_key"], null)
              .pipe(catchError((err) => of(null)))
          )
        ).subscribe({
          next: (value: any) => {
            for (let ii = 0; ii < value.length; ii++) {
              if (value[ii]) {
                this.topGainerProfiles.push({
                  Profile: value[ii].Profile,
                  BitcloutLockedGained: this.topGainers[ii]["net_change_24h_bitclout_nanos"],
                });
              }
            }
          },
          // error: (error: any) => {
          //   this.topGainerProfiles.push(null);
          //   console.log(error);
          // },
          complete: () => {
            this.topGainersLoaded = true;
            console.log(this.topGainerProfiles);
          },
        });
      });
    // this.backendApi.GetBitHuntLatestProjects().subscribe((response) => console.log(response));
  }

  getDiamonds(profile: ProfileEntryResponse): number {
    return Math.floor((RightBarCreatorsLeaderboardComponent.rando * profile.CoinEntry.BitCloutLockedNanos) / 1e9);
  }
}

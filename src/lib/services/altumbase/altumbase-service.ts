import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { BackendApiService, ProfileEntryResponse, User } from "../../../app/backend-api.service";
import { Observable, of } from "rxjs";
import { GlobalVarsService } from "../../../app/global-vars.service";
import { map, switchMap } from "rxjs/operators";
import * as _ from "lodash";

class AltumbaseLeaderboardResult {
  public_key: string;
  diamonds_received_24h?: number;
  diamonds_received_value_24h?: number;
}

class AltumbaseLeaderboardResponse {
  data: AltumbaseLeaderboardResult[];
  pagination: {
    current_page: number;
    last_page: number;
  };
}

const Diamonds = "diamonds_received_24h";

export enum AltumbaseLeaderboardType {
  Diamonds = "diamonds_received_24h",
}

export class AltumbaseResponse {
  Profile: ProfileEntryResponse;
  DiamondsReceived: number;
  DiamondsReceivedValue: number;
  User: User;
}

export const LeaderboardToDataAttribute = {
  [AltumbaseLeaderboardType.Diamonds]: "diamonds_received_24h",
};

@Injectable({
  providedIn: "root",
})
export class AltumbaseService {
  static altumbaseApiURL = "https://altumbase.com/api";
  static altumbaseRef = "ref=bcl";
  static altumbasePageSize = 20;
  constructor(
    private httpClient: HttpClient,
    private backendApi: BackendApiService,
    private globalVars: GlobalVarsService
  ) {}

  constructAltumbaseURL(
    leaderboardType: string,
    pageIndex: number = 1,
    pageSize: number = AltumbaseService.altumbasePageSize
  ): string {
    return `${AltumbaseService.altumbaseApiURL}/${leaderboardType}?${AltumbaseService.altumbaseRef}&page_size=${pageSize}&page=${pageIndex}`;
  }

  getDiamondsReceivedLeaderboard(): Observable<any> {
    return this.getDiamondsReceivedPage(0);
  }

  getDiamondsReceivedPage(
    pageNumber: number,
    pageSize: number = AltumbaseService.altumbasePageSize,
    skipFilters = false
  ): Observable<any> {
    return this.httpClient.get(this.constructAltumbaseURL(AltumbaseLeaderboardType.Diamonds, pageNumber, pageSize)).pipe(
      switchMap((res: AltumbaseLeaderboardResponse) => {
        return this.getProfilesForAltumbaseLeaderboard(res, AltumbaseLeaderboardType.Diamonds, skipFilters);
      })
    );
  }

  getProfilesForAltumbaseLeaderboard(
    res: AltumbaseLeaderboardResponse,
    leaderboardType: AltumbaseLeaderboardType,
    skipFilters: boolean = false
  ): Observable<AltumbaseLeaderboardResponse[]> {
    const results = res.data;

    if (results.length === 0) {
      return of([]);
    }
    return this.backendApi
      .GetUsersStateless(
        this.globalVars.localNode,
        results.map((result) => result.public_key),
        true
      )
      .pipe(
        map((res: any) => {
          if (!skipFilters) {
            res.UserList = _.filter(
              res.UserList,
              (o) => o.ProfileEntryResponse !== null && !o.IsGraylisted && !o.IsBlacklisted
            );
            if (res.UserList.length > 10) {
              res.UserList = res.UserList.slice(0, 10);
            }
          }
          return res.UserList.map((user: User, index: number) => {
            return  {
              User: user,
              Profile: user.ProfileEntryResponse,
              DiamondsReceived:
                leaderboardType === AltumbaseLeaderboardType.Diamonds
                  ? results[index][LeaderboardToDataAttribute[leaderboardType]]
                  : null,
              DiamondsReceivedValue:
                leaderboardType === AltumbaseLeaderboardType.Diamonds
                  ? results[index]["diamonds_received_value_24h"]
                  : null,
            };
          });
        })

      );
  }
}

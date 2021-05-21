import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { BackendApiService, ProfileEntryResponse } from "../../../app/backend-api.service";
import { forkJoin, Observable, of } from "rxjs";
import { GlobalVarsService } from "../../../app/global-vars.service";
import { catchError, map } from "rxjs/operators";

class PulseLeaderboardResult {
  public_key: string;
  diamonds?: number;
  net_change_24h_bitclout_nanos?: number;
}

class PulseLeaderboardResponse {
  results: PulseLeaderboardResult[];
  pagination: {
    current_page: number;
    total_pages: number;
  };
}

const BitCloutLocked = "bitclout_locked_24h";
const Diamonds = "diamonds_received_24h";

export enum PulseLeaderboardType {
  BitCloutLocked = "bitclout_locked_24h",
  Diamonds = "diamonds_received_24h",
}

export class LeaderboardResponse {
  Profile: ProfileEntryResponse;
  BitCloutLockedGained: number;
  DiamondsReceived: number;
}

export const LeaderboardToDataAttribute = {
  [PulseLeaderboardType.BitCloutLocked]: "net_change_24h_bitclout_nanos",
  [PulseLeaderboardType.Diamonds]: "diamonds",
};

@Injectable({
  providedIn: "root",
})
export class PulseService {
  static pulseApiURL = "https://pulse.bitclout.com/api/bitclout/leaderboard";
  static pulseRef = "ref=bcl";

  constructor(
    private httpClient: HttpClient,
    private backendApi: BackendApiService,
    private globalVars: GlobalVarsService
  ) {}

  constructPulseURL(leaderboardType: string): string {
    return `${PulseService.pulseApiURL}/${leaderboardType}?${PulseService.pulseRef}`;
  }

  getDiamondsReceivedLeaderboard(): Observable<any> {
    return this.httpClient.get(this.constructPulseURL(PulseLeaderboardType.Diamonds));
  }

  getBitCloutLockedLeaderboard(): Observable<any> {
    return this.httpClient.get(this.constructPulseURL(PulseLeaderboardType.BitCloutLocked));
  }

  getProfilesForPulseLeaderboard(
    res: PulseLeaderboardResponse,
    leaderboardType: PulseLeaderboardType
  ): Observable<any> {
    const results = res.results;
    return forkJoin(
      results.map((result) =>
        this.backendApi.GetSingleProfile(this.globalVars.localNode, result.public_key, null).pipe(
          catchError((err) => of(null)),
          map((res: { Profile: ProfileEntryResponse }, index: number) => {
            return {
              Profile: res.Profile,
              BitCloutLockedGained:
                leaderboardType === PulseLeaderboardType.BitCloutLocked
                  ? results[index][LeaderboardToDataAttribute[leaderboardType]]
                  : null,
              DiamondsReceived:
                leaderboardType === PulseLeaderboardType.Diamonds
                  ? results[index][LeaderboardToDataAttribute[leaderboardType]]
                  : null,
            };
          })
        )
      )
    );
  }
}

import { HttpClient } from "@angular/common/http";
import { forkJoin, Observable, of } from "rxjs";
import { BackendApiService, ProfileEntryResponse, User } from "../../../app/backend-api.service";
import { GlobalVarsService } from "../../../app/global-vars.service";
import { map, switchMap } from "rxjs/operators";
import { flatten } from "lodash";
import * as _ from "lodash";

class BithuntLeaderboardResponse {
  projects: BithuntProject[];
}

class BithuntProject {
  bio: string;
  bitclout_public_key: string;
  bitclout_url: string;
  bitclout_username: string;
  bitclout_verified: boolean;
  created_at: string;
  id: number;
  name: string;
  slug: string;
  website_url: string;
}

export class CommunityProject {
  Profile: ProfileEntryResponse;
  BithuntProject: BithuntProject;
}

const bithuntURL = "https://bithunt.bitclout.com/public/projects";

export class BithuntService {
  static bithuntPageSize = 25
  constructor(
    private httpClient: HttpClient,
    private backendApi: BackendApiService,
    private globalVars: GlobalVarsService
  ) {}

  getCommunityProjectsLeaderboard(): Observable<CommunityProject[]> {
    const pages = Array.apply(null, { length: 10 });
    return forkJoin(pages.map((_, index: number) => this.getCommunityProjectsLeaderboardPage(index))).pipe(
      map((res: CommunityProject[][]) => {
        const projects = flatten(res);
        return projects
          .filter((project: CommunityProject) => project.Profile)
          .sort((a, b) => {
            return b.Profile.CoinEntry.BitCloutLockedNanos - a.Profile.CoinEntry.BitCloutLockedNanos;
          });
      })
    );
  }

  getCommunityProjectsLeaderboardPage(
    page: number,
    limit: number = BithuntService.bithuntPageSize,
    skipFilters: boolean = false
  ): Observable<CommunityProject[]> {
    return this.httpClient
      .get(`${bithuntURL}?page=${page + 1}&limit=${limit}`, {
        headers: {
          Accept: "application/json",
        },
      })
      .pipe(switchMap((res: BithuntLeaderboardResponse) => this.getProfilesForBithuntLeaderboard(res, skipFilters)));
  }

  getProfilesForBithuntLeaderboard(
    projects: BithuntLeaderboardResponse,
    skipFilters: boolean = false
  ): Observable<CommunityProject[]> {
    if (projects.projects.length === 0) {
      return of([]);
    }
    return this.backendApi
      .GetUsersStateless(
        this.globalVars.localNode,
        projects.projects.map((result) => result.bitclout_public_key),
        true
      )
      .pipe(
        map((res: any) => {
          if (!skipFilters) {
            res.UserList = _.filter(res.UserList, (o) => !o.IsGraylisted && !o.IsBlacklisted);
          }

          return res.UserList.map((user: User, index: number) => {
            return {
              User: user,
              Profile: user.ProfileEntryResponse,
              BithuntProject: projects.projects[index],
            };
          });
        })
      );
  }
}

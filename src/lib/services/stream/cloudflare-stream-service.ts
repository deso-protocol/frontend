import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { BackendApiService } from "../../../app/backend-api.service";
import { Observable, of } from "rxjs";
import { GlobalVarsService } from "../../../app/global-vars.service";
import { catchError, map } from "rxjs/operators";
import { environment } from "../../../environments/environment";

@Injectable({
  providedIn: "root",
})
export class CloudflareStreamService {
  constructor(
    private httpClient: HttpClient,
    private backendApi: BackendApiService,
    private globalVars: GlobalVarsService
  ) {}

  extractVideoID(url: string): string {
    const regExp = /^https:\/\/iframe\.videodelivery\.net\/([A-Za-z0-9]+)$/;
    const match = url.match(regExp);
    return match && match[1] ? match[1] : "";
  }

  // Returns two booleans - the first indicates if a video is ready to stream, the second indicates if we should stop polling
  checkVideoStatusByVideoID(videoID: string): Observable<[boolean, boolean]> {
    if (videoID === "") {
      console.error("invalid VideoID");
      return of([false, true]);
    }
    return this.backendApi.GetVideoStatus(environment.uploadVideoHostname, videoID).pipe(
      catchError((error) => {
        console.error(error);
        return of({
          ReadyToStream: false,
          Error: error,
        });
      }),
      map((res) => {
        return [res.ReadyToStream, res.Error || res.ReadyToStream];
      })
    );
  }

  checkVideoStatusByURL(videoURL: string): Observable<[boolean, boolean]> {
    const videoID = this.extractVideoID(videoURL);
    if (videoID == "") {
      console.error("unable to extract VideoID");
      return of([false, true]);
    }
    return this.checkVideoStatusByVideoID(this.extractVideoID(videoURL));
  }
}

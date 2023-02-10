import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BackendApiService } from '../../../app/backend-api.service';
import { Observable, of } from 'rxjs';
import { GlobalVarsService } from '../../../app/global-vars.service';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
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
    return match && match[1] ? match[1] : '';
  }

  // Returns two booleans - the first indicates if a video is ready to stream, the second indicates if we should stop polling
  checkVideoStatusByVideoID(
    assetId: string
  ): Promise<[boolean, boolean, boolean]> {
    if (assetId === '') {
      console.error('invalid VideoID');
      return Promise.resolve([false, true, true]);
    }
    return this.backendApi
      .GetVideoStatus(environment.uploadVideoHostname, assetId)
      .toPromise()
      .then(({ status }) => {
        const phase = status?.phase;
        if (phase === 'ready') {
          return [true, true, false];
        } else if (phase === 'failed') {
          return [false, true, true];
        } else {
          return [false, false, false];
        }
      });
  }

  checkVideoStatusByURL(assetId: string): Promise<[boolean, boolean, boolean]> {
    if (assetId == '') {
      console.error('unable to extract VideoID');
      return Promise.resolve([false, true, true]);
    }
    return this.checkVideoStatusByVideoID(assetId);
  }
}

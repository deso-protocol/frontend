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

  checkVideoStatusById(assetId: string): Promise<[boolean, boolean]> {
    if (assetId === '') {
      console.error('invalid VideoID');
      return Promise.resolve([false, true]);
    }

    return this.backendApi.GetVideoStatus(assetId).then((status) => {
      const phase = status?.phase;
      if (phase === 'ready') {
        return [true, true];
      }
    });
  }

  checkVideoStatusByURL(assetId: string): Promise<[boolean, boolean]> {
    if (assetId == '') {
      console.error('unable to extract VideoID');
      return Promise.resolve([false, true]);
    }
    return this.checkVideoStatusById(assetId);
  }
}

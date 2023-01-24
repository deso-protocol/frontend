import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Pipe({
  name: 'sanitizeVideoUrl',
})
export class SanitizeVideoUrlPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}
  transform(videoURL: string) {
    let url;
    try {
      url = new URL(videoURL);
    } catch (err) {
      return false;
    }
    // TODO: check if the URL is a valid video URL
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}

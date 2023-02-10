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
    // On this node, we also validate that it matches the expect video URL format
    const regExp = /^https:\/\/lvpr.tv\/\?v=[A-Za-z0-9]+$|^https:\/\/iframe\.videodelivery\.net\/[A-Za-z0-9]+[A-Za-z0-9]+(\?([A-Za-z0-9]+\=[A-Za-z0-9]+\&?)*)?$/;
    const match = videoURL.match(regExp);
    return (
      match && match[0] && this.sanitizer.bypassSecurityTrustResourceUrl(url)
    );
  }
}

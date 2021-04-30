import { Pipe, PipeTransform } from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";
import { VideoUrlParserService } from "../services/video-url-parser-service/video-url-parser-service";

@Pipe({
  name: "sanitizeVideoEmbed",
})
export class SanitizeVideoEmbedPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}
  transform(url) {
    return VideoUrlParserService.isValidEmbedURL(url) ? this.sanitizer.bypassSecurityTrustResourceUrl(url) : false;
  }
}

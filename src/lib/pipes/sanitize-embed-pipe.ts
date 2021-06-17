import { Pipe, PipeTransform } from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";
import { EmbedUrlParserService } from "../services/embed-url-parser-service/embed-url-parser-service";

@Pipe({
  name: "sanitizeEmbed",
})
export class SanitizeEmbedPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}
  transform(url) {
    return EmbedUrlParserService.isValidEmbedURL(url) ? this.sanitizer.bypassSecurityTrustResourceUrl(url) : false;
  }
}

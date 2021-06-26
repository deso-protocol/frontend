import { Pipe, PipeTransform } from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";

@Pipe({
  name: "sanitizeQRCode",
})
export class SanitizeQRCodePipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}
  transform(url) {
    const regExp = /[A-Za-z0-9.:]{0,30}\/send-bitclout\?public_key=[A-Za-z0-9]{54,55}/;
    if (!url.match(regExp)) {
      return false;
    }
    return this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://quickchart.io/qr?size=300&text=${encodeURIComponent(url)}`
    );
  }
}

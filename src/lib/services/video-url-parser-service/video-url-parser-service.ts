import { Injectable } from "@angular/core";
import { BackendApiService } from "../../../app/backend-api.service";
import { GlobalVarsService } from "../../../app/global-vars.service";
import { Observable, of } from "rxjs";
import { map } from "rxjs/operators";

@Injectable({
  providedIn: "root",
})
export class VideoUrlParserService {
  // This regex helps extract the correct videoID from the various forms of URLs that identify a youtube video.
  static youtubeParser(url): string | boolean {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([A-Za-z0-9_-]{11}).*/;
    const match = url.match(regExp);
    return match && match[7].length === 11 ? match[7] : false;
  }

  static constructYoutubeEmbedURL(url: URL): string {
    const youtubeVideoID = this.youtubeParser(url.toString());
    // If we can't find the videoID, return the empty string which stops the iframe from loading.
    return youtubeVideoID ? `https://www.youtube.com/embed/${youtubeVideoID}` : "";
  }

  // Vimeo video URLs are simple -- anything after the last "/" in the url indicates the videoID.
  static vimeoParser(url: string): string | boolean {
    const regExp = /^.*((player\.)?vimeo\.com\/)(video\/)?(\d{0,15}).*/;
    const match = url.match(regExp);
    return match && match[4] ? match[4] : false;
  }

  static constructVimeoEmbedURL(url: URL): string {
    const vimeoVideoID = this.vimeoParser(url.toString());
    return vimeoVideoID ? `https://player.vimeo.com/video/${vimeoVideoID}` : "";
  }

  static extractTikTokVideoID(fullTikTokURL: string): string | boolean {
    const regExp = /^.*((tiktok\.com\/)(v\/)|(@[A-Za-z0-9_-]{2,24}\/video\/)|(embed\/v2\/))(\d{0,30}).*/;
    const match = fullTikTokURL.match(regExp);
    return match && match[6] ? match[6] : false;
  }

  static tiktokParser(
    backendApi: BackendApiService,
    globalVars: GlobalVarsService,
    url: string
  ): Observable<string | boolean> {
    let tiktokURL;
    try {
      tiktokURL = new URL(url);
    } catch (e) {
      return of(false);
    }
    if (tiktokURL.hostname === "vm.tiktok.com") {
      const regExp = /^.*(vm\.tiktok\.com\/)([A-Za-z0-9]{6,12}).*/;
      const match = url.match(regExp);
      if (!match || !match[2]) {
        return of(false);
      }
      return backendApi.GetFullTikTokURL(globalVars.localNode, match[2]).pipe(
        map((res) => {
          return this.extractTikTokVideoID(res);
        })
      );
    } else {
      return of(this.extractTikTokVideoID(url));
    }
  }

  static constructTikTokEmbedURL(
    backendApi: BackendApiService,
    globalVars: GlobalVarsService,
    url: URL
  ): Observable<string> {
    return this.tiktokParser(backendApi, globalVars, url.toString()).pipe(
      map((res) => {
        return res ? `https://www.tiktok.com/embed/v2/${res}` : "";
      })
    );
  }

  static getEmbedVideoURL(
    backendApi: BackendApiService,
    globalVars: GlobalVarsService,
    embedVideoURL: string
  ): Observable<string> {
    if (!embedVideoURL) {
      return of("");
    }
    let url;
    try {
      url = new URL(embedVideoURL);
    } catch (e) {
      // If the embed video URL doesn't start with http(s), try the url with that as a prefix.
      if (!embedVideoURL.startsWith("https://") && !embedVideoURL.startsWith("http://")) {
        return this.getEmbedVideoURL(backendApi, globalVars, `https://${embedVideoURL}`);
      }
      return of("");
    }
    if (this.isYoutubeFromURL(url)) {
      return of(this.constructYoutubeEmbedURL(url));
    }
    if (this.isVimeoFromURL(url)) {
      return of(this.constructVimeoEmbedURL(url));
    }
    if (this.isTiktokFromURL(url)) {
      return this.constructTikTokEmbedURL(backendApi, globalVars, url);
    }
    return of("");
  }

  static isVimeoLink(link: string): boolean {
    try {
      const url = new URL(link);
      return this.isVimeoFromURL(url);
    } catch (e) {
      return false;
    }
  }

  static isVimeoFromURL(url: URL): boolean {
    const pattern = /\bvimeo\.com$/;
    return pattern.test(url.hostname);
  }

  static isYoutubeLink(link: string): boolean {
    try {
      const url = new URL(link);
      return this.isYoutubeFromURL(url);
    } catch (e) {
      return false;
    }
  }

  static isYoutubeFromURL(url: URL): boolean {
    const patterns = [
      /\byoutube\.com$/,
      /\byoutu\.be$/,
    ];
    return patterns.some(p => p.test(url.hostname));
  }

  static isTikTokLink(link: string): boolean {
    try {
      const url = new URL(link);
      return this.isTiktokFromURL(url);
    } catch (e) {
      return false;
    }
  }

  static isTiktokFromURL(url: URL): boolean {
    const pattern = /\btiktok\.com$/;
    return pattern.test(url.hostname);
  }

  static isValidVimeoEmbedURL(link: string) {
    const regExp = /(https:\/\/player\.vimeo\.com\/video\/(\d{0,15}))/;
    return !!link.match(regExp);
  }

  static isValidYoutubeEmbedURL(link: string) {
    const regExp = /(https:\/\/www\.youtube\.com\/embed\/[A-Za-z0-9_-]{11})/;
    return !!link.match(regExp);
  }

  // https://www.tiktok.com/oembed?url=https://www.tiktok.com/@thelavignes/video/6958254201961057542
  static isValidTiktokEmbedURL(link: string) {
    // `https://www.tiktok.com/embed/v2/${tiktokVideoID}
    const regExp = /(https:\/\/www\.tiktok\.com\/embed\/v2\/(\d{0,30}))/;
    return !!link.match(regExp);
  }

  static isValidEmbedURL(link: string): boolean {
    if (link) {
      return this.isValidVimeoEmbedURL(link) || this.isValidYoutubeEmbedURL(link) || this.isValidTiktokEmbedURL(link);
    }
    return false;
  }

  static getEmbedHeight(link: string): number {
    if (this.isValidTiktokEmbedURL(link)) {
      return 700;
    }
    return 315;
  }
}

import { Injectable } from "@angular/core";
import { BackendApiService } from "../../../app/backend-api.service";
import { GlobalVarsService } from "../../../app/global-vars.service";
import { Observable, of } from "rxjs";
import { map } from "rxjs/operators";

@Injectable({
  providedIn: "root",
})
export class EmbedUrlParserService {
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

  static giphyParser(url: string): string | boolean {
    const regExp = /^.*((media\.)?giphy\.com\/(gifs|media|embed|clips)\/)([A-Za-z0-9]+-)*([A-Za-z0-9]{0,20}).*/;
    const match = url.match(regExp);
    return match && match[5] ? match[5] : false;
  }

  static constructGiphyEmbedURL(url: URL): string {
    const giphyId = this.giphyParser(url.toString());
    return giphyId ? `https://giphy.com/embed/${giphyId}` : "";
  }

  static spotifyParser(url: string): string | boolean {
    const regExp = /^.*(open\.)?spotify\.com\/(((embed\/)?(track|artist|playlist|album))|((embed-podcast\/)?(episode|show)))\/([A-Za-z0-9]{0,25}).*/;
    const match = url.match(regExp);
    if (match && match[9]) {
      if (match[8]) {
        return `embed-podcast/${match[8]}/${match[9]}`;
      }
      if (match[5]) {
        return `embed/${match[5]}/${match[9]}`;
      }
    }
    return false;
  }

  static constructSpotifyEmbedURL(url: URL): string {
    const spotifyEmbedSuffix = this.spotifyParser(url.toString());
    return spotifyEmbedSuffix ? `https://open.spotify.com/${spotifyEmbedSuffix}` : "";
  }

  static soundCloudParser(url: string): string | boolean {
    const regExp = /^.*(soundcloud.com\/([a-z0-9-_]+)\/(sets\/)?([a-z0-9-_]+)).*/;
    const match = url.match(regExp);
    return match && match[1] ? match[1] : false;
  }

  static constructSoundCloudEmbedURL(url: URL): string {
    const soundCloudURL = this.soundCloudParser(url.toString());
    return soundCloudURL
      ? `https://w.soundcloud.com/player/?url=https://${soundCloudURL}?hide_related=true&show_comments=false`
      : "";
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

  static getEmbedURL(
    backendApi: BackendApiService,
    globalVars: GlobalVarsService,
    embedURL: string
  ): Observable<string> {
    if (!embedURL) {
      return of("");
    }
    let url;
    try {
      url = new URL(embedURL);
    } catch (e) {
      // If the embed video URL doesn't start with http(s), try the url with that as a prefix.
      if (!embedURL.startsWith("https://") && !embedURL.startsWith("http://")) {
        return this.getEmbedURL(backendApi, globalVars, `https://${embedURL}`);
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
    if (this.isGiphyFromURL(url)) {
      return of(this.constructGiphyEmbedURL(url));
    }
    if (this.isSpotifyFromURL(url)) {
      return of(this.constructSpotifyEmbedURL(url));
    }
    if (this.isSoundCloudFromURL(url)) {
      return of(this.constructSoundCloudEmbedURL(url));
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
    const patterns = [/\byoutube\.com$/, /\byoutu\.be$/];
    return patterns.some((p) => p.test(url.hostname));
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

  static isGiphyLink(link: string): boolean {
    try {
      const url = new URL(link);
      return this.isGiphyFromURL(url);
    } catch (e) {
      return false;
    }
  }

  static isGiphyFromURL(url: URL): boolean {
    const pattern = /\bgiphy\.com$/;
    return pattern.test(url.hostname);
  }

  static isSpotifyLink(link: string): boolean {
    try {
      const url = new URL(link);
      return this.isSpotifyFromURL(url);
    } catch (e) {
      return false;
    }
  }

  static isSpotifyFromURL(url: URL): boolean {
    const pattern = /\bspotify\.com$/;
    return pattern.test(url.hostname);
  }

  static isSoundCloudLink(link: string): boolean {
    try {
      const url = new URL(link);
      return this.isSoundCloudFromURL(url);
    } catch (e) {
      return false;
    }
  }

  static isSoundCloudFromURL(url: URL): boolean {
    const pattern = /\bsoundcloud\.com$/;
    return pattern.test(url.hostname);
  }

  static isValidVimeoEmbedURL(link: string): boolean {
    const regExp = /(https:\/\/player\.vimeo\.com\/video\/(\d{0,15}))$/;
    return !!link.match(regExp);
  }

  static isValidYoutubeEmbedURL(link: string): boolean {
    const regExp = /(https:\/\/www\.youtube\.com\/embed\/[A-Za-z0-9_-]{11})$/;
    return !!link.match(regExp);
  }

  static isValidTiktokEmbedURL(link: string): boolean {
    const regExp = /(https:\/\/www\.tiktok\.com\/embed\/v2\/(\d{0,30}))$/;
    return !!link.match(regExp);
  }

  static isValidGiphyEmbedURL(link: string): boolean {
    const regExp = /(https:\/\/giphy\.com\/embed\/([A-Za-z0-9]{0,20}))$/;
    return !!link.match(regExp);
  }

  static isValidSpotifyEmbedURL(link: string): boolean {
    const regExp = /(https:\/\/open.spotify.com\/(((embed\/)(track|artist|playlist|album))|((embed-podcast\/)(episode|show)))\/[A-Za-z0-9]{0,25})$/;
    return !!link.match(regExp);
  }

  static isValidSoundCloudEmbedURL(link: string): boolean {
    const regExp = /(https:\/\/w\.soundcloud\.com\/player\/\?url=https:\/\/soundcloud.com\/([a-z0-9-_]+)\/(sets\/)?([a-z0-9-_]+))\?hide_related=true&show_comments=false$/;
    return !!link.match(regExp);
  }

  static isValidEmbedURL(link: string): boolean {
    if (link) {
      return (
        this.isValidVimeoEmbedURL(link) ||
        this.isValidYoutubeEmbedURL(link) ||
        this.isValidTiktokEmbedURL(link) ||
        this.isValidGiphyEmbedURL(link) ||
        this.isValidSpotifyEmbedURL(link) ||
        this.isValidSoundCloudEmbedURL(link)
      );
    }
    return false;
  }

  static getEmbedHeight(link: string): number {
    if (this.isValidTiktokEmbedURL(link)) {
      return 700;
    }
    if (this.isValidSpotifyEmbedURL(link)) {
      return link.indexOf("embed-podcast") > -1 ? 232 : 380;
    }
    if (this.isValidSoundCloudEmbedURL(link)) {
      return link.indexOf("/sets/") > -1 ? 350 : 180;
    }
    return 315;
  }

  static getEmbedWidth(link: string): string {
    return this.isValidTiktokEmbedURL(link) ? "325px" : "";
  }
}

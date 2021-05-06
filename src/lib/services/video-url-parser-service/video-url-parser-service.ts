import { Injectable } from "@angular/core";
import { BackendApiService } from "../../../app/backend-api.service";
import { GlobalVarsService } from "../../../app/global-vars.service";

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
    if (!youtubeVideoID) {
      return "";
    }
    return `https://www.youtube.com/embed/${youtubeVideoID}`;
  }

  // Vimeo video URLs are simple -- anything after the last "/" in the url indicates the videoID.
  static vimeoParser(url: string): string | boolean {
    const regExp = /^.*((player\.)?vimeo\.com\/)(video\/)?(\d{0,15}).*/;
    const match = url.match(regExp);
    return match && match[4] ? match[4] : false;
  }

  static constructVimeoEmbedURL(url: URL): string {
    const vimeoVideoID = this.vimeoParser(url.toString());
    if (!vimeoVideoID) {
      return "";
    }
    return `https://player.vimeo.com/video/${vimeoVideoID}`;
  }

  static async tiktokParser(
    backendApi: BackendApiService,
    globalVars: GlobalVarsService,
    url: string
  ): Promise<string | boolean> {
    let fullTikTokURL = url;
    try {
      const tiktokURL = new URL(url);
      if (tiktokURL.hostname === "vm.tiktok.com") {
        const regExp = /^.*(vm\.tiktok\.com\/)([A-Za-z0-9]{6,12}).*/;
        const match = url.match(regExp);
        if (match && match[2]) {
          fullTikTokURL = await backendApi
            .GetFullTikTokURL(globalVars.localNode, globalVars.loggedInUser.PublicKeyBase58Check, match[2])
            .toPromise()
            .then(
              (res) => {
                return res.FullTikTokURL;
              },
              () => {
                return false;
              }
            );
          if (!fullTikTokURL) {
            return false;
          }
        } else {
          return false;
        }
      }
    } catch (e) {
      return false;
    }
    const regExp = /^.*((tiktok\.com\/)(v\/)|(@[A-Za-z0-9_-]{2,24}\/video\/)|(embed\/v2\/))(\d{0,30}).*/;
    const match = fullTikTokURL.match(regExp);
    return match && match[6] ? match[6] : false;
  }

  static async constructTikTokEmbedURL(
    backendApi: BackendApiService,
    globalVars: GlobalVarsService,
    url: URL
  ): Promise<string> {
    const tiktokVideoID = await this.tiktokParser(backendApi, globalVars, url.toString());
    if (!tiktokVideoID) {
      return "";
    }
    return `https://www.tiktok.com/embed/v2/${tiktokVideoID}`;
  }

  static async getEmbedVideoURL(
    backendApi: BackendApiService,
    globalVars: GlobalVarsService,
    embedVideoURL: string
  ): Promise<string> {
    if (embedVideoURL) {
      try {
        const url = new URL(embedVideoURL);
        if (this.isYoutubeFromURL(url)) {
          return this.constructYoutubeEmbedURL(url);
        }
        if (this.isVimeoFromURL(url)) {
          return this.constructVimeoEmbedURL(url);
        }
        if (this.isTiktokFromURL(url)) {
          return await this.constructTikTokEmbedURL(backendApi, globalVars, url);
        }
        return "";
      } catch (e) {
        // If the embed video URL doesn't start with http(s), try the url with that as a prefix.
        if (!embedVideoURL.startsWith("https://") && !embedVideoURL.startsWith("http://")) {
          return this.getEmbedVideoURL(backendApi, globalVars, `https://${embedVideoURL}`);
        }
        return "";
      }
    }
    return "";
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
    return url.hostname.endsWith("vimeo.com");
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
    return url.hostname.endsWith("youtube.com") || url.hostname.endsWith("youtu.be");
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
    return url.hostname.endsWith("tiktok.com");
  }

  static isValidVimeoEmbedURL(link: string) {
    const regExp = /(https:\/\/player\.vimeo\.com\/video\/(\d{0,15}))/;
    return !!link.match(regExp);
  }

  static isValidYoutubeEmbedURL(link: string) {
    const regExp = /(https:\/\/www.youtube.com\/embed\/[A-Za-z0-9_-]{11})/;
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
    if (this.isValidVimeoEmbedURL(link) || this.isValidYoutubeEmbedURL(link)) {
      return 315;
    }
    if (this.isValidTiktokEmbedURL(link)) {
      return 750;
    }
    return 315;
  }
}

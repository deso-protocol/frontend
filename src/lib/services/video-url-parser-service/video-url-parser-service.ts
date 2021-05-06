import { Injectable } from "@angular/core";

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
    return `https://www.youtube-nocookie.com/embed/${youtubeVideoID}`;
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

  static getEmbedVideoURL(embedVideoURL: string): string {
    if (embedVideoURL) {
      try {
        const url = new URL(embedVideoURL);
        if (this.isYoutubeFromURL(url)) {
          return this.constructYoutubeEmbedURL(url);
        }
        if (this.isVimeoFromURL(url)) {
          return this.constructVimeoEmbedURL(url);
        }
        return "";
      } catch (e) {
        // If the embed video URL doesn't start with http(s), try the url with that as a prefix.
        if (!embedVideoURL.startsWith("https://") && !embedVideoURL.startsWith("http://")) {
          return this.getEmbedVideoURL(`https://${embedVideoURL}`);
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

  static isValidVimeoEmbedURL(link: string) {
    const regExp = /(https:\/\/player\.vimeo\.com\/video\/(\d{0,15}))/;
    return !!link.match(regExp);
  }

  static isValidYoutubeEmbedURL(link: string) {
    const regExp = /(https:\/\/www.youtube.com\/embed\/[A-Za-z0-9_-]{11})/;
    return !!link.match(regExp);
  }

  static isValidEmbedURL(link: string): boolean {
    if (link) {
      return this.isValidVimeoEmbedURL(link) || this.isValidYoutubeEmbedURL(link);
    }
    return false;
  }
}

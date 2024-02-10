import { Injectable } from '@angular/core';
import { BackendApiService } from '../../../app/backend-api.service';
import { GlobalVarsService } from '../../../app/global-vars.service';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
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
    return youtubeVideoID
      ? `https://www.youtube.com/embed/${youtubeVideoID}`
      : '';
  }

  static mousaiParser(url): string | boolean {
    const regExp = /^.*mousai\.stream\/((album|playlist|track)\/[0-9]+(\/[a-z0-9-_,#%]+){1,2}?)(?=(\/embed|$))/;
    const match = url.match(regExp);
    return match ? match[1] : false;
  }

  static constructMousaiEmbedURL(url: URL): string {
    const mousaiPath = this.mousaiParser(url.toString());
    return typeof mousaiPath === 'string'
      ? `https://mousai.stream/${mousaiPath
          .split('/')
          .map((s) => encodeURIComponent(s))
          .join('/')}/embed`
      : '';
  }

  // Vimeo video URLs are simple -- anything after the last "/" in the url indicates the videoID.
  static vimeoParser(url: string): string | boolean {
    const regExp = /^.*((player\.)?vimeo\.com\/)(video\/)?(\d{0,15}).*/;
    const match = url.match(regExp);
    return match && match[4] ? match[4] : false;
  }

  static constructVimeoEmbedURL(url: URL): string {
    const vimeoVideoID = this.vimeoParser(url.toString());
    return vimeoVideoID ? `https://player.vimeo.com/video/${vimeoVideoID}` : '';
  }

  static giphyParser(url: string): string | boolean {
    const regExp = /^.*((media\.)?giphy\.com\/(gifs|media|embed|clips)\/)([A-Za-z0-9]+-)*([A-Za-z0-9]{0,20}).*/;
    const match = url.match(regExp);
    return match && match[5] ? match[5] : false;
  }

  static constructGiphyEmbedURL(url: URL): string {
    const giphyId = this.giphyParser(url.toString());
    return giphyId ? `https://giphy.com/embed/${giphyId}` : '';
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
    return spotifyEmbedSuffix
      ? `https://open.spotify.com/${spotifyEmbedSuffix}`
      : '';
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
      : '';
  }

  static twitchParser(url: string): string | boolean {
    const regExp = /^.*((player\.|clips\.)?twitch\.tv)\/(videos\/(\d{8,12})|\?video=(\d{8,12})|\?channel=([A-Za-z0-9_]{1,30})|collections\/([A-Za-z0-9]{10,20})|\?collection=([A-Za-z0-9]{10,20}(&video=\d{8,12})?)|embed\?clip=([A-Za-z0-9_-]{1,80})|([A-Za-z0-9_]{1,30}(\/clip\/([A-Za-z0-9_-]{1,80}))?)).*/;
    const match = url.match(regExp);
    if (match && match[3]) {
      // https://www.twitch.tv/videos/1234567890
      if (match[3].startsWith('videos') && match[4]) {
        return `player.twitch.tv/?video=${match[4]}`;
      }
      // https://player.twitch.tv/?video=1234567890&parent=www.example.com
      if (match[3].startsWith('?video=') && match[5]) {
        return `player.twitch.tv/?video=${match[5]}`;
      }
      // https://player.twitch.tv/?channel=xxxyyy123&parent=www.example.com
      if (match[3].startsWith('?channel=') && match[6]) {
        return `player.twitch.tv/?channel=${match[6]}`;
      }
      // https://www.twitch.tv/xxxyyy123
      if (
        match[3] &&
        match[11] &&
        match[3] === match[11] &&
        !match[12] &&
        !match[13]
      ) {
        return `player.twitch.tv/?channel=${match[11]}`;
      }
      // https://www.twitch.tv/xxyy_1234m/clip/AbCD123JMn-rrMMSj1239G7
      if (match[12] && match[13]) {
        return `clips.twitch.tv/embed?clip=${match[13]}`;
      }
      // https://clips.twitch.tv/embed?clip=AbCD123JMn-rrMMSj1239G7&parent=www.example.com
      if (match[10]) {
        return `clips.twitch.tv/embed?clip=${match[10]}`;
      }
      // https://www.twitch.tv/collections/11jaabbcc2yM989x?filter=collections
      if (match[7]) {
        return `player.twitch.tv/?collection=${match[7]}`;
      }
      // https://player.twitch.tv/?collection=11jaabbcc2yM989x&video=1234567890&parent=www.example.com
      if (match[8]) {
        return `player.twitch.tv/?collection=${match[8]}`;
      }
    }
    return false;
  }

  static constructTwitchEmbedURL(url: URL): string {
    const twitchParsed = this.twitchParser(url.toString());
    return twitchParsed ? `https://${twitchParsed}` : '';
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
    if (tiktokURL.hostname === 'vm.tiktok.com') {
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
        return res ? `https://www.tiktok.com/embed/v2/${res}` : '';
      })
    );
  }

  static getEmbedURL(
    backendApi: BackendApiService,
    globalVars: GlobalVarsService,
    embedURL: string
  ): Observable<string> {
    if (!embedURL) {
      return of('');
    }
    let url;
    try {
      url = new URL(embedURL);
    } catch (e) {
      // If the embed video URL doesn't start with http(s), try the url with that as a prefix.
      if (!embedURL.startsWith('https://') && !embedURL.startsWith('http://')) {
        return this.getEmbedURL(backendApi, globalVars, `https://${embedURL}`);
      }
      return of('');
    }
    if (this.isYoutubeFromURL(url)) {
      return of(this.constructYoutubeEmbedURL(url));
    }
    if (this.isMousaiFromURL(url)) {
      return of(this.constructMousaiEmbedURL(url));
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
    if(this.isNFTzFromURL(url)){
      return of(url.href)
    }
    if (this.isTwitchFromURL(url)) {
      return of(this.constructTwitchEmbedURL(url)).pipe(
        map((embedURL) =>
          embedURL
            ? embedURL + `&autoplay=false&parent=${location.hostname}`
            : ''
        )
      );
    }
    return of('');
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

  static isMousaiLink(link: string): boolean {
    try {
      const url = new URL(link);
      return this.isMousaiFromURL(url);
    } catch (e) {
      return false;
    }
  }

  static isMousaiFromURL(url: URL): boolean {
    const pattern = /\bmousai\.stream$/;
    return pattern.test(url.hostname);
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

  static isTwitchLink(link: string): boolean {
    try {
      const url = new URL(link);
      return this.isTwitchFromURL(url);
    } catch (e) {
      return false;
    }
  }

  static isTwitchFromURL(url: URL): boolean {
    const pattern = /\btwitch\.tv$/;
    return pattern.test(url.hostname);
  }

  static isNFTzFromURL(url: URL): boolean {
    const pattern = /\bnftz\.me$/;
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

  static isValidMousaiEmbedURL(link: string): boolean {
    const regExp = /https:\/\/mousai\.stream\/((album|playlist|track)\/[0-9]+(\/[a-z0-9-_,%]+){1,2}?)\/embed$/;
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

  static isValidTwitchEmbedURL(link: string): boolean {
    const regExp = /(https:\/\/(player|clips)\.twitch\.tv\/(\?channel=[A-Za-z0-9_]{1,30}|\?video=\d{8,12}|embed\?clip=[A-Za-z0-9_-]{1,80}|\?collection=[A-Za-z0-9]{10,20}(&video=\d{8,12})?))$/;
    return !!link.match(regExp);
  }

  static isValidTwitchEmbedURLWithParent(link: string): boolean {
    const regExp = new RegExp(
      `https:\/\/(player|clips)\.twitch\.tv\/(\\?channel\=[A-Za-z0-9_]{1,30}|\\?video=\\d{8,12}|embed\\?clip=[A-Za-z0-9_-]{1,80}|\\?collection=[A-Za-z0-9]{10,20}(\&video=\\d{8,12})\?)\&autoplay=false\&parent=${location.hostname}$`
    );
    return !!link.match(regExp);
  }

  static isValidNFTzEmbedURL(link: string): boolean {
    const regExp = new RegExp(
      `https:\/\/nftz\.me\/iframe\/nft\/`
    );
    return !!link.match(regExp);
  }

  static isValidEmbedURL(link: string): boolean {
    if (link) {
      return (
        this.isValidVimeoEmbedURL(link) ||
        this.isValidYoutubeEmbedURL(link) ||
        this.isValidMousaiEmbedURL(link) ||
        this.isValidTiktokEmbedURL(link) ||
        this.isValidGiphyEmbedURL(link) ||
        this.isValidSpotifyEmbedURL(link) ||
        this.isValidSoundCloudEmbedURL(link) ||
        this.isValidTwitchEmbedURL(link) ||
        this.isValidTwitchEmbedURLWithParent(link)||
        this.isValidNFTzEmbedURL(link)
      );
    }
    return false;
  }

  static getEmbedHeight(link: string): number {
    if (this.isValidTiktokEmbedURL(link)) {
      return 700;
    }
    if (this.isValidSpotifyEmbedURL(link)) {
      return link.indexOf('embed-podcast') > -1 ? 232 : 380;
    }
    if (this.isValidSoundCloudEmbedURL(link)) {
      return link.indexOf('/sets/') > -1 ? 350 : 180;
    }
    if (this.isValidMousaiEmbedURL(link)) {
      return 165;
    }
    if (this.isValidNFTzEmbedURL(link)) {
      return 480;
    }
    return 315;
  }

  static getEmbedWidth(link: string): string {
    return this.isValidTiktokEmbedURL(link) ? '325px' : '';
  }
}

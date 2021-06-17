import { EmbedUrlParserService } from "./embed-url-parser-service";
import { TestBed } from "@angular/core/testing";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { BackendApiService } from "../../../app/backend-api.service";
import { GlobalVarsService } from "../../../app/global-vars.service";
import { RouterModule } from "@angular/router";

describe("EmbedUrlParserService", () => {
  let globalVarsService;
  let backendApiService;

  beforeEach(async () => {
    const backendApiSpy = jasmine.createSpyObj("BackendApiService", ["GetFullTikTokURL"]);
    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterModule.forRoot([])],
      providers: [GlobalVarsService, { provide: BackendApiService, useValue: backendApiSpy }],
    });
    globalVarsService = TestBed.inject(GlobalVarsService);
    backendApiService = TestBed.inject(BackendApiService);
    backendApiService.GetFullTikTokURL.and.returnValue({
      FullTikTokURL: backendApiFullTikTokURLResponse,
    });
  });

  const youtubeVideoID = "CC8MU_ELvso";
  const validYoutubeURLs = [
    `http://www.youtube.com/watch?v=${youtubeVideoID}`,
    `http://www.youtube.com/v/${youtubeVideoID}?version=3&autohide=1`,
    `http://youtu.be/${youtubeVideoID}`,
    `https://www.youtube.com/watch?v=${youtubeVideoID}&feature=em-uploademail`,
  ];
  const validYoutubeEmbedURLs = [`https://www.youtube.com/embed/${youtubeVideoID}`];

  const vimeoVideoID = "310195153";
  const validVimeoURLs = [`http://vimeo.com/${vimeoVideoID}`];
  const validVimeoEmbedURLs = [`https://player.vimeo.com/video/${vimeoVideoID}`];

  const tiktokVideoID = "6943259044295673349";
  const tiktokShortVideoID = "ZMeV3WmVr";
  const validTikTokURLs = [
    `https://www.tiktok.com/@ox_zung/video/${tiktokVideoID}?is_copy_url=0&is_from_webapp=v1&sender_device=pc&sender_web_id=${tiktokVideoID}`,
    `https://m.tiktok.com/v/${tiktokVideoID}`,
  ];

  const backendApiFullTikTokURLResponse = validTikTokURLs[1];
  const validShortTikTokURLs = [`https://vm.tiktok.com/${tiktokShortVideoID}`];

  const validTikTokEmbedURLs = [`https://www.tiktok.com/embed/v2/${tiktokVideoID}`];
  const invalidURLs = [
    "https://google.com",
    "facebook.com<script></script>",
    `https://www.youtube.com/watch?v=<script>somestuff</script>`,
    "http://vimeo.com/<b>123</b>",
    "123abc.com/1234556",
    `https://wwwzyoutube.com/embed/${youtubeVideoID}`,
    `https://nottiktok.com/embed/v2/${tiktokShortVideoID}`,
  ];

  it("parses youtube URLs from user input correctly and only validates embed urls", () => {
    for (const link of validYoutubeURLs) {
      expect(EmbedUrlParserService.isYoutubeLink(link)).toBeTruthy();
      const embedURL = EmbedUrlParserService.constructYoutubeEmbedURL(new URL(link));
      expect(embedURL).toEqual(`https://www.youtube.com/embed/${youtubeVideoID}`);
      expect(EmbedUrlParserService.isValidEmbedURL(embedURL)).toBeTruthy();
      expect(EmbedUrlParserService.isValidEmbedURL(link)).toBeFalsy();
    }
    for (const embedLink of validYoutubeEmbedURLs) {
      expect(EmbedUrlParserService.isYoutubeLink(embedLink)).toBeTruthy();
      expect(EmbedUrlParserService.isValidEmbedURL(embedLink)).toBeTruthy();
      const constructedEmbedURL = EmbedUrlParserService.constructYoutubeEmbedURL(new URL(embedLink));
      expect(EmbedUrlParserService.isValidEmbedURL(constructedEmbedURL)).toBeTruthy();
    }
  });

  it("parses vimeo URLs from user input correctly and only validates embed urls", () => {
    for (const link of validVimeoURLs) {
      expect(EmbedUrlParserService.isVimeoLink(link)).toBeTruthy();
      const embedURL = EmbedUrlParserService.constructVimeoEmbedURL(new URL(link));
      expect(embedURL).toEqual(`https://player.vimeo.com/video/${vimeoVideoID}`);
      expect(EmbedUrlParserService.isValidEmbedURL(embedURL)).toBeTruthy();
      expect(EmbedUrlParserService.isValidEmbedURL(link)).toBeFalsy();
    }
    for (const embedLink of validVimeoEmbedURLs) {
      expect(EmbedUrlParserService.isVimeoLink(embedLink)).toBeTruthy();
      expect(EmbedUrlParserService.isValidEmbedURL(embedLink)).toBeTruthy();
      const constructedEmbedURL = EmbedUrlParserService.constructVimeoEmbedURL(new URL(embedLink));
      expect(EmbedUrlParserService.isValidEmbedURL(constructedEmbedURL)).toBeTruthy();
    }
  });

  it("parses tiktok URLs from user input correctly and only validates embed urls", async () => {
    for (const link of validTikTokURLs) {
      expect(EmbedUrlParserService.isTikTokLink(link)).toBeTruthy();
      EmbedUrlParserService.constructTikTokEmbedURL(backendApiService, globalVarsService, new URL(link)).subscribe(
        (embedURL) => {
          expect(embedURL).toEqual(`https://www.tiktok.com/embed/v2/${tiktokVideoID}`);
          expect(EmbedUrlParserService.isValidEmbedURL(embedURL)).toBeTruthy();
          expect(EmbedUrlParserService.isValidEmbedURL(link)).toBeFalsy();
        }
      );
    }
    for (const link of validShortTikTokURLs) {
      expect(EmbedUrlParserService.isTikTokLink(link)).toBeTruthy();
    }
    for (const embedLink of validTikTokEmbedURLs) {
      expect(EmbedUrlParserService.isTikTokLink(embedLink)).toBeTruthy();
      expect(EmbedUrlParserService.isValidEmbedURL(embedLink)).toBeTruthy();
      EmbedUrlParserService.constructTikTokEmbedURL(backendApiService, globalVarsService, new URL(embedLink)).subscribe(
        (constructedEmbedURL) => {
          expect(EmbedUrlParserService.isValidEmbedURL(constructedEmbedURL)).toBeTruthy();
        }
      );
    }
  });

  it("invalid URLs return falsy values", async () => {
    for (const link of invalidURLs) {
      expect(EmbedUrlParserService.isValidEmbedURL(link)).toBeFalsy();
      EmbedUrlParserService.getEmbedURL(backendApiService, globalVarsService, link).subscribe((res) =>
        expect(res).toBeFalsy()
      );
    }
  });
});

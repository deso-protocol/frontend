import { VideoUrlParserService } from "./video-url-parser-service";

describe("VideoUrlParserService", () => {
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

  const invalidURLs = [
    "https://google.com",
    "facebook.com<script></script>",
    `https://www.youtube.com/watch?v=<script>somestuff</script>`,
    "http://vimeo.com/<b>123</b>",
    "123abc.com/1234556",
  ];

  it("parses youtube URLs from user input correctly and only validates embed urls", () => {
    for (const link of validYoutubeURLs) {
      expect(VideoUrlParserService.isYoutubeLink(link)).toBeTruthy();
      const embedURL = VideoUrlParserService.constructYoutubeEmbedURL(new URL(link));
      expect(embedURL).toEqual(`https://www.youtube-nocookie.com/embed/${youtubeVideoID}`);
      expect(VideoUrlParserService.isValidEmbedURL(embedURL)).toBeTruthy();
      expect(VideoUrlParserService.isValidEmbedURL(link)).toBeFalsy();
    }
    for (const embedLink of validYoutubeEmbedURLs) {
      expect(VideoUrlParserService.isYoutubeLink(embedLink)).toBeTruthy();
      expect(VideoUrlParserService.isValidEmbedURL(embedLink)).toBeTruthy();
      const constructedEmbedURL = VideoUrlParserService.constructYoutubeEmbedURL(new URL(embedLink));
      expect(VideoUrlParserService.isValidEmbedURL(constructedEmbedURL)).toBeTruthy();
    }
  });

  it("parses vimeo URLs from user input correctly and only validates embed urls", () => {
    for (const link of validVimeoURLs) {
      expect(VideoUrlParserService.isVimeoLink(link)).toBeTruthy();
      const embedURL = VideoUrlParserService.constructVimeoEmbedURL(new URL(link));
      expect(embedURL).toEqual(`https://player.vimeo.com/video/${vimeoVideoID}`);
      expect(VideoUrlParserService.isValidEmbedURL(embedURL)).toBeTruthy();
      expect(VideoUrlParserService.isValidEmbedURL(link)).toBeFalsy();
    }
    for (const embedLink of validVimeoEmbedURLs) {
      expect(VideoUrlParserService.isVimeoLink(embedLink)).toBeTruthy();
      expect(VideoUrlParserService.isValidEmbedURL(embedLink)).toBeTruthy();
      const constructedEmbedURL = VideoUrlParserService.constructVimeoEmbedURL(new URL(embedLink));
      expect(VideoUrlParserService.isValidEmbedURL(constructedEmbedURL)).toBeTruthy();
    }
  });

  it("invalid URLs return falsy values", () => {
    for (const link of invalidURLs) {
      expect(VideoUrlParserService.isValidEmbedURL(link)).toBeFalsy();
      expect(VideoUrlParserService.getEmbedVideoURL(link)).toBeFalsy();
    }
  });
});

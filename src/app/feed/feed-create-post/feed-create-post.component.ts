import { Component, OnInit, ChangeDetectorRef, Input, EventEmitter, Output, ViewChild } from "@angular/core";
import { GlobalVarsService } from "../../global-vars.service";
import { BackendApiService, BackendRoutes, PostEntryResponse } from "../../backend-api.service";
import { Router, ActivatedRoute } from "@angular/router";
import { SharedDialogs } from "../../../lib/shared-dialogs";
import { CdkTextareaAutosize } from "@angular/cdk/text-field";
import { EmbedUrlParserService } from "../../../lib/services/embed-url-parser-service/embed-url-parser-service";
import { environment } from "../../../environments/environment";
import * as tus from "tus-js-client";
import Timer = NodeJS.Timer;
import { CloudflareStreamService } from "../../../lib/services/stream/cloudflare-stream-service";

@Component({
  selector: "feed-create-post",
  templateUrl: "./feed-create-post.component.html",
  styleUrls: ["./feed-create-post.component.sass"],
})
export class FeedCreatePostComponent implements OnInit {
  static SHOW_POST_LENGTH_WARNING_THRESHOLD = 515; // show warning at 515 characters

  EmbedUrlParserService = EmbedUrlParserService;

  @Input() postRefreshFunc: any = null;
  @Input() numberOfRowsInTextArea: number = 2;
  @Input() parentPost: PostEntryResponse = null;
  @Input() isQuote: boolean = false;
  @Input() inTutorial: boolean = false;

  isComment: boolean;

  @ViewChild("autosize") autosize: CdkTextareaAutosize;

  randomMovieQuote = "";
  randomMovieQuotes = [
    "Go ahead, make my day.",
    "The stuff that dreams are made of.",
    "Made it, Ma! Top of the world!",
    "I'll be back.",
    "Open the pod bay doors, HAL.",
    "Who's on first.",
    "What's on second.",
    "I feel the need - the need for speed!",
    "I'm king of the world!",
    "If you build it, they will come.",
    "Roads? Where we're going we don't need roads",
    "To infinity and beyond!",
    "May the Force be with you",
    "I've got a feeling we're not in Kansas anymore",
    "E.T. phone home",
    "Elementary, my dear Watson",
    "I'm going to make him an offer he can't refuse.",
    "Big things have small beginnings."
  ];

  submittingPost = false;
  postInput = "";
  postImageSrc = null;

  postVideoSrc = null;
  videoUploadPercentage = null;

  showEmbedURL = false;
  showImageLink = false;
  embedURL = "";
  constructedEmbedURL: any;
  videoStreamInterval: Timer = null;
  readyToStream: boolean = false;

  // Emits a PostEntryResponse. It would be better if this were typed.
  @Output() postCreated = new EventEmitter();

  globalVars: GlobalVarsService;
  GlobalVarsService = GlobalVarsService;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private backendApi: BackendApiService,
    private changeRef: ChangeDetectorRef,
    private appData: GlobalVarsService,
    private streamService: CloudflareStreamService
  ) {
    this.globalVars = appData;
  }

  ngOnInit() {
    this.isComment = !this.isQuote && !!this.parentPost;
    this._setRandomMovieQuote();
    if (this.inTutorial) {
      this.postInput = "It's time to DESO!";
    }
  }

  onPaste(event: any): void {
    const items = (event.clipboardData || event.originalEvent.clipboardData).items;
    let blob = null;

    for (const item of items) {
      if (item.type.indexOf("image") === 0) {
        blob = item.getAsFile();
      }
    }

    if (blob) {
      this._handleFileInput(blob);
    }
  }

  uploadFile(event: any): void {
    this._handleFileInput(event[0]);
  }

  showCharacterCountIsFine() {
    return this.postInput.length < FeedCreatePostComponent.SHOW_POST_LENGTH_WARNING_THRESHOLD;
  }

  showCharacterCountWarning() {
    return (
      this.postInput.length >= FeedCreatePostComponent.SHOW_POST_LENGTH_WARNING_THRESHOLD &&
      this.postInput.length <= GlobalVarsService.MAX_POST_LENGTH
    );
  }

  characterCountExceedsMaxLength() {
    return this.postInput.length > GlobalVarsService.MAX_POST_LENGTH;
  }

  getPlaceholderText() {
    // Creating vanilla post
    if (!this.parentPost) {
      return this.randomMovieQuote;
    }
    // Creating comment or quote repost;
    return this.isQuote ? "Add a quote" : "Post your reply";
  }

  _setRandomMovieQuote() {
    const randomInt = Math.floor(Math.random() * this.randomMovieQuotes.length);
    this.randomMovieQuote = this.randomMovieQuotes[randomInt];
  }

  setEmbedURL() {
    EmbedUrlParserService.getEmbedURL(this.backendApi, this.globalVars, this.embedURL).subscribe(
      (res) => (this.constructedEmbedURL = res)
    );
  }

  submitPost() {
    if (this.postInput.length > GlobalVarsService.MAX_POST_LENGTH) {
      return;
    }

    // post can't be blank
    if (this.postInput.length === 0 && !this.postImageSrc && !this.postVideoSrc) {
      return;
    }

    if (this.submittingPost) {
      return;
    }

    const postExtraData = {};
    if (this.embedURL) {
      if (EmbedUrlParserService.isValidEmbedURL(this.constructedEmbedURL)) {
        postExtraData["EmbedVideoURL"] = this.constructedEmbedURL;
      }
    }

    if (environment.node.id) {
      postExtraData["Node"] = environment.node.id.toString();
    }

    const bodyObj = {
      Body: this.postInput,
      ImageURLs: [this.postImageSrc].filter((n) => n),
      VideoURLs: [this.postVideoSrc].filter((n) => n),
    };
    const repostedPostHashHex = this.isQuote ? this.parentPost.PostHashHex : "";
    this.submittingPost = true;
    const postType = this.isQuote ? "quote" : this.isComment ? "reply" : "create";

    this.backendApi
      .SubmitPost(
        this.globalVars.localNode,
        this.globalVars.loggedInUser.PublicKeyBase58Check,
        "" /*PostHashHexToModify*/,
        this.isComment ? this.parentPost.PostHashHex : "" /*ParentPostHashHex*/,
        "" /*Title*/,
        bodyObj /*BodyObj*/,
        repostedPostHashHex,
        postExtraData,
        "" /*Sub*/,
        // TODO: Should we have different values for creator basis points and stake multiple?
        // TODO: Also, it may not be reasonable to allow stake multiple to be set in the FE.
        false /*IsHidden*/,
        this.globalVars.defaultFeeRateNanosPerKB /*MinFeeRateNanosPerKB*/,
        this.inTutorial
      )
      .subscribe(
        (response) => {
          this.globalVars.logEvent(`post : ${postType}`);

          this.submittingPost = false;

          this.postInput = "";
          this.postImageSrc = null;
          this.postVideoSrc = null;
          this.embedURL = "";
          this.constructedEmbedURL = "";
          this.showEmbedURL = false;
          this.changeRef.detectChanges();

          // Refresh the post page.
          if (this.postRefreshFunc) {
            this.postRefreshFunc(response.PostEntryResponse);
          }

          this.postCreated.emit(response.PostEntryResponse);
        },
        (err) => {
          const parsedError = this.backendApi.parsePostError(err);
          this.globalVars._alertError(parsedError);
          this.globalVars.logEvent(`post : ${postType} : error`, { parsedError });

          this.submittingPost = false;
          this.changeRef.detectChanges();
        }
      );
  }

  _createPost() {
    // Check if the user has an account.
    if (!this.globalVars?.loggedInUser) {
      this.globalVars.logEvent("alert : post : account");
      SharedDialogs.showCreateAccountToPostDialog(this.globalVars);
      return;
    }

    // Check if the user has a profile.
    if (!this.globalVars?.doesLoggedInUserHaveProfile()) {
      this.globalVars.logEvent("alert : post : profile");
      SharedDialogs.showCreateProfileToPostDialog(this.router);
      return;
    }

    // The user has an account and a profile. Let's create a post.
    this.submitPost();
  }

  _handleFilesInput(files: FileList): void {
    this.showImageLink = false;
    const fileToUpload = files.item(0);
    this._handleFileInput(fileToUpload);
  }

  _handleFileInput(file: File): void {
    if (!file) {
      return;
    }

    if (!file.type || (!file.type.startsWith("image/") && !file.type.startsWith("video/"))) {
      this.globalVars._alertError("File selected does not have an image or video file type.");
    } else if (file.type.startsWith("video/")) {
      this.uploadVideo(file);
    } else if (file.type.startsWith("image/")) {
      this.uploadImage(file);
    }
  }

  uploadImage(file: File) {
    if (file.size > 15 * (1024 * 1024)) {
      this.globalVars._alertError("File is too large. Please choose a file less than 15MB");
      return;
    }
    return this.backendApi
      .UploadImage(environment.uploadImageHostname, this.globalVars.loggedInUser.PublicKeyBase58Check, file)
      .subscribe(
        (res) => {
          this.postImageSrc = res.ImageURL;
          this.postVideoSrc = null;
        },
        (err) => {
          this.globalVars._alertError(JSON.stringify(err.error.error));
        }
      );
  }

  uploadVideo(file: File): void {
    if (file.size > 4 * (1024 * 1024 * 1024)) {
      this.globalVars._alertError("File is too large. Please choose a file less than 4GB");
      return;
    }
    let upload: tus.Upload;
    let mediaId = "";
    const comp: FeedCreatePostComponent = this;
    const options = {
      endpoint: this.backendApi._makeRequestURL(environment.uploadVideoHostname, BackendRoutes.RoutePathUploadVideo),
      chunkSize: 50 * 1024 * 1024, // Required a minimum chunk size of 5MB, here we use 50MB.
      uploadSize: file.size,
      onError: function (error) {
        comp.globalVars._alertError(error.message);
        upload.abort(true).then(() => {
          throw error;
        });
      },
      onProgress: function (bytesUploaded, bytesTotal) {
        comp.videoUploadPercentage = ((bytesUploaded / bytesTotal) * 100).toFixed(2);
      },
      onSuccess: function () {
        // Construct the url for the video based on the videoId and use the iframe url.
        comp.postVideoSrc = `https://iframe.videodelivery.net/${mediaId}`;
        comp.postImageSrc = null;
        comp.videoUploadPercentage = null;
        comp.pollForReadyToStream();
      },
      onAfterResponse: function (req, res) {
        return new Promise((resolve) => {
          // The stream-media-id header is the video Id in Cloudflare's system that we'll need to locate the video for streaming.
          let mediaIdHeader = res.getHeader("stream-media-id");
          if (mediaIdHeader) {
            mediaId = mediaIdHeader;
          }
          resolve(res);
        });
      },
    };
    // Clear the interval used for polling cloudflare to check if a video is ready to stream.
    if (this.videoStreamInterval != null) {
      clearInterval(this.videoStreamInterval);
    }
    // Reset the postVideoSrc and readyToStream values.
    this.postVideoSrc = null;
    this.readyToStream = false;
    // Create and start the upload.
    upload = new tus.Upload(file, options);
    upload.start();
    return;
  }

  pollForReadyToStream(): void {
    let attempts = 0;
    let numTries = 1200;
    let timeoutMillis = 500;
    this.videoStreamInterval = setInterval(() => {
      if (attempts >= numTries) {
        clearInterval(this.videoStreamInterval);
        return;
      }
      this.streamService
        .checkVideoStatusByURL(this.postVideoSrc)
        .subscribe(([readyToStream, exitPolling]) => {
          if (readyToStream) {
            this.readyToStream = true;
            clearInterval(this.videoStreamInterval);
            return;
          }
          if (exitPolling) {
            clearInterval(this.videoStreamInterval);
            return;
          }
        })
        .add(() => attempts++);
    }, timeoutMillis);
  }
}

import { Directive, Output, EventEmitter, HostBinding, HostListener, HostBindingDecorator } from "@angular/core";

@Directive({
  selector: "[dropUpload]",
})
export class UploadDirective {
  @Output() onFileDropped = new EventEmitter<any>();
  @HostBinding("style.opacity") public opacity = "1";

  @HostListener("dragover", ["$event"]) onDragOver(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    this.opacity = "0.5";
  }

  @HostListener("dragleave", ["$event"]) public onDragLeave(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    this.opacity = "1";
  }

  @HostListener("drop", ["$event"]) public ondrop(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    this.opacity = "1";
    let files = evt.dataTransfer.files;
    if (files.length > 0) {
      this.onFileDropped.emit(files);
    }
  }

  constructor() {}
}

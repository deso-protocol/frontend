import {
  ApplicationRef,
  ChangeDetectorRef,
  Component,
  OnInit,
  Input,
  ViewEncapsulation,
} from '@angular/core';

@Component({
  selector: 'simple-center-loader',
  templateUrl: './simple-center-loader.component.html',
  styleUrls: ['./simple-center-loader.component.scss'],
})
export class SimpleCenterLoaderComponent {
  @Input() titleLoadingText: string = 'Loading...';
  @Input() subtitleLoadingText: string = '';
  @Input() spinnerColor: string = 'gray';
  @Input() textColor: string = 'gray';
  @Input() height = 400;

  constructor() {}

  getHeight() {
    return `${this.height.toString()}px`;
  }
}

import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'tab-selector',
  templateUrl: './tab-selector.component.html',
  styleUrls: ['./tab-selector.component.scss'],
})
export class TabSelectorComponent {
  @Output() tabClick = new EventEmitter<string>();
  @Input() tabs: any; // Should be a list of strings with tab names.
  @Input() activeTab: string;
  @Input() linkTabs: {} = {};

  constructor() {}

  _tabClicked(tab: string) {
    if (tab in this.linkTabs) {
      window.open(this.linkTabs[tab], "_blank");
    } else {
      this.tabClick.emit(tab);
      this.activeTab = tab;
    }
  }

  isLink(tabName: string) {
    return tabName in this.linkTabs;
  }
}

import { Component, OnInit, Input, Output, EventEmitter } from "@angular/core";

@Component({
  selector: "tab-selector",
  templateUrl: "./tab-selector.component.html",
  styleUrls: ["./tab-selector.component.scss"],
})
export class TabSelectorComponent {
  @Output() tabClick = new EventEmitter<string>();
  @Input() tabs: any; // Should be a list of strings with tab names.
  @Input() activeTab: string;
  @Input() newTabs: string[] = [];

  constructor() {}

  _tabClicked(tab: string) {
    this.tabClick.emit(tab);
    this.activeTab = tab;
  }
}

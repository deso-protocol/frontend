import { Injectable, Inject, EventEmitter } from "@angular/core";
import { THEMES, ACTIVE_THEME, Theme } from "./symbols";

@Injectable()
export class ThemeService {
  themeChange = new EventEmitter<Theme>();

  constructor(@Inject(THEMES) public themes: Theme[], @Inject(ACTIVE_THEME) public theme: string) {}

  getActiveTheme(): Theme {
    const theme = this.themes.find((t) => t.key === this.theme);
    if (!theme) {
      throw new Error(`Theme not found: '${this.theme}'`);
    }
    return theme;
  }

  setTheme(key: string): void {
    this.theme = key;
    this.themeChange.emit(this.getActiveTheme());
  }
}

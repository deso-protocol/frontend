import { Injectable, Inject, EventEmitter } from "@angular/core";
import { THEMES, ACTIVE_THEME, Theme } from "./symbols";

@Injectable()
export class ThemeService {
  themeChange = new EventEmitter<Theme>();

  constructor(
    @Inject(THEMES) public themes: Theme[],
    @Inject(ACTIVE_THEME) public theme: string
  ) {}

  // Called in app-component ngOnInit
  init(): void {
    const active = this.getActiveTheme();
    document.body.classList.add(active.key);
  }

  getActiveTheme(): Theme {
    const theme = this.themes.find((t) => t.key === this.theme);
    if (!theme) {
      throw new Error(`Theme not found: '${this.theme}'`);
    }
    return theme;
  }

  setTheme(newTheme: string): void {
    const oldTheme = this.theme;

    localStorage.setItem("theme", newTheme);
    document.body.classList.remove(oldTheme);
    document.body.classList.add(newTheme);

    // Maje the changes and inform all observers
    this.theme = newTheme;
    this.themeChange.emit(this.getActiveTheme());
  }
}

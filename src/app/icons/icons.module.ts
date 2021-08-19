import { NgModule } from "@angular/core";

import { FeatherModule } from "angular-feather";
import { Heart, MessageSquare, Repeat } from "angular-feather/icons";
import { Quote } from "src/assets/img/feather";

const icons = {
  MessageSquare,
  Repeat,
  Heart,
  Quote,
};

@NgModule({
  imports: [FeatherModule.pick(icons)],
  exports: [FeatherModule],
})
export class IconsModule {}

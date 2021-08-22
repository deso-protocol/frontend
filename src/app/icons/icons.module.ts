import { NgModule } from "@angular/core";

import { FeatherModule } from "angular-feather";
import { Code, ExternalLink, Heart, Image, Link, Link2, MessageSquare, Repeat, Search, ShoppingCart } from "angular-feather/icons";
import { Bitclout, Diamond, Lock, Quote } from "src/assets/img/feather";

const icons = {
  Bitclout,
  Code,
  Diamond,
  ExternalLink,
  Heart,
  Image,
  Link,
  Link2,
  Lock,
  MessageSquare,
  Quote,
  Repeat,
  Search,
  ShoppingCart,
};

@NgModule({
  imports: [FeatherModule.pick(icons)],
  exports: [FeatherModule],
})
export class IconsModule {}

import { NgModule } from "@angular/core";

import { FeatherModule } from "angular-feather";
import { CheckCircle, Code, ExternalLink, Flag, FolderMinus, FolderPlus, Heart, Image, Link, Link2, MessageSquare, Repeat, Search, ShoppingCart, UserX } from "angular-feather/icons";
import { Bitclout, Diamond, Lock, Quote } from "src/assets/img/feather";

const icons = {
  Bitclout,
  CheckCircle,
  Code,
  Diamond,
  ExternalLink,
  Flag,
  FolderMinus,
  FolderPlus,
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
  UserX,
};

@NgModule({
  imports: [FeatherModule.pick(icons)],
  exports: [FeatherModule],
})
export class IconsModule {}

import { NgModule } from "@angular/core";

import { FeatherModule } from "angular-feather";
import { AlertTriangle, ArrowLeft, Bell, CheckCircle, ChevronRight, Clock, Code, Codesandbox, ExternalLink, Flag, FolderMinus, FolderPlus, Gift, Heart, Home, Image, Link, Link2, MessageSquare, Repeat, Search, ShoppingCart, TrendingUp, User, UserX } from "angular-feather/icons";
import { Bitclout, Diamond, Lock, Quote } from "src/assets/img/feather";

const icons = {
  AlertTriangle,
  ArrowLeft,
  Bell,
  Bitclout,
  CheckCircle,
  ChevronRight,
  Clock,
  Code,
  Codesandbox,
  Diamond,
  ExternalLink,
  Flag,
  FolderMinus,
  FolderPlus,
  Gift,
  Heart,
  Home,
  Image,
  Link,
  Link2,
  Lock,
  MessageSquare,
  Quote,
  Repeat,
  Search,
  ShoppingCart,
  TrendingUp,
  User,
  UserX,
};

@NgModule({
  imports: [FeatherModule.pick(icons)],
  exports: [FeatherModule],
})
export class IconsModule {}

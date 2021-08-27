import { NgModule } from "@angular/core";

import { FeatherModule } from "angular-feather";
import { AlertTriangle, ArrowLeft, Award, Bell, Check, CheckCircle, ChevronRight, Clock, Code, Codesandbox, Copy, ExternalLink, Flag, FolderMinus, FolderPlus, Gift, Heart, Home, Image, Info, Key, Link, Link2, MessageSquare, Percent, RefreshCw, Repeat, Search, Send, Settings, ShoppingCart, Trash2, TrendingUp, User, UserX, X } from "angular-feather/icons";
import { Bitclout, Coin, Diamond, Lock, Quote } from "src/assets/img/feather";

const icons = {
  AlertTriangle,
  ArrowLeft,
  Award,
  Bell,
  Bitclout,
  Check,
  CheckCircle,
  ChevronRight,
  Clock,
  Code,
  Codesandbox,
  Coin,
  Copy,
  Diamond,
  ExternalLink,
  Flag,
  FolderMinus,
  FolderPlus,
  Gift,
  Heart,
  Home,
  Image,
  Info,
  Key,
  Link,
  Link2,
  Lock,
  MessageSquare,
  Percent,
  Quote,
  RefreshCw,
  Repeat,
  Search,
  Send,
  Settings,
  ShoppingCart,
  Trash2,
  TrendingUp,
  User,
  UserX,
  X,
};

@NgModule({
  imports: [FeatherModule.pick(icons)],
  exports: [FeatherModule],
})
export class IconsModule {}

export class CanPublicKeyFollowTargetPublicKeyHelper {
  static execute(currentPublicKey, targetPublicKey) {
    if (!currentPublicKey || !targetPublicKey) {
      return false;
    }

    // current can follow target as long as current != target
    return currentPublicKey != targetPublicKey;
  }
}

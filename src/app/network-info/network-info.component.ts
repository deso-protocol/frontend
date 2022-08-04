import { Component, OnInit } from '@angular/core';
import { GlobalVarsService } from '../global-vars.service';
import { BackendApiService } from '../backend-api.service';
import { sprintf } from 'sprintf-js';
import { SwalHelper } from '../../lib/helpers/swal-helper';

class NetworkConstants {
  static MISSING_REQUIRED_FIELD = `You are missing required field with label: %s`;
  static INCORRECT_PASSWORD = `The password you entered was incorrect.`;
  static INSUFFICIENT_BALANCE = `Your balance is insufficient to process the transaction.`;
  static TOTAL_deso_INVALID = `The total DeSo is currently an invalid value. Is your balance insufficient?`;
  static CONNECTION_PROBLEM = `There is currently a connection problem. Is your connection to your node healthy?`;
}

@Component({
  selector: 'network-info',
  templateUrl: './network-info.component.html',
  styleUrls: ['./network-info.component.scss'],
})
export class NetworkInfoComponent implements OnInit {
  prevTstamp = null;
  prevTstampDate = null;
  isOpen = {
    detailedSyncInfo: true,
    minerInfo: true,
    desoNode: true,
    bitcoinNode: true,
  };
  isCopied: any;
  updatedMinerPubKeys = '';
  updatingMiners = false;
  stoppingMiners = false;
  manualDeSoPeer = '';
  updatingDeSoPeer = false;
  manualBitcoinPeer = '';
  updatingBitcoinPeer = false;

  constructor(
    public globalVars: GlobalVarsService,
    private backendApi: BackendApiService
  ) {}

  ngOnInit() {
    this._resetCopyConfirmations();
  }

  _tstampToDate(tstampSecs) {
    if (this.prevTstamp !== tstampSecs) {
      this.prevTstamp = tstampSecs;
      this.prevTstampDate = new Date(tstampSecs * 1000);
    }
    return this.prevTstampDate;
  }

  _copyNetworkInfo(infoToCopy: string, minerPublicKeyIdx: number) {
    if (infoToCopy === 'lastBlockHeight') {
      this.globalVars._copyText(
        this.globalVars.nodeInfo.DeSoStatus.LatestHeaderHeight
      );
      this.isCopied.lastBlockHeight = true;
    } else if (infoToCopy === 'lastBlockHash') {
      this.globalVars._copyText(
        this.globalVars.nodeInfo.DeSoStatus.LatestHeaderHash
      );
      this.isCopied.lastBlockHash = true;
    } else if (infoToCopy === 'minerPublicKey') {
      this.globalVars._copyText(
        this.globalVars.nodeInfo.MinerPublicKeys[minerPublicKeyIdx]
      );
      this.isCopied.minerPublicKeys[minerPublicKeyIdx] = true;
    }

    setTimeout(() => {
      this._resetCopyConfirmations();
    }, 500);
  }

  _resetCopyConfirmations() {
    let minerPublicKeys = [];
    if (
      this.globalVars.nodeInfo.MinerPublicKeys != null &&
      this.globalVars.nodeInfo.MinerPublicKeys.length > 0
    ) {
      for (let key of this.globalVars.nodeInfo.MinerPublicKeys) {
        minerPublicKeys.push(false);
      }
    }

    this.isCopied = {
      lastBlockHeight: false,
      lastBlockHash: false,
      minerPublicKeys: minerPublicKeys,
      desoUnconnectedPeers: false,
      bitcoinUnconnectedPeers: false,
    };
  }

  stopMining() {
    this.stoppingMiners = true;
    this.backendApi
      .UpdateMiner(
        this.globalVars.localNode,
        this.globalVars.loggedInUser.PublicKeyBase58Check,
        ''
      )
      .subscribe(
        (res: any) => {
          SwalHelper.fire({
            target: this.globalVars.getTargetComponentSelector(),
            title: 'Successfully stopped mining!',
            customClass: {
              confirmButton: 'btn btn-light',
              cancelButton: 'btn btn-light no',
            },
          });
        },
        (error) => {
          this.globalVars._alertError(
            sprintf(
              'Problem updating the miner. Debug output: %s',
              JSON.stringify(error)
            )
          );
          return;
        }
      )
      .add(() => {
        this.stoppingMiners = false;
      });
  }

  _extractError(err: any): string {
    if (err.error != null && err.error.error != null) {
      // Is it obvious yet that I'm not a frontend gal?
      // TODO: Error handling between BE and FE needs a major redesign.
      let rawError = err.error.error;
      if (rawError.includes('password')) {
        return NetworkConstants.INCORRECT_PASSWORD;
      } else if (rawError.includes('not sufficient')) {
        return NetworkConstants.INSUFFICIENT_BALANCE;
      } else {
        return rawError;
      }
    }
    if (err.status != null && err.status != 200) {
      return NetworkConstants.CONNECTION_PROBLEM;
    }
    // If we get here we have no idea what went wrong so just alert the
    // errorString.
    return sprintf(JSON.stringify(err));
  }

  disconnectDeSoPeer(peerAddr: string) {
    if (this.updatingDeSoPeer) {
      this.globalVars._alertError(
        'Please wait for your previous request to finish.'
      );
      return;
    }
    this.updatingDeSoPeer = true;
    this.backendApi
      .NodeControl(
        this.globalVars.localNode,
        this.globalVars.loggedInUser.PublicKeyBase58Check,
        peerAddr,
        'disconnect_deso_node'
      )
      .subscribe(
        (res: any) => {
          this.globalVars._alertSuccess(
            'Successfully disconnected DeSo peer: ' + peerAddr
          );
          return;
        },
        (error) => {
          this.globalVars._alertError(
            'Problem disconnecting DeSo Peer. Debug output: ' +
              this._extractError(error)
          );
          console.error(error);
        }
      )
      .add(() => {
        this.updatingDeSoPeer = false;
      });
  }

  connectDeSoPeer(peerAddr: string) {
    if (this.updatingDeSoPeer) {
      this.globalVars._alertError(
        'Please wait for your previous request to finish.'
      );
      return;
    }
    this.updatingDeSoPeer = true;
    this.backendApi
      .NodeControl(
        this.globalVars.localNode,
        this.globalVars.loggedInUser.PublicKeyBase58Check,
        peerAddr,
        'connect_deso_node'
      )
      .subscribe(
        (res: any) => {
          this.manualDeSoPeer = '';
          this.globalVars._alertSuccess(
            'Successfully connected to DeSo peer: ' + peerAddr
          );
          return;
        },
        (error) => {
          this.globalVars._alertError(
            'Problem connecting to DeSo Peer. Debug output: ' +
              this._extractError(error)
          );
          console.error(error);
        }
      )
      .add(() => {
        this.updatingDeSoPeer = false;
      });
  }

  connectBitcoinPeer(peerAddr: string) {
    if (this.updatingBitcoinPeer) {
      this.globalVars._alertError(
        'Please wait for your previous request to finish.' +
          ' Bitcoin connection requests can take up to thirty seconds.'
      );
      return;
    }
    this.updatingBitcoinPeer = true;
    this.backendApi
      .NodeControl(
        this.globalVars.localNode,
        this.globalVars.loggedInUser.PublicKeyBase58Check,
        peerAddr,
        'connect_bitcoin_node'
      )
      .subscribe(
        (res: any) => {
          this.globalVars._alertSuccess(
            'Successfully connected to Bitcoin node: ' + peerAddr
          );
        },
        (error) => {
          this.globalVars._alertError(
            'Problem connecting to Bitcoin node. Debug output: ' +
              this._extractError(error)
          );
          console.error(error);
        }
      )
      .add(() => {
        this.updatingBitcoinPeer = false;
        this.manualBitcoinPeer = '';
      });
  }

  copyPeer(peer: any) {
    this.globalVars._copyText(peer.IP + ':' + peer.ProtocolPort);
    peer['isCopied'] = true;
  }

  updateMiners() {
    if (this.updatedMinerPubKeys === '') {
      this.globalVars._alertError(
        'Please enter a comma separated list of miner pub keys.'
      );
      return;
    }
    let newMinerList = this.updatedMinerPubKeys.split(',');
    for (let newMiner of newMinerList) {
      if (!this.globalVars.isMaybePublicKey(newMiner)) {
        this.globalVars._alertError(
          'One of the miner pub keys you entered is invalid.'
        );
        return;
      }
    }

    // If we have gotten here, all miner public keys are valid so we make the update.
    this.globalVars.nodeInfo.MinerPublicKeys = newMinerList;

    this.updatingMiners = true;
    this.backendApi
      .UpdateMiner(
        this.globalVars.localNode,
        this.globalVars.loggedInUser.PublicKeyBase58Check,
        this.updatedMinerPubKeys
      )
      .subscribe(
        (res: any) => {
          SwalHelper.fire({
            target: this.globalVars.getTargetComponentSelector(),
            title: 'Successfully updated miners!',
            customClass: {
              confirmButton: 'btn btn-light',
              cancelButton: 'btn btn-light no',
            },
          });
        },
        (error) => {
          this.globalVars._alertError(
            sprintf(
              'Problem updating the miner. Debug output: %s',
              JSON.stringify(error)
            )
          );
        }
      )
      .add(() => {
        this.updatingMiners = false;
      });
  }

  notImplemented() {
    SwalHelper.fire({
      target: this.globalVars.getTargetComponentSelector(),
      title: 'Implement me please :)',
      customClass: {
        confirmButton: 'btn btn-light',
        cancelButton: 'btn btn-light no',
      },
    });
  }
}

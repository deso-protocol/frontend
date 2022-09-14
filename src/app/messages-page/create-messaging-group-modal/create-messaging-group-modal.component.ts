import { Component, Input } from '@angular/core';
import {
  BackendApiService,
  MessagingGroupMemberResponse,
  ProfileEntryResponse,
} from '../../backend-api.service';
import { GlobalVarsService } from '../../global-vars.service';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { BsModalService } from 'ngx-bootstrap/modal';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { IdentityService } from '../../identity.service';
import {zip} from "lodash";

@Component({
  selector: 'app-create-messaging-group-modal',
  templateUrl: './create-messaging-group-modal.component.html',
})
export class CreateMessagingGroupModalComponent {
  messagingGroupMembers: {
    MessagingGroupMember: MessagingGroupMemberResponse;
    ProfileEntryResponse: ProfileEntryResponse;
  }[] = [];
  error: string;
  groupName = '';

  constructor(
    private globalVars: GlobalVarsService,
    private backendApi: BackendApiService,
    private modalService: BsModalService,
    private router: Router,
    private identityService: IdentityService,
    public bsModalRef: BsModalRef
  ) {}

  _handleCreatorSelectedInSearch(creator: ProfileEntryResponse): void {
    this.GetMessagingGroupMemberFromPublicKey(
      creator.PublicKeyBase58Check
    ).subscribe((messagingGroupMember) => {
      if (!messagingGroupMember) {
        this.error = `${
          creator.Username || creator.PublicKeyBase58Check
        } does not have a default key registered and cannot be added to a group chat`;
        return;
      }
      this.error = '';
      this.messagingGroupMembers.push({
        MessagingGroupMember: messagingGroupMember,
        ProfileEntryResponse: creator,
      });
    });
  }

  GetMessagingGroupMemberFromPublicKey(
    publicKeyBase58Check: string
  ): Observable<MessagingGroupMemberResponse | null> {
    return this.backendApi
      .GetDefaultKey(this.globalVars.localNode, publicKeyBase58Check)
      .pipe(
        map((res) => {
          return res === null
            ? null
            : {
                GroupMemberPublicKeyBase58Check: publicKeyBase58Check,
                GroupMemberKeyName: res.MessagingGroupKeyName,
                EncryptedKey: res.EncryptedKey,
              };
        })
      );
  }

  CreateGroup(): void {
    let messagingPublicKeyBase58Check: string;
    this.identityService
      .launchCreateMessagingGroup(
        this.globalVars.loggedInUser.PublicKeyBase58Check,
        this.groupName
      )
      .subscribe((res) => {
        messagingPublicKeyBase58Check = res.messagingPublicKeyBase58Check;
        return this.backendApi
          .RegisterGroupMessagingKey(
            this.globalVars.localNode,
            this.globalVars.loggedInUser.PublicKeyBase58Check,
            messagingPublicKeyBase58Check,
            this.groupName,
            '',
            [],
            {},
            this.globalVars.feeRateDeSoPerKB * 1e9
          )
          .subscribe(() => {
            this.identityService
              .launchAddMembersToMessagingGroup(
                this.globalVars.loggedInUser.PublicKeyBase58Check,
                this.groupName,
                this.messagingGroupMembers.map(
                  (m) => m.MessagingGroupMember.GroupMemberPublicKeyBase58Check
                ),
                this.messagingGroupMembers.map(
                  (m) => m.MessagingGroupMember.GroupMemberKeyName
                )
              )
              .subscribe((res) => {
                this.backendApi
                  .RegisterGroupMessagingKey(
                    this.globalVars.localNode,
                    this.globalVars.loggedInUser.PublicKeyBase58Check,
                    messagingPublicKeyBase58Check,
                    this.groupName,
                    '',
                    this.messagingGroupMembers.map((m, ii) => {
                      return {
                        ...m.MessagingGroupMember,
                        ...{
                          EncryptedKey:
                            res.encryptedToMembersGroupMessagingPrivateKey[ii],
                        },
                      };
                    }),
                    {},
                    this.globalVars.feeRateDeSoPerKB * 1e9
                  )
                  .subscribe((res) => {
                    this.backendApi
                      .SendGroupMessage(
                        this.globalVars.localNode,
                        this.globalVars.loggedInUser.PublicKeyBase58Check,
                        messagingPublicKeyBase58Check,
                        'default-key',
                        this.groupName,
                        'my first group message',
                        this.globalVars.loggedInUser.PublicKeyBase58Check,
                        this.globalVars.feeRateDeSoPerKB * 1e9
                      )
                      .subscribe((res) => {
                        console.log('message sent');
                      });
                  });
              });
          });
      });
  }
}

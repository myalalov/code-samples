import { Component, OnDestroy, OnInit } from '@angular/core';
import { CampaignInfoService } from '../../../_services/campaign.info.service';
import { Campaign } from '../../../_models/campaign';
import { Subscription } from 'rxjs/Subscription';
import { UserProfileService } from '../../../_services/user.profile.service';

@Component({
  selector    : 'metadata',
  templateUrl : 'metadata.section.component.html',
  styleUrls   : [ 'metadata.section.component.css' ]
})


export class MetadataSectionComponent implements OnInit, OnDestroy {

  info: Campaign;
  campaignInfoServiceSubscription: Subscription;
  defaultLogo: string = '';

  constructor( private campaignInfoService: CampaignInfoService, private userProfileService: UserProfileService ) {
  }

  onCampaignInfoChanged( campaignInfo: Campaign ) {
    this.info = campaignInfo;
  }

  onError( message ) {
    console.log( 'MetadataSectionComponent::onError() | ', message );
  }

  ngOnInit(): void {
    this.campaignInfoServiceSubscription =
      this.campaignInfoService.campaignInfo.subscribe( this.onCampaignInfoChanged.bind( this ), this.onError.bind( this ) );

    this.userProfileService.userProfile.subscribe( ( userProfile: any ) => {
      if ( !userProfile || !userProfile.user_metadata || !userProfile.user_metadata.logo || !userProfile.user_metadata.logo.small ) return;
      this.defaultLogo = userProfile.user_metadata.logo.small;
    } );
  }

  ngOnDestroy(): void {
    this.campaignInfoServiceSubscription.unsubscribe();
  }

}

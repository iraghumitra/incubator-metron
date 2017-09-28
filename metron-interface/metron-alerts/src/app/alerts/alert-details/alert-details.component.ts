/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { Component, OnInit } from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import {SearchService} from '../../service/search.service';
import {UpdateService} from '../../service/update.service';
import {Alert} from '../../model/alert';
import {AlertsService} from '../../service/alerts.service';
import {AlertSource} from '../../model/alert-source';
import {PatchRequest} from '../../model/patch-request';
import {Patch} from '../../model/patch';
import {AlertComment} from './alert-comment';
import {AuthenticationService} from '../../service/authentication.service';
import {MetronDialogBox} from '../../shared/metron-dialog-box';

export enum AlertState {
  NEW, OPEN, ESCALATE, DISMISS, RESOLVE
}

export enum Tabs {
  DETAILS, COMMENTS
}

@Component({
  selector: 'app-alert-details',
  templateUrl: './alert-details.component.html',
  styleUrls: ['./alert-details.component.scss']
})
export class AlertDetailsComponent implements OnInit {

  alertId = '';
  alertSourceType = '';
  alertIndex = '';
  alertState = AlertState;
  tabs = Tabs;
  activeTab = Tabs.DETAILS;
  selectedAlertState: AlertState = AlertState.NEW;
  alertSource: AlertSource = new AlertSource();
  alertFields: string[] = [];
  patchData = new Patch('/comments', '');
  alertComment: AlertComment;
  alertComments: AlertComment[] = [];

  constructor(private router: Router,
              private activatedRoute: ActivatedRoute,
              private searchService: SearchService,
              private updateService: UpdateService,
              private alertsService: AlertsService,
              private authenticationService: AuthenticationService,
              private metronDialogBox: MetronDialogBox) {

  }

  goBack() {
    this.router.navigateByUrl('/alerts-list');
    return false;
  }

  getData() {
    this.alertComment = new AlertComment(this.authenticationService.getCurrentUserName());

    this.searchService.getAlert(this.alertSourceType, this.alertId).subscribe(alert => {
      this.alertSource = alert;
      this.alertFields = Object.keys(alert).filter(field => !field.includes(':ts') && field !== 'original_string' && field !== 'comments').sort();
      this.selectedAlertState = this.getAlertState(alert['alert_status']);
      this.alertComments = alert['comments'] ? alert['comments'] : [];
    });
  }

  getAlertState(alertStatus) {
    if (alertStatus === 'OPEN') {
      return AlertState.OPEN;
    } else if (alertStatus === 'ESCALATE') {
      return AlertState.ESCALATE;
    } else if (alertStatus === 'DISMISS') {
      return AlertState.DISMISS;
    } else if (alertStatus === 'RESOLVE') {
      return AlertState.RESOLVE;
    } else {
      return AlertState.NEW;
    }
  }

  ngOnInit() {
    this.activatedRoute.params.subscribe(params => {
      this.alertId = params['guid'];
      this.alertSourceType = params['sourceType'];
      this.alertIndex = params['index'];
      this.getData();
    });
  };

  processOpen() {
    let tAlert = new Alert();
    tAlert.source = this.alertSource;

    this.selectedAlertState = AlertState.OPEN;
    this.updateService.updateAlertState([tAlert], 'OPEN').subscribe(results => {
      this.getData();
    });
  }

  processNew() {
    let tAlert = new Alert();
    tAlert.source = this.alertSource;

    this.selectedAlertState = AlertState.NEW;
    this.updateService.updateAlertState([tAlert], 'NEW').subscribe(results => {
      this.getData();
    });
  }

  processEscalate() {
    let tAlert = new Alert();
    tAlert.source = this.alertSource;

    this.selectedAlertState = AlertState.ESCALATE;
    this.updateService.updateAlertState([tAlert], 'ESCALATE').subscribe(results => {
      this.getData();
    });
    this.alertsService.escalate([tAlert]).subscribe();
  }

  processDismiss() {
    let tAlert = new Alert();
    tAlert.source = this.alertSource;

    this.selectedAlertState = AlertState.DISMISS;
    this.updateService.updateAlertState([tAlert], 'DISMISS').subscribe(results => {
      this.getData();
    });
  }

  processResolve() {
    let tAlert = new Alert();
    tAlert.source = this.alertSource;

    this.selectedAlertState = AlertState.RESOLVE;
    this.updateService.updateAlertState([tAlert], 'RESOLVE').subscribe(results => {
      this.getData();
    });
  }

  onAddComment() {
    this.alertComment.timestamp = new Date().getTime();
    this.alertComments.push(this.alertComment);

    this.patchData.op = 'add';
    this.patchData.value = this.alertComments;

    this.patchAlert();
  }

  patchAlert() {
    let patchRequest = new PatchRequest();
    patchRequest.guid = this.alertSource.guid;
    patchRequest.index = this.alertIndex;
    patchRequest.patch = [this.patchData];
    patchRequest.sensorType = this.alertSourceType;

    this.updateService.patch(patchRequest).subscribe(() => {
      this.getData();
    });
  }

  onDeleteComment(index: number) {
    let commentText =  'Do you wish to delete the comment ';
    if (this.alertComments[index].comment.length > 25 ) {
      commentText += ' \'' + this.alertComments[index].comment.substr(0, 25) + '...\'';
    } else {
      commentText += ' \'' + this.alertComments[index].comment + '\'';
    }

    this.metronDialogBox.showConfirmationMessage(commentText).subscribe(response => {
      if(response) {
        this.alertComments.splice(index, 1);

        this.patchData.op = 'add';
        this.patchData.value = this.alertComments;

        this.patchAlert();
      }
    });
  }
}



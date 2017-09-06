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

import { Component, OnInit, Input, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import {Subscription} from 'rxjs/Rx';
import {Router} from '@angular/router';

import {TableViewComponent} from '../table-view/table-view.component';
import {AlertsSearchResponse} from '../../../model/alerts-search-response';
import {QueryBuilder} from '../query-builder';
import {AlertService} from '../../../service/alert.service';
import {TreeGroupData} from './tree-group-data';
import {GroupResponse} from '../../../model/group-response';
import {GroupResult} from '../../../model/group-result';
import {Group} from '../../../model/group';
import {SortField} from '../../../model/sort-field';
import {Sort} from '../../../utils/enums';

@Component({
  selector: 'app-tree-view',
  templateUrl: './tree-view.component.html',
  styleUrls: ['./tree-view.component.scss']
})

export class TreeViewComponent extends TableViewComponent implements OnInit, OnChanges, OnDestroy {

  groupByFields: string[] = [];
  groupPollingTimer: Subscription;
  searchResponse: GroupResponse = new GroupResponse();
  topGroups: TreeGroupData[] = [];
  treeGroupSubscriptionMap: {[key: string]: TreeGroupData } = {};

  @Input() groups: Group[] = [];
  @Input() queryBuilder: QueryBuilder;
  @Input() pauseRefresh = false;
  @Input() refreshInterval: number;

  constructor(router: Router,
              private alertsService: AlertService) {
    super(router);
  }

  collapseGroup(groupArray:TreeGroupData[], level:number, index:number) {
    for (let i = index + 1; i < groupArray.length; i++) {
      if (groupArray[i].level > (level)) {
        groupArray[i].show = false;
        groupArray[i].expand = false;
      } else {
        break;
      }
    }
  }

  createQuery(selectedGroup: TreeGroupData) {
    let searchQuery = this.queryBuilder.generateSelect();
    let groupQery = Object.keys(selectedGroup.groupQueryMap).map(key => {
      return key.replace(/:/g, '\\:') +
          ':' +
          String(selectedGroup.groupQueryMap[key])
          .replace(/[\*\+\-=~><\"\?^\${}\(\)\:\!\/[\]\\\s]/g, '\\$&') // replace single  special characters
          .replace(/\|\|/g, '\\||') // replace ||
          .replace(/\&\&/g, '\\&&'); // replace &&
    }).join(' AND ');

    groupQery += searchQuery === '*' ? '' : (' AND ' + searchQuery);
    return groupQery;
  }

  expandGroup(groupArray:TreeGroupData[], level:number, index:number) {
    for (let i = index + 1; i < groupArray.length; i++) {
      if (groupArray[i].level === (level + 1)) {
        groupArray[i].show = true;
      } else {
        break;
      }
    }
  }

  getAlerts(selectedGroup: TreeGroupData) {
    selectedGroup.searchRequest.query = this.createQuery(selectedGroup);
    selectedGroup.searchRequest.from = selectedGroup.pagingData.from;
    selectedGroup.searchRequest.size = selectedGroup.pagingData.size;
    selectedGroup.searchRequest.sort = selectedGroup.sortField ? [selectedGroup.sortField] : [];

    this.search(selectedGroup);
  }

  getGroups() {
    this.alertsService.groups(this.queryBuilder.groupRequest).subscribe(groupResponse => {
      this.updateGroupData(groupResponse);
      this.pollGroups();
    });
  }

  pollGroups() {
    if (!this.pauseRefresh) {
      this.stopGroupPolling();
      this.groupPollingTimer = this.alertsService.pollGroups(this.queryBuilder.groupRequest).subscribe(groupResponse => {
        this.updateGroupData(groupResponse);
      });
    }
  }

  stopGroupPolling() {
    if (this.groupPollingTimer && !this.groupPollingTimer.closed) {
      this.groupPollingTimer.unsubscribe();
    }
  }

  updateGroupData(groupResponse) {
    this.searchResponse = groupResponse;
    this.parseTopLevelGroup();
  }

  groupPageChange(group: TreeGroupData) {
    this.getAlerts(group);
  }

  createTopGroups(groupByFields: string[]) {
    this.topGroups = [];
    this.treeGroupSubscriptionMap = {};

    this.searchResponse.groupResults.forEach((groupResult: GroupResult) => {
      let treeGroupData = new TreeGroupData(groupResult.key, groupResult.total, groupResult.score, 0, false);
      if (groupByFields.length === 1) {
        treeGroupData.groupQueryMap  = this.createTopGroupQueryMap(groupByFields[0], groupResult);
      }

      this.topGroups.push(treeGroupData);
    });
  }

  createTopGroupQueryMap(groupByFields:string, groupResult:GroupResult) {
    let groupQueryMap = {};
    groupQueryMap[groupByFields] = groupResult.key;
    return groupQueryMap;
  }

  initMap() {
    let groupByFields = this.queryBuilder.groupRequest.groups.map(group => group.field);

    if (this.topGroups.length == 0 || JSON.stringify(this.groupByFields) !== JSON.stringify(groupByFields)) {
      this.createTopGroups(groupByFields);
    }

    this.groupByFields = groupByFields;
  }

  ngOnChanges(changes: SimpleChanges) {
    if((changes['groups'] && changes['groups'].currentValue) ||
        (changes['refreshInterval'] && changes['refreshInterval'].currentValue)) {
      this.getGroups();
    }
  }

  ngOnInit() {
    this.getGroups();
  }

  ngOnDestroy() {
    this.stopGroupPolling();
  }

  search(selectedGroup: TreeGroupData) {
    this.alertsService.search(selectedGroup.searchRequest).subscribe(results => {
      this.setData(selectedGroup, results);
    }, error => {
      // this.metronDialogBox.showConfirmationMessage(ElasticsearchUtils.extractESErrorMessage(error), DialogType.Error);
    });
  }

  setData(selectedGroup: TreeGroupData, results: AlertsSearchResponse) {
    selectedGroup.response.results = results.results;
    selectedGroup.pagingData.total = results.total;
  }

  checkAndToSubscription(group: TreeGroupData) {
    if (group.groupQueryMap) {
      this.getAlerts(group);
      let key = JSON.stringify(group.groupQueryMap);
      this.treeGroupSubscriptionMap[key] = group;
    }
  }

  removeFromSubscription(group: TreeGroupData) {
    if (group.groupQueryMap) {
      let key = JSON.stringify(group.groupQueryMap);
      delete this.treeGroupSubscriptionMap[key];
    }
  }

  toggleSubGroups(topLevelGroup: TreeGroupData, selectedGroup: TreeGroupData, index: number) {
    selectedGroup.expand = !selectedGroup.expand;

    if (selectedGroup.expand) {
      this.expandGroup(topLevelGroup.treeSubGroups, selectedGroup.level, index);
      this.checkAndToSubscription(selectedGroup);
    } else {
      this.collapseGroup(topLevelGroup.treeSubGroups, selectedGroup.level, index);
      this.removeFromSubscription(selectedGroup);
    }
  }

  toggleTopLevelGroup(group: TreeGroupData) {
    group.expand = !group.expand;
    group.show = !group.show;

    if (group.expand) {
      this.checkAndToSubscription(group);
    } else {
      this.removeFromSubscription(group);
    }
  }

  parseSubGroups(group: GroupResult, groupAsArray: TreeGroupData[], existingGroupAsArray: TreeGroupData[],
                 groupQueryMap: {[key: string]: string}, groupedBy: string, level: number, index: number): number {
    index++;
    groupQueryMap[groupedBy] = group.key;

    let currentTreeNodeData = (groupAsArray.length > 0) ? groupAsArray[index] : null;

    if (currentTreeNodeData && (currentTreeNodeData.key === group.key) && (currentTreeNodeData.level === level)) {
      currentTreeNodeData.total = group.total;
    } else {
      let newTreeNodeData = new TreeGroupData(group.key, group.total, group.score, level, level === 1);
      if (!currentTreeNodeData) {
        groupAsArray.push(newTreeNodeData);
      } else {
        groupAsArray.splice(index, 1, newTreeNodeData);
      }
    }

    if (!group.groupResults) {
      groupAsArray[index].groupQueryMap = JSON.parse(JSON.stringify(groupQueryMap));
      if(groupAsArray[index].expand && groupAsArray[index].show && groupAsArray[index].groupQueryMap) {
        this.checkAndToSubscription(groupAsArray[index]);
      }
      return index;
    }

    group.groupResults.forEach(subGroup => {
      index = this.parseSubGroups(subGroup, groupAsArray, existingGroupAsArray, groupQueryMap, group.groupedBy, level+1, index)
    });

    return index;
  }

  parseTopLevelGroup() {
    let groupedBy = this.searchResponse.groupedBy;

    this.initMap();

    for (let i = 0; i < this.searchResponse.groupResults.length; i++) {
      let index = -1;
      let topGroup = this.topGroups[i];
      let resultGroup = this.searchResponse.groupResults[i];
      let groupQueryMap = this.createTopGroupQueryMap(groupedBy, resultGroup);
      let existingGroupAsArray = [];//JSON.parse(JSON.stringify(topGroup.treeSubGroups));


      if (resultGroup.groupResults) {
        resultGroup.groupResults.forEach(subGroup => {
          index = this.parseSubGroups(subGroup, topGroup.treeSubGroups, existingGroupAsArray, groupQueryMap, resultGroup.groupedBy, 1, index);
        });

        topGroup.treeSubGroups.splice(index+1);
      }
    }

  }

  sortTreeSubGroup($event, treeGroup: TreeGroupData) {
    let sortBy = $event.sortBy === 'id' ? '_uid' : $event.sortBy;

    let sortField = new SortField();
    sortField.field = sortBy;
    sortField.sortOrder = $event.sortOrder === Sort.ASC ? 'asc' : 'desc';

    treeGroup.sortEvent = $event;
    treeGroup.treeSubGroups.forEach(treeSubGroup => treeSubGroup.sortField = sortField);

    this.refreshAllExpandedGroups();
  }

  refreshAllExpandedGroups() {
    Object.keys(this.treeGroupSubscriptionMap).forEach(key => {
      this.getAlerts(this.treeGroupSubscriptionMap[key]);
    })
  }
}

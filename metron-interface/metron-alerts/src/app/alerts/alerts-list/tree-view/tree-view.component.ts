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

import { Component, OnInit, Input, OnChanges, SimpleChanges, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import {Subscription} from 'rxjs/Rx';
import {Router} from '@angular/router';

import {SearchResultGroup} from '../../../model/search-result-group';
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
import {SortEvent} from '../../../shared/metron-table/metron-table.directive';

@Component({
  selector: 'app-tree-view',
  templateUrl: './tree-view.component.html',
  styleUrls: ['./tree-view.component.scss']
})

export class TreeViewComponent extends TableViewComponent implements OnInit, OnChanges, OnDestroy {

  groupKeys: string[] = [];
  groupByFields: string[] = [];
  groupPollingTimer: Subscription;
  subGroupPollingTimersMap: {[key: string]: Subscription } = {};
  // groupDFSMap: { [key:string]: TreeGroupData[]} = {};
  searchResponse: GroupResponse = new GroupResponse();


  topGroups: TreeGroupData[] = [];
  treeGroupSubscriptionMap: {[key: string]: TreeGroupData } = {};

  @Input() groups: Group[] = [];
  @Input() queryBuilder: QueryBuilder;
  @Input() pauseRefresh = false;
  @Input() refreshInterval: number;

  @ViewChild('root') root: ElementRef;

  constructor(router: Router,
              private alertsService: AlertService) {
    super(router);
  }

  checkGroupsAndGetData() {
    let groupByFields = this.queryBuilder.groupRequest.groups.map(group => group.field);
    if (JSON.stringify(this.groupByFields) !== JSON.stringify(groupByFields)) {
      this.groupByFields = groupByFields;
      this.getGroups();
    }
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

  groupExpandCollapse(groupArray: TreeGroupData[], level: number, index: number) {
    let selectedGroup = groupArray[index];

    if (selectedGroup.expand) {
      this.collapseGroup(groupArray, level, index);
    } else {
      this.expandGroup(groupArray, level, index);
    }

    selectedGroup.expand = !selectedGroup.expand;

    if (selectedGroup.groupQueryMap) {
      if (selectedGroup.expand) {
        this.getAlerts(selectedGroup);
        this.tryStartPolling(selectedGroup);
      } else {
        this.tryStopPolling(selectedGroup);
      }
    }
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

  private createTopGroupQueryMap(groupByFields:string, groupResult:GroupResult) {
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

  // merge_map(newKeys: string[], oldKeys: string[]) {
  //   let deleteKeys = oldKeys.filter(key => newKeys.indexOf(key) === -1);
  //   deleteKeys.forEach(key => delete this.groupDFSMap);
  //
  //   if (!this.groupDFSMap) {
  //     this.groupDFSMap = {};
  //   }
  // }

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


  tryStartPolling(selectedGroup: TreeGroupData) {
    // if (!this.pauseRefresh) {
    //   let refreshTimer = this.alertsService.pollSearch(selectedGroup.searchRequest).subscribe(results => {
    //     this.setData(selectedGroup, results);
    //   });
    //   this.addToPollingMap(selectedGroup, refreshTimer);
    // }
  }

  addToPollingMap(selectedGroup:TreeGroupData, refreshTimer:Subscription) {
    let queryKey = this.createQuery(selectedGroup);
    if (!this.subGroupPollingTimersMap[queryKey]) {
      this.subGroupPollingTimersMap[queryKey] = null;
    }
    this.subGroupPollingTimersMap[queryKey] = refreshTimer;
  }

  removeFromPollingMap(selectedGroup:TreeGroupData) {
    let queryKey = this.createQuery(selectedGroup);
    delete this.subGroupPollingTimersMap[queryKey];
  }

  tryStopPolling(selectedGroup: TreeGroupData) {
    let refreshTimer = this.getTimer(selectedGroup);
    if (refreshTimer && !refreshTimer.closed) {
      refreshTimer.unsubscribe();
      this.removeFromPollingMap(selectedGroup);
    }
  }

  getTimer(selectedGroup:TreeGroupData) {
    let queryKey = this.createQuery(selectedGroup);
    let refreshTimer = this.subGroupPollingTimersMap[queryKey];
    return refreshTimer;
  }

  tryStopAll() {
    if (this.pauseRefresh) {

      Object.keys(this.subGroupPollingTimersMap).forEach(query =>  {
        let refreshTimer = this.subGroupPollingTimersMap[query];
        if (!refreshTimer.closed) {
          refreshTimer.unsubscribe();
          delete this.subGroupPollingTimersMap[query];
        }
      });

    }
  }

  tryStartAll() {
    // if (!this.pauseRefresh) {
    //   Object.keys(this.groupDFSMap).forEach(key => {
    //     let treeGroupItems = this.groupDFSMap[key];
    //     treeGroupItems.forEach(treeGroup => {
    //       if (treeGroup.expand && treeGroup.show && treeGroup.groupQueryMap) {
    //         this.tryStartPolling(treeGroup);
    //       }
    //     });
    //   });
    // }
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
    // let newKeys = [];
    // let oldKeys = Object.keys(this.groupDFSMap);
    let groupedBy = this.searchResponse.groupedBy;

    this.root.nativeElement.style.minHeight = this.root.nativeElement.offsetHeight + 'px';

    this.tryStopAll();
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



    // this.searchResponse.groupResults.forEach(group => {
    //   let groupAsArray: TreeGroupData[] = [];
    //   let groupQueryMap: {[key: string]: string} = {};
    //   let existingGroupAsArray = this.groupDFSMap[group.key] ? JSON.parse(JSON.stringify(this.groupDFSMap[group.key])): [];
    //
    //   this.parseSubGroups(group, groupAsArray, existingGroupAsArray, groupQueryMap, groupedBy, 0);
    //   newKeys.push(group.key);
    //
    //   this.groupDFSMap[group.key] = groupAsArray;
    //   this.groupSortMap[group.key] = this.groupSortMap[group.key] ? this.groupSortMap[group.key] : { sortBy : '',  type: '', sortOrder: Sort.ASC};
    //
    // });
    //
    // this.merge_map(newKeys, oldKeys);
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

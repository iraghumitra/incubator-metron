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
import {Component, OnInit, ViewChild, ElementRef, OnDestroy} from '@angular/core';
import {Router, NavigationStart} from '@angular/router';
import {Observable, Subscription} from 'rxjs/Rx';

import {Alert} from '../../model/alert';
import {AlertService} from '../../service/alert.service';
import {QueryBuilder} from './query-builder';
import {ConfigureTableService} from '../../service/configure-table.service';
import {WorkflowService} from '../../service/workflow.service';
import {ClusterMetaDataService} from '../../service/cluster-metadata.service';
import {ColumnMetadata} from '../../model/column-metadata';
import {SortEvent} from '../../shared/metron-table/metron-table.directive';
import {Sort} from '../../utils/enums';
import {Pagination} from '../../model/pagination';
import {SaveSearchService} from '../../service/save-search.service';
import {RefreshInterval} from '../configure-rows/configure-rows-enums';
import {SaveSearch} from '../../model/save-search';
import {TableMetadata} from '../../model/table-metadata';
import {MetronDialogBox, DialogType} from '../../shared/metron-dialog-box';
import {AlertSearchDirective} from '../../shared/directives/alert-search.directive';
import {AlertsSearchResponse} from '../../model/alerts-search-response';
import {ElasticsearchUtils} from '../../utils/elasticsearch-utils';

@Component({
  selector: 'app-alerts-list',
  templateUrl: './alerts-list.component.html',
  styleUrls: ['./alerts-list.component.scss']
})

export class AlertsListComponent implements OnInit, OnDestroy {

  alertsColumns: ColumnMetadata[] = [];
  alertsColumnsToDisplay: ColumnMetadata[] = [];
  selectedAlerts: Alert[] = [];
  alerts: Alert[] = [];
  alertsSearchResponse: AlertsSearchResponse = new AlertsSearchResponse();
  colNumberTimerId: number;
  refreshInterval = RefreshInterval.ONE_MIN;
  refreshTimer: Subscription;
  pauseRefresh = false;
  lastPauseRefreshValue = false;
  threatScoreFieldName = 'threat:triage:score';

  @ViewChild('table') table: ElementRef;
  @ViewChild(AlertSearchDirective) alertSearchDirective: AlertSearchDirective;

  pagingData = new Pagination();
  tableMetaData = new TableMetadata();
  queryBuilder: QueryBuilder = new QueryBuilder();

  constructor(private router: Router,
              private alertsService: AlertService,
              private configureTableService: ConfigureTableService,
              private workflowService: WorkflowService,
              private clusterMetaDataService: ClusterMetaDataService,
              private saveSearchService: SaveSearchService,
              private metronDialogBox: MetronDialogBox) {
    router.events.subscribe(event => {
      if (event instanceof NavigationStart && event.url === '/alerts-list') {
        this.selectedAlerts = [];
        this.restoreRefreshState();
      }
    });
  }

  addAlertColChangedListner() {
    this.configureTableService.tableChanged$.subscribe(colChanged => {
      if (colChanged) {
        this.getAlertColumnNames(false);
      }
    });
  }

  addLoadSavedSearchListner() {
    this.saveSearchService.loadSavedSearch$.subscribe((savedSearch: SaveSearch) => {
      let queryBuilder = new QueryBuilder();
      queryBuilder.searchRequest = savedSearch.searchRequest;
      this.queryBuilder = queryBuilder;
      this.prepareColumnData(savedSearch.tableColumns, []);
      this.search(true, savedSearch);
    });
  }

  calcColumnsToDisplay() {
    let availableWidth = document.documentElement.clientWidth - (200 + (15 * 3)); /* screenwidth - (navPaneWidth + (paddings))*/
    availableWidth = availableWidth - (55 + 25 + 25); /* availableWidth - (score + colunSelectIcon +selectCheckbox )*/
    let tWidth = 0;
    this.alertsColumnsToDisplay =  this.alertsColumns.filter(colMetaData => {
      if (colMetaData.type.toUpperCase() === 'DATE') {
        tWidth += 140;
      } else if (colMetaData.type.toUpperCase() === 'IP') {
        tWidth += 120;
      } else if (colMetaData.type.toUpperCase() === 'BOOLEAN') {
        tWidth += 50;
      } else {
        tWidth += 130;
      }

      return tWidth < availableWidth;
    });
  }

  getAlertColumnNames(resetPaginationForSearch: boolean) {
    Observable.forkJoin(
      this.configureTableService.getTableMetadata(),
      this.clusterMetaDataService.getDefaultColumns()
    ).subscribe((response: any) => {
      this.prepareData(response[0], response[1], resetPaginationForSearch);
    });
  }

  getCollapseComponentData(data: any) {
    return {
      getName: () => {
        return Object.keys(data.aggregations)[0];
      },
      getData: () => {
        return data.aggregations[Object.keys(data.aggregations)[0]].buckets;
      },
    };
  }

  getColumnNamesForQuery() {
    let fieldNames = this.alertsColumns.map(columnMetadata => columnMetadata.name);
    fieldNames = fieldNames.filter(name => !(name === 'id' || name === 'alert_status'));
    fieldNames.push(this.threatScoreFieldName);
    return fieldNames;
  }

  ngOnDestroy() {
    this.tryStopPolling();
  }

  ngOnInit() {
    this.getAlertColumnNames(true);
    this.addAlertColChangedListner();
    this.addLoadSavedSearchListner();
  }

  onClear() {
    this.queryBuilder.displayQuery = '';
    this.search();
  }

  onSearch($event) {
    this.queryBuilder.displayQuery = $event;
    this.search();

    return false;
  }

  onAddFilter(map: {}) {
    let keys = Object.keys(map);
    keys.forEach(key => { this.queryBuilder.addOrUpdateFilter(key, map[key]); });
    this.search();
  }

  onConfigRowsChange() {
    this.alertsService.interval = this.refreshInterval;
    this.search();
  }

  onGroupsChange(groups) {
    this.queryBuilder.setGroupby(groups);
    if (groups.length == 0) {
      this.tryStartPolling();
    } else {
      this.tryStopPolling();
    }
  }
  
  onPageChange() {
    this.queryBuilder.setFromAndSize(this.pagingData.from, this.pagingData.size);
    this.search(false);
  }

  onPausePlay() {
    this.pauseRefresh = !this.pauseRefresh;
    if (this.pauseRefresh) {
      this.tryStopPolling();
    } else {
      this.search(false);
    }
  }

  onResize() {
    clearTimeout(this.colNumberTimerId);
    this.colNumberTimerId = setTimeout(() => { this.calcColumnsToDisplay(); }, 500);
  }

  onSort(sortEvent: SortEvent) {
    let sortOrder = (sortEvent.sortOrder === Sort.ASC ? 'asc' : 'desc');
    let sortBy = sortEvent.sortBy === 'id' ? '_uid' : sortEvent.sortBy;
    this.queryBuilder.setSort(sortBy, sortOrder);
    this.search();
  }

  prepareColumnData(configuredColumns: ColumnMetadata[], defaultColumns: ColumnMetadata[]) {
    this.alertsColumns = (configuredColumns && configuredColumns.length > 0) ? configuredColumns : defaultColumns;
    this.queryBuilder.setFields(this.getColumnNamesForQuery());
    this.calcColumnsToDisplay();
  }

  prepareData(tableMetaData: TableMetadata, defaultColumns: ColumnMetadata[], resetPagination: boolean) {
    this.tableMetaData = tableMetaData;
    this.pagingData.size = this.tableMetaData.size;
    this.refreshInterval = this.tableMetaData.refreshInterval;

    this.updateConfigRowsSettings();
    this.prepareColumnData(tableMetaData.tableColumns, defaultColumns);

    this.search(resetPagination);
  }

  processEscalate() {
    this.workflowService.start(this.selectedAlerts).subscribe(workflowId => {
      this.alertsService.updateAlertState(this.selectedAlerts, 'ESCALATE', workflowId).subscribe(results => {
        this.updateSelectedAlertStatus('ESCALATE');
      });
    });
  }

  processDismiss() {
    this.alertsService.updateAlertState(this.selectedAlerts, 'DISMISS', '').subscribe(results => {
      this.updateSelectedAlertStatus('DISMISS');
    });
  }

  processOpen() {
    this.alertsService.updateAlertState(this.selectedAlerts, 'OPEN', '').subscribe(results => {
      this.updateSelectedAlertStatus('OPEN');
    });
  }

  processResolve() {
    this.alertsService.updateAlertState(this.selectedAlerts, 'RESOLVE', '').subscribe(results => {
      this.updateSelectedAlertStatus('RESOLVE');
    });
  }

  removeFilter(field: string) {
    this.queryBuilder.removeFilter(field);
    this.search();
  }

  restoreRefreshState() {
    this.pauseRefresh = this.lastPauseRefreshValue;
    this.tryStartPolling();
  }

  search(resetPaginationParams = true, savedSearch?: SaveSearch) {
    this.selectedAlerts = [];

    if (resetPaginationParams) {
      this.pagingData.from = 0;
      this.queryBuilder.setFromAndSize(this.pagingData.from, this.pagingData.size);
    }

    if (this.queryBuilder.query !== '*') {
      if (!savedSearch) {
        savedSearch = new SaveSearch();
        savedSearch.searchRequest = this.queryBuilder.searchRequest;
        savedSearch.tableColumns = this.alertsColumns;
        savedSearch.name = savedSearch.getDisplayString();
      }

      this.saveSearchService.saveAsRecentSearches(savedSearch).subscribe(() => {});
    }

    this.alertsService.search(this.queryBuilder.searchRequest).subscribe(results => {
      this.setData(results);
    }, error => {
      this.setData(new AlertsSearchResponse());
      this.metronDialogBox.showConfirmationMessage(ElasticsearchUtils.extractESErrorMessage(error), DialogType.Error);
    });

    this.tryStartPolling();
  }

  setData(results: AlertsSearchResponse) {
    this.alertsSearchResponse = results;
    this.alerts = results.results ? results.results : [];
    this.pagingData.total = results.total;
  }

  showDetails() {
    this.saveRefreshState();
    this.router.navigateByUrl('/alerts-list(dialog:configure-table)');
  }

  // showDetails($event, alert: Alert) {
  //   if ($event.target.type !== 'checkbox' && $event.target.parentElement.firstChild.type !== 'checkbox' && $event.target.nodeName !== 'A') {
  //     this.selectedAlerts = [];
  //     this.selectedAlerts = [alert];
  //     this.saveRefreshState();
  //     this.router.navigateByUrl('/alerts-list(dialog:details/' + alert.source['source:type'] + '/' + alert.source.guid + ')');
  //   }
  // }

  saveRefreshState() {
    this.lastPauseRefreshValue = this.pauseRefresh;
    this.tryStopPolling();
  }


  showSavedSearches() {
    this.saveRefreshState();
    this.router.navigateByUrl('/alerts-list(dialog:saved-searches)');
  }

  showSaveSearch() {
    this.saveRefreshState();
    this.saveSearchService.setCurrentQueryBuilderAndTableColumns(this.queryBuilder, this.alertsColumns);
    this.router.navigateByUrl('/alerts-list(dialog:save-search)');
  }

  tryStartPolling() {
    if (!this.pauseRefresh) {
      this.tryStopPolling();
      this.refreshTimer = this.alertsService.pollSearch(this.queryBuilder.searchRequest).subscribe(results => {
        this.setData(results);
      });
    }
  }

  tryStopPolling() {
    if (this.refreshTimer && !this.refreshTimer.closed) {
      this.refreshTimer.unsubscribe();
    }
  }

  updateConfigRowsSettings() {
    this.alertsService.interval = this.refreshInterval;
    this.queryBuilder.setFromAndSize(this.pagingData.from, this.pagingData.size);
  }

  updateSelectedAlertStatus(status: string) {
    for (let alert of this.selectedAlerts) {
      alert.status = status;
    }
  }
}

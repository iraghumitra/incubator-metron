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
import {Injectable, Inject, } from '@angular/core';
import {Observable} from 'rxjs/Rx';
import {Http} from '@angular/http';
import {Subject} from 'rxjs/Subject';

import {IAppConfig} from '../app.config.interface';
import {APP_CONFIG} from '../app.config';
import {ALERTS_SAVED_SEARCH, ALERTS_RECENT_SEARCH, NUM_SAVED_SEARCH} from '../utils/constants';
import {QueryBuilder} from '../model/query-builder';
import {SaveSearch} from '../model/save-search';
import {ColumnMetadata} from '../model/column-metadata';

@Injectable()
export class SaveSearchService {

  queryBuilder: QueryBuilder;
  tableColumns: ColumnMetadata[];

  private loadSavedSearch = new Subject<SaveSearch>();
  loadSavedSearch$ = this.loadSavedSearch.asObservable();
  defaultHeaders = {'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest'};

  constructor(private http: Http, @Inject(APP_CONFIG) private config: IAppConfig) {
  }

  deleteRecentSearch(saveSearch: SaveSearch): Observable<{}> {
    return Observable.create(observer => {
      let recentSearches: SaveSearch[] = [];
      try {
        recentSearches = JSON.parse(localStorage.getItem(ALERTS_RECENT_SEARCH));
        recentSearches = recentSearches.filter(search => search.name !== saveSearch.name);
      } catch (e) {}

      localStorage.setItem(ALERTS_RECENT_SEARCH, JSON.stringify(recentSearches));

      observer.next({});
      observer.complete();

    });
  }

  deleteSavedSearch(saveSearch: SaveSearch): Observable<{}> {
    return Observable.create(observer => {
      let savedSearches: SaveSearch[] = [];
      try {
        savedSearches = JSON.parse(localStorage.getItem(ALERTS_SAVED_SEARCH));
        savedSearches = savedSearches.filter(search => search.name !== saveSearch.name);
      } catch (e) {}

      localStorage.setItem(ALERTS_SAVED_SEARCH, JSON.stringify(savedSearches));

      observer.next({});
      observer.complete();

    });
  }

  fireLoadSavedSearch(savedSearch: SaveSearch) {
    this.loadSavedSearch.next(savedSearch);
  }

  listRecentSearches(): Observable<SaveSearch[]> {
    return Observable.create(observer => {
      let savedSearches: SaveSearch[] = [];
      try {
        savedSearches = JSON.parse(localStorage.getItem(ALERTS_RECENT_SEARCH));
      } catch (e) {}

      savedSearches = savedSearches || [];
      savedSearches = savedSearches.map(tSaveSeacrh => SaveSearch.fromJSON(tSaveSeacrh));

      observer.next(savedSearches);
      observer.complete();

    });
  }

  listSavedSearches(): Observable<SaveSearch[]> {
    return Observable.create(observer => {
      let savedSearches: SaveSearch[] = [];
      try {
        savedSearches = JSON.parse(localStorage.getItem(ALERTS_SAVED_SEARCH));
      } catch (e) {}

      savedSearches = savedSearches || [];
      savedSearches = savedSearches.map(tSaveSeacrh => SaveSearch.fromJSON(tSaveSeacrh));

      observer.next(savedSearches);
      observer.complete();

    });
  }

  saveAsRecentSearches(saveSearch: SaveSearch): Observable<{}> {
    return Observable.create(observer => {
      let savedSearches: SaveSearch[] = [];
      saveSearch.lastAccessed = new Date().getTime();

      try {
        savedSearches = JSON.parse(localStorage.getItem(ALERTS_RECENT_SEARCH));
      } catch (e) {}

      savedSearches = savedSearches || [];
      savedSearches = savedSearches.map(tSaveSeacrh => SaveSearch.fromJSON(tSaveSeacrh));

      if (savedSearches.length  === 0) {
        savedSearches.push(saveSearch);
      } else {
        let found = false;
        for ( let tSaveSearch of savedSearches) {
          if (saveSearch.name === tSaveSearch.name) {
            tSaveSearch.lastAccessed = new Date().getTime();
            found = true;
            break;
          }
        }
        if (!found ) {
          if (savedSearches.length < NUM_SAVED_SEARCH) {
            savedSearches.push(saveSearch);
          } else {
            savedSearches.sort((s1, s2) => s1.lastAccessed - s2.lastAccessed).shift();
            savedSearches.push(saveSearch);
          }
        }
      }

      localStorage.setItem(ALERTS_RECENT_SEARCH, JSON.stringify(savedSearches));

      observer.next({});
      observer.complete();

    });
  }

  saveSearch(saveSearch: SaveSearch): Observable<{}> {
    return Observable.create(observer => {
      let savedSearches: SaveSearch[] = [];
      try {
        savedSearches = JSON.parse(localStorage.getItem(ALERTS_SAVED_SEARCH));
      } catch (e) {}

      savedSearches = savedSearches || [];
      savedSearches.push(saveSearch);
      localStorage.setItem(ALERTS_SAVED_SEARCH, JSON.stringify(savedSearches));

      observer.next({});
      observer.complete();

    });
  }

  setCurrentQueryBuilderAndTableColumns(queryBuilder: QueryBuilder, tableColumns: ColumnMetadata[]) {
    this.queryBuilder = queryBuilder;
    this.tableColumns = tableColumns;
  }

  updateSearch(saveSearch: SaveSearch): Observable<{}> {
    return Observable.create(observer => {
      let savedSearches: SaveSearch[] = [];
      try {
        savedSearches = JSON.parse(localStorage.getItem(ALERTS_SAVED_SEARCH));
        let savedItem = savedSearches.find(search => search.name === saveSearch.name);
        savedItem.lastAccessed = saveSearch.lastAccessed;
        savedItem.queryBuilder = saveSearch.queryBuilder;
      } catch (e) {}

      localStorage.setItem(ALERTS_SAVED_SEARCH, JSON.stringify(savedSearches));

      observer.next({});
      observer.complete();

    });
  }
}

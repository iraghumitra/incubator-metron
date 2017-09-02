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
import {SearchRequest} from '../../../model/search-request';
import {AlertsSearchResponse} from '../../../model/alerts-search-response';
import {Pagination} from '../../../model/pagination';
import {Alert} from '../../../model/alert';

// export class TreeGroupAndPagingData {
//
//   treeGroupDataArray:  TreeGroupData[] = [];
//
//   constructor(treeGroupDataArray:TreeGroupData[]) {
//     this.pagingData = new Pagination();
//     this.treeGroupDataArray = treeGroupDataArray;
//
//
//   }
// }

export class TreeGroupData {
  key: string;
  total: number;
  level: number;
  show: boolean;
  expand = false;

  groupQueryMap = null;
  searchRequest: SearchRequest = new SearchRequest();
  response: AlertsSearchResponse = new AlertsSearchResponse();
  pagingData: Pagination = new Pagination();

  constructor(key:string, total:number, level:number, expand: boolean) {
    this.key = key;
    this.total = total;
    this.level = level;
    this.show = expand;

    this.pagingData.size = 5;
  }
}
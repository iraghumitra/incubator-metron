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
import {SortField} from './sort-field';
import {DEFAULT_FACETS, DEFAULT_GROUPS} from '../utils/constants';

export class SearchRequest {
  // _source: string[]; //TODO: This needs to be removed
  from: number;
  indices: string[] = ['websphere', 'snort', 'asa', 'bro', 'yaf'];
  query: string;
  size: number;
  sort: SortField[];
  facetFields: string[] = Array.from(new Set(DEFAULT_FACETS.concat(DEFAULT_GROUPS)));
}

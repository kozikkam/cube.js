/**
 * @title @cubejs-client/core
 * @permalink /@cubejs-client-core
 * @menuCategory Cube.js Frontend
 * @subcategory Reference
 * @menuOrder 2
 * @description Vanilla JavaScript Cube.js client.
 */

declare module '@cubejs-client/core' {
  export type TransportOptions = {
    /**
     * [jwt auth token](security)
     */
    authorization: string;
    /**
     * path to `/cubejs-api/v1`
     */
    apiUrl: string;
    /**
     * custom headers
     */
    headers?: Record<string, string>;
  };

  export interface ITransport {
    request(method: string, params: any): () => Promise<void>;
  }

  /**
   * Default transport implementation.
   * @order 3
   */
  export class HttpTransport implements ITransport {
    constructor(options: TransportOptions);
    request(method: string, params: any): () => Promise<any>;
  }

  export type CubeJSApiOptions = {
    /**
     * URL of your Cube.js Backend. By default, in the development environment it is `http://localhost:4000/cubejs-api/v1`
     */
    apiUrl: string;
    /**
     * Transport implementation to use. [HttpTransport](#http-transport) will be used by default.
     */
    transport?: ITransport;
    headers?: Record<string, string>;
    pollInterval?: number;
  };

  export type LoadMethodOptions = {
    /**
     * Key to store the current request's MUTEX inside the `mutexObj`. MUTEX object is used to reject orphaned queries results when new queries are sent. For example: if two queries are sent with the same `mutexKey` only the last one will return results.
     */
    mutexKey?: string;
    /**
     * Object to store MUTEX
     */
    mutexObj?: Object;
    /**
     * Pass `true` to use continuous fetch behavior.
     */
    subscribe?: boolean;
    /**
     * Function that receives `ProgressResult` on each `Continue wait` message.
     */
    progressCallback?(result: ProgressResult): void;
  };

  export type LoadMethodCallback<T> = (error: Error | null, resultSet: T) => void;

  export type QueryOrder = 'asc' | 'desc';

  export type Annotation = {
    title: string;
    shortTitle: string;
    type: string;
    format?: 'currency' | 'percentage';
  };

  export type QueryAnnotations = {
    dimensions: Record<string, Annotation>;
    measures: Record<string, Annotation>;
    timeDimensions: Record<string, Annotation>;
  };

  export type LoadResponse<T> = {
    annotation: QueryAnnotations;
    lastRefreshTime: string;
    query: Query;
    data: T[];
  };

  /**
   * Configuration object that contains information about pivot axes and other options.
   *
   * Let's apply `pivotConfig` and see how it affects the axes
   * ```js
   * // Example query
   * {
   *   measures: ['Orders.count'],
   *   dimensions: ['Users.country', 'Users.gender']
   * }
   * ```
   * If we put the `Users.gender` dimension on **y** axis
   * ```js
   * resultSet.tablePivot({
   *   x: ['Users.country'],
   *   y: ['Users.gender', 'measures']
   * })
   * ```
   *
   * The resulting table will look the following way
   *
   * | Users Country | male, Orders.count | female, Orders.count |
   * | ------------- | ------------------ | -------------------- |
   * | Australia     | 3                  | 27                   |
   * | Germany       | 10                 | 12                   |
   * | US            | 5                  | 7                    |
   *
   * Now let's put the `Users.country` dimension on **y** axis instead
   * ```js
   * resultSet.tablePivot({
   *   x: ['Users.gender'],
   *   y: ['Users.country', 'measures'],
   * });
   * ```
   *
   * in this case the `Users.country` values will be laid out on **y** or **columns** axis
   *
   * | Users Gender | Australia, Orders.count | Germany, Orders.count | US, Orders.count |
   * | ------------ | ----------------------- | --------------------- | ---------------- |
   * | male         | 3                       | 10                    | 5                |
   * | female       | 27                      | 12                    | 7                |
   *
   * It's also possible to put the `measures` on **x** axis. But in either case it should always be the last item of the array.
   * ```js
   * resultSet.tablePivot({
   *   x: ['Users.gender', 'measures'],
   *   y: ['Users.country'],
   * });
   * ```
   *
   * | Users Gender | measures     | Australia | Germany | US  |
   * | ------------ | ------------ | --------- | ------- | --- |
   * | male         | Orders.count | 3         | 10      | 5   |
   * | female       | Orders.count | 27        | 12      | 7   |
   */
  export type PivotConfig = {
    /**
     * Dimensions to put on **x** or **rows** axis.
     */
    x?: string[];
    /**
     * Dimensions to put on **y** or **columns** axis.
     */
    y?: string[];
    /**
     * If `true` missing dates on the time dimensions will be filled with `0` for all measures.Note: the `fillMissingDates` option set to `true` will override any **order** applied to the query
     */
    fillMissingDates?: boolean | null;
  };

  export type DrillDownLocator = {
    xValues: string[];
    yValues?: string[];
  };

  export type Series<T> = {
    key: string;
    title: string;
    series: T[];
  };

  export type Column = {
    key: string;
    title: string;
    series: [];
  };

  export type SeriesNamesColumn = {
    key: string;
    title: string;
    yValues: string[];
  };

  export type ChartPivotRow = {
    x: string;
    xValues: string[];
    [key: string]: any;
  };

  export type TableColumn = {
    key: string;
    dataIndex: string;
    meta: any;
    type: string | number;
    title: string;
    shortTitle: string;
    format?: any;
    children?: TableColumn[];
  };

  export type PivotRow = {
    xValues: Array<string | number>;
    yValuesArray: Array<[string[], number]>;
  };

  /**
   * Provides a convenient interface for data manipulation.
   */
  export class ResultSet<T = any> {
    /**
     * @hidden
     */
    static measureFromAxis(axisValues: string[]): string;
    static getNormalizedPivotConfig(query: Query, pivotConfig?: Partial<PivotConfig>): PivotConfig;

    /**
     * Creates a new instance of ResultSet based on [LoadResponse](#load-response) data.
     *
     * ```js
     * import cubejs, { ResultSet } from '@cubejs-client/core';
     *
     * const cubejsApi = cubejs('CUBEJS_TOKEN');
     *
     * const resultSet = await cubejsApi.load({
     *  measures: ['Stories.count'],
     *  timeDimensions: [{
     *    dimension: 'Stories.time',
     *    dateRange: ['2015-01-01', '2015-12-31'],
     *    granularity: 'month'
     *   }]
     * });
     *
     * const copy = new ResultSet(resultSet.loadResponse);
     * ```
     */
    constructor(loadResponse: LoadResponse<T>, options?: Object);

    /**
     * @hidden
     */
    normalizePivotConfig(pivotConfig?: PivotConfig): PivotConfig;

    /**
     * Returns a measure drill down query.
     *
     * Provided you have a measure with the defined `drillMemebers` on the `Orders` cube
     * ```js
     * measures: {
     *   count: {
     *     type: `count`,
     *     drillMembers: [Orders.status, Users.city, count],
     *   },
     *   // ...
     * }
     * ```
     *
     * Then you can use the `drillDown` method to see the rows that contribute to that metric
     * ```js
     * resultSet.drillDown(
     *   {
     *     xValues,
     *     yValues,
     *   },
     *   // you should pass the `pivotConfig` if you have used it for axes manipulation
     *   pivotConfig
     * )
     * ```
     *
     * the result will be a query with the required filters applied and the dimensions/measures filled out
     * ```js
     * {
     *   measures: ['Orders.count'],
     *   dimensions: ['Orders.status', 'Users.city'],
     *   filters: [
     *     // dimension and measure filters
     *   ],
     *   timeDimensions: [
     *     //...
     *   ]
     * }
     * ```
     * @returns Drill down query
     */
    drillDown(drillDownLocator: DrillDownLocator, pivotConfig?: PivotConfig): Query | null;

    /**
     * Returns an array of series with key, title and series data.
     * ```js
     * // For the query
     * {
     *   measures: ['Stories.count'],
     *   timeDimensions: [{
     *     dimension: 'Stories.time',
     *     dateRange: ['2015-01-01', '2015-12-31'],
     *     granularity: 'month'
     *   }]
     * }
     *
     * // ResultSet.series() will return
     * [
     *   {
     *     key: 'Stories.count',
     *     title: 'Stories Count',
     *     series: [
     *       { x: '2015-01-01T00:00:00', value: 27120 },
     *       { x: '2015-02-01T00:00:00', value: 25861 },
     *       { x: '2015-03-01T00:00:00', value: 29661 },
     *       //...
     *     ],
     *   },
     * ]
     * ```
     */
    series<SeriesItem = any>(pivotConfig?: PivotConfig): Series<SeriesItem>[];

    /**
     * Returns an array of series objects, containing `key` and `title` parameters.
     * ```js
     * // For query
     * {
     *   measures: ['Stories.count'],
     *   timeDimensions: [{
     *     dimension: 'Stories.time',
     *     dateRange: ['2015-01-01', '2015-12-31'],
     *     granularity: 'month'
     *   }]
     * }
     *
     * // ResultSet.seriesNames() will return
     * [
     *   {
     *     key: 'Stories.count',
     *     title: 'Stories Count',
     *     yValues: ['Stories.count'],
     *   },
     * ]
     * ```
     * @returns An array of series names
     */
    seriesNames(pivotConfig?: PivotConfig): SeriesNamesColumn[];

    /**
     * Base method for pivoting [ResultSet](#result-set) data.
     * Most of the times shouldn't be used directly and [chartPivot](#result-set-chart-pivot)
     * or (tablePivot)[#table-pivot] should be used instead.
     *
     * You can find the examples of using the `pivotConfig` [here](#pivot-config)
     * ```js
     * // For query
     * {
     *   measures: ['Stories.count'],
     *   timeDimensions: [{
     *     dimension: 'Stories.time',
     *     dateRange: ['2015-01-01', '2015-03-31'],
     *     granularity: 'month'
     *   }]
     * }
     *
     * // ResultSet.pivot({ x: ['Stories.time'], y: ['measures'] }) will return
     * [
     *   {
     *     xValues: ["2015-01-01T00:00:00"],
     *     yValuesArray: [
     *       [['Stories.count'], 27120]
     *     ]
     *   },
     *   {
     *     xValues: ["2015-02-01T00:00:00"],
     *     yValuesArray: [
     *       [['Stories.count'], 25861]
     *     ]
     *   },
     *   {
     *     xValues: ["2015-03-01T00:00:00"],
     *     yValuesArray: [
     *       [['Stories.count'], 29661]
     *     ]
     *   }
     * ]
     * ```
     * @returns An array of pivoted rows.
     */
    pivot(pivotConfig?: PivotConfig): PivotRow[];

    /**
     * Returns normalized query result data in the following format.
     *
     * You can find the examples of using the `pivotConfig` [here](#pivot-config)
     * ```js
     * // For the query
     * {
     *   measures: ['Stories.count'],
     *   timeDimensions: [{
     *     dimension: 'Stories.time',
     *     dateRange: ['2015-01-01', '2015-12-31'],
     *     granularity: 'month'
     *   }]
     * }
     *
     * // ResultSet.chartPivot() will return
     * [
     *   { "x":"2015-01-01T00:00:00", "Stories.count": 27120, "xValues": ["2015-01-01T00:00:00"] },
     *   { "x":"2015-02-01T00:00:00", "Stories.count": 25861, "xValues": ["2015-02-01T00:00:00"]  },
     *   { "x":"2015-03-01T00:00:00", "Stories.count": 29661, "xValues": ["2015-03-01T00:00:00"]  },
     *   //...
     * ]
     * ```
     */
    chartPivot(pivotConfig?: PivotConfig): ChartPivotRow[];

    /**
     * Returns normalized query result data prepared for visualization in the table format.
     *
     * You can find the examples of using the `pivotConfig` [here](#pivot-config)
     *
     * For example:
     * ```js
     * // For the query
     * {
     *   measures: ['Stories.count'],
     *   timeDimensions: [{
     *     dimension: 'Stories.time',
     *     dateRange: ['2015-01-01', '2015-12-31'],
     *     granularity: 'month'
     *   }]
     * }
     *
     * // ResultSet.tablePivot() will return
     * [
     *   { "Stories.time": "2015-01-01T00:00:00", "Stories.count": 27120 },
     *   { "Stories.time": "2015-02-01T00:00:00", "Stories.count": 25861 },
     *   { "Stories.time": "2015-03-01T00:00:00", "Stories.count": 29661 },
     *   //...
     * ]
     * ```
     * @returns An array of pivoted rows
     */
    tablePivot(pivotConfig?: PivotConfig): Array<{ [key: string]: string | number | boolean }>;

    /**
     * Returns an array of column definitions for `tablePivot`.
     *
     * For example:
     * ```js
     * // For the query
     * {
     *   measures: ['Stories.count'],
     *   timeDimensions: [{
     *     dimension: 'Stories.time',
     *     dateRange: ['2015-01-01', '2015-12-31'],
     *     granularity: 'month'
     *   }]
     * }
     *
     * // ResultSet.tableColumns() will return
     * [
     *   {
     *     key: 'Stories.time',
     *     dataIndex: 'Stories.time',
     *     title: 'Stories Time',
     *     shortTitle: 'Time',
     *     type: 'time',
     *     format: undefined,
     *   },
     *   {
     *     key: 'Stories.count',
     *     dataIndex: 'Stories.count',
     *     title: 'Stories Count',
     *     shortTitle: 'Count',
     *     type: 'count',
     *     format: undefined,
     *   },
     *   //...
     * ]
     * ```
     *
     * In case we want to pivot the table axes
     * ```js
     * // Let's take this query as an example
     * {
     *   measures: ['Orders.count'],
     *   dimensions: ['Users.country', 'Users.gender']
     * }
     *
     * // and put the dimensions on `y` axis
     * resultSet.tableColumns({
     *   x: [],
     *   y: ['Users.country', 'Users.gender', 'measures']
     * })
     * ```
     *
     * then `tableColumns` will group the table head and return
     * ```js
     * {
     *   key: 'Germany',
     *   type: 'string',
     *   title: 'Users Country Germany',
     *   shortTitle: 'Germany',
     *   meta: undefined,
     *   format: undefined,
     *   children: [
     *     {
     *       key: 'male',
     *       type: 'string',
     *       title: 'Users Gender male',
     *       shortTitle: 'male',
     *       meta: undefined,
     *       format: undefined,
     *       children: [
     *         {
     *           // ...
     *           dataIndex: 'Germany.male.Orders.count',
     *           shortTitle: 'Count',
     *         },
     *       ],
     *     },
     *     {
     *       // ...
     *       shortTitle: 'female',
     *       children: [
     *         {
     *           // ...
     *           dataIndex: 'Germany.female.Orders.count',
     *           shortTitle: 'Count',
     *         },
     *       ],
     *     },
     *   ],
     * },
     * // ...
     * ```
     * @returns An array of columns
     */
    tableColumns(pivotConfig?: PivotConfig): TableColumn[];

    query(): Query;
    rawData(): T[];
  }

  export type Filter = {
    dimension?: string;
    member?: string;
    operator: string;
    values?: string[];
  };

  export enum TimeDimensionGranularities {
    HOUR = 'hour',
    DAY = 'day',
    WEEK = 'week',
    MONTH = 'month',
    YEAR = 'year',
  }

  export type TimeDimension = {
    dimension: string;
    dateRange?: string | string[];
    granularity?: TimeDimensionGranularities;
  };

  export type Query = {
    measures?: string[];
    dimensions?: string[];
    filters?: Filter[];
    timeDimensions?: TimeDimension[];
    segments?: string[];
    limit?: number;
    offset?: number;
    order?: {
      [key: string]: QueryOrder;
    };
    timezone?: string;
    renewQuery?: boolean;
    ungrouped?: boolean;
  };

  export type ProgressResponse = {
    stage: string;
    timeElapsed: number;
  };

  export class ProgressResult {
    constructor(progressResponse: ProgressResponse);

    stage(): string;
    timeElapsed(): string;
  }

  export type SqlQueryTuple = [string, boolean | string | number];

  export type SqlData = {
    aliasNameToMember: Record<string, string>;
    cacheKeyQueries: {
      queries: SqlQueryTuple[];
    };
    dataSource: boolean;
    external: boolean;
    sql: SqlQueryTuple;
  };

  export type SqlApiResponse = {
    sql: SqlData;
  };

  export class SqlQuery {
    constructor(sqlQuery: SqlApiResponse);

    rawQuery(): SqlData;
    sql(): string;
  }

  export type MemberType = 'measures' | 'dimensions' | 'segments';

  /**
   * Contains information about available cubes and it's members.
   * @order 4
   */
  export class Meta {
    constructor(metaResponse: Object);

    /**
     * Get all members of a specific type for a given query.
     * If empty query is provided no filtering is done based on query context and all available members are retrieved.
     * @param query - context query to provide filtering of members available to add to this query
     */
    membersForQuery(query: Query, memberType: MemberType);

    /**
     * Get meta information for member of a cube
     * Member meta information contains:
     * ```javascript
     * {
     *   name,
     *   title,
     *   shortTitle,
     *   type,
     *   description,
     *   format
     * }
     * ```
     * @param memberName - Fully qualified member name in a form `Cube.memberName`
     * @return An object containing meta information about member
     */
    resolveMember(memberName: string, memberType: MemberType): Object;
    defaultTimeDimensionNameFor(memberName: string): string;
    filterOperatorsForMember(memberName: string, memberType: MemberType): any;
  }

  /**
   * Main class for accessing Cube.js API
   * 
   * @order 2
   */
  export class CubejsApi {
    constructor(apiToken: string, options: CubeJSApiOptions);

    /**
     * Base method for performing all API calls. Shouldn't be used directly.
     *
     * @param request - function that is invoked to perform the actual request using `transport.request()` method.
     * @param toResult - function that maps results of invocation to method return result
     * @param options - options object
     */
    loadMethod<TResult>(request: () => any, toResult: (body: JSON) => TResult, options?: LoadMethodOptions): Promise<TResult>;
    loadMethod<TResult>(
      request: () => any,
      toResult: (body: JSON) => TResult,
      options: LoadMethodOptions,
      callback: LoadMethodCallback<ResultSet>
    ): Promise<{ unsubscribe: () => any }>;

    /**
     * Fetch data for the passed `query`.
     *
     * ```js
     * import cubejs from '@cubejs-client/core';
     * import Chart from 'chart.js';
     * import chartjsConfig from './toChartjsData';
     *
     * const cubejsApi = cubejs('CUBEJS_TOKEN');
     *
     * const resultSet = await cubejsApi.load({
     *  measures: ['Stories.count'],
     *  timeDimensions: [{
     *    dimension: 'Stories.time',
     *    dateRange: ['2015-01-01', '2015-12-31'],
     *    granularity: 'month'
     *   }]
     * });
     *
     * const context = document.getElementById('myChart');
     * new Chart(context, chartjsConfig(resultSet));
     * ```
     * @param query - [Query object](query-format)
     */
    load(query: Query, options?: LoadMethodOptions): Promise<ResultSet>;
    load(query: Query, options?: LoadMethodOptions, callback?: LoadMethodCallback<ResultSet>): void;

    /**
     * Get generated SQL string for the given `query`.
     * @param query - [Query object](query-format)
     */
    sql(query: Query, options?: LoadMethodOptions): Promise<SqlQuery>;
    sql(query: Query, options?: LoadMethodOptions, callback?: LoadMethodCallback<SqlQuery>): void;

    /**
     * Get meta description of cubes available for querying.
     */
    meta(options?: LoadMethodOptions): Promise<Meta>;
    meta(options?: LoadMethodOptions, callback?: LoadMethodCallback<Meta>): void;
  }

  /**
   * Creates an instance of the `CubejsApi`. The API entry point.
   *
   * ```js
   * import cubejs from '@cubejs-client/core';
   * const cubejsApi = cubejs(
   *   'CUBEJS-API-TOKEN',
   *   { apiUrl: 'http://localhost:4000/cubejs-api/v1' }
   * );
   * ```
   * @param apiToken - [API token](security) is used to authorize requests and determine SQL database you're accessing. In the development mode, Cube.js Backend will print the API token to the console on on startup. Can be an async function without arguments that returns the API token.
   * @order 1
   */
  export default function cubejs(apiToken: string, options: CubeJSApiOptions): CubejsApi;
}

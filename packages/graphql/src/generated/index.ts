import { useQuery, useInfiniteQuery, UseQueryOptions, UseInfiniteQueryOptions, InfiniteData } from '@tanstack/react-query';
import { fetcher } from '../client';
import { DocumentNode } from 'graphql';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  _text: { input: any; output: any; }
  account_type: { input: any; output: any; }
  atom_resolving_status: { input: any; output: any; }
  atom_type: { input: any; output: any; }
  bigint: { input: any; output: any; }
  bytea: { input: any; output: any; }
  event_type: { input: any; output: any; }
  float8: { input: any; output: any; }
  jsonb: { input: any; output: any; }
  numeric: { input: any; output: any; }
  term_type: { input: any; output: any; }
  timestamptz: { input: any; output: any; }
  vault_type: { input: any; output: any; }
};

export type AccountPnlChartOutput = {
  __typename?: 'AccountPnlChartOutput';
  account_id: Scalars['String']['output'];
  count: Scalars['Int']['output'];
  data: Array<AccountPnlChartPoint>;
  interval: Scalars['String']['output'];
};

export type AccountPnlChartPoint = {
  __typename?: 'AccountPnlChartPoint';
  equity_value: Scalars['String']['output'];
  net_invested: Scalars['String']['output'];
  pnl_pct: Scalars['String']['output'];
  timestamp: Scalars['String']['output'];
  total_assets_in: Scalars['String']['output'];
  total_assets_out: Scalars['String']['output'];
  total_pnl: Scalars['String']['output'];
  unrealized_pnl: Scalars['String']['output'];
};

export type AccountPnlRealizedEntry = {
  __typename?: 'AccountPnlRealizedEntry';
  assets_out: Scalars['String']['output'];
  cost_basis: Scalars['String']['output'];
  curve_id: Scalars['String']['output'];
  realized_pnl: Scalars['String']['output'];
  realized_pnl_pct: Scalars['String']['output'];
  shares_redeemed: Scalars['String']['output'];
  term_id: Scalars['String']['output'];
  timestamp: Scalars['String']['output'];
};

export type AccountPnlRealizedOutput = {
  __typename?: 'AccountPnlRealizedOutput';
  account_id: Scalars['String']['output'];
  count: Scalars['Int']['output'];
  data: Array<AccountPnlRealizedEntry>;
};

export type AccountPnlSnapshotOutput = {
  __typename?: 'AccountPnlSnapshotOutput';
  account_id: Scalars['String']['output'];
  equity_value: Scalars['String']['output'];
  net_invested: Scalars['String']['output'];
  pnl_pct: Scalars['String']['output'];
  timestamp: Scalars['String']['output'];
  total_assets_in: Scalars['String']['output'];
  total_assets_out: Scalars['String']['output'];
  total_pnl: Scalars['String']['output'];
  unrealized_pnl: Scalars['String']['output'];
};

/** Boolean expression to compare columns of type "Boolean". All fields are combined with logical 'AND'. */
export type Boolean_Comparison_Exp = {
  _eq?: InputMaybe<Scalars['Boolean']['input']>;
  _gt?: InputMaybe<Scalars['Boolean']['input']>;
  _gte?: InputMaybe<Scalars['Boolean']['input']>;
  _in?: InputMaybe<Array<Scalars['Boolean']['input']>>;
  _is_null?: InputMaybe<Scalars['Boolean']['input']>;
  _lt?: InputMaybe<Scalars['Boolean']['input']>;
  _lte?: InputMaybe<Scalars['Boolean']['input']>;
  _neq?: InputMaybe<Scalars['Boolean']['input']>;
  _nin?: InputMaybe<Array<Scalars['Boolean']['input']>>;
};

export type CachedImage = {
  __typename?: 'CachedImage';
  created_at: Scalars['timestamptz']['output'];
  model?: Maybe<Scalars['String']['output']>;
  original_url: Scalars['String']['output'];
  safe: Scalars['Boolean']['output'];
  score?: Maybe<Scalars['jsonb']['output']>;
  url: Scalars['String']['output'];
};

export type ChartDataOutput = {
  __typename?: 'ChartDataOutput';
  count: Scalars['Int']['output'];
  curve_id?: Maybe<Scalars['String']['output']>;
  data: Array<ChartDataPoint>;
  graph_type: Scalars['String']['output'];
  interval: Scalars['String']['output'];
  term_id: Scalars['String']['output'];
};

export type ChartDataPoint = {
  __typename?: 'ChartDataPoint';
  timestamp: Scalars['String']['output'];
  value: Scalars['String']['output'];
};

export type ChartSvgOutput = {
  __typename?: 'ChartSvgOutput';
  svg: Scalars['String']['output'];
};

export type GetAccountPnlChartInput = {
  account_id: Scalars['String']['input'];
  end_time: Scalars['String']['input'];
  interval: Scalars['String']['input'];
  start_time: Scalars['String']['input'];
};

export type GetAccountPnlCurrentInput = {
  account_id: Scalars['String']['input'];
};

export type GetAccountPnlRealizedInput = {
  account_id: Scalars['String']['input'];
  end_time: Scalars['String']['input'];
  start_time: Scalars['String']['input'];
};

export type GetChartJsonInput = {
  curve_id: Scalars['String']['input'];
  end_time: Scalars['String']['input'];
  graph_type?: InputMaybe<Scalars['String']['input']>;
  interval: Scalars['String']['input'];
  start_time: Scalars['String']['input'];
  term_id: Scalars['String']['input'];
};

export type GetChartSvgInput = {
  background_color?: InputMaybe<Scalars['String']['input']>;
  curve_id: Scalars['String']['input'];
  end_time: Scalars['String']['input'];
  graph_type?: InputMaybe<Scalars['String']['input']>;
  height?: InputMaybe<Scalars['Int']['input']>;
  interval: Scalars['String']['input'];
  line_color?: InputMaybe<Scalars['String']['input']>;
  start_time: Scalars['String']['input'];
  term_id: Scalars['String']['input'];
  width?: InputMaybe<Scalars['Int']['input']>;
};

export type GetPositionPnlChartInput = {
  account_id: Scalars['String']['input'];
  curve_id: Scalars['String']['input'];
  end_time: Scalars['String']['input'];
  interval: Scalars['String']['input'];
  start_time: Scalars['String']['input'];
  term_id: Scalars['String']['input'];
};

/** Boolean expression to compare columns of type "Int". All fields are combined with logical 'AND'. */
export type Int_Comparison_Exp = {
  _eq?: InputMaybe<Scalars['Int']['input']>;
  _gt?: InputMaybe<Scalars['Int']['input']>;
  _gte?: InputMaybe<Scalars['Int']['input']>;
  _in?: InputMaybe<Array<Scalars['Int']['input']>>;
  _is_null?: InputMaybe<Scalars['Boolean']['input']>;
  _lt?: InputMaybe<Scalars['Int']['input']>;
  _lte?: InputMaybe<Scalars['Int']['input']>;
  _neq?: InputMaybe<Scalars['Int']['input']>;
  _nin?: InputMaybe<Array<Scalars['Int']['input']>>;
};

export type PinOrganizationInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  image?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  url?: InputMaybe<Scalars['String']['input']>;
};

export type PinOutput = {
  __typename?: 'PinOutput';
  uri?: Maybe<Scalars['String']['output']>;
};

export type PinPersonInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  identifier?: InputMaybe<Scalars['String']['input']>;
  image?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  url?: InputMaybe<Scalars['String']['input']>;
};

export type PinThingInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  image?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  url?: InputMaybe<Scalars['String']['input']>;
};

export type PnlLeaderboardEntryOutput = {
  __typename?: 'PnlLeaderboardEntryOutput';
  account_id: Scalars['String']['output'];
  account_image?: Maybe<Scalars['String']['output']>;
  account_label?: Maybe<Scalars['String']['output']>;
  active_position_count: Scalars['Int']['output'];
  best_trade_pnl_formatted?: Maybe<Scalars['String']['output']>;
  best_trade_pnl_raw?: Maybe<Scalars['String']['output']>;
  current_equity_value_formatted: Scalars['String']['output'];
  current_equity_value_raw: Scalars['String']['output'];
  first_position_at?: Maybe<Scalars['String']['output']>;
  last_activity_at?: Maybe<Scalars['String']['output']>;
  losing_positions: Scalars['Int']['output'];
  pnl_change_formatted: Scalars['String']['output'];
  pnl_change_raw: Scalars['String']['output'];
  pnl_pct: Scalars['String']['output'];
  rank: Scalars['String']['output'];
  realized_pnl_formatted: Scalars['String']['output'];
  realized_pnl_pct: Scalars['String']['output'];
  realized_pnl_raw: Scalars['String']['output'];
  redeemable_assets_formatted?: Maybe<Scalars['String']['output']>;
  redeemable_assets_raw?: Maybe<Scalars['String']['output']>;
  total_deposits_formatted: Scalars['String']['output'];
  total_deposits_raw: Scalars['String']['output'];
  total_pnl_formatted: Scalars['String']['output'];
  total_pnl_raw: Scalars['String']['output'];
  total_position_count: Scalars['Int']['output'];
  total_redemptions_formatted: Scalars['String']['output'];
  total_redemptions_raw: Scalars['String']['output'];
  total_volume_formatted: Scalars['String']['output'];
  total_volume_raw: Scalars['String']['output'];
  unrealized_pnl_formatted: Scalars['String']['output'];
  unrealized_pnl_pct: Scalars['String']['output'];
  unrealized_pnl_raw: Scalars['String']['output'];
  win_rate: Scalars['String']['output'];
  winning_positions: Scalars['Int']['output'];
  worst_trade_pnl_formatted?: Maybe<Scalars['String']['output']>;
  worst_trade_pnl_raw?: Maybe<Scalars['String']['output']>;
};

export type PositionPnlChartOutput = {
  __typename?: 'PositionPnlChartOutput';
  account_id: Scalars['String']['output'];
  count: Scalars['Int']['output'];
  curve_id: Scalars['String']['output'];
  data: Array<PositionPnlChartPoint>;
  interval: Scalars['String']['output'];
  term_id: Scalars['String']['output'];
};

export type PositionPnlChartPoint = {
  __typename?: 'PositionPnlChartPoint';
  equity_value: Scalars['String']['output'];
  net_invested: Scalars['String']['output'];
  pnl_pct: Scalars['String']['output'];
  share_price: Scalars['String']['output'];
  shares_total: Scalars['String']['output'];
  timestamp: Scalars['String']['output'];
  total_assets_in: Scalars['String']['output'];
  total_assets_out: Scalars['String']['output'];
  total_pnl: Scalars['String']['output'];
  unrealized_pnl: Scalars['String']['output'];
};

/** Boolean expression to compare columns of type "String". All fields are combined with logical 'AND'. */
export type String_Comparison_Exp = {
  _eq?: InputMaybe<Scalars['String']['input']>;
  _gt?: InputMaybe<Scalars['String']['input']>;
  _gte?: InputMaybe<Scalars['String']['input']>;
  /** does the column match the given case-insensitive pattern */
  _ilike?: InputMaybe<Scalars['String']['input']>;
  _in?: InputMaybe<Array<Scalars['String']['input']>>;
  /** does the column match the given POSIX regular expression, case insensitive */
  _iregex?: InputMaybe<Scalars['String']['input']>;
  _is_null?: InputMaybe<Scalars['Boolean']['input']>;
  /** does the column match the given pattern */
  _like?: InputMaybe<Scalars['String']['input']>;
  _lt?: InputMaybe<Scalars['String']['input']>;
  _lte?: InputMaybe<Scalars['String']['input']>;
  _neq?: InputMaybe<Scalars['String']['input']>;
  /** does the column NOT match the given case-insensitive pattern */
  _nilike?: InputMaybe<Scalars['String']['input']>;
  _nin?: InputMaybe<Array<Scalars['String']['input']>>;
  /** does the column NOT match the given POSIX regular expression, case insensitive */
  _niregex?: InputMaybe<Scalars['String']['input']>;
  /** does the column NOT match the given pattern */
  _nlike?: InputMaybe<Scalars['String']['input']>;
  /** does the column NOT match the given POSIX regular expression, case sensitive */
  _nregex?: InputMaybe<Scalars['String']['input']>;
  /** does the column NOT match the given SQL regular expression */
  _nsimilar?: InputMaybe<Scalars['String']['input']>;
  /** does the column match the given POSIX regular expression, case sensitive */
  _regex?: InputMaybe<Scalars['String']['input']>;
  /** does the column match the given SQL regular expression */
  _similar?: InputMaybe<Scalars['String']['input']>;
};

export type UploadImageFromUrlInput = {
  url: Scalars['String']['input'];
};

export type UploadImageFromUrlOutput = {
  __typename?: 'UploadImageFromUrlOutput';
  images: Array<CachedImage>;
};

export type UploadImageInput = {
  contentType: Scalars['String']['input'];
  data: Scalars['String']['input'];
  filename: Scalars['String']['input'];
};

export type UploadJsonToIpfsOutput = {
  __typename?: 'UploadJsonToIpfsOutput';
  hash: Scalars['String']['output'];
  name: Scalars['String']['output'];
  size: Scalars['String']['output'];
};

/** columns and relationships of "account_pnl_rank" */
export type Account_Pnl_Rank = {
  __typename?: 'account_pnl_rank';
  account_id?: Maybe<Scalars['String']['output']>;
  account_image?: Maybe<Scalars['String']['output']>;
  account_label?: Maybe<Scalars['String']['output']>;
  percentile?: Maybe<Scalars['numeric']['output']>;
  pnl_pct?: Maybe<Scalars['numeric']['output']>;
  rank?: Maybe<Scalars['bigint']['output']>;
  total_accounts?: Maybe<Scalars['bigint']['output']>;
  total_pnl_formatted?: Maybe<Scalars['numeric']['output']>;
  total_pnl_raw?: Maybe<Scalars['numeric']['output']>;
  total_position_count?: Maybe<Scalars['bigint']['output']>;
  total_volume_formatted?: Maybe<Scalars['numeric']['output']>;
  total_volume_raw?: Maybe<Scalars['numeric']['output']>;
  win_rate?: Maybe<Scalars['numeric']['output']>;
};

/** aggregated selection of "account_pnl_rank" */
export type Account_Pnl_Rank_Aggregate = {
  __typename?: 'account_pnl_rank_aggregate';
  aggregate?: Maybe<Account_Pnl_Rank_Aggregate_Fields>;
  nodes: Array<Account_Pnl_Rank>;
};

/** aggregate fields of "account_pnl_rank" */
export type Account_Pnl_Rank_Aggregate_Fields = {
  __typename?: 'account_pnl_rank_aggregate_fields';
  avg?: Maybe<Account_Pnl_Rank_Avg_Fields>;
  count: Scalars['Int']['output'];
  max?: Maybe<Account_Pnl_Rank_Max_Fields>;
  min?: Maybe<Account_Pnl_Rank_Min_Fields>;
  stddev?: Maybe<Account_Pnl_Rank_Stddev_Fields>;
  stddev_pop?: Maybe<Account_Pnl_Rank_Stddev_Pop_Fields>;
  stddev_samp?: Maybe<Account_Pnl_Rank_Stddev_Samp_Fields>;
  sum?: Maybe<Account_Pnl_Rank_Sum_Fields>;
  var_pop?: Maybe<Account_Pnl_Rank_Var_Pop_Fields>;
  var_samp?: Maybe<Account_Pnl_Rank_Var_Samp_Fields>;
  variance?: Maybe<Account_Pnl_Rank_Variance_Fields>;
};


/** aggregate fields of "account_pnl_rank" */
export type Account_Pnl_Rank_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Account_Pnl_Rank_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
};

/** aggregate avg on columns */
export type Account_Pnl_Rank_Avg_Fields = {
  __typename?: 'account_pnl_rank_avg_fields';
  percentile?: Maybe<Scalars['Float']['output']>;
  pnl_pct?: Maybe<Scalars['Float']['output']>;
  rank?: Maybe<Scalars['Float']['output']>;
  total_accounts?: Maybe<Scalars['Float']['output']>;
  total_pnl_formatted?: Maybe<Scalars['Float']['output']>;
  total_pnl_raw?: Maybe<Scalars['Float']['output']>;
  total_position_count?: Maybe<Scalars['Float']['output']>;
  total_volume_formatted?: Maybe<Scalars['Float']['output']>;
  total_volume_raw?: Maybe<Scalars['Float']['output']>;
  win_rate?: Maybe<Scalars['Float']['output']>;
};

/** Boolean expression to filter rows from the table "account_pnl_rank". All fields are combined with a logical 'AND'. */
export type Account_Pnl_Rank_Bool_Exp = {
  _and?: InputMaybe<Array<Account_Pnl_Rank_Bool_Exp>>;
  _not?: InputMaybe<Account_Pnl_Rank_Bool_Exp>;
  _or?: InputMaybe<Array<Account_Pnl_Rank_Bool_Exp>>;
  account_id?: InputMaybe<String_Comparison_Exp>;
  account_image?: InputMaybe<String_Comparison_Exp>;
  account_label?: InputMaybe<String_Comparison_Exp>;
  percentile?: InputMaybe<Numeric_Comparison_Exp>;
  pnl_pct?: InputMaybe<Numeric_Comparison_Exp>;
  rank?: InputMaybe<Bigint_Comparison_Exp>;
  total_accounts?: InputMaybe<Bigint_Comparison_Exp>;
  total_pnl_formatted?: InputMaybe<Numeric_Comparison_Exp>;
  total_pnl_raw?: InputMaybe<Numeric_Comparison_Exp>;
  total_position_count?: InputMaybe<Bigint_Comparison_Exp>;
  total_volume_formatted?: InputMaybe<Numeric_Comparison_Exp>;
  total_volume_raw?: InputMaybe<Numeric_Comparison_Exp>;
  win_rate?: InputMaybe<Numeric_Comparison_Exp>;
};

/** aggregate max on columns */
export type Account_Pnl_Rank_Max_Fields = {
  __typename?: 'account_pnl_rank_max_fields';
  account_id?: Maybe<Scalars['String']['output']>;
  account_image?: Maybe<Scalars['String']['output']>;
  account_label?: Maybe<Scalars['String']['output']>;
  percentile?: Maybe<Scalars['numeric']['output']>;
  pnl_pct?: Maybe<Scalars['numeric']['output']>;
  rank?: Maybe<Scalars['bigint']['output']>;
  total_accounts?: Maybe<Scalars['bigint']['output']>;
  total_pnl_formatted?: Maybe<Scalars['numeric']['output']>;
  total_pnl_raw?: Maybe<Scalars['numeric']['output']>;
  total_position_count?: Maybe<Scalars['bigint']['output']>;
  total_volume_formatted?: Maybe<Scalars['numeric']['output']>;
  total_volume_raw?: Maybe<Scalars['numeric']['output']>;
  win_rate?: Maybe<Scalars['numeric']['output']>;
};

/** aggregate min on columns */
export type Account_Pnl_Rank_Min_Fields = {
  __typename?: 'account_pnl_rank_min_fields';
  account_id?: Maybe<Scalars['String']['output']>;
  account_image?: Maybe<Scalars['String']['output']>;
  account_label?: Maybe<Scalars['String']['output']>;
  percentile?: Maybe<Scalars['numeric']['output']>;
  pnl_pct?: Maybe<Scalars['numeric']['output']>;
  rank?: Maybe<Scalars['bigint']['output']>;
  total_accounts?: Maybe<Scalars['bigint']['output']>;
  total_pnl_formatted?: Maybe<Scalars['numeric']['output']>;
  total_pnl_raw?: Maybe<Scalars['numeric']['output']>;
  total_position_count?: Maybe<Scalars['bigint']['output']>;
  total_volume_formatted?: Maybe<Scalars['numeric']['output']>;
  total_volume_raw?: Maybe<Scalars['numeric']['output']>;
  win_rate?: Maybe<Scalars['numeric']['output']>;
};

/** Ordering options when selecting data from "account_pnl_rank". */
export type Account_Pnl_Rank_Order_By = {
  account_id?: InputMaybe<Order_By>;
  account_image?: InputMaybe<Order_By>;
  account_label?: InputMaybe<Order_By>;
  percentile?: InputMaybe<Order_By>;
  pnl_pct?: InputMaybe<Order_By>;
  rank?: InputMaybe<Order_By>;
  total_accounts?: InputMaybe<Order_By>;
  total_pnl_formatted?: InputMaybe<Order_By>;
  total_pnl_raw?: InputMaybe<Order_By>;
  total_position_count?: InputMaybe<Order_By>;
  total_volume_formatted?: InputMaybe<Order_By>;
  total_volume_raw?: InputMaybe<Order_By>;
  win_rate?: InputMaybe<Order_By>;
};

/** select columns of table "account_pnl_rank" */
export type Account_Pnl_Rank_Select_Column =
  /** column name */
  | 'account_id'
  /** column name */
  | 'account_image'
  /** column name */
  | 'account_label'
  /** column name */
  | 'percentile'
  /** column name */
  | 'pnl_pct'
  /** column name */
  | 'rank'
  /** column name */
  | 'total_accounts'
  /** column name */
  | 'total_pnl_formatted'
  /** column name */
  | 'total_pnl_raw'
  /** column name */
  | 'total_position_count'
  /** column name */
  | 'total_volume_formatted'
  /** column name */
  | 'total_volume_raw'
  /** column name */
  | 'win_rate';

/** aggregate stddev on columns */
export type Account_Pnl_Rank_Stddev_Fields = {
  __typename?: 'account_pnl_rank_stddev_fields';
  percentile?: Maybe<Scalars['Float']['output']>;
  pnl_pct?: Maybe<Scalars['Float']['output']>;
  rank?: Maybe<Scalars['Float']['output']>;
  total_accounts?: Maybe<Scalars['Float']['output']>;
  total_pnl_formatted?: Maybe<Scalars['Float']['output']>;
  total_pnl_raw?: Maybe<Scalars['Float']['output']>;
  total_position_count?: Maybe<Scalars['Float']['output']>;
  total_volume_formatted?: Maybe<Scalars['Float']['output']>;
  total_volume_raw?: Maybe<Scalars['Float']['output']>;
  win_rate?: Maybe<Scalars['Float']['output']>;
};

/** aggregate stddev_pop on columns */
export type Account_Pnl_Rank_Stddev_Pop_Fields = {
  __typename?: 'account_pnl_rank_stddev_pop_fields';
  percentile?: Maybe<Scalars['Float']['output']>;
  pnl_pct?: Maybe<Scalars['Float']['output']>;
  rank?: Maybe<Scalars['Float']['output']>;
  total_accounts?: Maybe<Scalars['Float']['output']>;
  total_pnl_formatted?: Maybe<Scalars['Float']['output']>;
  total_pnl_raw?: Maybe<Scalars['Float']['output']>;
  total_position_count?: Maybe<Scalars['Float']['output']>;
  total_volume_formatted?: Maybe<Scalars['Float']['output']>;
  total_volume_raw?: Maybe<Scalars['Float']['output']>;
  win_rate?: Maybe<Scalars['Float']['output']>;
};

/** aggregate stddev_samp on columns */
export type Account_Pnl_Rank_Stddev_Samp_Fields = {
  __typename?: 'account_pnl_rank_stddev_samp_fields';
  percentile?: Maybe<Scalars['Float']['output']>;
  pnl_pct?: Maybe<Scalars['Float']['output']>;
  rank?: Maybe<Scalars['Float']['output']>;
  total_accounts?: Maybe<Scalars['Float']['output']>;
  total_pnl_formatted?: Maybe<Scalars['Float']['output']>;
  total_pnl_raw?: Maybe<Scalars['Float']['output']>;
  total_position_count?: Maybe<Scalars['Float']['output']>;
  total_volume_formatted?: Maybe<Scalars['Float']['output']>;
  total_volume_raw?: Maybe<Scalars['Float']['output']>;
  win_rate?: Maybe<Scalars['Float']['output']>;
};

/** Streaming cursor of the table "account_pnl_rank" */
export type Account_Pnl_Rank_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Account_Pnl_Rank_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Account_Pnl_Rank_Stream_Cursor_Value_Input = {
  account_id?: InputMaybe<Scalars['String']['input']>;
  account_image?: InputMaybe<Scalars['String']['input']>;
  account_label?: InputMaybe<Scalars['String']['input']>;
  percentile?: InputMaybe<Scalars['numeric']['input']>;
  pnl_pct?: InputMaybe<Scalars['numeric']['input']>;
  rank?: InputMaybe<Scalars['bigint']['input']>;
  total_accounts?: InputMaybe<Scalars['bigint']['input']>;
  total_pnl_formatted?: InputMaybe<Scalars['numeric']['input']>;
  total_pnl_raw?: InputMaybe<Scalars['numeric']['input']>;
  total_position_count?: InputMaybe<Scalars['bigint']['input']>;
  total_volume_formatted?: InputMaybe<Scalars['numeric']['input']>;
  total_volume_raw?: InputMaybe<Scalars['numeric']['input']>;
  win_rate?: InputMaybe<Scalars['numeric']['input']>;
};

/** aggregate sum on columns */
export type Account_Pnl_Rank_Sum_Fields = {
  __typename?: 'account_pnl_rank_sum_fields';
  percentile?: Maybe<Scalars['numeric']['output']>;
  pnl_pct?: Maybe<Scalars['numeric']['output']>;
  rank?: Maybe<Scalars['bigint']['output']>;
  total_accounts?: Maybe<Scalars['bigint']['output']>;
  total_pnl_formatted?: Maybe<Scalars['numeric']['output']>;
  total_pnl_raw?: Maybe<Scalars['numeric']['output']>;
  total_position_count?: Maybe<Scalars['bigint']['output']>;
  total_volume_formatted?: Maybe<Scalars['numeric']['output']>;
  total_volume_raw?: Maybe<Scalars['numeric']['output']>;
  win_rate?: Maybe<Scalars['numeric']['output']>;
};

/** aggregate var_pop on columns */
export type Account_Pnl_Rank_Var_Pop_Fields = {
  __typename?: 'account_pnl_rank_var_pop_fields';
  percentile?: Maybe<Scalars['Float']['output']>;
  pnl_pct?: Maybe<Scalars['Float']['output']>;
  rank?: Maybe<Scalars['Float']['output']>;
  total_accounts?: Maybe<Scalars['Float']['output']>;
  total_pnl_formatted?: Maybe<Scalars['Float']['output']>;
  total_pnl_raw?: Maybe<Scalars['Float']['output']>;
  total_position_count?: Maybe<Scalars['Float']['output']>;
  total_volume_formatted?: Maybe<Scalars['Float']['output']>;
  total_volume_raw?: Maybe<Scalars['Float']['output']>;
  win_rate?: Maybe<Scalars['Float']['output']>;
};

/** aggregate var_samp on columns */
export type Account_Pnl_Rank_Var_Samp_Fields = {
  __typename?: 'account_pnl_rank_var_samp_fields';
  percentile?: Maybe<Scalars['Float']['output']>;
  pnl_pct?: Maybe<Scalars['Float']['output']>;
  rank?: Maybe<Scalars['Float']['output']>;
  total_accounts?: Maybe<Scalars['Float']['output']>;
  total_pnl_formatted?: Maybe<Scalars['Float']['output']>;
  total_pnl_raw?: Maybe<Scalars['Float']['output']>;
  total_position_count?: Maybe<Scalars['Float']['output']>;
  total_volume_formatted?: Maybe<Scalars['Float']['output']>;
  total_volume_raw?: Maybe<Scalars['Float']['output']>;
  win_rate?: Maybe<Scalars['Float']['output']>;
};

/** aggregate variance on columns */
export type Account_Pnl_Rank_Variance_Fields = {
  __typename?: 'account_pnl_rank_variance_fields';
  percentile?: Maybe<Scalars['Float']['output']>;
  pnl_pct?: Maybe<Scalars['Float']['output']>;
  rank?: Maybe<Scalars['Float']['output']>;
  total_accounts?: Maybe<Scalars['Float']['output']>;
  total_pnl_formatted?: Maybe<Scalars['Float']['output']>;
  total_pnl_raw?: Maybe<Scalars['Float']['output']>;
  total_position_count?: Maybe<Scalars['Float']['output']>;
  total_volume_formatted?: Maybe<Scalars['Float']['output']>;
  total_volume_raw?: Maybe<Scalars['Float']['output']>;
  win_rate?: Maybe<Scalars['Float']['output']>;
};

/** Boolean expression to compare columns of type "account_type". All fields are combined with logical 'AND'. */
export type Account_Type_Comparison_Exp = {
  _eq?: InputMaybe<Scalars['account_type']['input']>;
  _gt?: InputMaybe<Scalars['account_type']['input']>;
  _gte?: InputMaybe<Scalars['account_type']['input']>;
  _in?: InputMaybe<Array<Scalars['account_type']['input']>>;
  _is_null?: InputMaybe<Scalars['Boolean']['input']>;
  _lt?: InputMaybe<Scalars['account_type']['input']>;
  _lte?: InputMaybe<Scalars['account_type']['input']>;
  _neq?: InputMaybe<Scalars['account_type']['input']>;
  _nin?: InputMaybe<Array<Scalars['account_type']['input']>>;
};

/** Blockchain accounts participating in the protocol, including users, atom wallets, and protocol vaults. */
export type Accounts = {
  __typename?: 'accounts';
  /** An object relationship */
  atom?: Maybe<Atoms>;
  /** Optional reference to atom if this account represents an atom wallet. */
  atom_id?: Maybe<Scalars['String']['output']>;
  /** An array relationship */
  atoms: Array<Atoms>;
  /** An aggregate relationship */
  atoms_aggregate: Atoms_Aggregate;
  cached_image?: Maybe<Cached_Images_Cached_Image>;
  /** An array relationship */
  deposits_received: Array<Deposits>;
  /** An aggregate relationship */
  deposits_received_aggregate: Deposits_Aggregate;
  /** An array relationship */
  deposits_sent: Array<Deposits>;
  /** An aggregate relationship */
  deposits_sent_aggregate: Deposits_Aggregate;
  /** An array relationship */
  fee_transfers: Array<Fee_Transfers>;
  /** An aggregate relationship */
  fee_transfers_aggregate: Fee_Transfers_Aggregate;
  /** Account address (Ethereum address or atom wallet address). */
  id: Scalars['String']['output'];
  /** Profile image URL for this account. */
  image?: Maybe<Scalars['String']['output']>;
  /** Human-readable label for this account (ENS name, atom label, or address). */
  label: Scalars['String']['output'];
  /** An array relationship */
  positions: Array<Positions>;
  /** An aggregate relationship */
  positions_aggregate: Positions_Aggregate;
  /** An array relationship */
  redemptions_received: Array<Redemptions>;
  /** An aggregate relationship */
  redemptions_received_aggregate: Redemptions_Aggregate;
  /** An array relationship */
  redemptions_sent: Array<Redemptions>;
  /** An aggregate relationship */
  redemptions_sent_aggregate: Redemptions_Aggregate;
  /** An array relationship */
  season2_iq_ledger_entries: Array<Season2_Iq_Ledger_Entries>;
  /** An aggregate relationship */
  season2_iq_ledger_entries_aggregate: Season2_Iq_Ledger_Entries_Aggregate;
  /** An array relationship */
  signals: Array<Signals>;
  /** An aggregate relationship */
  signals_aggregate: Signals_Aggregate;
  /** An array relationship */
  triples: Array<Triples>;
  /** An aggregate relationship */
  triples_aggregate: Triples_Aggregate;
  /** Classification of account type (Default, AtomWallet, ProtocolVault). */
  type: Scalars['account_type']['output'];
};


/** Blockchain accounts participating in the protocol, including users, atom wallets, and protocol vaults. */
export type AccountsAtomsArgs = {
  distinct_on?: InputMaybe<Array<Atoms_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Atoms_Order_By>>;
  where?: InputMaybe<Atoms_Bool_Exp>;
};


/** Blockchain accounts participating in the protocol, including users, atom wallets, and protocol vaults. */
export type AccountsAtoms_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Atoms_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Atoms_Order_By>>;
  where?: InputMaybe<Atoms_Bool_Exp>;
};


/** Blockchain accounts participating in the protocol, including users, atom wallets, and protocol vaults. */
export type AccountsDeposits_ReceivedArgs = {
  distinct_on?: InputMaybe<Array<Deposits_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Deposits_Order_By>>;
  where?: InputMaybe<Deposits_Bool_Exp>;
};


/** Blockchain accounts participating in the protocol, including users, atom wallets, and protocol vaults. */
export type AccountsDeposits_Received_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Deposits_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Deposits_Order_By>>;
  where?: InputMaybe<Deposits_Bool_Exp>;
};


/** Blockchain accounts participating in the protocol, including users, atom wallets, and protocol vaults. */
export type AccountsDeposits_SentArgs = {
  distinct_on?: InputMaybe<Array<Deposits_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Deposits_Order_By>>;
  where?: InputMaybe<Deposits_Bool_Exp>;
};


/** Blockchain accounts participating in the protocol, including users, atom wallets, and protocol vaults. */
export type AccountsDeposits_Sent_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Deposits_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Deposits_Order_By>>;
  where?: InputMaybe<Deposits_Bool_Exp>;
};


/** Blockchain accounts participating in the protocol, including users, atom wallets, and protocol vaults. */
export type AccountsFee_TransfersArgs = {
  distinct_on?: InputMaybe<Array<Fee_Transfers_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Fee_Transfers_Order_By>>;
  where?: InputMaybe<Fee_Transfers_Bool_Exp>;
};


/** Blockchain accounts participating in the protocol, including users, atom wallets, and protocol vaults. */
export type AccountsFee_Transfers_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Fee_Transfers_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Fee_Transfers_Order_By>>;
  where?: InputMaybe<Fee_Transfers_Bool_Exp>;
};


/** Blockchain accounts participating in the protocol, including users, atom wallets, and protocol vaults. */
export type AccountsPositionsArgs = {
  distinct_on?: InputMaybe<Array<Positions_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Positions_Order_By>>;
  where?: InputMaybe<Positions_Bool_Exp>;
};


/** Blockchain accounts participating in the protocol, including users, atom wallets, and protocol vaults. */
export type AccountsPositions_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Positions_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Positions_Order_By>>;
  where?: InputMaybe<Positions_Bool_Exp>;
};


/** Blockchain accounts participating in the protocol, including users, atom wallets, and protocol vaults. */
export type AccountsRedemptions_ReceivedArgs = {
  distinct_on?: InputMaybe<Array<Redemptions_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Redemptions_Order_By>>;
  where?: InputMaybe<Redemptions_Bool_Exp>;
};


/** Blockchain accounts participating in the protocol, including users, atom wallets, and protocol vaults. */
export type AccountsRedemptions_Received_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Redemptions_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Redemptions_Order_By>>;
  where?: InputMaybe<Redemptions_Bool_Exp>;
};


/** Blockchain accounts participating in the protocol, including users, atom wallets, and protocol vaults. */
export type AccountsRedemptions_SentArgs = {
  distinct_on?: InputMaybe<Array<Redemptions_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Redemptions_Order_By>>;
  where?: InputMaybe<Redemptions_Bool_Exp>;
};


/** Blockchain accounts participating in the protocol, including users, atom wallets, and protocol vaults. */
export type AccountsRedemptions_Sent_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Redemptions_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Redemptions_Order_By>>;
  where?: InputMaybe<Redemptions_Bool_Exp>;
};


/** Blockchain accounts participating in the protocol, including users, atom wallets, and protocol vaults. */
export type AccountsSeason2_Iq_Ledger_EntriesArgs = {
  distinct_on?: InputMaybe<Array<Season2_Iq_Ledger_Entries_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Season2_Iq_Ledger_Entries_Order_By>>;
  where?: InputMaybe<Season2_Iq_Ledger_Entries_Bool_Exp>;
};


/** Blockchain accounts participating in the protocol, including users, atom wallets, and protocol vaults. */
export type AccountsSeason2_Iq_Ledger_Entries_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Season2_Iq_Ledger_Entries_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Season2_Iq_Ledger_Entries_Order_By>>;
  where?: InputMaybe<Season2_Iq_Ledger_Entries_Bool_Exp>;
};


/** Blockchain accounts participating in the protocol, including users, atom wallets, and protocol vaults. */
export type AccountsSignalsArgs = {
  distinct_on?: InputMaybe<Array<Signals_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Signals_Order_By>>;
  where?: InputMaybe<Signals_Bool_Exp>;
};


/** Blockchain accounts participating in the protocol, including users, atom wallets, and protocol vaults. */
export type AccountsSignals_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Signals_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Signals_Order_By>>;
  where?: InputMaybe<Signals_Bool_Exp>;
};


/** Blockchain accounts participating in the protocol, including users, atom wallets, and protocol vaults. */
export type AccountsTriplesArgs = {
  distinct_on?: InputMaybe<Array<Triples_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Triples_Order_By>>;
  where?: InputMaybe<Triples_Bool_Exp>;
};


/** Blockchain accounts participating in the protocol, including users, atom wallets, and protocol vaults. */
export type AccountsTriples_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Triples_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Triples_Order_By>>;
  where?: InputMaybe<Triples_Bool_Exp>;
};

/** aggregated selection of "account" */
export type Accounts_Aggregate = {
  __typename?: 'accounts_aggregate';
  aggregate?: Maybe<Accounts_Aggregate_Fields>;
  nodes: Array<Accounts>;
};

export type Accounts_Aggregate_Bool_Exp = {
  count?: InputMaybe<Accounts_Aggregate_Bool_Exp_Count>;
};

export type Accounts_Aggregate_Bool_Exp_Count = {
  arguments?: InputMaybe<Array<Accounts_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
  filter?: InputMaybe<Accounts_Bool_Exp>;
  predicate: Int_Comparison_Exp;
};

/** aggregate fields of "account" */
export type Accounts_Aggregate_Fields = {
  __typename?: 'accounts_aggregate_fields';
  count: Scalars['Int']['output'];
  max?: Maybe<Accounts_Max_Fields>;
  min?: Maybe<Accounts_Min_Fields>;
};


/** aggregate fields of "account" */
export type Accounts_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Accounts_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
};

/** order by aggregate values of table "account" */
export type Accounts_Aggregate_Order_By = {
  count?: InputMaybe<Order_By>;
  max?: InputMaybe<Accounts_Max_Order_By>;
  min?: InputMaybe<Accounts_Min_Order_By>;
};

/** Boolean expression to filter rows from the table "account". All fields are combined with a logical 'AND'. */
export type Accounts_Bool_Exp = {
  _and?: InputMaybe<Array<Accounts_Bool_Exp>>;
  _not?: InputMaybe<Accounts_Bool_Exp>;
  _or?: InputMaybe<Array<Accounts_Bool_Exp>>;
  atom?: InputMaybe<Atoms_Bool_Exp>;
  atom_id?: InputMaybe<String_Comparison_Exp>;
  atoms?: InputMaybe<Atoms_Bool_Exp>;
  atoms_aggregate?: InputMaybe<Atoms_Aggregate_Bool_Exp>;
  deposits_received?: InputMaybe<Deposits_Bool_Exp>;
  deposits_received_aggregate?: InputMaybe<Deposits_Aggregate_Bool_Exp>;
  deposits_sent?: InputMaybe<Deposits_Bool_Exp>;
  deposits_sent_aggregate?: InputMaybe<Deposits_Aggregate_Bool_Exp>;
  fee_transfers?: InputMaybe<Fee_Transfers_Bool_Exp>;
  fee_transfers_aggregate?: InputMaybe<Fee_Transfers_Aggregate_Bool_Exp>;
  id?: InputMaybe<String_Comparison_Exp>;
  image?: InputMaybe<String_Comparison_Exp>;
  label?: InputMaybe<String_Comparison_Exp>;
  positions?: InputMaybe<Positions_Bool_Exp>;
  positions_aggregate?: InputMaybe<Positions_Aggregate_Bool_Exp>;
  redemptions_received?: InputMaybe<Redemptions_Bool_Exp>;
  redemptions_received_aggregate?: InputMaybe<Redemptions_Aggregate_Bool_Exp>;
  redemptions_sent?: InputMaybe<Redemptions_Bool_Exp>;
  redemptions_sent_aggregate?: InputMaybe<Redemptions_Aggregate_Bool_Exp>;
  season2_iq_ledger_entries?: InputMaybe<Season2_Iq_Ledger_Entries_Bool_Exp>;
  season2_iq_ledger_entries_aggregate?: InputMaybe<Season2_Iq_Ledger_Entries_Aggregate_Bool_Exp>;
  signals?: InputMaybe<Signals_Bool_Exp>;
  signals_aggregate?: InputMaybe<Signals_Aggregate_Bool_Exp>;
  triples?: InputMaybe<Triples_Bool_Exp>;
  triples_aggregate?: InputMaybe<Triples_Aggregate_Bool_Exp>;
  type?: InputMaybe<Account_Type_Comparison_Exp>;
};

/** aggregate max on columns */
export type Accounts_Max_Fields = {
  __typename?: 'accounts_max_fields';
  /** Optional reference to atom if this account represents an atom wallet. */
  atom_id?: Maybe<Scalars['String']['output']>;
  /** Account address (Ethereum address or atom wallet address). */
  id?: Maybe<Scalars['String']['output']>;
  /** Profile image URL for this account. */
  image?: Maybe<Scalars['String']['output']>;
  /** Human-readable label for this account (ENS name, atom label, or address). */
  label?: Maybe<Scalars['String']['output']>;
  /** Classification of account type (Default, AtomWallet, ProtocolVault). */
  type?: Maybe<Scalars['account_type']['output']>;
};

/** order by max() on columns of table "account" */
export type Accounts_Max_Order_By = {
  /** Optional reference to atom if this account represents an atom wallet. */
  atom_id?: InputMaybe<Order_By>;
  /** Account address (Ethereum address or atom wallet address). */
  id?: InputMaybe<Order_By>;
  /** Profile image URL for this account. */
  image?: InputMaybe<Order_By>;
  /** Human-readable label for this account (ENS name, atom label, or address). */
  label?: InputMaybe<Order_By>;
  /** Classification of account type (Default, AtomWallet, ProtocolVault). */
  type?: InputMaybe<Order_By>;
};

/** aggregate min on columns */
export type Accounts_Min_Fields = {
  __typename?: 'accounts_min_fields';
  /** Optional reference to atom if this account represents an atom wallet. */
  atom_id?: Maybe<Scalars['String']['output']>;
  /** Account address (Ethereum address or atom wallet address). */
  id?: Maybe<Scalars['String']['output']>;
  /** Profile image URL for this account. */
  image?: Maybe<Scalars['String']['output']>;
  /** Human-readable label for this account (ENS name, atom label, or address). */
  label?: Maybe<Scalars['String']['output']>;
  /** Classification of account type (Default, AtomWallet, ProtocolVault). */
  type?: Maybe<Scalars['account_type']['output']>;
};

/** order by min() on columns of table "account" */
export type Accounts_Min_Order_By = {
  /** Optional reference to atom if this account represents an atom wallet. */
  atom_id?: InputMaybe<Order_By>;
  /** Account address (Ethereum address or atom wallet address). */
  id?: InputMaybe<Order_By>;
  /** Profile image URL for this account. */
  image?: InputMaybe<Order_By>;
  /** Human-readable label for this account (ENS name, atom label, or address). */
  label?: InputMaybe<Order_By>;
  /** Classification of account type (Default, AtomWallet, ProtocolVault). */
  type?: InputMaybe<Order_By>;
};

/** Ordering options when selecting data from "account". */
export type Accounts_Order_By = {
  atom?: InputMaybe<Atoms_Order_By>;
  atom_id?: InputMaybe<Order_By>;
  atoms_aggregate?: InputMaybe<Atoms_Aggregate_Order_By>;
  deposits_received_aggregate?: InputMaybe<Deposits_Aggregate_Order_By>;
  deposits_sent_aggregate?: InputMaybe<Deposits_Aggregate_Order_By>;
  fee_transfers_aggregate?: InputMaybe<Fee_Transfers_Aggregate_Order_By>;
  id?: InputMaybe<Order_By>;
  image?: InputMaybe<Order_By>;
  label?: InputMaybe<Order_By>;
  positions_aggregate?: InputMaybe<Positions_Aggregate_Order_By>;
  redemptions_received_aggregate?: InputMaybe<Redemptions_Aggregate_Order_By>;
  redemptions_sent_aggregate?: InputMaybe<Redemptions_Aggregate_Order_By>;
  season2_iq_ledger_entries_aggregate?: InputMaybe<Season2_Iq_Ledger_Entries_Aggregate_Order_By>;
  signals_aggregate?: InputMaybe<Signals_Aggregate_Order_By>;
  triples_aggregate?: InputMaybe<Triples_Aggregate_Order_By>;
  type?: InputMaybe<Order_By>;
};

/** select columns of table "account" */
export type Accounts_Select_Column =
  /** column name */
  | 'atom_id'
  /** column name */
  | 'id'
  /** column name */
  | 'image'
  /** column name */
  | 'label'
  /** column name */
  | 'type';

/** Streaming cursor of the table "accounts" */
export type Accounts_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Accounts_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Accounts_Stream_Cursor_Value_Input = {
  /** Optional reference to atom if this account represents an atom wallet. */
  atom_id?: InputMaybe<Scalars['String']['input']>;
  /** Account address (Ethereum address or atom wallet address). */
  id?: InputMaybe<Scalars['String']['input']>;
  /** Profile image URL for this account. */
  image?: InputMaybe<Scalars['String']['input']>;
  /** Human-readable label for this account (ENS name, atom label, or address). */
  label?: InputMaybe<Scalars['String']['input']>;
  /** Classification of account type (Default, AtomWallet, ProtocolVault). */
  type?: InputMaybe<Scalars['account_type']['input']>;
};

/** Boolean expression to compare columns of type "atom_resolving_status". All fields are combined with logical 'AND'. */
export type Atom_Resolving_Status_Comparison_Exp = {
  _eq?: InputMaybe<Scalars['atom_resolving_status']['input']>;
  _gt?: InputMaybe<Scalars['atom_resolving_status']['input']>;
  _gte?: InputMaybe<Scalars['atom_resolving_status']['input']>;
  _in?: InputMaybe<Array<Scalars['atom_resolving_status']['input']>>;
  _is_null?: InputMaybe<Scalars['Boolean']['input']>;
  _lt?: InputMaybe<Scalars['atom_resolving_status']['input']>;
  _lte?: InputMaybe<Scalars['atom_resolving_status']['input']>;
  _neq?: InputMaybe<Scalars['atom_resolving_status']['input']>;
  _nin?: InputMaybe<Array<Scalars['atom_resolving_status']['input']>>;
};

/** Boolean expression to compare columns of type "atom_type". All fields are combined with logical 'AND'. */
export type Atom_Type_Comparison_Exp = {
  _eq?: InputMaybe<Scalars['atom_type']['input']>;
  _gt?: InputMaybe<Scalars['atom_type']['input']>;
  _gte?: InputMaybe<Scalars['atom_type']['input']>;
  _in?: InputMaybe<Array<Scalars['atom_type']['input']>>;
  _is_null?: InputMaybe<Scalars['Boolean']['input']>;
  _lt?: InputMaybe<Scalars['atom_type']['input']>;
  _lte?: InputMaybe<Scalars['atom_type']['input']>;
  _neq?: InputMaybe<Scalars['atom_type']['input']>;
  _nin?: InputMaybe<Array<Scalars['atom_type']['input']>>;
};

/** Polymorphic reference table linking atoms to their typed value tables (person, thing, organization, etc.). */
export type Atom_Values = {
  __typename?: 'atom_values';
  /** An object relationship */
  account?: Maybe<Accounts>;
  /** Reference to account table if atom value is an Account. */
  account_id?: Maybe<Scalars['String']['output']>;
  /** An object relationship */
  atom?: Maybe<Atoms>;
  /** An object relationship */
  book?: Maybe<Books>;
  /** Reference to book table if atom value is a Book. */
  book_id?: Maybe<Scalars['String']['output']>;
  /** An object relationship */
  byte_object?: Maybe<Byte_Object>;
  /** Reference to byte_object table if atom value is binary data. */
  byte_object_id?: Maybe<Scalars['String']['output']>;
  /** An object relationship */
  caip10?: Maybe<Caip10>;
  /** Reference to caip10 table if atom value is a CAIP-10 account. */
  caip10_id?: Maybe<Scalars['String']['output']>;
  /** Unique identifier matching the atom value_id. */
  id: Scalars['String']['output'];
  /** An object relationship */
  json_object?: Maybe<Json_Objects>;
  /** Reference to json_object table if atom value is JSON data. */
  json_object_id?: Maybe<Scalars['String']['output']>;
  /** An object relationship */
  organization?: Maybe<Organizations>;
  /** Reference to organization table if atom value is an Organization. */
  organization_id?: Maybe<Scalars['String']['output']>;
  /** An object relationship */
  person?: Maybe<Persons>;
  /** Reference to person table if atom value is a Person. */
  person_id?: Maybe<Scalars['String']['output']>;
  /** An object relationship */
  text_object?: Maybe<Text_Objects>;
  /** Reference to text_object table if atom value is plain text. */
  text_object_id?: Maybe<Scalars['String']['output']>;
  /** An object relationship */
  thing?: Maybe<Things>;
  /** Reference to thing table if atom value is a Thing. */
  thing_id?: Maybe<Scalars['String']['output']>;
};

/** aggregated selection of "atom_value" */
export type Atom_Values_Aggregate = {
  __typename?: 'atom_values_aggregate';
  aggregate?: Maybe<Atom_Values_Aggregate_Fields>;
  nodes: Array<Atom_Values>;
};

/** aggregate fields of "atom_value" */
export type Atom_Values_Aggregate_Fields = {
  __typename?: 'atom_values_aggregate_fields';
  count: Scalars['Int']['output'];
  max?: Maybe<Atom_Values_Max_Fields>;
  min?: Maybe<Atom_Values_Min_Fields>;
};


/** aggregate fields of "atom_value" */
export type Atom_Values_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Atom_Values_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
};

/** Boolean expression to filter rows from the table "atom_value". All fields are combined with a logical 'AND'. */
export type Atom_Values_Bool_Exp = {
  _and?: InputMaybe<Array<Atom_Values_Bool_Exp>>;
  _not?: InputMaybe<Atom_Values_Bool_Exp>;
  _or?: InputMaybe<Array<Atom_Values_Bool_Exp>>;
  account?: InputMaybe<Accounts_Bool_Exp>;
  account_id?: InputMaybe<String_Comparison_Exp>;
  atom?: InputMaybe<Atoms_Bool_Exp>;
  book?: InputMaybe<Books_Bool_Exp>;
  book_id?: InputMaybe<String_Comparison_Exp>;
  byte_object?: InputMaybe<Byte_Object_Bool_Exp>;
  byte_object_id?: InputMaybe<String_Comparison_Exp>;
  caip10?: InputMaybe<Caip10_Bool_Exp>;
  caip10_id?: InputMaybe<String_Comparison_Exp>;
  id?: InputMaybe<String_Comparison_Exp>;
  json_object?: InputMaybe<Json_Objects_Bool_Exp>;
  json_object_id?: InputMaybe<String_Comparison_Exp>;
  organization?: InputMaybe<Organizations_Bool_Exp>;
  organization_id?: InputMaybe<String_Comparison_Exp>;
  person?: InputMaybe<Persons_Bool_Exp>;
  person_id?: InputMaybe<String_Comparison_Exp>;
  text_object?: InputMaybe<Text_Objects_Bool_Exp>;
  text_object_id?: InputMaybe<String_Comparison_Exp>;
  thing?: InputMaybe<Things_Bool_Exp>;
  thing_id?: InputMaybe<String_Comparison_Exp>;
};

/** aggregate max on columns */
export type Atom_Values_Max_Fields = {
  __typename?: 'atom_values_max_fields';
  /** Reference to account table if atom value is an Account. */
  account_id?: Maybe<Scalars['String']['output']>;
  /** Reference to book table if atom value is a Book. */
  book_id?: Maybe<Scalars['String']['output']>;
  /** Reference to byte_object table if atom value is binary data. */
  byte_object_id?: Maybe<Scalars['String']['output']>;
  /** Reference to caip10 table if atom value is a CAIP-10 account. */
  caip10_id?: Maybe<Scalars['String']['output']>;
  /** Unique identifier matching the atom value_id. */
  id?: Maybe<Scalars['String']['output']>;
  /** Reference to json_object table if atom value is JSON data. */
  json_object_id?: Maybe<Scalars['String']['output']>;
  /** Reference to organization table if atom value is an Organization. */
  organization_id?: Maybe<Scalars['String']['output']>;
  /** Reference to person table if atom value is a Person. */
  person_id?: Maybe<Scalars['String']['output']>;
  /** Reference to text_object table if atom value is plain text. */
  text_object_id?: Maybe<Scalars['String']['output']>;
  /** Reference to thing table if atom value is a Thing. */
  thing_id?: Maybe<Scalars['String']['output']>;
};

/** aggregate min on columns */
export type Atom_Values_Min_Fields = {
  __typename?: 'atom_values_min_fields';
  /** Reference to account table if atom value is an Account. */
  account_id?: Maybe<Scalars['String']['output']>;
  /** Reference to book table if atom value is a Book. */
  book_id?: Maybe<Scalars['String']['output']>;
  /** Reference to byte_object table if atom value is binary data. */
  byte_object_id?: Maybe<Scalars['String']['output']>;
  /** Reference to caip10 table if atom value is a CAIP-10 account. */
  caip10_id?: Maybe<Scalars['String']['output']>;
  /** Unique identifier matching the atom value_id. */
  id?: Maybe<Scalars['String']['output']>;
  /** Reference to json_object table if atom value is JSON data. */
  json_object_id?: Maybe<Scalars['String']['output']>;
  /** Reference to organization table if atom value is an Organization. */
  organization_id?: Maybe<Scalars['String']['output']>;
  /** Reference to person table if atom value is a Person. */
  person_id?: Maybe<Scalars['String']['output']>;
  /** Reference to text_object table if atom value is plain text. */
  text_object_id?: Maybe<Scalars['String']['output']>;
  /** Reference to thing table if atom value is a Thing. */
  thing_id?: Maybe<Scalars['String']['output']>;
};

/** Ordering options when selecting data from "atom_value". */
export type Atom_Values_Order_By = {
  account?: InputMaybe<Accounts_Order_By>;
  account_id?: InputMaybe<Order_By>;
  atom?: InputMaybe<Atoms_Order_By>;
  book?: InputMaybe<Books_Order_By>;
  book_id?: InputMaybe<Order_By>;
  byte_object?: InputMaybe<Byte_Object_Order_By>;
  byte_object_id?: InputMaybe<Order_By>;
  caip10?: InputMaybe<Caip10_Order_By>;
  caip10_id?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  json_object?: InputMaybe<Json_Objects_Order_By>;
  json_object_id?: InputMaybe<Order_By>;
  organization?: InputMaybe<Organizations_Order_By>;
  organization_id?: InputMaybe<Order_By>;
  person?: InputMaybe<Persons_Order_By>;
  person_id?: InputMaybe<Order_By>;
  text_object?: InputMaybe<Text_Objects_Order_By>;
  text_object_id?: InputMaybe<Order_By>;
  thing?: InputMaybe<Things_Order_By>;
  thing_id?: InputMaybe<Order_By>;
};

/** select columns of table "atom_value" */
export type Atom_Values_Select_Column =
  /** column name */
  | 'account_id'
  /** column name */
  | 'book_id'
  /** column name */
  | 'byte_object_id'
  /** column name */
  | 'caip10_id'
  /** column name */
  | 'id'
  /** column name */
  | 'json_object_id'
  /** column name */
  | 'organization_id'
  /** column name */
  | 'person_id'
  /** column name */
  | 'text_object_id'
  /** column name */
  | 'thing_id';

/** Streaming cursor of the table "atom_values" */
export type Atom_Values_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Atom_Values_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Atom_Values_Stream_Cursor_Value_Input = {
  /** Reference to account table if atom value is an Account. */
  account_id?: InputMaybe<Scalars['String']['input']>;
  /** Reference to book table if atom value is a Book. */
  book_id?: InputMaybe<Scalars['String']['input']>;
  /** Reference to byte_object table if atom value is binary data. */
  byte_object_id?: InputMaybe<Scalars['String']['input']>;
  /** Reference to caip10 table if atom value is a CAIP-10 account. */
  caip10_id?: InputMaybe<Scalars['String']['input']>;
  /** Unique identifier matching the atom value_id. */
  id?: InputMaybe<Scalars['String']['input']>;
  /** Reference to json_object table if atom value is JSON data. */
  json_object_id?: InputMaybe<Scalars['String']['input']>;
  /** Reference to organization table if atom value is an Organization. */
  organization_id?: InputMaybe<Scalars['String']['input']>;
  /** Reference to person table if atom value is a Person. */
  person_id?: InputMaybe<Scalars['String']['input']>;
  /** Reference to text_object table if atom value is plain text. */
  text_object_id?: InputMaybe<Scalars['String']['input']>;
  /** Reference to thing table if atom value is a Thing. */
  thing_id?: InputMaybe<Scalars['String']['input']>;
};

/** Atomic data units with typed values (person, organization, thing, etc.) and metadata resolved from IPFS or blockchain. */
export type Atoms = {
  __typename?: 'atoms';
  /** An array relationship */
  accounts: Array<Accounts>;
  /** An aggregate relationship */
  accounts_aggregate: Accounts_Aggregate;
  /** An array relationship */
  as_object_predicate_objects: Array<Predicate_Objects>;
  /** An aggregate relationship */
  as_object_predicate_objects_aggregate: Predicate_Objects_Aggregate;
  /** An array relationship */
  as_object_triples: Array<Triples>;
  /** An aggregate relationship */
  as_object_triples_aggregate: Triples_Aggregate;
  /** An array relationship */
  as_predicate_predicate_objects: Array<Predicate_Objects>;
  /** An aggregate relationship */
  as_predicate_predicate_objects_aggregate: Predicate_Objects_Aggregate;
  /** An array relationship */
  as_predicate_triples: Array<Triples>;
  /** An aggregate relationship */
  as_predicate_triples_aggregate: Triples_Aggregate;
  /** An array relationship */
  as_subject_triples: Array<Triples>;
  /** An aggregate relationship */
  as_subject_triples_aggregate: Triples_Aggregate;
  /** Block number when this atom was created. */
  block_number: Scalars['numeric']['output'];
  cached_image?: Maybe<Cached_Images_Cached_Image>;
  /** An object relationship */
  controller?: Maybe<Accounts>;
  /** Timestamp when this atom was created. */
  created_at: Scalars['timestamptz']['output'];
  /** An object relationship */
  creator?: Maybe<Accounts>;
  /** Account that created this atom via smart contract transaction. */
  creator_id: Scalars['String']['output'];
  /** Parsed and normalized data URI or value extracted from raw_data. */
  data?: Maybe<Scalars['String']['output']>;
  /** Optional emoji representation for UI display. */
  emoji?: Maybe<Scalars['String']['output']>;
  /** URL to image representation, validated by image-guard service. */
  image?: Maybe<Scalars['String']['output']>;
  /** Human-readable label or title for this atom. */
  label?: Maybe<Scalars['String']['output']>;
  /** Log index within the transaction for event ordering. */
  log_index: Scalars['bigint']['output'];
  /** An array relationship */
  positions: Array<Positions>;
  /** An aggregate relationship */
  positions_aggregate: Positions_Aggregate;
  /** Original data URI or value as emitted from the smart contract event. */
  raw_data: Scalars['String']['output'];
  /** Current status of metadata resolution (Pending, Resolved, Failed). */
  resolving_status: Scalars['atom_resolving_status']['output'];
  /** An array relationship */
  signals: Array<Signals>;
  /** An aggregate relationship */
  signals_aggregate: Signals_Aggregate;
  /** An object relationship */
  term?: Maybe<Terms>;
  /** Unique identifier linking to the term registry. */
  term_id: Scalars['String']['output'];
  /** Transaction hash of the atom creation event. */
  transaction_hash: Scalars['String']['output'];
  /** Classification of atom value type (Person, Organization, Thing, Caip10, etc.). */
  type: Scalars['atom_type']['output'];
  /** Timestamp of last update, automatically maintained by trigger. */
  updated_at: Scalars['timestamptz']['output'];
  /** An object relationship */
  value?: Maybe<Atom_Values>;
  /** Foreign key to polymorphic value table (person, organization, thing, etc.). */
  value_id?: Maybe<Scalars['String']['output']>;
  /** Dedicated vault address for this atom, holds staked assets. */
  wallet_id: Scalars['String']['output'];
};


/** Atomic data units with typed values (person, organization, thing, etc.) and metadata resolved from IPFS or blockchain. */
export type AtomsAccountsArgs = {
  distinct_on?: InputMaybe<Array<Accounts_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Accounts_Order_By>>;
  where?: InputMaybe<Accounts_Bool_Exp>;
};


/** Atomic data units with typed values (person, organization, thing, etc.) and metadata resolved from IPFS or blockchain. */
export type AtomsAccounts_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Accounts_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Accounts_Order_By>>;
  where?: InputMaybe<Accounts_Bool_Exp>;
};


/** Atomic data units with typed values (person, organization, thing, etc.) and metadata resolved from IPFS or blockchain. */
export type AtomsAs_Object_Predicate_ObjectsArgs = {
  distinct_on?: InputMaybe<Array<Predicate_Objects_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Predicate_Objects_Order_By>>;
  where?: InputMaybe<Predicate_Objects_Bool_Exp>;
};


/** Atomic data units with typed values (person, organization, thing, etc.) and metadata resolved from IPFS or blockchain. */
export type AtomsAs_Object_Predicate_Objects_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Predicate_Objects_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Predicate_Objects_Order_By>>;
  where?: InputMaybe<Predicate_Objects_Bool_Exp>;
};


/** Atomic data units with typed values (person, organization, thing, etc.) and metadata resolved from IPFS or blockchain. */
export type AtomsAs_Object_TriplesArgs = {
  distinct_on?: InputMaybe<Array<Triples_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Triples_Order_By>>;
  where?: InputMaybe<Triples_Bool_Exp>;
};


/** Atomic data units with typed values (person, organization, thing, etc.) and metadata resolved from IPFS or blockchain. */
export type AtomsAs_Object_Triples_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Triples_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Triples_Order_By>>;
  where?: InputMaybe<Triples_Bool_Exp>;
};


/** Atomic data units with typed values (person, organization, thing, etc.) and metadata resolved from IPFS or blockchain. */
export type AtomsAs_Predicate_Predicate_ObjectsArgs = {
  distinct_on?: InputMaybe<Array<Predicate_Objects_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Predicate_Objects_Order_By>>;
  where?: InputMaybe<Predicate_Objects_Bool_Exp>;
};


/** Atomic data units with typed values (person, organization, thing, etc.) and metadata resolved from IPFS or blockchain. */
export type AtomsAs_Predicate_Predicate_Objects_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Predicate_Objects_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Predicate_Objects_Order_By>>;
  where?: InputMaybe<Predicate_Objects_Bool_Exp>;
};


/** Atomic data units with typed values (person, organization, thing, etc.) and metadata resolved from IPFS or blockchain. */
export type AtomsAs_Predicate_TriplesArgs = {
  distinct_on?: InputMaybe<Array<Triples_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Triples_Order_By>>;
  where?: InputMaybe<Triples_Bool_Exp>;
};


/** Atomic data units with typed values (person, organization, thing, etc.) and metadata resolved from IPFS or blockchain. */
export type AtomsAs_Predicate_Triples_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Triples_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Triples_Order_By>>;
  where?: InputMaybe<Triples_Bool_Exp>;
};


/** Atomic data units with typed values (person, organization, thing, etc.) and metadata resolved from IPFS or blockchain. */
export type AtomsAs_Subject_TriplesArgs = {
  distinct_on?: InputMaybe<Array<Triples_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Triples_Order_By>>;
  where?: InputMaybe<Triples_Bool_Exp>;
};


/** Atomic data units with typed values (person, organization, thing, etc.) and metadata resolved from IPFS or blockchain. */
export type AtomsAs_Subject_Triples_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Triples_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Triples_Order_By>>;
  where?: InputMaybe<Triples_Bool_Exp>;
};


/** Atomic data units with typed values (person, organization, thing, etc.) and metadata resolved from IPFS or blockchain. */
export type AtomsPositionsArgs = {
  distinct_on?: InputMaybe<Array<Positions_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Positions_Order_By>>;
  where?: InputMaybe<Positions_Bool_Exp>;
};


/** Atomic data units with typed values (person, organization, thing, etc.) and metadata resolved from IPFS or blockchain. */
export type AtomsPositions_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Positions_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Positions_Order_By>>;
  where?: InputMaybe<Positions_Bool_Exp>;
};


/** Atomic data units with typed values (person, organization, thing, etc.) and metadata resolved from IPFS or blockchain. */
export type AtomsSignalsArgs = {
  distinct_on?: InputMaybe<Array<Signals_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Signals_Order_By>>;
  where?: InputMaybe<Signals_Bool_Exp>;
};


/** Atomic data units with typed values (person, organization, thing, etc.) and metadata resolved from IPFS or blockchain. */
export type AtomsSignals_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Signals_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Signals_Order_By>>;
  where?: InputMaybe<Signals_Bool_Exp>;
};

/** aggregated selection of "atom" */
export type Atoms_Aggregate = {
  __typename?: 'atoms_aggregate';
  aggregate?: Maybe<Atoms_Aggregate_Fields>;
  nodes: Array<Atoms>;
};

export type Atoms_Aggregate_Bool_Exp = {
  count?: InputMaybe<Atoms_Aggregate_Bool_Exp_Count>;
};

export type Atoms_Aggregate_Bool_Exp_Count = {
  arguments?: InputMaybe<Array<Atoms_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
  filter?: InputMaybe<Atoms_Bool_Exp>;
  predicate: Int_Comparison_Exp;
};

/** aggregate fields of "atom" */
export type Atoms_Aggregate_Fields = {
  __typename?: 'atoms_aggregate_fields';
  avg?: Maybe<Atoms_Avg_Fields>;
  count: Scalars['Int']['output'];
  max?: Maybe<Atoms_Max_Fields>;
  min?: Maybe<Atoms_Min_Fields>;
  stddev?: Maybe<Atoms_Stddev_Fields>;
  stddev_pop?: Maybe<Atoms_Stddev_Pop_Fields>;
  stddev_samp?: Maybe<Atoms_Stddev_Samp_Fields>;
  sum?: Maybe<Atoms_Sum_Fields>;
  var_pop?: Maybe<Atoms_Var_Pop_Fields>;
  var_samp?: Maybe<Atoms_Var_Samp_Fields>;
  variance?: Maybe<Atoms_Variance_Fields>;
};


/** aggregate fields of "atom" */
export type Atoms_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Atoms_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
};

/** order by aggregate values of table "atom" */
export type Atoms_Aggregate_Order_By = {
  avg?: InputMaybe<Atoms_Avg_Order_By>;
  count?: InputMaybe<Order_By>;
  max?: InputMaybe<Atoms_Max_Order_By>;
  min?: InputMaybe<Atoms_Min_Order_By>;
  stddev?: InputMaybe<Atoms_Stddev_Order_By>;
  stddev_pop?: InputMaybe<Atoms_Stddev_Pop_Order_By>;
  stddev_samp?: InputMaybe<Atoms_Stddev_Samp_Order_By>;
  sum?: InputMaybe<Atoms_Sum_Order_By>;
  var_pop?: InputMaybe<Atoms_Var_Pop_Order_By>;
  var_samp?: InputMaybe<Atoms_Var_Samp_Order_By>;
  variance?: InputMaybe<Atoms_Variance_Order_By>;
};

/** aggregate avg on columns */
export type Atoms_Avg_Fields = {
  __typename?: 'atoms_avg_fields';
  /** Block number when this atom was created. */
  block_number?: Maybe<Scalars['Float']['output']>;
  /** Log index within the transaction for event ordering. */
  log_index?: Maybe<Scalars['Float']['output']>;
};

/** order by avg() on columns of table "atom" */
export type Atoms_Avg_Order_By = {
  /** Block number when this atom was created. */
  block_number?: InputMaybe<Order_By>;
  /** Log index within the transaction for event ordering. */
  log_index?: InputMaybe<Order_By>;
};

/** Boolean expression to filter rows from the table "atom". All fields are combined with a logical 'AND'. */
export type Atoms_Bool_Exp = {
  _and?: InputMaybe<Array<Atoms_Bool_Exp>>;
  _not?: InputMaybe<Atoms_Bool_Exp>;
  _or?: InputMaybe<Array<Atoms_Bool_Exp>>;
  accounts?: InputMaybe<Accounts_Bool_Exp>;
  accounts_aggregate?: InputMaybe<Accounts_Aggregate_Bool_Exp>;
  as_object_predicate_objects?: InputMaybe<Predicate_Objects_Bool_Exp>;
  as_object_predicate_objects_aggregate?: InputMaybe<Predicate_Objects_Aggregate_Bool_Exp>;
  as_object_triples?: InputMaybe<Triples_Bool_Exp>;
  as_object_triples_aggregate?: InputMaybe<Triples_Aggregate_Bool_Exp>;
  as_predicate_predicate_objects?: InputMaybe<Predicate_Objects_Bool_Exp>;
  as_predicate_predicate_objects_aggregate?: InputMaybe<Predicate_Objects_Aggregate_Bool_Exp>;
  as_predicate_triples?: InputMaybe<Triples_Bool_Exp>;
  as_predicate_triples_aggregate?: InputMaybe<Triples_Aggregate_Bool_Exp>;
  as_subject_triples?: InputMaybe<Triples_Bool_Exp>;
  as_subject_triples_aggregate?: InputMaybe<Triples_Aggregate_Bool_Exp>;
  block_number?: InputMaybe<Numeric_Comparison_Exp>;
  controller?: InputMaybe<Accounts_Bool_Exp>;
  created_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  creator?: InputMaybe<Accounts_Bool_Exp>;
  creator_id?: InputMaybe<String_Comparison_Exp>;
  data?: InputMaybe<String_Comparison_Exp>;
  emoji?: InputMaybe<String_Comparison_Exp>;
  image?: InputMaybe<String_Comparison_Exp>;
  label?: InputMaybe<String_Comparison_Exp>;
  log_index?: InputMaybe<Bigint_Comparison_Exp>;
  positions?: InputMaybe<Positions_Bool_Exp>;
  positions_aggregate?: InputMaybe<Positions_Aggregate_Bool_Exp>;
  raw_data?: InputMaybe<String_Comparison_Exp>;
  resolving_status?: InputMaybe<Atom_Resolving_Status_Comparison_Exp>;
  signals?: InputMaybe<Signals_Bool_Exp>;
  signals_aggregate?: InputMaybe<Signals_Aggregate_Bool_Exp>;
  term?: InputMaybe<Terms_Bool_Exp>;
  term_id?: InputMaybe<String_Comparison_Exp>;
  transaction_hash?: InputMaybe<String_Comparison_Exp>;
  type?: InputMaybe<Atom_Type_Comparison_Exp>;
  updated_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  value?: InputMaybe<Atom_Values_Bool_Exp>;
  value_id?: InputMaybe<String_Comparison_Exp>;
  wallet_id?: InputMaybe<String_Comparison_Exp>;
};

/** aggregate max on columns */
export type Atoms_Max_Fields = {
  __typename?: 'atoms_max_fields';
  /** Block number when this atom was created. */
  block_number?: Maybe<Scalars['numeric']['output']>;
  /** Timestamp when this atom was created. */
  created_at?: Maybe<Scalars['timestamptz']['output']>;
  /** Account that created this atom via smart contract transaction. */
  creator_id?: Maybe<Scalars['String']['output']>;
  /** Parsed and normalized data URI or value extracted from raw_data. */
  data?: Maybe<Scalars['String']['output']>;
  /** Optional emoji representation for UI display. */
  emoji?: Maybe<Scalars['String']['output']>;
  /** URL to image representation, validated by image-guard service. */
  image?: Maybe<Scalars['String']['output']>;
  /** Human-readable label or title for this atom. */
  label?: Maybe<Scalars['String']['output']>;
  /** Log index within the transaction for event ordering. */
  log_index?: Maybe<Scalars['bigint']['output']>;
  /** Original data URI or value as emitted from the smart contract event. */
  raw_data?: Maybe<Scalars['String']['output']>;
  /** Current status of metadata resolution (Pending, Resolved, Failed). */
  resolving_status?: Maybe<Scalars['atom_resolving_status']['output']>;
  /** Unique identifier linking to the term registry. */
  term_id?: Maybe<Scalars['String']['output']>;
  /** Transaction hash of the atom creation event. */
  transaction_hash?: Maybe<Scalars['String']['output']>;
  /** Classification of atom value type (Person, Organization, Thing, Caip10, etc.). */
  type?: Maybe<Scalars['atom_type']['output']>;
  /** Timestamp of last update, automatically maintained by trigger. */
  updated_at?: Maybe<Scalars['timestamptz']['output']>;
  /** Foreign key to polymorphic value table (person, organization, thing, etc.). */
  value_id?: Maybe<Scalars['String']['output']>;
  /** Dedicated vault address for this atom, holds staked assets. */
  wallet_id?: Maybe<Scalars['String']['output']>;
};

/** order by max() on columns of table "atom" */
export type Atoms_Max_Order_By = {
  /** Block number when this atom was created. */
  block_number?: InputMaybe<Order_By>;
  /** Timestamp when this atom was created. */
  created_at?: InputMaybe<Order_By>;
  /** Account that created this atom via smart contract transaction. */
  creator_id?: InputMaybe<Order_By>;
  /** Parsed and normalized data URI or value extracted from raw_data. */
  data?: InputMaybe<Order_By>;
  /** Optional emoji representation for UI display. */
  emoji?: InputMaybe<Order_By>;
  /** URL to image representation, validated by image-guard service. */
  image?: InputMaybe<Order_By>;
  /** Human-readable label or title for this atom. */
  label?: InputMaybe<Order_By>;
  /** Log index within the transaction for event ordering. */
  log_index?: InputMaybe<Order_By>;
  /** Original data URI or value as emitted from the smart contract event. */
  raw_data?: InputMaybe<Order_By>;
  /** Current status of metadata resolution (Pending, Resolved, Failed). */
  resolving_status?: InputMaybe<Order_By>;
  /** Unique identifier linking to the term registry. */
  term_id?: InputMaybe<Order_By>;
  /** Transaction hash of the atom creation event. */
  transaction_hash?: InputMaybe<Order_By>;
  /** Classification of atom value type (Person, Organization, Thing, Caip10, etc.). */
  type?: InputMaybe<Order_By>;
  /** Timestamp of last update, automatically maintained by trigger. */
  updated_at?: InputMaybe<Order_By>;
  /** Foreign key to polymorphic value table (person, organization, thing, etc.). */
  value_id?: InputMaybe<Order_By>;
  /** Dedicated vault address for this atom, holds staked assets. */
  wallet_id?: InputMaybe<Order_By>;
};

/** aggregate min on columns */
export type Atoms_Min_Fields = {
  __typename?: 'atoms_min_fields';
  /** Block number when this atom was created. */
  block_number?: Maybe<Scalars['numeric']['output']>;
  /** Timestamp when this atom was created. */
  created_at?: Maybe<Scalars['timestamptz']['output']>;
  /** Account that created this atom via smart contract transaction. */
  creator_id?: Maybe<Scalars['String']['output']>;
  /** Parsed and normalized data URI or value extracted from raw_data. */
  data?: Maybe<Scalars['String']['output']>;
  /** Optional emoji representation for UI display. */
  emoji?: Maybe<Scalars['String']['output']>;
  /** URL to image representation, validated by image-guard service. */
  image?: Maybe<Scalars['String']['output']>;
  /** Human-readable label or title for this atom. */
  label?: Maybe<Scalars['String']['output']>;
  /** Log index within the transaction for event ordering. */
  log_index?: Maybe<Scalars['bigint']['output']>;
  /** Original data URI or value as emitted from the smart contract event. */
  raw_data?: Maybe<Scalars['String']['output']>;
  /** Current status of metadata resolution (Pending, Resolved, Failed). */
  resolving_status?: Maybe<Scalars['atom_resolving_status']['output']>;
  /** Unique identifier linking to the term registry. */
  term_id?: Maybe<Scalars['String']['output']>;
  /** Transaction hash of the atom creation event. */
  transaction_hash?: Maybe<Scalars['String']['output']>;
  /** Classification of atom value type (Person, Organization, Thing, Caip10, etc.). */
  type?: Maybe<Scalars['atom_type']['output']>;
  /** Timestamp of last update, automatically maintained by trigger. */
  updated_at?: Maybe<Scalars['timestamptz']['output']>;
  /** Foreign key to polymorphic value table (person, organization, thing, etc.). */
  value_id?: Maybe<Scalars['String']['output']>;
  /** Dedicated vault address for this atom, holds staked assets. */
  wallet_id?: Maybe<Scalars['String']['output']>;
};

/** order by min() on columns of table "atom" */
export type Atoms_Min_Order_By = {
  /** Block number when this atom was created. */
  block_number?: InputMaybe<Order_By>;
  /** Timestamp when this atom was created. */
  created_at?: InputMaybe<Order_By>;
  /** Account that created this atom via smart contract transaction. */
  creator_id?: InputMaybe<Order_By>;
  /** Parsed and normalized data URI or value extracted from raw_data. */
  data?: InputMaybe<Order_By>;
  /** Optional emoji representation for UI display. */
  emoji?: InputMaybe<Order_By>;
  /** URL to image representation, validated by image-guard service. */
  image?: InputMaybe<Order_By>;
  /** Human-readable label or title for this atom. */
  label?: InputMaybe<Order_By>;
  /** Log index within the transaction for event ordering. */
  log_index?: InputMaybe<Order_By>;
  /** Original data URI or value as emitted from the smart contract event. */
  raw_data?: InputMaybe<Order_By>;
  /** Current status of metadata resolution (Pending, Resolved, Failed). */
  resolving_status?: InputMaybe<Order_By>;
  /** Unique identifier linking to the term registry. */
  term_id?: InputMaybe<Order_By>;
  /** Transaction hash of the atom creation event. */
  transaction_hash?: InputMaybe<Order_By>;
  /** Classification of atom value type (Person, Organization, Thing, Caip10, etc.). */
  type?: InputMaybe<Order_By>;
  /** Timestamp of last update, automatically maintained by trigger. */
  updated_at?: InputMaybe<Order_By>;
  /** Foreign key to polymorphic value table (person, organization, thing, etc.). */
  value_id?: InputMaybe<Order_By>;
  /** Dedicated vault address for this atom, holds staked assets. */
  wallet_id?: InputMaybe<Order_By>;
};

/** Ordering options when selecting data from "atom". */
export type Atoms_Order_By = {
  accounts_aggregate?: InputMaybe<Accounts_Aggregate_Order_By>;
  as_object_predicate_objects_aggregate?: InputMaybe<Predicate_Objects_Aggregate_Order_By>;
  as_object_triples_aggregate?: InputMaybe<Triples_Aggregate_Order_By>;
  as_predicate_predicate_objects_aggregate?: InputMaybe<Predicate_Objects_Aggregate_Order_By>;
  as_predicate_triples_aggregate?: InputMaybe<Triples_Aggregate_Order_By>;
  as_subject_triples_aggregate?: InputMaybe<Triples_Aggregate_Order_By>;
  block_number?: InputMaybe<Order_By>;
  controller?: InputMaybe<Accounts_Order_By>;
  created_at?: InputMaybe<Order_By>;
  creator?: InputMaybe<Accounts_Order_By>;
  creator_id?: InputMaybe<Order_By>;
  data?: InputMaybe<Order_By>;
  emoji?: InputMaybe<Order_By>;
  image?: InputMaybe<Order_By>;
  label?: InputMaybe<Order_By>;
  log_index?: InputMaybe<Order_By>;
  positions_aggregate?: InputMaybe<Positions_Aggregate_Order_By>;
  raw_data?: InputMaybe<Order_By>;
  resolving_status?: InputMaybe<Order_By>;
  signals_aggregate?: InputMaybe<Signals_Aggregate_Order_By>;
  term?: InputMaybe<Terms_Order_By>;
  term_id?: InputMaybe<Order_By>;
  transaction_hash?: InputMaybe<Order_By>;
  type?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
  value?: InputMaybe<Atom_Values_Order_By>;
  value_id?: InputMaybe<Order_By>;
  wallet_id?: InputMaybe<Order_By>;
};

/** select columns of table "atom" */
export type Atoms_Select_Column =
  /** column name */
  | 'block_number'
  /** column name */
  | 'created_at'
  /** column name */
  | 'creator_id'
  /** column name */
  | 'data'
  /** column name */
  | 'emoji'
  /** column name */
  | 'image'
  /** column name */
  | 'label'
  /** column name */
  | 'log_index'
  /** column name */
  | 'raw_data'
  /** column name */
  | 'resolving_status'
  /** column name */
  | 'term_id'
  /** column name */
  | 'transaction_hash'
  /** column name */
  | 'type'
  /** column name */
  | 'updated_at'
  /** column name */
  | 'value_id'
  /** column name */
  | 'wallet_id';

/** aggregate stddev on columns */
export type Atoms_Stddev_Fields = {
  __typename?: 'atoms_stddev_fields';
  /** Block number when this atom was created. */
  block_number?: Maybe<Scalars['Float']['output']>;
  /** Log index within the transaction for event ordering. */
  log_index?: Maybe<Scalars['Float']['output']>;
};

/** order by stddev() on columns of table "atom" */
export type Atoms_Stddev_Order_By = {
  /** Block number when this atom was created. */
  block_number?: InputMaybe<Order_By>;
  /** Log index within the transaction for event ordering. */
  log_index?: InputMaybe<Order_By>;
};

/** aggregate stddev_pop on columns */
export type Atoms_Stddev_Pop_Fields = {
  __typename?: 'atoms_stddev_pop_fields';
  /** Block number when this atom was created. */
  block_number?: Maybe<Scalars['Float']['output']>;
  /** Log index within the transaction for event ordering. */
  log_index?: Maybe<Scalars['Float']['output']>;
};

/** order by stddev_pop() on columns of table "atom" */
export type Atoms_Stddev_Pop_Order_By = {
  /** Block number when this atom was created. */
  block_number?: InputMaybe<Order_By>;
  /** Log index within the transaction for event ordering. */
  log_index?: InputMaybe<Order_By>;
};

/** aggregate stddev_samp on columns */
export type Atoms_Stddev_Samp_Fields = {
  __typename?: 'atoms_stddev_samp_fields';
  /** Block number when this atom was created. */
  block_number?: Maybe<Scalars['Float']['output']>;
  /** Log index within the transaction for event ordering. */
  log_index?: Maybe<Scalars['Float']['output']>;
};

/** order by stddev_samp() on columns of table "atom" */
export type Atoms_Stddev_Samp_Order_By = {
  /** Block number when this atom was created. */
  block_number?: InputMaybe<Order_By>;
  /** Log index within the transaction for event ordering. */
  log_index?: InputMaybe<Order_By>;
};

/** Streaming cursor of the table "atoms" */
export type Atoms_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Atoms_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Atoms_Stream_Cursor_Value_Input = {
  /** Block number when this atom was created. */
  block_number?: InputMaybe<Scalars['numeric']['input']>;
  /** Timestamp when this atom was created. */
  created_at?: InputMaybe<Scalars['timestamptz']['input']>;
  /** Account that created this atom via smart contract transaction. */
  creator_id?: InputMaybe<Scalars['String']['input']>;
  /** Parsed and normalized data URI or value extracted from raw_data. */
  data?: InputMaybe<Scalars['String']['input']>;
  /** Optional emoji representation for UI display. */
  emoji?: InputMaybe<Scalars['String']['input']>;
  /** URL to image representation, validated by image-guard service. */
  image?: InputMaybe<Scalars['String']['input']>;
  /** Human-readable label or title for this atom. */
  label?: InputMaybe<Scalars['String']['input']>;
  /** Log index within the transaction for event ordering. */
  log_index?: InputMaybe<Scalars['bigint']['input']>;
  /** Original data URI or value as emitted from the smart contract event. */
  raw_data?: InputMaybe<Scalars['String']['input']>;
  /** Current status of metadata resolution (Pending, Resolved, Failed). */
  resolving_status?: InputMaybe<Scalars['atom_resolving_status']['input']>;
  /** Unique identifier linking to the term registry. */
  term_id?: InputMaybe<Scalars['String']['input']>;
  /** Transaction hash of the atom creation event. */
  transaction_hash?: InputMaybe<Scalars['String']['input']>;
  /** Classification of atom value type (Person, Organization, Thing, Caip10, etc.). */
  type?: InputMaybe<Scalars['atom_type']['input']>;
  /** Timestamp of last update, automatically maintained by trigger. */
  updated_at?: InputMaybe<Scalars['timestamptz']['input']>;
  /** Foreign key to polymorphic value table (person, organization, thing, etc.). */
  value_id?: InputMaybe<Scalars['String']['input']>;
  /** Dedicated vault address for this atom, holds staked assets. */
  wallet_id?: InputMaybe<Scalars['String']['input']>;
};

/** aggregate sum on columns */
export type Atoms_Sum_Fields = {
  __typename?: 'atoms_sum_fields';
  /** Block number when this atom was created. */
  block_number?: Maybe<Scalars['numeric']['output']>;
  /** Log index within the transaction for event ordering. */
  log_index?: Maybe<Scalars['bigint']['output']>;
};

/** order by sum() on columns of table "atom" */
export type Atoms_Sum_Order_By = {
  /** Block number when this atom was created. */
  block_number?: InputMaybe<Order_By>;
  /** Log index within the transaction for event ordering. */
  log_index?: InputMaybe<Order_By>;
};

/** aggregate var_pop on columns */
export type Atoms_Var_Pop_Fields = {
  __typename?: 'atoms_var_pop_fields';
  /** Block number when this atom was created. */
  block_number?: Maybe<Scalars['Float']['output']>;
  /** Log index within the transaction for event ordering. */
  log_index?: Maybe<Scalars['Float']['output']>;
};

/** order by var_pop() on columns of table "atom" */
export type Atoms_Var_Pop_Order_By = {
  /** Block number when this atom was created. */
  block_number?: InputMaybe<Order_By>;
  /** Log index within the transaction for event ordering. */
  log_index?: InputMaybe<Order_By>;
};

/** aggregate var_samp on columns */
export type Atoms_Var_Samp_Fields = {
  __typename?: 'atoms_var_samp_fields';
  /** Block number when this atom was created. */
  block_number?: Maybe<Scalars['Float']['output']>;
  /** Log index within the transaction for event ordering. */
  log_index?: Maybe<Scalars['Float']['output']>;
};

/** order by var_samp() on columns of table "atom" */
export type Atoms_Var_Samp_Order_By = {
  /** Block number when this atom was created. */
  block_number?: InputMaybe<Order_By>;
  /** Log index within the transaction for event ordering. */
  log_index?: InputMaybe<Order_By>;
};

/** aggregate variance on columns */
export type Atoms_Variance_Fields = {
  __typename?: 'atoms_variance_fields';
  /** Block number when this atom was created. */
  block_number?: Maybe<Scalars['Float']['output']>;
  /** Log index within the transaction for event ordering. */
  log_index?: Maybe<Scalars['Float']['output']>;
};

/** order by variance() on columns of table "atom" */
export type Atoms_Variance_Order_By = {
  /** Block number when this atom was created. */
  block_number?: InputMaybe<Order_By>;
  /** Log index within the transaction for event ordering. */
  log_index?: InputMaybe<Order_By>;
};

/** Boolean expression to compare columns of type "bigint". All fields are combined with logical 'AND'. */
export type Bigint_Comparison_Exp = {
  _eq?: InputMaybe<Scalars['bigint']['input']>;
  _gt?: InputMaybe<Scalars['bigint']['input']>;
  _gte?: InputMaybe<Scalars['bigint']['input']>;
  _in?: InputMaybe<Array<Scalars['bigint']['input']>>;
  _is_null?: InputMaybe<Scalars['Boolean']['input']>;
  _lt?: InputMaybe<Scalars['bigint']['input']>;
  _lte?: InputMaybe<Scalars['bigint']['input']>;
  _neq?: InputMaybe<Scalars['bigint']['input']>;
  _nin?: InputMaybe<Array<Scalars['bigint']['input']>>;
};

/** Book entities following schema.org Book specification for atom values. */
export type Books = {
  __typename?: 'books';
  /** An object relationship */
  atom?: Maybe<Atoms>;
  /** Description or synopsis of the book. */
  description?: Maybe<Scalars['String']['output']>;
  /** Genre or category of the book. */
  genre?: Maybe<Scalars['String']['output']>;
  /** Unique identifier for this book entity. */
  id: Scalars['String']['output'];
  /** Title of the book. */
  name?: Maybe<Scalars['String']['output']>;
  /** URL to book information or purchase page. */
  url?: Maybe<Scalars['String']['output']>;
};

/** aggregated selection of "book" */
export type Books_Aggregate = {
  __typename?: 'books_aggregate';
  aggregate?: Maybe<Books_Aggregate_Fields>;
  nodes: Array<Books>;
};

/** aggregate fields of "book" */
export type Books_Aggregate_Fields = {
  __typename?: 'books_aggregate_fields';
  count: Scalars['Int']['output'];
  max?: Maybe<Books_Max_Fields>;
  min?: Maybe<Books_Min_Fields>;
};


/** aggregate fields of "book" */
export type Books_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Books_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
};

/** Boolean expression to filter rows from the table "book". All fields are combined with a logical 'AND'. */
export type Books_Bool_Exp = {
  _and?: InputMaybe<Array<Books_Bool_Exp>>;
  _not?: InputMaybe<Books_Bool_Exp>;
  _or?: InputMaybe<Array<Books_Bool_Exp>>;
  atom?: InputMaybe<Atoms_Bool_Exp>;
  description?: InputMaybe<String_Comparison_Exp>;
  genre?: InputMaybe<String_Comparison_Exp>;
  id?: InputMaybe<String_Comparison_Exp>;
  name?: InputMaybe<String_Comparison_Exp>;
  url?: InputMaybe<String_Comparison_Exp>;
};

/** aggregate max on columns */
export type Books_Max_Fields = {
  __typename?: 'books_max_fields';
  /** Description or synopsis of the book. */
  description?: Maybe<Scalars['String']['output']>;
  /** Genre or category of the book. */
  genre?: Maybe<Scalars['String']['output']>;
  /** Unique identifier for this book entity. */
  id?: Maybe<Scalars['String']['output']>;
  /** Title of the book. */
  name?: Maybe<Scalars['String']['output']>;
  /** URL to book information or purchase page. */
  url?: Maybe<Scalars['String']['output']>;
};

/** aggregate min on columns */
export type Books_Min_Fields = {
  __typename?: 'books_min_fields';
  /** Description or synopsis of the book. */
  description?: Maybe<Scalars['String']['output']>;
  /** Genre or category of the book. */
  genre?: Maybe<Scalars['String']['output']>;
  /** Unique identifier for this book entity. */
  id?: Maybe<Scalars['String']['output']>;
  /** Title of the book. */
  name?: Maybe<Scalars['String']['output']>;
  /** URL to book information or purchase page. */
  url?: Maybe<Scalars['String']['output']>;
};

/** Ordering options when selecting data from "book". */
export type Books_Order_By = {
  atom?: InputMaybe<Atoms_Order_By>;
  description?: InputMaybe<Order_By>;
  genre?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  name?: InputMaybe<Order_By>;
  url?: InputMaybe<Order_By>;
};

/** select columns of table "book" */
export type Books_Select_Column =
  /** column name */
  | 'description'
  /** column name */
  | 'genre'
  /** column name */
  | 'id'
  /** column name */
  | 'name'
  /** column name */
  | 'url';

/** Streaming cursor of the table "books" */
export type Books_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Books_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Books_Stream_Cursor_Value_Input = {
  /** Description or synopsis of the book. */
  description?: InputMaybe<Scalars['String']['input']>;
  /** Genre or category of the book. */
  genre?: InputMaybe<Scalars['String']['input']>;
  /** Unique identifier for this book entity. */
  id?: InputMaybe<Scalars['String']['input']>;
  /** Title of the book. */
  name?: InputMaybe<Scalars['String']['input']>;
  /** URL to book information or purchase page. */
  url?: InputMaybe<Scalars['String']['input']>;
};

/** Binary data storage for atom values containing raw byte arrays. */
export type Byte_Object = {
  __typename?: 'byte_object';
  /** An object relationship */
  atom?: Maybe<Atoms>;
  /** Binary data stored as BYTEA. */
  data: Scalars['bytea']['output'];
  /** Unique identifier for this byte object. */
  id: Scalars['String']['output'];
};

/** aggregated selection of "byte_object" */
export type Byte_Object_Aggregate = {
  __typename?: 'byte_object_aggregate';
  aggregate?: Maybe<Byte_Object_Aggregate_Fields>;
  nodes: Array<Byte_Object>;
};

/** aggregate fields of "byte_object" */
export type Byte_Object_Aggregate_Fields = {
  __typename?: 'byte_object_aggregate_fields';
  count: Scalars['Int']['output'];
  max?: Maybe<Byte_Object_Max_Fields>;
  min?: Maybe<Byte_Object_Min_Fields>;
};


/** aggregate fields of "byte_object" */
export type Byte_Object_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Byte_Object_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
};

/** Boolean expression to filter rows from the table "byte_object". All fields are combined with a logical 'AND'. */
export type Byte_Object_Bool_Exp = {
  _and?: InputMaybe<Array<Byte_Object_Bool_Exp>>;
  _not?: InputMaybe<Byte_Object_Bool_Exp>;
  _or?: InputMaybe<Array<Byte_Object_Bool_Exp>>;
  atom?: InputMaybe<Atoms_Bool_Exp>;
  data?: InputMaybe<Bytea_Comparison_Exp>;
  id?: InputMaybe<String_Comparison_Exp>;
};

/** aggregate max on columns */
export type Byte_Object_Max_Fields = {
  __typename?: 'byte_object_max_fields';
  /** Unique identifier for this byte object. */
  id?: Maybe<Scalars['String']['output']>;
};

/** aggregate min on columns */
export type Byte_Object_Min_Fields = {
  __typename?: 'byte_object_min_fields';
  /** Unique identifier for this byte object. */
  id?: Maybe<Scalars['String']['output']>;
};

/** Ordering options when selecting data from "byte_object". */
export type Byte_Object_Order_By = {
  atom?: InputMaybe<Atoms_Order_By>;
  data?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
};

/** select columns of table "byte_object" */
export type Byte_Object_Select_Column =
  /** column name */
  | 'data'
  /** column name */
  | 'id';

/** Streaming cursor of the table "byte_object" */
export type Byte_Object_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Byte_Object_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Byte_Object_Stream_Cursor_Value_Input = {
  /** Binary data stored as BYTEA. */
  data?: InputMaybe<Scalars['bytea']['input']>;
  /** Unique identifier for this byte object. */
  id?: InputMaybe<Scalars['String']['input']>;
};

/** Boolean expression to compare columns of type "bytea". All fields are combined with logical 'AND'. */
export type Bytea_Comparison_Exp = {
  _eq?: InputMaybe<Scalars['bytea']['input']>;
  _gt?: InputMaybe<Scalars['bytea']['input']>;
  _gte?: InputMaybe<Scalars['bytea']['input']>;
  _in?: InputMaybe<Array<Scalars['bytea']['input']>>;
  _is_null?: InputMaybe<Scalars['Boolean']['input']>;
  _lt?: InputMaybe<Scalars['bytea']['input']>;
  _lte?: InputMaybe<Scalars['bytea']['input']>;
  _neq?: InputMaybe<Scalars['bytea']['input']>;
  _nin?: InputMaybe<Array<Scalars['bytea']['input']>>;
};

/** columns and relationships of "cached_images.cached_image" */
export type Cached_Images_Cached_Image = {
  __typename?: 'cached_images_cached_image';
  created_at: Scalars['timestamptz']['output'];
  model?: Maybe<Scalars['String']['output']>;
  original_url: Scalars['String']['output'];
  safe: Scalars['Boolean']['output'];
  score?: Maybe<Scalars['jsonb']['output']>;
  url: Scalars['String']['output'];
};


/** columns and relationships of "cached_images.cached_image" */
export type Cached_Images_Cached_ImageScoreArgs = {
  path?: InputMaybe<Scalars['String']['input']>;
};

/** Boolean expression to filter rows from the table "cached_images.cached_image". All fields are combined with a logical 'AND'. */
export type Cached_Images_Cached_Image_Bool_Exp = {
  _and?: InputMaybe<Array<Cached_Images_Cached_Image_Bool_Exp>>;
  _not?: InputMaybe<Cached_Images_Cached_Image_Bool_Exp>;
  _or?: InputMaybe<Array<Cached_Images_Cached_Image_Bool_Exp>>;
  created_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  model?: InputMaybe<String_Comparison_Exp>;
  original_url?: InputMaybe<String_Comparison_Exp>;
  safe?: InputMaybe<Boolean_Comparison_Exp>;
  score?: InputMaybe<Jsonb_Comparison_Exp>;
  url?: InputMaybe<String_Comparison_Exp>;
};

/** Ordering options when selecting data from "cached_images.cached_image". */
export type Cached_Images_Cached_Image_Order_By = {
  created_at?: InputMaybe<Order_By>;
  model?: InputMaybe<Order_By>;
  original_url?: InputMaybe<Order_By>;
  safe?: InputMaybe<Order_By>;
  score?: InputMaybe<Order_By>;
  url?: InputMaybe<Order_By>;
};

/** select columns of table "cached_images.cached_image" */
export type Cached_Images_Cached_Image_Select_Column =
  /** column name */
  | 'created_at'
  /** column name */
  | 'model'
  /** column name */
  | 'original_url'
  /** column name */
  | 'safe'
  /** column name */
  | 'score'
  /** column name */
  | 'url';

/** Streaming cursor of the table "cached_images_cached_image" */
export type Cached_Images_Cached_Image_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Cached_Images_Cached_Image_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Cached_Images_Cached_Image_Stream_Cursor_Value_Input = {
  created_at?: InputMaybe<Scalars['timestamptz']['input']>;
  model?: InputMaybe<Scalars['String']['input']>;
  original_url?: InputMaybe<Scalars['String']['input']>;
  safe?: InputMaybe<Scalars['Boolean']['input']>;
  score?: InputMaybe<Scalars['jsonb']['input']>;
  url?: InputMaybe<Scalars['String']['input']>;
};

/** Blockchain account identifiers following CAIP-10 standard (namespace:chain_id:address). */
export type Caip10 = {
  __typename?: 'caip10';
  /** Account address on the specified blockchain. */
  account_address: Scalars['String']['output'];
  /** An object relationship */
  atom?: Maybe<Atoms>;
  /** Chain ID within the namespace (e.g., 1 for Ethereum mainnet). */
  chain_id: Scalars['Int']['output'];
  /** Unique identifier for this CAIP-10 account reference. */
  id: Scalars['String']['output'];
  /** Blockchain namespace (e.g., "eip155" for Ethereum). */
  namespace: Scalars['String']['output'];
};

/** aggregated selection of "caip10" */
export type Caip10_Aggregate = {
  __typename?: 'caip10_aggregate';
  aggregate?: Maybe<Caip10_Aggregate_Fields>;
  nodes: Array<Caip10>;
};

/** aggregate fields of "caip10" */
export type Caip10_Aggregate_Fields = {
  __typename?: 'caip10_aggregate_fields';
  avg?: Maybe<Caip10_Avg_Fields>;
  count: Scalars['Int']['output'];
  max?: Maybe<Caip10_Max_Fields>;
  min?: Maybe<Caip10_Min_Fields>;
  stddev?: Maybe<Caip10_Stddev_Fields>;
  stddev_pop?: Maybe<Caip10_Stddev_Pop_Fields>;
  stddev_samp?: Maybe<Caip10_Stddev_Samp_Fields>;
  sum?: Maybe<Caip10_Sum_Fields>;
  var_pop?: Maybe<Caip10_Var_Pop_Fields>;
  var_samp?: Maybe<Caip10_Var_Samp_Fields>;
  variance?: Maybe<Caip10_Variance_Fields>;
};


/** aggregate fields of "caip10" */
export type Caip10_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Caip10_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
};

/** aggregate avg on columns */
export type Caip10_Avg_Fields = {
  __typename?: 'caip10_avg_fields';
  /** Chain ID within the namespace (e.g., 1 for Ethereum mainnet). */
  chain_id?: Maybe<Scalars['Float']['output']>;
};

/** Boolean expression to filter rows from the table "caip10". All fields are combined with a logical 'AND'. */
export type Caip10_Bool_Exp = {
  _and?: InputMaybe<Array<Caip10_Bool_Exp>>;
  _not?: InputMaybe<Caip10_Bool_Exp>;
  _or?: InputMaybe<Array<Caip10_Bool_Exp>>;
  account_address?: InputMaybe<String_Comparison_Exp>;
  atom?: InputMaybe<Atoms_Bool_Exp>;
  chain_id?: InputMaybe<Int_Comparison_Exp>;
  id?: InputMaybe<String_Comparison_Exp>;
  namespace?: InputMaybe<String_Comparison_Exp>;
};

/** aggregate max on columns */
export type Caip10_Max_Fields = {
  __typename?: 'caip10_max_fields';
  /** Account address on the specified blockchain. */
  account_address?: Maybe<Scalars['String']['output']>;
  /** Chain ID within the namespace (e.g., 1 for Ethereum mainnet). */
  chain_id?: Maybe<Scalars['Int']['output']>;
  /** Unique identifier for this CAIP-10 account reference. */
  id?: Maybe<Scalars['String']['output']>;
  /** Blockchain namespace (e.g., "eip155" for Ethereum). */
  namespace?: Maybe<Scalars['String']['output']>;
};

/** aggregate min on columns */
export type Caip10_Min_Fields = {
  __typename?: 'caip10_min_fields';
  /** Account address on the specified blockchain. */
  account_address?: Maybe<Scalars['String']['output']>;
  /** Chain ID within the namespace (e.g., 1 for Ethereum mainnet). */
  chain_id?: Maybe<Scalars['Int']['output']>;
  /** Unique identifier for this CAIP-10 account reference. */
  id?: Maybe<Scalars['String']['output']>;
  /** Blockchain namespace (e.g., "eip155" for Ethereum). */
  namespace?: Maybe<Scalars['String']['output']>;
};

/** Ordering options when selecting data from "caip10". */
export type Caip10_Order_By = {
  account_address?: InputMaybe<Order_By>;
  atom?: InputMaybe<Atoms_Order_By>;
  chain_id?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  namespace?: InputMaybe<Order_By>;
};

/** select columns of table "caip10" */
export type Caip10_Select_Column =
  /** column name */
  | 'account_address'
  /** column name */
  | 'chain_id'
  /** column name */
  | 'id'
  /** column name */
  | 'namespace';

/** aggregate stddev on columns */
export type Caip10_Stddev_Fields = {
  __typename?: 'caip10_stddev_fields';
  /** Chain ID within the namespace (e.g., 1 for Ethereum mainnet). */
  chain_id?: Maybe<Scalars['Float']['output']>;
};

/** aggregate stddev_pop on columns */
export type Caip10_Stddev_Pop_Fields = {
  __typename?: 'caip10_stddev_pop_fields';
  /** Chain ID within the namespace (e.g., 1 for Ethereum mainnet). */
  chain_id?: Maybe<Scalars['Float']['output']>;
};

/** aggregate stddev_samp on columns */
export type Caip10_Stddev_Samp_Fields = {
  __typename?: 'caip10_stddev_samp_fields';
  /** Chain ID within the namespace (e.g., 1 for Ethereum mainnet). */
  chain_id?: Maybe<Scalars['Float']['output']>;
};

/** Streaming cursor of the table "caip10" */
export type Caip10_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Caip10_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Caip10_Stream_Cursor_Value_Input = {
  /** Account address on the specified blockchain. */
  account_address?: InputMaybe<Scalars['String']['input']>;
  /** Chain ID within the namespace (e.g., 1 for Ethereum mainnet). */
  chain_id?: InputMaybe<Scalars['Int']['input']>;
  /** Unique identifier for this CAIP-10 account reference. */
  id?: InputMaybe<Scalars['String']['input']>;
  /** Blockchain namespace (e.g., "eip155" for Ethereum). */
  namespace?: InputMaybe<Scalars['String']['input']>;
};

/** aggregate sum on columns */
export type Caip10_Sum_Fields = {
  __typename?: 'caip10_sum_fields';
  /** Chain ID within the namespace (e.g., 1 for Ethereum mainnet). */
  chain_id?: Maybe<Scalars['Int']['output']>;
};

/** aggregate var_pop on columns */
export type Caip10_Var_Pop_Fields = {
  __typename?: 'caip10_var_pop_fields';
  /** Chain ID within the namespace (e.g., 1 for Ethereum mainnet). */
  chain_id?: Maybe<Scalars['Float']['output']>;
};

/** aggregate var_samp on columns */
export type Caip10_Var_Samp_Fields = {
  __typename?: 'caip10_var_samp_fields';
  /** Chain ID within the namespace (e.g., 1 for Ethereum mainnet). */
  chain_id?: Maybe<Scalars['Float']['output']>;
};

/** aggregate variance on columns */
export type Caip10_Variance_Fields = {
  __typename?: 'caip10_variance_fields';
  /** Chain ID within the namespace (e.g., 1 for Ethereum mainnet). */
  chain_id?: Maybe<Scalars['Float']['output']>;
};

/** Chainlink oracle price feed data for USD-denominated asset pricing. */
export type Chainlink_Prices = {
  __typename?: 'chainlink_prices';
  /** Block number or timestamp identifier for the price data point. */
  id: Scalars['numeric']['output'];
  /** USD price value from Chainlink oracle feed. */
  usd?: Maybe<Scalars['float8']['output']>;
};

/** Boolean expression to filter rows from the table "chainlink_price". All fields are combined with a logical 'AND'. */
export type Chainlink_Prices_Bool_Exp = {
  _and?: InputMaybe<Array<Chainlink_Prices_Bool_Exp>>;
  _not?: InputMaybe<Chainlink_Prices_Bool_Exp>;
  _or?: InputMaybe<Array<Chainlink_Prices_Bool_Exp>>;
  id?: InputMaybe<Numeric_Comparison_Exp>;
  usd?: InputMaybe<Float8_Comparison_Exp>;
};

/** Ordering options when selecting data from "chainlink_price". */
export type Chainlink_Prices_Order_By = {
  id?: InputMaybe<Order_By>;
  usd?: InputMaybe<Order_By>;
};

/** select columns of table "chainlink_price" */
export type Chainlink_Prices_Select_Column =
  /** column name */
  | 'id'
  /** column name */
  | 'usd';

/** Streaming cursor of the table "chainlink_prices" */
export type Chainlink_Prices_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Chainlink_Prices_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Chainlink_Prices_Stream_Cursor_Value_Input = {
  /** Block number or timestamp identifier for the price data point. */
  id?: InputMaybe<Scalars['numeric']['input']>;
  /** USD price value from Chainlink oracle feed. */
  usd?: InputMaybe<Scalars['float8']['input']>;
};

/** ordering argument of a cursor */
export type Cursor_Ordering =
  /** ascending ordering of the cursor */
  | 'ASC'
  /** descending ordering of the cursor */
  | 'DESC';

/** Deposit transactions where users stake assets into vaults and receive shares in return. */
export type Deposits = {
  __typename?: 'deposits';
  /** Asset amount deposited after protocol fees, in wei. */
  assets_after_fees: Scalars['numeric']['output'];
  /** Block number when deposit occurred. */
  block_number: Scalars['numeric']['output'];
  /** Timestamp when deposit occurred. */
  created_at: Scalars['timestamptz']['output'];
  /** Bonding curve ID of the vault. */
  curve_id: Scalars['numeric']['output'];
  /** Unique identifier for this deposit event. */
  id: Scalars['String']['output'];
  /** Log index within the transaction for event ordering. */
  log_index: Scalars['bigint']['output'];
  /** An object relationship */
  receiver?: Maybe<Accounts>;
  /** Account that received the shares. */
  receiver_id: Scalars['String']['output'];
  /** An object relationship */
  sender?: Maybe<Accounts>;
  /** Account that initiated the deposit. */
  sender_id: Scalars['String']['output'];
  /** Number of shares minted for this deposit. */
  shares: Scalars['numeric']['output'];
  /** An object relationship */
  term?: Maybe<Terms>;
  /** Term ID of the vault receiving the deposit. */
  term_id: Scalars['String']['output'];
  /** Total shares in vault after this deposit. */
  total_shares: Scalars['numeric']['output'];
  /** Transaction hash of the deposit event. */
  transaction_hash: Scalars['String']['output'];
  /** An object relationship */
  vault?: Maybe<Vaults>;
  /** Type of vault (Atom, Triple, CounterTriple). */
  vault_type: Scalars['vault_type']['output'];
};

/** aggregated selection of "deposit" */
export type Deposits_Aggregate = {
  __typename?: 'deposits_aggregate';
  aggregate?: Maybe<Deposits_Aggregate_Fields>;
  nodes: Array<Deposits>;
};

export type Deposits_Aggregate_Bool_Exp = {
  count?: InputMaybe<Deposits_Aggregate_Bool_Exp_Count>;
};

export type Deposits_Aggregate_Bool_Exp_Count = {
  arguments?: InputMaybe<Array<Deposits_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
  filter?: InputMaybe<Deposits_Bool_Exp>;
  predicate: Int_Comparison_Exp;
};

/** aggregate fields of "deposit" */
export type Deposits_Aggregate_Fields = {
  __typename?: 'deposits_aggregate_fields';
  avg?: Maybe<Deposits_Avg_Fields>;
  count: Scalars['Int']['output'];
  max?: Maybe<Deposits_Max_Fields>;
  min?: Maybe<Deposits_Min_Fields>;
  stddev?: Maybe<Deposits_Stddev_Fields>;
  stddev_pop?: Maybe<Deposits_Stddev_Pop_Fields>;
  stddev_samp?: Maybe<Deposits_Stddev_Samp_Fields>;
  sum?: Maybe<Deposits_Sum_Fields>;
  var_pop?: Maybe<Deposits_Var_Pop_Fields>;
  var_samp?: Maybe<Deposits_Var_Samp_Fields>;
  variance?: Maybe<Deposits_Variance_Fields>;
};


/** aggregate fields of "deposit" */
export type Deposits_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Deposits_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
};

/** order by aggregate values of table "deposit" */
export type Deposits_Aggregate_Order_By = {
  avg?: InputMaybe<Deposits_Avg_Order_By>;
  count?: InputMaybe<Order_By>;
  max?: InputMaybe<Deposits_Max_Order_By>;
  min?: InputMaybe<Deposits_Min_Order_By>;
  stddev?: InputMaybe<Deposits_Stddev_Order_By>;
  stddev_pop?: InputMaybe<Deposits_Stddev_Pop_Order_By>;
  stddev_samp?: InputMaybe<Deposits_Stddev_Samp_Order_By>;
  sum?: InputMaybe<Deposits_Sum_Order_By>;
  var_pop?: InputMaybe<Deposits_Var_Pop_Order_By>;
  var_samp?: InputMaybe<Deposits_Var_Samp_Order_By>;
  variance?: InputMaybe<Deposits_Variance_Order_By>;
};

/** aggregate avg on columns */
export type Deposits_Avg_Fields = {
  __typename?: 'deposits_avg_fields';
  /** Asset amount deposited after protocol fees, in wei. */
  assets_after_fees?: Maybe<Scalars['Float']['output']>;
  /** Block number when deposit occurred. */
  block_number?: Maybe<Scalars['Float']['output']>;
  /** Bonding curve ID of the vault. */
  curve_id?: Maybe<Scalars['Float']['output']>;
  /** Log index within the transaction for event ordering. */
  log_index?: Maybe<Scalars['Float']['output']>;
  /** Number of shares minted for this deposit. */
  shares?: Maybe<Scalars['Float']['output']>;
  /** Total shares in vault after this deposit. */
  total_shares?: Maybe<Scalars['Float']['output']>;
};

/** order by avg() on columns of table "deposit" */
export type Deposits_Avg_Order_By = {
  /** Asset amount deposited after protocol fees, in wei. */
  assets_after_fees?: InputMaybe<Order_By>;
  /** Block number when deposit occurred. */
  block_number?: InputMaybe<Order_By>;
  /** Bonding curve ID of the vault. */
  curve_id?: InputMaybe<Order_By>;
  /** Log index within the transaction for event ordering. */
  log_index?: InputMaybe<Order_By>;
  /** Number of shares minted for this deposit. */
  shares?: InputMaybe<Order_By>;
  /** Total shares in vault after this deposit. */
  total_shares?: InputMaybe<Order_By>;
};

/** Boolean expression to filter rows from the table "deposit". All fields are combined with a logical 'AND'. */
export type Deposits_Bool_Exp = {
  _and?: InputMaybe<Array<Deposits_Bool_Exp>>;
  _not?: InputMaybe<Deposits_Bool_Exp>;
  _or?: InputMaybe<Array<Deposits_Bool_Exp>>;
  assets_after_fees?: InputMaybe<Numeric_Comparison_Exp>;
  block_number?: InputMaybe<Numeric_Comparison_Exp>;
  created_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  curve_id?: InputMaybe<Numeric_Comparison_Exp>;
  id?: InputMaybe<String_Comparison_Exp>;
  log_index?: InputMaybe<Bigint_Comparison_Exp>;
  receiver?: InputMaybe<Accounts_Bool_Exp>;
  receiver_id?: InputMaybe<String_Comparison_Exp>;
  sender?: InputMaybe<Accounts_Bool_Exp>;
  sender_id?: InputMaybe<String_Comparison_Exp>;
  shares?: InputMaybe<Numeric_Comparison_Exp>;
  term?: InputMaybe<Terms_Bool_Exp>;
  term_id?: InputMaybe<String_Comparison_Exp>;
  total_shares?: InputMaybe<Numeric_Comparison_Exp>;
  transaction_hash?: InputMaybe<String_Comparison_Exp>;
  vault?: InputMaybe<Vaults_Bool_Exp>;
  vault_type?: InputMaybe<Vault_Type_Comparison_Exp>;
};

/** aggregate max on columns */
export type Deposits_Max_Fields = {
  __typename?: 'deposits_max_fields';
  /** Asset amount deposited after protocol fees, in wei. */
  assets_after_fees?: Maybe<Scalars['numeric']['output']>;
  /** Block number when deposit occurred. */
  block_number?: Maybe<Scalars['numeric']['output']>;
  /** Timestamp when deposit occurred. */
  created_at?: Maybe<Scalars['timestamptz']['output']>;
  /** Bonding curve ID of the vault. */
  curve_id?: Maybe<Scalars['numeric']['output']>;
  /** Unique identifier for this deposit event. */
  id?: Maybe<Scalars['String']['output']>;
  /** Log index within the transaction for event ordering. */
  log_index?: Maybe<Scalars['bigint']['output']>;
  /** Account that received the shares. */
  receiver_id?: Maybe<Scalars['String']['output']>;
  /** Account that initiated the deposit. */
  sender_id?: Maybe<Scalars['String']['output']>;
  /** Number of shares minted for this deposit. */
  shares?: Maybe<Scalars['numeric']['output']>;
  /** Term ID of the vault receiving the deposit. */
  term_id?: Maybe<Scalars['String']['output']>;
  /** Total shares in vault after this deposit. */
  total_shares?: Maybe<Scalars['numeric']['output']>;
  /** Transaction hash of the deposit event. */
  transaction_hash?: Maybe<Scalars['String']['output']>;
  /** Type of vault (Atom, Triple, CounterTriple). */
  vault_type?: Maybe<Scalars['vault_type']['output']>;
};

/** order by max() on columns of table "deposit" */
export type Deposits_Max_Order_By = {
  /** Asset amount deposited after protocol fees, in wei. */
  assets_after_fees?: InputMaybe<Order_By>;
  /** Block number when deposit occurred. */
  block_number?: InputMaybe<Order_By>;
  /** Timestamp when deposit occurred. */
  created_at?: InputMaybe<Order_By>;
  /** Bonding curve ID of the vault. */
  curve_id?: InputMaybe<Order_By>;
  /** Unique identifier for this deposit event. */
  id?: InputMaybe<Order_By>;
  /** Log index within the transaction for event ordering. */
  log_index?: InputMaybe<Order_By>;
  /** Account that received the shares. */
  receiver_id?: InputMaybe<Order_By>;
  /** Account that initiated the deposit. */
  sender_id?: InputMaybe<Order_By>;
  /** Number of shares minted for this deposit. */
  shares?: InputMaybe<Order_By>;
  /** Term ID of the vault receiving the deposit. */
  term_id?: InputMaybe<Order_By>;
  /** Total shares in vault after this deposit. */
  total_shares?: InputMaybe<Order_By>;
  /** Transaction hash of the deposit event. */
  transaction_hash?: InputMaybe<Order_By>;
  /** Type of vault (Atom, Triple, CounterTriple). */
  vault_type?: InputMaybe<Order_By>;
};

/** aggregate min on columns */
export type Deposits_Min_Fields = {
  __typename?: 'deposits_min_fields';
  /** Asset amount deposited after protocol fees, in wei. */
  assets_after_fees?: Maybe<Scalars['numeric']['output']>;
  /** Block number when deposit occurred. */
  block_number?: Maybe<Scalars['numeric']['output']>;
  /** Timestamp when deposit occurred. */
  created_at?: Maybe<Scalars['timestamptz']['output']>;
  /** Bonding curve ID of the vault. */
  curve_id?: Maybe<Scalars['numeric']['output']>;
  /** Unique identifier for this deposit event. */
  id?: Maybe<Scalars['String']['output']>;
  /** Log index within the transaction for event ordering. */
  log_index?: Maybe<Scalars['bigint']['output']>;
  /** Account that received the shares. */
  receiver_id?: Maybe<Scalars['String']['output']>;
  /** Account that initiated the deposit. */
  sender_id?: Maybe<Scalars['String']['output']>;
  /** Number of shares minted for this deposit. */
  shares?: Maybe<Scalars['numeric']['output']>;
  /** Term ID of the vault receiving the deposit. */
  term_id?: Maybe<Scalars['String']['output']>;
  /** Total shares in vault after this deposit. */
  total_shares?: Maybe<Scalars['numeric']['output']>;
  /** Transaction hash of the deposit event. */
  transaction_hash?: Maybe<Scalars['String']['output']>;
  /** Type of vault (Atom, Triple, CounterTriple). */
  vault_type?: Maybe<Scalars['vault_type']['output']>;
};

/** order by min() on columns of table "deposit" */
export type Deposits_Min_Order_By = {
  /** Asset amount deposited after protocol fees, in wei. */
  assets_after_fees?: InputMaybe<Order_By>;
  /** Block number when deposit occurred. */
  block_number?: InputMaybe<Order_By>;
  /** Timestamp when deposit occurred. */
  created_at?: InputMaybe<Order_By>;
  /** Bonding curve ID of the vault. */
  curve_id?: InputMaybe<Order_By>;
  /** Unique identifier for this deposit event. */
  id?: InputMaybe<Order_By>;
  /** Log index within the transaction for event ordering. */
  log_index?: InputMaybe<Order_By>;
  /** Account that received the shares. */
  receiver_id?: InputMaybe<Order_By>;
  /** Account that initiated the deposit. */
  sender_id?: InputMaybe<Order_By>;
  /** Number of shares minted for this deposit. */
  shares?: InputMaybe<Order_By>;
  /** Term ID of the vault receiving the deposit. */
  term_id?: InputMaybe<Order_By>;
  /** Total shares in vault after this deposit. */
  total_shares?: InputMaybe<Order_By>;
  /** Transaction hash of the deposit event. */
  transaction_hash?: InputMaybe<Order_By>;
  /** Type of vault (Atom, Triple, CounterTriple). */
  vault_type?: InputMaybe<Order_By>;
};

/** Ordering options when selecting data from "deposit". */
export type Deposits_Order_By = {
  assets_after_fees?: InputMaybe<Order_By>;
  block_number?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  curve_id?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  log_index?: InputMaybe<Order_By>;
  receiver?: InputMaybe<Accounts_Order_By>;
  receiver_id?: InputMaybe<Order_By>;
  sender?: InputMaybe<Accounts_Order_By>;
  sender_id?: InputMaybe<Order_By>;
  shares?: InputMaybe<Order_By>;
  term?: InputMaybe<Terms_Order_By>;
  term_id?: InputMaybe<Order_By>;
  total_shares?: InputMaybe<Order_By>;
  transaction_hash?: InputMaybe<Order_By>;
  vault?: InputMaybe<Vaults_Order_By>;
  vault_type?: InputMaybe<Order_By>;
};

/** select columns of table "deposit" */
export type Deposits_Select_Column =
  /** column name */
  | 'assets_after_fees'
  /** column name */
  | 'block_number'
  /** column name */
  | 'created_at'
  /** column name */
  | 'curve_id'
  /** column name */
  | 'id'
  /** column name */
  | 'log_index'
  /** column name */
  | 'receiver_id'
  /** column name */
  | 'sender_id'
  /** column name */
  | 'shares'
  /** column name */
  | 'term_id'
  /** column name */
  | 'total_shares'
  /** column name */
  | 'transaction_hash'
  /** column name */
  | 'vault_type';

/** aggregate stddev on columns */
export type Deposits_Stddev_Fields = {
  __typename?: 'deposits_stddev_fields';
  /** Asset amount deposited after protocol fees, in wei. */
  assets_after_fees?: Maybe<Scalars['Float']['output']>;
  /** Block number when deposit occurred. */
  block_number?: Maybe<Scalars['Float']['output']>;
  /** Bonding curve ID of the vault. */
  curve_id?: Maybe<Scalars['Float']['output']>;
  /** Log index within the transaction for event ordering. */
  log_index?: Maybe<Scalars['Float']['output']>;
  /** Number of shares minted for this deposit. */
  shares?: Maybe<Scalars['Float']['output']>;
  /** Total shares in vault after this deposit. */
  total_shares?: Maybe<Scalars['Float']['output']>;
};

/** order by stddev() on columns of table "deposit" */
export type Deposits_Stddev_Order_By = {
  /** Asset amount deposited after protocol fees, in wei. */
  assets_after_fees?: InputMaybe<Order_By>;
  /** Block number when deposit occurred. */
  block_number?: InputMaybe<Order_By>;
  /** Bonding curve ID of the vault. */
  curve_id?: InputMaybe<Order_By>;
  /** Log index within the transaction for event ordering. */
  log_index?: InputMaybe<Order_By>;
  /** Number of shares minted for this deposit. */
  shares?: InputMaybe<Order_By>;
  /** Total shares in vault after this deposit. */
  total_shares?: InputMaybe<Order_By>;
};

/** aggregate stddev_pop on columns */
export type Deposits_Stddev_Pop_Fields = {
  __typename?: 'deposits_stddev_pop_fields';
  /** Asset amount deposited after protocol fees, in wei. */
  assets_after_fees?: Maybe<Scalars['Float']['output']>;
  /** Block number when deposit occurred. */
  block_number?: Maybe<Scalars['Float']['output']>;
  /** Bonding curve ID of the vault. */
  curve_id?: Maybe<Scalars['Float']['output']>;
  /** Log index within the transaction for event ordering. */
  log_index?: Maybe<Scalars['Float']['output']>;
  /** Number of shares minted for this deposit. */
  shares?: Maybe<Scalars['Float']['output']>;
  /** Total shares in vault after this deposit. */
  total_shares?: Maybe<Scalars['Float']['output']>;
};

/** order by stddev_pop() on columns of table "deposit" */
export type Deposits_Stddev_Pop_Order_By = {
  /** Asset amount deposited after protocol fees, in wei. */
  assets_after_fees?: InputMaybe<Order_By>;
  /** Block number when deposit occurred. */
  block_number?: InputMaybe<Order_By>;
  /** Bonding curve ID of the vault. */
  curve_id?: InputMaybe<Order_By>;
  /** Log index within the transaction for event ordering. */
  log_index?: InputMaybe<Order_By>;
  /** Number of shares minted for this deposit. */
  shares?: InputMaybe<Order_By>;
  /** Total shares in vault after this deposit. */
  total_shares?: InputMaybe<Order_By>;
};

/** aggregate stddev_samp on columns */
export type Deposits_Stddev_Samp_Fields = {
  __typename?: 'deposits_stddev_samp_fields';
  /** Asset amount deposited after protocol fees, in wei. */
  assets_after_fees?: Maybe<Scalars['Float']['output']>;
  /** Block number when deposit occurred. */
  block_number?: Maybe<Scalars['Float']['output']>;
  /** Bonding curve ID of the vault. */
  curve_id?: Maybe<Scalars['Float']['output']>;
  /** Log index within the transaction for event ordering. */
  log_index?: Maybe<Scalars['Float']['output']>;
  /** Number of shares minted for this deposit. */
  shares?: Maybe<Scalars['Float']['output']>;
  /** Total shares in vault after this deposit. */
  total_shares?: Maybe<Scalars['Float']['output']>;
};

/** order by stddev_samp() on columns of table "deposit" */
export type Deposits_Stddev_Samp_Order_By = {
  /** Asset amount deposited after protocol fees, in wei. */
  assets_after_fees?: InputMaybe<Order_By>;
  /** Block number when deposit occurred. */
  block_number?: InputMaybe<Order_By>;
  /** Bonding curve ID of the vault. */
  curve_id?: InputMaybe<Order_By>;
  /** Log index within the transaction for event ordering. */
  log_index?: InputMaybe<Order_By>;
  /** Number of shares minted for this deposit. */
  shares?: InputMaybe<Order_By>;
  /** Total shares in vault after this deposit. */
  total_shares?: InputMaybe<Order_By>;
};

/** Streaming cursor of the table "deposits" */
export type Deposits_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Deposits_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Deposits_Stream_Cursor_Value_Input = {
  /** Asset amount deposited after protocol fees, in wei. */
  assets_after_fees?: InputMaybe<Scalars['numeric']['input']>;
  /** Block number when deposit occurred. */
  block_number?: InputMaybe<Scalars['numeric']['input']>;
  /** Timestamp when deposit occurred. */
  created_at?: InputMaybe<Scalars['timestamptz']['input']>;
  /** Bonding curve ID of the vault. */
  curve_id?: InputMaybe<Scalars['numeric']['input']>;
  /** Unique identifier for this deposit event. */
  id?: InputMaybe<Scalars['String']['input']>;
  /** Log index within the transaction for event ordering. */
  log_index?: InputMaybe<Scalars['bigint']['input']>;
  /** Account that received the shares. */
  receiver_id?: InputMaybe<Scalars['String']['input']>;
  /** Account that initiated the deposit. */
  sender_id?: InputMaybe<Scalars['String']['input']>;
  /** Number of shares minted for this deposit. */
  shares?: InputMaybe<Scalars['numeric']['input']>;
  /** Term ID of the vault receiving the deposit. */
  term_id?: InputMaybe<Scalars['String']['input']>;
  /** Total shares in vault after this deposit. */
  total_shares?: InputMaybe<Scalars['numeric']['input']>;
  /** Transaction hash of the deposit event. */
  transaction_hash?: InputMaybe<Scalars['String']['input']>;
  /** Type of vault (Atom, Triple, CounterTriple). */
  vault_type?: InputMaybe<Scalars['vault_type']['input']>;
};

/** aggregate sum on columns */
export type Deposits_Sum_Fields = {
  __typename?: 'deposits_sum_fields';
  /** Asset amount deposited after protocol fees, in wei. */
  assets_after_fees?: Maybe<Scalars['numeric']['output']>;
  /** Block number when deposit occurred. */
  block_number?: Maybe<Scalars['numeric']['output']>;
  /** Bonding curve ID of the vault. */
  curve_id?: Maybe<Scalars['numeric']['output']>;
  /** Log index within the transaction for event ordering. */
  log_index?: Maybe<Scalars['bigint']['output']>;
  /** Number of shares minted for this deposit. */
  shares?: Maybe<Scalars['numeric']['output']>;
  /** Total shares in vault after this deposit. */
  total_shares?: Maybe<Scalars['numeric']['output']>;
};

/** order by sum() on columns of table "deposit" */
export type Deposits_Sum_Order_By = {
  /** Asset amount deposited after protocol fees, in wei. */
  assets_after_fees?: InputMaybe<Order_By>;
  /** Block number when deposit occurred. */
  block_number?: InputMaybe<Order_By>;
  /** Bonding curve ID of the vault. */
  curve_id?: InputMaybe<Order_By>;
  /** Log index within the transaction for event ordering. */
  log_index?: InputMaybe<Order_By>;
  /** Number of shares minted for this deposit. */
  shares?: InputMaybe<Order_By>;
  /** Total shares in vault after this deposit. */
  total_shares?: InputMaybe<Order_By>;
};

/** aggregate var_pop on columns */
export type Deposits_Var_Pop_Fields = {
  __typename?: 'deposits_var_pop_fields';
  /** Asset amount deposited after protocol fees, in wei. */
  assets_after_fees?: Maybe<Scalars['Float']['output']>;
  /** Block number when deposit occurred. */
  block_number?: Maybe<Scalars['Float']['output']>;
  /** Bonding curve ID of the vault. */
  curve_id?: Maybe<Scalars['Float']['output']>;
  /** Log index within the transaction for event ordering. */
  log_index?: Maybe<Scalars['Float']['output']>;
  /** Number of shares minted for this deposit. */
  shares?: Maybe<Scalars['Float']['output']>;
  /** Total shares in vault after this deposit. */
  total_shares?: Maybe<Scalars['Float']['output']>;
};

/** order by var_pop() on columns of table "deposit" */
export type Deposits_Var_Pop_Order_By = {
  /** Asset amount deposited after protocol fees, in wei. */
  assets_after_fees?: InputMaybe<Order_By>;
  /** Block number when deposit occurred. */
  block_number?: InputMaybe<Order_By>;
  /** Bonding curve ID of the vault. */
  curve_id?: InputMaybe<Order_By>;
  /** Log index within the transaction for event ordering. */
  log_index?: InputMaybe<Order_By>;
  /** Number of shares minted for this deposit. */
  shares?: InputMaybe<Order_By>;
  /** Total shares in vault after this deposit. */
  total_shares?: InputMaybe<Order_By>;
};

/** aggregate var_samp on columns */
export type Deposits_Var_Samp_Fields = {
  __typename?: 'deposits_var_samp_fields';
  /** Asset amount deposited after protocol fees, in wei. */
  assets_after_fees?: Maybe<Scalars['Float']['output']>;
  /** Block number when deposit occurred. */
  block_number?: Maybe<Scalars['Float']['output']>;
  /** Bonding curve ID of the vault. */
  curve_id?: Maybe<Scalars['Float']['output']>;
  /** Log index within the transaction for event ordering. */
  log_index?: Maybe<Scalars['Float']['output']>;
  /** Number of shares minted for this deposit. */
  shares?: Maybe<Scalars['Float']['output']>;
  /** Total shares in vault after this deposit. */
  total_shares?: Maybe<Scalars['Float']['output']>;
};

/** order by var_samp() on columns of table "deposit" */
export type Deposits_Var_Samp_Order_By = {
  /** Asset amount deposited after protocol fees, in wei. */
  assets_after_fees?: InputMaybe<Order_By>;
  /** Block number when deposit occurred. */
  block_number?: InputMaybe<Order_By>;
  /** Bonding curve ID of the vault. */
  curve_id?: InputMaybe<Order_By>;
  /** Log index within the transaction for event ordering. */
  log_index?: InputMaybe<Order_By>;
  /** Number of shares minted for this deposit. */
  shares?: InputMaybe<Order_By>;
  /** Total shares in vault after this deposit. */
  total_shares?: InputMaybe<Order_By>;
};

/** aggregate variance on columns */
export type Deposits_Variance_Fields = {
  __typename?: 'deposits_variance_fields';
  /** Asset amount deposited after protocol fees, in wei. */
  assets_after_fees?: Maybe<Scalars['Float']['output']>;
  /** Block number when deposit occurred. */
  block_number?: Maybe<Scalars['Float']['output']>;
  /** Bonding curve ID of the vault. */
  curve_id?: Maybe<Scalars['Float']['output']>;
  /** Log index within the transaction for event ordering. */
  log_index?: Maybe<Scalars['Float']['output']>;
  /** Number of shares minted for this deposit. */
  shares?: Maybe<Scalars['Float']['output']>;
  /** Total shares in vault after this deposit. */
  total_shares?: Maybe<Scalars['Float']['output']>;
};

/** order by variance() on columns of table "deposit" */
export type Deposits_Variance_Order_By = {
  /** Asset amount deposited after protocol fees, in wei. */
  assets_after_fees?: InputMaybe<Order_By>;
  /** Block number when deposit occurred. */
  block_number?: InputMaybe<Order_By>;
  /** Bonding curve ID of the vault. */
  curve_id?: InputMaybe<Order_By>;
  /** Log index within the transaction for event ordering. */
  log_index?: InputMaybe<Order_By>;
  /** Number of shares minted for this deposit. */
  shares?: InputMaybe<Order_By>;
  /** Total shares in vault after this deposit. */
  total_shares?: InputMaybe<Order_By>;
};

/** Boolean expression to compare columns of type "event_type". All fields are combined with logical 'AND'. */
export type Event_Type_Comparison_Exp = {
  _eq?: InputMaybe<Scalars['event_type']['input']>;
  _gt?: InputMaybe<Scalars['event_type']['input']>;
  _gte?: InputMaybe<Scalars['event_type']['input']>;
  _in?: InputMaybe<Array<Scalars['event_type']['input']>>;
  _is_null?: InputMaybe<Scalars['Boolean']['input']>;
  _lt?: InputMaybe<Scalars['event_type']['input']>;
  _lte?: InputMaybe<Scalars['event_type']['input']>;
  _neq?: InputMaybe<Scalars['event_type']['input']>;
  _nin?: InputMaybe<Array<Scalars['event_type']['input']>>;
};

/** Unified event log of all protocol operations for audit trail and historical analysis. */
export type Events = {
  __typename?: 'events';
  /** An object relationship */
  atom?: Maybe<Atoms>;
  /** Reference to atom if event is AtomCreated. */
  atom_id?: Maybe<Scalars['String']['output']>;
  /** Block number when event occurred. */
  block_number: Scalars['numeric']['output'];
  /** Timestamp when event occurred. */
  created_at: Scalars['timestamptz']['output'];
  /** An object relationship */
  deposit?: Maybe<Deposits>;
  /** Reference to deposit if event is Deposited. */
  deposit_id?: Maybe<Scalars['String']['output']>;
  /** An object relationship */
  fee_transfer?: Maybe<Fee_Transfers>;
  /** Reference to fee_transfer if event is FeesTransfered. */
  fee_transfer_id?: Maybe<Scalars['String']['output']>;
  /** Unique identifier for this event. */
  id: Scalars['String']['output'];
  /** An object relationship */
  protocol_fee_accrued?: Maybe<Protocol_Fee_Accruals>;
  protocol_fee_accrued_id?: Maybe<Scalars['String']['output']>;
  /** An object relationship */
  redemption?: Maybe<Redemptions>;
  /** Reference to redemption if event is Redeemed. */
  redemption_id?: Maybe<Scalars['String']['output']>;
  /** Transaction hash of the event. */
  transaction_hash: Scalars['String']['output'];
  /** An object relationship */
  triple?: Maybe<Triples>;
  /** Reference to triple if event is TripleCreated. */
  triple_id?: Maybe<Scalars['String']['output']>;
  /** Type of event (AtomCreated, TripleCreated, Deposited, Redeemed, etc.). */
  type: Scalars['event_type']['output'];
};

/** aggregated selection of "event" */
export type Events_Aggregate = {
  __typename?: 'events_aggregate';
  aggregate?: Maybe<Events_Aggregate_Fields>;
  nodes: Array<Events>;
};

/** aggregate fields of "event" */
export type Events_Aggregate_Fields = {
  __typename?: 'events_aggregate_fields';
  avg?: Maybe<Events_Avg_Fields>;
  count: Scalars['Int']['output'];
  max?: Maybe<Events_Max_Fields>;
  min?: Maybe<Events_Min_Fields>;
  stddev?: Maybe<Events_Stddev_Fields>;
  stddev_pop?: Maybe<Events_Stddev_Pop_Fields>;
  stddev_samp?: Maybe<Events_Stddev_Samp_Fields>;
  sum?: Maybe<Events_Sum_Fields>;
  var_pop?: Maybe<Events_Var_Pop_Fields>;
  var_samp?: Maybe<Events_Var_Samp_Fields>;
  variance?: Maybe<Events_Variance_Fields>;
};


/** aggregate fields of "event" */
export type Events_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Events_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
};

/** aggregate avg on columns */
export type Events_Avg_Fields = {
  __typename?: 'events_avg_fields';
  /** Block number when event occurred. */
  block_number?: Maybe<Scalars['Float']['output']>;
};

/** Boolean expression to filter rows from the table "event". All fields are combined with a logical 'AND'. */
export type Events_Bool_Exp = {
  _and?: InputMaybe<Array<Events_Bool_Exp>>;
  _not?: InputMaybe<Events_Bool_Exp>;
  _or?: InputMaybe<Array<Events_Bool_Exp>>;
  atom?: InputMaybe<Atoms_Bool_Exp>;
  atom_id?: InputMaybe<String_Comparison_Exp>;
  block_number?: InputMaybe<Numeric_Comparison_Exp>;
  created_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  deposit?: InputMaybe<Deposits_Bool_Exp>;
  deposit_id?: InputMaybe<String_Comparison_Exp>;
  fee_transfer?: InputMaybe<Fee_Transfers_Bool_Exp>;
  fee_transfer_id?: InputMaybe<String_Comparison_Exp>;
  id?: InputMaybe<String_Comparison_Exp>;
  protocol_fee_accrued?: InputMaybe<Protocol_Fee_Accruals_Bool_Exp>;
  protocol_fee_accrued_id?: InputMaybe<String_Comparison_Exp>;
  redemption?: InputMaybe<Redemptions_Bool_Exp>;
  redemption_id?: InputMaybe<String_Comparison_Exp>;
  transaction_hash?: InputMaybe<String_Comparison_Exp>;
  triple?: InputMaybe<Triples_Bool_Exp>;
  triple_id?: InputMaybe<String_Comparison_Exp>;
  type?: InputMaybe<Event_Type_Comparison_Exp>;
};

/** aggregate max on columns */
export type Events_Max_Fields = {
  __typename?: 'events_max_fields';
  /** Reference to atom if event is AtomCreated. */
  atom_id?: Maybe<Scalars['String']['output']>;
  /** Block number when event occurred. */
  block_number?: Maybe<Scalars['numeric']['output']>;
  /** Timestamp when event occurred. */
  created_at?: Maybe<Scalars['timestamptz']['output']>;
  /** Reference to deposit if event is Deposited. */
  deposit_id?: Maybe<Scalars['String']['output']>;
  /** Reference to fee_transfer if event is FeesTransfered. */
  fee_transfer_id?: Maybe<Scalars['String']['output']>;
  /** Unique identifier for this event. */
  id?: Maybe<Scalars['String']['output']>;
  protocol_fee_accrued_id?: Maybe<Scalars['String']['output']>;
  /** Reference to redemption if event is Redeemed. */
  redemption_id?: Maybe<Scalars['String']['output']>;
  /** Transaction hash of the event. */
  transaction_hash?: Maybe<Scalars['String']['output']>;
  /** Reference to triple if event is TripleCreated. */
  triple_id?: Maybe<Scalars['String']['output']>;
  /** Type of event (AtomCreated, TripleCreated, Deposited, Redeemed, etc.). */
  type?: Maybe<Scalars['event_type']['output']>;
};

/** aggregate min on columns */
export type Events_Min_Fields = {
  __typename?: 'events_min_fields';
  /** Reference to atom if event is AtomCreated. */
  atom_id?: Maybe<Scalars['String']['output']>;
  /** Block number when event occurred. */
  block_number?: Maybe<Scalars['numeric']['output']>;
  /** Timestamp when event occurred. */
  created_at?: Maybe<Scalars['timestamptz']['output']>;
  /** Reference to deposit if event is Deposited. */
  deposit_id?: Maybe<Scalars['String']['output']>;
  /** Reference to fee_transfer if event is FeesTransfered. */
  fee_transfer_id?: Maybe<Scalars['String']['output']>;
  /** Unique identifier for this event. */
  id?: Maybe<Scalars['String']['output']>;
  protocol_fee_accrued_id?: Maybe<Scalars['String']['output']>;
  /** Reference to redemption if event is Redeemed. */
  redemption_id?: Maybe<Scalars['String']['output']>;
  /** Transaction hash of the event. */
  transaction_hash?: Maybe<Scalars['String']['output']>;
  /** Reference to triple if event is TripleCreated. */
  triple_id?: Maybe<Scalars['String']['output']>;
  /** Type of event (AtomCreated, TripleCreated, Deposited, Redeemed, etc.). */
  type?: Maybe<Scalars['event_type']['output']>;
};

/** Ordering options when selecting data from "event". */
export type Events_Order_By = {
  atom?: InputMaybe<Atoms_Order_By>;
  atom_id?: InputMaybe<Order_By>;
  block_number?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  deposit?: InputMaybe<Deposits_Order_By>;
  deposit_id?: InputMaybe<Order_By>;
  fee_transfer?: InputMaybe<Fee_Transfers_Order_By>;
  fee_transfer_id?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  protocol_fee_accrued?: InputMaybe<Protocol_Fee_Accruals_Order_By>;
  protocol_fee_accrued_id?: InputMaybe<Order_By>;
  redemption?: InputMaybe<Redemptions_Order_By>;
  redemption_id?: InputMaybe<Order_By>;
  transaction_hash?: InputMaybe<Order_By>;
  triple?: InputMaybe<Triples_Order_By>;
  triple_id?: InputMaybe<Order_By>;
  type?: InputMaybe<Order_By>;
};

/** select columns of table "event" */
export type Events_Select_Column =
  /** column name */
  | 'atom_id'
  /** column name */
  | 'block_number'
  /** column name */
  | 'created_at'
  /** column name */
  | 'deposit_id'
  /** column name */
  | 'fee_transfer_id'
  /** column name */
  | 'id'
  /** column name */
  | 'protocol_fee_accrued_id'
  /** column name */
  | 'redemption_id'
  /** column name */
  | 'transaction_hash'
  /** column name */
  | 'triple_id'
  /** column name */
  | 'type';

/** aggregate stddev on columns */
export type Events_Stddev_Fields = {
  __typename?: 'events_stddev_fields';
  /** Block number when event occurred. */
  block_number?: Maybe<Scalars['Float']['output']>;
};

/** aggregate stddev_pop on columns */
export type Events_Stddev_Pop_Fields = {
  __typename?: 'events_stddev_pop_fields';
  /** Block number when event occurred. */
  block_number?: Maybe<Scalars['Float']['output']>;
};

/** aggregate stddev_samp on columns */
export type Events_Stddev_Samp_Fields = {
  __typename?: 'events_stddev_samp_fields';
  /** Block number when event occurred. */
  block_number?: Maybe<Scalars['Float']['output']>;
};

/** Streaming cursor of the table "events" */
export type Events_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Events_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Events_Stream_Cursor_Value_Input = {
  /** Reference to atom if event is AtomCreated. */
  atom_id?: InputMaybe<Scalars['String']['input']>;
  /** Block number when event occurred. */
  block_number?: InputMaybe<Scalars['numeric']['input']>;
  /** Timestamp when event occurred. */
  created_at?: InputMaybe<Scalars['timestamptz']['input']>;
  /** Reference to deposit if event is Deposited. */
  deposit_id?: InputMaybe<Scalars['String']['input']>;
  /** Reference to fee_transfer if event is FeesTransfered. */
  fee_transfer_id?: InputMaybe<Scalars['String']['input']>;
  /** Unique identifier for this event. */
  id?: InputMaybe<Scalars['String']['input']>;
  protocol_fee_accrued_id?: InputMaybe<Scalars['String']['input']>;
  /** Reference to redemption if event is Redeemed. */
  redemption_id?: InputMaybe<Scalars['String']['input']>;
  /** Transaction hash of the event. */
  transaction_hash?: InputMaybe<Scalars['String']['input']>;
  /** Reference to triple if event is TripleCreated. */
  triple_id?: InputMaybe<Scalars['String']['input']>;
  /** Type of event (AtomCreated, TripleCreated, Deposited, Redeemed, etc.). */
  type?: InputMaybe<Scalars['event_type']['input']>;
};

/** aggregate sum on columns */
export type Events_Sum_Fields = {
  __typename?: 'events_sum_fields';
  /** Block number when event occurred. */
  block_number?: Maybe<Scalars['numeric']['output']>;
};

/** aggregate var_pop on columns */
export type Events_Var_Pop_Fields = {
  __typename?: 'events_var_pop_fields';
  /** Block number when event occurred. */
  block_number?: Maybe<Scalars['Float']['output']>;
};

/** aggregate var_samp on columns */
export type Events_Var_Samp_Fields = {
  __typename?: 'events_var_samp_fields';
  /** Block number when event occurred. */
  block_number?: Maybe<Scalars['Float']['output']>;
};

/** aggregate variance on columns */
export type Events_Variance_Fields = {
  __typename?: 'events_variance_fields';
  /** Block number when event occurred. */
  block_number?: Maybe<Scalars['Float']['output']>;
};

/** Protocol fee transfers between accounts, emitted during deposit and redemption operations. */
export type Fee_Transfers = {
  __typename?: 'fee_transfers';
  /** Fee amount transferred in wei. */
  amount: Scalars['numeric']['output'];
  /** Block number when fee was transferred. */
  block_number: Scalars['numeric']['output'];
  /** Timestamp when fee was transferred. */
  created_at: Scalars['timestamptz']['output'];
  /** Unique identifier for this fee transfer event. */
  id: Scalars['String']['output'];
  /** An object relationship */
  receiver?: Maybe<Accounts>;
  /** Account that received the fee (typically protocol vault). */
  receiver_id: Scalars['String']['output'];
  /** An object relationship */
  sender?: Maybe<Accounts>;
  /** Account that paid the fee. */
  sender_id: Scalars['String']['output'];
  /** Transaction hash of the fee transfer event. */
  transaction_hash: Scalars['String']['output'];
};

/** aggregated selection of "fee_transfer" */
export type Fee_Transfers_Aggregate = {
  __typename?: 'fee_transfers_aggregate';
  aggregate?: Maybe<Fee_Transfers_Aggregate_Fields>;
  nodes: Array<Fee_Transfers>;
};

export type Fee_Transfers_Aggregate_Bool_Exp = {
  count?: InputMaybe<Fee_Transfers_Aggregate_Bool_Exp_Count>;
};

export type Fee_Transfers_Aggregate_Bool_Exp_Count = {
  arguments?: InputMaybe<Array<Fee_Transfers_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
  filter?: InputMaybe<Fee_Transfers_Bool_Exp>;
  predicate: Int_Comparison_Exp;
};

/** aggregate fields of "fee_transfer" */
export type Fee_Transfers_Aggregate_Fields = {
  __typename?: 'fee_transfers_aggregate_fields';
  avg?: Maybe<Fee_Transfers_Avg_Fields>;
  count: Scalars['Int']['output'];
  max?: Maybe<Fee_Transfers_Max_Fields>;
  min?: Maybe<Fee_Transfers_Min_Fields>;
  stddev?: Maybe<Fee_Transfers_Stddev_Fields>;
  stddev_pop?: Maybe<Fee_Transfers_Stddev_Pop_Fields>;
  stddev_samp?: Maybe<Fee_Transfers_Stddev_Samp_Fields>;
  sum?: Maybe<Fee_Transfers_Sum_Fields>;
  var_pop?: Maybe<Fee_Transfers_Var_Pop_Fields>;
  var_samp?: Maybe<Fee_Transfers_Var_Samp_Fields>;
  variance?: Maybe<Fee_Transfers_Variance_Fields>;
};


/** aggregate fields of "fee_transfer" */
export type Fee_Transfers_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Fee_Transfers_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
};

/** order by aggregate values of table "fee_transfer" */
export type Fee_Transfers_Aggregate_Order_By = {
  avg?: InputMaybe<Fee_Transfers_Avg_Order_By>;
  count?: InputMaybe<Order_By>;
  max?: InputMaybe<Fee_Transfers_Max_Order_By>;
  min?: InputMaybe<Fee_Transfers_Min_Order_By>;
  stddev?: InputMaybe<Fee_Transfers_Stddev_Order_By>;
  stddev_pop?: InputMaybe<Fee_Transfers_Stddev_Pop_Order_By>;
  stddev_samp?: InputMaybe<Fee_Transfers_Stddev_Samp_Order_By>;
  sum?: InputMaybe<Fee_Transfers_Sum_Order_By>;
  var_pop?: InputMaybe<Fee_Transfers_Var_Pop_Order_By>;
  var_samp?: InputMaybe<Fee_Transfers_Var_Samp_Order_By>;
  variance?: InputMaybe<Fee_Transfers_Variance_Order_By>;
};

/** aggregate avg on columns */
export type Fee_Transfers_Avg_Fields = {
  __typename?: 'fee_transfers_avg_fields';
  /** Fee amount transferred in wei. */
  amount?: Maybe<Scalars['Float']['output']>;
  /** Block number when fee was transferred. */
  block_number?: Maybe<Scalars['Float']['output']>;
};

/** order by avg() on columns of table "fee_transfer" */
export type Fee_Transfers_Avg_Order_By = {
  /** Fee amount transferred in wei. */
  amount?: InputMaybe<Order_By>;
  /** Block number when fee was transferred. */
  block_number?: InputMaybe<Order_By>;
};

/** Boolean expression to filter rows from the table "fee_transfer". All fields are combined with a logical 'AND'. */
export type Fee_Transfers_Bool_Exp = {
  _and?: InputMaybe<Array<Fee_Transfers_Bool_Exp>>;
  _not?: InputMaybe<Fee_Transfers_Bool_Exp>;
  _or?: InputMaybe<Array<Fee_Transfers_Bool_Exp>>;
  amount?: InputMaybe<Numeric_Comparison_Exp>;
  block_number?: InputMaybe<Numeric_Comparison_Exp>;
  created_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  id?: InputMaybe<String_Comparison_Exp>;
  receiver?: InputMaybe<Accounts_Bool_Exp>;
  receiver_id?: InputMaybe<String_Comparison_Exp>;
  sender?: InputMaybe<Accounts_Bool_Exp>;
  sender_id?: InputMaybe<String_Comparison_Exp>;
  transaction_hash?: InputMaybe<String_Comparison_Exp>;
};

/** aggregate max on columns */
export type Fee_Transfers_Max_Fields = {
  __typename?: 'fee_transfers_max_fields';
  /** Fee amount transferred in wei. */
  amount?: Maybe<Scalars['numeric']['output']>;
  /** Block number when fee was transferred. */
  block_number?: Maybe<Scalars['numeric']['output']>;
  /** Timestamp when fee was transferred. */
  created_at?: Maybe<Scalars['timestamptz']['output']>;
  /** Unique identifier for this fee transfer event. */
  id?: Maybe<Scalars['String']['output']>;
  /** Account that received the fee (typically protocol vault). */
  receiver_id?: Maybe<Scalars['String']['output']>;
  /** Account that paid the fee. */
  sender_id?: Maybe<Scalars['String']['output']>;
  /** Transaction hash of the fee transfer event. */
  transaction_hash?: Maybe<Scalars['String']['output']>;
};

/** order by max() on columns of table "fee_transfer" */
export type Fee_Transfers_Max_Order_By = {
  /** Fee amount transferred in wei. */
  amount?: InputMaybe<Order_By>;
  /** Block number when fee was transferred. */
  block_number?: InputMaybe<Order_By>;
  /** Timestamp when fee was transferred. */
  created_at?: InputMaybe<Order_By>;
  /** Unique identifier for this fee transfer event. */
  id?: InputMaybe<Order_By>;
  /** Account that received the fee (typically protocol vault). */
  receiver_id?: InputMaybe<Order_By>;
  /** Account that paid the fee. */
  sender_id?: InputMaybe<Order_By>;
  /** Transaction hash of the fee transfer event. */
  transaction_hash?: InputMaybe<Order_By>;
};

/** aggregate min on columns */
export type Fee_Transfers_Min_Fields = {
  __typename?: 'fee_transfers_min_fields';
  /** Fee amount transferred in wei. */
  amount?: Maybe<Scalars['numeric']['output']>;
  /** Block number when fee was transferred. */
  block_number?: Maybe<Scalars['numeric']['output']>;
  /** Timestamp when fee was transferred. */
  created_at?: Maybe<Scalars['timestamptz']['output']>;
  /** Unique identifier for this fee transfer event. */
  id?: Maybe<Scalars['String']['output']>;
  /** Account that received the fee (typically protocol vault). */
  receiver_id?: Maybe<Scalars['String']['output']>;
  /** Account that paid the fee. */
  sender_id?: Maybe<Scalars['String']['output']>;
  /** Transaction hash of the fee transfer event. */
  transaction_hash?: Maybe<Scalars['String']['output']>;
};

/** order by min() on columns of table "fee_transfer" */
export type Fee_Transfers_Min_Order_By = {
  /** Fee amount transferred in wei. */
  amount?: InputMaybe<Order_By>;
  /** Block number when fee was transferred. */
  block_number?: InputMaybe<Order_By>;
  /** Timestamp when fee was transferred. */
  created_at?: InputMaybe<Order_By>;
  /** Unique identifier for this fee transfer event. */
  id?: InputMaybe<Order_By>;
  /** Account that received the fee (typically protocol vault). */
  receiver_id?: InputMaybe<Order_By>;
  /** Account that paid the fee. */
  sender_id?: InputMaybe<Order_By>;
  /** Transaction hash of the fee transfer event. */
  transaction_hash?: InputMaybe<Order_By>;
};

/** Ordering options when selecting data from "fee_transfer". */
export type Fee_Transfers_Order_By = {
  amount?: InputMaybe<Order_By>;
  block_number?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  receiver?: InputMaybe<Accounts_Order_By>;
  receiver_id?: InputMaybe<Order_By>;
  sender?: InputMaybe<Accounts_Order_By>;
  sender_id?: InputMaybe<Order_By>;
  transaction_hash?: InputMaybe<Order_By>;
};

/** select columns of table "fee_transfer" */
export type Fee_Transfers_Select_Column =
  /** column name */
  | 'amount'
  /** column name */
  | 'block_number'
  /** column name */
  | 'created_at'
  /** column name */
  | 'id'
  /** column name */
  | 'receiver_id'
  /** column name */
  | 'sender_id'
  /** column name */
  | 'transaction_hash';

/** aggregate stddev on columns */
export type Fee_Transfers_Stddev_Fields = {
  __typename?: 'fee_transfers_stddev_fields';
  /** Fee amount transferred in wei. */
  amount?: Maybe<Scalars['Float']['output']>;
  /** Block number when fee was transferred. */
  block_number?: Maybe<Scalars['Float']['output']>;
};

/** order by stddev() on columns of table "fee_transfer" */
export type Fee_Transfers_Stddev_Order_By = {
  /** Fee amount transferred in wei. */
  amount?: InputMaybe<Order_By>;
  /** Block number when fee was transferred. */
  block_number?: InputMaybe<Order_By>;
};

/** aggregate stddev_pop on columns */
export type Fee_Transfers_Stddev_Pop_Fields = {
  __typename?: 'fee_transfers_stddev_pop_fields';
  /** Fee amount transferred in wei. */
  amount?: Maybe<Scalars['Float']['output']>;
  /** Block number when fee was transferred. */
  block_number?: Maybe<Scalars['Float']['output']>;
};

/** order by stddev_pop() on columns of table "fee_transfer" */
export type Fee_Transfers_Stddev_Pop_Order_By = {
  /** Fee amount transferred in wei. */
  amount?: InputMaybe<Order_By>;
  /** Block number when fee was transferred. */
  block_number?: InputMaybe<Order_By>;
};

/** aggregate stddev_samp on columns */
export type Fee_Transfers_Stddev_Samp_Fields = {
  __typename?: 'fee_transfers_stddev_samp_fields';
  /** Fee amount transferred in wei. */
  amount?: Maybe<Scalars['Float']['output']>;
  /** Block number when fee was transferred. */
  block_number?: Maybe<Scalars['Float']['output']>;
};

/** order by stddev_samp() on columns of table "fee_transfer" */
export type Fee_Transfers_Stddev_Samp_Order_By = {
  /** Fee amount transferred in wei. */
  amount?: InputMaybe<Order_By>;
  /** Block number when fee was transferred. */
  block_number?: InputMaybe<Order_By>;
};

/** Streaming cursor of the table "fee_transfers" */
export type Fee_Transfers_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Fee_Transfers_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Fee_Transfers_Stream_Cursor_Value_Input = {
  /** Fee amount transferred in wei. */
  amount?: InputMaybe<Scalars['numeric']['input']>;
  /** Block number when fee was transferred. */
  block_number?: InputMaybe<Scalars['numeric']['input']>;
  /** Timestamp when fee was transferred. */
  created_at?: InputMaybe<Scalars['timestamptz']['input']>;
  /** Unique identifier for this fee transfer event. */
  id?: InputMaybe<Scalars['String']['input']>;
  /** Account that received the fee (typically protocol vault). */
  receiver_id?: InputMaybe<Scalars['String']['input']>;
  /** Account that paid the fee. */
  sender_id?: InputMaybe<Scalars['String']['input']>;
  /** Transaction hash of the fee transfer event. */
  transaction_hash?: InputMaybe<Scalars['String']['input']>;
};

/** aggregate sum on columns */
export type Fee_Transfers_Sum_Fields = {
  __typename?: 'fee_transfers_sum_fields';
  /** Fee amount transferred in wei. */
  amount?: Maybe<Scalars['numeric']['output']>;
  /** Block number when fee was transferred. */
  block_number?: Maybe<Scalars['numeric']['output']>;
};

/** order by sum() on columns of table "fee_transfer" */
export type Fee_Transfers_Sum_Order_By = {
  /** Fee amount transferred in wei. */
  amount?: InputMaybe<Order_By>;
  /** Block number when fee was transferred. */
  block_number?: InputMaybe<Order_By>;
};

/** aggregate var_pop on columns */
export type Fee_Transfers_Var_Pop_Fields = {
  __typename?: 'fee_transfers_var_pop_fields';
  /** Fee amount transferred in wei. */
  amount?: Maybe<Scalars['Float']['output']>;
  /** Block number when fee was transferred. */
  block_number?: Maybe<Scalars['Float']['output']>;
};

/** order by var_pop() on columns of table "fee_transfer" */
export type Fee_Transfers_Var_Pop_Order_By = {
  /** Fee amount transferred in wei. */
  amount?: InputMaybe<Order_By>;
  /** Block number when fee was transferred. */
  block_number?: InputMaybe<Order_By>;
};

/** aggregate var_samp on columns */
export type Fee_Transfers_Var_Samp_Fields = {
  __typename?: 'fee_transfers_var_samp_fields';
  /** Fee amount transferred in wei. */
  amount?: Maybe<Scalars['Float']['output']>;
  /** Block number when fee was transferred. */
  block_number?: Maybe<Scalars['Float']['output']>;
};

/** order by var_samp() on columns of table "fee_transfer" */
export type Fee_Transfers_Var_Samp_Order_By = {
  /** Fee amount transferred in wei. */
  amount?: InputMaybe<Order_By>;
  /** Block number when fee was transferred. */
  block_number?: InputMaybe<Order_By>;
};

/** aggregate variance on columns */
export type Fee_Transfers_Variance_Fields = {
  __typename?: 'fee_transfers_variance_fields';
  /** Fee amount transferred in wei. */
  amount?: Maybe<Scalars['Float']['output']>;
  /** Block number when fee was transferred. */
  block_number?: Maybe<Scalars['Float']['output']>;
};

/** order by variance() on columns of table "fee_transfer" */
export type Fee_Transfers_Variance_Order_By = {
  /** Fee amount transferred in wei. */
  amount?: InputMaybe<Order_By>;
  /** Block number when fee was transferred. */
  block_number?: InputMaybe<Order_By>;
};

/** Boolean expression to compare columns of type "float8". All fields are combined with logical 'AND'. */
export type Float8_Comparison_Exp = {
  _eq?: InputMaybe<Scalars['float8']['input']>;
  _gt?: InputMaybe<Scalars['float8']['input']>;
  _gte?: InputMaybe<Scalars['float8']['input']>;
  _in?: InputMaybe<Array<Scalars['float8']['input']>>;
  _is_null?: InputMaybe<Scalars['Boolean']['input']>;
  _lt?: InputMaybe<Scalars['float8']['input']>;
  _lte?: InputMaybe<Scalars['float8']['input']>;
  _neq?: InputMaybe<Scalars['float8']['input']>;
  _nin?: InputMaybe<Array<Scalars['float8']['input']>>;
};

export type Following_Args = {
  address?: InputMaybe<Scalars['String']['input']>;
};

export type Get_Account_Pnl_Rank_Args = {
  p_account_id?: InputMaybe<Scalars['String']['input']>;
  p_sort_by?: InputMaybe<Scalars['String']['input']>;
  p_term_id?: InputMaybe<Scalars['String']['input']>;
  p_time_filter?: InputMaybe<Scalars['String']['input']>;
};

export type Get_Pnl_Leaderboard_Args = {
  p_end_time?: InputMaybe<Scalars['timestamptz']['input']>;
  p_exclude_protocol_accounts?: InputMaybe<Scalars['Boolean']['input']>;
  p_limit?: InputMaybe<Scalars['Int']['input']>;
  p_min_positions?: InputMaybe<Scalars['Int']['input']>;
  p_min_volume?: InputMaybe<Scalars['numeric']['input']>;
  p_offset?: InputMaybe<Scalars['Int']['input']>;
  p_sort_by?: InputMaybe<Scalars['String']['input']>;
  p_sort_order?: InputMaybe<Scalars['String']['input']>;
  p_start_time?: InputMaybe<Scalars['timestamptz']['input']>;
  p_term_id?: InputMaybe<Scalars['String']['input']>;
  p_time_filter?: InputMaybe<Scalars['String']['input']>;
};

export type Get_Pnl_Leaderboard_Period_Args = {
  p_end_date: Scalars['String']['input'];
  p_exclude_protocol_accounts?: InputMaybe<Scalars['Boolean']['input']>;
  p_limit?: InputMaybe<Scalars['Int']['input']>;
  p_min_positions?: InputMaybe<Scalars['Int']['input']>;
  p_min_volume?: InputMaybe<Scalars['Float']['input']>;
  p_offset?: InputMaybe<Scalars['Int']['input']>;
  p_sort_by?: InputMaybe<Scalars['String']['input']>;
  p_sort_order?: InputMaybe<Scalars['String']['input']>;
  p_start_date: Scalars['String']['input'];
  p_term_id?: InputMaybe<Scalars['String']['input']>;
};

export type Get_Pnl_Leaderboard_Period_Min_Threshold_Args = {
  p_end_date: Scalars['String']['input'];
  p_exclude_protocol_accounts?: InputMaybe<Scalars['Boolean']['input']>;
  p_limit?: InputMaybe<Scalars['Int']['input']>;
  p_min_deposit?: InputMaybe<Scalars['Float']['input']>;
  p_min_positions?: InputMaybe<Scalars['Int']['input']>;
  p_min_volume?: InputMaybe<Scalars['Float']['input']>;
  p_offset?: InputMaybe<Scalars['Int']['input']>;
  p_sort_by?: InputMaybe<Scalars['String']['input']>;
  p_sort_order?: InputMaybe<Scalars['String']['input']>;
  p_start_date: Scalars['String']['input'];
  p_term_id?: InputMaybe<Scalars['String']['input']>;
};

export type Get_Pnl_Leaderboard_Stats_Args = {
  p_term_id?: InputMaybe<Scalars['String']['input']>;
  p_time_filter?: InputMaybe<Scalars['String']['input']>;
};

export type Get_Vault_Leaderboard_Args = {
  p_curve_id?: InputMaybe<Scalars['numeric']['input']>;
  p_limit?: InputMaybe<Scalars['Int']['input']>;
  p_offset?: InputMaybe<Scalars['Int']['input']>;
  p_sort_by?: InputMaybe<Scalars['String']['input']>;
  p_sort_order?: InputMaybe<Scalars['String']['input']>;
  p_term_id?: InputMaybe<Scalars['String']['input']>;
};

/** Generic JSON storage for atom values that do not fit other typed schemas. */
export type Json_Objects = {
  __typename?: 'json_objects';
  /** An object relationship */
  atom?: Maybe<Atoms>;
  /** JSONB data containing arbitrary structured content. */
  data: Scalars['jsonb']['output'];
  /** Unique identifier for this JSON object. */
  id: Scalars['String']['output'];
};


/** Generic JSON storage for atom values that do not fit other typed schemas. */
export type Json_ObjectsDataArgs = {
  path?: InputMaybe<Scalars['String']['input']>;
};

/** aggregated selection of "json_object" */
export type Json_Objects_Aggregate = {
  __typename?: 'json_objects_aggregate';
  aggregate?: Maybe<Json_Objects_Aggregate_Fields>;
  nodes: Array<Json_Objects>;
};

/** aggregate fields of "json_object" */
export type Json_Objects_Aggregate_Fields = {
  __typename?: 'json_objects_aggregate_fields';
  count: Scalars['Int']['output'];
  max?: Maybe<Json_Objects_Max_Fields>;
  min?: Maybe<Json_Objects_Min_Fields>;
};


/** aggregate fields of "json_object" */
export type Json_Objects_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Json_Objects_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
};

/** Boolean expression to filter rows from the table "json_object". All fields are combined with a logical 'AND'. */
export type Json_Objects_Bool_Exp = {
  _and?: InputMaybe<Array<Json_Objects_Bool_Exp>>;
  _not?: InputMaybe<Json_Objects_Bool_Exp>;
  _or?: InputMaybe<Array<Json_Objects_Bool_Exp>>;
  atom?: InputMaybe<Atoms_Bool_Exp>;
  data?: InputMaybe<Jsonb_Comparison_Exp>;
  id?: InputMaybe<String_Comparison_Exp>;
};

/** aggregate max on columns */
export type Json_Objects_Max_Fields = {
  __typename?: 'json_objects_max_fields';
  /** Unique identifier for this JSON object. */
  id?: Maybe<Scalars['String']['output']>;
};

/** aggregate min on columns */
export type Json_Objects_Min_Fields = {
  __typename?: 'json_objects_min_fields';
  /** Unique identifier for this JSON object. */
  id?: Maybe<Scalars['String']['output']>;
};

/** Ordering options when selecting data from "json_object". */
export type Json_Objects_Order_By = {
  atom?: InputMaybe<Atoms_Order_By>;
  data?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
};

/** select columns of table "json_object" */
export type Json_Objects_Select_Column =
  /** column name */
  | 'data'
  /** column name */
  | 'id';

/** Streaming cursor of the table "json_objects" */
export type Json_Objects_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Json_Objects_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Json_Objects_Stream_Cursor_Value_Input = {
  /** JSONB data containing arbitrary structured content. */
  data?: InputMaybe<Scalars['jsonb']['input']>;
  /** Unique identifier for this JSON object. */
  id?: InputMaybe<Scalars['String']['input']>;
};

export type Jsonb_Cast_Exp = {
  String?: InputMaybe<String_Comparison_Exp>;
};

/** Boolean expression to compare columns of type "jsonb". All fields are combined with logical 'AND'. */
export type Jsonb_Comparison_Exp = {
  _cast?: InputMaybe<Jsonb_Cast_Exp>;
  /** is the column contained in the given json value */
  _contained_in?: InputMaybe<Scalars['jsonb']['input']>;
  /** does the column contain the given json value at the top level */
  _contains?: InputMaybe<Scalars['jsonb']['input']>;
  _eq?: InputMaybe<Scalars['jsonb']['input']>;
  _gt?: InputMaybe<Scalars['jsonb']['input']>;
  _gte?: InputMaybe<Scalars['jsonb']['input']>;
  /** does the string exist as a top-level key in the column */
  _has_key?: InputMaybe<Scalars['String']['input']>;
  /** do all of these strings exist as top-level keys in the column */
  _has_keys_all?: InputMaybe<Array<Scalars['String']['input']>>;
  /** do any of these strings exist as top-level keys in the column */
  _has_keys_any?: InputMaybe<Array<Scalars['String']['input']>>;
  _in?: InputMaybe<Array<Scalars['jsonb']['input']>>;
  _is_null?: InputMaybe<Scalars['Boolean']['input']>;
  _lt?: InputMaybe<Scalars['jsonb']['input']>;
  _lte?: InputMaybe<Scalars['jsonb']['input']>;
  _neq?: InputMaybe<Scalars['jsonb']['input']>;
  _nin?: InputMaybe<Array<Scalars['jsonb']['input']>>;
};

/** mutation root */
export type Mutation_Root = {
  __typename?: 'mutation_root';
  /** Uploads and pins Organization to IPFS */
  pinOrganization?: Maybe<PinOutput>;
  /** Uploads and pins Person to IPFS */
  pinPerson?: Maybe<PinOutput>;
  /** Uploads and pins Thing to IPFS */
  pinThing?: Maybe<PinOutput>;
  /** Uploads and classifies an image file using image-guard. Accepts base64-encoded image data. Note: The original /upload endpoint requires multipart/form-data which Hasura actions cannot construct directly. This mutation uses upload_image_from_url with a data URL workaround. For direct file uploads, use the image-guard API directly or create a wrapper endpoint. */
  uploadImage?: Maybe<UploadImageFromUrlOutput>;
  /** Uploads and classifies an image from a URL using image-guard */
  uploadImageFromUrl?: Maybe<UploadImageFromUrlOutput>;
  /** Uploads JSON to IPFS using image-guard */
  uploadJsonToIpfs?: Maybe<UploadJsonToIpfsOutput>;
};


/** mutation root */
export type Mutation_RootPinOrganizationArgs = {
  organization: PinOrganizationInput;
};


/** mutation root */
export type Mutation_RootPinPersonArgs = {
  person: PinPersonInput;
};


/** mutation root */
export type Mutation_RootPinThingArgs = {
  thing: PinThingInput;
};


/** mutation root */
export type Mutation_RootUploadImageArgs = {
  image: UploadImageInput;
};


/** mutation root */
export type Mutation_RootUploadImageFromUrlArgs = {
  image: UploadImageFromUrlInput;
};


/** mutation root */
export type Mutation_RootUploadJsonToIpfsArgs = {
  json: Scalars['jsonb']['input'];
};

/** Boolean expression to compare columns of type "numeric". All fields are combined with logical 'AND'. */
export type Numeric_Comparison_Exp = {
  _eq?: InputMaybe<Scalars['numeric']['input']>;
  _gt?: InputMaybe<Scalars['numeric']['input']>;
  _gte?: InputMaybe<Scalars['numeric']['input']>;
  _in?: InputMaybe<Array<Scalars['numeric']['input']>>;
  _is_null?: InputMaybe<Scalars['Boolean']['input']>;
  _lt?: InputMaybe<Scalars['numeric']['input']>;
  _lte?: InputMaybe<Scalars['numeric']['input']>;
  _neq?: InputMaybe<Scalars['numeric']['input']>;
  _nin?: InputMaybe<Array<Scalars['numeric']['input']>>;
};

/** column ordering options */
export type Order_By =
  /** in ascending order, nulls last */
  | 'asc'
  /** in ascending order, nulls first */
  | 'asc_nulls_first'
  /** in ascending order, nulls last */
  | 'asc_nulls_last'
  /** in descending order, nulls first */
  | 'desc'
  /** in descending order, nulls first */
  | 'desc_nulls_first'
  /** in descending order, nulls last */
  | 'desc_nulls_last';

/** Organization entities following schema.org Organization specification for atom values. */
export type Organizations = {
  __typename?: 'organizations';
  /** An object relationship */
  atom?: Maybe<Atoms>;
  /** Description or mission of the organization. */
  description?: Maybe<Scalars['String']['output']>;
  /** Contact email for the organization. */
  email?: Maybe<Scalars['String']['output']>;
  /** Unique identifier for this organization entity. */
  id: Scalars['String']['output'];
  /** Logo or image URL for the organization. */
  image?: Maybe<Scalars['String']['output']>;
  /** Name of the organization. */
  name?: Maybe<Scalars['String']['output']>;
  /** Organization website URL. */
  url?: Maybe<Scalars['String']['output']>;
};

/** aggregated selection of "organization" */
export type Organizations_Aggregate = {
  __typename?: 'organizations_aggregate';
  aggregate?: Maybe<Organizations_Aggregate_Fields>;
  nodes: Array<Organizations>;
};

/** aggregate fields of "organization" */
export type Organizations_Aggregate_Fields = {
  __typename?: 'organizations_aggregate_fields';
  count: Scalars['Int']['output'];
  max?: Maybe<Organizations_Max_Fields>;
  min?: Maybe<Organizations_Min_Fields>;
};


/** aggregate fields of "organization" */
export type Organizations_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Organizations_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
};

/** Boolean expression to filter rows from the table "organization". All fields are combined with a logical 'AND'. */
export type Organizations_Bool_Exp = {
  _and?: InputMaybe<Array<Organizations_Bool_Exp>>;
  _not?: InputMaybe<Organizations_Bool_Exp>;
  _or?: InputMaybe<Array<Organizations_Bool_Exp>>;
  atom?: InputMaybe<Atoms_Bool_Exp>;
  description?: InputMaybe<String_Comparison_Exp>;
  email?: InputMaybe<String_Comparison_Exp>;
  id?: InputMaybe<String_Comparison_Exp>;
  image?: InputMaybe<String_Comparison_Exp>;
  name?: InputMaybe<String_Comparison_Exp>;
  url?: InputMaybe<String_Comparison_Exp>;
};

/** aggregate max on columns */
export type Organizations_Max_Fields = {
  __typename?: 'organizations_max_fields';
  /** Description or mission of the organization. */
  description?: Maybe<Scalars['String']['output']>;
  /** Contact email for the organization. */
  email?: Maybe<Scalars['String']['output']>;
  /** Unique identifier for this organization entity. */
  id?: Maybe<Scalars['String']['output']>;
  /** Logo or image URL for the organization. */
  image?: Maybe<Scalars['String']['output']>;
  /** Name of the organization. */
  name?: Maybe<Scalars['String']['output']>;
  /** Organization website URL. */
  url?: Maybe<Scalars['String']['output']>;
};

/** aggregate min on columns */
export type Organizations_Min_Fields = {
  __typename?: 'organizations_min_fields';
  /** Description or mission of the organization. */
  description?: Maybe<Scalars['String']['output']>;
  /** Contact email for the organization. */
  email?: Maybe<Scalars['String']['output']>;
  /** Unique identifier for this organization entity. */
  id?: Maybe<Scalars['String']['output']>;
  /** Logo or image URL for the organization. */
  image?: Maybe<Scalars['String']['output']>;
  /** Name of the organization. */
  name?: Maybe<Scalars['String']['output']>;
  /** Organization website URL. */
  url?: Maybe<Scalars['String']['output']>;
};

/** Ordering options when selecting data from "organization". */
export type Organizations_Order_By = {
  atom?: InputMaybe<Atoms_Order_By>;
  description?: InputMaybe<Order_By>;
  email?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  image?: InputMaybe<Order_By>;
  name?: InputMaybe<Order_By>;
  url?: InputMaybe<Order_By>;
};

/** select columns of table "organization" */
export type Organizations_Select_Column =
  /** column name */
  | 'description'
  /** column name */
  | 'email'
  /** column name */
  | 'id'
  /** column name */
  | 'image'
  /** column name */
  | 'name'
  /** column name */
  | 'url';

/** Streaming cursor of the table "organizations" */
export type Organizations_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Organizations_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Organizations_Stream_Cursor_Value_Input = {
  /** Description or mission of the organization. */
  description?: InputMaybe<Scalars['String']['input']>;
  /** Contact email for the organization. */
  email?: InputMaybe<Scalars['String']['input']>;
  /** Unique identifier for this organization entity. */
  id?: InputMaybe<Scalars['String']['input']>;
  /** Logo or image URL for the organization. */
  image?: InputMaybe<Scalars['String']['input']>;
  /** Name of the organization. */
  name?: InputMaybe<Scalars['String']['input']>;
  /** Organization website URL. */
  url?: InputMaybe<Scalars['String']['input']>;
};

/** Person entities following schema.org Person specification for atom values. */
export type Persons = {
  __typename?: 'persons';
  /** An object relationship */
  atom?: Maybe<Atoms>;
  cached_image?: Maybe<Cached_Images_Cached_Image>;
  /** Bio or description of the person. */
  description?: Maybe<Scalars['String']['output']>;
  /** Email address of the person. */
  email?: Maybe<Scalars['String']['output']>;
  /** Unique identifier for this person entity. */
  id: Scalars['String']['output'];
  /** External identifier (ENS name, DID, etc.) for the person. */
  identifier?: Maybe<Scalars['String']['output']>;
  /** Profile image URL for the person. */
  image?: Maybe<Scalars['String']['output']>;
  /** Full name of the person. */
  name?: Maybe<Scalars['String']['output']>;
  /** Personal website or homepage URL. */
  url?: Maybe<Scalars['String']['output']>;
};

/** aggregated selection of "person" */
export type Persons_Aggregate = {
  __typename?: 'persons_aggregate';
  aggregate?: Maybe<Persons_Aggregate_Fields>;
  nodes: Array<Persons>;
};

/** aggregate fields of "person" */
export type Persons_Aggregate_Fields = {
  __typename?: 'persons_aggregate_fields';
  count: Scalars['Int']['output'];
  max?: Maybe<Persons_Max_Fields>;
  min?: Maybe<Persons_Min_Fields>;
};


/** aggregate fields of "person" */
export type Persons_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Persons_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
};

/** Boolean expression to filter rows from the table "person". All fields are combined with a logical 'AND'. */
export type Persons_Bool_Exp = {
  _and?: InputMaybe<Array<Persons_Bool_Exp>>;
  _not?: InputMaybe<Persons_Bool_Exp>;
  _or?: InputMaybe<Array<Persons_Bool_Exp>>;
  atom?: InputMaybe<Atoms_Bool_Exp>;
  description?: InputMaybe<String_Comparison_Exp>;
  email?: InputMaybe<String_Comparison_Exp>;
  id?: InputMaybe<String_Comparison_Exp>;
  identifier?: InputMaybe<String_Comparison_Exp>;
  image?: InputMaybe<String_Comparison_Exp>;
  name?: InputMaybe<String_Comparison_Exp>;
  url?: InputMaybe<String_Comparison_Exp>;
};

/** aggregate max on columns */
export type Persons_Max_Fields = {
  __typename?: 'persons_max_fields';
  /** Bio or description of the person. */
  description?: Maybe<Scalars['String']['output']>;
  /** Email address of the person. */
  email?: Maybe<Scalars['String']['output']>;
  /** Unique identifier for this person entity. */
  id?: Maybe<Scalars['String']['output']>;
  /** External identifier (ENS name, DID, etc.) for the person. */
  identifier?: Maybe<Scalars['String']['output']>;
  /** Profile image URL for the person. */
  image?: Maybe<Scalars['String']['output']>;
  /** Full name of the person. */
  name?: Maybe<Scalars['String']['output']>;
  /** Personal website or homepage URL. */
  url?: Maybe<Scalars['String']['output']>;
};

/** aggregate min on columns */
export type Persons_Min_Fields = {
  __typename?: 'persons_min_fields';
  /** Bio or description of the person. */
  description?: Maybe<Scalars['String']['output']>;
  /** Email address of the person. */
  email?: Maybe<Scalars['String']['output']>;
  /** Unique identifier for this person entity. */
  id?: Maybe<Scalars['String']['output']>;
  /** External identifier (ENS name, DID, etc.) for the person. */
  identifier?: Maybe<Scalars['String']['output']>;
  /** Profile image URL for the person. */
  image?: Maybe<Scalars['String']['output']>;
  /** Full name of the person. */
  name?: Maybe<Scalars['String']['output']>;
  /** Personal website or homepage URL. */
  url?: Maybe<Scalars['String']['output']>;
};

/** Ordering options when selecting data from "person". */
export type Persons_Order_By = {
  atom?: InputMaybe<Atoms_Order_By>;
  description?: InputMaybe<Order_By>;
  email?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  identifier?: InputMaybe<Order_By>;
  image?: InputMaybe<Order_By>;
  name?: InputMaybe<Order_By>;
  url?: InputMaybe<Order_By>;
};

/** select columns of table "person" */
export type Persons_Select_Column =
  /** column name */
  | 'description'
  /** column name */
  | 'email'
  /** column name */
  | 'id'
  /** column name */
  | 'identifier'
  /** column name */
  | 'image'
  /** column name */
  | 'name'
  /** column name */
  | 'url';

/** Streaming cursor of the table "persons" */
export type Persons_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Persons_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Persons_Stream_Cursor_Value_Input = {
  /** Bio or description of the person. */
  description?: InputMaybe<Scalars['String']['input']>;
  /** Email address of the person. */
  email?: InputMaybe<Scalars['String']['input']>;
  /** Unique identifier for this person entity. */
  id?: InputMaybe<Scalars['String']['input']>;
  /** External identifier (ENS name, DID, etc.) for the person. */
  identifier?: InputMaybe<Scalars['String']['input']>;
  /** Profile image URL for the person. */
  image?: InputMaybe<Scalars['String']['input']>;
  /** Full name of the person. */
  name?: InputMaybe<Scalars['String']['input']>;
  /** Personal website or homepage URL. */
  url?: InputMaybe<Scalars['String']['input']>;
};

/** columns and relationships of "pnl_leaderboard_entry" */
export type Pnl_Leaderboard_Entry = {
  __typename?: 'pnl_leaderboard_entry';
  account_id?: Maybe<Scalars['String']['output']>;
  account_image?: Maybe<Scalars['String']['output']>;
  account_label?: Maybe<Scalars['String']['output']>;
  active_position_count?: Maybe<Scalars['bigint']['output']>;
  best_trade_pnl_formatted?: Maybe<Scalars['numeric']['output']>;
  best_trade_pnl_raw?: Maybe<Scalars['numeric']['output']>;
  current_equity_value_formatted?: Maybe<Scalars['numeric']['output']>;
  current_equity_value_raw?: Maybe<Scalars['numeric']['output']>;
  first_position_at?: Maybe<Scalars['timestamptz']['output']>;
  last_activity_at?: Maybe<Scalars['timestamptz']['output']>;
  losing_positions?: Maybe<Scalars['bigint']['output']>;
  pnl_change_formatted?: Maybe<Scalars['numeric']['output']>;
  pnl_change_raw?: Maybe<Scalars['numeric']['output']>;
  pnl_pct?: Maybe<Scalars['numeric']['output']>;
  rank?: Maybe<Scalars['bigint']['output']>;
  realized_pnl_formatted?: Maybe<Scalars['numeric']['output']>;
  realized_pnl_pct?: Maybe<Scalars['numeric']['output']>;
  realized_pnl_raw?: Maybe<Scalars['numeric']['output']>;
  redeemable_assets_formatted?: Maybe<Scalars['numeric']['output']>;
  redeemable_assets_raw?: Maybe<Scalars['numeric']['output']>;
  total_deposits_formatted?: Maybe<Scalars['numeric']['output']>;
  total_deposits_raw?: Maybe<Scalars['numeric']['output']>;
  total_pnl_formatted?: Maybe<Scalars['numeric']['output']>;
  total_pnl_raw?: Maybe<Scalars['numeric']['output']>;
  total_position_count?: Maybe<Scalars['bigint']['output']>;
  total_redemptions_formatted?: Maybe<Scalars['numeric']['output']>;
  total_redemptions_raw?: Maybe<Scalars['numeric']['output']>;
  total_volume_formatted?: Maybe<Scalars['numeric']['output']>;
  total_volume_raw?: Maybe<Scalars['numeric']['output']>;
  unrealized_pnl_formatted?: Maybe<Scalars['numeric']['output']>;
  unrealized_pnl_pct?: Maybe<Scalars['numeric']['output']>;
  unrealized_pnl_raw?: Maybe<Scalars['numeric']['output']>;
  win_rate?: Maybe<Scalars['numeric']['output']>;
  winning_positions?: Maybe<Scalars['bigint']['output']>;
  worst_trade_pnl_formatted?: Maybe<Scalars['numeric']['output']>;
  worst_trade_pnl_raw?: Maybe<Scalars['numeric']['output']>;
};

export type Pnl_Leaderboard_Entry_Aggregate = {
  __typename?: 'pnl_leaderboard_entry_aggregate';
  aggregate?: Maybe<Pnl_Leaderboard_Entry_Aggregate_Fields>;
  nodes: Array<Pnl_Leaderboard_Entry>;
};

/** aggregate fields of "pnl_leaderboard_entry" */
export type Pnl_Leaderboard_Entry_Aggregate_Fields = {
  __typename?: 'pnl_leaderboard_entry_aggregate_fields';
  avg?: Maybe<Pnl_Leaderboard_Entry_Avg_Fields>;
  count: Scalars['Int']['output'];
  max?: Maybe<Pnl_Leaderboard_Entry_Max_Fields>;
  min?: Maybe<Pnl_Leaderboard_Entry_Min_Fields>;
  stddev?: Maybe<Pnl_Leaderboard_Entry_Stddev_Fields>;
  stddev_pop?: Maybe<Pnl_Leaderboard_Entry_Stddev_Pop_Fields>;
  stddev_samp?: Maybe<Pnl_Leaderboard_Entry_Stddev_Samp_Fields>;
  sum?: Maybe<Pnl_Leaderboard_Entry_Sum_Fields>;
  var_pop?: Maybe<Pnl_Leaderboard_Entry_Var_Pop_Fields>;
  var_samp?: Maybe<Pnl_Leaderboard_Entry_Var_Samp_Fields>;
  variance?: Maybe<Pnl_Leaderboard_Entry_Variance_Fields>;
};


/** aggregate fields of "pnl_leaderboard_entry" */
export type Pnl_Leaderboard_Entry_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Pnl_Leaderboard_Entry_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
};

/** aggregate avg on columns */
export type Pnl_Leaderboard_Entry_Avg_Fields = {
  __typename?: 'pnl_leaderboard_entry_avg_fields';
  active_position_count?: Maybe<Scalars['Float']['output']>;
  best_trade_pnl_formatted?: Maybe<Scalars['Float']['output']>;
  best_trade_pnl_raw?: Maybe<Scalars['Float']['output']>;
  current_equity_value_formatted?: Maybe<Scalars['Float']['output']>;
  current_equity_value_raw?: Maybe<Scalars['Float']['output']>;
  losing_positions?: Maybe<Scalars['Float']['output']>;
  pnl_change_formatted?: Maybe<Scalars['Float']['output']>;
  pnl_change_raw?: Maybe<Scalars['Float']['output']>;
  pnl_pct?: Maybe<Scalars['Float']['output']>;
  rank?: Maybe<Scalars['Float']['output']>;
  realized_pnl_formatted?: Maybe<Scalars['Float']['output']>;
  realized_pnl_pct?: Maybe<Scalars['Float']['output']>;
  realized_pnl_raw?: Maybe<Scalars['Float']['output']>;
  redeemable_assets_formatted?: Maybe<Scalars['Float']['output']>;
  redeemable_assets_raw?: Maybe<Scalars['Float']['output']>;
  total_deposits_formatted?: Maybe<Scalars['Float']['output']>;
  total_deposits_raw?: Maybe<Scalars['Float']['output']>;
  total_pnl_formatted?: Maybe<Scalars['Float']['output']>;
  total_pnl_raw?: Maybe<Scalars['Float']['output']>;
  total_position_count?: Maybe<Scalars['Float']['output']>;
  total_redemptions_formatted?: Maybe<Scalars['Float']['output']>;
  total_redemptions_raw?: Maybe<Scalars['Float']['output']>;
  total_volume_formatted?: Maybe<Scalars['Float']['output']>;
  total_volume_raw?: Maybe<Scalars['Float']['output']>;
  unrealized_pnl_formatted?: Maybe<Scalars['Float']['output']>;
  unrealized_pnl_pct?: Maybe<Scalars['Float']['output']>;
  unrealized_pnl_raw?: Maybe<Scalars['Float']['output']>;
  win_rate?: Maybe<Scalars['Float']['output']>;
  winning_positions?: Maybe<Scalars['Float']['output']>;
  worst_trade_pnl_formatted?: Maybe<Scalars['Float']['output']>;
  worst_trade_pnl_raw?: Maybe<Scalars['Float']['output']>;
};

/** Boolean expression to filter rows from the table "pnl_leaderboard_entry". All fields are combined with a logical 'AND'. */
export type Pnl_Leaderboard_Entry_Bool_Exp = {
  _and?: InputMaybe<Array<Pnl_Leaderboard_Entry_Bool_Exp>>;
  _not?: InputMaybe<Pnl_Leaderboard_Entry_Bool_Exp>;
  _or?: InputMaybe<Array<Pnl_Leaderboard_Entry_Bool_Exp>>;
  account_id?: InputMaybe<String_Comparison_Exp>;
  account_image?: InputMaybe<String_Comparison_Exp>;
  account_label?: InputMaybe<String_Comparison_Exp>;
  active_position_count?: InputMaybe<Bigint_Comparison_Exp>;
  best_trade_pnl_formatted?: InputMaybe<Numeric_Comparison_Exp>;
  best_trade_pnl_raw?: InputMaybe<Numeric_Comparison_Exp>;
  current_equity_value_formatted?: InputMaybe<Numeric_Comparison_Exp>;
  current_equity_value_raw?: InputMaybe<Numeric_Comparison_Exp>;
  first_position_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  last_activity_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  losing_positions?: InputMaybe<Bigint_Comparison_Exp>;
  pnl_change_formatted?: InputMaybe<Numeric_Comparison_Exp>;
  pnl_change_raw?: InputMaybe<Numeric_Comparison_Exp>;
  pnl_pct?: InputMaybe<Numeric_Comparison_Exp>;
  rank?: InputMaybe<Bigint_Comparison_Exp>;
  realized_pnl_formatted?: InputMaybe<Numeric_Comparison_Exp>;
  realized_pnl_pct?: InputMaybe<Numeric_Comparison_Exp>;
  realized_pnl_raw?: InputMaybe<Numeric_Comparison_Exp>;
  redeemable_assets_formatted?: InputMaybe<Numeric_Comparison_Exp>;
  redeemable_assets_raw?: InputMaybe<Numeric_Comparison_Exp>;
  total_deposits_formatted?: InputMaybe<Numeric_Comparison_Exp>;
  total_deposits_raw?: InputMaybe<Numeric_Comparison_Exp>;
  total_pnl_formatted?: InputMaybe<Numeric_Comparison_Exp>;
  total_pnl_raw?: InputMaybe<Numeric_Comparison_Exp>;
  total_position_count?: InputMaybe<Bigint_Comparison_Exp>;
  total_redemptions_formatted?: InputMaybe<Numeric_Comparison_Exp>;
  total_redemptions_raw?: InputMaybe<Numeric_Comparison_Exp>;
  total_volume_formatted?: InputMaybe<Numeric_Comparison_Exp>;
  total_volume_raw?: InputMaybe<Numeric_Comparison_Exp>;
  unrealized_pnl_formatted?: InputMaybe<Numeric_Comparison_Exp>;
  unrealized_pnl_pct?: InputMaybe<Numeric_Comparison_Exp>;
  unrealized_pnl_raw?: InputMaybe<Numeric_Comparison_Exp>;
  win_rate?: InputMaybe<Numeric_Comparison_Exp>;
  winning_positions?: InputMaybe<Bigint_Comparison_Exp>;
  worst_trade_pnl_formatted?: InputMaybe<Numeric_Comparison_Exp>;
  worst_trade_pnl_raw?: InputMaybe<Numeric_Comparison_Exp>;
};

/** aggregate max on columns */
export type Pnl_Leaderboard_Entry_Max_Fields = {
  __typename?: 'pnl_leaderboard_entry_max_fields';
  account_id?: Maybe<Scalars['String']['output']>;
  account_image?: Maybe<Scalars['String']['output']>;
  account_label?: Maybe<Scalars['String']['output']>;
  active_position_count?: Maybe<Scalars['bigint']['output']>;
  best_trade_pnl_formatted?: Maybe<Scalars['numeric']['output']>;
  best_trade_pnl_raw?: Maybe<Scalars['numeric']['output']>;
  current_equity_value_formatted?: Maybe<Scalars['numeric']['output']>;
  current_equity_value_raw?: Maybe<Scalars['numeric']['output']>;
  first_position_at?: Maybe<Scalars['timestamptz']['output']>;
  last_activity_at?: Maybe<Scalars['timestamptz']['output']>;
  losing_positions?: Maybe<Scalars['bigint']['output']>;
  pnl_change_formatted?: Maybe<Scalars['numeric']['output']>;
  pnl_change_raw?: Maybe<Scalars['numeric']['output']>;
  pnl_pct?: Maybe<Scalars['numeric']['output']>;
  rank?: Maybe<Scalars['bigint']['output']>;
  realized_pnl_formatted?: Maybe<Scalars['numeric']['output']>;
  realized_pnl_pct?: Maybe<Scalars['numeric']['output']>;
  realized_pnl_raw?: Maybe<Scalars['numeric']['output']>;
  redeemable_assets_formatted?: Maybe<Scalars['numeric']['output']>;
  redeemable_assets_raw?: Maybe<Scalars['numeric']['output']>;
  total_deposits_formatted?: Maybe<Scalars['numeric']['output']>;
  total_deposits_raw?: Maybe<Scalars['numeric']['output']>;
  total_pnl_formatted?: Maybe<Scalars['numeric']['output']>;
  total_pnl_raw?: Maybe<Scalars['numeric']['output']>;
  total_position_count?: Maybe<Scalars['bigint']['output']>;
  total_redemptions_formatted?: Maybe<Scalars['numeric']['output']>;
  total_redemptions_raw?: Maybe<Scalars['numeric']['output']>;
  total_volume_formatted?: Maybe<Scalars['numeric']['output']>;
  total_volume_raw?: Maybe<Scalars['numeric']['output']>;
  unrealized_pnl_formatted?: Maybe<Scalars['numeric']['output']>;
  unrealized_pnl_pct?: Maybe<Scalars['numeric']['output']>;
  unrealized_pnl_raw?: Maybe<Scalars['numeric']['output']>;
  win_rate?: Maybe<Scalars['numeric']['output']>;
  winning_positions?: Maybe<Scalars['bigint']['output']>;
  worst_trade_pnl_formatted?: Maybe<Scalars['numeric']['output']>;
  worst_trade_pnl_raw?: Maybe<Scalars['numeric']['output']>;
};

/** aggregate min on columns */
export type Pnl_Leaderboard_Entry_Min_Fields = {
  __typename?: 'pnl_leaderboard_entry_min_fields';
  account_id?: Maybe<Scalars['String']['output']>;
  account_image?: Maybe<Scalars['String']['output']>;
  account_label?: Maybe<Scalars['String']['output']>;
  active_position_count?: Maybe<Scalars['bigint']['output']>;
  best_trade_pnl_formatted?: Maybe<Scalars['numeric']['output']>;
  best_trade_pnl_raw?: Maybe<Scalars['numeric']['output']>;
  current_equity_value_formatted?: Maybe<Scalars['numeric']['output']>;
  current_equity_value_raw?: Maybe<Scalars['numeric']['output']>;
  first_position_at?: Maybe<Scalars['timestamptz']['output']>;
  last_activity_at?: Maybe<Scalars['timestamptz']['output']>;
  losing_positions?: Maybe<Scalars['bigint']['output']>;
  pnl_change_formatted?: Maybe<Scalars['numeric']['output']>;
  pnl_change_raw?: Maybe<Scalars['numeric']['output']>;
  pnl_pct?: Maybe<Scalars['numeric']['output']>;
  rank?: Maybe<Scalars['bigint']['output']>;
  realized_pnl_formatted?: Maybe<Scalars['numeric']['output']>;
  realized_pnl_pct?: Maybe<Scalars['numeric']['output']>;
  realized_pnl_raw?: Maybe<Scalars['numeric']['output']>;
  redeemable_assets_formatted?: Maybe<Scalars['numeric']['output']>;
  redeemable_assets_raw?: Maybe<Scalars['numeric']['output']>;
  total_deposits_formatted?: Maybe<Scalars['numeric']['output']>;
  total_deposits_raw?: Maybe<Scalars['numeric']['output']>;
  total_pnl_formatted?: Maybe<Scalars['numeric']['output']>;
  total_pnl_raw?: Maybe<Scalars['numeric']['output']>;
  total_position_count?: Maybe<Scalars['bigint']['output']>;
  total_redemptions_formatted?: Maybe<Scalars['numeric']['output']>;
  total_redemptions_raw?: Maybe<Scalars['numeric']['output']>;
  total_volume_formatted?: Maybe<Scalars['numeric']['output']>;
  total_volume_raw?: Maybe<Scalars['numeric']['output']>;
  unrealized_pnl_formatted?: Maybe<Scalars['numeric']['output']>;
  unrealized_pnl_pct?: Maybe<Scalars['numeric']['output']>;
  unrealized_pnl_raw?: Maybe<Scalars['numeric']['output']>;
  win_rate?: Maybe<Scalars['numeric']['output']>;
  winning_positions?: Maybe<Scalars['bigint']['output']>;
  worst_trade_pnl_formatted?: Maybe<Scalars['numeric']['output']>;
  worst_trade_pnl_raw?: Maybe<Scalars['numeric']['output']>;
};

/** Ordering options when selecting data from "pnl_leaderboard_entry". */
export type Pnl_Leaderboard_Entry_Order_By = {
  account_id?: InputMaybe<Order_By>;
  account_image?: InputMaybe<Order_By>;
  account_label?: InputMaybe<Order_By>;
  active_position_count?: InputMaybe<Order_By>;
  best_trade_pnl_formatted?: InputMaybe<Order_By>;
  best_trade_pnl_raw?: InputMaybe<Order_By>;
  current_equity_value_formatted?: InputMaybe<Order_By>;
  current_equity_value_raw?: InputMaybe<Order_By>;
  first_position_at?: InputMaybe<Order_By>;
  last_activity_at?: InputMaybe<Order_By>;
  losing_positions?: InputMaybe<Order_By>;
  pnl_change_formatted?: InputMaybe<Order_By>;
  pnl_change_raw?: InputMaybe<Order_By>;
  pnl_pct?: InputMaybe<Order_By>;
  rank?: InputMaybe<Order_By>;
  realized_pnl_formatted?: InputMaybe<Order_By>;
  realized_pnl_pct?: InputMaybe<Order_By>;
  realized_pnl_raw?: InputMaybe<Order_By>;
  redeemable_assets_formatted?: InputMaybe<Order_By>;
  redeemable_assets_raw?: InputMaybe<Order_By>;
  total_deposits_formatted?: InputMaybe<Order_By>;
  total_deposits_raw?: InputMaybe<Order_By>;
  total_pnl_formatted?: InputMaybe<Order_By>;
  total_pnl_raw?: InputMaybe<Order_By>;
  total_position_count?: InputMaybe<Order_By>;
  total_redemptions_formatted?: InputMaybe<Order_By>;
  total_redemptions_raw?: InputMaybe<Order_By>;
  total_volume_formatted?: InputMaybe<Order_By>;
  total_volume_raw?: InputMaybe<Order_By>;
  unrealized_pnl_formatted?: InputMaybe<Order_By>;
  unrealized_pnl_pct?: InputMaybe<Order_By>;
  unrealized_pnl_raw?: InputMaybe<Order_By>;
  win_rate?: InputMaybe<Order_By>;
  winning_positions?: InputMaybe<Order_By>;
  worst_trade_pnl_formatted?: InputMaybe<Order_By>;
  worst_trade_pnl_raw?: InputMaybe<Order_By>;
};

/** select columns of table "pnl_leaderboard_entry" */
export type Pnl_Leaderboard_Entry_Select_Column =
  /** column name */
  | 'account_id'
  /** column name */
  | 'account_image'
  /** column name */
  | 'account_label'
  /** column name */
  | 'active_position_count'
  /** column name */
  | 'best_trade_pnl_formatted'
  /** column name */
  | 'best_trade_pnl_raw'
  /** column name */
  | 'current_equity_value_formatted'
  /** column name */
  | 'current_equity_value_raw'
  /** column name */
  | 'first_position_at'
  /** column name */
  | 'last_activity_at'
  /** column name */
  | 'losing_positions'
  /** column name */
  | 'pnl_change_formatted'
  /** column name */
  | 'pnl_change_raw'
  /** column name */
  | 'pnl_pct'
  /** column name */
  | 'rank'
  /** column name */
  | 'realized_pnl_formatted'
  /** column name */
  | 'realized_pnl_pct'
  /** column name */
  | 'realized_pnl_raw'
  /** column name */
  | 'redeemable_assets_formatted'
  /** column name */
  | 'redeemable_assets_raw'
  /** column name */
  | 'total_deposits_formatted'
  /** column name */
  | 'total_deposits_raw'
  /** column name */
  | 'total_pnl_formatted'
  /** column name */
  | 'total_pnl_raw'
  /** column name */
  | 'total_position_count'
  /** column name */
  | 'total_redemptions_formatted'
  /** column name */
  | 'total_redemptions_raw'
  /** column name */
  | 'total_volume_formatted'
  /** column name */
  | 'total_volume_raw'
  /** column name */
  | 'unrealized_pnl_formatted'
  /** column name */
  | 'unrealized_pnl_pct'
  /** column name */
  | 'unrealized_pnl_raw'
  /** column name */
  | 'win_rate'
  /** column name */
  | 'winning_positions'
  /** column name */
  | 'worst_trade_pnl_formatted'
  /** column name */
  | 'worst_trade_pnl_raw';

/** aggregate stddev on columns */
export type Pnl_Leaderboard_Entry_Stddev_Fields = {
  __typename?: 'pnl_leaderboard_entry_stddev_fields';
  active_position_count?: Maybe<Scalars['Float']['output']>;
  best_trade_pnl_formatted?: Maybe<Scalars['Float']['output']>;
  best_trade_pnl_raw?: Maybe<Scalars['Float']['output']>;
  current_equity_value_formatted?: Maybe<Scalars['Float']['output']>;
  current_equity_value_raw?: Maybe<Scalars['Float']['output']>;
  losing_positions?: Maybe<Scalars['Float']['output']>;
  pnl_change_formatted?: Maybe<Scalars['Float']['output']>;
  pnl_change_raw?: Maybe<Scalars['Float']['output']>;
  pnl_pct?: Maybe<Scalars['Float']['output']>;
  rank?: Maybe<Scalars['Float']['output']>;
  realized_pnl_formatted?: Maybe<Scalars['Float']['output']>;
  realized_pnl_pct?: Maybe<Scalars['Float']['output']>;
  realized_pnl_raw?: Maybe<Scalars['Float']['output']>;
  redeemable_assets_formatted?: Maybe<Scalars['Float']['output']>;
  redeemable_assets_raw?: Maybe<Scalars['Float']['output']>;
  total_deposits_formatted?: Maybe<Scalars['Float']['output']>;
  total_deposits_raw?: Maybe<Scalars['Float']['output']>;
  total_pnl_formatted?: Maybe<Scalars['Float']['output']>;
  total_pnl_raw?: Maybe<Scalars['Float']['output']>;
  total_position_count?: Maybe<Scalars['Float']['output']>;
  total_redemptions_formatted?: Maybe<Scalars['Float']['output']>;
  total_redemptions_raw?: Maybe<Scalars['Float']['output']>;
  total_volume_formatted?: Maybe<Scalars['Float']['output']>;
  total_volume_raw?: Maybe<Scalars['Float']['output']>;
  unrealized_pnl_formatted?: Maybe<Scalars['Float']['output']>;
  unrealized_pnl_pct?: Maybe<Scalars['Float']['output']>;
  unrealized_pnl_raw?: Maybe<Scalars['Float']['output']>;
  win_rate?: Maybe<Scalars['Float']['output']>;
  winning_positions?: Maybe<Scalars['Float']['output']>;
  worst_trade_pnl_formatted?: Maybe<Scalars['Float']['output']>;
  worst_trade_pnl_raw?: Maybe<Scalars['Float']['output']>;
};

/** aggregate stddev_pop on columns */
export type Pnl_Leaderboard_Entry_Stddev_Pop_Fields = {
  __typename?: 'pnl_leaderboard_entry_stddev_pop_fields';
  active_position_count?: Maybe<Scalars['Float']['output']>;
  best_trade_pnl_formatted?: Maybe<Scalars['Float']['output']>;
  best_trade_pnl_raw?: Maybe<Scalars['Float']['output']>;
  current_equity_value_formatted?: Maybe<Scalars['Float']['output']>;
  current_equity_value_raw?: Maybe<Scalars['Float']['output']>;
  losing_positions?: Maybe<Scalars['Float']['output']>;
  pnl_change_formatted?: Maybe<Scalars['Float']['output']>;
  pnl_change_raw?: Maybe<Scalars['Float']['output']>;
  pnl_pct?: Maybe<Scalars['Float']['output']>;
  rank?: Maybe<Scalars['Float']['output']>;
  realized_pnl_formatted?: Maybe<Scalars['Float']['output']>;
  realized_pnl_pct?: Maybe<Scalars['Float']['output']>;
  realized_pnl_raw?: Maybe<Scalars['Float']['output']>;
  redeemable_assets_formatted?: Maybe<Scalars['Float']['output']>;
  redeemable_assets_raw?: Maybe<Scalars['Float']['output']>;
  total_deposits_formatted?: Maybe<Scalars['Float']['output']>;
  total_deposits_raw?: Maybe<Scalars['Float']['output']>;
  total_pnl_formatted?: Maybe<Scalars['Float']['output']>;
  total_pnl_raw?: Maybe<Scalars['Float']['output']>;
  total_position_count?: Maybe<Scalars['Float']['output']>;
  total_redemptions_formatted?: Maybe<Scalars['Float']['output']>;
  total_redemptions_raw?: Maybe<Scalars['Float']['output']>;
  total_volume_formatted?: Maybe<Scalars['Float']['output']>;
  total_volume_raw?: Maybe<Scalars['Float']['output']>;
  unrealized_pnl_formatted?: Maybe<Scalars['Float']['output']>;
  unrealized_pnl_pct?: Maybe<Scalars['Float']['output']>;
  unrealized_pnl_raw?: Maybe<Scalars['Float']['output']>;
  win_rate?: Maybe<Scalars['Float']['output']>;
  winning_positions?: Maybe<Scalars['Float']['output']>;
  worst_trade_pnl_formatted?: Maybe<Scalars['Float']['output']>;
  worst_trade_pnl_raw?: Maybe<Scalars['Float']['output']>;
};

/** aggregate stddev_samp on columns */
export type Pnl_Leaderboard_Entry_Stddev_Samp_Fields = {
  __typename?: 'pnl_leaderboard_entry_stddev_samp_fields';
  active_position_count?: Maybe<Scalars['Float']['output']>;
  best_trade_pnl_formatted?: Maybe<Scalars['Float']['output']>;
  best_trade_pnl_raw?: Maybe<Scalars['Float']['output']>;
  current_equity_value_formatted?: Maybe<Scalars['Float']['output']>;
  current_equity_value_raw?: Maybe<Scalars['Float']['output']>;
  losing_positions?: Maybe<Scalars['Float']['output']>;
  pnl_change_formatted?: Maybe<Scalars['Float']['output']>;
  pnl_change_raw?: Maybe<Scalars['Float']['output']>;
  pnl_pct?: Maybe<Scalars['Float']['output']>;
  rank?: Maybe<Scalars['Float']['output']>;
  realized_pnl_formatted?: Maybe<Scalars['Float']['output']>;
  realized_pnl_pct?: Maybe<Scalars['Float']['output']>;
  realized_pnl_raw?: Maybe<Scalars['Float']['output']>;
  redeemable_assets_formatted?: Maybe<Scalars['Float']['output']>;
  redeemable_assets_raw?: Maybe<Scalars['Float']['output']>;
  total_deposits_formatted?: Maybe<Scalars['Float']['output']>;
  total_deposits_raw?: Maybe<Scalars['Float']['output']>;
  total_pnl_formatted?: Maybe<Scalars['Float']['output']>;
  total_pnl_raw?: Maybe<Scalars['Float']['output']>;
  total_position_count?: Maybe<Scalars['Float']['output']>;
  total_redemptions_formatted?: Maybe<Scalars['Float']['output']>;
  total_redemptions_raw?: Maybe<Scalars['Float']['output']>;
  total_volume_formatted?: Maybe<Scalars['Float']['output']>;
  total_volume_raw?: Maybe<Scalars['Float']['output']>;
  unrealized_pnl_formatted?: Maybe<Scalars['Float']['output']>;
  unrealized_pnl_pct?: Maybe<Scalars['Float']['output']>;
  unrealized_pnl_raw?: Maybe<Scalars['Float']['output']>;
  win_rate?: Maybe<Scalars['Float']['output']>;
  winning_positions?: Maybe<Scalars['Float']['output']>;
  worst_trade_pnl_formatted?: Maybe<Scalars['Float']['output']>;
  worst_trade_pnl_raw?: Maybe<Scalars['Float']['output']>;
};

/** Streaming cursor of the table "pnl_leaderboard_entry" */
export type Pnl_Leaderboard_Entry_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Pnl_Leaderboard_Entry_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Pnl_Leaderboard_Entry_Stream_Cursor_Value_Input = {
  account_id?: InputMaybe<Scalars['String']['input']>;
  account_image?: InputMaybe<Scalars['String']['input']>;
  account_label?: InputMaybe<Scalars['String']['input']>;
  active_position_count?: InputMaybe<Scalars['bigint']['input']>;
  best_trade_pnl_formatted?: InputMaybe<Scalars['numeric']['input']>;
  best_trade_pnl_raw?: InputMaybe<Scalars['numeric']['input']>;
  current_equity_value_formatted?: InputMaybe<Scalars['numeric']['input']>;
  current_equity_value_raw?: InputMaybe<Scalars['numeric']['input']>;
  first_position_at?: InputMaybe<Scalars['timestamptz']['input']>;
  last_activity_at?: InputMaybe<Scalars['timestamptz']['input']>;
  losing_positions?: InputMaybe<Scalars['bigint']['input']>;
  pnl_change_formatted?: InputMaybe<Scalars['numeric']['input']>;
  pnl_change_raw?: InputMaybe<Scalars['numeric']['input']>;
  pnl_pct?: InputMaybe<Scalars['numeric']['input']>;
  rank?: InputMaybe<Scalars['bigint']['input']>;
  realized_pnl_formatted?: InputMaybe<Scalars['numeric']['input']>;
  realized_pnl_pct?: InputMaybe<Scalars['numeric']['input']>;
  realized_pnl_raw?: InputMaybe<Scalars['numeric']['input']>;
  redeemable_assets_formatted?: InputMaybe<Scalars['numeric']['input']>;
  redeemable_assets_raw?: InputMaybe<Scalars['numeric']['input']>;
  total_deposits_formatted?: InputMaybe<Scalars['numeric']['input']>;
  total_deposits_raw?: InputMaybe<Scalars['numeric']['input']>;
  total_pnl_formatted?: InputMaybe<Scalars['numeric']['input']>;
  total_pnl_raw?: InputMaybe<Scalars['numeric']['input']>;
  total_position_count?: InputMaybe<Scalars['bigint']['input']>;
  total_redemptions_formatted?: InputMaybe<Scalars['numeric']['input']>;
  total_redemptions_raw?: InputMaybe<Scalars['numeric']['input']>;
  total_volume_formatted?: InputMaybe<Scalars['numeric']['input']>;
  total_volume_raw?: InputMaybe<Scalars['numeric']['input']>;
  unrealized_pnl_formatted?: InputMaybe<Scalars['numeric']['input']>;
  unrealized_pnl_pct?: InputMaybe<Scalars['numeric']['input']>;
  unrealized_pnl_raw?: InputMaybe<Scalars['numeric']['input']>;
  win_rate?: InputMaybe<Scalars['numeric']['input']>;
  winning_positions?: InputMaybe<Scalars['bigint']['input']>;
  worst_trade_pnl_formatted?: InputMaybe<Scalars['numeric']['input']>;
  worst_trade_pnl_raw?: InputMaybe<Scalars['numeric']['input']>;
};

/** aggregate sum on columns */
export type Pnl_Leaderboard_Entry_Sum_Fields = {
  __typename?: 'pnl_leaderboard_entry_sum_fields';
  active_position_count?: Maybe<Scalars['bigint']['output']>;
  best_trade_pnl_formatted?: Maybe<Scalars['numeric']['output']>;
  best_trade_pnl_raw?: Maybe<Scalars['numeric']['output']>;
  current_equity_value_formatted?: Maybe<Scalars['numeric']['output']>;
  current_equity_value_raw?: Maybe<Scalars['numeric']['output']>;
  losing_positions?: Maybe<Scalars['bigint']['output']>;
  pnl_change_formatted?: Maybe<Scalars['numeric']['output']>;
  pnl_change_raw?: Maybe<Scalars['numeric']['output']>;
  pnl_pct?: Maybe<Scalars['numeric']['output']>;
  rank?: Maybe<Scalars['bigint']['output']>;
  realized_pnl_formatted?: Maybe<Scalars['numeric']['output']>;
  realized_pnl_pct?: Maybe<Scalars['numeric']['output']>;
  realized_pnl_raw?: Maybe<Scalars['numeric']['output']>;
  redeemable_assets_formatted?: Maybe<Scalars['numeric']['output']>;
  redeemable_assets_raw?: Maybe<Scalars['numeric']['output']>;
  total_deposits_formatted?: Maybe<Scalars['numeric']['output']>;
  total_deposits_raw?: Maybe<Scalars['numeric']['output']>;
  total_pnl_formatted?: Maybe<Scalars['numeric']['output']>;
  total_pnl_raw?: Maybe<Scalars['numeric']['output']>;
  total_position_count?: Maybe<Scalars['bigint']['output']>;
  total_redemptions_formatted?: Maybe<Scalars['numeric']['output']>;
  total_redemptions_raw?: Maybe<Scalars['numeric']['output']>;
  total_volume_formatted?: Maybe<Scalars['numeric']['output']>;
  total_volume_raw?: Maybe<Scalars['numeric']['output']>;
  unrealized_pnl_formatted?: Maybe<Scalars['numeric']['output']>;
  unrealized_pnl_pct?: Maybe<Scalars['numeric']['output']>;
  unrealized_pnl_raw?: Maybe<Scalars['numeric']['output']>;
  win_rate?: Maybe<Scalars['numeric']['output']>;
  winning_positions?: Maybe<Scalars['bigint']['output']>;
  worst_trade_pnl_formatted?: Maybe<Scalars['numeric']['output']>;
  worst_trade_pnl_raw?: Maybe<Scalars['numeric']['output']>;
};

/** aggregate var_pop on columns */
export type Pnl_Leaderboard_Entry_Var_Pop_Fields = {
  __typename?: 'pnl_leaderboard_entry_var_pop_fields';
  active_position_count?: Maybe<Scalars['Float']['output']>;
  best_trade_pnl_formatted?: Maybe<Scalars['Float']['output']>;
  best_trade_pnl_raw?: Maybe<Scalars['Float']['output']>;
  current_equity_value_formatted?: Maybe<Scalars['Float']['output']>;
  current_equity_value_raw?: Maybe<Scalars['Float']['output']>;
  losing_positions?: Maybe<Scalars['Float']['output']>;
  pnl_change_formatted?: Maybe<Scalars['Float']['output']>;
  pnl_change_raw?: Maybe<Scalars['Float']['output']>;
  pnl_pct?: Maybe<Scalars['Float']['output']>;
  rank?: Maybe<Scalars['Float']['output']>;
  realized_pnl_formatted?: Maybe<Scalars['Float']['output']>;
  realized_pnl_pct?: Maybe<Scalars['Float']['output']>;
  realized_pnl_raw?: Maybe<Scalars['Float']['output']>;
  redeemable_assets_formatted?: Maybe<Scalars['Float']['output']>;
  redeemable_assets_raw?: Maybe<Scalars['Float']['output']>;
  total_deposits_formatted?: Maybe<Scalars['Float']['output']>;
  total_deposits_raw?: Maybe<Scalars['Float']['output']>;
  total_pnl_formatted?: Maybe<Scalars['Float']['output']>;
  total_pnl_raw?: Maybe<Scalars['Float']['output']>;
  total_position_count?: Maybe<Scalars['Float']['output']>;
  total_redemptions_formatted?: Maybe<Scalars['Float']['output']>;
  total_redemptions_raw?: Maybe<Scalars['Float']['output']>;
  total_volume_formatted?: Maybe<Scalars['Float']['output']>;
  total_volume_raw?: Maybe<Scalars['Float']['output']>;
  unrealized_pnl_formatted?: Maybe<Scalars['Float']['output']>;
  unrealized_pnl_pct?: Maybe<Scalars['Float']['output']>;
  unrealized_pnl_raw?: Maybe<Scalars['Float']['output']>;
  win_rate?: Maybe<Scalars['Float']['output']>;
  winning_positions?: Maybe<Scalars['Float']['output']>;
  worst_trade_pnl_formatted?: Maybe<Scalars['Float']['output']>;
  worst_trade_pnl_raw?: Maybe<Scalars['Float']['output']>;
};

/** aggregate var_samp on columns */
export type Pnl_Leaderboard_Entry_Var_Samp_Fields = {
  __typename?: 'pnl_leaderboard_entry_var_samp_fields';
  active_position_count?: Maybe<Scalars['Float']['output']>;
  best_trade_pnl_formatted?: Maybe<Scalars['Float']['output']>;
  best_trade_pnl_raw?: Maybe<Scalars['Float']['output']>;
  current_equity_value_formatted?: Maybe<Scalars['Float']['output']>;
  current_equity_value_raw?: Maybe<Scalars['Float']['output']>;
  losing_positions?: Maybe<Scalars['Float']['output']>;
  pnl_change_formatted?: Maybe<Scalars['Float']['output']>;
  pnl_change_raw?: Maybe<Scalars['Float']['output']>;
  pnl_pct?: Maybe<Scalars['Float']['output']>;
  rank?: Maybe<Scalars['Float']['output']>;
  realized_pnl_formatted?: Maybe<Scalars['Float']['output']>;
  realized_pnl_pct?: Maybe<Scalars['Float']['output']>;
  realized_pnl_raw?: Maybe<Scalars['Float']['output']>;
  redeemable_assets_formatted?: Maybe<Scalars['Float']['output']>;
  redeemable_assets_raw?: Maybe<Scalars['Float']['output']>;
  total_deposits_formatted?: Maybe<Scalars['Float']['output']>;
  total_deposits_raw?: Maybe<Scalars['Float']['output']>;
  total_pnl_formatted?: Maybe<Scalars['Float']['output']>;
  total_pnl_raw?: Maybe<Scalars['Float']['output']>;
  total_position_count?: Maybe<Scalars['Float']['output']>;
  total_redemptions_formatted?: Maybe<Scalars['Float']['output']>;
  total_redemptions_raw?: Maybe<Scalars['Float']['output']>;
  total_volume_formatted?: Maybe<Scalars['Float']['output']>;
  total_volume_raw?: Maybe<Scalars['Float']['output']>;
  unrealized_pnl_formatted?: Maybe<Scalars['Float']['output']>;
  unrealized_pnl_pct?: Maybe<Scalars['Float']['output']>;
  unrealized_pnl_raw?: Maybe<Scalars['Float']['output']>;
  win_rate?: Maybe<Scalars['Float']['output']>;
  winning_positions?: Maybe<Scalars['Float']['output']>;
  worst_trade_pnl_formatted?: Maybe<Scalars['Float']['output']>;
  worst_trade_pnl_raw?: Maybe<Scalars['Float']['output']>;
};

/** aggregate variance on columns */
export type Pnl_Leaderboard_Entry_Variance_Fields = {
  __typename?: 'pnl_leaderboard_entry_variance_fields';
  active_position_count?: Maybe<Scalars['Float']['output']>;
  best_trade_pnl_formatted?: Maybe<Scalars['Float']['output']>;
  best_trade_pnl_raw?: Maybe<Scalars['Float']['output']>;
  current_equity_value_formatted?: Maybe<Scalars['Float']['output']>;
  current_equity_value_raw?: Maybe<Scalars['Float']['output']>;
  losing_positions?: Maybe<Scalars['Float']['output']>;
  pnl_change_formatted?: Maybe<Scalars['Float']['output']>;
  pnl_change_raw?: Maybe<Scalars['Float']['output']>;
  pnl_pct?: Maybe<Scalars['Float']['output']>;
  rank?: Maybe<Scalars['Float']['output']>;
  realized_pnl_formatted?: Maybe<Scalars['Float']['output']>;
  realized_pnl_pct?: Maybe<Scalars['Float']['output']>;
  realized_pnl_raw?: Maybe<Scalars['Float']['output']>;
  redeemable_assets_formatted?: Maybe<Scalars['Float']['output']>;
  redeemable_assets_raw?: Maybe<Scalars['Float']['output']>;
  total_deposits_formatted?: Maybe<Scalars['Float']['output']>;
  total_deposits_raw?: Maybe<Scalars['Float']['output']>;
  total_pnl_formatted?: Maybe<Scalars['Float']['output']>;
  total_pnl_raw?: Maybe<Scalars['Float']['output']>;
  total_position_count?: Maybe<Scalars['Float']['output']>;
  total_redemptions_formatted?: Maybe<Scalars['Float']['output']>;
  total_redemptions_raw?: Maybe<Scalars['Float']['output']>;
  total_volume_formatted?: Maybe<Scalars['Float']['output']>;
  total_volume_raw?: Maybe<Scalars['Float']['output']>;
  unrealized_pnl_formatted?: Maybe<Scalars['Float']['output']>;
  unrealized_pnl_pct?: Maybe<Scalars['Float']['output']>;
  unrealized_pnl_raw?: Maybe<Scalars['Float']['output']>;
  win_rate?: Maybe<Scalars['Float']['output']>;
  winning_positions?: Maybe<Scalars['Float']['output']>;
  worst_trade_pnl_formatted?: Maybe<Scalars['Float']['output']>;
  worst_trade_pnl_raw?: Maybe<Scalars['Float']['output']>;
};

/** columns and relationships of "pnl_leaderboard_stats" */
export type Pnl_Leaderboard_Stats = {
  __typename?: 'pnl_leaderboard_stats';
  avg_pnl_formatted?: Maybe<Scalars['numeric']['output']>;
  avg_pnl_raw?: Maybe<Scalars['numeric']['output']>;
  avg_volume_formatted?: Maybe<Scalars['numeric']['output']>;
  avg_volume_raw?: Maybe<Scalars['numeric']['output']>;
  median_pnl_formatted?: Maybe<Scalars['numeric']['output']>;
  median_pnl_raw?: Maybe<Scalars['numeric']['output']>;
  profitable_pct?: Maybe<Scalars['numeric']['output']>;
  profitable_traders?: Maybe<Scalars['bigint']['output']>;
  total_pnl_sum_formatted?: Maybe<Scalars['numeric']['output']>;
  total_pnl_sum_raw?: Maybe<Scalars['numeric']['output']>;
  total_traders?: Maybe<Scalars['bigint']['output']>;
  total_volume_formatted?: Maybe<Scalars['numeric']['output']>;
  total_volume_raw?: Maybe<Scalars['numeric']['output']>;
  unprofitable_traders?: Maybe<Scalars['bigint']['output']>;
};

export type Pnl_Leaderboard_Stats_Aggregate = {
  __typename?: 'pnl_leaderboard_stats_aggregate';
  aggregate?: Maybe<Pnl_Leaderboard_Stats_Aggregate_Fields>;
  nodes: Array<Pnl_Leaderboard_Stats>;
};

/** aggregate fields of "pnl_leaderboard_stats" */
export type Pnl_Leaderboard_Stats_Aggregate_Fields = {
  __typename?: 'pnl_leaderboard_stats_aggregate_fields';
  avg?: Maybe<Pnl_Leaderboard_Stats_Avg_Fields>;
  count: Scalars['Int']['output'];
  max?: Maybe<Pnl_Leaderboard_Stats_Max_Fields>;
  min?: Maybe<Pnl_Leaderboard_Stats_Min_Fields>;
  stddev?: Maybe<Pnl_Leaderboard_Stats_Stddev_Fields>;
  stddev_pop?: Maybe<Pnl_Leaderboard_Stats_Stddev_Pop_Fields>;
  stddev_samp?: Maybe<Pnl_Leaderboard_Stats_Stddev_Samp_Fields>;
  sum?: Maybe<Pnl_Leaderboard_Stats_Sum_Fields>;
  var_pop?: Maybe<Pnl_Leaderboard_Stats_Var_Pop_Fields>;
  var_samp?: Maybe<Pnl_Leaderboard_Stats_Var_Samp_Fields>;
  variance?: Maybe<Pnl_Leaderboard_Stats_Variance_Fields>;
};


/** aggregate fields of "pnl_leaderboard_stats" */
export type Pnl_Leaderboard_Stats_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Pnl_Leaderboard_Stats_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
};

/** aggregate avg on columns */
export type Pnl_Leaderboard_Stats_Avg_Fields = {
  __typename?: 'pnl_leaderboard_stats_avg_fields';
  avg_pnl_formatted?: Maybe<Scalars['Float']['output']>;
  avg_pnl_raw?: Maybe<Scalars['Float']['output']>;
  avg_volume_formatted?: Maybe<Scalars['Float']['output']>;
  avg_volume_raw?: Maybe<Scalars['Float']['output']>;
  median_pnl_formatted?: Maybe<Scalars['Float']['output']>;
  median_pnl_raw?: Maybe<Scalars['Float']['output']>;
  profitable_pct?: Maybe<Scalars['Float']['output']>;
  profitable_traders?: Maybe<Scalars['Float']['output']>;
  total_pnl_sum_formatted?: Maybe<Scalars['Float']['output']>;
  total_pnl_sum_raw?: Maybe<Scalars['Float']['output']>;
  total_traders?: Maybe<Scalars['Float']['output']>;
  total_volume_formatted?: Maybe<Scalars['Float']['output']>;
  total_volume_raw?: Maybe<Scalars['Float']['output']>;
  unprofitable_traders?: Maybe<Scalars['Float']['output']>;
};

/** Boolean expression to filter rows from the table "pnl_leaderboard_stats". All fields are combined with a logical 'AND'. */
export type Pnl_Leaderboard_Stats_Bool_Exp = {
  _and?: InputMaybe<Array<Pnl_Leaderboard_Stats_Bool_Exp>>;
  _not?: InputMaybe<Pnl_Leaderboard_Stats_Bool_Exp>;
  _or?: InputMaybe<Array<Pnl_Leaderboard_Stats_Bool_Exp>>;
  avg_pnl_formatted?: InputMaybe<Numeric_Comparison_Exp>;
  avg_pnl_raw?: InputMaybe<Numeric_Comparison_Exp>;
  avg_volume_formatted?: InputMaybe<Numeric_Comparison_Exp>;
  avg_volume_raw?: InputMaybe<Numeric_Comparison_Exp>;
  median_pnl_formatted?: InputMaybe<Numeric_Comparison_Exp>;
  median_pnl_raw?: InputMaybe<Numeric_Comparison_Exp>;
  profitable_pct?: InputMaybe<Numeric_Comparison_Exp>;
  profitable_traders?: InputMaybe<Bigint_Comparison_Exp>;
  total_pnl_sum_formatted?: InputMaybe<Numeric_Comparison_Exp>;
  total_pnl_sum_raw?: InputMaybe<Numeric_Comparison_Exp>;
  total_traders?: InputMaybe<Bigint_Comparison_Exp>;
  total_volume_formatted?: InputMaybe<Numeric_Comparison_Exp>;
  total_volume_raw?: InputMaybe<Numeric_Comparison_Exp>;
  unprofitable_traders?: InputMaybe<Bigint_Comparison_Exp>;
};

/** aggregate max on columns */
export type Pnl_Leaderboard_Stats_Max_Fields = {
  __typename?: 'pnl_leaderboard_stats_max_fields';
  avg_pnl_formatted?: Maybe<Scalars['numeric']['output']>;
  avg_pnl_raw?: Maybe<Scalars['numeric']['output']>;
  avg_volume_formatted?: Maybe<Scalars['numeric']['output']>;
  avg_volume_raw?: Maybe<Scalars['numeric']['output']>;
  median_pnl_formatted?: Maybe<Scalars['numeric']['output']>;
  median_pnl_raw?: Maybe<Scalars['numeric']['output']>;
  profitable_pct?: Maybe<Scalars['numeric']['output']>;
  profitable_traders?: Maybe<Scalars['bigint']['output']>;
  total_pnl_sum_formatted?: Maybe<Scalars['numeric']['output']>;
  total_pnl_sum_raw?: Maybe<Scalars['numeric']['output']>;
  total_traders?: Maybe<Scalars['bigint']['output']>;
  total_volume_formatted?: Maybe<Scalars['numeric']['output']>;
  total_volume_raw?: Maybe<Scalars['numeric']['output']>;
  unprofitable_traders?: Maybe<Scalars['bigint']['output']>;
};

/** aggregate min on columns */
export type Pnl_Leaderboard_Stats_Min_Fields = {
  __typename?: 'pnl_leaderboard_stats_min_fields';
  avg_pnl_formatted?: Maybe<Scalars['numeric']['output']>;
  avg_pnl_raw?: Maybe<Scalars['numeric']['output']>;
  avg_volume_formatted?: Maybe<Scalars['numeric']['output']>;
  avg_volume_raw?: Maybe<Scalars['numeric']['output']>;
  median_pnl_formatted?: Maybe<Scalars['numeric']['output']>;
  median_pnl_raw?: Maybe<Scalars['numeric']['output']>;
  profitable_pct?: Maybe<Scalars['numeric']['output']>;
  profitable_traders?: Maybe<Scalars['bigint']['output']>;
  total_pnl_sum_formatted?: Maybe<Scalars['numeric']['output']>;
  total_pnl_sum_raw?: Maybe<Scalars['numeric']['output']>;
  total_traders?: Maybe<Scalars['bigint']['output']>;
  total_volume_formatted?: Maybe<Scalars['numeric']['output']>;
  total_volume_raw?: Maybe<Scalars['numeric']['output']>;
  unprofitable_traders?: Maybe<Scalars['bigint']['output']>;
};

/** Ordering options when selecting data from "pnl_leaderboard_stats". */
export type Pnl_Leaderboard_Stats_Order_By = {
  avg_pnl_formatted?: InputMaybe<Order_By>;
  avg_pnl_raw?: InputMaybe<Order_By>;
  avg_volume_formatted?: InputMaybe<Order_By>;
  avg_volume_raw?: InputMaybe<Order_By>;
  median_pnl_formatted?: InputMaybe<Order_By>;
  median_pnl_raw?: InputMaybe<Order_By>;
  profitable_pct?: InputMaybe<Order_By>;
  profitable_traders?: InputMaybe<Order_By>;
  total_pnl_sum_formatted?: InputMaybe<Order_By>;
  total_pnl_sum_raw?: InputMaybe<Order_By>;
  total_traders?: InputMaybe<Order_By>;
  total_volume_formatted?: InputMaybe<Order_By>;
  total_volume_raw?: InputMaybe<Order_By>;
  unprofitable_traders?: InputMaybe<Order_By>;
};

/** select columns of table "pnl_leaderboard_stats" */
export type Pnl_Leaderboard_Stats_Select_Column =
  /** column name */
  | 'avg_pnl_formatted'
  /** column name */
  | 'avg_pnl_raw'
  /** column name */
  | 'avg_volume_formatted'
  /** column name */
  | 'avg_volume_raw'
  /** column name */
  | 'median_pnl_formatted'
  /** column name */
  | 'median_pnl_raw'
  /** column name */
  | 'profitable_pct'
  /** column name */
  | 'profitable_traders'
  /** column name */
  | 'total_pnl_sum_formatted'
  /** column name */
  | 'total_pnl_sum_raw'
  /** column name */
  | 'total_traders'
  /** column name */
  | 'total_volume_formatted'
  /** column name */
  | 'total_volume_raw'
  /** column name */
  | 'unprofitable_traders';

/** aggregate stddev on columns */
export type Pnl_Leaderboard_Stats_Stddev_Fields = {
  __typename?: 'pnl_leaderboard_stats_stddev_fields';
  avg_pnl_formatted?: Maybe<Scalars['Float']['output']>;
  avg_pnl_raw?: Maybe<Scalars['Float']['output']>;
  avg_volume_formatted?: Maybe<Scalars['Float']['output']>;
  avg_volume_raw?: Maybe<Scalars['Float']['output']>;
  median_pnl_formatted?: Maybe<Scalars['Float']['output']>;
  median_pnl_raw?: Maybe<Scalars['Float']['output']>;
  profitable_pct?: Maybe<Scalars['Float']['output']>;
  profitable_traders?: Maybe<Scalars['Float']['output']>;
  total_pnl_sum_formatted?: Maybe<Scalars['Float']['output']>;
  total_pnl_sum_raw?: Maybe<Scalars['Float']['output']>;
  total_traders?: Maybe<Scalars['Float']['output']>;
  total_volume_formatted?: Maybe<Scalars['Float']['output']>;
  total_volume_raw?: Maybe<Scalars['Float']['output']>;
  unprofitable_traders?: Maybe<Scalars['Float']['output']>;
};

/** aggregate stddev_pop on columns */
export type Pnl_Leaderboard_Stats_Stddev_Pop_Fields = {
  __typename?: 'pnl_leaderboard_stats_stddev_pop_fields';
  avg_pnl_formatted?: Maybe<Scalars['Float']['output']>;
  avg_pnl_raw?: Maybe<Scalars['Float']['output']>;
  avg_volume_formatted?: Maybe<Scalars['Float']['output']>;
  avg_volume_raw?: Maybe<Scalars['Float']['output']>;
  median_pnl_formatted?: Maybe<Scalars['Float']['output']>;
  median_pnl_raw?: Maybe<Scalars['Float']['output']>;
  profitable_pct?: Maybe<Scalars['Float']['output']>;
  profitable_traders?: Maybe<Scalars['Float']['output']>;
  total_pnl_sum_formatted?: Maybe<Scalars['Float']['output']>;
  total_pnl_sum_raw?: Maybe<Scalars['Float']['output']>;
  total_traders?: Maybe<Scalars['Float']['output']>;
  total_volume_formatted?: Maybe<Scalars['Float']['output']>;
  total_volume_raw?: Maybe<Scalars['Float']['output']>;
  unprofitable_traders?: Maybe<Scalars['Float']['output']>;
};

/** aggregate stddev_samp on columns */
export type Pnl_Leaderboard_Stats_Stddev_Samp_Fields = {
  __typename?: 'pnl_leaderboard_stats_stddev_samp_fields';
  avg_pnl_formatted?: Maybe<Scalars['Float']['output']>;
  avg_pnl_raw?: Maybe<Scalars['Float']['output']>;
  avg_volume_formatted?: Maybe<Scalars['Float']['output']>;
  avg_volume_raw?: Maybe<Scalars['Float']['output']>;
  median_pnl_formatted?: Maybe<Scalars['Float']['output']>;
  median_pnl_raw?: Maybe<Scalars['Float']['output']>;
  profitable_pct?: Maybe<Scalars['Float']['output']>;
  profitable_traders?: Maybe<Scalars['Float']['output']>;
  total_pnl_sum_formatted?: Maybe<Scalars['Float']['output']>;
  total_pnl_sum_raw?: Maybe<Scalars['Float']['output']>;
  total_traders?: Maybe<Scalars['Float']['output']>;
  total_volume_formatted?: Maybe<Scalars['Float']['output']>;
  total_volume_raw?: Maybe<Scalars['Float']['output']>;
  unprofitable_traders?: Maybe<Scalars['Float']['output']>;
};

/** Streaming cursor of the table "pnl_leaderboard_stats" */
export type Pnl_Leaderboard_Stats_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Pnl_Leaderboard_Stats_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Pnl_Leaderboard_Stats_Stream_Cursor_Value_Input = {
  avg_pnl_formatted?: InputMaybe<Scalars['numeric']['input']>;
  avg_pnl_raw?: InputMaybe<Scalars['numeric']['input']>;
  avg_volume_formatted?: InputMaybe<Scalars['numeric']['input']>;
  avg_volume_raw?: InputMaybe<Scalars['numeric']['input']>;
  median_pnl_formatted?: InputMaybe<Scalars['numeric']['input']>;
  median_pnl_raw?: InputMaybe<Scalars['numeric']['input']>;
  profitable_pct?: InputMaybe<Scalars['numeric']['input']>;
  profitable_traders?: InputMaybe<Scalars['bigint']['input']>;
  total_pnl_sum_formatted?: InputMaybe<Scalars['numeric']['input']>;
  total_pnl_sum_raw?: InputMaybe<Scalars['numeric']['input']>;
  total_traders?: InputMaybe<Scalars['bigint']['input']>;
  total_volume_formatted?: InputMaybe<Scalars['numeric']['input']>;
  total_volume_raw?: InputMaybe<Scalars['numeric']['input']>;
  unprofitable_traders?: InputMaybe<Scalars['bigint']['input']>;
};

/** aggregate sum on columns */
export type Pnl_Leaderboard_Stats_Sum_Fields = {
  __typename?: 'pnl_leaderboard_stats_sum_fields';
  avg_pnl_formatted?: Maybe<Scalars['numeric']['output']>;
  avg_pnl_raw?: Maybe<Scalars['numeric']['output']>;
  avg_volume_formatted?: Maybe<Scalars['numeric']['output']>;
  avg_volume_raw?: Maybe<Scalars['numeric']['output']>;
  median_pnl_formatted?: Maybe<Scalars['numeric']['output']>;
  median_pnl_raw?: Maybe<Scalars['numeric']['output']>;
  profitable_pct?: Maybe<Scalars['numeric']['output']>;
  profitable_traders?: Maybe<Scalars['bigint']['output']>;
  total_pnl_sum_formatted?: Maybe<Scalars['numeric']['output']>;
  total_pnl_sum_raw?: Maybe<Scalars['numeric']['output']>;
  total_traders?: Maybe<Scalars['bigint']['output']>;
  total_volume_formatted?: Maybe<Scalars['numeric']['output']>;
  total_volume_raw?: Maybe<Scalars['numeric']['output']>;
  unprofitable_traders?: Maybe<Scalars['bigint']['output']>;
};

/** aggregate var_pop on columns */
export type Pnl_Leaderboard_Stats_Var_Pop_Fields = {
  __typename?: 'pnl_leaderboard_stats_var_pop_fields';
  avg_pnl_formatted?: Maybe<Scalars['Float']['output']>;
  avg_pnl_raw?: Maybe<Scalars['Float']['output']>;
  avg_volume_formatted?: Maybe<Scalars['Float']['output']>;
  avg_volume_raw?: Maybe<Scalars['Float']['output']>;
  median_pnl_formatted?: Maybe<Scalars['Float']['output']>;
  median_pnl_raw?: Maybe<Scalars['Float']['output']>;
  profitable_pct?: Maybe<Scalars['Float']['output']>;
  profitable_traders?: Maybe<Scalars['Float']['output']>;
  total_pnl_sum_formatted?: Maybe<Scalars['Float']['output']>;
  total_pnl_sum_raw?: Maybe<Scalars['Float']['output']>;
  total_traders?: Maybe<Scalars['Float']['output']>;
  total_volume_formatted?: Maybe<Scalars['Float']['output']>;
  total_volume_raw?: Maybe<Scalars['Float']['output']>;
  unprofitable_traders?: Maybe<Scalars['Float']['output']>;
};

/** aggregate var_samp on columns */
export type Pnl_Leaderboard_Stats_Var_Samp_Fields = {
  __typename?: 'pnl_leaderboard_stats_var_samp_fields';
  avg_pnl_formatted?: Maybe<Scalars['Float']['output']>;
  avg_pnl_raw?: Maybe<Scalars['Float']['output']>;
  avg_volume_formatted?: Maybe<Scalars['Float']['output']>;
  avg_volume_raw?: Maybe<Scalars['Float']['output']>;
  median_pnl_formatted?: Maybe<Scalars['Float']['output']>;
  median_pnl_raw?: Maybe<Scalars['Float']['output']>;
  profitable_pct?: Maybe<Scalars['Float']['output']>;
  profitable_traders?: Maybe<Scalars['Float']['output']>;
  total_pnl_sum_formatted?: Maybe<Scalars['Float']['output']>;
  total_pnl_sum_raw?: Maybe<Scalars['Float']['output']>;
  total_traders?: Maybe<Scalars['Float']['output']>;
  total_volume_formatted?: Maybe<Scalars['Float']['output']>;
  total_volume_raw?: Maybe<Scalars['Float']['output']>;
  unprofitable_traders?: Maybe<Scalars['Float']['output']>;
};

/** aggregate variance on columns */
export type Pnl_Leaderboard_Stats_Variance_Fields = {
  __typename?: 'pnl_leaderboard_stats_variance_fields';
  avg_pnl_formatted?: Maybe<Scalars['Float']['output']>;
  avg_pnl_raw?: Maybe<Scalars['Float']['output']>;
  avg_volume_formatted?: Maybe<Scalars['Float']['output']>;
  avg_volume_raw?: Maybe<Scalars['Float']['output']>;
  median_pnl_formatted?: Maybe<Scalars['Float']['output']>;
  median_pnl_raw?: Maybe<Scalars['Float']['output']>;
  profitable_pct?: Maybe<Scalars['Float']['output']>;
  profitable_traders?: Maybe<Scalars['Float']['output']>;
  total_pnl_sum_formatted?: Maybe<Scalars['Float']['output']>;
  total_pnl_sum_raw?: Maybe<Scalars['Float']['output']>;
  total_traders?: Maybe<Scalars['Float']['output']>;
  total_volume_formatted?: Maybe<Scalars['Float']['output']>;
  total_volume_raw?: Maybe<Scalars['Float']['output']>;
  unprofitable_traders?: Maybe<Scalars['Float']['output']>;
};

/** columns and relationships of "position_change_daily" */
export type Position_Change_Daily = {
  __typename?: 'position_change_daily';
  /** An object relationship */
  account?: Maybe<Accounts>;
  account_id?: Maybe<Scalars['String']['output']>;
  assets_in_period?: Maybe<Scalars['numeric']['output']>;
  assets_out_period?: Maybe<Scalars['numeric']['output']>;
  bucket?: Maybe<Scalars['timestamptz']['output']>;
  curve_id?: Maybe<Scalars['numeric']['output']>;
  shares_delta_period?: Maybe<Scalars['numeric']['output']>;
  /** An object relationship */
  term?: Maybe<Terms>;
  term_id?: Maybe<Scalars['String']['output']>;
  transaction_count?: Maybe<Scalars['numeric']['output']>;
  /** An object relationship */
  vault?: Maybe<Vaults>;
};

/** Boolean expression to filter rows from the table "position_change_daily". All fields are combined with a logical 'AND'. */
export type Position_Change_Daily_Bool_Exp = {
  _and?: InputMaybe<Array<Position_Change_Daily_Bool_Exp>>;
  _not?: InputMaybe<Position_Change_Daily_Bool_Exp>;
  _or?: InputMaybe<Array<Position_Change_Daily_Bool_Exp>>;
  account?: InputMaybe<Accounts_Bool_Exp>;
  account_id?: InputMaybe<String_Comparison_Exp>;
  assets_in_period?: InputMaybe<Numeric_Comparison_Exp>;
  assets_out_period?: InputMaybe<Numeric_Comparison_Exp>;
  bucket?: InputMaybe<Timestamptz_Comparison_Exp>;
  curve_id?: InputMaybe<Numeric_Comparison_Exp>;
  shares_delta_period?: InputMaybe<Numeric_Comparison_Exp>;
  term?: InputMaybe<Terms_Bool_Exp>;
  term_id?: InputMaybe<String_Comparison_Exp>;
  transaction_count?: InputMaybe<Numeric_Comparison_Exp>;
  vault?: InputMaybe<Vaults_Bool_Exp>;
};

/** Ordering options when selecting data from "position_change_daily". */
export type Position_Change_Daily_Order_By = {
  account?: InputMaybe<Accounts_Order_By>;
  account_id?: InputMaybe<Order_By>;
  assets_in_period?: InputMaybe<Order_By>;
  assets_out_period?: InputMaybe<Order_By>;
  bucket?: InputMaybe<Order_By>;
  curve_id?: InputMaybe<Order_By>;
  shares_delta_period?: InputMaybe<Order_By>;
  term?: InputMaybe<Terms_Order_By>;
  term_id?: InputMaybe<Order_By>;
  transaction_count?: InputMaybe<Order_By>;
  vault?: InputMaybe<Vaults_Order_By>;
};

/** select columns of table "position_change_daily" */
export type Position_Change_Daily_Select_Column =
  /** column name */
  | 'account_id'
  /** column name */
  | 'assets_in_period'
  /** column name */
  | 'assets_out_period'
  /** column name */
  | 'bucket'
  /** column name */
  | 'curve_id'
  /** column name */
  | 'shares_delta_period'
  /** column name */
  | 'term_id'
  /** column name */
  | 'transaction_count';

/** Streaming cursor of the table "position_change_daily" */
export type Position_Change_Daily_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Position_Change_Daily_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Position_Change_Daily_Stream_Cursor_Value_Input = {
  account_id?: InputMaybe<Scalars['String']['input']>;
  assets_in_period?: InputMaybe<Scalars['numeric']['input']>;
  assets_out_period?: InputMaybe<Scalars['numeric']['input']>;
  bucket?: InputMaybe<Scalars['timestamptz']['input']>;
  curve_id?: InputMaybe<Scalars['numeric']['input']>;
  shares_delta_period?: InputMaybe<Scalars['numeric']['input']>;
  term_id?: InputMaybe<Scalars['String']['input']>;
  transaction_count?: InputMaybe<Scalars['numeric']['input']>;
};

/** columns and relationships of "position_change_hourly" */
export type Position_Change_Hourly = {
  __typename?: 'position_change_hourly';
  /** An object relationship */
  account?: Maybe<Accounts>;
  account_id?: Maybe<Scalars['String']['output']>;
  assets_in_period?: Maybe<Scalars['numeric']['output']>;
  assets_out_period?: Maybe<Scalars['numeric']['output']>;
  bucket?: Maybe<Scalars['timestamptz']['output']>;
  curve_id?: Maybe<Scalars['numeric']['output']>;
  shares_delta_period?: Maybe<Scalars['numeric']['output']>;
  /** An object relationship */
  term?: Maybe<Terms>;
  term_id?: Maybe<Scalars['String']['output']>;
  transaction_count?: Maybe<Scalars['bigint']['output']>;
  /** An object relationship */
  vault?: Maybe<Vaults>;
};

/** Boolean expression to filter rows from the table "position_change_hourly". All fields are combined with a logical 'AND'. */
export type Position_Change_Hourly_Bool_Exp = {
  _and?: InputMaybe<Array<Position_Change_Hourly_Bool_Exp>>;
  _not?: InputMaybe<Position_Change_Hourly_Bool_Exp>;
  _or?: InputMaybe<Array<Position_Change_Hourly_Bool_Exp>>;
  account?: InputMaybe<Accounts_Bool_Exp>;
  account_id?: InputMaybe<String_Comparison_Exp>;
  assets_in_period?: InputMaybe<Numeric_Comparison_Exp>;
  assets_out_period?: InputMaybe<Numeric_Comparison_Exp>;
  bucket?: InputMaybe<Timestamptz_Comparison_Exp>;
  curve_id?: InputMaybe<Numeric_Comparison_Exp>;
  shares_delta_period?: InputMaybe<Numeric_Comparison_Exp>;
  term?: InputMaybe<Terms_Bool_Exp>;
  term_id?: InputMaybe<String_Comparison_Exp>;
  transaction_count?: InputMaybe<Bigint_Comparison_Exp>;
  vault?: InputMaybe<Vaults_Bool_Exp>;
};

/** Ordering options when selecting data from "position_change_hourly". */
export type Position_Change_Hourly_Order_By = {
  account?: InputMaybe<Accounts_Order_By>;
  account_id?: InputMaybe<Order_By>;
  assets_in_period?: InputMaybe<Order_By>;
  assets_out_period?: InputMaybe<Order_By>;
  bucket?: InputMaybe<Order_By>;
  curve_id?: InputMaybe<Order_By>;
  shares_delta_period?: InputMaybe<Order_By>;
  term?: InputMaybe<Terms_Order_By>;
  term_id?: InputMaybe<Order_By>;
  transaction_count?: InputMaybe<Order_By>;
  vault?: InputMaybe<Vaults_Order_By>;
};

/** select columns of table "position_change_hourly" */
export type Position_Change_Hourly_Select_Column =
  /** column name */
  | 'account_id'
  /** column name */
  | 'assets_in_period'
  /** column name */
  | 'assets_out_period'
  /** column name */
  | 'bucket'
  /** column name */
  | 'curve_id'
  /** column name */
  | 'shares_delta_period'
  /** column name */
  | 'term_id'
  /** column name */
  | 'transaction_count';

/** Streaming cursor of the table "position_change_hourly" */
export type Position_Change_Hourly_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Position_Change_Hourly_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Position_Change_Hourly_Stream_Cursor_Value_Input = {
  account_id?: InputMaybe<Scalars['String']['input']>;
  assets_in_period?: InputMaybe<Scalars['numeric']['input']>;
  assets_out_period?: InputMaybe<Scalars['numeric']['input']>;
  bucket?: InputMaybe<Scalars['timestamptz']['input']>;
  curve_id?: InputMaybe<Scalars['numeric']['input']>;
  shares_delta_period?: InputMaybe<Scalars['numeric']['input']>;
  term_id?: InputMaybe<Scalars['String']['input']>;
  transaction_count?: InputMaybe<Scalars['bigint']['input']>;
};

/** columns and relationships of "position_change" */
export type Position_Changes = {
  __typename?: 'position_changes';
  /** An object relationship */
  account?: Maybe<Accounts>;
  account_id: Scalars['String']['output'];
  assets_in: Scalars['numeric']['output'];
  assets_out: Scalars['numeric']['output'];
  block_number: Scalars['numeric']['output'];
  created_at: Scalars['timestamptz']['output'];
  curve_id: Scalars['numeric']['output'];
  event_id: Scalars['String']['output'];
  event_type: Scalars['String']['output'];
  id: Scalars['bigint']['output'];
  log_index: Scalars['bigint']['output'];
  shares_delta: Scalars['numeric']['output'];
  /** An object relationship */
  term?: Maybe<Terms>;
  term_id: Scalars['String']['output'];
  transaction_hash: Scalars['String']['output'];
  /** An object relationship */
  vault?: Maybe<Vaults>;
};

/** aggregated selection of "position_change" */
export type Position_Changes_Aggregate = {
  __typename?: 'position_changes_aggregate';
  aggregate?: Maybe<Position_Changes_Aggregate_Fields>;
  nodes: Array<Position_Changes>;
};

/** aggregate fields of "position_change" */
export type Position_Changes_Aggregate_Fields = {
  __typename?: 'position_changes_aggregate_fields';
  avg?: Maybe<Position_Changes_Avg_Fields>;
  count: Scalars['Int']['output'];
  max?: Maybe<Position_Changes_Max_Fields>;
  min?: Maybe<Position_Changes_Min_Fields>;
  stddev?: Maybe<Position_Changes_Stddev_Fields>;
  stddev_pop?: Maybe<Position_Changes_Stddev_Pop_Fields>;
  stddev_samp?: Maybe<Position_Changes_Stddev_Samp_Fields>;
  sum?: Maybe<Position_Changes_Sum_Fields>;
  var_pop?: Maybe<Position_Changes_Var_Pop_Fields>;
  var_samp?: Maybe<Position_Changes_Var_Samp_Fields>;
  variance?: Maybe<Position_Changes_Variance_Fields>;
};


/** aggregate fields of "position_change" */
export type Position_Changes_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Position_Changes_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
};

/** aggregate avg on columns */
export type Position_Changes_Avg_Fields = {
  __typename?: 'position_changes_avg_fields';
  assets_in?: Maybe<Scalars['Float']['output']>;
  assets_out?: Maybe<Scalars['Float']['output']>;
  block_number?: Maybe<Scalars['Float']['output']>;
  curve_id?: Maybe<Scalars['Float']['output']>;
  id?: Maybe<Scalars['Float']['output']>;
  log_index?: Maybe<Scalars['Float']['output']>;
  shares_delta?: Maybe<Scalars['Float']['output']>;
};

/** Boolean expression to filter rows from the table "position_change". All fields are combined with a logical 'AND'. */
export type Position_Changes_Bool_Exp = {
  _and?: InputMaybe<Array<Position_Changes_Bool_Exp>>;
  _not?: InputMaybe<Position_Changes_Bool_Exp>;
  _or?: InputMaybe<Array<Position_Changes_Bool_Exp>>;
  account?: InputMaybe<Accounts_Bool_Exp>;
  account_id?: InputMaybe<String_Comparison_Exp>;
  assets_in?: InputMaybe<Numeric_Comparison_Exp>;
  assets_out?: InputMaybe<Numeric_Comparison_Exp>;
  block_number?: InputMaybe<Numeric_Comparison_Exp>;
  created_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  curve_id?: InputMaybe<Numeric_Comparison_Exp>;
  event_id?: InputMaybe<String_Comparison_Exp>;
  event_type?: InputMaybe<String_Comparison_Exp>;
  id?: InputMaybe<Bigint_Comparison_Exp>;
  log_index?: InputMaybe<Bigint_Comparison_Exp>;
  shares_delta?: InputMaybe<Numeric_Comparison_Exp>;
  term?: InputMaybe<Terms_Bool_Exp>;
  term_id?: InputMaybe<String_Comparison_Exp>;
  transaction_hash?: InputMaybe<String_Comparison_Exp>;
  vault?: InputMaybe<Vaults_Bool_Exp>;
};

/** aggregate max on columns */
export type Position_Changes_Max_Fields = {
  __typename?: 'position_changes_max_fields';
  account_id?: Maybe<Scalars['String']['output']>;
  assets_in?: Maybe<Scalars['numeric']['output']>;
  assets_out?: Maybe<Scalars['numeric']['output']>;
  block_number?: Maybe<Scalars['numeric']['output']>;
  created_at?: Maybe<Scalars['timestamptz']['output']>;
  curve_id?: Maybe<Scalars['numeric']['output']>;
  event_id?: Maybe<Scalars['String']['output']>;
  event_type?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['bigint']['output']>;
  log_index?: Maybe<Scalars['bigint']['output']>;
  shares_delta?: Maybe<Scalars['numeric']['output']>;
  term_id?: Maybe<Scalars['String']['output']>;
  transaction_hash?: Maybe<Scalars['String']['output']>;
};

/** aggregate min on columns */
export type Position_Changes_Min_Fields = {
  __typename?: 'position_changes_min_fields';
  account_id?: Maybe<Scalars['String']['output']>;
  assets_in?: Maybe<Scalars['numeric']['output']>;
  assets_out?: Maybe<Scalars['numeric']['output']>;
  block_number?: Maybe<Scalars['numeric']['output']>;
  created_at?: Maybe<Scalars['timestamptz']['output']>;
  curve_id?: Maybe<Scalars['numeric']['output']>;
  event_id?: Maybe<Scalars['String']['output']>;
  event_type?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['bigint']['output']>;
  log_index?: Maybe<Scalars['bigint']['output']>;
  shares_delta?: Maybe<Scalars['numeric']['output']>;
  term_id?: Maybe<Scalars['String']['output']>;
  transaction_hash?: Maybe<Scalars['String']['output']>;
};

/** Ordering options when selecting data from "position_change". */
export type Position_Changes_Order_By = {
  account?: InputMaybe<Accounts_Order_By>;
  account_id?: InputMaybe<Order_By>;
  assets_in?: InputMaybe<Order_By>;
  assets_out?: InputMaybe<Order_By>;
  block_number?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  curve_id?: InputMaybe<Order_By>;
  event_id?: InputMaybe<Order_By>;
  event_type?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  log_index?: InputMaybe<Order_By>;
  shares_delta?: InputMaybe<Order_By>;
  term?: InputMaybe<Terms_Order_By>;
  term_id?: InputMaybe<Order_By>;
  transaction_hash?: InputMaybe<Order_By>;
  vault?: InputMaybe<Vaults_Order_By>;
};

/** select columns of table "position_change" */
export type Position_Changes_Select_Column =
  /** column name */
  | 'account_id'
  /** column name */
  | 'assets_in'
  /** column name */
  | 'assets_out'
  /** column name */
  | 'block_number'
  /** column name */
  | 'created_at'
  /** column name */
  | 'curve_id'
  /** column name */
  | 'event_id'
  /** column name */
  | 'event_type'
  /** column name */
  | 'id'
  /** column name */
  | 'log_index'
  /** column name */
  | 'shares_delta'
  /** column name */
  | 'term_id'
  /** column name */
  | 'transaction_hash';

/** aggregate stddev on columns */
export type Position_Changes_Stddev_Fields = {
  __typename?: 'position_changes_stddev_fields';
  assets_in?: Maybe<Scalars['Float']['output']>;
  assets_out?: Maybe<Scalars['Float']['output']>;
  block_number?: Maybe<Scalars['Float']['output']>;
  curve_id?: Maybe<Scalars['Float']['output']>;
  id?: Maybe<Scalars['Float']['output']>;
  log_index?: Maybe<Scalars['Float']['output']>;
  shares_delta?: Maybe<Scalars['Float']['output']>;
};

/** aggregate stddev_pop on columns */
export type Position_Changes_Stddev_Pop_Fields = {
  __typename?: 'position_changes_stddev_pop_fields';
  assets_in?: Maybe<Scalars['Float']['output']>;
  assets_out?: Maybe<Scalars['Float']['output']>;
  block_number?: Maybe<Scalars['Float']['output']>;
  curve_id?: Maybe<Scalars['Float']['output']>;
  id?: Maybe<Scalars['Float']['output']>;
  log_index?: Maybe<Scalars['Float']['output']>;
  shares_delta?: Maybe<Scalars['Float']['output']>;
};

/** aggregate stddev_samp on columns */
export type Position_Changes_Stddev_Samp_Fields = {
  __typename?: 'position_changes_stddev_samp_fields';
  assets_in?: Maybe<Scalars['Float']['output']>;
  assets_out?: Maybe<Scalars['Float']['output']>;
  block_number?: Maybe<Scalars['Float']['output']>;
  curve_id?: Maybe<Scalars['Float']['output']>;
  id?: Maybe<Scalars['Float']['output']>;
  log_index?: Maybe<Scalars['Float']['output']>;
  shares_delta?: Maybe<Scalars['Float']['output']>;
};

/** Streaming cursor of the table "position_changes" */
export type Position_Changes_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Position_Changes_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Position_Changes_Stream_Cursor_Value_Input = {
  account_id?: InputMaybe<Scalars['String']['input']>;
  assets_in?: InputMaybe<Scalars['numeric']['input']>;
  assets_out?: InputMaybe<Scalars['numeric']['input']>;
  block_number?: InputMaybe<Scalars['numeric']['input']>;
  created_at?: InputMaybe<Scalars['timestamptz']['input']>;
  curve_id?: InputMaybe<Scalars['numeric']['input']>;
  event_id?: InputMaybe<Scalars['String']['input']>;
  event_type?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['bigint']['input']>;
  log_index?: InputMaybe<Scalars['bigint']['input']>;
  shares_delta?: InputMaybe<Scalars['numeric']['input']>;
  term_id?: InputMaybe<Scalars['String']['input']>;
  transaction_hash?: InputMaybe<Scalars['String']['input']>;
};

/** aggregate sum on columns */
export type Position_Changes_Sum_Fields = {
  __typename?: 'position_changes_sum_fields';
  assets_in?: Maybe<Scalars['numeric']['output']>;
  assets_out?: Maybe<Scalars['numeric']['output']>;
  block_number?: Maybe<Scalars['numeric']['output']>;
  curve_id?: Maybe<Scalars['numeric']['output']>;
  id?: Maybe<Scalars['bigint']['output']>;
  log_index?: Maybe<Scalars['bigint']['output']>;
  shares_delta?: Maybe<Scalars['numeric']['output']>;
};

/** aggregate var_pop on columns */
export type Position_Changes_Var_Pop_Fields = {
  __typename?: 'position_changes_var_pop_fields';
  assets_in?: Maybe<Scalars['Float']['output']>;
  assets_out?: Maybe<Scalars['Float']['output']>;
  block_number?: Maybe<Scalars['Float']['output']>;
  curve_id?: Maybe<Scalars['Float']['output']>;
  id?: Maybe<Scalars['Float']['output']>;
  log_index?: Maybe<Scalars['Float']['output']>;
  shares_delta?: Maybe<Scalars['Float']['output']>;
};

/** aggregate var_samp on columns */
export type Position_Changes_Var_Samp_Fields = {
  __typename?: 'position_changes_var_samp_fields';
  assets_in?: Maybe<Scalars['Float']['output']>;
  assets_out?: Maybe<Scalars['Float']['output']>;
  block_number?: Maybe<Scalars['Float']['output']>;
  curve_id?: Maybe<Scalars['Float']['output']>;
  id?: Maybe<Scalars['Float']['output']>;
  log_index?: Maybe<Scalars['Float']['output']>;
  shares_delta?: Maybe<Scalars['Float']['output']>;
};

/** aggregate variance on columns */
export type Position_Changes_Variance_Fields = {
  __typename?: 'position_changes_variance_fields';
  assets_in?: Maybe<Scalars['Float']['output']>;
  assets_out?: Maybe<Scalars['Float']['output']>;
  block_number?: Maybe<Scalars['Float']['output']>;
  curve_id?: Maybe<Scalars['Float']['output']>;
  id?: Maybe<Scalars['Float']['output']>;
  log_index?: Maybe<Scalars['Float']['output']>;
  shares_delta?: Maybe<Scalars['Float']['output']>;
};

/** User positions in vaults representing staked assets and shares held across different curves. */
export type Positions = {
  __typename?: 'positions';
  /** An object relationship */
  account?: Maybe<Accounts>;
  /** Account that holds this position. */
  account_id: Scalars['String']['output'];
  /** Block number of most recent position update. */
  block_number: Scalars['bigint']['output'];
  /** Timestamp when position was created. */
  created_at: Scalars['timestamptz']['output'];
  /** Bonding curve ID of the vault. */
  curve_id: Scalars['numeric']['output'];
  /** Unique identifier for this position. */
  id: Scalars['String']['output'];
  /** Log index of most recent position update. */
  log_index: Scalars['bigint']['output'];
  /** Current number of shares held in this position. */
  shares: Scalars['numeric']['output'];
  /** An object relationship */
  term?: Maybe<Terms>;
  /** Term ID of the vault for this position. */
  term_id: Scalars['String']['output'];
  /** Cumulative assets deposited after fees, for profit/loss calculation, in wei. */
  total_deposit_assets_after_total_fees: Scalars['numeric']['output'];
  /** Cumulative assets redeemed, for profit/loss calculation, in wei. */
  total_redeem_assets_for_receiver: Scalars['numeric']['output'];
  /** Transaction hash of most recent position update. */
  transaction_hash: Scalars['String']['output'];
  /** Transaction index for event ordering. */
  transaction_index: Scalars['bigint']['output'];
  /** Timestamp of last update to this position. */
  updated_at: Scalars['timestamptz']['output'];
  /** An object relationship */
  vault?: Maybe<Vaults>;
};

/** aggregated selection of "position" */
export type Positions_Aggregate = {
  __typename?: 'positions_aggregate';
  aggregate?: Maybe<Positions_Aggregate_Fields>;
  nodes: Array<Positions>;
};

export type Positions_Aggregate_Bool_Exp = {
  count?: InputMaybe<Positions_Aggregate_Bool_Exp_Count>;
};

export type Positions_Aggregate_Bool_Exp_Count = {
  arguments?: InputMaybe<Array<Positions_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
  filter?: InputMaybe<Positions_Bool_Exp>;
  predicate: Int_Comparison_Exp;
};

/** aggregate fields of "position" */
export type Positions_Aggregate_Fields = {
  __typename?: 'positions_aggregate_fields';
  avg?: Maybe<Positions_Avg_Fields>;
  count: Scalars['Int']['output'];
  max?: Maybe<Positions_Max_Fields>;
  min?: Maybe<Positions_Min_Fields>;
  stddev?: Maybe<Positions_Stddev_Fields>;
  stddev_pop?: Maybe<Positions_Stddev_Pop_Fields>;
  stddev_samp?: Maybe<Positions_Stddev_Samp_Fields>;
  sum?: Maybe<Positions_Sum_Fields>;
  var_pop?: Maybe<Positions_Var_Pop_Fields>;
  var_samp?: Maybe<Positions_Var_Samp_Fields>;
  variance?: Maybe<Positions_Variance_Fields>;
};


/** aggregate fields of "position" */
export type Positions_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Positions_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
};

/** order by aggregate values of table "position" */
export type Positions_Aggregate_Order_By = {
  avg?: InputMaybe<Positions_Avg_Order_By>;
  count?: InputMaybe<Order_By>;
  max?: InputMaybe<Positions_Max_Order_By>;
  min?: InputMaybe<Positions_Min_Order_By>;
  stddev?: InputMaybe<Positions_Stddev_Order_By>;
  stddev_pop?: InputMaybe<Positions_Stddev_Pop_Order_By>;
  stddev_samp?: InputMaybe<Positions_Stddev_Samp_Order_By>;
  sum?: InputMaybe<Positions_Sum_Order_By>;
  var_pop?: InputMaybe<Positions_Var_Pop_Order_By>;
  var_samp?: InputMaybe<Positions_Var_Samp_Order_By>;
  variance?: InputMaybe<Positions_Variance_Order_By>;
};

/** aggregate avg on columns */
export type Positions_Avg_Fields = {
  __typename?: 'positions_avg_fields';
  /** Block number of most recent position update. */
  block_number?: Maybe<Scalars['Float']['output']>;
  /** Bonding curve ID of the vault. */
  curve_id?: Maybe<Scalars['Float']['output']>;
  /** Log index of most recent position update. */
  log_index?: Maybe<Scalars['Float']['output']>;
  /** Current number of shares held in this position. */
  shares?: Maybe<Scalars['Float']['output']>;
  /** Cumulative assets deposited after fees, for profit/loss calculation, in wei. */
  total_deposit_assets_after_total_fees?: Maybe<Scalars['Float']['output']>;
  /** Cumulative assets redeemed, for profit/loss calculation, in wei. */
  total_redeem_assets_for_receiver?: Maybe<Scalars['Float']['output']>;
  /** Transaction index for event ordering. */
  transaction_index?: Maybe<Scalars['Float']['output']>;
};

/** order by avg() on columns of table "position" */
export type Positions_Avg_Order_By = {
  /** Block number of most recent position update. */
  block_number?: InputMaybe<Order_By>;
  /** Bonding curve ID of the vault. */
  curve_id?: InputMaybe<Order_By>;
  /** Log index of most recent position update. */
  log_index?: InputMaybe<Order_By>;
  /** Current number of shares held in this position. */
  shares?: InputMaybe<Order_By>;
  /** Cumulative assets deposited after fees, for profit/loss calculation, in wei. */
  total_deposit_assets_after_total_fees?: InputMaybe<Order_By>;
  /** Cumulative assets redeemed, for profit/loss calculation, in wei. */
  total_redeem_assets_for_receiver?: InputMaybe<Order_By>;
  /** Transaction index for event ordering. */
  transaction_index?: InputMaybe<Order_By>;
};

/** Boolean expression to filter rows from the table "position". All fields are combined with a logical 'AND'. */
export type Positions_Bool_Exp = {
  _and?: InputMaybe<Array<Positions_Bool_Exp>>;
  _not?: InputMaybe<Positions_Bool_Exp>;
  _or?: InputMaybe<Array<Positions_Bool_Exp>>;
  account?: InputMaybe<Accounts_Bool_Exp>;
  account_id?: InputMaybe<String_Comparison_Exp>;
  block_number?: InputMaybe<Bigint_Comparison_Exp>;
  created_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  curve_id?: InputMaybe<Numeric_Comparison_Exp>;
  id?: InputMaybe<String_Comparison_Exp>;
  log_index?: InputMaybe<Bigint_Comparison_Exp>;
  shares?: InputMaybe<Numeric_Comparison_Exp>;
  term?: InputMaybe<Terms_Bool_Exp>;
  term_id?: InputMaybe<String_Comparison_Exp>;
  total_deposit_assets_after_total_fees?: InputMaybe<Numeric_Comparison_Exp>;
  total_redeem_assets_for_receiver?: InputMaybe<Numeric_Comparison_Exp>;
  transaction_hash?: InputMaybe<String_Comparison_Exp>;
  transaction_index?: InputMaybe<Bigint_Comparison_Exp>;
  updated_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  vault?: InputMaybe<Vaults_Bool_Exp>;
};

export type Positions_From_Following_Args = {
  address?: InputMaybe<Scalars['String']['input']>;
};

/** aggregate max on columns */
export type Positions_Max_Fields = {
  __typename?: 'positions_max_fields';
  /** Account that holds this position. */
  account_id?: Maybe<Scalars['String']['output']>;
  /** Block number of most recent position update. */
  block_number?: Maybe<Scalars['bigint']['output']>;
  /** Timestamp when position was created. */
  created_at?: Maybe<Scalars['timestamptz']['output']>;
  /** Bonding curve ID of the vault. */
  curve_id?: Maybe<Scalars['numeric']['output']>;
  /** Unique identifier for this position. */
  id?: Maybe<Scalars['String']['output']>;
  /** Log index of most recent position update. */
  log_index?: Maybe<Scalars['bigint']['output']>;
  /** Current number of shares held in this position. */
  shares?: Maybe<Scalars['numeric']['output']>;
  /** Term ID of the vault for this position. */
  term_id?: Maybe<Scalars['String']['output']>;
  /** Cumulative assets deposited after fees, for profit/loss calculation, in wei. */
  total_deposit_assets_after_total_fees?: Maybe<Scalars['numeric']['output']>;
  /** Cumulative assets redeemed, for profit/loss calculation, in wei. */
  total_redeem_assets_for_receiver?: Maybe<Scalars['numeric']['output']>;
  /** Transaction hash of most recent position update. */
  transaction_hash?: Maybe<Scalars['String']['output']>;
  /** Transaction index for event ordering. */
  transaction_index?: Maybe<Scalars['bigint']['output']>;
  /** Timestamp of last update to this position. */
  updated_at?: Maybe<Scalars['timestamptz']['output']>;
};

/** order by max() on columns of table "position" */
export type Positions_Max_Order_By = {
  /** Account that holds this position. */
  account_id?: InputMaybe<Order_By>;
  /** Block number of most recent position update. */
  block_number?: InputMaybe<Order_By>;
  /** Timestamp when position was created. */
  created_at?: InputMaybe<Order_By>;
  /** Bonding curve ID of the vault. */
  curve_id?: InputMaybe<Order_By>;
  /** Unique identifier for this position. */
  id?: InputMaybe<Order_By>;
  /** Log index of most recent position update. */
  log_index?: InputMaybe<Order_By>;
  /** Current number of shares held in this position. */
  shares?: InputMaybe<Order_By>;
  /** Term ID of the vault for this position. */
  term_id?: InputMaybe<Order_By>;
  /** Cumulative assets deposited after fees, for profit/loss calculation, in wei. */
  total_deposit_assets_after_total_fees?: InputMaybe<Order_By>;
  /** Cumulative assets redeemed, for profit/loss calculation, in wei. */
  total_redeem_assets_for_receiver?: InputMaybe<Order_By>;
  /** Transaction hash of most recent position update. */
  transaction_hash?: InputMaybe<Order_By>;
  /** Transaction index for event ordering. */
  transaction_index?: InputMaybe<Order_By>;
  /** Timestamp of last update to this position. */
  updated_at?: InputMaybe<Order_By>;
};

/** aggregate min on columns */
export type Positions_Min_Fields = {
  __typename?: 'positions_min_fields';
  /** Account that holds this position. */
  account_id?: Maybe<Scalars['String']['output']>;
  /** Block number of most recent position update. */
  block_number?: Maybe<Scalars['bigint']['output']>;
  /** Timestamp when position was created. */
  created_at?: Maybe<Scalars['timestamptz']['output']>;
  /** Bonding curve ID of the vault. */
  curve_id?: Maybe<Scalars['numeric']['output']>;
  /** Unique identifier for this position. */
  id?: Maybe<Scalars['String']['output']>;
  /** Log index of most recent position update. */
  log_index?: Maybe<Scalars['bigint']['output']>;
  /** Current number of shares held in this position. */
  shares?: Maybe<Scalars['numeric']['output']>;
  /** Term ID of the vault for this position. */
  term_id?: Maybe<Scalars['String']['output']>;
  /** Cumulative assets deposited after fees, for profit/loss calculation, in wei. */
  total_deposit_assets_after_total_fees?: Maybe<Scalars['numeric']['output']>;
  /** Cumulative assets redeemed, for profit/loss calculation, in wei. */
  total_redeem_assets_for_receiver?: Maybe<Scalars['numeric']['output']>;
  /** Transaction hash of most recent position update. */
  transaction_hash?: Maybe<Scalars['String']['output']>;
  /** Transaction index for event ordering. */
  transaction_index?: Maybe<Scalars['bigint']['output']>;
  /** Timestamp of last update to this position. */
  updated_at?: Maybe<Scalars['timestamptz']['output']>;
};

/** order by min() on columns of table "position" */
export type Positions_Min_Order_By = {
  /** Account that holds this position. */
  account_id?: InputMaybe<Order_By>;
  /** Block number of most recent position update. */
  block_number?: InputMaybe<Order_By>;
  /** Timestamp when position was created. */
  created_at?: InputMaybe<Order_By>;
  /** Bonding curve ID of the vault. */
  curve_id?: InputMaybe<Order_By>;
  /** Unique identifier for this position. */
  id?: InputMaybe<Order_By>;
  /** Log index of most recent position update. */
  log_index?: InputMaybe<Order_By>;
  /** Current number of shares held in this position. */
  shares?: InputMaybe<Order_By>;
  /** Term ID of the vault for this position. */
  term_id?: InputMaybe<Order_By>;
  /** Cumulative assets deposited after fees, for profit/loss calculation, in wei. */
  total_deposit_assets_after_total_fees?: InputMaybe<Order_By>;
  /** Cumulative assets redeemed, for profit/loss calculation, in wei. */
  total_redeem_assets_for_receiver?: InputMaybe<Order_By>;
  /** Transaction hash of most recent position update. */
  transaction_hash?: InputMaybe<Order_By>;
  /** Transaction index for event ordering. */
  transaction_index?: InputMaybe<Order_By>;
  /** Timestamp of last update to this position. */
  updated_at?: InputMaybe<Order_By>;
};

/** Ordering options when selecting data from "position". */
export type Positions_Order_By = {
  account?: InputMaybe<Accounts_Order_By>;
  account_id?: InputMaybe<Order_By>;
  block_number?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  curve_id?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  log_index?: InputMaybe<Order_By>;
  shares?: InputMaybe<Order_By>;
  term?: InputMaybe<Terms_Order_By>;
  term_id?: InputMaybe<Order_By>;
  total_deposit_assets_after_total_fees?: InputMaybe<Order_By>;
  total_redeem_assets_for_receiver?: InputMaybe<Order_By>;
  transaction_hash?: InputMaybe<Order_By>;
  transaction_index?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
  vault?: InputMaybe<Vaults_Order_By>;
};

/** select columns of table "position" */
export type Positions_Select_Column =
  /** column name */
  | 'account_id'
  /** column name */
  | 'block_number'
  /** column name */
  | 'created_at'
  /** column name */
  | 'curve_id'
  /** column name */
  | 'id'
  /** column name */
  | 'log_index'
  /** column name */
  | 'shares'
  /** column name */
  | 'term_id'
  /** column name */
  | 'total_deposit_assets_after_total_fees'
  /** column name */
  | 'total_redeem_assets_for_receiver'
  /** column name */
  | 'transaction_hash'
  /** column name */
  | 'transaction_index'
  /** column name */
  | 'updated_at';

/** aggregate stddev on columns */
export type Positions_Stddev_Fields = {
  __typename?: 'positions_stddev_fields';
  /** Block number of most recent position update. */
  block_number?: Maybe<Scalars['Float']['output']>;
  /** Bonding curve ID of the vault. */
  curve_id?: Maybe<Scalars['Float']['output']>;
  /** Log index of most recent position update. */
  log_index?: Maybe<Scalars['Float']['output']>;
  /** Current number of shares held in this position. */
  shares?: Maybe<Scalars['Float']['output']>;
  /** Cumulative assets deposited after fees, for profit/loss calculation, in wei. */
  total_deposit_assets_after_total_fees?: Maybe<Scalars['Float']['output']>;
  /** Cumulative assets redeemed, for profit/loss calculation, in wei. */
  total_redeem_assets_for_receiver?: Maybe<Scalars['Float']['output']>;
  /** Transaction index for event ordering. */
  transaction_index?: Maybe<Scalars['Float']['output']>;
};

/** order by stddev() on columns of table "position" */
export type Positions_Stddev_Order_By = {
  /** Block number of most recent position update. */
  block_number?: InputMaybe<Order_By>;
  /** Bonding curve ID of the vault. */
  curve_id?: InputMaybe<Order_By>;
  /** Log index of most recent position update. */
  log_index?: InputMaybe<Order_By>;
  /** Current number of shares held in this position. */
  shares?: InputMaybe<Order_By>;
  /** Cumulative assets deposited after fees, for profit/loss calculation, in wei. */
  total_deposit_assets_after_total_fees?: InputMaybe<Order_By>;
  /** Cumulative assets redeemed, for profit/loss calculation, in wei. */
  total_redeem_assets_for_receiver?: InputMaybe<Order_By>;
  /** Transaction index for event ordering. */
  transaction_index?: InputMaybe<Order_By>;
};

/** aggregate stddev_pop on columns */
export type Positions_Stddev_Pop_Fields = {
  __typename?: 'positions_stddev_pop_fields';
  /** Block number of most recent position update. */
  block_number?: Maybe<Scalars['Float']['output']>;
  /** Bonding curve ID of the vault. */
  curve_id?: Maybe<Scalars['Float']['output']>;
  /** Log index of most recent position update. */
  log_index?: Maybe<Scalars['Float']['output']>;
  /** Current number of shares held in this position. */
  shares?: Maybe<Scalars['Float']['output']>;
  /** Cumulative assets deposited after fees, for profit/loss calculation, in wei. */
  total_deposit_assets_after_total_fees?: Maybe<Scalars['Float']['output']>;
  /** Cumulative assets redeemed, for profit/loss calculation, in wei. */
  total_redeem_assets_for_receiver?: Maybe<Scalars['Float']['output']>;
  /** Transaction index for event ordering. */
  transaction_index?: Maybe<Scalars['Float']['output']>;
};

/** order by stddev_pop() on columns of table "position" */
export type Positions_Stddev_Pop_Order_By = {
  /** Block number of most recent position update. */
  block_number?: InputMaybe<Order_By>;
  /** Bonding curve ID of the vault. */
  curve_id?: InputMaybe<Order_By>;
  /** Log index of most recent position update. */
  log_index?: InputMaybe<Order_By>;
  /** Current number of shares held in this position. */
  shares?: InputMaybe<Order_By>;
  /** Cumulative assets deposited after fees, for profit/loss calculation, in wei. */
  total_deposit_assets_after_total_fees?: InputMaybe<Order_By>;
  /** Cumulative assets redeemed, for profit/loss calculation, in wei. */
  total_redeem_assets_for_receiver?: InputMaybe<Order_By>;
  /** Transaction index for event ordering. */
  transaction_index?: InputMaybe<Order_By>;
};

/** aggregate stddev_samp on columns */
export type Positions_Stddev_Samp_Fields = {
  __typename?: 'positions_stddev_samp_fields';
  /** Block number of most recent position update. */
  block_number?: Maybe<Scalars['Float']['output']>;
  /** Bonding curve ID of the vault. */
  curve_id?: Maybe<Scalars['Float']['output']>;
  /** Log index of most recent position update. */
  log_index?: Maybe<Scalars['Float']['output']>;
  /** Current number of shares held in this position. */
  shares?: Maybe<Scalars['Float']['output']>;
  /** Cumulative assets deposited after fees, for profit/loss calculation, in wei. */
  total_deposit_assets_after_total_fees?: Maybe<Scalars['Float']['output']>;
  /** Cumulative assets redeemed, for profit/loss calculation, in wei. */
  total_redeem_assets_for_receiver?: Maybe<Scalars['Float']['output']>;
  /** Transaction index for event ordering. */
  transaction_index?: Maybe<Scalars['Float']['output']>;
};

/** order by stddev_samp() on columns of table "position" */
export type Positions_Stddev_Samp_Order_By = {
  /** Block number of most recent position update. */
  block_number?: InputMaybe<Order_By>;
  /** Bonding curve ID of the vault. */
  curve_id?: InputMaybe<Order_By>;
  /** Log index of most recent position update. */
  log_index?: InputMaybe<Order_By>;
  /** Current number of shares held in this position. */
  shares?: InputMaybe<Order_By>;
  /** Cumulative assets deposited after fees, for profit/loss calculation, in wei. */
  total_deposit_assets_after_total_fees?: InputMaybe<Order_By>;
  /** Cumulative assets redeemed, for profit/loss calculation, in wei. */
  total_redeem_assets_for_receiver?: InputMaybe<Order_By>;
  /** Transaction index for event ordering. */
  transaction_index?: InputMaybe<Order_By>;
};

/** Streaming cursor of the table "positions" */
export type Positions_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Positions_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Positions_Stream_Cursor_Value_Input = {
  /** Account that holds this position. */
  account_id?: InputMaybe<Scalars['String']['input']>;
  /** Block number of most recent position update. */
  block_number?: InputMaybe<Scalars['bigint']['input']>;
  /** Timestamp when position was created. */
  created_at?: InputMaybe<Scalars['timestamptz']['input']>;
  /** Bonding curve ID of the vault. */
  curve_id?: InputMaybe<Scalars['numeric']['input']>;
  /** Unique identifier for this position. */
  id?: InputMaybe<Scalars['String']['input']>;
  /** Log index of most recent position update. */
  log_index?: InputMaybe<Scalars['bigint']['input']>;
  /** Current number of shares held in this position. */
  shares?: InputMaybe<Scalars['numeric']['input']>;
  /** Term ID of the vault for this position. */
  term_id?: InputMaybe<Scalars['String']['input']>;
  /** Cumulative assets deposited after fees, for profit/loss calculation, in wei. */
  total_deposit_assets_after_total_fees?: InputMaybe<Scalars['numeric']['input']>;
  /** Cumulative assets redeemed, for profit/loss calculation, in wei. */
  total_redeem_assets_for_receiver?: InputMaybe<Scalars['numeric']['input']>;
  /** Transaction hash of most recent position update. */
  transaction_hash?: InputMaybe<Scalars['String']['input']>;
  /** Transaction index for event ordering. */
  transaction_index?: InputMaybe<Scalars['bigint']['input']>;
  /** Timestamp of last update to this position. */
  updated_at?: InputMaybe<Scalars['timestamptz']['input']>;
};

/** aggregate sum on columns */
export type Positions_Sum_Fields = {
  __typename?: 'positions_sum_fields';
  /** Block number of most recent position update. */
  block_number?: Maybe<Scalars['bigint']['output']>;
  /** Bonding curve ID of the vault. */
  curve_id?: Maybe<Scalars['numeric']['output']>;
  /** Log index of most recent position update. */
  log_index?: Maybe<Scalars['bigint']['output']>;
  /** Current number of shares held in this position. */
  shares?: Maybe<Scalars['numeric']['output']>;
  /** Cumulative assets deposited after fees, for profit/loss calculation, in wei. */
  total_deposit_assets_after_total_fees?: Maybe<Scalars['numeric']['output']>;
  /** Cumulative assets redeemed, for profit/loss calculation, in wei. */
  total_redeem_assets_for_receiver?: Maybe<Scalars['numeric']['output']>;
  /** Transaction index for event ordering. */
  transaction_index?: Maybe<Scalars['bigint']['output']>;
};

/** order by sum() on columns of table "position" */
export type Positions_Sum_Order_By = {
  /** Block number of most recent position update. */
  block_number?: InputMaybe<Order_By>;
  /** Bonding curve ID of the vault. */
  curve_id?: InputMaybe<Order_By>;
  /** Log index of most recent position update. */
  log_index?: InputMaybe<Order_By>;
  /** Current number of shares held in this position. */
  shares?: InputMaybe<Order_By>;
  /** Cumulative assets deposited after fees, for profit/loss calculation, in wei. */
  total_deposit_assets_after_total_fees?: InputMaybe<Order_By>;
  /** Cumulative assets redeemed, for profit/loss calculation, in wei. */
  total_redeem_assets_for_receiver?: InputMaybe<Order_By>;
  /** Transaction index for event ordering. */
  transaction_index?: InputMaybe<Order_By>;
};

/** aggregate var_pop on columns */
export type Positions_Var_Pop_Fields = {
  __typename?: 'positions_var_pop_fields';
  /** Block number of most recent position update. */
  block_number?: Maybe<Scalars['Float']['output']>;
  /** Bonding curve ID of the vault. */
  curve_id?: Maybe<Scalars['Float']['output']>;
  /** Log index of most recent position update. */
  log_index?: Maybe<Scalars['Float']['output']>;
  /** Current number of shares held in this position. */
  shares?: Maybe<Scalars['Float']['output']>;
  /** Cumulative assets deposited after fees, for profit/loss calculation, in wei. */
  total_deposit_assets_after_total_fees?: Maybe<Scalars['Float']['output']>;
  /** Cumulative assets redeemed, for profit/loss calculation, in wei. */
  total_redeem_assets_for_receiver?: Maybe<Scalars['Float']['output']>;
  /** Transaction index for event ordering. */
  transaction_index?: Maybe<Scalars['Float']['output']>;
};

/** order by var_pop() on columns of table "position" */
export type Positions_Var_Pop_Order_By = {
  /** Block number of most recent position update. */
  block_number?: InputMaybe<Order_By>;
  /** Bonding curve ID of the vault. */
  curve_id?: InputMaybe<Order_By>;
  /** Log index of most recent position update. */
  log_index?: InputMaybe<Order_By>;
  /** Current number of shares held in this position. */
  shares?: InputMaybe<Order_By>;
  /** Cumulative assets deposited after fees, for profit/loss calculation, in wei. */
  total_deposit_assets_after_total_fees?: InputMaybe<Order_By>;
  /** Cumulative assets redeemed, for profit/loss calculation, in wei. */
  total_redeem_assets_for_receiver?: InputMaybe<Order_By>;
  /** Transaction index for event ordering. */
  transaction_index?: InputMaybe<Order_By>;
};

/** aggregate var_samp on columns */
export type Positions_Var_Samp_Fields = {
  __typename?: 'positions_var_samp_fields';
  /** Block number of most recent position update. */
  block_number?: Maybe<Scalars['Float']['output']>;
  /** Bonding curve ID of the vault. */
  curve_id?: Maybe<Scalars['Float']['output']>;
  /** Log index of most recent position update. */
  log_index?: Maybe<Scalars['Float']['output']>;
  /** Current number of shares held in this position. */
  shares?: Maybe<Scalars['Float']['output']>;
  /** Cumulative assets deposited after fees, for profit/loss calculation, in wei. */
  total_deposit_assets_after_total_fees?: Maybe<Scalars['Float']['output']>;
  /** Cumulative assets redeemed, for profit/loss calculation, in wei. */
  total_redeem_assets_for_receiver?: Maybe<Scalars['Float']['output']>;
  /** Transaction index for event ordering. */
  transaction_index?: Maybe<Scalars['Float']['output']>;
};

/** order by var_samp() on columns of table "position" */
export type Positions_Var_Samp_Order_By = {
  /** Block number of most recent position update. */
  block_number?: InputMaybe<Order_By>;
  /** Bonding curve ID of the vault. */
  curve_id?: InputMaybe<Order_By>;
  /** Log index of most recent position update. */
  log_index?: InputMaybe<Order_By>;
  /** Current number of shares held in this position. */
  shares?: InputMaybe<Order_By>;
  /** Cumulative assets deposited after fees, for profit/loss calculation, in wei. */
  total_deposit_assets_after_total_fees?: InputMaybe<Order_By>;
  /** Cumulative assets redeemed, for profit/loss calculation, in wei. */
  total_redeem_assets_for_receiver?: InputMaybe<Order_By>;
  /** Transaction index for event ordering. */
  transaction_index?: InputMaybe<Order_By>;
};

/** aggregate variance on columns */
export type Positions_Variance_Fields = {
  __typename?: 'positions_variance_fields';
  /** Block number of most recent position update. */
  block_number?: Maybe<Scalars['Float']['output']>;
  /** Bonding curve ID of the vault. */
  curve_id?: Maybe<Scalars['Float']['output']>;
  /** Log index of most recent position update. */
  log_index?: Maybe<Scalars['Float']['output']>;
  /** Current number of shares held in this position. */
  shares?: Maybe<Scalars['Float']['output']>;
  /** Cumulative assets deposited after fees, for profit/loss calculation, in wei. */
  total_deposit_assets_after_total_fees?: Maybe<Scalars['Float']['output']>;
  /** Cumulative assets redeemed, for profit/loss calculation, in wei. */
  total_redeem_assets_for_receiver?: Maybe<Scalars['Float']['output']>;
  /** Transaction index for event ordering. */
  transaction_index?: Maybe<Scalars['Float']['output']>;
};

/** order by variance() on columns of table "position" */
export type Positions_Variance_Order_By = {
  /** Block number of most recent position update. */
  block_number?: InputMaybe<Order_By>;
  /** Bonding curve ID of the vault. */
  curve_id?: InputMaybe<Order_By>;
  /** Log index of most recent position update. */
  log_index?: InputMaybe<Order_By>;
  /** Current number of shares held in this position. */
  shares?: InputMaybe<Order_By>;
  /** Cumulative assets deposited after fees, for profit/loss calculation, in wei. */
  total_deposit_assets_after_total_fees?: InputMaybe<Order_By>;
  /** Cumulative assets redeemed, for profit/loss calculation, in wei. */
  total_redeem_assets_for_receiver?: InputMaybe<Order_By>;
  /** Transaction index for event ordering. */
  transaction_index?: InputMaybe<Order_By>;
};

/** columns and relationships of "position_with_value" */
export type Positions_With_Value = {
  __typename?: 'positions_with_value';
  /** An object relationship */
  account?: Maybe<Accounts>;
  account_id?: Maybe<Scalars['String']['output']>;
  block_number?: Maybe<Scalars['bigint']['output']>;
  created_at?: Maybe<Scalars['timestamptz']['output']>;
  curve_id?: Maybe<Scalars['numeric']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  log_index?: Maybe<Scalars['bigint']['output']>;
  pnl?: Maybe<Scalars['numeric']['output']>;
  pnl_pct?: Maybe<Scalars['numeric']['output']>;
  redeemable_assets?: Maybe<Scalars['numeric']['output']>;
  shares?: Maybe<Scalars['numeric']['output']>;
  /** An object relationship */
  term?: Maybe<Terms>;
  term_id?: Maybe<Scalars['String']['output']>;
  theoretical_value?: Maybe<Scalars['numeric']['output']>;
  total_deposit_assets_after_total_fees?: Maybe<Scalars['numeric']['output']>;
  total_redeem_assets_for_receiver?: Maybe<Scalars['numeric']['output']>;
  transaction_hash?: Maybe<Scalars['String']['output']>;
  transaction_index?: Maybe<Scalars['bigint']['output']>;
  updated_at?: Maybe<Scalars['timestamptz']['output']>;
  /** An object relationship */
  vault?: Maybe<Vaults>;
};

/** aggregated selection of "position_with_value" */
export type Positions_With_Value_Aggregate = {
  __typename?: 'positions_with_value_aggregate';
  aggregate?: Maybe<Positions_With_Value_Aggregate_Fields>;
  nodes: Array<Positions_With_Value>;
};

/** aggregate fields of "position_with_value" */
export type Positions_With_Value_Aggregate_Fields = {
  __typename?: 'positions_with_value_aggregate_fields';
  avg?: Maybe<Positions_With_Value_Avg_Fields>;
  count: Scalars['Int']['output'];
  max?: Maybe<Positions_With_Value_Max_Fields>;
  min?: Maybe<Positions_With_Value_Min_Fields>;
  stddev?: Maybe<Positions_With_Value_Stddev_Fields>;
  stddev_pop?: Maybe<Positions_With_Value_Stddev_Pop_Fields>;
  stddev_samp?: Maybe<Positions_With_Value_Stddev_Samp_Fields>;
  sum?: Maybe<Positions_With_Value_Sum_Fields>;
  var_pop?: Maybe<Positions_With_Value_Var_Pop_Fields>;
  var_samp?: Maybe<Positions_With_Value_Var_Samp_Fields>;
  variance?: Maybe<Positions_With_Value_Variance_Fields>;
};


/** aggregate fields of "position_with_value" */
export type Positions_With_Value_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Positions_With_Value_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
};

/** aggregate avg on columns */
export type Positions_With_Value_Avg_Fields = {
  __typename?: 'positions_with_value_avg_fields';
  block_number?: Maybe<Scalars['Float']['output']>;
  curve_id?: Maybe<Scalars['Float']['output']>;
  log_index?: Maybe<Scalars['Float']['output']>;
  pnl?: Maybe<Scalars['Float']['output']>;
  pnl_pct?: Maybe<Scalars['Float']['output']>;
  redeemable_assets?: Maybe<Scalars['Float']['output']>;
  shares?: Maybe<Scalars['Float']['output']>;
  theoretical_value?: Maybe<Scalars['Float']['output']>;
  total_deposit_assets_after_total_fees?: Maybe<Scalars['Float']['output']>;
  total_redeem_assets_for_receiver?: Maybe<Scalars['Float']['output']>;
  transaction_index?: Maybe<Scalars['Float']['output']>;
};

/** Boolean expression to filter rows from the table "position_with_value". All fields are combined with a logical 'AND'. */
export type Positions_With_Value_Bool_Exp = {
  _and?: InputMaybe<Array<Positions_With_Value_Bool_Exp>>;
  _not?: InputMaybe<Positions_With_Value_Bool_Exp>;
  _or?: InputMaybe<Array<Positions_With_Value_Bool_Exp>>;
  account?: InputMaybe<Accounts_Bool_Exp>;
  account_id?: InputMaybe<String_Comparison_Exp>;
  block_number?: InputMaybe<Bigint_Comparison_Exp>;
  created_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  curve_id?: InputMaybe<Numeric_Comparison_Exp>;
  id?: InputMaybe<String_Comparison_Exp>;
  log_index?: InputMaybe<Bigint_Comparison_Exp>;
  pnl?: InputMaybe<Numeric_Comparison_Exp>;
  pnl_pct?: InputMaybe<Numeric_Comparison_Exp>;
  redeemable_assets?: InputMaybe<Numeric_Comparison_Exp>;
  shares?: InputMaybe<Numeric_Comparison_Exp>;
  term?: InputMaybe<Terms_Bool_Exp>;
  term_id?: InputMaybe<String_Comparison_Exp>;
  theoretical_value?: InputMaybe<Numeric_Comparison_Exp>;
  total_deposit_assets_after_total_fees?: InputMaybe<Numeric_Comparison_Exp>;
  total_redeem_assets_for_receiver?: InputMaybe<Numeric_Comparison_Exp>;
  transaction_hash?: InputMaybe<String_Comparison_Exp>;
  transaction_index?: InputMaybe<Bigint_Comparison_Exp>;
  updated_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  vault?: InputMaybe<Vaults_Bool_Exp>;
};

/** aggregate max on columns */
export type Positions_With_Value_Max_Fields = {
  __typename?: 'positions_with_value_max_fields';
  account_id?: Maybe<Scalars['String']['output']>;
  block_number?: Maybe<Scalars['bigint']['output']>;
  created_at?: Maybe<Scalars['timestamptz']['output']>;
  curve_id?: Maybe<Scalars['numeric']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  log_index?: Maybe<Scalars['bigint']['output']>;
  pnl?: Maybe<Scalars['numeric']['output']>;
  pnl_pct?: Maybe<Scalars['numeric']['output']>;
  redeemable_assets?: Maybe<Scalars['numeric']['output']>;
  shares?: Maybe<Scalars['numeric']['output']>;
  term_id?: Maybe<Scalars['String']['output']>;
  theoretical_value?: Maybe<Scalars['numeric']['output']>;
  total_deposit_assets_after_total_fees?: Maybe<Scalars['numeric']['output']>;
  total_redeem_assets_for_receiver?: Maybe<Scalars['numeric']['output']>;
  transaction_hash?: Maybe<Scalars['String']['output']>;
  transaction_index?: Maybe<Scalars['bigint']['output']>;
  updated_at?: Maybe<Scalars['timestamptz']['output']>;
};

/** aggregate min on columns */
export type Positions_With_Value_Min_Fields = {
  __typename?: 'positions_with_value_min_fields';
  account_id?: Maybe<Scalars['String']['output']>;
  block_number?: Maybe<Scalars['bigint']['output']>;
  created_at?: Maybe<Scalars['timestamptz']['output']>;
  curve_id?: Maybe<Scalars['numeric']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  log_index?: Maybe<Scalars['bigint']['output']>;
  pnl?: Maybe<Scalars['numeric']['output']>;
  pnl_pct?: Maybe<Scalars['numeric']['output']>;
  redeemable_assets?: Maybe<Scalars['numeric']['output']>;
  shares?: Maybe<Scalars['numeric']['output']>;
  term_id?: Maybe<Scalars['String']['output']>;
  theoretical_value?: Maybe<Scalars['numeric']['output']>;
  total_deposit_assets_after_total_fees?: Maybe<Scalars['numeric']['output']>;
  total_redeem_assets_for_receiver?: Maybe<Scalars['numeric']['output']>;
  transaction_hash?: Maybe<Scalars['String']['output']>;
  transaction_index?: Maybe<Scalars['bigint']['output']>;
  updated_at?: Maybe<Scalars['timestamptz']['output']>;
};

/** Ordering options when selecting data from "position_with_value". */
export type Positions_With_Value_Order_By = {
  account?: InputMaybe<Accounts_Order_By>;
  account_id?: InputMaybe<Order_By>;
  block_number?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  curve_id?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  log_index?: InputMaybe<Order_By>;
  pnl?: InputMaybe<Order_By>;
  pnl_pct?: InputMaybe<Order_By>;
  redeemable_assets?: InputMaybe<Order_By>;
  shares?: InputMaybe<Order_By>;
  term?: InputMaybe<Terms_Order_By>;
  term_id?: InputMaybe<Order_By>;
  theoretical_value?: InputMaybe<Order_By>;
  total_deposit_assets_after_total_fees?: InputMaybe<Order_By>;
  total_redeem_assets_for_receiver?: InputMaybe<Order_By>;
  transaction_hash?: InputMaybe<Order_By>;
  transaction_index?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
  vault?: InputMaybe<Vaults_Order_By>;
};

/** select columns of table "position_with_value" */
export type Positions_With_Value_Select_Column =
  /** column name */
  | 'account_id'
  /** column name */
  | 'block_number'
  /** column name */
  | 'created_at'
  /** column name */
  | 'curve_id'
  /** column name */
  | 'id'
  /** column name */
  | 'log_index'
  /** column name */
  | 'pnl'
  /** column name */
  | 'pnl_pct'
  /** column name */
  | 'redeemable_assets'
  /** column name */
  | 'shares'
  /** column name */
  | 'term_id'
  /** column name */
  | 'theoretical_value'
  /** column name */
  | 'total_deposit_assets_after_total_fees'
  /** column name */
  | 'total_redeem_assets_for_receiver'
  /** column name */
  | 'transaction_hash'
  /** column name */
  | 'transaction_index'
  /** column name */
  | 'updated_at';

/** aggregate stddev on columns */
export type Positions_With_Value_Stddev_Fields = {
  __typename?: 'positions_with_value_stddev_fields';
  block_number?: Maybe<Scalars['Float']['output']>;
  curve_id?: Maybe<Scalars['Float']['output']>;
  log_index?: Maybe<Scalars['Float']['output']>;
  pnl?: Maybe<Scalars['Float']['output']>;
  pnl_pct?: Maybe<Scalars['Float']['output']>;
  redeemable_assets?: Maybe<Scalars['Float']['output']>;
  shares?: Maybe<Scalars['Float']['output']>;
  theoretical_value?: Maybe<Scalars['Float']['output']>;
  total_deposit_assets_after_total_fees?: Maybe<Scalars['Float']['output']>;
  total_redeem_assets_for_receiver?: Maybe<Scalars['Float']['output']>;
  transaction_index?: Maybe<Scalars['Float']['output']>;
};

/** aggregate stddev_pop on columns */
export type Positions_With_Value_Stddev_Pop_Fields = {
  __typename?: 'positions_with_value_stddev_pop_fields';
  block_number?: Maybe<Scalars['Float']['output']>;
  curve_id?: Maybe<Scalars['Float']['output']>;
  log_index?: Maybe<Scalars['Float']['output']>;
  pnl?: Maybe<Scalars['Float']['output']>;
  pnl_pct?: Maybe<Scalars['Float']['output']>;
  redeemable_assets?: Maybe<Scalars['Float']['output']>;
  shares?: Maybe<Scalars['Float']['output']>;
  theoretical_value?: Maybe<Scalars['Float']['output']>;
  total_deposit_assets_after_total_fees?: Maybe<Scalars['Float']['output']>;
  total_redeem_assets_for_receiver?: Maybe<Scalars['Float']['output']>;
  transaction_index?: Maybe<Scalars['Float']['output']>;
};

/** aggregate stddev_samp on columns */
export type Positions_With_Value_Stddev_Samp_Fields = {
  __typename?: 'positions_with_value_stddev_samp_fields';
  block_number?: Maybe<Scalars['Float']['output']>;
  curve_id?: Maybe<Scalars['Float']['output']>;
  log_index?: Maybe<Scalars['Float']['output']>;
  pnl?: Maybe<Scalars['Float']['output']>;
  pnl_pct?: Maybe<Scalars['Float']['output']>;
  redeemable_assets?: Maybe<Scalars['Float']['output']>;
  shares?: Maybe<Scalars['Float']['output']>;
  theoretical_value?: Maybe<Scalars['Float']['output']>;
  total_deposit_assets_after_total_fees?: Maybe<Scalars['Float']['output']>;
  total_redeem_assets_for_receiver?: Maybe<Scalars['Float']['output']>;
  transaction_index?: Maybe<Scalars['Float']['output']>;
};

/** Streaming cursor of the table "positions_with_value" */
export type Positions_With_Value_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Positions_With_Value_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Positions_With_Value_Stream_Cursor_Value_Input = {
  account_id?: InputMaybe<Scalars['String']['input']>;
  block_number?: InputMaybe<Scalars['bigint']['input']>;
  created_at?: InputMaybe<Scalars['timestamptz']['input']>;
  curve_id?: InputMaybe<Scalars['numeric']['input']>;
  id?: InputMaybe<Scalars['String']['input']>;
  log_index?: InputMaybe<Scalars['bigint']['input']>;
  pnl?: InputMaybe<Scalars['numeric']['input']>;
  pnl_pct?: InputMaybe<Scalars['numeric']['input']>;
  redeemable_assets?: InputMaybe<Scalars['numeric']['input']>;
  shares?: InputMaybe<Scalars['numeric']['input']>;
  term_id?: InputMaybe<Scalars['String']['input']>;
  theoretical_value?: InputMaybe<Scalars['numeric']['input']>;
  total_deposit_assets_after_total_fees?: InputMaybe<Scalars['numeric']['input']>;
  total_redeem_assets_for_receiver?: InputMaybe<Scalars['numeric']['input']>;
  transaction_hash?: InputMaybe<Scalars['String']['input']>;
  transaction_index?: InputMaybe<Scalars['bigint']['input']>;
  updated_at?: InputMaybe<Scalars['timestamptz']['input']>;
};

/** aggregate sum on columns */
export type Positions_With_Value_Sum_Fields = {
  __typename?: 'positions_with_value_sum_fields';
  block_number?: Maybe<Scalars['bigint']['output']>;
  curve_id?: Maybe<Scalars['numeric']['output']>;
  log_index?: Maybe<Scalars['bigint']['output']>;
  pnl?: Maybe<Scalars['numeric']['output']>;
  pnl_pct?: Maybe<Scalars['numeric']['output']>;
  redeemable_assets?: Maybe<Scalars['numeric']['output']>;
  shares?: Maybe<Scalars['numeric']['output']>;
  theoretical_value?: Maybe<Scalars['numeric']['output']>;
  total_deposit_assets_after_total_fees?: Maybe<Scalars['numeric']['output']>;
  total_redeem_assets_for_receiver?: Maybe<Scalars['numeric']['output']>;
  transaction_index?: Maybe<Scalars['bigint']['output']>;
};

/** aggregate var_pop on columns */
export type Positions_With_Value_Var_Pop_Fields = {
  __typename?: 'positions_with_value_var_pop_fields';
  block_number?: Maybe<Scalars['Float']['output']>;
  curve_id?: Maybe<Scalars['Float']['output']>;
  log_index?: Maybe<Scalars['Float']['output']>;
  pnl?: Maybe<Scalars['Float']['output']>;
  pnl_pct?: Maybe<Scalars['Float']['output']>;
  redeemable_assets?: Maybe<Scalars['Float']['output']>;
  shares?: Maybe<Scalars['Float']['output']>;
  theoretical_value?: Maybe<Scalars['Float']['output']>;
  total_deposit_assets_after_total_fees?: Maybe<Scalars['Float']['output']>;
  total_redeem_assets_for_receiver?: Maybe<Scalars['Float']['output']>;
  transaction_index?: Maybe<Scalars['Float']['output']>;
};

/** aggregate var_samp on columns */
export type Positions_With_Value_Var_Samp_Fields = {
  __typename?: 'positions_with_value_var_samp_fields';
  block_number?: Maybe<Scalars['Float']['output']>;
  curve_id?: Maybe<Scalars['Float']['output']>;
  log_index?: Maybe<Scalars['Float']['output']>;
  pnl?: Maybe<Scalars['Float']['output']>;
  pnl_pct?: Maybe<Scalars['Float']['output']>;
  redeemable_assets?: Maybe<Scalars['Float']['output']>;
  shares?: Maybe<Scalars['Float']['output']>;
  theoretical_value?: Maybe<Scalars['Float']['output']>;
  total_deposit_assets_after_total_fees?: Maybe<Scalars['Float']['output']>;
  total_redeem_assets_for_receiver?: Maybe<Scalars['Float']['output']>;
  transaction_index?: Maybe<Scalars['Float']['output']>;
};

/** aggregate variance on columns */
export type Positions_With_Value_Variance_Fields = {
  __typename?: 'positions_with_value_variance_fields';
  block_number?: Maybe<Scalars['Float']['output']>;
  curve_id?: Maybe<Scalars['Float']['output']>;
  log_index?: Maybe<Scalars['Float']['output']>;
  pnl?: Maybe<Scalars['Float']['output']>;
  pnl_pct?: Maybe<Scalars['Float']['output']>;
  redeemable_assets?: Maybe<Scalars['Float']['output']>;
  shares?: Maybe<Scalars['Float']['output']>;
  theoretical_value?: Maybe<Scalars['Float']['output']>;
  total_deposit_assets_after_total_fees?: Maybe<Scalars['Float']['output']>;
  total_redeem_assets_for_receiver?: Maybe<Scalars['Float']['output']>;
  transaction_index?: Maybe<Scalars['Float']['output']>;
};

/** Denormalized aggregate of triples grouped by (predicate, object) for efficient querying. */
export type Predicate_Objects = {
  __typename?: 'predicate_objects';
  /** An object relationship */
  object?: Maybe<Atoms>;
  /** Object atom ID. */
  object_id: Scalars['String']['output'];
  opposer_count: Scalars['bigint']['output'];
  /** An object relationship */
  predicate?: Maybe<Atoms>;
  /** Predicate atom ID. */
  predicate_id: Scalars['String']['output'];
  supporter_count: Scalars['bigint']['output'];
  /** Total market cap across all triples with this combination, in wei. */
  total_market_cap: Scalars['numeric']['output'];
  /** Total positions across all triples with this combination. */
  total_position_count: Scalars['Int']['output'];
  /** Number of triples with this (predicate, object) combination. */
  triple_count: Scalars['Int']['output'];
  /** An array relationship */
  triples: Array<Triples>;
  /** An aggregate relationship */
  triples_aggregate: Triples_Aggregate;
};


/** Denormalized aggregate of triples grouped by (predicate, object) for efficient querying. */
export type Predicate_ObjectsTriplesArgs = {
  distinct_on?: InputMaybe<Array<Triples_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Triples_Order_By>>;
  where?: InputMaybe<Triples_Bool_Exp>;
};


/** Denormalized aggregate of triples grouped by (predicate, object) for efficient querying. */
export type Predicate_ObjectsTriples_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Triples_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Triples_Order_By>>;
  where?: InputMaybe<Triples_Bool_Exp>;
};

/** aggregated selection of "predicate_object" */
export type Predicate_Objects_Aggregate = {
  __typename?: 'predicate_objects_aggregate';
  aggregate?: Maybe<Predicate_Objects_Aggregate_Fields>;
  nodes: Array<Predicate_Objects>;
};

export type Predicate_Objects_Aggregate_Bool_Exp = {
  count?: InputMaybe<Predicate_Objects_Aggregate_Bool_Exp_Count>;
};

export type Predicate_Objects_Aggregate_Bool_Exp_Count = {
  arguments?: InputMaybe<Array<Predicate_Objects_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
  filter?: InputMaybe<Predicate_Objects_Bool_Exp>;
  predicate: Int_Comparison_Exp;
};

/** aggregate fields of "predicate_object" */
export type Predicate_Objects_Aggregate_Fields = {
  __typename?: 'predicate_objects_aggregate_fields';
  avg?: Maybe<Predicate_Objects_Avg_Fields>;
  count: Scalars['Int']['output'];
  max?: Maybe<Predicate_Objects_Max_Fields>;
  min?: Maybe<Predicate_Objects_Min_Fields>;
  stddev?: Maybe<Predicate_Objects_Stddev_Fields>;
  stddev_pop?: Maybe<Predicate_Objects_Stddev_Pop_Fields>;
  stddev_samp?: Maybe<Predicate_Objects_Stddev_Samp_Fields>;
  sum?: Maybe<Predicate_Objects_Sum_Fields>;
  var_pop?: Maybe<Predicate_Objects_Var_Pop_Fields>;
  var_samp?: Maybe<Predicate_Objects_Var_Samp_Fields>;
  variance?: Maybe<Predicate_Objects_Variance_Fields>;
};


/** aggregate fields of "predicate_object" */
export type Predicate_Objects_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Predicate_Objects_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
};

/** order by aggregate values of table "predicate_object" */
export type Predicate_Objects_Aggregate_Order_By = {
  avg?: InputMaybe<Predicate_Objects_Avg_Order_By>;
  count?: InputMaybe<Order_By>;
  max?: InputMaybe<Predicate_Objects_Max_Order_By>;
  min?: InputMaybe<Predicate_Objects_Min_Order_By>;
  stddev?: InputMaybe<Predicate_Objects_Stddev_Order_By>;
  stddev_pop?: InputMaybe<Predicate_Objects_Stddev_Pop_Order_By>;
  stddev_samp?: InputMaybe<Predicate_Objects_Stddev_Samp_Order_By>;
  sum?: InputMaybe<Predicate_Objects_Sum_Order_By>;
  var_pop?: InputMaybe<Predicate_Objects_Var_Pop_Order_By>;
  var_samp?: InputMaybe<Predicate_Objects_Var_Samp_Order_By>;
  variance?: InputMaybe<Predicate_Objects_Variance_Order_By>;
};

/** aggregate avg on columns */
export type Predicate_Objects_Avg_Fields = {
  __typename?: 'predicate_objects_avg_fields';
  opposer_count?: Maybe<Scalars['Float']['output']>;
  supporter_count?: Maybe<Scalars['Float']['output']>;
  /** Total market cap across all triples with this combination, in wei. */
  total_market_cap?: Maybe<Scalars['Float']['output']>;
  /** Total positions across all triples with this combination. */
  total_position_count?: Maybe<Scalars['Float']['output']>;
  /** Number of triples with this (predicate, object) combination. */
  triple_count?: Maybe<Scalars['Float']['output']>;
};

/** order by avg() on columns of table "predicate_object" */
export type Predicate_Objects_Avg_Order_By = {
  opposer_count?: InputMaybe<Order_By>;
  supporter_count?: InputMaybe<Order_By>;
  /** Total market cap across all triples with this combination, in wei. */
  total_market_cap?: InputMaybe<Order_By>;
  /** Total positions across all triples with this combination. */
  total_position_count?: InputMaybe<Order_By>;
  /** Number of triples with this (predicate, object) combination. */
  triple_count?: InputMaybe<Order_By>;
};

/** Boolean expression to filter rows from the table "predicate_object". All fields are combined with a logical 'AND'. */
export type Predicate_Objects_Bool_Exp = {
  _and?: InputMaybe<Array<Predicate_Objects_Bool_Exp>>;
  _not?: InputMaybe<Predicate_Objects_Bool_Exp>;
  _or?: InputMaybe<Array<Predicate_Objects_Bool_Exp>>;
  object?: InputMaybe<Atoms_Bool_Exp>;
  object_id?: InputMaybe<String_Comparison_Exp>;
  opposer_count?: InputMaybe<Bigint_Comparison_Exp>;
  predicate?: InputMaybe<Atoms_Bool_Exp>;
  predicate_id?: InputMaybe<String_Comparison_Exp>;
  supporter_count?: InputMaybe<Bigint_Comparison_Exp>;
  total_market_cap?: InputMaybe<Numeric_Comparison_Exp>;
  total_position_count?: InputMaybe<Int_Comparison_Exp>;
  triple_count?: InputMaybe<Int_Comparison_Exp>;
  triples?: InputMaybe<Triples_Bool_Exp>;
  triples_aggregate?: InputMaybe<Triples_Aggregate_Bool_Exp>;
};

/** aggregate max on columns */
export type Predicate_Objects_Max_Fields = {
  __typename?: 'predicate_objects_max_fields';
  /** Object atom ID. */
  object_id?: Maybe<Scalars['String']['output']>;
  opposer_count?: Maybe<Scalars['bigint']['output']>;
  /** Predicate atom ID. */
  predicate_id?: Maybe<Scalars['String']['output']>;
  supporter_count?: Maybe<Scalars['bigint']['output']>;
  /** Total market cap across all triples with this combination, in wei. */
  total_market_cap?: Maybe<Scalars['numeric']['output']>;
  /** Total positions across all triples with this combination. */
  total_position_count?: Maybe<Scalars['Int']['output']>;
  /** Number of triples with this (predicate, object) combination. */
  triple_count?: Maybe<Scalars['Int']['output']>;
};

/** order by max() on columns of table "predicate_object" */
export type Predicate_Objects_Max_Order_By = {
  /** Object atom ID. */
  object_id?: InputMaybe<Order_By>;
  opposer_count?: InputMaybe<Order_By>;
  /** Predicate atom ID. */
  predicate_id?: InputMaybe<Order_By>;
  supporter_count?: InputMaybe<Order_By>;
  /** Total market cap across all triples with this combination, in wei. */
  total_market_cap?: InputMaybe<Order_By>;
  /** Total positions across all triples with this combination. */
  total_position_count?: InputMaybe<Order_By>;
  /** Number of triples with this (predicate, object) combination. */
  triple_count?: InputMaybe<Order_By>;
};

/** aggregate min on columns */
export type Predicate_Objects_Min_Fields = {
  __typename?: 'predicate_objects_min_fields';
  /** Object atom ID. */
  object_id?: Maybe<Scalars['String']['output']>;
  opposer_count?: Maybe<Scalars['bigint']['output']>;
  /** Predicate atom ID. */
  predicate_id?: Maybe<Scalars['String']['output']>;
  supporter_count?: Maybe<Scalars['bigint']['output']>;
  /** Total market cap across all triples with this combination, in wei. */
  total_market_cap?: Maybe<Scalars['numeric']['output']>;
  /** Total positions across all triples with this combination. */
  total_position_count?: Maybe<Scalars['Int']['output']>;
  /** Number of triples with this (predicate, object) combination. */
  triple_count?: Maybe<Scalars['Int']['output']>;
};

/** order by min() on columns of table "predicate_object" */
export type Predicate_Objects_Min_Order_By = {
  /** Object atom ID. */
  object_id?: InputMaybe<Order_By>;
  opposer_count?: InputMaybe<Order_By>;
  /** Predicate atom ID. */
  predicate_id?: InputMaybe<Order_By>;
  supporter_count?: InputMaybe<Order_By>;
  /** Total market cap across all triples with this combination, in wei. */
  total_market_cap?: InputMaybe<Order_By>;
  /** Total positions across all triples with this combination. */
  total_position_count?: InputMaybe<Order_By>;
  /** Number of triples with this (predicate, object) combination. */
  triple_count?: InputMaybe<Order_By>;
};

/** Ordering options when selecting data from "predicate_object". */
export type Predicate_Objects_Order_By = {
  object?: InputMaybe<Atoms_Order_By>;
  object_id?: InputMaybe<Order_By>;
  opposer_count?: InputMaybe<Order_By>;
  predicate?: InputMaybe<Atoms_Order_By>;
  predicate_id?: InputMaybe<Order_By>;
  supporter_count?: InputMaybe<Order_By>;
  total_market_cap?: InputMaybe<Order_By>;
  total_position_count?: InputMaybe<Order_By>;
  triple_count?: InputMaybe<Order_By>;
  triples_aggregate?: InputMaybe<Triples_Aggregate_Order_By>;
};

/** select columns of table "predicate_object" */
export type Predicate_Objects_Select_Column =
  /** column name */
  | 'object_id'
  /** column name */
  | 'opposer_count'
  /** column name */
  | 'predicate_id'
  /** column name */
  | 'supporter_count'
  /** column name */
  | 'total_market_cap'
  /** column name */
  | 'total_position_count'
  /** column name */
  | 'triple_count';

/** aggregate stddev on columns */
export type Predicate_Objects_Stddev_Fields = {
  __typename?: 'predicate_objects_stddev_fields';
  opposer_count?: Maybe<Scalars['Float']['output']>;
  supporter_count?: Maybe<Scalars['Float']['output']>;
  /** Total market cap across all triples with this combination, in wei. */
  total_market_cap?: Maybe<Scalars['Float']['output']>;
  /** Total positions across all triples with this combination. */
  total_position_count?: Maybe<Scalars['Float']['output']>;
  /** Number of triples with this (predicate, object) combination. */
  triple_count?: Maybe<Scalars['Float']['output']>;
};

/** order by stddev() on columns of table "predicate_object" */
export type Predicate_Objects_Stddev_Order_By = {
  opposer_count?: InputMaybe<Order_By>;
  supporter_count?: InputMaybe<Order_By>;
  /** Total market cap across all triples with this combination, in wei. */
  total_market_cap?: InputMaybe<Order_By>;
  /** Total positions across all triples with this combination. */
  total_position_count?: InputMaybe<Order_By>;
  /** Number of triples with this (predicate, object) combination. */
  triple_count?: InputMaybe<Order_By>;
};

/** aggregate stddev_pop on columns */
export type Predicate_Objects_Stddev_Pop_Fields = {
  __typename?: 'predicate_objects_stddev_pop_fields';
  opposer_count?: Maybe<Scalars['Float']['output']>;
  supporter_count?: Maybe<Scalars['Float']['output']>;
  /** Total market cap across all triples with this combination, in wei. */
  total_market_cap?: Maybe<Scalars['Float']['output']>;
  /** Total positions across all triples with this combination. */
  total_position_count?: Maybe<Scalars['Float']['output']>;
  /** Number of triples with this (predicate, object) combination. */
  triple_count?: Maybe<Scalars['Float']['output']>;
};

/** order by stddev_pop() on columns of table "predicate_object" */
export type Predicate_Objects_Stddev_Pop_Order_By = {
  opposer_count?: InputMaybe<Order_By>;
  supporter_count?: InputMaybe<Order_By>;
  /** Total market cap across all triples with this combination, in wei. */
  total_market_cap?: InputMaybe<Order_By>;
  /** Total positions across all triples with this combination. */
  total_position_count?: InputMaybe<Order_By>;
  /** Number of triples with this (predicate, object) combination. */
  triple_count?: InputMaybe<Order_By>;
};

/** aggregate stddev_samp on columns */
export type Predicate_Objects_Stddev_Samp_Fields = {
  __typename?: 'predicate_objects_stddev_samp_fields';
  opposer_count?: Maybe<Scalars['Float']['output']>;
  supporter_count?: Maybe<Scalars['Float']['output']>;
  /** Total market cap across all triples with this combination, in wei. */
  total_market_cap?: Maybe<Scalars['Float']['output']>;
  /** Total positions across all triples with this combination. */
  total_position_count?: Maybe<Scalars['Float']['output']>;
  /** Number of triples with this (predicate, object) combination. */
  triple_count?: Maybe<Scalars['Float']['output']>;
};

/** order by stddev_samp() on columns of table "predicate_object" */
export type Predicate_Objects_Stddev_Samp_Order_By = {
  opposer_count?: InputMaybe<Order_By>;
  supporter_count?: InputMaybe<Order_By>;
  /** Total market cap across all triples with this combination, in wei. */
  total_market_cap?: InputMaybe<Order_By>;
  /** Total positions across all triples with this combination. */
  total_position_count?: InputMaybe<Order_By>;
  /** Number of triples with this (predicate, object) combination. */
  triple_count?: InputMaybe<Order_By>;
};

/** Streaming cursor of the table "predicate_objects" */
export type Predicate_Objects_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Predicate_Objects_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Predicate_Objects_Stream_Cursor_Value_Input = {
  /** Object atom ID. */
  object_id?: InputMaybe<Scalars['String']['input']>;
  opposer_count?: InputMaybe<Scalars['bigint']['input']>;
  /** Predicate atom ID. */
  predicate_id?: InputMaybe<Scalars['String']['input']>;
  supporter_count?: InputMaybe<Scalars['bigint']['input']>;
  /** Total market cap across all triples with this combination, in wei. */
  total_market_cap?: InputMaybe<Scalars['numeric']['input']>;
  /** Total positions across all triples with this combination. */
  total_position_count?: InputMaybe<Scalars['Int']['input']>;
  /** Number of triples with this (predicate, object) combination. */
  triple_count?: InputMaybe<Scalars['Int']['input']>;
};

/** aggregate sum on columns */
export type Predicate_Objects_Sum_Fields = {
  __typename?: 'predicate_objects_sum_fields';
  opposer_count?: Maybe<Scalars['bigint']['output']>;
  supporter_count?: Maybe<Scalars['bigint']['output']>;
  /** Total market cap across all triples with this combination, in wei. */
  total_market_cap?: Maybe<Scalars['numeric']['output']>;
  /** Total positions across all triples with this combination. */
  total_position_count?: Maybe<Scalars['Int']['output']>;
  /** Number of triples with this (predicate, object) combination. */
  triple_count?: Maybe<Scalars['Int']['output']>;
};

/** order by sum() on columns of table "predicate_object" */
export type Predicate_Objects_Sum_Order_By = {
  opposer_count?: InputMaybe<Order_By>;
  supporter_count?: InputMaybe<Order_By>;
  /** Total market cap across all triples with this combination, in wei. */
  total_market_cap?: InputMaybe<Order_By>;
  /** Total positions across all triples with this combination. */
  total_position_count?: InputMaybe<Order_By>;
  /** Number of triples with this (predicate, object) combination. */
  triple_count?: InputMaybe<Order_By>;
};

/** aggregate var_pop on columns */
export type Predicate_Objects_Var_Pop_Fields = {
  __typename?: 'predicate_objects_var_pop_fields';
  opposer_count?: Maybe<Scalars['Float']['output']>;
  supporter_count?: Maybe<Scalars['Float']['output']>;
  /** Total market cap across all triples with this combination, in wei. */
  total_market_cap?: Maybe<Scalars['Float']['output']>;
  /** Total positions across all triples with this combination. */
  total_position_count?: Maybe<Scalars['Float']['output']>;
  /** Number of triples with this (predicate, object) combination. */
  triple_count?: Maybe<Scalars['Float']['output']>;
};

/** order by var_pop() on columns of table "predicate_object" */
export type Predicate_Objects_Var_Pop_Order_By = {
  opposer_count?: InputMaybe<Order_By>;
  supporter_count?: InputMaybe<Order_By>;
  /** Total market cap across all triples with this combination, in wei. */
  total_market_cap?: InputMaybe<Order_By>;
  /** Total positions across all triples with this combination. */
  total_position_count?: InputMaybe<Order_By>;
  /** Number of triples with this (predicate, object) combination. */
  triple_count?: InputMaybe<Order_By>;
};

/** aggregate var_samp on columns */
export type Predicate_Objects_Var_Samp_Fields = {
  __typename?: 'predicate_objects_var_samp_fields';
  opposer_count?: Maybe<Scalars['Float']['output']>;
  supporter_count?: Maybe<Scalars['Float']['output']>;
  /** Total market cap across all triples with this combination, in wei. */
  total_market_cap?: Maybe<Scalars['Float']['output']>;
  /** Total positions across all triples with this combination. */
  total_position_count?: Maybe<Scalars['Float']['output']>;
  /** Number of triples with this (predicate, object) combination. */
  triple_count?: Maybe<Scalars['Float']['output']>;
};

/** order by var_samp() on columns of table "predicate_object" */
export type Predicate_Objects_Var_Samp_Order_By = {
  opposer_count?: InputMaybe<Order_By>;
  supporter_count?: InputMaybe<Order_By>;
  /** Total market cap across all triples with this combination, in wei. */
  total_market_cap?: InputMaybe<Order_By>;
  /** Total positions across all triples with this combination. */
  total_position_count?: InputMaybe<Order_By>;
  /** Number of triples with this (predicate, object) combination. */
  triple_count?: InputMaybe<Order_By>;
};

/** aggregate variance on columns */
export type Predicate_Objects_Variance_Fields = {
  __typename?: 'predicate_objects_variance_fields';
  opposer_count?: Maybe<Scalars['Float']['output']>;
  supporter_count?: Maybe<Scalars['Float']['output']>;
  /** Total market cap across all triples with this combination, in wei. */
  total_market_cap?: Maybe<Scalars['Float']['output']>;
  /** Total positions across all triples with this combination. */
  total_position_count?: Maybe<Scalars['Float']['output']>;
  /** Number of triples with this (predicate, object) combination. */
  triple_count?: Maybe<Scalars['Float']['output']>;
};

/** order by variance() on columns of table "predicate_object" */
export type Predicate_Objects_Variance_Order_By = {
  opposer_count?: InputMaybe<Order_By>;
  supporter_count?: InputMaybe<Order_By>;
  /** Total market cap across all triples with this combination, in wei. */
  total_market_cap?: InputMaybe<Order_By>;
  /** Total positions across all triples with this combination. */
  total_position_count?: InputMaybe<Order_By>;
  /** Number of triples with this (predicate, object) combination. */
  triple_count?: InputMaybe<Order_By>;
};

/** columns and relationships of "protocol_fee_accrued" */
export type Protocol_Fee_Accruals = {
  __typename?: 'protocol_fee_accruals';
  amount: Scalars['numeric']['output'];
  block_number: Scalars['numeric']['output'];
  created_at: Scalars['timestamptz']['output'];
  epoch: Scalars['numeric']['output'];
  id: Scalars['String']['output'];
  /** An object relationship */
  sender?: Maybe<Accounts>;
  sender_id: Scalars['String']['output'];
  transaction_hash: Scalars['String']['output'];
};

/** aggregated selection of "protocol_fee_accrued" */
export type Protocol_Fee_Accruals_Aggregate = {
  __typename?: 'protocol_fee_accruals_aggregate';
  aggregate?: Maybe<Protocol_Fee_Accruals_Aggregate_Fields>;
  nodes: Array<Protocol_Fee_Accruals>;
};

/** aggregate fields of "protocol_fee_accrued" */
export type Protocol_Fee_Accruals_Aggregate_Fields = {
  __typename?: 'protocol_fee_accruals_aggregate_fields';
  avg?: Maybe<Protocol_Fee_Accruals_Avg_Fields>;
  count: Scalars['Int']['output'];
  max?: Maybe<Protocol_Fee_Accruals_Max_Fields>;
  min?: Maybe<Protocol_Fee_Accruals_Min_Fields>;
  stddev?: Maybe<Protocol_Fee_Accruals_Stddev_Fields>;
  stddev_pop?: Maybe<Protocol_Fee_Accruals_Stddev_Pop_Fields>;
  stddev_samp?: Maybe<Protocol_Fee_Accruals_Stddev_Samp_Fields>;
  sum?: Maybe<Protocol_Fee_Accruals_Sum_Fields>;
  var_pop?: Maybe<Protocol_Fee_Accruals_Var_Pop_Fields>;
  var_samp?: Maybe<Protocol_Fee_Accruals_Var_Samp_Fields>;
  variance?: Maybe<Protocol_Fee_Accruals_Variance_Fields>;
};


/** aggregate fields of "protocol_fee_accrued" */
export type Protocol_Fee_Accruals_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Protocol_Fee_Accruals_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
};

/** aggregate avg on columns */
export type Protocol_Fee_Accruals_Avg_Fields = {
  __typename?: 'protocol_fee_accruals_avg_fields';
  amount?: Maybe<Scalars['Float']['output']>;
  block_number?: Maybe<Scalars['Float']['output']>;
  epoch?: Maybe<Scalars['Float']['output']>;
};

/** Boolean expression to filter rows from the table "protocol_fee_accrued". All fields are combined with a logical 'AND'. */
export type Protocol_Fee_Accruals_Bool_Exp = {
  _and?: InputMaybe<Array<Protocol_Fee_Accruals_Bool_Exp>>;
  _not?: InputMaybe<Protocol_Fee_Accruals_Bool_Exp>;
  _or?: InputMaybe<Array<Protocol_Fee_Accruals_Bool_Exp>>;
  amount?: InputMaybe<Numeric_Comparison_Exp>;
  block_number?: InputMaybe<Numeric_Comparison_Exp>;
  created_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  epoch?: InputMaybe<Numeric_Comparison_Exp>;
  id?: InputMaybe<String_Comparison_Exp>;
  sender?: InputMaybe<Accounts_Bool_Exp>;
  sender_id?: InputMaybe<String_Comparison_Exp>;
  transaction_hash?: InputMaybe<String_Comparison_Exp>;
};

/** aggregate max on columns */
export type Protocol_Fee_Accruals_Max_Fields = {
  __typename?: 'protocol_fee_accruals_max_fields';
  amount?: Maybe<Scalars['numeric']['output']>;
  block_number?: Maybe<Scalars['numeric']['output']>;
  created_at?: Maybe<Scalars['timestamptz']['output']>;
  epoch?: Maybe<Scalars['numeric']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  sender_id?: Maybe<Scalars['String']['output']>;
  transaction_hash?: Maybe<Scalars['String']['output']>;
};

/** aggregate min on columns */
export type Protocol_Fee_Accruals_Min_Fields = {
  __typename?: 'protocol_fee_accruals_min_fields';
  amount?: Maybe<Scalars['numeric']['output']>;
  block_number?: Maybe<Scalars['numeric']['output']>;
  created_at?: Maybe<Scalars['timestamptz']['output']>;
  epoch?: Maybe<Scalars['numeric']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  sender_id?: Maybe<Scalars['String']['output']>;
  transaction_hash?: Maybe<Scalars['String']['output']>;
};

/** Ordering options when selecting data from "protocol_fee_accrued". */
export type Protocol_Fee_Accruals_Order_By = {
  amount?: InputMaybe<Order_By>;
  block_number?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  epoch?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  sender?: InputMaybe<Accounts_Order_By>;
  sender_id?: InputMaybe<Order_By>;
  transaction_hash?: InputMaybe<Order_By>;
};

/** select columns of table "protocol_fee_accrued" */
export type Protocol_Fee_Accruals_Select_Column =
  /** column name */
  | 'amount'
  /** column name */
  | 'block_number'
  /** column name */
  | 'created_at'
  /** column name */
  | 'epoch'
  /** column name */
  | 'id'
  /** column name */
  | 'sender_id'
  /** column name */
  | 'transaction_hash';

/** aggregate stddev on columns */
export type Protocol_Fee_Accruals_Stddev_Fields = {
  __typename?: 'protocol_fee_accruals_stddev_fields';
  amount?: Maybe<Scalars['Float']['output']>;
  block_number?: Maybe<Scalars['Float']['output']>;
  epoch?: Maybe<Scalars['Float']['output']>;
};

/** aggregate stddev_pop on columns */
export type Protocol_Fee_Accruals_Stddev_Pop_Fields = {
  __typename?: 'protocol_fee_accruals_stddev_pop_fields';
  amount?: Maybe<Scalars['Float']['output']>;
  block_number?: Maybe<Scalars['Float']['output']>;
  epoch?: Maybe<Scalars['Float']['output']>;
};

/** aggregate stddev_samp on columns */
export type Protocol_Fee_Accruals_Stddev_Samp_Fields = {
  __typename?: 'protocol_fee_accruals_stddev_samp_fields';
  amount?: Maybe<Scalars['Float']['output']>;
  block_number?: Maybe<Scalars['Float']['output']>;
  epoch?: Maybe<Scalars['Float']['output']>;
};

/** Streaming cursor of the table "protocol_fee_accruals" */
export type Protocol_Fee_Accruals_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Protocol_Fee_Accruals_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Protocol_Fee_Accruals_Stream_Cursor_Value_Input = {
  amount?: InputMaybe<Scalars['numeric']['input']>;
  block_number?: InputMaybe<Scalars['numeric']['input']>;
  created_at?: InputMaybe<Scalars['timestamptz']['input']>;
  epoch?: InputMaybe<Scalars['numeric']['input']>;
  id?: InputMaybe<Scalars['String']['input']>;
  sender_id?: InputMaybe<Scalars['String']['input']>;
  transaction_hash?: InputMaybe<Scalars['String']['input']>;
};

/** aggregate sum on columns */
export type Protocol_Fee_Accruals_Sum_Fields = {
  __typename?: 'protocol_fee_accruals_sum_fields';
  amount?: Maybe<Scalars['numeric']['output']>;
  block_number?: Maybe<Scalars['numeric']['output']>;
  epoch?: Maybe<Scalars['numeric']['output']>;
};

/** aggregate var_pop on columns */
export type Protocol_Fee_Accruals_Var_Pop_Fields = {
  __typename?: 'protocol_fee_accruals_var_pop_fields';
  amount?: Maybe<Scalars['Float']['output']>;
  block_number?: Maybe<Scalars['Float']['output']>;
  epoch?: Maybe<Scalars['Float']['output']>;
};

/** aggregate var_samp on columns */
export type Protocol_Fee_Accruals_Var_Samp_Fields = {
  __typename?: 'protocol_fee_accruals_var_samp_fields';
  amount?: Maybe<Scalars['Float']['output']>;
  block_number?: Maybe<Scalars['Float']['output']>;
  epoch?: Maybe<Scalars['Float']['output']>;
};

/** aggregate variance on columns */
export type Protocol_Fee_Accruals_Variance_Fields = {
  __typename?: 'protocol_fee_accruals_variance_fields';
  amount?: Maybe<Scalars['Float']['output']>;
  block_number?: Maybe<Scalars['Float']['output']>;
  epoch?: Maybe<Scalars['Float']['output']>;
};

export type Query_Root = {
  __typename?: 'query_root';
  /** fetch data from the table: "account" using primary key columns */
  account?: Maybe<Accounts>;
  /** fetch data from the table: "account_pnl_rank" */
  account_pnl_rank: Array<Account_Pnl_Rank>;
  /** fetch aggregated fields from the table: "account_pnl_rank" */
  account_pnl_rank_aggregate: Account_Pnl_Rank_Aggregate;
  /** An array relationship */
  accounts: Array<Accounts>;
  /** An aggregate relationship */
  accounts_aggregate: Accounts_Aggregate;
  /** fetch data from the table: "atom" using primary key columns */
  atom?: Maybe<Atoms>;
  /** fetch data from the table: "atom_value" using primary key columns */
  atom_value?: Maybe<Atom_Values>;
  /** fetch data from the table: "atom_value" */
  atom_values: Array<Atom_Values>;
  /** fetch aggregated fields from the table: "atom_value" */
  atom_values_aggregate: Atom_Values_Aggregate;
  /** An array relationship */
  atoms: Array<Atoms>;
  /** An aggregate relationship */
  atoms_aggregate: Atoms_Aggregate;
  /** fetch data from the table: "book" using primary key columns */
  book?: Maybe<Books>;
  /** fetch data from the table: "book" */
  books: Array<Books>;
  /** fetch aggregated fields from the table: "book" */
  books_aggregate: Books_Aggregate;
  /** fetch data from the table: "byte_object" */
  byte_object: Array<Byte_Object>;
  /** fetch aggregated fields from the table: "byte_object" */
  byte_object_aggregate: Byte_Object_Aggregate;
  /** fetch data from the table: "byte_object" using primary key columns */
  byte_object_by_pk?: Maybe<Byte_Object>;
  /** fetch data from the table: "cached_images.cached_image" */
  cached_images_cached_image: Array<Cached_Images_Cached_Image>;
  /** fetch data from the table: "cached_images.cached_image" using primary key columns */
  cached_images_cached_image_by_pk?: Maybe<Cached_Images_Cached_Image>;
  /** fetch data from the table: "caip10" using primary key columns */
  caip10?: Maybe<Caip10>;
  /** fetch aggregated fields from the table: "caip10" */
  caip10_aggregate: Caip10_Aggregate;
  /** fetch data from the table: "caip10" */
  caip10s: Array<Caip10>;
  /** fetch data from the table: "chainlink_price" using primary key columns */
  chainlink_price?: Maybe<Chainlink_Prices>;
  /** fetch data from the table: "chainlink_price" */
  chainlink_prices: Array<Chainlink_Prices>;
  /** fetch data from the table: "deposit" using primary key columns */
  deposit?: Maybe<Deposits>;
  /** An array relationship */
  deposits: Array<Deposits>;
  /** An aggregate relationship */
  deposits_aggregate: Deposits_Aggregate;
  /** fetch data from the table: "event" using primary key columns */
  event?: Maybe<Events>;
  /** fetch data from the table: "event" */
  events: Array<Events>;
  /** fetch aggregated fields from the table: "event" */
  events_aggregate: Events_Aggregate;
  /** fetch data from the table: "fee_transfer" using primary key columns */
  fee_transfer?: Maybe<Fee_Transfers>;
  /** An array relationship */
  fee_transfers: Array<Fee_Transfers>;
  /** An aggregate relationship */
  fee_transfers_aggregate: Fee_Transfers_Aggregate;
  /** execute function "following" which returns "account" */
  following: Array<Accounts>;
  /** execute function "following" and query aggregates on result of table type "account" */
  following_aggregate: Accounts_Aggregate;
  /** Fetches account-level PnL chart data */
  getAccountPnlChart?: Maybe<AccountPnlChartOutput>;
  /** Fetches current account PnL snapshot */
  getAccountPnlCurrent?: Maybe<AccountPnlSnapshotOutput>;
  /** Fetches realized PnL breakdown for an account */
  getAccountPnlRealized?: Maybe<AccountPnlRealizedOutput>;
  /** Fetches chart data (JSON) for a term/curve combination */
  getChartJson?: Maybe<ChartDataOutput>;
  /** Fetches raw share price chart data (JSON) from share_price_change */
  getChartRawJson?: Maybe<ChartDataOutput>;
  /** Fetches raw share price chart SVG from share_price_change */
  getChartRawSvg?: Maybe<ChartSvgOutput>;
  /** Fetches chart SVG for a term/curve combination */
  getChartSvg?: Maybe<ChartSvgOutput>;
  /** Fetches position PnL chart data */
  getPositionPnlChart?: Maybe<PositionPnlChartOutput>;
  /** execute function "get_account_pnl_rank" which returns "account_pnl_rank" */
  get_account_pnl_rank: Array<Account_Pnl_Rank>;
  /** execute function "get_account_pnl_rank" and query aggregates on result of table type "account_pnl_rank" */
  get_account_pnl_rank_aggregate: Account_Pnl_Rank_Aggregate;
  /** execute function "get_pnl_leaderboard" which returns "pnl_leaderboard_entry" */
  get_pnl_leaderboard: Array<Pnl_Leaderboard_Entry>;
  /** execute function "get_pnl_leaderboard" and query aggregates on result of table type "pnl_leaderboard_entry" */
  get_pnl_leaderboard_aggregate: Pnl_Leaderboard_Entry_Aggregate;
  /** PnL leaderboard for a period - proxied through chart-api with Redis caching */
  get_pnl_leaderboard_period?: Maybe<Array<PnlLeaderboardEntryOutput>>;
  /** PnL leaderboard for a period with min deposit threshold - filters out low-stake positions */
  get_pnl_leaderboard_period_min_threshold?: Maybe<Array<PnlLeaderboardEntryOutput>>;
  /** execute function "get_pnl_leaderboard_stats" which returns "pnl_leaderboard_stats" */
  get_pnl_leaderboard_stats: Array<Pnl_Leaderboard_Stats>;
  /** execute function "get_pnl_leaderboard_stats" and query aggregates on result of table type "pnl_leaderboard_stats" */
  get_pnl_leaderboard_stats_aggregate: Pnl_Leaderboard_Stats_Aggregate;
  /** execute function "get_vault_leaderboard" which returns "pnl_leaderboard_entry" */
  get_vault_leaderboard: Array<Pnl_Leaderboard_Entry>;
  /** execute function "get_vault_leaderboard" and query aggregates on result of table type "pnl_leaderboard_entry" */
  get_vault_leaderboard_aggregate: Pnl_Leaderboard_Entry_Aggregate;
  /** fetch data from the table: "json_object" using primary key columns */
  json_object?: Maybe<Json_Objects>;
  /** fetch data from the table: "json_object" */
  json_objects: Array<Json_Objects>;
  /** fetch aggregated fields from the table: "json_object" */
  json_objects_aggregate: Json_Objects_Aggregate;
  /** fetch data from the table: "organization" using primary key columns */
  organization?: Maybe<Organizations>;
  /** fetch data from the table: "organization" */
  organizations: Array<Organizations>;
  /** fetch aggregated fields from the table: "organization" */
  organizations_aggregate: Organizations_Aggregate;
  /** fetch data from the table: "person" using primary key columns */
  person?: Maybe<Persons>;
  /** fetch data from the table: "person" */
  persons: Array<Persons>;
  /** fetch aggregated fields from the table: "person" */
  persons_aggregate: Persons_Aggregate;
  /** fetch data from the table: "pnl_leaderboard_entry" */
  pnl_leaderboard_entry: Array<Pnl_Leaderboard_Entry>;
  /** fetch aggregated fields from the table: "pnl_leaderboard_entry" */
  pnl_leaderboard_entry_aggregate: Pnl_Leaderboard_Entry_Aggregate;
  /** fetch data from the table: "pnl_leaderboard_stats" */
  pnl_leaderboard_stats: Array<Pnl_Leaderboard_Stats>;
  /** fetch aggregated fields from the table: "pnl_leaderboard_stats" */
  pnl_leaderboard_stats_aggregate: Pnl_Leaderboard_Stats_Aggregate;
  /** fetch data from the table: "position" using primary key columns */
  position?: Maybe<Positions>;
  /** fetch data from the table: "position_change_daily" */
  position_change_daily: Array<Position_Change_Daily>;
  /** fetch data from the table: "position_change_hourly" */
  position_change_hourly: Array<Position_Change_Hourly>;
  /** fetch data from the table: "position_change" */
  position_changes: Array<Position_Changes>;
  /** fetch aggregated fields from the table: "position_change" */
  position_changes_aggregate: Position_Changes_Aggregate;
  /** An array relationship */
  positions: Array<Positions>;
  /** An aggregate relationship */
  positions_aggregate: Positions_Aggregate;
  /** execute function "positions_from_following" which returns "position" */
  positions_from_following: Array<Positions>;
  /** execute function "positions_from_following" and query aggregates on result of table type "position" */
  positions_from_following_aggregate: Positions_Aggregate;
  /** fetch data from the table: "position_with_value" */
  positions_with_value: Array<Positions_With_Value>;
  /** fetch aggregated fields from the table: "position_with_value" */
  positions_with_value_aggregate: Positions_With_Value_Aggregate;
  /** fetch data from the table: "predicate_object" */
  predicate_objects: Array<Predicate_Objects>;
  /** fetch aggregated fields from the table: "predicate_object" */
  predicate_objects_aggregate: Predicate_Objects_Aggregate;
  /** fetch data from the table: "predicate_object" using primary key columns */
  predicate_objects_by_pk?: Maybe<Predicate_Objects>;
  /** fetch data from the table: "protocol_fee_accrued" */
  protocol_fee_accruals: Array<Protocol_Fee_Accruals>;
  /** fetch aggregated fields from the table: "protocol_fee_accrued" */
  protocol_fee_accruals_aggregate: Protocol_Fee_Accruals_Aggregate;
  /** fetch data from the table: "protocol_fee_accrued" using primary key columns */
  protocol_fee_accrued?: Maybe<Protocol_Fee_Accruals>;
  /** fetch data from the table: "redemption" using primary key columns */
  redemption?: Maybe<Redemptions>;
  /** An array relationship */
  redemptions: Array<Redemptions>;
  /** An aggregate relationship */
  redemptions_aggregate: Redemptions_Aggregate;
  /** execute function "search_positions_on_subject" which returns "position" */
  search_positions_on_subject: Array<Positions>;
  /** execute function "search_positions_on_subject" and query aggregates on result of table type "position" */
  search_positions_on_subject_aggregate: Positions_Aggregate;
  /** execute function "search_term" which returns "term" */
  search_term: Array<Terms>;
  /** execute function "search_term" and query aggregates on result of table type "term" */
  search_term_aggregate: Terms_Aggregate;
  /** execute function "search_term_from_following" which returns "term" */
  search_term_from_following: Array<Terms>;
  /** execute function "search_term_from_following" and query aggregates on result of table type "term" */
  search_term_from_following_aggregate: Terms_Aggregate;
  /** execute function "search_term_tsvector" which returns "term" */
  search_term_tsvector: Array<Terms>;
  /** execute function "search_term_tsvector" and query aggregates on result of table type "term" */
  search_term_tsvector_aggregate: Terms_Aggregate;
  /** fetch data from the table: "season2_epoch" using primary key columns */
  season2_epoch?: Maybe<Season2_Epochs>;
  /** fetch data from the table: "season2_epoch_price" using primary key columns */
  season2_epoch_price?: Maybe<Season2_Epoch_Prices>;
  /** fetch data from the table: "season2_epoch_price" */
  season2_epoch_prices: Array<Season2_Epoch_Prices>;
  /** fetch aggregated fields from the table: "season2_epoch_price" */
  season2_epoch_prices_aggregate: Season2_Epoch_Prices_Aggregate;
  /** fetch data from the table: "season2_epoch" */
  season2_epochs: Array<Season2_Epochs>;
  /** fetch aggregated fields from the table: "season2_epoch" */
  season2_epochs_aggregate: Season2_Epochs_Aggregate;
  /** fetch data from the table: "season2_iq_ledger" using primary key columns */
  season2_iq_ledger?: Maybe<Season2_Iq_Ledger_Entries>;
  /** An array relationship */
  season2_iq_ledger_entries: Array<Season2_Iq_Ledger_Entries>;
  /** An aggregate relationship */
  season2_iq_ledger_entries_aggregate: Season2_Iq_Ledger_Entries_Aggregate;
  /** fetch data from the table: "season2_leaderboard_payout" using primary key columns */
  season2_leaderboard_payout?: Maybe<Season2_Leaderboard_Payouts>;
  /** fetch data from the table: "season2_leaderboard_payout" */
  season2_leaderboard_payouts: Array<Season2_Leaderboard_Payouts>;
  /** fetch aggregated fields from the table: "season2_leaderboard_payout" */
  season2_leaderboard_payouts_aggregate: Season2_Leaderboard_Payouts_Aggregate;
  /** fetch data from the table: "season2_trust_price_snapshot" using primary key columns */
  season2_trust_price_snapshot?: Maybe<Season2_Trust_Price_Snapshots>;
  /** fetch data from the table: "season2_trust_price_snapshot" */
  season2_trust_price_snapshots: Array<Season2_Trust_Price_Snapshots>;
  /** fetch aggregated fields from the table: "season2_trust_price_snapshot" */
  season2_trust_price_snapshots_aggregate: Season2_Trust_Price_Snapshots_Aggregate;
  /** An array relationship */
  share_price_change_stats_daily: Array<Share_Price_Change_Stats_Daily>;
  /** An array relationship */
  share_price_change_stats_hourly: Array<Share_Price_Change_Stats_Hourly>;
  /** An array relationship */
  share_price_change_stats_monthly: Array<Share_Price_Change_Stats_Monthly>;
  /** An array relationship */
  share_price_change_stats_weekly: Array<Share_Price_Change_Stats_Weekly>;
  /** An array relationship */
  share_price_changes: Array<Share_Price_Changes>;
  /** An aggregate relationship */
  share_price_changes_aggregate: Share_Price_Changes_Aggregate;
  /** fetch data from the table: "signal_stats_daily" */
  signal_stats_daily: Array<Signal_Stats_Daily>;
  /** fetch data from the table: "signal_stats_hourly" */
  signal_stats_hourly: Array<Signal_Stats_Hourly>;
  /** fetch data from the table: "signal_stats_monthly" */
  signal_stats_monthly: Array<Signal_Stats_Monthly>;
  /** fetch data from the table: "signal_stats_weekly" */
  signal_stats_weekly: Array<Signal_Stats_Weekly>;
  /** An array relationship */
  signals: Array<Signals>;
  /** An aggregate relationship */
  signals_aggregate: Signals_Aggregate;
  /** execute function "signals_from_following" which returns "signal" */
  signals_from_following: Array<Signals>;
  /** execute function "signals_from_following" and query aggregates on result of table type "signal" */
  signals_from_following_aggregate: Signals_Aggregate;
  /** fetch data from the table: "stats" using primary key columns */
  stat?: Maybe<Stats>;
  /** fetch data from the table: "stats_hour" using primary key columns */
  statHour?: Maybe<StatHours>;
  /** fetch data from the table: "stats_hour" */
  statHours: Array<StatHours>;
  /** fetch data from the table: "stats" */
  stats: Array<Stats>;
  /** fetch aggregated fields from the table: "stats" */
  stats_aggregate: Stats_Aggregate;
  /** fetch data from the table: "subject_predicate" */
  subject_predicates: Array<Subject_Predicates>;
  /** fetch aggregated fields from the table: "subject_predicate" */
  subject_predicates_aggregate: Subject_Predicates_Aggregate;
  /** fetch data from the table: "subject_predicate" using primary key columns */
  subject_predicates_by_pk?: Maybe<Subject_Predicates>;
  /** fetch data from the table: "term" using primary key columns */
  term?: Maybe<Terms>;
  /** fetch data from the table: "term_total_state_change_stats_daily" */
  term_total_state_change_stats_daily: Array<Term_Total_State_Change_Stats_Daily>;
  /** fetch data from the table: "term_total_state_change_stats_hourly" */
  term_total_state_change_stats_hourly: Array<Term_Total_State_Change_Stats_Hourly>;
  /** fetch data from the table: "term_total_state_change_stats_monthly" */
  term_total_state_change_stats_monthly: Array<Term_Total_State_Change_Stats_Monthly>;
  /** fetch data from the table: "term_total_state_change_stats_weekly" */
  term_total_state_change_stats_weekly: Array<Term_Total_State_Change_Stats_Weekly>;
  /** An array relationship */
  term_total_state_changes: Array<Term_Total_State_Changes>;
  /** fetch data from the table: "term" */
  terms: Array<Terms>;
  /** fetch aggregated fields from the table: "term" */
  terms_aggregate: Terms_Aggregate;
  /** fetch data from the table: "text_object" using primary key columns */
  text_object?: Maybe<Text_Objects>;
  /** fetch data from the table: "text_object" */
  text_objects: Array<Text_Objects>;
  /** fetch aggregated fields from the table: "text_object" */
  text_objects_aggregate: Text_Objects_Aggregate;
  /** fetch data from the table: "thing" using primary key columns */
  thing?: Maybe<Things>;
  /** fetch data from the table: "thing" */
  things: Array<Things>;
  /** fetch aggregated fields from the table: "thing" */
  things_aggregate: Things_Aggregate;
  /** fetch data from the table: "triple" using primary key columns */
  triple?: Maybe<Triples>;
  /** fetch data from the table: "triple_term" using primary key columns */
  triple_term?: Maybe<Triple_Term>;
  /** fetch data from the table: "triple_term" */
  triple_terms: Array<Triple_Term>;
  /** fetch data from the table: "triple_vault" using primary key columns */
  triple_vault?: Maybe<Triple_Vault>;
  /** fetch data from the table: "triple_vault" */
  triple_vaults: Array<Triple_Vault>;
  /** An array relationship */
  triples: Array<Triples>;
  /** An aggregate relationship */
  triples_aggregate: Triples_Aggregate;
  /** fetch data from the table: "vault" using primary key columns */
  vault?: Maybe<Vaults>;
  /** An array relationship */
  vaults: Array<Vaults>;
  /** An aggregate relationship */
  vaults_aggregate: Vaults_Aggregate;
};


export type Query_RootAccountArgs = {
  id: Scalars['String']['input'];
};


export type Query_RootAccount_Pnl_RankArgs = {
  distinct_on?: InputMaybe<Array<Account_Pnl_Rank_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Account_Pnl_Rank_Order_By>>;
  where?: InputMaybe<Account_Pnl_Rank_Bool_Exp>;
};


export type Query_RootAccount_Pnl_Rank_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Account_Pnl_Rank_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Account_Pnl_Rank_Order_By>>;
  where?: InputMaybe<Account_Pnl_Rank_Bool_Exp>;
};


export type Query_RootAccountsArgs = {
  distinct_on?: InputMaybe<Array<Accounts_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Accounts_Order_By>>;
  where?: InputMaybe<Accounts_Bool_Exp>;
};


export type Query_RootAccounts_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Accounts_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Accounts_Order_By>>;
  where?: InputMaybe<Accounts_Bool_Exp>;
};


export type Query_RootAtomArgs = {
  term_id: Scalars['String']['input'];
};


export type Query_RootAtom_ValueArgs = {
  id: Scalars['String']['input'];
};


export type Query_RootAtom_ValuesArgs = {
  distinct_on?: InputMaybe<Array<Atom_Values_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Atom_Values_Order_By>>;
  where?: InputMaybe<Atom_Values_Bool_Exp>;
};


export type Query_RootAtom_Values_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Atom_Values_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Atom_Values_Order_By>>;
  where?: InputMaybe<Atom_Values_Bool_Exp>;
};


export type Query_RootAtomsArgs = {
  distinct_on?: InputMaybe<Array<Atoms_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Atoms_Order_By>>;
  where?: InputMaybe<Atoms_Bool_Exp>;
};


export type Query_RootAtoms_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Atoms_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Atoms_Order_By>>;
  where?: InputMaybe<Atoms_Bool_Exp>;
};


export type Query_RootBookArgs = {
  id: Scalars['String']['input'];
};


export type Query_RootBooksArgs = {
  distinct_on?: InputMaybe<Array<Books_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Books_Order_By>>;
  where?: InputMaybe<Books_Bool_Exp>;
};


export type Query_RootBooks_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Books_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Books_Order_By>>;
  where?: InputMaybe<Books_Bool_Exp>;
};


export type Query_RootByte_ObjectArgs = {
  distinct_on?: InputMaybe<Array<Byte_Object_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Byte_Object_Order_By>>;
  where?: InputMaybe<Byte_Object_Bool_Exp>;
};


export type Query_RootByte_Object_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Byte_Object_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Byte_Object_Order_By>>;
  where?: InputMaybe<Byte_Object_Bool_Exp>;
};


export type Query_RootByte_Object_By_PkArgs = {
  id: Scalars['String']['input'];
};


export type Query_RootCached_Images_Cached_ImageArgs = {
  distinct_on?: InputMaybe<Array<Cached_Images_Cached_Image_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Cached_Images_Cached_Image_Order_By>>;
  where?: InputMaybe<Cached_Images_Cached_Image_Bool_Exp>;
};


export type Query_RootCached_Images_Cached_Image_By_PkArgs = {
  url: Scalars['String']['input'];
};


export type Query_RootCaip10Args = {
  id: Scalars['String']['input'];
};


export type Query_RootCaip10_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Caip10_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Caip10_Order_By>>;
  where?: InputMaybe<Caip10_Bool_Exp>;
};


export type Query_RootCaip10sArgs = {
  distinct_on?: InputMaybe<Array<Caip10_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Caip10_Order_By>>;
  where?: InputMaybe<Caip10_Bool_Exp>;
};


export type Query_RootChainlink_PriceArgs = {
  id: Scalars['numeric']['input'];
};


export type Query_RootChainlink_PricesArgs = {
  distinct_on?: InputMaybe<Array<Chainlink_Prices_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Chainlink_Prices_Order_By>>;
  where?: InputMaybe<Chainlink_Prices_Bool_Exp>;
};


export type Query_RootDepositArgs = {
  id: Scalars['String']['input'];
};


export type Query_RootDepositsArgs = {
  distinct_on?: InputMaybe<Array<Deposits_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Deposits_Order_By>>;
  where?: InputMaybe<Deposits_Bool_Exp>;
};


export type Query_RootDeposits_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Deposits_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Deposits_Order_By>>;
  where?: InputMaybe<Deposits_Bool_Exp>;
};


export type Query_RootEventArgs = {
  id: Scalars['String']['input'];
};


export type Query_RootEventsArgs = {
  distinct_on?: InputMaybe<Array<Events_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Events_Order_By>>;
  where?: InputMaybe<Events_Bool_Exp>;
};


export type Query_RootEvents_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Events_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Events_Order_By>>;
  where?: InputMaybe<Events_Bool_Exp>;
};


export type Query_RootFee_TransferArgs = {
  id: Scalars['String']['input'];
};


export type Query_RootFee_TransfersArgs = {
  distinct_on?: InputMaybe<Array<Fee_Transfers_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Fee_Transfers_Order_By>>;
  where?: InputMaybe<Fee_Transfers_Bool_Exp>;
};


export type Query_RootFee_Transfers_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Fee_Transfers_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Fee_Transfers_Order_By>>;
  where?: InputMaybe<Fee_Transfers_Bool_Exp>;
};


export type Query_RootFollowingArgs = {
  args: Following_Args;
  distinct_on?: InputMaybe<Array<Accounts_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Accounts_Order_By>>;
  where?: InputMaybe<Accounts_Bool_Exp>;
};


export type Query_RootFollowing_AggregateArgs = {
  args: Following_Args;
  distinct_on?: InputMaybe<Array<Accounts_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Accounts_Order_By>>;
  where?: InputMaybe<Accounts_Bool_Exp>;
};


export type Query_RootGetAccountPnlChartArgs = {
  input: GetAccountPnlChartInput;
};


export type Query_RootGetAccountPnlCurrentArgs = {
  input: GetAccountPnlCurrentInput;
};


export type Query_RootGetAccountPnlRealizedArgs = {
  input: GetAccountPnlRealizedInput;
};


export type Query_RootGetChartJsonArgs = {
  input: GetChartJsonInput;
};


export type Query_RootGetChartRawJsonArgs = {
  input: GetChartJsonInput;
};


export type Query_RootGetChartRawSvgArgs = {
  input: GetChartSvgInput;
};


export type Query_RootGetChartSvgArgs = {
  input: GetChartSvgInput;
};


export type Query_RootGetPositionPnlChartArgs = {
  input: GetPositionPnlChartInput;
};


export type Query_RootGet_Account_Pnl_RankArgs = {
  args: Get_Account_Pnl_Rank_Args;
  distinct_on?: InputMaybe<Array<Account_Pnl_Rank_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Account_Pnl_Rank_Order_By>>;
  where?: InputMaybe<Account_Pnl_Rank_Bool_Exp>;
};


export type Query_RootGet_Account_Pnl_Rank_AggregateArgs = {
  args: Get_Account_Pnl_Rank_Args;
  distinct_on?: InputMaybe<Array<Account_Pnl_Rank_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Account_Pnl_Rank_Order_By>>;
  where?: InputMaybe<Account_Pnl_Rank_Bool_Exp>;
};


export type Query_RootGet_Pnl_LeaderboardArgs = {
  args?: InputMaybe<Get_Pnl_Leaderboard_Args>;
  distinct_on?: InputMaybe<Array<Pnl_Leaderboard_Entry_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Pnl_Leaderboard_Entry_Order_By>>;
  where?: InputMaybe<Pnl_Leaderboard_Entry_Bool_Exp>;
};


export type Query_RootGet_Pnl_Leaderboard_AggregateArgs = {
  args?: InputMaybe<Get_Pnl_Leaderboard_Args>;
  distinct_on?: InputMaybe<Array<Pnl_Leaderboard_Entry_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Pnl_Leaderboard_Entry_Order_By>>;
  where?: InputMaybe<Pnl_Leaderboard_Entry_Bool_Exp>;
};


export type Query_RootGet_Pnl_Leaderboard_PeriodArgs = {
  args: Get_Pnl_Leaderboard_Period_Args;
};


export type Query_RootGet_Pnl_Leaderboard_Period_Min_ThresholdArgs = {
  args: Get_Pnl_Leaderboard_Period_Min_Threshold_Args;
};


export type Query_RootGet_Pnl_Leaderboard_StatsArgs = {
  args?: InputMaybe<Get_Pnl_Leaderboard_Stats_Args>;
  distinct_on?: InputMaybe<Array<Pnl_Leaderboard_Stats_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Pnl_Leaderboard_Stats_Order_By>>;
  where?: InputMaybe<Pnl_Leaderboard_Stats_Bool_Exp>;
};


export type Query_RootGet_Pnl_Leaderboard_Stats_AggregateArgs = {
  args?: InputMaybe<Get_Pnl_Leaderboard_Stats_Args>;
  distinct_on?: InputMaybe<Array<Pnl_Leaderboard_Stats_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Pnl_Leaderboard_Stats_Order_By>>;
  where?: InputMaybe<Pnl_Leaderboard_Stats_Bool_Exp>;
};


export type Query_RootGet_Vault_LeaderboardArgs = {
  args: Get_Vault_Leaderboard_Args;
  distinct_on?: InputMaybe<Array<Pnl_Leaderboard_Entry_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Pnl_Leaderboard_Entry_Order_By>>;
  where?: InputMaybe<Pnl_Leaderboard_Entry_Bool_Exp>;
};


export type Query_RootGet_Vault_Leaderboard_AggregateArgs = {
  args: Get_Vault_Leaderboard_Args;
  distinct_on?: InputMaybe<Array<Pnl_Leaderboard_Entry_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Pnl_Leaderboard_Entry_Order_By>>;
  where?: InputMaybe<Pnl_Leaderboard_Entry_Bool_Exp>;
};


export type Query_RootJson_ObjectArgs = {
  id: Scalars['String']['input'];
};


export type Query_RootJson_ObjectsArgs = {
  distinct_on?: InputMaybe<Array<Json_Objects_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Json_Objects_Order_By>>;
  where?: InputMaybe<Json_Objects_Bool_Exp>;
};


export type Query_RootJson_Objects_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Json_Objects_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Json_Objects_Order_By>>;
  where?: InputMaybe<Json_Objects_Bool_Exp>;
};


export type Query_RootOrganizationArgs = {
  id: Scalars['String']['input'];
};


export type Query_RootOrganizationsArgs = {
  distinct_on?: InputMaybe<Array<Organizations_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Organizations_Order_By>>;
  where?: InputMaybe<Organizations_Bool_Exp>;
};


export type Query_RootOrganizations_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Organizations_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Organizations_Order_By>>;
  where?: InputMaybe<Organizations_Bool_Exp>;
};


export type Query_RootPersonArgs = {
  id: Scalars['String']['input'];
};


export type Query_RootPersonsArgs = {
  distinct_on?: InputMaybe<Array<Persons_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Persons_Order_By>>;
  where?: InputMaybe<Persons_Bool_Exp>;
};


export type Query_RootPersons_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Persons_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Persons_Order_By>>;
  where?: InputMaybe<Persons_Bool_Exp>;
};


export type Query_RootPnl_Leaderboard_EntryArgs = {
  distinct_on?: InputMaybe<Array<Pnl_Leaderboard_Entry_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Pnl_Leaderboard_Entry_Order_By>>;
  where?: InputMaybe<Pnl_Leaderboard_Entry_Bool_Exp>;
};


export type Query_RootPnl_Leaderboard_Entry_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Pnl_Leaderboard_Entry_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Pnl_Leaderboard_Entry_Order_By>>;
  where?: InputMaybe<Pnl_Leaderboard_Entry_Bool_Exp>;
};


export type Query_RootPnl_Leaderboard_StatsArgs = {
  distinct_on?: InputMaybe<Array<Pnl_Leaderboard_Stats_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Pnl_Leaderboard_Stats_Order_By>>;
  where?: InputMaybe<Pnl_Leaderboard_Stats_Bool_Exp>;
};


export type Query_RootPnl_Leaderboard_Stats_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Pnl_Leaderboard_Stats_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Pnl_Leaderboard_Stats_Order_By>>;
  where?: InputMaybe<Pnl_Leaderboard_Stats_Bool_Exp>;
};


export type Query_RootPositionArgs = {
  id: Scalars['String']['input'];
};


export type Query_RootPosition_Change_DailyArgs = {
  distinct_on?: InputMaybe<Array<Position_Change_Daily_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Position_Change_Daily_Order_By>>;
  where?: InputMaybe<Position_Change_Daily_Bool_Exp>;
};


export type Query_RootPosition_Change_HourlyArgs = {
  distinct_on?: InputMaybe<Array<Position_Change_Hourly_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Position_Change_Hourly_Order_By>>;
  where?: InputMaybe<Position_Change_Hourly_Bool_Exp>;
};


export type Query_RootPosition_ChangesArgs = {
  distinct_on?: InputMaybe<Array<Position_Changes_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Position_Changes_Order_By>>;
  where?: InputMaybe<Position_Changes_Bool_Exp>;
};


export type Query_RootPosition_Changes_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Position_Changes_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Position_Changes_Order_By>>;
  where?: InputMaybe<Position_Changes_Bool_Exp>;
};


export type Query_RootPositionsArgs = {
  distinct_on?: InputMaybe<Array<Positions_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Positions_Order_By>>;
  where?: InputMaybe<Positions_Bool_Exp>;
};


export type Query_RootPositions_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Positions_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Positions_Order_By>>;
  where?: InputMaybe<Positions_Bool_Exp>;
};


export type Query_RootPositions_From_FollowingArgs = {
  args: Positions_From_Following_Args;
  distinct_on?: InputMaybe<Array<Positions_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Positions_Order_By>>;
  where?: InputMaybe<Positions_Bool_Exp>;
};


export type Query_RootPositions_From_Following_AggregateArgs = {
  args: Positions_From_Following_Args;
  distinct_on?: InputMaybe<Array<Positions_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Positions_Order_By>>;
  where?: InputMaybe<Positions_Bool_Exp>;
};


export type Query_RootPositions_With_ValueArgs = {
  distinct_on?: InputMaybe<Array<Positions_With_Value_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Positions_With_Value_Order_By>>;
  where?: InputMaybe<Positions_With_Value_Bool_Exp>;
};


export type Query_RootPositions_With_Value_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Positions_With_Value_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Positions_With_Value_Order_By>>;
  where?: InputMaybe<Positions_With_Value_Bool_Exp>;
};


export type Query_RootPredicate_ObjectsArgs = {
  distinct_on?: InputMaybe<Array<Predicate_Objects_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Predicate_Objects_Order_By>>;
  where?: InputMaybe<Predicate_Objects_Bool_Exp>;
};


export type Query_RootPredicate_Objects_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Predicate_Objects_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Predicate_Objects_Order_By>>;
  where?: InputMaybe<Predicate_Objects_Bool_Exp>;
};


export type Query_RootPredicate_Objects_By_PkArgs = {
  object_id: Scalars['String']['input'];
  predicate_id: Scalars['String']['input'];
};


export type Query_RootProtocol_Fee_AccrualsArgs = {
  distinct_on?: InputMaybe<Array<Protocol_Fee_Accruals_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Protocol_Fee_Accruals_Order_By>>;
  where?: InputMaybe<Protocol_Fee_Accruals_Bool_Exp>;
};


export type Query_RootProtocol_Fee_Accruals_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Protocol_Fee_Accruals_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Protocol_Fee_Accruals_Order_By>>;
  where?: InputMaybe<Protocol_Fee_Accruals_Bool_Exp>;
};


export type Query_RootProtocol_Fee_AccruedArgs = {
  id: Scalars['String']['input'];
};


export type Query_RootRedemptionArgs = {
  id: Scalars['String']['input'];
};


export type Query_RootRedemptionsArgs = {
  distinct_on?: InputMaybe<Array<Redemptions_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Redemptions_Order_By>>;
  where?: InputMaybe<Redemptions_Bool_Exp>;
};


export type Query_RootRedemptions_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Redemptions_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Redemptions_Order_By>>;
  where?: InputMaybe<Redemptions_Bool_Exp>;
};


export type Query_RootSearch_Positions_On_SubjectArgs = {
  args: Search_Positions_On_Subject_Args;
  distinct_on?: InputMaybe<Array<Positions_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Positions_Order_By>>;
  where?: InputMaybe<Positions_Bool_Exp>;
};


export type Query_RootSearch_Positions_On_Subject_AggregateArgs = {
  args: Search_Positions_On_Subject_Args;
  distinct_on?: InputMaybe<Array<Positions_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Positions_Order_By>>;
  where?: InputMaybe<Positions_Bool_Exp>;
};


export type Query_RootSearch_TermArgs = {
  args: Search_Term_Args;
  distinct_on?: InputMaybe<Array<Terms_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Terms_Order_By>>;
  where?: InputMaybe<Terms_Bool_Exp>;
};


export type Query_RootSearch_Term_AggregateArgs = {
  args: Search_Term_Args;
  distinct_on?: InputMaybe<Array<Terms_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Terms_Order_By>>;
  where?: InputMaybe<Terms_Bool_Exp>;
};


export type Query_RootSearch_Term_From_FollowingArgs = {
  args: Search_Term_From_Following_Args;
  distinct_on?: InputMaybe<Array<Terms_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Terms_Order_By>>;
  where?: InputMaybe<Terms_Bool_Exp>;
};


export type Query_RootSearch_Term_From_Following_AggregateArgs = {
  args: Search_Term_From_Following_Args;
  distinct_on?: InputMaybe<Array<Terms_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Terms_Order_By>>;
  where?: InputMaybe<Terms_Bool_Exp>;
};


export type Query_RootSearch_Term_TsvectorArgs = {
  args: Search_Term_Tsvector_Args;
  distinct_on?: InputMaybe<Array<Terms_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Terms_Order_By>>;
  where?: InputMaybe<Terms_Bool_Exp>;
};


export type Query_RootSearch_Term_Tsvector_AggregateArgs = {
  args: Search_Term_Tsvector_Args;
  distinct_on?: InputMaybe<Array<Terms_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Terms_Order_By>>;
  where?: InputMaybe<Terms_Bool_Exp>;
};


export type Query_RootSeason2_EpochArgs = {
  epoch: Scalars['Int']['input'];
};


export type Query_RootSeason2_Epoch_PriceArgs = {
  epoch: Scalars['Int']['input'];
};


export type Query_RootSeason2_Epoch_PricesArgs = {
  distinct_on?: InputMaybe<Array<Season2_Epoch_Prices_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Season2_Epoch_Prices_Order_By>>;
  where?: InputMaybe<Season2_Epoch_Prices_Bool_Exp>;
};


export type Query_RootSeason2_Epoch_Prices_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Season2_Epoch_Prices_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Season2_Epoch_Prices_Order_By>>;
  where?: InputMaybe<Season2_Epoch_Prices_Bool_Exp>;
};


export type Query_RootSeason2_EpochsArgs = {
  distinct_on?: InputMaybe<Array<Season2_Epochs_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Season2_Epochs_Order_By>>;
  where?: InputMaybe<Season2_Epochs_Bool_Exp>;
};


export type Query_RootSeason2_Epochs_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Season2_Epochs_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Season2_Epochs_Order_By>>;
  where?: InputMaybe<Season2_Epochs_Bool_Exp>;
};


export type Query_RootSeason2_Iq_LedgerArgs = {
  id: Scalars['bigint']['input'];
};


export type Query_RootSeason2_Iq_Ledger_EntriesArgs = {
  distinct_on?: InputMaybe<Array<Season2_Iq_Ledger_Entries_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Season2_Iq_Ledger_Entries_Order_By>>;
  where?: InputMaybe<Season2_Iq_Ledger_Entries_Bool_Exp>;
};


export type Query_RootSeason2_Iq_Ledger_Entries_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Season2_Iq_Ledger_Entries_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Season2_Iq_Ledger_Entries_Order_By>>;
  where?: InputMaybe<Season2_Iq_Ledger_Entries_Bool_Exp>;
};


export type Query_RootSeason2_Leaderboard_PayoutArgs = {
  rank: Scalars['Int']['input'];
};


export type Query_RootSeason2_Leaderboard_PayoutsArgs = {
  distinct_on?: InputMaybe<Array<Season2_Leaderboard_Payouts_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Season2_Leaderboard_Payouts_Order_By>>;
  where?: InputMaybe<Season2_Leaderboard_Payouts_Bool_Exp>;
};


export type Query_RootSeason2_Leaderboard_Payouts_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Season2_Leaderboard_Payouts_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Season2_Leaderboard_Payouts_Order_By>>;
  where?: InputMaybe<Season2_Leaderboard_Payouts_Bool_Exp>;
};


export type Query_RootSeason2_Trust_Price_SnapshotArgs = {
  snapshot_at: Scalars['timestamptz']['input'];
};


export type Query_RootSeason2_Trust_Price_SnapshotsArgs = {
  distinct_on?: InputMaybe<Array<Season2_Trust_Price_Snapshots_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Season2_Trust_Price_Snapshots_Order_By>>;
  where?: InputMaybe<Season2_Trust_Price_Snapshots_Bool_Exp>;
};


export type Query_RootSeason2_Trust_Price_Snapshots_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Season2_Trust_Price_Snapshots_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Season2_Trust_Price_Snapshots_Order_By>>;
  where?: InputMaybe<Season2_Trust_Price_Snapshots_Bool_Exp>;
};


export type Query_RootShare_Price_Change_Stats_DailyArgs = {
  distinct_on?: InputMaybe<Array<Share_Price_Change_Stats_Daily_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Share_Price_Change_Stats_Daily_Order_By>>;
  where?: InputMaybe<Share_Price_Change_Stats_Daily_Bool_Exp>;
};


export type Query_RootShare_Price_Change_Stats_HourlyArgs = {
  distinct_on?: InputMaybe<Array<Share_Price_Change_Stats_Hourly_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Share_Price_Change_Stats_Hourly_Order_By>>;
  where?: InputMaybe<Share_Price_Change_Stats_Hourly_Bool_Exp>;
};


export type Query_RootShare_Price_Change_Stats_MonthlyArgs = {
  distinct_on?: InputMaybe<Array<Share_Price_Change_Stats_Monthly_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Share_Price_Change_Stats_Monthly_Order_By>>;
  where?: InputMaybe<Share_Price_Change_Stats_Monthly_Bool_Exp>;
};


export type Query_RootShare_Price_Change_Stats_WeeklyArgs = {
  distinct_on?: InputMaybe<Array<Share_Price_Change_Stats_Weekly_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Share_Price_Change_Stats_Weekly_Order_By>>;
  where?: InputMaybe<Share_Price_Change_Stats_Weekly_Bool_Exp>;
};


export type Query_RootShare_Price_ChangesArgs = {
  distinct_on?: InputMaybe<Array<Share_Price_Changes_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Share_Price_Changes_Order_By>>;
  where?: InputMaybe<Share_Price_Changes_Bool_Exp>;
};


export type Query_RootShare_Price_Changes_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Share_Price_Changes_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Share_Price_Changes_Order_By>>;
  where?: InputMaybe<Share_Price_Changes_Bool_Exp>;
};


export type Query_RootSignal_Stats_DailyArgs = {
  distinct_on?: InputMaybe<Array<Signal_Stats_Daily_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Signal_Stats_Daily_Order_By>>;
  where?: InputMaybe<Signal_Stats_Daily_Bool_Exp>;
};


export type Query_RootSignal_Stats_HourlyArgs = {
  distinct_on?: InputMaybe<Array<Signal_Stats_Hourly_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Signal_Stats_Hourly_Order_By>>;
  where?: InputMaybe<Signal_Stats_Hourly_Bool_Exp>;
};


export type Query_RootSignal_Stats_MonthlyArgs = {
  distinct_on?: InputMaybe<Array<Signal_Stats_Monthly_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Signal_Stats_Monthly_Order_By>>;
  where?: InputMaybe<Signal_Stats_Monthly_Bool_Exp>;
};


export type Query_RootSignal_Stats_WeeklyArgs = {
  distinct_on?: InputMaybe<Array<Signal_Stats_Weekly_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Signal_Stats_Weekly_Order_By>>;
  where?: InputMaybe<Signal_Stats_Weekly_Bool_Exp>;
};


export type Query_RootSignalsArgs = {
  distinct_on?: InputMaybe<Array<Signals_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Signals_Order_By>>;
  where?: InputMaybe<Signals_Bool_Exp>;
};


export type Query_RootSignals_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Signals_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Signals_Order_By>>;
  where?: InputMaybe<Signals_Bool_Exp>;
};


export type Query_RootSignals_From_FollowingArgs = {
  args: Signals_From_Following_Args;
  distinct_on?: InputMaybe<Array<Signals_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Signals_Order_By>>;
  where?: InputMaybe<Signals_Bool_Exp>;
};


export type Query_RootSignals_From_Following_AggregateArgs = {
  args: Signals_From_Following_Args;
  distinct_on?: InputMaybe<Array<Signals_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Signals_Order_By>>;
  where?: InputMaybe<Signals_Bool_Exp>;
};


export type Query_RootStatArgs = {
  id: Scalars['Int']['input'];
};


export type Query_RootStatHourArgs = {
  id: Scalars['Int']['input'];
};


export type Query_RootStatHoursArgs = {
  distinct_on?: InputMaybe<Array<StatHours_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<StatHours_Order_By>>;
  where?: InputMaybe<StatHours_Bool_Exp>;
};


export type Query_RootStatsArgs = {
  distinct_on?: InputMaybe<Array<Stats_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Stats_Order_By>>;
  where?: InputMaybe<Stats_Bool_Exp>;
};


export type Query_RootStats_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Stats_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Stats_Order_By>>;
  where?: InputMaybe<Stats_Bool_Exp>;
};


export type Query_RootSubject_PredicatesArgs = {
  distinct_on?: InputMaybe<Array<Subject_Predicates_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Subject_Predicates_Order_By>>;
  where?: InputMaybe<Subject_Predicates_Bool_Exp>;
};


export type Query_RootSubject_Predicates_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Subject_Predicates_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Subject_Predicates_Order_By>>;
  where?: InputMaybe<Subject_Predicates_Bool_Exp>;
};


export type Query_RootSubject_Predicates_By_PkArgs = {
  predicate_id: Scalars['String']['input'];
  subject_id: Scalars['String']['input'];
};


export type Query_RootTermArgs = {
  id: Scalars['String']['input'];
};


export type Query_RootTerm_Total_State_Change_Stats_DailyArgs = {
  distinct_on?: InputMaybe<Array<Term_Total_State_Change_Stats_Daily_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Term_Total_State_Change_Stats_Daily_Order_By>>;
  where?: InputMaybe<Term_Total_State_Change_Stats_Daily_Bool_Exp>;
};


export type Query_RootTerm_Total_State_Change_Stats_HourlyArgs = {
  distinct_on?: InputMaybe<Array<Term_Total_State_Change_Stats_Hourly_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Term_Total_State_Change_Stats_Hourly_Order_By>>;
  where?: InputMaybe<Term_Total_State_Change_Stats_Hourly_Bool_Exp>;
};


export type Query_RootTerm_Total_State_Change_Stats_MonthlyArgs = {
  distinct_on?: InputMaybe<Array<Term_Total_State_Change_Stats_Monthly_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Term_Total_State_Change_Stats_Monthly_Order_By>>;
  where?: InputMaybe<Term_Total_State_Change_Stats_Monthly_Bool_Exp>;
};


export type Query_RootTerm_Total_State_Change_Stats_WeeklyArgs = {
  distinct_on?: InputMaybe<Array<Term_Total_State_Change_Stats_Weekly_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Term_Total_State_Change_Stats_Weekly_Order_By>>;
  where?: InputMaybe<Term_Total_State_Change_Stats_Weekly_Bool_Exp>;
};


export type Query_RootTerm_Total_State_ChangesArgs = {
  distinct_on?: InputMaybe<Array<Term_Total_State_Changes_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Term_Total_State_Changes_Order_By>>;
  where?: InputMaybe<Term_Total_State_Changes_Bool_Exp>;
};


export type Query_RootTermsArgs = {
  distinct_on?: InputMaybe<Array<Terms_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Terms_Order_By>>;
  where?: InputMaybe<Terms_Bool_Exp>;
};


export type Query_RootTerms_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Terms_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Terms_Order_By>>;
  where?: InputMaybe<Terms_Bool_Exp>;
};


export type Query_RootText_ObjectArgs = {
  id: Scalars['String']['input'];
};


export type Query_RootText_ObjectsArgs = {
  distinct_on?: InputMaybe<Array<Text_Objects_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Text_Objects_Order_By>>;
  where?: InputMaybe<Text_Objects_Bool_Exp>;
};


export type Query_RootText_Objects_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Text_Objects_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Text_Objects_Order_By>>;
  where?: InputMaybe<Text_Objects_Bool_Exp>;
};


export type Query_RootThingArgs = {
  id: Scalars['String']['input'];
};


export type Query_RootThingsArgs = {
  distinct_on?: InputMaybe<Array<Things_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Things_Order_By>>;
  where?: InputMaybe<Things_Bool_Exp>;
};


export type Query_RootThings_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Things_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Things_Order_By>>;
  where?: InputMaybe<Things_Bool_Exp>;
};


export type Query_RootTripleArgs = {
  term_id: Scalars['String']['input'];
};


export type Query_RootTriple_TermArgs = {
  term_id: Scalars['String']['input'];
};


export type Query_RootTriple_TermsArgs = {
  distinct_on?: InputMaybe<Array<Triple_Term_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Triple_Term_Order_By>>;
  where?: InputMaybe<Triple_Term_Bool_Exp>;
};


export type Query_RootTriple_VaultArgs = {
  curve_id: Scalars['numeric']['input'];
  term_id: Scalars['String']['input'];
};


export type Query_RootTriple_VaultsArgs = {
  distinct_on?: InputMaybe<Array<Triple_Vault_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Triple_Vault_Order_By>>;
  where?: InputMaybe<Triple_Vault_Bool_Exp>;
};


export type Query_RootTriplesArgs = {
  distinct_on?: InputMaybe<Array<Triples_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Triples_Order_By>>;
  where?: InputMaybe<Triples_Bool_Exp>;
};


export type Query_RootTriples_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Triples_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Triples_Order_By>>;
  where?: InputMaybe<Triples_Bool_Exp>;
};


export type Query_RootVaultArgs = {
  curve_id: Scalars['numeric']['input'];
  term_id: Scalars['String']['input'];
};


export type Query_RootVaultsArgs = {
  distinct_on?: InputMaybe<Array<Vaults_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Vaults_Order_By>>;
  where?: InputMaybe<Vaults_Bool_Exp>;
};


export type Query_RootVaults_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Vaults_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Vaults_Order_By>>;
  where?: InputMaybe<Vaults_Bool_Exp>;
};

/** Redemption transactions where users burn shares and receive assets back from vaults. */
export type Redemptions = {
  __typename?: 'redemptions';
  /** Asset amount returned before fees, in wei. */
  assets: Scalars['numeric']['output'];
  /** Block number when redemption occurred. */
  block_number: Scalars['numeric']['output'];
  /** Timestamp when redemption occurred. */
  created_at: Scalars['timestamptz']['output'];
  /** Bonding curve ID of the vault. */
  curve_id: Scalars['numeric']['output'];
  /** Protocol fees charged for this redemption, in wei. */
  fees: Scalars['numeric']['output'];
  /** Unique identifier for this redemption event. */
  id: Scalars['String']['output'];
  /** Log index within the transaction for event ordering. */
  log_index: Scalars['bigint']['output'];
  /** An object relationship */
  receiver?: Maybe<Accounts>;
  /** Account that received the redeemed assets. */
  receiver_id: Scalars['String']['output'];
  /** An object relationship */
  sender?: Maybe<Accounts>;
  /** Account that initiated the redemption. */
  sender_id: Scalars['String']['output'];
  /** Number of shares burned for this redemption. */
  shares: Scalars['numeric']['output'];
  /** An object relationship */
  term?: Maybe<Terms>;
  /** Term ID of the vault being redeemed from. */
  term_id: Scalars['String']['output'];
  /** Total shares in vault after this redemption. */
  total_shares: Scalars['numeric']['output'];
  /** Transaction hash of the redemption event. */
  transaction_hash: Scalars['String']['output'];
  /** An object relationship */
  vault?: Maybe<Vaults>;
  /** Type of vault (Atom, Triple, CounterTriple). */
  vault_type: Scalars['vault_type']['output'];
};

/** aggregated selection of "redemption" */
export type Redemptions_Aggregate = {
  __typename?: 'redemptions_aggregate';
  aggregate?: Maybe<Redemptions_Aggregate_Fields>;
  nodes: Array<Redemptions>;
};

export type Redemptions_Aggregate_Bool_Exp = {
  count?: InputMaybe<Redemptions_Aggregate_Bool_Exp_Count>;
};

export type Redemptions_Aggregate_Bool_Exp_Count = {
  arguments?: InputMaybe<Array<Redemptions_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
  filter?: InputMaybe<Redemptions_Bool_Exp>;
  predicate: Int_Comparison_Exp;
};

/** aggregate fields of "redemption" */
export type Redemptions_Aggregate_Fields = {
  __typename?: 'redemptions_aggregate_fields';
  avg?: Maybe<Redemptions_Avg_Fields>;
  count: Scalars['Int']['output'];
  max?: Maybe<Redemptions_Max_Fields>;
  min?: Maybe<Redemptions_Min_Fields>;
  stddev?: Maybe<Redemptions_Stddev_Fields>;
  stddev_pop?: Maybe<Redemptions_Stddev_Pop_Fields>;
  stddev_samp?: Maybe<Redemptions_Stddev_Samp_Fields>;
  sum?: Maybe<Redemptions_Sum_Fields>;
  var_pop?: Maybe<Redemptions_Var_Pop_Fields>;
  var_samp?: Maybe<Redemptions_Var_Samp_Fields>;
  variance?: Maybe<Redemptions_Variance_Fields>;
};


/** aggregate fields of "redemption" */
export type Redemptions_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Redemptions_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
};

/** order by aggregate values of table "redemption" */
export type Redemptions_Aggregate_Order_By = {
  avg?: InputMaybe<Redemptions_Avg_Order_By>;
  count?: InputMaybe<Order_By>;
  max?: InputMaybe<Redemptions_Max_Order_By>;
  min?: InputMaybe<Redemptions_Min_Order_By>;
  stddev?: InputMaybe<Redemptions_Stddev_Order_By>;
  stddev_pop?: InputMaybe<Redemptions_Stddev_Pop_Order_By>;
  stddev_samp?: InputMaybe<Redemptions_Stddev_Samp_Order_By>;
  sum?: InputMaybe<Redemptions_Sum_Order_By>;
  var_pop?: InputMaybe<Redemptions_Var_Pop_Order_By>;
  var_samp?: InputMaybe<Redemptions_Var_Samp_Order_By>;
  variance?: InputMaybe<Redemptions_Variance_Order_By>;
};

/** aggregate avg on columns */
export type Redemptions_Avg_Fields = {
  __typename?: 'redemptions_avg_fields';
  /** Asset amount returned before fees, in wei. */
  assets?: Maybe<Scalars['Float']['output']>;
  /** Block number when redemption occurred. */
  block_number?: Maybe<Scalars['Float']['output']>;
  /** Bonding curve ID of the vault. */
  curve_id?: Maybe<Scalars['Float']['output']>;
  /** Protocol fees charged for this redemption, in wei. */
  fees?: Maybe<Scalars['Float']['output']>;
  /** Log index within the transaction for event ordering. */
  log_index?: Maybe<Scalars['Float']['output']>;
  /** Number of shares burned for this redemption. */
  shares?: Maybe<Scalars['Float']['output']>;
  /** Total shares in vault after this redemption. */
  total_shares?: Maybe<Scalars['Float']['output']>;
};

/** order by avg() on columns of table "redemption" */
export type Redemptions_Avg_Order_By = {
  /** Asset amount returned before fees, in wei. */
  assets?: InputMaybe<Order_By>;
  /** Block number when redemption occurred. */
  block_number?: InputMaybe<Order_By>;
  /** Bonding curve ID of the vault. */
  curve_id?: InputMaybe<Order_By>;
  /** Protocol fees charged for this redemption, in wei. */
  fees?: InputMaybe<Order_By>;
  /** Log index within the transaction for event ordering. */
  log_index?: InputMaybe<Order_By>;
  /** Number of shares burned for this redemption. */
  shares?: InputMaybe<Order_By>;
  /** Total shares in vault after this redemption. */
  total_shares?: InputMaybe<Order_By>;
};

/** Boolean expression to filter rows from the table "redemption". All fields are combined with a logical 'AND'. */
export type Redemptions_Bool_Exp = {
  _and?: InputMaybe<Array<Redemptions_Bool_Exp>>;
  _not?: InputMaybe<Redemptions_Bool_Exp>;
  _or?: InputMaybe<Array<Redemptions_Bool_Exp>>;
  assets?: InputMaybe<Numeric_Comparison_Exp>;
  block_number?: InputMaybe<Numeric_Comparison_Exp>;
  created_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  curve_id?: InputMaybe<Numeric_Comparison_Exp>;
  fees?: InputMaybe<Numeric_Comparison_Exp>;
  id?: InputMaybe<String_Comparison_Exp>;
  log_index?: InputMaybe<Bigint_Comparison_Exp>;
  receiver?: InputMaybe<Accounts_Bool_Exp>;
  receiver_id?: InputMaybe<String_Comparison_Exp>;
  sender?: InputMaybe<Accounts_Bool_Exp>;
  sender_id?: InputMaybe<String_Comparison_Exp>;
  shares?: InputMaybe<Numeric_Comparison_Exp>;
  term?: InputMaybe<Terms_Bool_Exp>;
  term_id?: InputMaybe<String_Comparison_Exp>;
  total_shares?: InputMaybe<Numeric_Comparison_Exp>;
  transaction_hash?: InputMaybe<String_Comparison_Exp>;
  vault?: InputMaybe<Vaults_Bool_Exp>;
  vault_type?: InputMaybe<Vault_Type_Comparison_Exp>;
};

/** aggregate max on columns */
export type Redemptions_Max_Fields = {
  __typename?: 'redemptions_max_fields';
  /** Asset amount returned before fees, in wei. */
  assets?: Maybe<Scalars['numeric']['output']>;
  /** Block number when redemption occurred. */
  block_number?: Maybe<Scalars['numeric']['output']>;
  /** Timestamp when redemption occurred. */
  created_at?: Maybe<Scalars['timestamptz']['output']>;
  /** Bonding curve ID of the vault. */
  curve_id?: Maybe<Scalars['numeric']['output']>;
  /** Protocol fees charged for this redemption, in wei. */
  fees?: Maybe<Scalars['numeric']['output']>;
  /** Unique identifier for this redemption event. */
  id?: Maybe<Scalars['String']['output']>;
  /** Log index within the transaction for event ordering. */
  log_index?: Maybe<Scalars['bigint']['output']>;
  /** Account that received the redeemed assets. */
  receiver_id?: Maybe<Scalars['String']['output']>;
  /** Account that initiated the redemption. */
  sender_id?: Maybe<Scalars['String']['output']>;
  /** Number of shares burned for this redemption. */
  shares?: Maybe<Scalars['numeric']['output']>;
  /** Term ID of the vault being redeemed from. */
  term_id?: Maybe<Scalars['String']['output']>;
  /** Total shares in vault after this redemption. */
  total_shares?: Maybe<Scalars['numeric']['output']>;
  /** Transaction hash of the redemption event. */
  transaction_hash?: Maybe<Scalars['String']['output']>;
  /** Type of vault (Atom, Triple, CounterTriple). */
  vault_type?: Maybe<Scalars['vault_type']['output']>;
};

/** order by max() on columns of table "redemption" */
export type Redemptions_Max_Order_By = {
  /** Asset amount returned before fees, in wei. */
  assets?: InputMaybe<Order_By>;
  /** Block number when redemption occurred. */
  block_number?: InputMaybe<Order_By>;
  /** Timestamp when redemption occurred. */
  created_at?: InputMaybe<Order_By>;
  /** Bonding curve ID of the vault. */
  curve_id?: InputMaybe<Order_By>;
  /** Protocol fees charged for this redemption, in wei. */
  fees?: InputMaybe<Order_By>;
  /** Unique identifier for this redemption event. */
  id?: InputMaybe<Order_By>;
  /** Log index within the transaction for event ordering. */
  log_index?: InputMaybe<Order_By>;
  /** Account that received the redeemed assets. */
  receiver_id?: InputMaybe<Order_By>;
  /** Account that initiated the redemption. */
  sender_id?: InputMaybe<Order_By>;
  /** Number of shares burned for this redemption. */
  shares?: InputMaybe<Order_By>;
  /** Term ID of the vault being redeemed from. */
  term_id?: InputMaybe<Order_By>;
  /** Total shares in vault after this redemption. */
  total_shares?: InputMaybe<Order_By>;
  /** Transaction hash of the redemption event. */
  transaction_hash?: InputMaybe<Order_By>;
  /** Type of vault (Atom, Triple, CounterTriple). */
  vault_type?: InputMaybe<Order_By>;
};

/** aggregate min on columns */
export type Redemptions_Min_Fields = {
  __typename?: 'redemptions_min_fields';
  /** Asset amount returned before fees, in wei. */
  assets?: Maybe<Scalars['numeric']['output']>;
  /** Block number when redemption occurred. */
  block_number?: Maybe<Scalars['numeric']['output']>;
  /** Timestamp when redemption occurred. */
  created_at?: Maybe<Scalars['timestamptz']['output']>;
  /** Bonding curve ID of the vault. */
  curve_id?: Maybe<Scalars['numeric']['output']>;
  /** Protocol fees charged for this redemption, in wei. */
  fees?: Maybe<Scalars['numeric']['output']>;
  /** Unique identifier for this redemption event. */
  id?: Maybe<Scalars['String']['output']>;
  /** Log index within the transaction for event ordering. */
  log_index?: Maybe<Scalars['bigint']['output']>;
  /** Account that received the redeemed assets. */
  receiver_id?: Maybe<Scalars['String']['output']>;
  /** Account that initiated the redemption. */
  sender_id?: Maybe<Scalars['String']['output']>;
  /** Number of shares burned for this redemption. */
  shares?: Maybe<Scalars['numeric']['output']>;
  /** Term ID of the vault being redeemed from. */
  term_id?: Maybe<Scalars['String']['output']>;
  /** Total shares in vault after this redemption. */
  total_shares?: Maybe<Scalars['numeric']['output']>;
  /** Transaction hash of the redemption event. */
  transaction_hash?: Maybe<Scalars['String']['output']>;
  /** Type of vault (Atom, Triple, CounterTriple). */
  vault_type?: Maybe<Scalars['vault_type']['output']>;
};

/** order by min() on columns of table "redemption" */
export type Redemptions_Min_Order_By = {
  /** Asset amount returned before fees, in wei. */
  assets?: InputMaybe<Order_By>;
  /** Block number when redemption occurred. */
  block_number?: InputMaybe<Order_By>;
  /** Timestamp when redemption occurred. */
  created_at?: InputMaybe<Order_By>;
  /** Bonding curve ID of the vault. */
  curve_id?: InputMaybe<Order_By>;
  /** Protocol fees charged for this redemption, in wei. */
  fees?: InputMaybe<Order_By>;
  /** Unique identifier for this redemption event. */
  id?: InputMaybe<Order_By>;
  /** Log index within the transaction for event ordering. */
  log_index?: InputMaybe<Order_By>;
  /** Account that received the redeemed assets. */
  receiver_id?: InputMaybe<Order_By>;
  /** Account that initiated the redemption. */
  sender_id?: InputMaybe<Order_By>;
  /** Number of shares burned for this redemption. */
  shares?: InputMaybe<Order_By>;
  /** Term ID of the vault being redeemed from. */
  term_id?: InputMaybe<Order_By>;
  /** Total shares in vault after this redemption. */
  total_shares?: InputMaybe<Order_By>;
  /** Transaction hash of the redemption event. */
  transaction_hash?: InputMaybe<Order_By>;
  /** Type of vault (Atom, Triple, CounterTriple). */
  vault_type?: InputMaybe<Order_By>;
};

/** Ordering options when selecting data from "redemption". */
export type Redemptions_Order_By = {
  assets?: InputMaybe<Order_By>;
  block_number?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  curve_id?: InputMaybe<Order_By>;
  fees?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  log_index?: InputMaybe<Order_By>;
  receiver?: InputMaybe<Accounts_Order_By>;
  receiver_id?: InputMaybe<Order_By>;
  sender?: InputMaybe<Accounts_Order_By>;
  sender_id?: InputMaybe<Order_By>;
  shares?: InputMaybe<Order_By>;
  term?: InputMaybe<Terms_Order_By>;
  term_id?: InputMaybe<Order_By>;
  total_shares?: InputMaybe<Order_By>;
  transaction_hash?: InputMaybe<Order_By>;
  vault?: InputMaybe<Vaults_Order_By>;
  vault_type?: InputMaybe<Order_By>;
};

/** select columns of table "redemption" */
export type Redemptions_Select_Column =
  /** column name */
  | 'assets'
  /** column name */
  | 'block_number'
  /** column name */
  | 'created_at'
  /** column name */
  | 'curve_id'
  /** column name */
  | 'fees'
  /** column name */
  | 'id'
  /** column name */
  | 'log_index'
  /** column name */
  | 'receiver_id'
  /** column name */
  | 'sender_id'
  /** column name */
  | 'shares'
  /** column name */
  | 'term_id'
  /** column name */
  | 'total_shares'
  /** column name */
  | 'transaction_hash'
  /** column name */
  | 'vault_type';

/** aggregate stddev on columns */
export type Redemptions_Stddev_Fields = {
  __typename?: 'redemptions_stddev_fields';
  /** Asset amount returned before fees, in wei. */
  assets?: Maybe<Scalars['Float']['output']>;
  /** Block number when redemption occurred. */
  block_number?: Maybe<Scalars['Float']['output']>;
  /** Bonding curve ID of the vault. */
  curve_id?: Maybe<Scalars['Float']['output']>;
  /** Protocol fees charged for this redemption, in wei. */
  fees?: Maybe<Scalars['Float']['output']>;
  /** Log index within the transaction for event ordering. */
  log_index?: Maybe<Scalars['Float']['output']>;
  /** Number of shares burned for this redemption. */
  shares?: Maybe<Scalars['Float']['output']>;
  /** Total shares in vault after this redemption. */
  total_shares?: Maybe<Scalars['Float']['output']>;
};

/** order by stddev() on columns of table "redemption" */
export type Redemptions_Stddev_Order_By = {
  /** Asset amount returned before fees, in wei. */
  assets?: InputMaybe<Order_By>;
  /** Block number when redemption occurred. */
  block_number?: InputMaybe<Order_By>;
  /** Bonding curve ID of the vault. */
  curve_id?: InputMaybe<Order_By>;
  /** Protocol fees charged for this redemption, in wei. */
  fees?: InputMaybe<Order_By>;
  /** Log index within the transaction for event ordering. */
  log_index?: InputMaybe<Order_By>;
  /** Number of shares burned for this redemption. */
  shares?: InputMaybe<Order_By>;
  /** Total shares in vault after this redemption. */
  total_shares?: InputMaybe<Order_By>;
};

/** aggregate stddev_pop on columns */
export type Redemptions_Stddev_Pop_Fields = {
  __typename?: 'redemptions_stddev_pop_fields';
  /** Asset amount returned before fees, in wei. */
  assets?: Maybe<Scalars['Float']['output']>;
  /** Block number when redemption occurred. */
  block_number?: Maybe<Scalars['Float']['output']>;
  /** Bonding curve ID of the vault. */
  curve_id?: Maybe<Scalars['Float']['output']>;
  /** Protocol fees charged for this redemption, in wei. */
  fees?: Maybe<Scalars['Float']['output']>;
  /** Log index within the transaction for event ordering. */
  log_index?: Maybe<Scalars['Float']['output']>;
  /** Number of shares burned for this redemption. */
  shares?: Maybe<Scalars['Float']['output']>;
  /** Total shares in vault after this redemption. */
  total_shares?: Maybe<Scalars['Float']['output']>;
};

/** order by stddev_pop() on columns of table "redemption" */
export type Redemptions_Stddev_Pop_Order_By = {
  /** Asset amount returned before fees, in wei. */
  assets?: InputMaybe<Order_By>;
  /** Block number when redemption occurred. */
  block_number?: InputMaybe<Order_By>;
  /** Bonding curve ID of the vault. */
  curve_id?: InputMaybe<Order_By>;
  /** Protocol fees charged for this redemption, in wei. */
  fees?: InputMaybe<Order_By>;
  /** Log index within the transaction for event ordering. */
  log_index?: InputMaybe<Order_By>;
  /** Number of shares burned for this redemption. */
  shares?: InputMaybe<Order_By>;
  /** Total shares in vault after this redemption. */
  total_shares?: InputMaybe<Order_By>;
};

/** aggregate stddev_samp on columns */
export type Redemptions_Stddev_Samp_Fields = {
  __typename?: 'redemptions_stddev_samp_fields';
  /** Asset amount returned before fees, in wei. */
  assets?: Maybe<Scalars['Float']['output']>;
  /** Block number when redemption occurred. */
  block_number?: Maybe<Scalars['Float']['output']>;
  /** Bonding curve ID of the vault. */
  curve_id?: Maybe<Scalars['Float']['output']>;
  /** Protocol fees charged for this redemption, in wei. */
  fees?: Maybe<Scalars['Float']['output']>;
  /** Log index within the transaction for event ordering. */
  log_index?: Maybe<Scalars['Float']['output']>;
  /** Number of shares burned for this redemption. */
  shares?: Maybe<Scalars['Float']['output']>;
  /** Total shares in vault after this redemption. */
  total_shares?: Maybe<Scalars['Float']['output']>;
};

/** order by stddev_samp() on columns of table "redemption" */
export type Redemptions_Stddev_Samp_Order_By = {
  /** Asset amount returned before fees, in wei. */
  assets?: InputMaybe<Order_By>;
  /** Block number when redemption occurred. */
  block_number?: InputMaybe<Order_By>;
  /** Bonding curve ID of the vault. */
  curve_id?: InputMaybe<Order_By>;
  /** Protocol fees charged for this redemption, in wei. */
  fees?: InputMaybe<Order_By>;
  /** Log index within the transaction for event ordering. */
  log_index?: InputMaybe<Order_By>;
  /** Number of shares burned for this redemption. */
  shares?: InputMaybe<Order_By>;
  /** Total shares in vault after this redemption. */
  total_shares?: InputMaybe<Order_By>;
};

/** Streaming cursor of the table "redemptions" */
export type Redemptions_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Redemptions_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Redemptions_Stream_Cursor_Value_Input = {
  /** Asset amount returned before fees, in wei. */
  assets?: InputMaybe<Scalars['numeric']['input']>;
  /** Block number when redemption occurred. */
  block_number?: InputMaybe<Scalars['numeric']['input']>;
  /** Timestamp when redemption occurred. */
  created_at?: InputMaybe<Scalars['timestamptz']['input']>;
  /** Bonding curve ID of the vault. */
  curve_id?: InputMaybe<Scalars['numeric']['input']>;
  /** Protocol fees charged for this redemption, in wei. */
  fees?: InputMaybe<Scalars['numeric']['input']>;
  /** Unique identifier for this redemption event. */
  id?: InputMaybe<Scalars['String']['input']>;
  /** Log index within the transaction for event ordering. */
  log_index?: InputMaybe<Scalars['bigint']['input']>;
  /** Account that received the redeemed assets. */
  receiver_id?: InputMaybe<Scalars['String']['input']>;
  /** Account that initiated the redemption. */
  sender_id?: InputMaybe<Scalars['String']['input']>;
  /** Number of shares burned for this redemption. */
  shares?: InputMaybe<Scalars['numeric']['input']>;
  /** Term ID of the vault being redeemed from. */
  term_id?: InputMaybe<Scalars['String']['input']>;
  /** Total shares in vault after this redemption. */
  total_shares?: InputMaybe<Scalars['numeric']['input']>;
  /** Transaction hash of the redemption event. */
  transaction_hash?: InputMaybe<Scalars['String']['input']>;
  /** Type of vault (Atom, Triple, CounterTriple). */
  vault_type?: InputMaybe<Scalars['vault_type']['input']>;
};

/** aggregate sum on columns */
export type Redemptions_Sum_Fields = {
  __typename?: 'redemptions_sum_fields';
  /** Asset amount returned before fees, in wei. */
  assets?: Maybe<Scalars['numeric']['output']>;
  /** Block number when redemption occurred. */
  block_number?: Maybe<Scalars['numeric']['output']>;
  /** Bonding curve ID of the vault. */
  curve_id?: Maybe<Scalars['numeric']['output']>;
  /** Protocol fees charged for this redemption, in wei. */
  fees?: Maybe<Scalars['numeric']['output']>;
  /** Log index within the transaction for event ordering. */
  log_index?: Maybe<Scalars['bigint']['output']>;
  /** Number of shares burned for this redemption. */
  shares?: Maybe<Scalars['numeric']['output']>;
  /** Total shares in vault after this redemption. */
  total_shares?: Maybe<Scalars['numeric']['output']>;
};

/** order by sum() on columns of table "redemption" */
export type Redemptions_Sum_Order_By = {
  /** Asset amount returned before fees, in wei. */
  assets?: InputMaybe<Order_By>;
  /** Block number when redemption occurred. */
  block_number?: InputMaybe<Order_By>;
  /** Bonding curve ID of the vault. */
  curve_id?: InputMaybe<Order_By>;
  /** Protocol fees charged for this redemption, in wei. */
  fees?: InputMaybe<Order_By>;
  /** Log index within the transaction for event ordering. */
  log_index?: InputMaybe<Order_By>;
  /** Number of shares burned for this redemption. */
  shares?: InputMaybe<Order_By>;
  /** Total shares in vault after this redemption. */
  total_shares?: InputMaybe<Order_By>;
};

/** aggregate var_pop on columns */
export type Redemptions_Var_Pop_Fields = {
  __typename?: 'redemptions_var_pop_fields';
  /** Asset amount returned before fees, in wei. */
  assets?: Maybe<Scalars['Float']['output']>;
  /** Block number when redemption occurred. */
  block_number?: Maybe<Scalars['Float']['output']>;
  /** Bonding curve ID of the vault. */
  curve_id?: Maybe<Scalars['Float']['output']>;
  /** Protocol fees charged for this redemption, in wei. */
  fees?: Maybe<Scalars['Float']['output']>;
  /** Log index within the transaction for event ordering. */
  log_index?: Maybe<Scalars['Float']['output']>;
  /** Number of shares burned for this redemption. */
  shares?: Maybe<Scalars['Float']['output']>;
  /** Total shares in vault after this redemption. */
  total_shares?: Maybe<Scalars['Float']['output']>;
};

/** order by var_pop() on columns of table "redemption" */
export type Redemptions_Var_Pop_Order_By = {
  /** Asset amount returned before fees, in wei. */
  assets?: InputMaybe<Order_By>;
  /** Block number when redemption occurred. */
  block_number?: InputMaybe<Order_By>;
  /** Bonding curve ID of the vault. */
  curve_id?: InputMaybe<Order_By>;
  /** Protocol fees charged for this redemption, in wei. */
  fees?: InputMaybe<Order_By>;
  /** Log index within the transaction for event ordering. */
  log_index?: InputMaybe<Order_By>;
  /** Number of shares burned for this redemption. */
  shares?: InputMaybe<Order_By>;
  /** Total shares in vault after this redemption. */
  total_shares?: InputMaybe<Order_By>;
};

/** aggregate var_samp on columns */
export type Redemptions_Var_Samp_Fields = {
  __typename?: 'redemptions_var_samp_fields';
  /** Asset amount returned before fees, in wei. */
  assets?: Maybe<Scalars['Float']['output']>;
  /** Block number when redemption occurred. */
  block_number?: Maybe<Scalars['Float']['output']>;
  /** Bonding curve ID of the vault. */
  curve_id?: Maybe<Scalars['Float']['output']>;
  /** Protocol fees charged for this redemption, in wei. */
  fees?: Maybe<Scalars['Float']['output']>;
  /** Log index within the transaction for event ordering. */
  log_index?: Maybe<Scalars['Float']['output']>;
  /** Number of shares burned for this redemption. */
  shares?: Maybe<Scalars['Float']['output']>;
  /** Total shares in vault after this redemption. */
  total_shares?: Maybe<Scalars['Float']['output']>;
};

/** order by var_samp() on columns of table "redemption" */
export type Redemptions_Var_Samp_Order_By = {
  /** Asset amount returned before fees, in wei. */
  assets?: InputMaybe<Order_By>;
  /** Block number when redemption occurred. */
  block_number?: InputMaybe<Order_By>;
  /** Bonding curve ID of the vault. */
  curve_id?: InputMaybe<Order_By>;
  /** Protocol fees charged for this redemption, in wei. */
  fees?: InputMaybe<Order_By>;
  /** Log index within the transaction for event ordering. */
  log_index?: InputMaybe<Order_By>;
  /** Number of shares burned for this redemption. */
  shares?: InputMaybe<Order_By>;
  /** Total shares in vault after this redemption. */
  total_shares?: InputMaybe<Order_By>;
};

/** aggregate variance on columns */
export type Redemptions_Variance_Fields = {
  __typename?: 'redemptions_variance_fields';
  /** Asset amount returned before fees, in wei. */
  assets?: Maybe<Scalars['Float']['output']>;
  /** Block number when redemption occurred. */
  block_number?: Maybe<Scalars['Float']['output']>;
  /** Bonding curve ID of the vault. */
  curve_id?: Maybe<Scalars['Float']['output']>;
  /** Protocol fees charged for this redemption, in wei. */
  fees?: Maybe<Scalars['Float']['output']>;
  /** Log index within the transaction for event ordering. */
  log_index?: Maybe<Scalars['Float']['output']>;
  /** Number of shares burned for this redemption. */
  shares?: Maybe<Scalars['Float']['output']>;
  /** Total shares in vault after this redemption. */
  total_shares?: Maybe<Scalars['Float']['output']>;
};

/** order by variance() on columns of table "redemption" */
export type Redemptions_Variance_Order_By = {
  /** Asset amount returned before fees, in wei. */
  assets?: InputMaybe<Order_By>;
  /** Block number when redemption occurred. */
  block_number?: InputMaybe<Order_By>;
  /** Bonding curve ID of the vault. */
  curve_id?: InputMaybe<Order_By>;
  /** Protocol fees charged for this redemption, in wei. */
  fees?: InputMaybe<Order_By>;
  /** Log index within the transaction for event ordering. */
  log_index?: InputMaybe<Order_By>;
  /** Number of shares burned for this redemption. */
  shares?: InputMaybe<Order_By>;
  /** Total shares in vault after this redemption. */
  total_shares?: InputMaybe<Order_By>;
};

export type Search_Positions_On_Subject_Args = {
  addresses?: InputMaybe<Scalars['_text']['input']>;
  search_fields?: InputMaybe<Scalars['jsonb']['input']>;
};

export type Search_Term_Args = {
  query?: InputMaybe<Scalars['String']['input']>;
};

export type Search_Term_From_Following_Args = {
  address?: InputMaybe<Scalars['String']['input']>;
  query?: InputMaybe<Scalars['String']['input']>;
};

export type Search_Term_Tsvector_Args = {
  query?: InputMaybe<Scalars['String']['input']>;
};

/** columns and relationships of "season2_epoch_price" */
export type Season2_Epoch_Prices = {
  __typename?: 'season2_epoch_prices';
  average_price_usd: Scalars['numeric']['output'];
  computed_at: Scalars['timestamptz']['output'];
  epoch: Scalars['Int']['output'];
  /** An object relationship */
  season2_epoch?: Maybe<Season2_Epochs>;
  snapshot_count: Scalars['Int']['output'];
  updated_at: Scalars['timestamptz']['output'];
};

/** aggregated selection of "season2_epoch_price" */
export type Season2_Epoch_Prices_Aggregate = {
  __typename?: 'season2_epoch_prices_aggregate';
  aggregate?: Maybe<Season2_Epoch_Prices_Aggregate_Fields>;
  nodes: Array<Season2_Epoch_Prices>;
};

export type Season2_Epoch_Prices_Aggregate_Bool_Exp = {
  count?: InputMaybe<Season2_Epoch_Prices_Aggregate_Bool_Exp_Count>;
};

export type Season2_Epoch_Prices_Aggregate_Bool_Exp_Count = {
  arguments?: InputMaybe<Array<Season2_Epoch_Prices_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
  filter?: InputMaybe<Season2_Epoch_Prices_Bool_Exp>;
  predicate: Int_Comparison_Exp;
};

/** aggregate fields of "season2_epoch_price" */
export type Season2_Epoch_Prices_Aggregate_Fields = {
  __typename?: 'season2_epoch_prices_aggregate_fields';
  avg?: Maybe<Season2_Epoch_Prices_Avg_Fields>;
  count: Scalars['Int']['output'];
  max?: Maybe<Season2_Epoch_Prices_Max_Fields>;
  min?: Maybe<Season2_Epoch_Prices_Min_Fields>;
  stddev?: Maybe<Season2_Epoch_Prices_Stddev_Fields>;
  stddev_pop?: Maybe<Season2_Epoch_Prices_Stddev_Pop_Fields>;
  stddev_samp?: Maybe<Season2_Epoch_Prices_Stddev_Samp_Fields>;
  sum?: Maybe<Season2_Epoch_Prices_Sum_Fields>;
  var_pop?: Maybe<Season2_Epoch_Prices_Var_Pop_Fields>;
  var_samp?: Maybe<Season2_Epoch_Prices_Var_Samp_Fields>;
  variance?: Maybe<Season2_Epoch_Prices_Variance_Fields>;
};


/** aggregate fields of "season2_epoch_price" */
export type Season2_Epoch_Prices_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Season2_Epoch_Prices_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
};

/** order by aggregate values of table "season2_epoch_price" */
export type Season2_Epoch_Prices_Aggregate_Order_By = {
  avg?: InputMaybe<Season2_Epoch_Prices_Avg_Order_By>;
  count?: InputMaybe<Order_By>;
  max?: InputMaybe<Season2_Epoch_Prices_Max_Order_By>;
  min?: InputMaybe<Season2_Epoch_Prices_Min_Order_By>;
  stddev?: InputMaybe<Season2_Epoch_Prices_Stddev_Order_By>;
  stddev_pop?: InputMaybe<Season2_Epoch_Prices_Stddev_Pop_Order_By>;
  stddev_samp?: InputMaybe<Season2_Epoch_Prices_Stddev_Samp_Order_By>;
  sum?: InputMaybe<Season2_Epoch_Prices_Sum_Order_By>;
  var_pop?: InputMaybe<Season2_Epoch_Prices_Var_Pop_Order_By>;
  var_samp?: InputMaybe<Season2_Epoch_Prices_Var_Samp_Order_By>;
  variance?: InputMaybe<Season2_Epoch_Prices_Variance_Order_By>;
};

/** aggregate avg on columns */
export type Season2_Epoch_Prices_Avg_Fields = {
  __typename?: 'season2_epoch_prices_avg_fields';
  average_price_usd?: Maybe<Scalars['Float']['output']>;
  epoch?: Maybe<Scalars['Float']['output']>;
  snapshot_count?: Maybe<Scalars['Float']['output']>;
};

/** order by avg() on columns of table "season2_epoch_price" */
export type Season2_Epoch_Prices_Avg_Order_By = {
  average_price_usd?: InputMaybe<Order_By>;
  epoch?: InputMaybe<Order_By>;
  snapshot_count?: InputMaybe<Order_By>;
};

/** Boolean expression to filter rows from the table "season2_epoch_price". All fields are combined with a logical 'AND'. */
export type Season2_Epoch_Prices_Bool_Exp = {
  _and?: InputMaybe<Array<Season2_Epoch_Prices_Bool_Exp>>;
  _not?: InputMaybe<Season2_Epoch_Prices_Bool_Exp>;
  _or?: InputMaybe<Array<Season2_Epoch_Prices_Bool_Exp>>;
  average_price_usd?: InputMaybe<Numeric_Comparison_Exp>;
  computed_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  epoch?: InputMaybe<Int_Comparison_Exp>;
  season2_epoch?: InputMaybe<Season2_Epochs_Bool_Exp>;
  snapshot_count?: InputMaybe<Int_Comparison_Exp>;
  updated_at?: InputMaybe<Timestamptz_Comparison_Exp>;
};

/** aggregate max on columns */
export type Season2_Epoch_Prices_Max_Fields = {
  __typename?: 'season2_epoch_prices_max_fields';
  average_price_usd?: Maybe<Scalars['numeric']['output']>;
  computed_at?: Maybe<Scalars['timestamptz']['output']>;
  epoch?: Maybe<Scalars['Int']['output']>;
  snapshot_count?: Maybe<Scalars['Int']['output']>;
  updated_at?: Maybe<Scalars['timestamptz']['output']>;
};

/** order by max() on columns of table "season2_epoch_price" */
export type Season2_Epoch_Prices_Max_Order_By = {
  average_price_usd?: InputMaybe<Order_By>;
  computed_at?: InputMaybe<Order_By>;
  epoch?: InputMaybe<Order_By>;
  snapshot_count?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
};

/** aggregate min on columns */
export type Season2_Epoch_Prices_Min_Fields = {
  __typename?: 'season2_epoch_prices_min_fields';
  average_price_usd?: Maybe<Scalars['numeric']['output']>;
  computed_at?: Maybe<Scalars['timestamptz']['output']>;
  epoch?: Maybe<Scalars['Int']['output']>;
  snapshot_count?: Maybe<Scalars['Int']['output']>;
  updated_at?: Maybe<Scalars['timestamptz']['output']>;
};

/** order by min() on columns of table "season2_epoch_price" */
export type Season2_Epoch_Prices_Min_Order_By = {
  average_price_usd?: InputMaybe<Order_By>;
  computed_at?: InputMaybe<Order_By>;
  epoch?: InputMaybe<Order_By>;
  snapshot_count?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
};

/** Ordering options when selecting data from "season2_epoch_price". */
export type Season2_Epoch_Prices_Order_By = {
  average_price_usd?: InputMaybe<Order_By>;
  computed_at?: InputMaybe<Order_By>;
  epoch?: InputMaybe<Order_By>;
  season2_epoch?: InputMaybe<Season2_Epochs_Order_By>;
  snapshot_count?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
};

/** select columns of table "season2_epoch_price" */
export type Season2_Epoch_Prices_Select_Column =
  /** column name */
  | 'average_price_usd'
  /** column name */
  | 'computed_at'
  /** column name */
  | 'epoch'
  /** column name */
  | 'snapshot_count'
  /** column name */
  | 'updated_at';

/** aggregate stddev on columns */
export type Season2_Epoch_Prices_Stddev_Fields = {
  __typename?: 'season2_epoch_prices_stddev_fields';
  average_price_usd?: Maybe<Scalars['Float']['output']>;
  epoch?: Maybe<Scalars['Float']['output']>;
  snapshot_count?: Maybe<Scalars['Float']['output']>;
};

/** order by stddev() on columns of table "season2_epoch_price" */
export type Season2_Epoch_Prices_Stddev_Order_By = {
  average_price_usd?: InputMaybe<Order_By>;
  epoch?: InputMaybe<Order_By>;
  snapshot_count?: InputMaybe<Order_By>;
};

/** aggregate stddev_pop on columns */
export type Season2_Epoch_Prices_Stddev_Pop_Fields = {
  __typename?: 'season2_epoch_prices_stddev_pop_fields';
  average_price_usd?: Maybe<Scalars['Float']['output']>;
  epoch?: Maybe<Scalars['Float']['output']>;
  snapshot_count?: Maybe<Scalars['Float']['output']>;
};

/** order by stddev_pop() on columns of table "season2_epoch_price" */
export type Season2_Epoch_Prices_Stddev_Pop_Order_By = {
  average_price_usd?: InputMaybe<Order_By>;
  epoch?: InputMaybe<Order_By>;
  snapshot_count?: InputMaybe<Order_By>;
};

/** aggregate stddev_samp on columns */
export type Season2_Epoch_Prices_Stddev_Samp_Fields = {
  __typename?: 'season2_epoch_prices_stddev_samp_fields';
  average_price_usd?: Maybe<Scalars['Float']['output']>;
  epoch?: Maybe<Scalars['Float']['output']>;
  snapshot_count?: Maybe<Scalars['Float']['output']>;
};

/** order by stddev_samp() on columns of table "season2_epoch_price" */
export type Season2_Epoch_Prices_Stddev_Samp_Order_By = {
  average_price_usd?: InputMaybe<Order_By>;
  epoch?: InputMaybe<Order_By>;
  snapshot_count?: InputMaybe<Order_By>;
};

/** Streaming cursor of the table "season2_epoch_prices" */
export type Season2_Epoch_Prices_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Season2_Epoch_Prices_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Season2_Epoch_Prices_Stream_Cursor_Value_Input = {
  average_price_usd?: InputMaybe<Scalars['numeric']['input']>;
  computed_at?: InputMaybe<Scalars['timestamptz']['input']>;
  epoch?: InputMaybe<Scalars['Int']['input']>;
  snapshot_count?: InputMaybe<Scalars['Int']['input']>;
  updated_at?: InputMaybe<Scalars['timestamptz']['input']>;
};

/** aggregate sum on columns */
export type Season2_Epoch_Prices_Sum_Fields = {
  __typename?: 'season2_epoch_prices_sum_fields';
  average_price_usd?: Maybe<Scalars['numeric']['output']>;
  epoch?: Maybe<Scalars['Int']['output']>;
  snapshot_count?: Maybe<Scalars['Int']['output']>;
};

/** order by sum() on columns of table "season2_epoch_price" */
export type Season2_Epoch_Prices_Sum_Order_By = {
  average_price_usd?: InputMaybe<Order_By>;
  epoch?: InputMaybe<Order_By>;
  snapshot_count?: InputMaybe<Order_By>;
};

/** aggregate var_pop on columns */
export type Season2_Epoch_Prices_Var_Pop_Fields = {
  __typename?: 'season2_epoch_prices_var_pop_fields';
  average_price_usd?: Maybe<Scalars['Float']['output']>;
  epoch?: Maybe<Scalars['Float']['output']>;
  snapshot_count?: Maybe<Scalars['Float']['output']>;
};

/** order by var_pop() on columns of table "season2_epoch_price" */
export type Season2_Epoch_Prices_Var_Pop_Order_By = {
  average_price_usd?: InputMaybe<Order_By>;
  epoch?: InputMaybe<Order_By>;
  snapshot_count?: InputMaybe<Order_By>;
};

/** aggregate var_samp on columns */
export type Season2_Epoch_Prices_Var_Samp_Fields = {
  __typename?: 'season2_epoch_prices_var_samp_fields';
  average_price_usd?: Maybe<Scalars['Float']['output']>;
  epoch?: Maybe<Scalars['Float']['output']>;
  snapshot_count?: Maybe<Scalars['Float']['output']>;
};

/** order by var_samp() on columns of table "season2_epoch_price" */
export type Season2_Epoch_Prices_Var_Samp_Order_By = {
  average_price_usd?: InputMaybe<Order_By>;
  epoch?: InputMaybe<Order_By>;
  snapshot_count?: InputMaybe<Order_By>;
};

/** aggregate variance on columns */
export type Season2_Epoch_Prices_Variance_Fields = {
  __typename?: 'season2_epoch_prices_variance_fields';
  average_price_usd?: Maybe<Scalars['Float']['output']>;
  epoch?: Maybe<Scalars['Float']['output']>;
  snapshot_count?: Maybe<Scalars['Float']['output']>;
};

/** order by variance() on columns of table "season2_epoch_price" */
export type Season2_Epoch_Prices_Variance_Order_By = {
  average_price_usd?: InputMaybe<Order_By>;
  epoch?: InputMaybe<Order_By>;
  snapshot_count?: InputMaybe<Order_By>;
};

/** columns and relationships of "season2_epoch" */
export type Season2_Epochs = {
  __typename?: 'season2_epochs';
  created_at: Scalars['timestamptz']['output'];
  end_at: Scalars['timestamptz']['output'];
  epoch: Scalars['Int']['output'];
  /** An array relationship */
  epoch_price: Array<Season2_Epoch_Prices>;
  /** An aggregate relationship */
  epoch_price_aggregate: Season2_Epoch_Prices_Aggregate;
  finalized_at?: Maybe<Scalars['timestamptz']['output']>;
  /** An array relationship */
  iq_ledger_entries: Array<Season2_Iq_Ledger_Entries>;
  /** An aggregate relationship */
  iq_ledger_entries_aggregate: Season2_Iq_Ledger_Entries_Aggregate;
  is_final: Scalars['Boolean']['output'];
  last_settlement_force: Scalars['Boolean']['output'];
  settle_after: Scalars['timestamptz']['output'];
  settled_at?: Maybe<Scalars['timestamptz']['output']>;
  start_at: Scalars['timestamptz']['output'];
  updated_at: Scalars['timestamptz']['output'];
};


/** columns and relationships of "season2_epoch" */
export type Season2_EpochsEpoch_PriceArgs = {
  distinct_on?: InputMaybe<Array<Season2_Epoch_Prices_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Season2_Epoch_Prices_Order_By>>;
  where?: InputMaybe<Season2_Epoch_Prices_Bool_Exp>;
};


/** columns and relationships of "season2_epoch" */
export type Season2_EpochsEpoch_Price_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Season2_Epoch_Prices_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Season2_Epoch_Prices_Order_By>>;
  where?: InputMaybe<Season2_Epoch_Prices_Bool_Exp>;
};


/** columns and relationships of "season2_epoch" */
export type Season2_EpochsIq_Ledger_EntriesArgs = {
  distinct_on?: InputMaybe<Array<Season2_Iq_Ledger_Entries_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Season2_Iq_Ledger_Entries_Order_By>>;
  where?: InputMaybe<Season2_Iq_Ledger_Entries_Bool_Exp>;
};


/** columns and relationships of "season2_epoch" */
export type Season2_EpochsIq_Ledger_Entries_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Season2_Iq_Ledger_Entries_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Season2_Iq_Ledger_Entries_Order_By>>;
  where?: InputMaybe<Season2_Iq_Ledger_Entries_Bool_Exp>;
};

/** aggregated selection of "season2_epoch" */
export type Season2_Epochs_Aggregate = {
  __typename?: 'season2_epochs_aggregate';
  aggregate?: Maybe<Season2_Epochs_Aggregate_Fields>;
  nodes: Array<Season2_Epochs>;
};

/** aggregate fields of "season2_epoch" */
export type Season2_Epochs_Aggregate_Fields = {
  __typename?: 'season2_epochs_aggregate_fields';
  avg?: Maybe<Season2_Epochs_Avg_Fields>;
  count: Scalars['Int']['output'];
  max?: Maybe<Season2_Epochs_Max_Fields>;
  min?: Maybe<Season2_Epochs_Min_Fields>;
  stddev?: Maybe<Season2_Epochs_Stddev_Fields>;
  stddev_pop?: Maybe<Season2_Epochs_Stddev_Pop_Fields>;
  stddev_samp?: Maybe<Season2_Epochs_Stddev_Samp_Fields>;
  sum?: Maybe<Season2_Epochs_Sum_Fields>;
  var_pop?: Maybe<Season2_Epochs_Var_Pop_Fields>;
  var_samp?: Maybe<Season2_Epochs_Var_Samp_Fields>;
  variance?: Maybe<Season2_Epochs_Variance_Fields>;
};


/** aggregate fields of "season2_epoch" */
export type Season2_Epochs_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Season2_Epochs_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
};

/** aggregate avg on columns */
export type Season2_Epochs_Avg_Fields = {
  __typename?: 'season2_epochs_avg_fields';
  epoch?: Maybe<Scalars['Float']['output']>;
};

/** Boolean expression to filter rows from the table "season2_epoch". All fields are combined with a logical 'AND'. */
export type Season2_Epochs_Bool_Exp = {
  _and?: InputMaybe<Array<Season2_Epochs_Bool_Exp>>;
  _not?: InputMaybe<Season2_Epochs_Bool_Exp>;
  _or?: InputMaybe<Array<Season2_Epochs_Bool_Exp>>;
  created_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  end_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  epoch?: InputMaybe<Int_Comparison_Exp>;
  epoch_price?: InputMaybe<Season2_Epoch_Prices_Bool_Exp>;
  epoch_price_aggregate?: InputMaybe<Season2_Epoch_Prices_Aggregate_Bool_Exp>;
  finalized_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  iq_ledger_entries?: InputMaybe<Season2_Iq_Ledger_Entries_Bool_Exp>;
  iq_ledger_entries_aggregate?: InputMaybe<Season2_Iq_Ledger_Entries_Aggregate_Bool_Exp>;
  is_final?: InputMaybe<Boolean_Comparison_Exp>;
  last_settlement_force?: InputMaybe<Boolean_Comparison_Exp>;
  settle_after?: InputMaybe<Timestamptz_Comparison_Exp>;
  settled_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  start_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  updated_at?: InputMaybe<Timestamptz_Comparison_Exp>;
};

/** aggregate max on columns */
export type Season2_Epochs_Max_Fields = {
  __typename?: 'season2_epochs_max_fields';
  created_at?: Maybe<Scalars['timestamptz']['output']>;
  end_at?: Maybe<Scalars['timestamptz']['output']>;
  epoch?: Maybe<Scalars['Int']['output']>;
  finalized_at?: Maybe<Scalars['timestamptz']['output']>;
  settle_after?: Maybe<Scalars['timestamptz']['output']>;
  settled_at?: Maybe<Scalars['timestamptz']['output']>;
  start_at?: Maybe<Scalars['timestamptz']['output']>;
  updated_at?: Maybe<Scalars['timestamptz']['output']>;
};

/** aggregate min on columns */
export type Season2_Epochs_Min_Fields = {
  __typename?: 'season2_epochs_min_fields';
  created_at?: Maybe<Scalars['timestamptz']['output']>;
  end_at?: Maybe<Scalars['timestamptz']['output']>;
  epoch?: Maybe<Scalars['Int']['output']>;
  finalized_at?: Maybe<Scalars['timestamptz']['output']>;
  settle_after?: Maybe<Scalars['timestamptz']['output']>;
  settled_at?: Maybe<Scalars['timestamptz']['output']>;
  start_at?: Maybe<Scalars['timestamptz']['output']>;
  updated_at?: Maybe<Scalars['timestamptz']['output']>;
};

/** Ordering options when selecting data from "season2_epoch". */
export type Season2_Epochs_Order_By = {
  created_at?: InputMaybe<Order_By>;
  end_at?: InputMaybe<Order_By>;
  epoch?: InputMaybe<Order_By>;
  epoch_price_aggregate?: InputMaybe<Season2_Epoch_Prices_Aggregate_Order_By>;
  finalized_at?: InputMaybe<Order_By>;
  iq_ledger_entries_aggregate?: InputMaybe<Season2_Iq_Ledger_Entries_Aggregate_Order_By>;
  is_final?: InputMaybe<Order_By>;
  last_settlement_force?: InputMaybe<Order_By>;
  settle_after?: InputMaybe<Order_By>;
  settled_at?: InputMaybe<Order_By>;
  start_at?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
};

/** select columns of table "season2_epoch" */
export type Season2_Epochs_Select_Column =
  /** column name */
  | 'created_at'
  /** column name */
  | 'end_at'
  /** column name */
  | 'epoch'
  /** column name */
  | 'finalized_at'
  /** column name */
  | 'is_final'
  /** column name */
  | 'last_settlement_force'
  /** column name */
  | 'settle_after'
  /** column name */
  | 'settled_at'
  /** column name */
  | 'start_at'
  /** column name */
  | 'updated_at';

/** aggregate stddev on columns */
export type Season2_Epochs_Stddev_Fields = {
  __typename?: 'season2_epochs_stddev_fields';
  epoch?: Maybe<Scalars['Float']['output']>;
};

/** aggregate stddev_pop on columns */
export type Season2_Epochs_Stddev_Pop_Fields = {
  __typename?: 'season2_epochs_stddev_pop_fields';
  epoch?: Maybe<Scalars['Float']['output']>;
};

/** aggregate stddev_samp on columns */
export type Season2_Epochs_Stddev_Samp_Fields = {
  __typename?: 'season2_epochs_stddev_samp_fields';
  epoch?: Maybe<Scalars['Float']['output']>;
};

/** Streaming cursor of the table "season2_epochs" */
export type Season2_Epochs_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Season2_Epochs_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Season2_Epochs_Stream_Cursor_Value_Input = {
  created_at?: InputMaybe<Scalars['timestamptz']['input']>;
  end_at?: InputMaybe<Scalars['timestamptz']['input']>;
  epoch?: InputMaybe<Scalars['Int']['input']>;
  finalized_at?: InputMaybe<Scalars['timestamptz']['input']>;
  is_final?: InputMaybe<Scalars['Boolean']['input']>;
  last_settlement_force?: InputMaybe<Scalars['Boolean']['input']>;
  settle_after?: InputMaybe<Scalars['timestamptz']['input']>;
  settled_at?: InputMaybe<Scalars['timestamptz']['input']>;
  start_at?: InputMaybe<Scalars['timestamptz']['input']>;
  updated_at?: InputMaybe<Scalars['timestamptz']['input']>;
};

/** aggregate sum on columns */
export type Season2_Epochs_Sum_Fields = {
  __typename?: 'season2_epochs_sum_fields';
  epoch?: Maybe<Scalars['Int']['output']>;
};

/** aggregate var_pop on columns */
export type Season2_Epochs_Var_Pop_Fields = {
  __typename?: 'season2_epochs_var_pop_fields';
  epoch?: Maybe<Scalars['Float']['output']>;
};

/** aggregate var_samp on columns */
export type Season2_Epochs_Var_Samp_Fields = {
  __typename?: 'season2_epochs_var_samp_fields';
  epoch?: Maybe<Scalars['Float']['output']>;
};

/** aggregate variance on columns */
export type Season2_Epochs_Variance_Fields = {
  __typename?: 'season2_epochs_variance_fields';
  epoch?: Maybe<Scalars['Float']['output']>;
};

/** columns and relationships of "season2_iq_ledger" */
export type Season2_Iq_Ledger_Entries = {
  __typename?: 'season2_iq_ledger_entries';
  /** An object relationship */
  account?: Maybe<Accounts>;
  account_id: Scalars['String']['output'];
  created_at: Scalars['timestamptz']['output'];
  entry_type: Scalars['String']['output'];
  epoch: Scalars['Int']['output'];
  id: Scalars['bigint']['output'];
  iq_points: Scalars['numeric']['output'];
  metadata: Scalars['jsonb']['output'];
  /** An object relationship */
  season2_epoch?: Maybe<Season2_Epochs>;
  source_id: Scalars['String']['output'];
  updated_at: Scalars['timestamptz']['output'];
};


/** columns and relationships of "season2_iq_ledger" */
export type Season2_Iq_Ledger_EntriesMetadataArgs = {
  path?: InputMaybe<Scalars['String']['input']>;
};

/** aggregated selection of "season2_iq_ledger" */
export type Season2_Iq_Ledger_Entries_Aggregate = {
  __typename?: 'season2_iq_ledger_entries_aggregate';
  aggregate?: Maybe<Season2_Iq_Ledger_Entries_Aggregate_Fields>;
  nodes: Array<Season2_Iq_Ledger_Entries>;
};

export type Season2_Iq_Ledger_Entries_Aggregate_Bool_Exp = {
  count?: InputMaybe<Season2_Iq_Ledger_Entries_Aggregate_Bool_Exp_Count>;
};

export type Season2_Iq_Ledger_Entries_Aggregate_Bool_Exp_Count = {
  arguments?: InputMaybe<Array<Season2_Iq_Ledger_Entries_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
  filter?: InputMaybe<Season2_Iq_Ledger_Entries_Bool_Exp>;
  predicate: Int_Comparison_Exp;
};

/** aggregate fields of "season2_iq_ledger" */
export type Season2_Iq_Ledger_Entries_Aggregate_Fields = {
  __typename?: 'season2_iq_ledger_entries_aggregate_fields';
  avg?: Maybe<Season2_Iq_Ledger_Entries_Avg_Fields>;
  count: Scalars['Int']['output'];
  max?: Maybe<Season2_Iq_Ledger_Entries_Max_Fields>;
  min?: Maybe<Season2_Iq_Ledger_Entries_Min_Fields>;
  stddev?: Maybe<Season2_Iq_Ledger_Entries_Stddev_Fields>;
  stddev_pop?: Maybe<Season2_Iq_Ledger_Entries_Stddev_Pop_Fields>;
  stddev_samp?: Maybe<Season2_Iq_Ledger_Entries_Stddev_Samp_Fields>;
  sum?: Maybe<Season2_Iq_Ledger_Entries_Sum_Fields>;
  var_pop?: Maybe<Season2_Iq_Ledger_Entries_Var_Pop_Fields>;
  var_samp?: Maybe<Season2_Iq_Ledger_Entries_Var_Samp_Fields>;
  variance?: Maybe<Season2_Iq_Ledger_Entries_Variance_Fields>;
};


/** aggregate fields of "season2_iq_ledger" */
export type Season2_Iq_Ledger_Entries_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Season2_Iq_Ledger_Entries_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
};

/** order by aggregate values of table "season2_iq_ledger" */
export type Season2_Iq_Ledger_Entries_Aggregate_Order_By = {
  avg?: InputMaybe<Season2_Iq_Ledger_Entries_Avg_Order_By>;
  count?: InputMaybe<Order_By>;
  max?: InputMaybe<Season2_Iq_Ledger_Entries_Max_Order_By>;
  min?: InputMaybe<Season2_Iq_Ledger_Entries_Min_Order_By>;
  stddev?: InputMaybe<Season2_Iq_Ledger_Entries_Stddev_Order_By>;
  stddev_pop?: InputMaybe<Season2_Iq_Ledger_Entries_Stddev_Pop_Order_By>;
  stddev_samp?: InputMaybe<Season2_Iq_Ledger_Entries_Stddev_Samp_Order_By>;
  sum?: InputMaybe<Season2_Iq_Ledger_Entries_Sum_Order_By>;
  var_pop?: InputMaybe<Season2_Iq_Ledger_Entries_Var_Pop_Order_By>;
  var_samp?: InputMaybe<Season2_Iq_Ledger_Entries_Var_Samp_Order_By>;
  variance?: InputMaybe<Season2_Iq_Ledger_Entries_Variance_Order_By>;
};

/** aggregate avg on columns */
export type Season2_Iq_Ledger_Entries_Avg_Fields = {
  __typename?: 'season2_iq_ledger_entries_avg_fields';
  epoch?: Maybe<Scalars['Float']['output']>;
  id?: Maybe<Scalars['Float']['output']>;
  iq_points?: Maybe<Scalars['Float']['output']>;
};

/** order by avg() on columns of table "season2_iq_ledger" */
export type Season2_Iq_Ledger_Entries_Avg_Order_By = {
  epoch?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  iq_points?: InputMaybe<Order_By>;
};

/** Boolean expression to filter rows from the table "season2_iq_ledger". All fields are combined with a logical 'AND'. */
export type Season2_Iq_Ledger_Entries_Bool_Exp = {
  _and?: InputMaybe<Array<Season2_Iq_Ledger_Entries_Bool_Exp>>;
  _not?: InputMaybe<Season2_Iq_Ledger_Entries_Bool_Exp>;
  _or?: InputMaybe<Array<Season2_Iq_Ledger_Entries_Bool_Exp>>;
  account?: InputMaybe<Accounts_Bool_Exp>;
  account_id?: InputMaybe<String_Comparison_Exp>;
  created_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  entry_type?: InputMaybe<String_Comparison_Exp>;
  epoch?: InputMaybe<Int_Comparison_Exp>;
  id?: InputMaybe<Bigint_Comparison_Exp>;
  iq_points?: InputMaybe<Numeric_Comparison_Exp>;
  metadata?: InputMaybe<Jsonb_Comparison_Exp>;
  season2_epoch?: InputMaybe<Season2_Epochs_Bool_Exp>;
  source_id?: InputMaybe<String_Comparison_Exp>;
  updated_at?: InputMaybe<Timestamptz_Comparison_Exp>;
};

/** aggregate max on columns */
export type Season2_Iq_Ledger_Entries_Max_Fields = {
  __typename?: 'season2_iq_ledger_entries_max_fields';
  account_id?: Maybe<Scalars['String']['output']>;
  created_at?: Maybe<Scalars['timestamptz']['output']>;
  entry_type?: Maybe<Scalars['String']['output']>;
  epoch?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['bigint']['output']>;
  iq_points?: Maybe<Scalars['numeric']['output']>;
  source_id?: Maybe<Scalars['String']['output']>;
  updated_at?: Maybe<Scalars['timestamptz']['output']>;
};

/** order by max() on columns of table "season2_iq_ledger" */
export type Season2_Iq_Ledger_Entries_Max_Order_By = {
  account_id?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  entry_type?: InputMaybe<Order_By>;
  epoch?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  iq_points?: InputMaybe<Order_By>;
  source_id?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
};

/** aggregate min on columns */
export type Season2_Iq_Ledger_Entries_Min_Fields = {
  __typename?: 'season2_iq_ledger_entries_min_fields';
  account_id?: Maybe<Scalars['String']['output']>;
  created_at?: Maybe<Scalars['timestamptz']['output']>;
  entry_type?: Maybe<Scalars['String']['output']>;
  epoch?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['bigint']['output']>;
  iq_points?: Maybe<Scalars['numeric']['output']>;
  source_id?: Maybe<Scalars['String']['output']>;
  updated_at?: Maybe<Scalars['timestamptz']['output']>;
};

/** order by min() on columns of table "season2_iq_ledger" */
export type Season2_Iq_Ledger_Entries_Min_Order_By = {
  account_id?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  entry_type?: InputMaybe<Order_By>;
  epoch?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  iq_points?: InputMaybe<Order_By>;
  source_id?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
};

/** Ordering options when selecting data from "season2_iq_ledger". */
export type Season2_Iq_Ledger_Entries_Order_By = {
  account?: InputMaybe<Accounts_Order_By>;
  account_id?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  entry_type?: InputMaybe<Order_By>;
  epoch?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  iq_points?: InputMaybe<Order_By>;
  metadata?: InputMaybe<Order_By>;
  season2_epoch?: InputMaybe<Season2_Epochs_Order_By>;
  source_id?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
};

/** select columns of table "season2_iq_ledger" */
export type Season2_Iq_Ledger_Entries_Select_Column =
  /** column name */
  | 'account_id'
  /** column name */
  | 'created_at'
  /** column name */
  | 'entry_type'
  /** column name */
  | 'epoch'
  /** column name */
  | 'id'
  /** column name */
  | 'iq_points'
  /** column name */
  | 'metadata'
  /** column name */
  | 'source_id'
  /** column name */
  | 'updated_at';

/** aggregate stddev on columns */
export type Season2_Iq_Ledger_Entries_Stddev_Fields = {
  __typename?: 'season2_iq_ledger_entries_stddev_fields';
  epoch?: Maybe<Scalars['Float']['output']>;
  id?: Maybe<Scalars['Float']['output']>;
  iq_points?: Maybe<Scalars['Float']['output']>;
};

/** order by stddev() on columns of table "season2_iq_ledger" */
export type Season2_Iq_Ledger_Entries_Stddev_Order_By = {
  epoch?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  iq_points?: InputMaybe<Order_By>;
};

/** aggregate stddev_pop on columns */
export type Season2_Iq_Ledger_Entries_Stddev_Pop_Fields = {
  __typename?: 'season2_iq_ledger_entries_stddev_pop_fields';
  epoch?: Maybe<Scalars['Float']['output']>;
  id?: Maybe<Scalars['Float']['output']>;
  iq_points?: Maybe<Scalars['Float']['output']>;
};

/** order by stddev_pop() on columns of table "season2_iq_ledger" */
export type Season2_Iq_Ledger_Entries_Stddev_Pop_Order_By = {
  epoch?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  iq_points?: InputMaybe<Order_By>;
};

/** aggregate stddev_samp on columns */
export type Season2_Iq_Ledger_Entries_Stddev_Samp_Fields = {
  __typename?: 'season2_iq_ledger_entries_stddev_samp_fields';
  epoch?: Maybe<Scalars['Float']['output']>;
  id?: Maybe<Scalars['Float']['output']>;
  iq_points?: Maybe<Scalars['Float']['output']>;
};

/** order by stddev_samp() on columns of table "season2_iq_ledger" */
export type Season2_Iq_Ledger_Entries_Stddev_Samp_Order_By = {
  epoch?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  iq_points?: InputMaybe<Order_By>;
};

/** Streaming cursor of the table "season2_iq_ledger_entries" */
export type Season2_Iq_Ledger_Entries_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Season2_Iq_Ledger_Entries_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Season2_Iq_Ledger_Entries_Stream_Cursor_Value_Input = {
  account_id?: InputMaybe<Scalars['String']['input']>;
  created_at?: InputMaybe<Scalars['timestamptz']['input']>;
  entry_type?: InputMaybe<Scalars['String']['input']>;
  epoch?: InputMaybe<Scalars['Int']['input']>;
  id?: InputMaybe<Scalars['bigint']['input']>;
  iq_points?: InputMaybe<Scalars['numeric']['input']>;
  metadata?: InputMaybe<Scalars['jsonb']['input']>;
  source_id?: InputMaybe<Scalars['String']['input']>;
  updated_at?: InputMaybe<Scalars['timestamptz']['input']>;
};

/** aggregate sum on columns */
export type Season2_Iq_Ledger_Entries_Sum_Fields = {
  __typename?: 'season2_iq_ledger_entries_sum_fields';
  epoch?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['bigint']['output']>;
  iq_points?: Maybe<Scalars['numeric']['output']>;
};

/** order by sum() on columns of table "season2_iq_ledger" */
export type Season2_Iq_Ledger_Entries_Sum_Order_By = {
  epoch?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  iq_points?: InputMaybe<Order_By>;
};

/** aggregate var_pop on columns */
export type Season2_Iq_Ledger_Entries_Var_Pop_Fields = {
  __typename?: 'season2_iq_ledger_entries_var_pop_fields';
  epoch?: Maybe<Scalars['Float']['output']>;
  id?: Maybe<Scalars['Float']['output']>;
  iq_points?: Maybe<Scalars['Float']['output']>;
};

/** order by var_pop() on columns of table "season2_iq_ledger" */
export type Season2_Iq_Ledger_Entries_Var_Pop_Order_By = {
  epoch?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  iq_points?: InputMaybe<Order_By>;
};

/** aggregate var_samp on columns */
export type Season2_Iq_Ledger_Entries_Var_Samp_Fields = {
  __typename?: 'season2_iq_ledger_entries_var_samp_fields';
  epoch?: Maybe<Scalars['Float']['output']>;
  id?: Maybe<Scalars['Float']['output']>;
  iq_points?: Maybe<Scalars['Float']['output']>;
};

/** order by var_samp() on columns of table "season2_iq_ledger" */
export type Season2_Iq_Ledger_Entries_Var_Samp_Order_By = {
  epoch?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  iq_points?: InputMaybe<Order_By>;
};

/** aggregate variance on columns */
export type Season2_Iq_Ledger_Entries_Variance_Fields = {
  __typename?: 'season2_iq_ledger_entries_variance_fields';
  epoch?: Maybe<Scalars['Float']['output']>;
  id?: Maybe<Scalars['Float']['output']>;
  iq_points?: Maybe<Scalars['Float']['output']>;
};

/** order by variance() on columns of table "season2_iq_ledger" */
export type Season2_Iq_Ledger_Entries_Variance_Order_By = {
  epoch?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  iq_points?: InputMaybe<Order_By>;
};

/** columns and relationships of "season2_leaderboard_payout" */
export type Season2_Leaderboard_Payouts = {
  __typename?: 'season2_leaderboard_payouts';
  iq_points: Scalars['numeric']['output'];
  rank: Scalars['Int']['output'];
};

/** aggregated selection of "season2_leaderboard_payout" */
export type Season2_Leaderboard_Payouts_Aggregate = {
  __typename?: 'season2_leaderboard_payouts_aggregate';
  aggregate?: Maybe<Season2_Leaderboard_Payouts_Aggregate_Fields>;
  nodes: Array<Season2_Leaderboard_Payouts>;
};

/** aggregate fields of "season2_leaderboard_payout" */
export type Season2_Leaderboard_Payouts_Aggregate_Fields = {
  __typename?: 'season2_leaderboard_payouts_aggregate_fields';
  avg?: Maybe<Season2_Leaderboard_Payouts_Avg_Fields>;
  count: Scalars['Int']['output'];
  max?: Maybe<Season2_Leaderboard_Payouts_Max_Fields>;
  min?: Maybe<Season2_Leaderboard_Payouts_Min_Fields>;
  stddev?: Maybe<Season2_Leaderboard_Payouts_Stddev_Fields>;
  stddev_pop?: Maybe<Season2_Leaderboard_Payouts_Stddev_Pop_Fields>;
  stddev_samp?: Maybe<Season2_Leaderboard_Payouts_Stddev_Samp_Fields>;
  sum?: Maybe<Season2_Leaderboard_Payouts_Sum_Fields>;
  var_pop?: Maybe<Season2_Leaderboard_Payouts_Var_Pop_Fields>;
  var_samp?: Maybe<Season2_Leaderboard_Payouts_Var_Samp_Fields>;
  variance?: Maybe<Season2_Leaderboard_Payouts_Variance_Fields>;
};


/** aggregate fields of "season2_leaderboard_payout" */
export type Season2_Leaderboard_Payouts_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Season2_Leaderboard_Payouts_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
};

/** aggregate avg on columns */
export type Season2_Leaderboard_Payouts_Avg_Fields = {
  __typename?: 'season2_leaderboard_payouts_avg_fields';
  iq_points?: Maybe<Scalars['Float']['output']>;
  rank?: Maybe<Scalars['Float']['output']>;
};

/** Boolean expression to filter rows from the table "season2_leaderboard_payout". All fields are combined with a logical 'AND'. */
export type Season2_Leaderboard_Payouts_Bool_Exp = {
  _and?: InputMaybe<Array<Season2_Leaderboard_Payouts_Bool_Exp>>;
  _not?: InputMaybe<Season2_Leaderboard_Payouts_Bool_Exp>;
  _or?: InputMaybe<Array<Season2_Leaderboard_Payouts_Bool_Exp>>;
  iq_points?: InputMaybe<Numeric_Comparison_Exp>;
  rank?: InputMaybe<Int_Comparison_Exp>;
};

/** aggregate max on columns */
export type Season2_Leaderboard_Payouts_Max_Fields = {
  __typename?: 'season2_leaderboard_payouts_max_fields';
  iq_points?: Maybe<Scalars['numeric']['output']>;
  rank?: Maybe<Scalars['Int']['output']>;
};

/** aggregate min on columns */
export type Season2_Leaderboard_Payouts_Min_Fields = {
  __typename?: 'season2_leaderboard_payouts_min_fields';
  iq_points?: Maybe<Scalars['numeric']['output']>;
  rank?: Maybe<Scalars['Int']['output']>;
};

/** Ordering options when selecting data from "season2_leaderboard_payout". */
export type Season2_Leaderboard_Payouts_Order_By = {
  iq_points?: InputMaybe<Order_By>;
  rank?: InputMaybe<Order_By>;
};

/** select columns of table "season2_leaderboard_payout" */
export type Season2_Leaderboard_Payouts_Select_Column =
  /** column name */
  | 'iq_points'
  /** column name */
  | 'rank';

/** aggregate stddev on columns */
export type Season2_Leaderboard_Payouts_Stddev_Fields = {
  __typename?: 'season2_leaderboard_payouts_stddev_fields';
  iq_points?: Maybe<Scalars['Float']['output']>;
  rank?: Maybe<Scalars['Float']['output']>;
};

/** aggregate stddev_pop on columns */
export type Season2_Leaderboard_Payouts_Stddev_Pop_Fields = {
  __typename?: 'season2_leaderboard_payouts_stddev_pop_fields';
  iq_points?: Maybe<Scalars['Float']['output']>;
  rank?: Maybe<Scalars['Float']['output']>;
};

/** aggregate stddev_samp on columns */
export type Season2_Leaderboard_Payouts_Stddev_Samp_Fields = {
  __typename?: 'season2_leaderboard_payouts_stddev_samp_fields';
  iq_points?: Maybe<Scalars['Float']['output']>;
  rank?: Maybe<Scalars['Float']['output']>;
};

/** Streaming cursor of the table "season2_leaderboard_payouts" */
export type Season2_Leaderboard_Payouts_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Season2_Leaderboard_Payouts_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Season2_Leaderboard_Payouts_Stream_Cursor_Value_Input = {
  iq_points?: InputMaybe<Scalars['numeric']['input']>;
  rank?: InputMaybe<Scalars['Int']['input']>;
};

/** aggregate sum on columns */
export type Season2_Leaderboard_Payouts_Sum_Fields = {
  __typename?: 'season2_leaderboard_payouts_sum_fields';
  iq_points?: Maybe<Scalars['numeric']['output']>;
  rank?: Maybe<Scalars['Int']['output']>;
};

/** aggregate var_pop on columns */
export type Season2_Leaderboard_Payouts_Var_Pop_Fields = {
  __typename?: 'season2_leaderboard_payouts_var_pop_fields';
  iq_points?: Maybe<Scalars['Float']['output']>;
  rank?: Maybe<Scalars['Float']['output']>;
};

/** aggregate var_samp on columns */
export type Season2_Leaderboard_Payouts_Var_Samp_Fields = {
  __typename?: 'season2_leaderboard_payouts_var_samp_fields';
  iq_points?: Maybe<Scalars['Float']['output']>;
  rank?: Maybe<Scalars['Float']['output']>;
};

/** aggregate variance on columns */
export type Season2_Leaderboard_Payouts_Variance_Fields = {
  __typename?: 'season2_leaderboard_payouts_variance_fields';
  iq_points?: Maybe<Scalars['Float']['output']>;
  rank?: Maybe<Scalars['Float']['output']>;
};

/** columns and relationships of "season2_trust_price_snapshot" */
export type Season2_Trust_Price_Snapshots = {
  __typename?: 'season2_trust_price_snapshots';
  created_at: Scalars['timestamptz']['output'];
  price_usd: Scalars['numeric']['output'];
  snapshot_at: Scalars['timestamptz']['output'];
  source: Scalars['String']['output'];
  source_ref?: Maybe<Scalars['String']['output']>;
  updated_at: Scalars['timestamptz']['output'];
};

/** aggregated selection of "season2_trust_price_snapshot" */
export type Season2_Trust_Price_Snapshots_Aggregate = {
  __typename?: 'season2_trust_price_snapshots_aggregate';
  aggregate?: Maybe<Season2_Trust_Price_Snapshots_Aggregate_Fields>;
  nodes: Array<Season2_Trust_Price_Snapshots>;
};

/** aggregate fields of "season2_trust_price_snapshot" */
export type Season2_Trust_Price_Snapshots_Aggregate_Fields = {
  __typename?: 'season2_trust_price_snapshots_aggregate_fields';
  avg?: Maybe<Season2_Trust_Price_Snapshots_Avg_Fields>;
  count: Scalars['Int']['output'];
  max?: Maybe<Season2_Trust_Price_Snapshots_Max_Fields>;
  min?: Maybe<Season2_Trust_Price_Snapshots_Min_Fields>;
  stddev?: Maybe<Season2_Trust_Price_Snapshots_Stddev_Fields>;
  stddev_pop?: Maybe<Season2_Trust_Price_Snapshots_Stddev_Pop_Fields>;
  stddev_samp?: Maybe<Season2_Trust_Price_Snapshots_Stddev_Samp_Fields>;
  sum?: Maybe<Season2_Trust_Price_Snapshots_Sum_Fields>;
  var_pop?: Maybe<Season2_Trust_Price_Snapshots_Var_Pop_Fields>;
  var_samp?: Maybe<Season2_Trust_Price_Snapshots_Var_Samp_Fields>;
  variance?: Maybe<Season2_Trust_Price_Snapshots_Variance_Fields>;
};


/** aggregate fields of "season2_trust_price_snapshot" */
export type Season2_Trust_Price_Snapshots_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Season2_Trust_Price_Snapshots_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
};

/** aggregate avg on columns */
export type Season2_Trust_Price_Snapshots_Avg_Fields = {
  __typename?: 'season2_trust_price_snapshots_avg_fields';
  price_usd?: Maybe<Scalars['Float']['output']>;
};

/** Boolean expression to filter rows from the table "season2_trust_price_snapshot". All fields are combined with a logical 'AND'. */
export type Season2_Trust_Price_Snapshots_Bool_Exp = {
  _and?: InputMaybe<Array<Season2_Trust_Price_Snapshots_Bool_Exp>>;
  _not?: InputMaybe<Season2_Trust_Price_Snapshots_Bool_Exp>;
  _or?: InputMaybe<Array<Season2_Trust_Price_Snapshots_Bool_Exp>>;
  created_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  price_usd?: InputMaybe<Numeric_Comparison_Exp>;
  snapshot_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  source?: InputMaybe<String_Comparison_Exp>;
  source_ref?: InputMaybe<String_Comparison_Exp>;
  updated_at?: InputMaybe<Timestamptz_Comparison_Exp>;
};

/** aggregate max on columns */
export type Season2_Trust_Price_Snapshots_Max_Fields = {
  __typename?: 'season2_trust_price_snapshots_max_fields';
  created_at?: Maybe<Scalars['timestamptz']['output']>;
  price_usd?: Maybe<Scalars['numeric']['output']>;
  snapshot_at?: Maybe<Scalars['timestamptz']['output']>;
  source?: Maybe<Scalars['String']['output']>;
  source_ref?: Maybe<Scalars['String']['output']>;
  updated_at?: Maybe<Scalars['timestamptz']['output']>;
};

/** aggregate min on columns */
export type Season2_Trust_Price_Snapshots_Min_Fields = {
  __typename?: 'season2_trust_price_snapshots_min_fields';
  created_at?: Maybe<Scalars['timestamptz']['output']>;
  price_usd?: Maybe<Scalars['numeric']['output']>;
  snapshot_at?: Maybe<Scalars['timestamptz']['output']>;
  source?: Maybe<Scalars['String']['output']>;
  source_ref?: Maybe<Scalars['String']['output']>;
  updated_at?: Maybe<Scalars['timestamptz']['output']>;
};

/** Ordering options when selecting data from "season2_trust_price_snapshot". */
export type Season2_Trust_Price_Snapshots_Order_By = {
  created_at?: InputMaybe<Order_By>;
  price_usd?: InputMaybe<Order_By>;
  snapshot_at?: InputMaybe<Order_By>;
  source?: InputMaybe<Order_By>;
  source_ref?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
};

/** select columns of table "season2_trust_price_snapshot" */
export type Season2_Trust_Price_Snapshots_Select_Column =
  /** column name */
  | 'created_at'
  /** column name */
  | 'price_usd'
  /** column name */
  | 'snapshot_at'
  /** column name */
  | 'source'
  /** column name */
  | 'source_ref'
  /** column name */
  | 'updated_at';

/** aggregate stddev on columns */
export type Season2_Trust_Price_Snapshots_Stddev_Fields = {
  __typename?: 'season2_trust_price_snapshots_stddev_fields';
  price_usd?: Maybe<Scalars['Float']['output']>;
};

/** aggregate stddev_pop on columns */
export type Season2_Trust_Price_Snapshots_Stddev_Pop_Fields = {
  __typename?: 'season2_trust_price_snapshots_stddev_pop_fields';
  price_usd?: Maybe<Scalars['Float']['output']>;
};

/** aggregate stddev_samp on columns */
export type Season2_Trust_Price_Snapshots_Stddev_Samp_Fields = {
  __typename?: 'season2_trust_price_snapshots_stddev_samp_fields';
  price_usd?: Maybe<Scalars['Float']['output']>;
};

/** Streaming cursor of the table "season2_trust_price_snapshots" */
export type Season2_Trust_Price_Snapshots_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Season2_Trust_Price_Snapshots_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Season2_Trust_Price_Snapshots_Stream_Cursor_Value_Input = {
  created_at?: InputMaybe<Scalars['timestamptz']['input']>;
  price_usd?: InputMaybe<Scalars['numeric']['input']>;
  snapshot_at?: InputMaybe<Scalars['timestamptz']['input']>;
  source?: InputMaybe<Scalars['String']['input']>;
  source_ref?: InputMaybe<Scalars['String']['input']>;
  updated_at?: InputMaybe<Scalars['timestamptz']['input']>;
};

/** aggregate sum on columns */
export type Season2_Trust_Price_Snapshots_Sum_Fields = {
  __typename?: 'season2_trust_price_snapshots_sum_fields';
  price_usd?: Maybe<Scalars['numeric']['output']>;
};

/** aggregate var_pop on columns */
export type Season2_Trust_Price_Snapshots_Var_Pop_Fields = {
  __typename?: 'season2_trust_price_snapshots_var_pop_fields';
  price_usd?: Maybe<Scalars['Float']['output']>;
};

/** aggregate var_samp on columns */
export type Season2_Trust_Price_Snapshots_Var_Samp_Fields = {
  __typename?: 'season2_trust_price_snapshots_var_samp_fields';
  price_usd?: Maybe<Scalars['Float']['output']>;
};

/** aggregate variance on columns */
export type Season2_Trust_Price_Snapshots_Variance_Fields = {
  __typename?: 'season2_trust_price_snapshots_variance_fields';
  price_usd?: Maybe<Scalars['Float']['output']>;
};

/** Daily share price statistics rolled up from hourly stats. */
export type Share_Price_Change_Stats_Daily = {
  __typename?: 'share_price_change_stats_daily';
  bucket?: Maybe<Scalars['timestamptz']['output']>;
  change_count?: Maybe<Scalars['numeric']['output']>;
  curve_id?: Maybe<Scalars['numeric']['output']>;
  difference?: Maybe<Scalars['numeric']['output']>;
  first_share_price?: Maybe<Scalars['numeric']['output']>;
  last_share_price?: Maybe<Scalars['numeric']['output']>;
  /** An object relationship */
  term?: Maybe<Terms>;
  term_id?: Maybe<Scalars['String']['output']>;
};

/** order by aggregate values of table "share_price_change_stats_daily" */
export type Share_Price_Change_Stats_Daily_Aggregate_Order_By = {
  avg?: InputMaybe<Share_Price_Change_Stats_Daily_Avg_Order_By>;
  count?: InputMaybe<Order_By>;
  max?: InputMaybe<Share_Price_Change_Stats_Daily_Max_Order_By>;
  min?: InputMaybe<Share_Price_Change_Stats_Daily_Min_Order_By>;
  stddev?: InputMaybe<Share_Price_Change_Stats_Daily_Stddev_Order_By>;
  stddev_pop?: InputMaybe<Share_Price_Change_Stats_Daily_Stddev_Pop_Order_By>;
  stddev_samp?: InputMaybe<Share_Price_Change_Stats_Daily_Stddev_Samp_Order_By>;
  sum?: InputMaybe<Share_Price_Change_Stats_Daily_Sum_Order_By>;
  var_pop?: InputMaybe<Share_Price_Change_Stats_Daily_Var_Pop_Order_By>;
  var_samp?: InputMaybe<Share_Price_Change_Stats_Daily_Var_Samp_Order_By>;
  variance?: InputMaybe<Share_Price_Change_Stats_Daily_Variance_Order_By>;
};

/** order by avg() on columns of table "share_price_change_stats_daily" */
export type Share_Price_Change_Stats_Daily_Avg_Order_By = {
  change_count?: InputMaybe<Order_By>;
  curve_id?: InputMaybe<Order_By>;
  difference?: InputMaybe<Order_By>;
  first_share_price?: InputMaybe<Order_By>;
  last_share_price?: InputMaybe<Order_By>;
};

/** Boolean expression to filter rows from the table "share_price_change_stats_daily". All fields are combined with a logical 'AND'. */
export type Share_Price_Change_Stats_Daily_Bool_Exp = {
  _and?: InputMaybe<Array<Share_Price_Change_Stats_Daily_Bool_Exp>>;
  _not?: InputMaybe<Share_Price_Change_Stats_Daily_Bool_Exp>;
  _or?: InputMaybe<Array<Share_Price_Change_Stats_Daily_Bool_Exp>>;
  bucket?: InputMaybe<Timestamptz_Comparison_Exp>;
  change_count?: InputMaybe<Numeric_Comparison_Exp>;
  curve_id?: InputMaybe<Numeric_Comparison_Exp>;
  difference?: InputMaybe<Numeric_Comparison_Exp>;
  first_share_price?: InputMaybe<Numeric_Comparison_Exp>;
  last_share_price?: InputMaybe<Numeric_Comparison_Exp>;
  term?: InputMaybe<Terms_Bool_Exp>;
  term_id?: InputMaybe<String_Comparison_Exp>;
};

/** order by max() on columns of table "share_price_change_stats_daily" */
export type Share_Price_Change_Stats_Daily_Max_Order_By = {
  bucket?: InputMaybe<Order_By>;
  change_count?: InputMaybe<Order_By>;
  curve_id?: InputMaybe<Order_By>;
  difference?: InputMaybe<Order_By>;
  first_share_price?: InputMaybe<Order_By>;
  last_share_price?: InputMaybe<Order_By>;
  term_id?: InputMaybe<Order_By>;
};

/** order by min() on columns of table "share_price_change_stats_daily" */
export type Share_Price_Change_Stats_Daily_Min_Order_By = {
  bucket?: InputMaybe<Order_By>;
  change_count?: InputMaybe<Order_By>;
  curve_id?: InputMaybe<Order_By>;
  difference?: InputMaybe<Order_By>;
  first_share_price?: InputMaybe<Order_By>;
  last_share_price?: InputMaybe<Order_By>;
  term_id?: InputMaybe<Order_By>;
};

/** Ordering options when selecting data from "share_price_change_stats_daily". */
export type Share_Price_Change_Stats_Daily_Order_By = {
  bucket?: InputMaybe<Order_By>;
  change_count?: InputMaybe<Order_By>;
  curve_id?: InputMaybe<Order_By>;
  difference?: InputMaybe<Order_By>;
  first_share_price?: InputMaybe<Order_By>;
  last_share_price?: InputMaybe<Order_By>;
  term?: InputMaybe<Terms_Order_By>;
  term_id?: InputMaybe<Order_By>;
};

/** select columns of table "share_price_change_stats_daily" */
export type Share_Price_Change_Stats_Daily_Select_Column =
  /** column name */
  | 'bucket'
  /** column name */
  | 'change_count'
  /** column name */
  | 'curve_id'
  /** column name */
  | 'difference'
  /** column name */
  | 'first_share_price'
  /** column name */
  | 'last_share_price'
  /** column name */
  | 'term_id';

/** order by stddev() on columns of table "share_price_change_stats_daily" */
export type Share_Price_Change_Stats_Daily_Stddev_Order_By = {
  change_count?: InputMaybe<Order_By>;
  curve_id?: InputMaybe<Order_By>;
  difference?: InputMaybe<Order_By>;
  first_share_price?: InputMaybe<Order_By>;
  last_share_price?: InputMaybe<Order_By>;
};

/** order by stddev_pop() on columns of table "share_price_change_stats_daily" */
export type Share_Price_Change_Stats_Daily_Stddev_Pop_Order_By = {
  change_count?: InputMaybe<Order_By>;
  curve_id?: InputMaybe<Order_By>;
  difference?: InputMaybe<Order_By>;
  first_share_price?: InputMaybe<Order_By>;
  last_share_price?: InputMaybe<Order_By>;
};

/** order by stddev_samp() on columns of table "share_price_change_stats_daily" */
export type Share_Price_Change_Stats_Daily_Stddev_Samp_Order_By = {
  change_count?: InputMaybe<Order_By>;
  curve_id?: InputMaybe<Order_By>;
  difference?: InputMaybe<Order_By>;
  first_share_price?: InputMaybe<Order_By>;
  last_share_price?: InputMaybe<Order_By>;
};

/** Streaming cursor of the table "share_price_change_stats_daily" */
export type Share_Price_Change_Stats_Daily_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Share_Price_Change_Stats_Daily_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Share_Price_Change_Stats_Daily_Stream_Cursor_Value_Input = {
  bucket?: InputMaybe<Scalars['timestamptz']['input']>;
  change_count?: InputMaybe<Scalars['numeric']['input']>;
  curve_id?: InputMaybe<Scalars['numeric']['input']>;
  difference?: InputMaybe<Scalars['numeric']['input']>;
  first_share_price?: InputMaybe<Scalars['numeric']['input']>;
  last_share_price?: InputMaybe<Scalars['numeric']['input']>;
  term_id?: InputMaybe<Scalars['String']['input']>;
};

/** order by sum() on columns of table "share_price_change_stats_daily" */
export type Share_Price_Change_Stats_Daily_Sum_Order_By = {
  change_count?: InputMaybe<Order_By>;
  curve_id?: InputMaybe<Order_By>;
  difference?: InputMaybe<Order_By>;
  first_share_price?: InputMaybe<Order_By>;
  last_share_price?: InputMaybe<Order_By>;
};

/** order by var_pop() on columns of table "share_price_change_stats_daily" */
export type Share_Price_Change_Stats_Daily_Var_Pop_Order_By = {
  change_count?: InputMaybe<Order_By>;
  curve_id?: InputMaybe<Order_By>;
  difference?: InputMaybe<Order_By>;
  first_share_price?: InputMaybe<Order_By>;
  last_share_price?: InputMaybe<Order_By>;
};

/** order by var_samp() on columns of table "share_price_change_stats_daily" */
export type Share_Price_Change_Stats_Daily_Var_Samp_Order_By = {
  change_count?: InputMaybe<Order_By>;
  curve_id?: InputMaybe<Order_By>;
  difference?: InputMaybe<Order_By>;
  first_share_price?: InputMaybe<Order_By>;
  last_share_price?: InputMaybe<Order_By>;
};

/** order by variance() on columns of table "share_price_change_stats_daily" */
export type Share_Price_Change_Stats_Daily_Variance_Order_By = {
  change_count?: InputMaybe<Order_By>;
  curve_id?: InputMaybe<Order_By>;
  difference?: InputMaybe<Order_By>;
  first_share_price?: InputMaybe<Order_By>;
  last_share_price?: InputMaybe<Order_By>;
};

/** Hourly share price statistics showing first, last, and difference per term and curve using TimescaleDB continuous aggregates. */
export type Share_Price_Change_Stats_Hourly = {
  __typename?: 'share_price_change_stats_hourly';
  bucket?: Maybe<Scalars['timestamptz']['output']>;
  change_count?: Maybe<Scalars['bigint']['output']>;
  curve_id?: Maybe<Scalars['numeric']['output']>;
  difference?: Maybe<Scalars['numeric']['output']>;
  first_share_price?: Maybe<Scalars['numeric']['output']>;
  last_share_price?: Maybe<Scalars['numeric']['output']>;
  /** An object relationship */
  term?: Maybe<Terms>;
  term_id?: Maybe<Scalars['String']['output']>;
};

/** order by aggregate values of table "share_price_change_stats_hourly" */
export type Share_Price_Change_Stats_Hourly_Aggregate_Order_By = {
  avg?: InputMaybe<Share_Price_Change_Stats_Hourly_Avg_Order_By>;
  count?: InputMaybe<Order_By>;
  max?: InputMaybe<Share_Price_Change_Stats_Hourly_Max_Order_By>;
  min?: InputMaybe<Share_Price_Change_Stats_Hourly_Min_Order_By>;
  stddev?: InputMaybe<Share_Price_Change_Stats_Hourly_Stddev_Order_By>;
  stddev_pop?: InputMaybe<Share_Price_Change_Stats_Hourly_Stddev_Pop_Order_By>;
  stddev_samp?: InputMaybe<Share_Price_Change_Stats_Hourly_Stddev_Samp_Order_By>;
  sum?: InputMaybe<Share_Price_Change_Stats_Hourly_Sum_Order_By>;
  var_pop?: InputMaybe<Share_Price_Change_Stats_Hourly_Var_Pop_Order_By>;
  var_samp?: InputMaybe<Share_Price_Change_Stats_Hourly_Var_Samp_Order_By>;
  variance?: InputMaybe<Share_Price_Change_Stats_Hourly_Variance_Order_By>;
};

/** order by avg() on columns of table "share_price_change_stats_hourly" */
export type Share_Price_Change_Stats_Hourly_Avg_Order_By = {
  change_count?: InputMaybe<Order_By>;
  curve_id?: InputMaybe<Order_By>;
  difference?: InputMaybe<Order_By>;
  first_share_price?: InputMaybe<Order_By>;
  last_share_price?: InputMaybe<Order_By>;
};

/** Boolean expression to filter rows from the table "share_price_change_stats_hourly". All fields are combined with a logical 'AND'. */
export type Share_Price_Change_Stats_Hourly_Bool_Exp = {
  _and?: InputMaybe<Array<Share_Price_Change_Stats_Hourly_Bool_Exp>>;
  _not?: InputMaybe<Share_Price_Change_Stats_Hourly_Bool_Exp>;
  _or?: InputMaybe<Array<Share_Price_Change_Stats_Hourly_Bool_Exp>>;
  bucket?: InputMaybe<Timestamptz_Comparison_Exp>;
  change_count?: InputMaybe<Bigint_Comparison_Exp>;
  curve_id?: InputMaybe<Numeric_Comparison_Exp>;
  difference?: InputMaybe<Numeric_Comparison_Exp>;
  first_share_price?: InputMaybe<Numeric_Comparison_Exp>;
  last_share_price?: InputMaybe<Numeric_Comparison_Exp>;
  term?: InputMaybe<Terms_Bool_Exp>;
  term_id?: InputMaybe<String_Comparison_Exp>;
};

/** order by max() on columns of table "share_price_change_stats_hourly" */
export type Share_Price_Change_Stats_Hourly_Max_Order_By = {
  bucket?: InputMaybe<Order_By>;
  change_count?: InputMaybe<Order_By>;
  curve_id?: InputMaybe<Order_By>;
  difference?: InputMaybe<Order_By>;
  first_share_price?: InputMaybe<Order_By>;
  last_share_price?: InputMaybe<Order_By>;
  term_id?: InputMaybe<Order_By>;
};

/** order by min() on columns of table "share_price_change_stats_hourly" */
export type Share_Price_Change_Stats_Hourly_Min_Order_By = {
  bucket?: InputMaybe<Order_By>;
  change_count?: InputMaybe<Order_By>;
  curve_id?: InputMaybe<Order_By>;
  difference?: InputMaybe<Order_By>;
  first_share_price?: InputMaybe<Order_By>;
  last_share_price?: InputMaybe<Order_By>;
  term_id?: InputMaybe<Order_By>;
};

/** Ordering options when selecting data from "share_price_change_stats_hourly". */
export type Share_Price_Change_Stats_Hourly_Order_By = {
  bucket?: InputMaybe<Order_By>;
  change_count?: InputMaybe<Order_By>;
  curve_id?: InputMaybe<Order_By>;
  difference?: InputMaybe<Order_By>;
  first_share_price?: InputMaybe<Order_By>;
  last_share_price?: InputMaybe<Order_By>;
  term?: InputMaybe<Terms_Order_By>;
  term_id?: InputMaybe<Order_By>;
};

/** select columns of table "share_price_change_stats_hourly" */
export type Share_Price_Change_Stats_Hourly_Select_Column =
  /** column name */
  | 'bucket'
  /** column name */
  | 'change_count'
  /** column name */
  | 'curve_id'
  /** column name */
  | 'difference'
  /** column name */
  | 'first_share_price'
  /** column name */
  | 'last_share_price'
  /** column name */
  | 'term_id';

/** order by stddev() on columns of table "share_price_change_stats_hourly" */
export type Share_Price_Change_Stats_Hourly_Stddev_Order_By = {
  change_count?: InputMaybe<Order_By>;
  curve_id?: InputMaybe<Order_By>;
  difference?: InputMaybe<Order_By>;
  first_share_price?: InputMaybe<Order_By>;
  last_share_price?: InputMaybe<Order_By>;
};

/** order by stddev_pop() on columns of table "share_price_change_stats_hourly" */
export type Share_Price_Change_Stats_Hourly_Stddev_Pop_Order_By = {
  change_count?: InputMaybe<Order_By>;
  curve_id?: InputMaybe<Order_By>;
  difference?: InputMaybe<Order_By>;
  first_share_price?: InputMaybe<Order_By>;
  last_share_price?: InputMaybe<Order_By>;
};

/** order by stddev_samp() on columns of table "share_price_change_stats_hourly" */
export type Share_Price_Change_Stats_Hourly_Stddev_Samp_Order_By = {
  change_count?: InputMaybe<Order_By>;
  curve_id?: InputMaybe<Order_By>;
  difference?: InputMaybe<Order_By>;
  first_share_price?: InputMaybe<Order_By>;
  last_share_price?: InputMaybe<Order_By>;
};

/** Streaming cursor of the table "share_price_change_stats_hourly" */
export type Share_Price_Change_Stats_Hourly_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Share_Price_Change_Stats_Hourly_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Share_Price_Change_Stats_Hourly_Stream_Cursor_Value_Input = {
  bucket?: InputMaybe<Scalars['timestamptz']['input']>;
  change_count?: InputMaybe<Scalars['bigint']['input']>;
  curve_id?: InputMaybe<Scalars['numeric']['input']>;
  difference?: InputMaybe<Scalars['numeric']['input']>;
  first_share_price?: InputMaybe<Scalars['numeric']['input']>;
  last_share_price?: InputMaybe<Scalars['numeric']['input']>;
  term_id?: InputMaybe<Scalars['String']['input']>;
};

/** order by sum() on columns of table "share_price_change_stats_hourly" */
export type Share_Price_Change_Stats_Hourly_Sum_Order_By = {
  change_count?: InputMaybe<Order_By>;
  curve_id?: InputMaybe<Order_By>;
  difference?: InputMaybe<Order_By>;
  first_share_price?: InputMaybe<Order_By>;
  last_share_price?: InputMaybe<Order_By>;
};

/** order by var_pop() on columns of table "share_price_change_stats_hourly" */
export type Share_Price_Change_Stats_Hourly_Var_Pop_Order_By = {
  change_count?: InputMaybe<Order_By>;
  curve_id?: InputMaybe<Order_By>;
  difference?: InputMaybe<Order_By>;
  first_share_price?: InputMaybe<Order_By>;
  last_share_price?: InputMaybe<Order_By>;
};

/** order by var_samp() on columns of table "share_price_change_stats_hourly" */
export type Share_Price_Change_Stats_Hourly_Var_Samp_Order_By = {
  change_count?: InputMaybe<Order_By>;
  curve_id?: InputMaybe<Order_By>;
  difference?: InputMaybe<Order_By>;
  first_share_price?: InputMaybe<Order_By>;
  last_share_price?: InputMaybe<Order_By>;
};

/** order by variance() on columns of table "share_price_change_stats_hourly" */
export type Share_Price_Change_Stats_Hourly_Variance_Order_By = {
  change_count?: InputMaybe<Order_By>;
  curve_id?: InputMaybe<Order_By>;
  difference?: InputMaybe<Order_By>;
  first_share_price?: InputMaybe<Order_By>;
  last_share_price?: InputMaybe<Order_By>;
};

/** Monthly share price statistics rolled up from daily stats. */
export type Share_Price_Change_Stats_Monthly = {
  __typename?: 'share_price_change_stats_monthly';
  bucket?: Maybe<Scalars['timestamptz']['output']>;
  change_count?: Maybe<Scalars['numeric']['output']>;
  curve_id?: Maybe<Scalars['numeric']['output']>;
  difference?: Maybe<Scalars['numeric']['output']>;
  first_share_price?: Maybe<Scalars['numeric']['output']>;
  last_share_price?: Maybe<Scalars['numeric']['output']>;
  /** An object relationship */
  term?: Maybe<Terms>;
  term_id?: Maybe<Scalars['String']['output']>;
};

/** order by aggregate values of table "share_price_change_stats_monthly" */
export type Share_Price_Change_Stats_Monthly_Aggregate_Order_By = {
  avg?: InputMaybe<Share_Price_Change_Stats_Monthly_Avg_Order_By>;
  count?: InputMaybe<Order_By>;
  max?: InputMaybe<Share_Price_Change_Stats_Monthly_Max_Order_By>;
  min?: InputMaybe<Share_Price_Change_Stats_Monthly_Min_Order_By>;
  stddev?: InputMaybe<Share_Price_Change_Stats_Monthly_Stddev_Order_By>;
  stddev_pop?: InputMaybe<Share_Price_Change_Stats_Monthly_Stddev_Pop_Order_By>;
  stddev_samp?: InputMaybe<Share_Price_Change_Stats_Monthly_Stddev_Samp_Order_By>;
  sum?: InputMaybe<Share_Price_Change_Stats_Monthly_Sum_Order_By>;
  var_pop?: InputMaybe<Share_Price_Change_Stats_Monthly_Var_Pop_Order_By>;
  var_samp?: InputMaybe<Share_Price_Change_Stats_Monthly_Var_Samp_Order_By>;
  variance?: InputMaybe<Share_Price_Change_Stats_Monthly_Variance_Order_By>;
};

/** order by avg() on columns of table "share_price_change_stats_monthly" */
export type Share_Price_Change_Stats_Monthly_Avg_Order_By = {
  change_count?: InputMaybe<Order_By>;
  curve_id?: InputMaybe<Order_By>;
  difference?: InputMaybe<Order_By>;
  first_share_price?: InputMaybe<Order_By>;
  last_share_price?: InputMaybe<Order_By>;
};

/** Boolean expression to filter rows from the table "share_price_change_stats_monthly". All fields are combined with a logical 'AND'. */
export type Share_Price_Change_Stats_Monthly_Bool_Exp = {
  _and?: InputMaybe<Array<Share_Price_Change_Stats_Monthly_Bool_Exp>>;
  _not?: InputMaybe<Share_Price_Change_Stats_Monthly_Bool_Exp>;
  _or?: InputMaybe<Array<Share_Price_Change_Stats_Monthly_Bool_Exp>>;
  bucket?: InputMaybe<Timestamptz_Comparison_Exp>;
  change_count?: InputMaybe<Numeric_Comparison_Exp>;
  curve_id?: InputMaybe<Numeric_Comparison_Exp>;
  difference?: InputMaybe<Numeric_Comparison_Exp>;
  first_share_price?: InputMaybe<Numeric_Comparison_Exp>;
  last_share_price?: InputMaybe<Numeric_Comparison_Exp>;
  term?: InputMaybe<Terms_Bool_Exp>;
  term_id?: InputMaybe<String_Comparison_Exp>;
};

/** order by max() on columns of table "share_price_change_stats_monthly" */
export type Share_Price_Change_Stats_Monthly_Max_Order_By = {
  bucket?: InputMaybe<Order_By>;
  change_count?: InputMaybe<Order_By>;
  curve_id?: InputMaybe<Order_By>;
  difference?: InputMaybe<Order_By>;
  first_share_price?: InputMaybe<Order_By>;
  last_share_price?: InputMaybe<Order_By>;
  term_id?: InputMaybe<Order_By>;
};

/** order by min() on columns of table "share_price_change_stats_monthly" */
export type Share_Price_Change_Stats_Monthly_Min_Order_By = {
  bucket?: InputMaybe<Order_By>;
  change_count?: InputMaybe<Order_By>;
  curve_id?: InputMaybe<Order_By>;
  difference?: InputMaybe<Order_By>;
  first_share_price?: InputMaybe<Order_By>;
  last_share_price?: InputMaybe<Order_By>;
  term_id?: InputMaybe<Order_By>;
};

/** Ordering options when selecting data from "share_price_change_stats_monthly". */
export type Share_Price_Change_Stats_Monthly_Order_By = {
  bucket?: InputMaybe<Order_By>;
  change_count?: InputMaybe<Order_By>;
  curve_id?: InputMaybe<Order_By>;
  difference?: InputMaybe<Order_By>;
  first_share_price?: InputMaybe<Order_By>;
  last_share_price?: InputMaybe<Order_By>;
  term?: InputMaybe<Terms_Order_By>;
  term_id?: InputMaybe<Order_By>;
};

/** select columns of table "share_price_change_stats_monthly" */
export type Share_Price_Change_Stats_Monthly_Select_Column =
  /** column name */
  | 'bucket'
  /** column name */
  | 'change_count'
  /** column name */
  | 'curve_id'
  /** column name */
  | 'difference'
  /** column name */
  | 'first_share_price'
  /** column name */
  | 'last_share_price'
  /** column name */
  | 'term_id';

/** order by stddev() on columns of table "share_price_change_stats_monthly" */
export type Share_Price_Change_Stats_Monthly_Stddev_Order_By = {
  change_count?: InputMaybe<Order_By>;
  curve_id?: InputMaybe<Order_By>;
  difference?: InputMaybe<Order_By>;
  first_share_price?: InputMaybe<Order_By>;
  last_share_price?: InputMaybe<Order_By>;
};

/** order by stddev_pop() on columns of table "share_price_change_stats_monthly" */
export type Share_Price_Change_Stats_Monthly_Stddev_Pop_Order_By = {
  change_count?: InputMaybe<Order_By>;
  curve_id?: InputMaybe<Order_By>;
  difference?: InputMaybe<Order_By>;
  first_share_price?: InputMaybe<Order_By>;
  last_share_price?: InputMaybe<Order_By>;
};

/** order by stddev_samp() on columns of table "share_price_change_stats_monthly" */
export type Share_Price_Change_Stats_Monthly_Stddev_Samp_Order_By = {
  change_count?: InputMaybe<Order_By>;
  curve_id?: InputMaybe<Order_By>;
  difference?: InputMaybe<Order_By>;
  first_share_price?: InputMaybe<Order_By>;
  last_share_price?: InputMaybe<Order_By>;
};

/** Streaming cursor of the table "share_price_change_stats_monthly" */
export type Share_Price_Change_Stats_Monthly_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Share_Price_Change_Stats_Monthly_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Share_Price_Change_Stats_Monthly_Stream_Cursor_Value_Input = {
  bucket?: InputMaybe<Scalars['timestamptz']['input']>;
  change_count?: InputMaybe<Scalars['numeric']['input']>;
  curve_id?: InputMaybe<Scalars['numeric']['input']>;
  difference?: InputMaybe<Scalars['numeric']['input']>;
  first_share_price?: InputMaybe<Scalars['numeric']['input']>;
  last_share_price?: InputMaybe<Scalars['numeric']['input']>;
  term_id?: InputMaybe<Scalars['String']['input']>;
};

/** order by sum() on columns of table "share_price_change_stats_monthly" */
export type Share_Price_Change_Stats_Monthly_Sum_Order_By = {
  change_count?: InputMaybe<Order_By>;
  curve_id?: InputMaybe<Order_By>;
  difference?: InputMaybe<Order_By>;
  first_share_price?: InputMaybe<Order_By>;
  last_share_price?: InputMaybe<Order_By>;
};

/** order by var_pop() on columns of table "share_price_change_stats_monthly" */
export type Share_Price_Change_Stats_Monthly_Var_Pop_Order_By = {
  change_count?: InputMaybe<Order_By>;
  curve_id?: InputMaybe<Order_By>;
  difference?: InputMaybe<Order_By>;
  first_share_price?: InputMaybe<Order_By>;
  last_share_price?: InputMaybe<Order_By>;
};

/** order by var_samp() on columns of table "share_price_change_stats_monthly" */
export type Share_Price_Change_Stats_Monthly_Var_Samp_Order_By = {
  change_count?: InputMaybe<Order_By>;
  curve_id?: InputMaybe<Order_By>;
  difference?: InputMaybe<Order_By>;
  first_share_price?: InputMaybe<Order_By>;
  last_share_price?: InputMaybe<Order_By>;
};

/** order by variance() on columns of table "share_price_change_stats_monthly" */
export type Share_Price_Change_Stats_Monthly_Variance_Order_By = {
  change_count?: InputMaybe<Order_By>;
  curve_id?: InputMaybe<Order_By>;
  difference?: InputMaybe<Order_By>;
  first_share_price?: InputMaybe<Order_By>;
  last_share_price?: InputMaybe<Order_By>;
};

/** Weekly share price statistics rolled up from daily stats. */
export type Share_Price_Change_Stats_Weekly = {
  __typename?: 'share_price_change_stats_weekly';
  bucket?: Maybe<Scalars['timestamptz']['output']>;
  change_count?: Maybe<Scalars['numeric']['output']>;
  curve_id?: Maybe<Scalars['numeric']['output']>;
  difference?: Maybe<Scalars['numeric']['output']>;
  first_share_price?: Maybe<Scalars['numeric']['output']>;
  last_share_price?: Maybe<Scalars['numeric']['output']>;
  /** An object relationship */
  term?: Maybe<Terms>;
  term_id?: Maybe<Scalars['String']['output']>;
};

/** order by aggregate values of table "share_price_change_stats_weekly" */
export type Share_Price_Change_Stats_Weekly_Aggregate_Order_By = {
  avg?: InputMaybe<Share_Price_Change_Stats_Weekly_Avg_Order_By>;
  count?: InputMaybe<Order_By>;
  max?: InputMaybe<Share_Price_Change_Stats_Weekly_Max_Order_By>;
  min?: InputMaybe<Share_Price_Change_Stats_Weekly_Min_Order_By>;
  stddev?: InputMaybe<Share_Price_Change_Stats_Weekly_Stddev_Order_By>;
  stddev_pop?: InputMaybe<Share_Price_Change_Stats_Weekly_Stddev_Pop_Order_By>;
  stddev_samp?: InputMaybe<Share_Price_Change_Stats_Weekly_Stddev_Samp_Order_By>;
  sum?: InputMaybe<Share_Price_Change_Stats_Weekly_Sum_Order_By>;
  var_pop?: InputMaybe<Share_Price_Change_Stats_Weekly_Var_Pop_Order_By>;
  var_samp?: InputMaybe<Share_Price_Change_Stats_Weekly_Var_Samp_Order_By>;
  variance?: InputMaybe<Share_Price_Change_Stats_Weekly_Variance_Order_By>;
};

/** order by avg() on columns of table "share_price_change_stats_weekly" */
export type Share_Price_Change_Stats_Weekly_Avg_Order_By = {
  change_count?: InputMaybe<Order_By>;
  curve_id?: InputMaybe<Order_By>;
  difference?: InputMaybe<Order_By>;
  first_share_price?: InputMaybe<Order_By>;
  last_share_price?: InputMaybe<Order_By>;
};

/** Boolean expression to filter rows from the table "share_price_change_stats_weekly". All fields are combined with a logical 'AND'. */
export type Share_Price_Change_Stats_Weekly_Bool_Exp = {
  _and?: InputMaybe<Array<Share_Price_Change_Stats_Weekly_Bool_Exp>>;
  _not?: InputMaybe<Share_Price_Change_Stats_Weekly_Bool_Exp>;
  _or?: InputMaybe<Array<Share_Price_Change_Stats_Weekly_Bool_Exp>>;
  bucket?: InputMaybe<Timestamptz_Comparison_Exp>;
  change_count?: InputMaybe<Numeric_Comparison_Exp>;
  curve_id?: InputMaybe<Numeric_Comparison_Exp>;
  difference?: InputMaybe<Numeric_Comparison_Exp>;
  first_share_price?: InputMaybe<Numeric_Comparison_Exp>;
  last_share_price?: InputMaybe<Numeric_Comparison_Exp>;
  term?: InputMaybe<Terms_Bool_Exp>;
  term_id?: InputMaybe<String_Comparison_Exp>;
};

/** order by max() on columns of table "share_price_change_stats_weekly" */
export type Share_Price_Change_Stats_Weekly_Max_Order_By = {
  bucket?: InputMaybe<Order_By>;
  change_count?: InputMaybe<Order_By>;
  curve_id?: InputMaybe<Order_By>;
  difference?: InputMaybe<Order_By>;
  first_share_price?: InputMaybe<Order_By>;
  last_share_price?: InputMaybe<Order_By>;
  term_id?: InputMaybe<Order_By>;
};

/** order by min() on columns of table "share_price_change_stats_weekly" */
export type Share_Price_Change_Stats_Weekly_Min_Order_By = {
  bucket?: InputMaybe<Order_By>;
  change_count?: InputMaybe<Order_By>;
  curve_id?: InputMaybe<Order_By>;
  difference?: InputMaybe<Order_By>;
  first_share_price?: InputMaybe<Order_By>;
  last_share_price?: InputMaybe<Order_By>;
  term_id?: InputMaybe<Order_By>;
};

/** Ordering options when selecting data from "share_price_change_stats_weekly". */
export type Share_Price_Change_Stats_Weekly_Order_By = {
  bucket?: InputMaybe<Order_By>;
  change_count?: InputMaybe<Order_By>;
  curve_id?: InputMaybe<Order_By>;
  difference?: InputMaybe<Order_By>;
  first_share_price?: InputMaybe<Order_By>;
  last_share_price?: InputMaybe<Order_By>;
  term?: InputMaybe<Terms_Order_By>;
  term_id?: InputMaybe<Order_By>;
};

/** select columns of table "share_price_change_stats_weekly" */
export type Share_Price_Change_Stats_Weekly_Select_Column =
  /** column name */
  | 'bucket'
  /** column name */
  | 'change_count'
  /** column name */
  | 'curve_id'
  /** column name */
  | 'difference'
  /** column name */
  | 'first_share_price'
  /** column name */
  | 'last_share_price'
  /** column name */
  | 'term_id';

/** order by stddev() on columns of table "share_price_change_stats_weekly" */
export type Share_Price_Change_Stats_Weekly_Stddev_Order_By = {
  change_count?: InputMaybe<Order_By>;
  curve_id?: InputMaybe<Order_By>;
  difference?: InputMaybe<Order_By>;
  first_share_price?: InputMaybe<Order_By>;
  last_share_price?: InputMaybe<Order_By>;
};

/** order by stddev_pop() on columns of table "share_price_change_stats_weekly" */
export type Share_Price_Change_Stats_Weekly_Stddev_Pop_Order_By = {
  change_count?: InputMaybe<Order_By>;
  curve_id?: InputMaybe<Order_By>;
  difference?: InputMaybe<Order_By>;
  first_share_price?: InputMaybe<Order_By>;
  last_share_price?: InputMaybe<Order_By>;
};

/** order by stddev_samp() on columns of table "share_price_change_stats_weekly" */
export type Share_Price_Change_Stats_Weekly_Stddev_Samp_Order_By = {
  change_count?: InputMaybe<Order_By>;
  curve_id?: InputMaybe<Order_By>;
  difference?: InputMaybe<Order_By>;
  first_share_price?: InputMaybe<Order_By>;
  last_share_price?: InputMaybe<Order_By>;
};

/** Streaming cursor of the table "share_price_change_stats_weekly" */
export type Share_Price_Change_Stats_Weekly_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Share_Price_Change_Stats_Weekly_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Share_Price_Change_Stats_Weekly_Stream_Cursor_Value_Input = {
  bucket?: InputMaybe<Scalars['timestamptz']['input']>;
  change_count?: InputMaybe<Scalars['numeric']['input']>;
  curve_id?: InputMaybe<Scalars['numeric']['input']>;
  difference?: InputMaybe<Scalars['numeric']['input']>;
  first_share_price?: InputMaybe<Scalars['numeric']['input']>;
  last_share_price?: InputMaybe<Scalars['numeric']['input']>;
  term_id?: InputMaybe<Scalars['String']['input']>;
};

/** order by sum() on columns of table "share_price_change_stats_weekly" */
export type Share_Price_Change_Stats_Weekly_Sum_Order_By = {
  change_count?: InputMaybe<Order_By>;
  curve_id?: InputMaybe<Order_By>;
  difference?: InputMaybe<Order_By>;
  first_share_price?: InputMaybe<Order_By>;
  last_share_price?: InputMaybe<Order_By>;
};

/** order by var_pop() on columns of table "share_price_change_stats_weekly" */
export type Share_Price_Change_Stats_Weekly_Var_Pop_Order_By = {
  change_count?: InputMaybe<Order_By>;
  curve_id?: InputMaybe<Order_By>;
  difference?: InputMaybe<Order_By>;
  first_share_price?: InputMaybe<Order_By>;
  last_share_price?: InputMaybe<Order_By>;
};

/** order by var_samp() on columns of table "share_price_change_stats_weekly" */
export type Share_Price_Change_Stats_Weekly_Var_Samp_Order_By = {
  change_count?: InputMaybe<Order_By>;
  curve_id?: InputMaybe<Order_By>;
  difference?: InputMaybe<Order_By>;
  first_share_price?: InputMaybe<Order_By>;
  last_share_price?: InputMaybe<Order_By>;
};

/** order by variance() on columns of table "share_price_change_stats_weekly" */
export type Share_Price_Change_Stats_Weekly_Variance_Order_By = {
  change_count?: InputMaybe<Order_By>;
  curve_id?: InputMaybe<Order_By>;
  difference?: InputMaybe<Order_By>;
  first_share_price?: InputMaybe<Order_By>;
  last_share_price?: InputMaybe<Order_By>;
};

/** TimescaleDB hypertable tracking vault share price changes over time for historical analysis. */
export type Share_Price_Changes = {
  __typename?: 'share_price_changes';
  /** Block number when price changed. */
  block_number: Scalars['numeric']['output'];
  /** Block timestamp in Unix epoch seconds. */
  block_timestamp: Scalars['bigint']['output'];
  /** Bonding curve ID of the vault. */
  curve_id: Scalars['numeric']['output'];
  /** Auto-incrementing primary key. */
  id: Scalars['bigint']['output'];
  /** Log index within the transaction. */
  log_index: Scalars['bigint']['output'];
  /** Share price at this point in time, in wei. */
  share_price: Scalars['numeric']['output'];
  /** An object relationship */
  term?: Maybe<Terms>;
  /** Term ID of the vault. */
  term_id: Scalars['String']['output'];
  /** Total assets in vault at this point, in wei. */
  total_assets: Scalars['numeric']['output'];
  /** Total shares in vault at this point. */
  total_shares: Scalars['numeric']['output'];
  /** Transaction hash that caused the price change. */
  transaction_hash: Scalars['String']['output'];
  /** Timestamp when this record was created (TimescaleDB partition column). */
  updated_at: Scalars['timestamptz']['output'];
  /** An object relationship */
  vault?: Maybe<Vaults>;
  /** Type of vault (Atom, Triple, CounterTriple). */
  vault_type: Scalars['vault_type']['output'];
};

/** aggregated selection of "share_price_change" */
export type Share_Price_Changes_Aggregate = {
  __typename?: 'share_price_changes_aggregate';
  aggregate?: Maybe<Share_Price_Changes_Aggregate_Fields>;
  nodes: Array<Share_Price_Changes>;
};

export type Share_Price_Changes_Aggregate_Bool_Exp = {
  count?: InputMaybe<Share_Price_Changes_Aggregate_Bool_Exp_Count>;
};

export type Share_Price_Changes_Aggregate_Bool_Exp_Count = {
  arguments?: InputMaybe<Array<Share_Price_Changes_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
  filter?: InputMaybe<Share_Price_Changes_Bool_Exp>;
  predicate: Int_Comparison_Exp;
};

/** aggregate fields of "share_price_change" */
export type Share_Price_Changes_Aggregate_Fields = {
  __typename?: 'share_price_changes_aggregate_fields';
  avg?: Maybe<Share_Price_Changes_Avg_Fields>;
  count: Scalars['Int']['output'];
  max?: Maybe<Share_Price_Changes_Max_Fields>;
  min?: Maybe<Share_Price_Changes_Min_Fields>;
  stddev?: Maybe<Share_Price_Changes_Stddev_Fields>;
  stddev_pop?: Maybe<Share_Price_Changes_Stddev_Pop_Fields>;
  stddev_samp?: Maybe<Share_Price_Changes_Stddev_Samp_Fields>;
  sum?: Maybe<Share_Price_Changes_Sum_Fields>;
  var_pop?: Maybe<Share_Price_Changes_Var_Pop_Fields>;
  var_samp?: Maybe<Share_Price_Changes_Var_Samp_Fields>;
  variance?: Maybe<Share_Price_Changes_Variance_Fields>;
};


/** aggregate fields of "share_price_change" */
export type Share_Price_Changes_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Share_Price_Changes_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
};

/** order by aggregate values of table "share_price_change" */
export type Share_Price_Changes_Aggregate_Order_By = {
  avg?: InputMaybe<Share_Price_Changes_Avg_Order_By>;
  count?: InputMaybe<Order_By>;
  max?: InputMaybe<Share_Price_Changes_Max_Order_By>;
  min?: InputMaybe<Share_Price_Changes_Min_Order_By>;
  stddev?: InputMaybe<Share_Price_Changes_Stddev_Order_By>;
  stddev_pop?: InputMaybe<Share_Price_Changes_Stddev_Pop_Order_By>;
  stddev_samp?: InputMaybe<Share_Price_Changes_Stddev_Samp_Order_By>;
  sum?: InputMaybe<Share_Price_Changes_Sum_Order_By>;
  var_pop?: InputMaybe<Share_Price_Changes_Var_Pop_Order_By>;
  var_samp?: InputMaybe<Share_Price_Changes_Var_Samp_Order_By>;
  variance?: InputMaybe<Share_Price_Changes_Variance_Order_By>;
};

/** aggregate avg on columns */
export type Share_Price_Changes_Avg_Fields = {
  __typename?: 'share_price_changes_avg_fields';
  /** Block number when price changed. */
  block_number?: Maybe<Scalars['Float']['output']>;
  /** Block timestamp in Unix epoch seconds. */
  block_timestamp?: Maybe<Scalars['Float']['output']>;
  /** Bonding curve ID of the vault. */
  curve_id?: Maybe<Scalars['Float']['output']>;
  /** Auto-incrementing primary key. */
  id?: Maybe<Scalars['Float']['output']>;
  /** Log index within the transaction. */
  log_index?: Maybe<Scalars['Float']['output']>;
  /** Share price at this point in time, in wei. */
  share_price?: Maybe<Scalars['Float']['output']>;
  /** Total assets in vault at this point, in wei. */
  total_assets?: Maybe<Scalars['Float']['output']>;
  /** Total shares in vault at this point. */
  total_shares?: Maybe<Scalars['Float']['output']>;
};

/** order by avg() on columns of table "share_price_change" */
export type Share_Price_Changes_Avg_Order_By = {
  /** Block number when price changed. */
  block_number?: InputMaybe<Order_By>;
  /** Block timestamp in Unix epoch seconds. */
  block_timestamp?: InputMaybe<Order_By>;
  /** Bonding curve ID of the vault. */
  curve_id?: InputMaybe<Order_By>;
  /** Auto-incrementing primary key. */
  id?: InputMaybe<Order_By>;
  /** Log index within the transaction. */
  log_index?: InputMaybe<Order_By>;
  /** Share price at this point in time, in wei. */
  share_price?: InputMaybe<Order_By>;
  /** Total assets in vault at this point, in wei. */
  total_assets?: InputMaybe<Order_By>;
  /** Total shares in vault at this point. */
  total_shares?: InputMaybe<Order_By>;
};

/** Boolean expression to filter rows from the table "share_price_change". All fields are combined with a logical 'AND'. */
export type Share_Price_Changes_Bool_Exp = {
  _and?: InputMaybe<Array<Share_Price_Changes_Bool_Exp>>;
  _not?: InputMaybe<Share_Price_Changes_Bool_Exp>;
  _or?: InputMaybe<Array<Share_Price_Changes_Bool_Exp>>;
  block_number?: InputMaybe<Numeric_Comparison_Exp>;
  block_timestamp?: InputMaybe<Bigint_Comparison_Exp>;
  curve_id?: InputMaybe<Numeric_Comparison_Exp>;
  id?: InputMaybe<Bigint_Comparison_Exp>;
  log_index?: InputMaybe<Bigint_Comparison_Exp>;
  share_price?: InputMaybe<Numeric_Comparison_Exp>;
  term?: InputMaybe<Terms_Bool_Exp>;
  term_id?: InputMaybe<String_Comparison_Exp>;
  total_assets?: InputMaybe<Numeric_Comparison_Exp>;
  total_shares?: InputMaybe<Numeric_Comparison_Exp>;
  transaction_hash?: InputMaybe<String_Comparison_Exp>;
  updated_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  vault?: InputMaybe<Vaults_Bool_Exp>;
  vault_type?: InputMaybe<Vault_Type_Comparison_Exp>;
};

/** aggregate max on columns */
export type Share_Price_Changes_Max_Fields = {
  __typename?: 'share_price_changes_max_fields';
  /** Block number when price changed. */
  block_number?: Maybe<Scalars['numeric']['output']>;
  /** Block timestamp in Unix epoch seconds. */
  block_timestamp?: Maybe<Scalars['bigint']['output']>;
  /** Bonding curve ID of the vault. */
  curve_id?: Maybe<Scalars['numeric']['output']>;
  /** Auto-incrementing primary key. */
  id?: Maybe<Scalars['bigint']['output']>;
  /** Log index within the transaction. */
  log_index?: Maybe<Scalars['bigint']['output']>;
  /** Share price at this point in time, in wei. */
  share_price?: Maybe<Scalars['numeric']['output']>;
  /** Term ID of the vault. */
  term_id?: Maybe<Scalars['String']['output']>;
  /** Total assets in vault at this point, in wei. */
  total_assets?: Maybe<Scalars['numeric']['output']>;
  /** Total shares in vault at this point. */
  total_shares?: Maybe<Scalars['numeric']['output']>;
  /** Transaction hash that caused the price change. */
  transaction_hash?: Maybe<Scalars['String']['output']>;
  /** Timestamp when this record was created (TimescaleDB partition column). */
  updated_at?: Maybe<Scalars['timestamptz']['output']>;
  /** Type of vault (Atom, Triple, CounterTriple). */
  vault_type?: Maybe<Scalars['vault_type']['output']>;
};

/** order by max() on columns of table "share_price_change" */
export type Share_Price_Changes_Max_Order_By = {
  /** Block number when price changed. */
  block_number?: InputMaybe<Order_By>;
  /** Block timestamp in Unix epoch seconds. */
  block_timestamp?: InputMaybe<Order_By>;
  /** Bonding curve ID of the vault. */
  curve_id?: InputMaybe<Order_By>;
  /** Auto-incrementing primary key. */
  id?: InputMaybe<Order_By>;
  /** Log index within the transaction. */
  log_index?: InputMaybe<Order_By>;
  /** Share price at this point in time, in wei. */
  share_price?: InputMaybe<Order_By>;
  /** Term ID of the vault. */
  term_id?: InputMaybe<Order_By>;
  /** Total assets in vault at this point, in wei. */
  total_assets?: InputMaybe<Order_By>;
  /** Total shares in vault at this point. */
  total_shares?: InputMaybe<Order_By>;
  /** Transaction hash that caused the price change. */
  transaction_hash?: InputMaybe<Order_By>;
  /** Timestamp when this record was created (TimescaleDB partition column). */
  updated_at?: InputMaybe<Order_By>;
  /** Type of vault (Atom, Triple, CounterTriple). */
  vault_type?: InputMaybe<Order_By>;
};

/** aggregate min on columns */
export type Share_Price_Changes_Min_Fields = {
  __typename?: 'share_price_changes_min_fields';
  /** Block number when price changed. */
  block_number?: Maybe<Scalars['numeric']['output']>;
  /** Block timestamp in Unix epoch seconds. */
  block_timestamp?: Maybe<Scalars['bigint']['output']>;
  /** Bonding curve ID of the vault. */
  curve_id?: Maybe<Scalars['numeric']['output']>;
  /** Auto-incrementing primary key. */
  id?: Maybe<Scalars['bigint']['output']>;
  /** Log index within the transaction. */
  log_index?: Maybe<Scalars['bigint']['output']>;
  /** Share price at this point in time, in wei. */
  share_price?: Maybe<Scalars['numeric']['output']>;
  /** Term ID of the vault. */
  term_id?: Maybe<Scalars['String']['output']>;
  /** Total assets in vault at this point, in wei. */
  total_assets?: Maybe<Scalars['numeric']['output']>;
  /** Total shares in vault at this point. */
  total_shares?: Maybe<Scalars['numeric']['output']>;
  /** Transaction hash that caused the price change. */
  transaction_hash?: Maybe<Scalars['String']['output']>;
  /** Timestamp when this record was created (TimescaleDB partition column). */
  updated_at?: Maybe<Scalars['timestamptz']['output']>;
  /** Type of vault (Atom, Triple, CounterTriple). */
  vault_type?: Maybe<Scalars['vault_type']['output']>;
};

/** order by min() on columns of table "share_price_change" */
export type Share_Price_Changes_Min_Order_By = {
  /** Block number when price changed. */
  block_number?: InputMaybe<Order_By>;
  /** Block timestamp in Unix epoch seconds. */
  block_timestamp?: InputMaybe<Order_By>;
  /** Bonding curve ID of the vault. */
  curve_id?: InputMaybe<Order_By>;
  /** Auto-incrementing primary key. */
  id?: InputMaybe<Order_By>;
  /** Log index within the transaction. */
  log_index?: InputMaybe<Order_By>;
  /** Share price at this point in time, in wei. */
  share_price?: InputMaybe<Order_By>;
  /** Term ID of the vault. */
  term_id?: InputMaybe<Order_By>;
  /** Total assets in vault at this point, in wei. */
  total_assets?: InputMaybe<Order_By>;
  /** Total shares in vault at this point. */
  total_shares?: InputMaybe<Order_By>;
  /** Transaction hash that caused the price change. */
  transaction_hash?: InputMaybe<Order_By>;
  /** Timestamp when this record was created (TimescaleDB partition column). */
  updated_at?: InputMaybe<Order_By>;
  /** Type of vault (Atom, Triple, CounterTriple). */
  vault_type?: InputMaybe<Order_By>;
};

/** Ordering options when selecting data from "share_price_change". */
export type Share_Price_Changes_Order_By = {
  block_number?: InputMaybe<Order_By>;
  block_timestamp?: InputMaybe<Order_By>;
  curve_id?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  log_index?: InputMaybe<Order_By>;
  share_price?: InputMaybe<Order_By>;
  term?: InputMaybe<Terms_Order_By>;
  term_id?: InputMaybe<Order_By>;
  total_assets?: InputMaybe<Order_By>;
  total_shares?: InputMaybe<Order_By>;
  transaction_hash?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
  vault?: InputMaybe<Vaults_Order_By>;
  vault_type?: InputMaybe<Order_By>;
};

/** select columns of table "share_price_change" */
export type Share_Price_Changes_Select_Column =
  /** column name */
  | 'block_number'
  /** column name */
  | 'block_timestamp'
  /** column name */
  | 'curve_id'
  /** column name */
  | 'id'
  /** column name */
  | 'log_index'
  /** column name */
  | 'share_price'
  /** column name */
  | 'term_id'
  /** column name */
  | 'total_assets'
  /** column name */
  | 'total_shares'
  /** column name */
  | 'transaction_hash'
  /** column name */
  | 'updated_at'
  /** column name */
  | 'vault_type';

/** aggregate stddev on columns */
export type Share_Price_Changes_Stddev_Fields = {
  __typename?: 'share_price_changes_stddev_fields';
  /** Block number when price changed. */
  block_number?: Maybe<Scalars['Float']['output']>;
  /** Block timestamp in Unix epoch seconds. */
  block_timestamp?: Maybe<Scalars['Float']['output']>;
  /** Bonding curve ID of the vault. */
  curve_id?: Maybe<Scalars['Float']['output']>;
  /** Auto-incrementing primary key. */
  id?: Maybe<Scalars['Float']['output']>;
  /** Log index within the transaction. */
  log_index?: Maybe<Scalars['Float']['output']>;
  /** Share price at this point in time, in wei. */
  share_price?: Maybe<Scalars['Float']['output']>;
  /** Total assets in vault at this point, in wei. */
  total_assets?: Maybe<Scalars['Float']['output']>;
  /** Total shares in vault at this point. */
  total_shares?: Maybe<Scalars['Float']['output']>;
};

/** order by stddev() on columns of table "share_price_change" */
export type Share_Price_Changes_Stddev_Order_By = {
  /** Block number when price changed. */
  block_number?: InputMaybe<Order_By>;
  /** Block timestamp in Unix epoch seconds. */
  block_timestamp?: InputMaybe<Order_By>;
  /** Bonding curve ID of the vault. */
  curve_id?: InputMaybe<Order_By>;
  /** Auto-incrementing primary key. */
  id?: InputMaybe<Order_By>;
  /** Log index within the transaction. */
  log_index?: InputMaybe<Order_By>;
  /** Share price at this point in time, in wei. */
  share_price?: InputMaybe<Order_By>;
  /** Total assets in vault at this point, in wei. */
  total_assets?: InputMaybe<Order_By>;
  /** Total shares in vault at this point. */
  total_shares?: InputMaybe<Order_By>;
};

/** aggregate stddev_pop on columns */
export type Share_Price_Changes_Stddev_Pop_Fields = {
  __typename?: 'share_price_changes_stddev_pop_fields';
  /** Block number when price changed. */
  block_number?: Maybe<Scalars['Float']['output']>;
  /** Block timestamp in Unix epoch seconds. */
  block_timestamp?: Maybe<Scalars['Float']['output']>;
  /** Bonding curve ID of the vault. */
  curve_id?: Maybe<Scalars['Float']['output']>;
  /** Auto-incrementing primary key. */
  id?: Maybe<Scalars['Float']['output']>;
  /** Log index within the transaction. */
  log_index?: Maybe<Scalars['Float']['output']>;
  /** Share price at this point in time, in wei. */
  share_price?: Maybe<Scalars['Float']['output']>;
  /** Total assets in vault at this point, in wei. */
  total_assets?: Maybe<Scalars['Float']['output']>;
  /** Total shares in vault at this point. */
  total_shares?: Maybe<Scalars['Float']['output']>;
};

/** order by stddev_pop() on columns of table "share_price_change" */
export type Share_Price_Changes_Stddev_Pop_Order_By = {
  /** Block number when price changed. */
  block_number?: InputMaybe<Order_By>;
  /** Block timestamp in Unix epoch seconds. */
  block_timestamp?: InputMaybe<Order_By>;
  /** Bonding curve ID of the vault. */
  curve_id?: InputMaybe<Order_By>;
  /** Auto-incrementing primary key. */
  id?: InputMaybe<Order_By>;
  /** Log index within the transaction. */
  log_index?: InputMaybe<Order_By>;
  /** Share price at this point in time, in wei. */
  share_price?: InputMaybe<Order_By>;
  /** Total assets in vault at this point, in wei. */
  total_assets?: InputMaybe<Order_By>;
  /** Total shares in vault at this point. */
  total_shares?: InputMaybe<Order_By>;
};

/** aggregate stddev_samp on columns */
export type Share_Price_Changes_Stddev_Samp_Fields = {
  __typename?: 'share_price_changes_stddev_samp_fields';
  /** Block number when price changed. */
  block_number?: Maybe<Scalars['Float']['output']>;
  /** Block timestamp in Unix epoch seconds. */
  block_timestamp?: Maybe<Scalars['Float']['output']>;
  /** Bonding curve ID of the vault. */
  curve_id?: Maybe<Scalars['Float']['output']>;
  /** Auto-incrementing primary key. */
  id?: Maybe<Scalars['Float']['output']>;
  /** Log index within the transaction. */
  log_index?: Maybe<Scalars['Float']['output']>;
  /** Share price at this point in time, in wei. */
  share_price?: Maybe<Scalars['Float']['output']>;
  /** Total assets in vault at this point, in wei. */
  total_assets?: Maybe<Scalars['Float']['output']>;
  /** Total shares in vault at this point. */
  total_shares?: Maybe<Scalars['Float']['output']>;
};

/** order by stddev_samp() on columns of table "share_price_change" */
export type Share_Price_Changes_Stddev_Samp_Order_By = {
  /** Block number when price changed. */
  block_number?: InputMaybe<Order_By>;
  /** Block timestamp in Unix epoch seconds. */
  block_timestamp?: InputMaybe<Order_By>;
  /** Bonding curve ID of the vault. */
  curve_id?: InputMaybe<Order_By>;
  /** Auto-incrementing primary key. */
  id?: InputMaybe<Order_By>;
  /** Log index within the transaction. */
  log_index?: InputMaybe<Order_By>;
  /** Share price at this point in time, in wei. */
  share_price?: InputMaybe<Order_By>;
  /** Total assets in vault at this point, in wei. */
  total_assets?: InputMaybe<Order_By>;
  /** Total shares in vault at this point. */
  total_shares?: InputMaybe<Order_By>;
};

/** Streaming cursor of the table "share_price_changes" */
export type Share_Price_Changes_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Share_Price_Changes_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Share_Price_Changes_Stream_Cursor_Value_Input = {
  /** Block number when price changed. */
  block_number?: InputMaybe<Scalars['numeric']['input']>;
  /** Block timestamp in Unix epoch seconds. */
  block_timestamp?: InputMaybe<Scalars['bigint']['input']>;
  /** Bonding curve ID of the vault. */
  curve_id?: InputMaybe<Scalars['numeric']['input']>;
  /** Auto-incrementing primary key. */
  id?: InputMaybe<Scalars['bigint']['input']>;
  /** Log index within the transaction. */
  log_index?: InputMaybe<Scalars['bigint']['input']>;
  /** Share price at this point in time, in wei. */
  share_price?: InputMaybe<Scalars['numeric']['input']>;
  /** Term ID of the vault. */
  term_id?: InputMaybe<Scalars['String']['input']>;
  /** Total assets in vault at this point, in wei. */
  total_assets?: InputMaybe<Scalars['numeric']['input']>;
  /** Total shares in vault at this point. */
  total_shares?: InputMaybe<Scalars['numeric']['input']>;
  /** Transaction hash that caused the price change. */
  transaction_hash?: InputMaybe<Scalars['String']['input']>;
  /** Timestamp when this record was created (TimescaleDB partition column). */
  updated_at?: InputMaybe<Scalars['timestamptz']['input']>;
  /** Type of vault (Atom, Triple, CounterTriple). */
  vault_type?: InputMaybe<Scalars['vault_type']['input']>;
};

/** aggregate sum on columns */
export type Share_Price_Changes_Sum_Fields = {
  __typename?: 'share_price_changes_sum_fields';
  /** Block number when price changed. */
  block_number?: Maybe<Scalars['numeric']['output']>;
  /** Block timestamp in Unix epoch seconds. */
  block_timestamp?: Maybe<Scalars['bigint']['output']>;
  /** Bonding curve ID of the vault. */
  curve_id?: Maybe<Scalars['numeric']['output']>;
  /** Auto-incrementing primary key. */
  id?: Maybe<Scalars['bigint']['output']>;
  /** Log index within the transaction. */
  log_index?: Maybe<Scalars['bigint']['output']>;
  /** Share price at this point in time, in wei. */
  share_price?: Maybe<Scalars['numeric']['output']>;
  /** Total assets in vault at this point, in wei. */
  total_assets?: Maybe<Scalars['numeric']['output']>;
  /** Total shares in vault at this point. */
  total_shares?: Maybe<Scalars['numeric']['output']>;
};

/** order by sum() on columns of table "share_price_change" */
export type Share_Price_Changes_Sum_Order_By = {
  /** Block number when price changed. */
  block_number?: InputMaybe<Order_By>;
  /** Block timestamp in Unix epoch seconds. */
  block_timestamp?: InputMaybe<Order_By>;
  /** Bonding curve ID of the vault. */
  curve_id?: InputMaybe<Order_By>;
  /** Auto-incrementing primary key. */
  id?: InputMaybe<Order_By>;
  /** Log index within the transaction. */
  log_index?: InputMaybe<Order_By>;
  /** Share price at this point in time, in wei. */
  share_price?: InputMaybe<Order_By>;
  /** Total assets in vault at this point, in wei. */
  total_assets?: InputMaybe<Order_By>;
  /** Total shares in vault at this point. */
  total_shares?: InputMaybe<Order_By>;
};

/** aggregate var_pop on columns */
export type Share_Price_Changes_Var_Pop_Fields = {
  __typename?: 'share_price_changes_var_pop_fields';
  /** Block number when price changed. */
  block_number?: Maybe<Scalars['Float']['output']>;
  /** Block timestamp in Unix epoch seconds. */
  block_timestamp?: Maybe<Scalars['Float']['output']>;
  /** Bonding curve ID of the vault. */
  curve_id?: Maybe<Scalars['Float']['output']>;
  /** Auto-incrementing primary key. */
  id?: Maybe<Scalars['Float']['output']>;
  /** Log index within the transaction. */
  log_index?: Maybe<Scalars['Float']['output']>;
  /** Share price at this point in time, in wei. */
  share_price?: Maybe<Scalars['Float']['output']>;
  /** Total assets in vault at this point, in wei. */
  total_assets?: Maybe<Scalars['Float']['output']>;
  /** Total shares in vault at this point. */
  total_shares?: Maybe<Scalars['Float']['output']>;
};

/** order by var_pop() on columns of table "share_price_change" */
export type Share_Price_Changes_Var_Pop_Order_By = {
  /** Block number when price changed. */
  block_number?: InputMaybe<Order_By>;
  /** Block timestamp in Unix epoch seconds. */
  block_timestamp?: InputMaybe<Order_By>;
  /** Bonding curve ID of the vault. */
  curve_id?: InputMaybe<Order_By>;
  /** Auto-incrementing primary key. */
  id?: InputMaybe<Order_By>;
  /** Log index within the transaction. */
  log_index?: InputMaybe<Order_By>;
  /** Share price at this point in time, in wei. */
  share_price?: InputMaybe<Order_By>;
  /** Total assets in vault at this point, in wei. */
  total_assets?: InputMaybe<Order_By>;
  /** Total shares in vault at this point. */
  total_shares?: InputMaybe<Order_By>;
};

/** aggregate var_samp on columns */
export type Share_Price_Changes_Var_Samp_Fields = {
  __typename?: 'share_price_changes_var_samp_fields';
  /** Block number when price changed. */
  block_number?: Maybe<Scalars['Float']['output']>;
  /** Block timestamp in Unix epoch seconds. */
  block_timestamp?: Maybe<Scalars['Float']['output']>;
  /** Bonding curve ID of the vault. */
  curve_id?: Maybe<Scalars['Float']['output']>;
  /** Auto-incrementing primary key. */
  id?: Maybe<Scalars['Float']['output']>;
  /** Log index within the transaction. */
  log_index?: Maybe<Scalars['Float']['output']>;
  /** Share price at this point in time, in wei. */
  share_price?: Maybe<Scalars['Float']['output']>;
  /** Total assets in vault at this point, in wei. */
  total_assets?: Maybe<Scalars['Float']['output']>;
  /** Total shares in vault at this point. */
  total_shares?: Maybe<Scalars['Float']['output']>;
};

/** order by var_samp() on columns of table "share_price_change" */
export type Share_Price_Changes_Var_Samp_Order_By = {
  /** Block number when price changed. */
  block_number?: InputMaybe<Order_By>;
  /** Block timestamp in Unix epoch seconds. */
  block_timestamp?: InputMaybe<Order_By>;
  /** Bonding curve ID of the vault. */
  curve_id?: InputMaybe<Order_By>;
  /** Auto-incrementing primary key. */
  id?: InputMaybe<Order_By>;
  /** Log index within the transaction. */
  log_index?: InputMaybe<Order_By>;
  /** Share price at this point in time, in wei. */
  share_price?: InputMaybe<Order_By>;
  /** Total assets in vault at this point, in wei. */
  total_assets?: InputMaybe<Order_By>;
  /** Total shares in vault at this point. */
  total_shares?: InputMaybe<Order_By>;
};

/** aggregate variance on columns */
export type Share_Price_Changes_Variance_Fields = {
  __typename?: 'share_price_changes_variance_fields';
  /** Block number when price changed. */
  block_number?: Maybe<Scalars['Float']['output']>;
  /** Block timestamp in Unix epoch seconds. */
  block_timestamp?: Maybe<Scalars['Float']['output']>;
  /** Bonding curve ID of the vault. */
  curve_id?: Maybe<Scalars['Float']['output']>;
  /** Auto-incrementing primary key. */
  id?: Maybe<Scalars['Float']['output']>;
  /** Log index within the transaction. */
  log_index?: Maybe<Scalars['Float']['output']>;
  /** Share price at this point in time, in wei. */
  share_price?: Maybe<Scalars['Float']['output']>;
  /** Total assets in vault at this point, in wei. */
  total_assets?: Maybe<Scalars['Float']['output']>;
  /** Total shares in vault at this point. */
  total_shares?: Maybe<Scalars['Float']['output']>;
};

/** order by variance() on columns of table "share_price_change" */
export type Share_Price_Changes_Variance_Order_By = {
  /** Block number when price changed. */
  block_number?: InputMaybe<Order_By>;
  /** Block timestamp in Unix epoch seconds. */
  block_timestamp?: InputMaybe<Order_By>;
  /** Bonding curve ID of the vault. */
  curve_id?: InputMaybe<Order_By>;
  /** Auto-incrementing primary key. */
  id?: InputMaybe<Order_By>;
  /** Log index within the transaction. */
  log_index?: InputMaybe<Order_By>;
  /** Share price at this point in time, in wei. */
  share_price?: InputMaybe<Order_By>;
  /** Total assets in vault at this point, in wei. */
  total_assets?: InputMaybe<Order_By>;
  /** Total shares in vault at this point. */
  total_shares?: InputMaybe<Order_By>;
};

/** Daily aggregation of signal volume and count rolled up from hourly stats. */
export type Signal_Stats_Daily = {
  __typename?: 'signal_stats_daily';
  bucket?: Maybe<Scalars['timestamptz']['output']>;
  count?: Maybe<Scalars['numeric']['output']>;
  curve_id?: Maybe<Scalars['numeric']['output']>;
  /** An object relationship */
  term?: Maybe<Terms>;
  term_id?: Maybe<Scalars['String']['output']>;
  volume?: Maybe<Scalars['numeric']['output']>;
};

/** Boolean expression to filter rows from the table "signal_stats_daily". All fields are combined with a logical 'AND'. */
export type Signal_Stats_Daily_Bool_Exp = {
  _and?: InputMaybe<Array<Signal_Stats_Daily_Bool_Exp>>;
  _not?: InputMaybe<Signal_Stats_Daily_Bool_Exp>;
  _or?: InputMaybe<Array<Signal_Stats_Daily_Bool_Exp>>;
  bucket?: InputMaybe<Timestamptz_Comparison_Exp>;
  count?: InputMaybe<Numeric_Comparison_Exp>;
  curve_id?: InputMaybe<Numeric_Comparison_Exp>;
  term?: InputMaybe<Terms_Bool_Exp>;
  term_id?: InputMaybe<String_Comparison_Exp>;
  volume?: InputMaybe<Numeric_Comparison_Exp>;
};

/** Ordering options when selecting data from "signal_stats_daily". */
export type Signal_Stats_Daily_Order_By = {
  bucket?: InputMaybe<Order_By>;
  count?: InputMaybe<Order_By>;
  curve_id?: InputMaybe<Order_By>;
  term?: InputMaybe<Terms_Order_By>;
  term_id?: InputMaybe<Order_By>;
  volume?: InputMaybe<Order_By>;
};

/** select columns of table "signal_stats_daily" */
export type Signal_Stats_Daily_Select_Column =
  /** column name */
  | 'bucket'
  /** column name */
  | 'count'
  /** column name */
  | 'curve_id'
  /** column name */
  | 'term_id'
  /** column name */
  | 'volume';

/** Streaming cursor of the table "signal_stats_daily" */
export type Signal_Stats_Daily_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Signal_Stats_Daily_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Signal_Stats_Daily_Stream_Cursor_Value_Input = {
  bucket?: InputMaybe<Scalars['timestamptz']['input']>;
  count?: InputMaybe<Scalars['numeric']['input']>;
  curve_id?: InputMaybe<Scalars['numeric']['input']>;
  term_id?: InputMaybe<Scalars['String']['input']>;
  volume?: InputMaybe<Scalars['numeric']['input']>;
};

/** Hourly aggregation of signal volume and count per term and curve using TimescaleDB continuous aggregates. */
export type Signal_Stats_Hourly = {
  __typename?: 'signal_stats_hourly';
  bucket?: Maybe<Scalars['timestamptz']['output']>;
  count?: Maybe<Scalars['bigint']['output']>;
  curve_id?: Maybe<Scalars['numeric']['output']>;
  /** An object relationship */
  term?: Maybe<Terms>;
  term_id?: Maybe<Scalars['String']['output']>;
  volume?: Maybe<Scalars['numeric']['output']>;
};

/** Boolean expression to filter rows from the table "signal_stats_hourly". All fields are combined with a logical 'AND'. */
export type Signal_Stats_Hourly_Bool_Exp = {
  _and?: InputMaybe<Array<Signal_Stats_Hourly_Bool_Exp>>;
  _not?: InputMaybe<Signal_Stats_Hourly_Bool_Exp>;
  _or?: InputMaybe<Array<Signal_Stats_Hourly_Bool_Exp>>;
  bucket?: InputMaybe<Timestamptz_Comparison_Exp>;
  count?: InputMaybe<Bigint_Comparison_Exp>;
  curve_id?: InputMaybe<Numeric_Comparison_Exp>;
  term?: InputMaybe<Terms_Bool_Exp>;
  term_id?: InputMaybe<String_Comparison_Exp>;
  volume?: InputMaybe<Numeric_Comparison_Exp>;
};

/** Ordering options when selecting data from "signal_stats_hourly". */
export type Signal_Stats_Hourly_Order_By = {
  bucket?: InputMaybe<Order_By>;
  count?: InputMaybe<Order_By>;
  curve_id?: InputMaybe<Order_By>;
  term?: InputMaybe<Terms_Order_By>;
  term_id?: InputMaybe<Order_By>;
  volume?: InputMaybe<Order_By>;
};

/** select columns of table "signal_stats_hourly" */
export type Signal_Stats_Hourly_Select_Column =
  /** column name */
  | 'bucket'
  /** column name */
  | 'count'
  /** column name */
  | 'curve_id'
  /** column name */
  | 'term_id'
  /** column name */
  | 'volume';

/** Streaming cursor of the table "signal_stats_hourly" */
export type Signal_Stats_Hourly_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Signal_Stats_Hourly_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Signal_Stats_Hourly_Stream_Cursor_Value_Input = {
  bucket?: InputMaybe<Scalars['timestamptz']['input']>;
  count?: InputMaybe<Scalars['bigint']['input']>;
  curve_id?: InputMaybe<Scalars['numeric']['input']>;
  term_id?: InputMaybe<Scalars['String']['input']>;
  volume?: InputMaybe<Scalars['numeric']['input']>;
};

/** Monthly aggregation of signal volume and count rolled up from daily stats. */
export type Signal_Stats_Monthly = {
  __typename?: 'signal_stats_monthly';
  bucket?: Maybe<Scalars['timestamptz']['output']>;
  count?: Maybe<Scalars['numeric']['output']>;
  curve_id?: Maybe<Scalars['numeric']['output']>;
  /** An object relationship */
  term?: Maybe<Terms>;
  term_id?: Maybe<Scalars['String']['output']>;
  volume?: Maybe<Scalars['numeric']['output']>;
};

/** Boolean expression to filter rows from the table "signal_stats_monthly". All fields are combined with a logical 'AND'. */
export type Signal_Stats_Monthly_Bool_Exp = {
  _and?: InputMaybe<Array<Signal_Stats_Monthly_Bool_Exp>>;
  _not?: InputMaybe<Signal_Stats_Monthly_Bool_Exp>;
  _or?: InputMaybe<Array<Signal_Stats_Monthly_Bool_Exp>>;
  bucket?: InputMaybe<Timestamptz_Comparison_Exp>;
  count?: InputMaybe<Numeric_Comparison_Exp>;
  curve_id?: InputMaybe<Numeric_Comparison_Exp>;
  term?: InputMaybe<Terms_Bool_Exp>;
  term_id?: InputMaybe<String_Comparison_Exp>;
  volume?: InputMaybe<Numeric_Comparison_Exp>;
};

/** Ordering options when selecting data from "signal_stats_monthly". */
export type Signal_Stats_Monthly_Order_By = {
  bucket?: InputMaybe<Order_By>;
  count?: InputMaybe<Order_By>;
  curve_id?: InputMaybe<Order_By>;
  term?: InputMaybe<Terms_Order_By>;
  term_id?: InputMaybe<Order_By>;
  volume?: InputMaybe<Order_By>;
};

/** select columns of table "signal_stats_monthly" */
export type Signal_Stats_Monthly_Select_Column =
  /** column name */
  | 'bucket'
  /** column name */
  | 'count'
  /** column name */
  | 'curve_id'
  /** column name */
  | 'term_id'
  /** column name */
  | 'volume';

/** Streaming cursor of the table "signal_stats_monthly" */
export type Signal_Stats_Monthly_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Signal_Stats_Monthly_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Signal_Stats_Monthly_Stream_Cursor_Value_Input = {
  bucket?: InputMaybe<Scalars['timestamptz']['input']>;
  count?: InputMaybe<Scalars['numeric']['input']>;
  curve_id?: InputMaybe<Scalars['numeric']['input']>;
  term_id?: InputMaybe<Scalars['String']['input']>;
  volume?: InputMaybe<Scalars['numeric']['input']>;
};

/** Weekly aggregation of signal volume and count rolled up from daily stats. */
export type Signal_Stats_Weekly = {
  __typename?: 'signal_stats_weekly';
  bucket?: Maybe<Scalars['timestamptz']['output']>;
  count?: Maybe<Scalars['numeric']['output']>;
  curve_id?: Maybe<Scalars['numeric']['output']>;
  /** An object relationship */
  term?: Maybe<Terms>;
  term_id?: Maybe<Scalars['String']['output']>;
  volume?: Maybe<Scalars['numeric']['output']>;
};

/** Boolean expression to filter rows from the table "signal_stats_weekly". All fields are combined with a logical 'AND'. */
export type Signal_Stats_Weekly_Bool_Exp = {
  _and?: InputMaybe<Array<Signal_Stats_Weekly_Bool_Exp>>;
  _not?: InputMaybe<Signal_Stats_Weekly_Bool_Exp>;
  _or?: InputMaybe<Array<Signal_Stats_Weekly_Bool_Exp>>;
  bucket?: InputMaybe<Timestamptz_Comparison_Exp>;
  count?: InputMaybe<Numeric_Comparison_Exp>;
  curve_id?: InputMaybe<Numeric_Comparison_Exp>;
  term?: InputMaybe<Terms_Bool_Exp>;
  term_id?: InputMaybe<String_Comparison_Exp>;
  volume?: InputMaybe<Numeric_Comparison_Exp>;
};

/** Ordering options when selecting data from "signal_stats_weekly". */
export type Signal_Stats_Weekly_Order_By = {
  bucket?: InputMaybe<Order_By>;
  count?: InputMaybe<Order_By>;
  curve_id?: InputMaybe<Order_By>;
  term?: InputMaybe<Terms_Order_By>;
  term_id?: InputMaybe<Order_By>;
  volume?: InputMaybe<Order_By>;
};

/** select columns of table "signal_stats_weekly" */
export type Signal_Stats_Weekly_Select_Column =
  /** column name */
  | 'bucket'
  /** column name */
  | 'count'
  /** column name */
  | 'curve_id'
  /** column name */
  | 'term_id'
  /** column name */
  | 'volume';

/** Streaming cursor of the table "signal_stats_weekly" */
export type Signal_Stats_Weekly_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Signal_Stats_Weekly_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Signal_Stats_Weekly_Stream_Cursor_Value_Input = {
  bucket?: InputMaybe<Scalars['timestamptz']['input']>;
  count?: InputMaybe<Scalars['numeric']['input']>;
  curve_id?: InputMaybe<Scalars['numeric']['input']>;
  term_id?: InputMaybe<Scalars['String']['input']>;
  volume?: InputMaybe<Scalars['numeric']['input']>;
};

/** TimescaleDB hypertable tracking deposit and redemption events over time for analytics and charting. */
export type Signals = {
  __typename?: 'signals';
  /** An object relationship */
  account?: Maybe<Accounts>;
  /** Account that created this signal. */
  account_id: Scalars['String']['output'];
  /** Atom ID if signal is for an atom vault. */
  atom_id?: Maybe<Scalars['String']['output']>;
  /** Block number when signal occurred. */
  block_number: Scalars['numeric']['output'];
  /** Timestamp when signal occurred (TimescaleDB partition column). */
  created_at: Scalars['timestamptz']['output'];
  /** Bonding curve ID of the vault. */
  curve_id: Scalars['numeric']['output'];
  /** Change in assets (positive for deposits, negative for redemptions), in wei. */
  delta: Scalars['numeric']['output'];
  /** An object relationship */
  deposit?: Maybe<Deposits>;
  /** Reference to deposit if this is a deposit signal. */
  deposit_id?: Maybe<Scalars['String']['output']>;
  /** Unique identifier for this signal event. */
  id: Scalars['String']['output'];
  /** An object relationship */
  redemption?: Maybe<Redemptions>;
  /** Reference to redemption if this is a redemption signal. */
  redemption_id?: Maybe<Scalars['String']['output']>;
  /** An object relationship */
  term?: Maybe<Terms>;
  /** Term ID of the vault for this signal. */
  term_id: Scalars['String']['output'];
  /** Transaction hash of the signal event. */
  transaction_hash: Scalars['String']['output'];
  /** Triple ID if signal is for a triple vault. */
  triple_id?: Maybe<Scalars['String']['output']>;
  /** An object relationship */
  vault?: Maybe<Vaults>;
};

/** aggregated selection of "signal" */
export type Signals_Aggregate = {
  __typename?: 'signals_aggregate';
  aggregate?: Maybe<Signals_Aggregate_Fields>;
  nodes: Array<Signals>;
};

export type Signals_Aggregate_Bool_Exp = {
  count?: InputMaybe<Signals_Aggregate_Bool_Exp_Count>;
};

export type Signals_Aggregate_Bool_Exp_Count = {
  arguments?: InputMaybe<Array<Signals_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
  filter?: InputMaybe<Signals_Bool_Exp>;
  predicate: Int_Comparison_Exp;
};

/** aggregate fields of "signal" */
export type Signals_Aggregate_Fields = {
  __typename?: 'signals_aggregate_fields';
  avg?: Maybe<Signals_Avg_Fields>;
  count: Scalars['Int']['output'];
  max?: Maybe<Signals_Max_Fields>;
  min?: Maybe<Signals_Min_Fields>;
  stddev?: Maybe<Signals_Stddev_Fields>;
  stddev_pop?: Maybe<Signals_Stddev_Pop_Fields>;
  stddev_samp?: Maybe<Signals_Stddev_Samp_Fields>;
  sum?: Maybe<Signals_Sum_Fields>;
  var_pop?: Maybe<Signals_Var_Pop_Fields>;
  var_samp?: Maybe<Signals_Var_Samp_Fields>;
  variance?: Maybe<Signals_Variance_Fields>;
};


/** aggregate fields of "signal" */
export type Signals_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Signals_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
};

/** order by aggregate values of table "signal" */
export type Signals_Aggregate_Order_By = {
  avg?: InputMaybe<Signals_Avg_Order_By>;
  count?: InputMaybe<Order_By>;
  max?: InputMaybe<Signals_Max_Order_By>;
  min?: InputMaybe<Signals_Min_Order_By>;
  stddev?: InputMaybe<Signals_Stddev_Order_By>;
  stddev_pop?: InputMaybe<Signals_Stddev_Pop_Order_By>;
  stddev_samp?: InputMaybe<Signals_Stddev_Samp_Order_By>;
  sum?: InputMaybe<Signals_Sum_Order_By>;
  var_pop?: InputMaybe<Signals_Var_Pop_Order_By>;
  var_samp?: InputMaybe<Signals_Var_Samp_Order_By>;
  variance?: InputMaybe<Signals_Variance_Order_By>;
};

/** aggregate avg on columns */
export type Signals_Avg_Fields = {
  __typename?: 'signals_avg_fields';
  /** Block number when signal occurred. */
  block_number?: Maybe<Scalars['Float']['output']>;
  /** Bonding curve ID of the vault. */
  curve_id?: Maybe<Scalars['Float']['output']>;
  /** Change in assets (positive for deposits, negative for redemptions), in wei. */
  delta?: Maybe<Scalars['Float']['output']>;
};

/** order by avg() on columns of table "signal" */
export type Signals_Avg_Order_By = {
  /** Block number when signal occurred. */
  block_number?: InputMaybe<Order_By>;
  /** Bonding curve ID of the vault. */
  curve_id?: InputMaybe<Order_By>;
  /** Change in assets (positive for deposits, negative for redemptions), in wei. */
  delta?: InputMaybe<Order_By>;
};

/** Boolean expression to filter rows from the table "signal". All fields are combined with a logical 'AND'. */
export type Signals_Bool_Exp = {
  _and?: InputMaybe<Array<Signals_Bool_Exp>>;
  _not?: InputMaybe<Signals_Bool_Exp>;
  _or?: InputMaybe<Array<Signals_Bool_Exp>>;
  account?: InputMaybe<Accounts_Bool_Exp>;
  account_id?: InputMaybe<String_Comparison_Exp>;
  atom_id?: InputMaybe<String_Comparison_Exp>;
  block_number?: InputMaybe<Numeric_Comparison_Exp>;
  created_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  curve_id?: InputMaybe<Numeric_Comparison_Exp>;
  delta?: InputMaybe<Numeric_Comparison_Exp>;
  deposit?: InputMaybe<Deposits_Bool_Exp>;
  deposit_id?: InputMaybe<String_Comparison_Exp>;
  id?: InputMaybe<String_Comparison_Exp>;
  redemption?: InputMaybe<Redemptions_Bool_Exp>;
  redemption_id?: InputMaybe<String_Comparison_Exp>;
  term?: InputMaybe<Terms_Bool_Exp>;
  term_id?: InputMaybe<String_Comparison_Exp>;
  transaction_hash?: InputMaybe<String_Comparison_Exp>;
  triple_id?: InputMaybe<String_Comparison_Exp>;
  vault?: InputMaybe<Vaults_Bool_Exp>;
};

export type Signals_From_Following_Args = {
  address?: InputMaybe<Scalars['String']['input']>;
};

/** aggregate max on columns */
export type Signals_Max_Fields = {
  __typename?: 'signals_max_fields';
  /** Account that created this signal. */
  account_id?: Maybe<Scalars['String']['output']>;
  /** Atom ID if signal is for an atom vault. */
  atom_id?: Maybe<Scalars['String']['output']>;
  /** Block number when signal occurred. */
  block_number?: Maybe<Scalars['numeric']['output']>;
  /** Timestamp when signal occurred (TimescaleDB partition column). */
  created_at?: Maybe<Scalars['timestamptz']['output']>;
  /** Bonding curve ID of the vault. */
  curve_id?: Maybe<Scalars['numeric']['output']>;
  /** Change in assets (positive for deposits, negative for redemptions), in wei. */
  delta?: Maybe<Scalars['numeric']['output']>;
  /** Reference to deposit if this is a deposit signal. */
  deposit_id?: Maybe<Scalars['String']['output']>;
  /** Unique identifier for this signal event. */
  id?: Maybe<Scalars['String']['output']>;
  /** Reference to redemption if this is a redemption signal. */
  redemption_id?: Maybe<Scalars['String']['output']>;
  /** Term ID of the vault for this signal. */
  term_id?: Maybe<Scalars['String']['output']>;
  /** Transaction hash of the signal event. */
  transaction_hash?: Maybe<Scalars['String']['output']>;
  /** Triple ID if signal is for a triple vault. */
  triple_id?: Maybe<Scalars['String']['output']>;
};

/** order by max() on columns of table "signal" */
export type Signals_Max_Order_By = {
  /** Account that created this signal. */
  account_id?: InputMaybe<Order_By>;
  /** Atom ID if signal is for an atom vault. */
  atom_id?: InputMaybe<Order_By>;
  /** Block number when signal occurred. */
  block_number?: InputMaybe<Order_By>;
  /** Timestamp when signal occurred (TimescaleDB partition column). */
  created_at?: InputMaybe<Order_By>;
  /** Bonding curve ID of the vault. */
  curve_id?: InputMaybe<Order_By>;
  /** Change in assets (positive for deposits, negative for redemptions), in wei. */
  delta?: InputMaybe<Order_By>;
  /** Reference to deposit if this is a deposit signal. */
  deposit_id?: InputMaybe<Order_By>;
  /** Unique identifier for this signal event. */
  id?: InputMaybe<Order_By>;
  /** Reference to redemption if this is a redemption signal. */
  redemption_id?: InputMaybe<Order_By>;
  /** Term ID of the vault for this signal. */
  term_id?: InputMaybe<Order_By>;
  /** Transaction hash of the signal event. */
  transaction_hash?: InputMaybe<Order_By>;
  /** Triple ID if signal is for a triple vault. */
  triple_id?: InputMaybe<Order_By>;
};

/** aggregate min on columns */
export type Signals_Min_Fields = {
  __typename?: 'signals_min_fields';
  /** Account that created this signal. */
  account_id?: Maybe<Scalars['String']['output']>;
  /** Atom ID if signal is for an atom vault. */
  atom_id?: Maybe<Scalars['String']['output']>;
  /** Block number when signal occurred. */
  block_number?: Maybe<Scalars['numeric']['output']>;
  /** Timestamp when signal occurred (TimescaleDB partition column). */
  created_at?: Maybe<Scalars['timestamptz']['output']>;
  /** Bonding curve ID of the vault. */
  curve_id?: Maybe<Scalars['numeric']['output']>;
  /** Change in assets (positive for deposits, negative for redemptions), in wei. */
  delta?: Maybe<Scalars['numeric']['output']>;
  /** Reference to deposit if this is a deposit signal. */
  deposit_id?: Maybe<Scalars['String']['output']>;
  /** Unique identifier for this signal event. */
  id?: Maybe<Scalars['String']['output']>;
  /** Reference to redemption if this is a redemption signal. */
  redemption_id?: Maybe<Scalars['String']['output']>;
  /** Term ID of the vault for this signal. */
  term_id?: Maybe<Scalars['String']['output']>;
  /** Transaction hash of the signal event. */
  transaction_hash?: Maybe<Scalars['String']['output']>;
  /** Triple ID if signal is for a triple vault. */
  triple_id?: Maybe<Scalars['String']['output']>;
};

/** order by min() on columns of table "signal" */
export type Signals_Min_Order_By = {
  /** Account that created this signal. */
  account_id?: InputMaybe<Order_By>;
  /** Atom ID if signal is for an atom vault. */
  atom_id?: InputMaybe<Order_By>;
  /** Block number when signal occurred. */
  block_number?: InputMaybe<Order_By>;
  /** Timestamp when signal occurred (TimescaleDB partition column). */
  created_at?: InputMaybe<Order_By>;
  /** Bonding curve ID of the vault. */
  curve_id?: InputMaybe<Order_By>;
  /** Change in assets (positive for deposits, negative for redemptions), in wei. */
  delta?: InputMaybe<Order_By>;
  /** Reference to deposit if this is a deposit signal. */
  deposit_id?: InputMaybe<Order_By>;
  /** Unique identifier for this signal event. */
  id?: InputMaybe<Order_By>;
  /** Reference to redemption if this is a redemption signal. */
  redemption_id?: InputMaybe<Order_By>;
  /** Term ID of the vault for this signal. */
  term_id?: InputMaybe<Order_By>;
  /** Transaction hash of the signal event. */
  transaction_hash?: InputMaybe<Order_By>;
  /** Triple ID if signal is for a triple vault. */
  triple_id?: InputMaybe<Order_By>;
};

/** Ordering options when selecting data from "signal". */
export type Signals_Order_By = {
  account?: InputMaybe<Accounts_Order_By>;
  account_id?: InputMaybe<Order_By>;
  atom_id?: InputMaybe<Order_By>;
  block_number?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  curve_id?: InputMaybe<Order_By>;
  delta?: InputMaybe<Order_By>;
  deposit?: InputMaybe<Deposits_Order_By>;
  deposit_id?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  redemption?: InputMaybe<Redemptions_Order_By>;
  redemption_id?: InputMaybe<Order_By>;
  term?: InputMaybe<Terms_Order_By>;
  term_id?: InputMaybe<Order_By>;
  transaction_hash?: InputMaybe<Order_By>;
  triple_id?: InputMaybe<Order_By>;
  vault?: InputMaybe<Vaults_Order_By>;
};

/** select columns of table "signal" */
export type Signals_Select_Column =
  /** column name */
  | 'account_id'
  /** column name */
  | 'atom_id'
  /** column name */
  | 'block_number'
  /** column name */
  | 'created_at'
  /** column name */
  | 'curve_id'
  /** column name */
  | 'delta'
  /** column name */
  | 'deposit_id'
  /** column name */
  | 'id'
  /** column name */
  | 'redemption_id'
  /** column name */
  | 'term_id'
  /** column name */
  | 'transaction_hash'
  /** column name */
  | 'triple_id';

/** aggregate stddev on columns */
export type Signals_Stddev_Fields = {
  __typename?: 'signals_stddev_fields';
  /** Block number when signal occurred. */
  block_number?: Maybe<Scalars['Float']['output']>;
  /** Bonding curve ID of the vault. */
  curve_id?: Maybe<Scalars['Float']['output']>;
  /** Change in assets (positive for deposits, negative for redemptions), in wei. */
  delta?: Maybe<Scalars['Float']['output']>;
};

/** order by stddev() on columns of table "signal" */
export type Signals_Stddev_Order_By = {
  /** Block number when signal occurred. */
  block_number?: InputMaybe<Order_By>;
  /** Bonding curve ID of the vault. */
  curve_id?: InputMaybe<Order_By>;
  /** Change in assets (positive for deposits, negative for redemptions), in wei. */
  delta?: InputMaybe<Order_By>;
};

/** aggregate stddev_pop on columns */
export type Signals_Stddev_Pop_Fields = {
  __typename?: 'signals_stddev_pop_fields';
  /** Block number when signal occurred. */
  block_number?: Maybe<Scalars['Float']['output']>;
  /** Bonding curve ID of the vault. */
  curve_id?: Maybe<Scalars['Float']['output']>;
  /** Change in assets (positive for deposits, negative for redemptions), in wei. */
  delta?: Maybe<Scalars['Float']['output']>;
};

/** order by stddev_pop() on columns of table "signal" */
export type Signals_Stddev_Pop_Order_By = {
  /** Block number when signal occurred. */
  block_number?: InputMaybe<Order_By>;
  /** Bonding curve ID of the vault. */
  curve_id?: InputMaybe<Order_By>;
  /** Change in assets (positive for deposits, negative for redemptions), in wei. */
  delta?: InputMaybe<Order_By>;
};

/** aggregate stddev_samp on columns */
export type Signals_Stddev_Samp_Fields = {
  __typename?: 'signals_stddev_samp_fields';
  /** Block number when signal occurred. */
  block_number?: Maybe<Scalars['Float']['output']>;
  /** Bonding curve ID of the vault. */
  curve_id?: Maybe<Scalars['Float']['output']>;
  /** Change in assets (positive for deposits, negative for redemptions), in wei. */
  delta?: Maybe<Scalars['Float']['output']>;
};

/** order by stddev_samp() on columns of table "signal" */
export type Signals_Stddev_Samp_Order_By = {
  /** Block number when signal occurred. */
  block_number?: InputMaybe<Order_By>;
  /** Bonding curve ID of the vault. */
  curve_id?: InputMaybe<Order_By>;
  /** Change in assets (positive for deposits, negative for redemptions), in wei. */
  delta?: InputMaybe<Order_By>;
};

/** Streaming cursor of the table "signals" */
export type Signals_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Signals_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Signals_Stream_Cursor_Value_Input = {
  /** Account that created this signal. */
  account_id?: InputMaybe<Scalars['String']['input']>;
  /** Atom ID if signal is for an atom vault. */
  atom_id?: InputMaybe<Scalars['String']['input']>;
  /** Block number when signal occurred. */
  block_number?: InputMaybe<Scalars['numeric']['input']>;
  /** Timestamp when signal occurred (TimescaleDB partition column). */
  created_at?: InputMaybe<Scalars['timestamptz']['input']>;
  /** Bonding curve ID of the vault. */
  curve_id?: InputMaybe<Scalars['numeric']['input']>;
  /** Change in assets (positive for deposits, negative for redemptions), in wei. */
  delta?: InputMaybe<Scalars['numeric']['input']>;
  /** Reference to deposit if this is a deposit signal. */
  deposit_id?: InputMaybe<Scalars['String']['input']>;
  /** Unique identifier for this signal event. */
  id?: InputMaybe<Scalars['String']['input']>;
  /** Reference to redemption if this is a redemption signal. */
  redemption_id?: InputMaybe<Scalars['String']['input']>;
  /** Term ID of the vault for this signal. */
  term_id?: InputMaybe<Scalars['String']['input']>;
  /** Transaction hash of the signal event. */
  transaction_hash?: InputMaybe<Scalars['String']['input']>;
  /** Triple ID if signal is for a triple vault. */
  triple_id?: InputMaybe<Scalars['String']['input']>;
};

/** aggregate sum on columns */
export type Signals_Sum_Fields = {
  __typename?: 'signals_sum_fields';
  /** Block number when signal occurred. */
  block_number?: Maybe<Scalars['numeric']['output']>;
  /** Bonding curve ID of the vault. */
  curve_id?: Maybe<Scalars['numeric']['output']>;
  /** Change in assets (positive for deposits, negative for redemptions), in wei. */
  delta?: Maybe<Scalars['numeric']['output']>;
};

/** order by sum() on columns of table "signal" */
export type Signals_Sum_Order_By = {
  /** Block number when signal occurred. */
  block_number?: InputMaybe<Order_By>;
  /** Bonding curve ID of the vault. */
  curve_id?: InputMaybe<Order_By>;
  /** Change in assets (positive for deposits, negative for redemptions), in wei. */
  delta?: InputMaybe<Order_By>;
};

/** aggregate var_pop on columns */
export type Signals_Var_Pop_Fields = {
  __typename?: 'signals_var_pop_fields';
  /** Block number when signal occurred. */
  block_number?: Maybe<Scalars['Float']['output']>;
  /** Bonding curve ID of the vault. */
  curve_id?: Maybe<Scalars['Float']['output']>;
  /** Change in assets (positive for deposits, negative for redemptions), in wei. */
  delta?: Maybe<Scalars['Float']['output']>;
};

/** order by var_pop() on columns of table "signal" */
export type Signals_Var_Pop_Order_By = {
  /** Block number when signal occurred. */
  block_number?: InputMaybe<Order_By>;
  /** Bonding curve ID of the vault. */
  curve_id?: InputMaybe<Order_By>;
  /** Change in assets (positive for deposits, negative for redemptions), in wei. */
  delta?: InputMaybe<Order_By>;
};

/** aggregate var_samp on columns */
export type Signals_Var_Samp_Fields = {
  __typename?: 'signals_var_samp_fields';
  /** Block number when signal occurred. */
  block_number?: Maybe<Scalars['Float']['output']>;
  /** Bonding curve ID of the vault. */
  curve_id?: Maybe<Scalars['Float']['output']>;
  /** Change in assets (positive for deposits, negative for redemptions), in wei. */
  delta?: Maybe<Scalars['Float']['output']>;
};

/** order by var_samp() on columns of table "signal" */
export type Signals_Var_Samp_Order_By = {
  /** Block number when signal occurred. */
  block_number?: InputMaybe<Order_By>;
  /** Bonding curve ID of the vault. */
  curve_id?: InputMaybe<Order_By>;
  /** Change in assets (positive for deposits, negative for redemptions), in wei. */
  delta?: InputMaybe<Order_By>;
};

/** aggregate variance on columns */
export type Signals_Variance_Fields = {
  __typename?: 'signals_variance_fields';
  /** Block number when signal occurred. */
  block_number?: Maybe<Scalars['Float']['output']>;
  /** Bonding curve ID of the vault. */
  curve_id?: Maybe<Scalars['Float']['output']>;
  /** Change in assets (positive for deposits, negative for redemptions), in wei. */
  delta?: Maybe<Scalars['Float']['output']>;
};

/** order by variance() on columns of table "signal" */
export type Signals_Variance_Order_By = {
  /** Block number when signal occurred. */
  block_number?: InputMaybe<Order_By>;
  /** Bonding curve ID of the vault. */
  curve_id?: InputMaybe<Order_By>;
  /** Change in assets (positive for deposits, negative for redemptions), in wei. */
  delta?: InputMaybe<Order_By>;
};

/** Hourly snapshots of protocol statistics for historical tracking and analytics. */
export type StatHours = {
  __typename?: 'statHours';
  /** Snapshot of contract balance at this hour. */
  contract_balance?: Maybe<Scalars['numeric']['output']>;
  /** Timestamp when this snapshot was created. */
  created_at: Scalars['timestamptz']['output'];
  /** Auto-incrementing primary key. */
  id: Scalars['Int']['output'];
  /** Snapshot of total accounts at this hour. */
  total_accounts?: Maybe<Scalars['Int']['output']>;
  /** Snapshot of total atoms at this hour. */
  total_atoms?: Maybe<Scalars['Int']['output']>;
  /** Snapshot of cumulative fees at this hour. */
  total_fees?: Maybe<Scalars['numeric']['output']>;
  /** Snapshot of total positions at this hour. */
  total_positions?: Maybe<Scalars['Int']['output']>;
  /** Snapshot of total signals at this hour. */
  total_signals?: Maybe<Scalars['Int']['output']>;
  /** Snapshot of total triples at this hour. */
  total_triples?: Maybe<Scalars['Int']['output']>;
};

/** Boolean expression to filter rows from the table "stats_hour". All fields are combined with a logical 'AND'. */
export type StatHours_Bool_Exp = {
  _and?: InputMaybe<Array<StatHours_Bool_Exp>>;
  _not?: InputMaybe<StatHours_Bool_Exp>;
  _or?: InputMaybe<Array<StatHours_Bool_Exp>>;
  contract_balance?: InputMaybe<Numeric_Comparison_Exp>;
  created_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  id?: InputMaybe<Int_Comparison_Exp>;
  total_accounts?: InputMaybe<Int_Comparison_Exp>;
  total_atoms?: InputMaybe<Int_Comparison_Exp>;
  total_fees?: InputMaybe<Numeric_Comparison_Exp>;
  total_positions?: InputMaybe<Int_Comparison_Exp>;
  total_signals?: InputMaybe<Int_Comparison_Exp>;
  total_triples?: InputMaybe<Int_Comparison_Exp>;
};

/** Ordering options when selecting data from "stats_hour". */
export type StatHours_Order_By = {
  contract_balance?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  total_accounts?: InputMaybe<Order_By>;
  total_atoms?: InputMaybe<Order_By>;
  total_fees?: InputMaybe<Order_By>;
  total_positions?: InputMaybe<Order_By>;
  total_signals?: InputMaybe<Order_By>;
  total_triples?: InputMaybe<Order_By>;
};

/** select columns of table "stats_hour" */
export type StatHours_Select_Column =
  /** column name */
  | 'contract_balance'
  /** column name */
  | 'created_at'
  /** column name */
  | 'id'
  /** column name */
  | 'total_accounts'
  /** column name */
  | 'total_atoms'
  /** column name */
  | 'total_fees'
  /** column name */
  | 'total_positions'
  /** column name */
  | 'total_signals'
  /** column name */
  | 'total_triples';

/** Streaming cursor of the table "statHours" */
export type StatHours_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: StatHours_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type StatHours_Stream_Cursor_Value_Input = {
  /** Snapshot of contract balance at this hour. */
  contract_balance?: InputMaybe<Scalars['numeric']['input']>;
  /** Timestamp when this snapshot was created. */
  created_at?: InputMaybe<Scalars['timestamptz']['input']>;
  /** Auto-incrementing primary key. */
  id?: InputMaybe<Scalars['Int']['input']>;
  /** Snapshot of total accounts at this hour. */
  total_accounts?: InputMaybe<Scalars['Int']['input']>;
  /** Snapshot of total atoms at this hour. */
  total_atoms?: InputMaybe<Scalars['Int']['input']>;
  /** Snapshot of cumulative fees at this hour. */
  total_fees?: InputMaybe<Scalars['numeric']['input']>;
  /** Snapshot of total positions at this hour. */
  total_positions?: InputMaybe<Scalars['Int']['input']>;
  /** Snapshot of total signals at this hour. */
  total_signals?: InputMaybe<Scalars['Int']['input']>;
  /** Snapshot of total triples at this hour. */
  total_triples?: InputMaybe<Scalars['Int']['input']>;
};

/** Global protocol statistics aggregated from all events, updated via triggers. Single-row table (id=0). */
export type Stats = {
  __typename?: 'stats';
  /** Current total assets held in protocol vaults in wei. */
  contract_balance?: Maybe<Scalars['numeric']['output']>;
  /** Primary key, always 0 for singleton pattern. */
  id: Scalars['Int']['output'];
  /** Most recent block number indexed by the protocol. */
  last_processed_block_number?: Maybe<Scalars['numeric']['output']>;
  /** Timestamp of the most recent processed block. */
  last_processed_block_timestamp?: Maybe<Scalars['timestamptz']['output']>;
  /** Timestamp of last update to this stats record. */
  last_updated: Scalars['timestamptz']['output'];
  /** Total number of accounts created in the protocol. */
  total_accounts?: Maybe<Scalars['Int']['output']>;
  /** Total number of atoms created. */
  total_atoms?: Maybe<Scalars['Int']['output']>;
  /** Cumulative protocol fees collected in wei. */
  total_fees?: Maybe<Scalars['numeric']['output']>;
  /** Total number of active positions across all vaults. */
  total_positions?: Maybe<Scalars['Int']['output']>;
  /** Total number of signal events (deposits and redemptions). */
  total_signals?: Maybe<Scalars['Int']['output']>;
  /** Total number of triples created. */
  total_triples?: Maybe<Scalars['Int']['output']>;
};

/** aggregated selection of "stats" */
export type Stats_Aggregate = {
  __typename?: 'stats_aggregate';
  aggregate?: Maybe<Stats_Aggregate_Fields>;
  nodes: Array<Stats>;
};

/** aggregate fields of "stats" */
export type Stats_Aggregate_Fields = {
  __typename?: 'stats_aggregate_fields';
  avg?: Maybe<Stats_Avg_Fields>;
  count: Scalars['Int']['output'];
  max?: Maybe<Stats_Max_Fields>;
  min?: Maybe<Stats_Min_Fields>;
  stddev?: Maybe<Stats_Stddev_Fields>;
  stddev_pop?: Maybe<Stats_Stddev_Pop_Fields>;
  stddev_samp?: Maybe<Stats_Stddev_Samp_Fields>;
  sum?: Maybe<Stats_Sum_Fields>;
  var_pop?: Maybe<Stats_Var_Pop_Fields>;
  var_samp?: Maybe<Stats_Var_Samp_Fields>;
  variance?: Maybe<Stats_Variance_Fields>;
};


/** aggregate fields of "stats" */
export type Stats_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Stats_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
};

/** aggregate avg on columns */
export type Stats_Avg_Fields = {
  __typename?: 'stats_avg_fields';
  /** Current total assets held in protocol vaults in wei. */
  contract_balance?: Maybe<Scalars['Float']['output']>;
  /** Primary key, always 0 for singleton pattern. */
  id?: Maybe<Scalars['Float']['output']>;
  /** Most recent block number indexed by the protocol. */
  last_processed_block_number?: Maybe<Scalars['Float']['output']>;
  /** Total number of accounts created in the protocol. */
  total_accounts?: Maybe<Scalars['Float']['output']>;
  /** Total number of atoms created. */
  total_atoms?: Maybe<Scalars['Float']['output']>;
  /** Cumulative protocol fees collected in wei. */
  total_fees?: Maybe<Scalars['Float']['output']>;
  /** Total number of active positions across all vaults. */
  total_positions?: Maybe<Scalars['Float']['output']>;
  /** Total number of signal events (deposits and redemptions). */
  total_signals?: Maybe<Scalars['Float']['output']>;
  /** Total number of triples created. */
  total_triples?: Maybe<Scalars['Float']['output']>;
};

/** Boolean expression to filter rows from the table "stats". All fields are combined with a logical 'AND'. */
export type Stats_Bool_Exp = {
  _and?: InputMaybe<Array<Stats_Bool_Exp>>;
  _not?: InputMaybe<Stats_Bool_Exp>;
  _or?: InputMaybe<Array<Stats_Bool_Exp>>;
  contract_balance?: InputMaybe<Numeric_Comparison_Exp>;
  id?: InputMaybe<Int_Comparison_Exp>;
  last_processed_block_number?: InputMaybe<Numeric_Comparison_Exp>;
  last_processed_block_timestamp?: InputMaybe<Timestamptz_Comparison_Exp>;
  last_updated?: InputMaybe<Timestamptz_Comparison_Exp>;
  total_accounts?: InputMaybe<Int_Comparison_Exp>;
  total_atoms?: InputMaybe<Int_Comparison_Exp>;
  total_fees?: InputMaybe<Numeric_Comparison_Exp>;
  total_positions?: InputMaybe<Int_Comparison_Exp>;
  total_signals?: InputMaybe<Int_Comparison_Exp>;
  total_triples?: InputMaybe<Int_Comparison_Exp>;
};

/** aggregate max on columns */
export type Stats_Max_Fields = {
  __typename?: 'stats_max_fields';
  /** Current total assets held in protocol vaults in wei. */
  contract_balance?: Maybe<Scalars['numeric']['output']>;
  /** Primary key, always 0 for singleton pattern. */
  id?: Maybe<Scalars['Int']['output']>;
  /** Most recent block number indexed by the protocol. */
  last_processed_block_number?: Maybe<Scalars['numeric']['output']>;
  /** Timestamp of the most recent processed block. */
  last_processed_block_timestamp?: Maybe<Scalars['timestamptz']['output']>;
  /** Timestamp of last update to this stats record. */
  last_updated?: Maybe<Scalars['timestamptz']['output']>;
  /** Total number of accounts created in the protocol. */
  total_accounts?: Maybe<Scalars['Int']['output']>;
  /** Total number of atoms created. */
  total_atoms?: Maybe<Scalars['Int']['output']>;
  /** Cumulative protocol fees collected in wei. */
  total_fees?: Maybe<Scalars['numeric']['output']>;
  /** Total number of active positions across all vaults. */
  total_positions?: Maybe<Scalars['Int']['output']>;
  /** Total number of signal events (deposits and redemptions). */
  total_signals?: Maybe<Scalars['Int']['output']>;
  /** Total number of triples created. */
  total_triples?: Maybe<Scalars['Int']['output']>;
};

/** aggregate min on columns */
export type Stats_Min_Fields = {
  __typename?: 'stats_min_fields';
  /** Current total assets held in protocol vaults in wei. */
  contract_balance?: Maybe<Scalars['numeric']['output']>;
  /** Primary key, always 0 for singleton pattern. */
  id?: Maybe<Scalars['Int']['output']>;
  /** Most recent block number indexed by the protocol. */
  last_processed_block_number?: Maybe<Scalars['numeric']['output']>;
  /** Timestamp of the most recent processed block. */
  last_processed_block_timestamp?: Maybe<Scalars['timestamptz']['output']>;
  /** Timestamp of last update to this stats record. */
  last_updated?: Maybe<Scalars['timestamptz']['output']>;
  /** Total number of accounts created in the protocol. */
  total_accounts?: Maybe<Scalars['Int']['output']>;
  /** Total number of atoms created. */
  total_atoms?: Maybe<Scalars['Int']['output']>;
  /** Cumulative protocol fees collected in wei. */
  total_fees?: Maybe<Scalars['numeric']['output']>;
  /** Total number of active positions across all vaults. */
  total_positions?: Maybe<Scalars['Int']['output']>;
  /** Total number of signal events (deposits and redemptions). */
  total_signals?: Maybe<Scalars['Int']['output']>;
  /** Total number of triples created. */
  total_triples?: Maybe<Scalars['Int']['output']>;
};

/** Ordering options when selecting data from "stats". */
export type Stats_Order_By = {
  contract_balance?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  last_processed_block_number?: InputMaybe<Order_By>;
  last_processed_block_timestamp?: InputMaybe<Order_By>;
  last_updated?: InputMaybe<Order_By>;
  total_accounts?: InputMaybe<Order_By>;
  total_atoms?: InputMaybe<Order_By>;
  total_fees?: InputMaybe<Order_By>;
  total_positions?: InputMaybe<Order_By>;
  total_signals?: InputMaybe<Order_By>;
  total_triples?: InputMaybe<Order_By>;
};

/** select columns of table "stats" */
export type Stats_Select_Column =
  /** column name */
  | 'contract_balance'
  /** column name */
  | 'id'
  /** column name */
  | 'last_processed_block_number'
  /** column name */
  | 'last_processed_block_timestamp'
  /** column name */
  | 'last_updated'
  /** column name */
  | 'total_accounts'
  /** column name */
  | 'total_atoms'
  /** column name */
  | 'total_fees'
  /** column name */
  | 'total_positions'
  /** column name */
  | 'total_signals'
  /** column name */
  | 'total_triples';

/** aggregate stddev on columns */
export type Stats_Stddev_Fields = {
  __typename?: 'stats_stddev_fields';
  /** Current total assets held in protocol vaults in wei. */
  contract_balance?: Maybe<Scalars['Float']['output']>;
  /** Primary key, always 0 for singleton pattern. */
  id?: Maybe<Scalars['Float']['output']>;
  /** Most recent block number indexed by the protocol. */
  last_processed_block_number?: Maybe<Scalars['Float']['output']>;
  /** Total number of accounts created in the protocol. */
  total_accounts?: Maybe<Scalars['Float']['output']>;
  /** Total number of atoms created. */
  total_atoms?: Maybe<Scalars['Float']['output']>;
  /** Cumulative protocol fees collected in wei. */
  total_fees?: Maybe<Scalars['Float']['output']>;
  /** Total number of active positions across all vaults. */
  total_positions?: Maybe<Scalars['Float']['output']>;
  /** Total number of signal events (deposits and redemptions). */
  total_signals?: Maybe<Scalars['Float']['output']>;
  /** Total number of triples created. */
  total_triples?: Maybe<Scalars['Float']['output']>;
};

/** aggregate stddev_pop on columns */
export type Stats_Stddev_Pop_Fields = {
  __typename?: 'stats_stddev_pop_fields';
  /** Current total assets held in protocol vaults in wei. */
  contract_balance?: Maybe<Scalars['Float']['output']>;
  /** Primary key, always 0 for singleton pattern. */
  id?: Maybe<Scalars['Float']['output']>;
  /** Most recent block number indexed by the protocol. */
  last_processed_block_number?: Maybe<Scalars['Float']['output']>;
  /** Total number of accounts created in the protocol. */
  total_accounts?: Maybe<Scalars['Float']['output']>;
  /** Total number of atoms created. */
  total_atoms?: Maybe<Scalars['Float']['output']>;
  /** Cumulative protocol fees collected in wei. */
  total_fees?: Maybe<Scalars['Float']['output']>;
  /** Total number of active positions across all vaults. */
  total_positions?: Maybe<Scalars['Float']['output']>;
  /** Total number of signal events (deposits and redemptions). */
  total_signals?: Maybe<Scalars['Float']['output']>;
  /** Total number of triples created. */
  total_triples?: Maybe<Scalars['Float']['output']>;
};

/** aggregate stddev_samp on columns */
export type Stats_Stddev_Samp_Fields = {
  __typename?: 'stats_stddev_samp_fields';
  /** Current total assets held in protocol vaults in wei. */
  contract_balance?: Maybe<Scalars['Float']['output']>;
  /** Primary key, always 0 for singleton pattern. */
  id?: Maybe<Scalars['Float']['output']>;
  /** Most recent block number indexed by the protocol. */
  last_processed_block_number?: Maybe<Scalars['Float']['output']>;
  /** Total number of accounts created in the protocol. */
  total_accounts?: Maybe<Scalars['Float']['output']>;
  /** Total number of atoms created. */
  total_atoms?: Maybe<Scalars['Float']['output']>;
  /** Cumulative protocol fees collected in wei. */
  total_fees?: Maybe<Scalars['Float']['output']>;
  /** Total number of active positions across all vaults. */
  total_positions?: Maybe<Scalars['Float']['output']>;
  /** Total number of signal events (deposits and redemptions). */
  total_signals?: Maybe<Scalars['Float']['output']>;
  /** Total number of triples created. */
  total_triples?: Maybe<Scalars['Float']['output']>;
};

/** Streaming cursor of the table "stats" */
export type Stats_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Stats_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Stats_Stream_Cursor_Value_Input = {
  /** Current total assets held in protocol vaults in wei. */
  contract_balance?: InputMaybe<Scalars['numeric']['input']>;
  /** Primary key, always 0 for singleton pattern. */
  id?: InputMaybe<Scalars['Int']['input']>;
  /** Most recent block number indexed by the protocol. */
  last_processed_block_number?: InputMaybe<Scalars['numeric']['input']>;
  /** Timestamp of the most recent processed block. */
  last_processed_block_timestamp?: InputMaybe<Scalars['timestamptz']['input']>;
  /** Timestamp of last update to this stats record. */
  last_updated?: InputMaybe<Scalars['timestamptz']['input']>;
  /** Total number of accounts created in the protocol. */
  total_accounts?: InputMaybe<Scalars['Int']['input']>;
  /** Total number of atoms created. */
  total_atoms?: InputMaybe<Scalars['Int']['input']>;
  /** Cumulative protocol fees collected in wei. */
  total_fees?: InputMaybe<Scalars['numeric']['input']>;
  /** Total number of active positions across all vaults. */
  total_positions?: InputMaybe<Scalars['Int']['input']>;
  /** Total number of signal events (deposits and redemptions). */
  total_signals?: InputMaybe<Scalars['Int']['input']>;
  /** Total number of triples created. */
  total_triples?: InputMaybe<Scalars['Int']['input']>;
};

/** aggregate sum on columns */
export type Stats_Sum_Fields = {
  __typename?: 'stats_sum_fields';
  /** Current total assets held in protocol vaults in wei. */
  contract_balance?: Maybe<Scalars['numeric']['output']>;
  /** Primary key, always 0 for singleton pattern. */
  id?: Maybe<Scalars['Int']['output']>;
  /** Most recent block number indexed by the protocol. */
  last_processed_block_number?: Maybe<Scalars['numeric']['output']>;
  /** Total number of accounts created in the protocol. */
  total_accounts?: Maybe<Scalars['Int']['output']>;
  /** Total number of atoms created. */
  total_atoms?: Maybe<Scalars['Int']['output']>;
  /** Cumulative protocol fees collected in wei. */
  total_fees?: Maybe<Scalars['numeric']['output']>;
  /** Total number of active positions across all vaults. */
  total_positions?: Maybe<Scalars['Int']['output']>;
  /** Total number of signal events (deposits and redemptions). */
  total_signals?: Maybe<Scalars['Int']['output']>;
  /** Total number of triples created. */
  total_triples?: Maybe<Scalars['Int']['output']>;
};

/** aggregate var_pop on columns */
export type Stats_Var_Pop_Fields = {
  __typename?: 'stats_var_pop_fields';
  /** Current total assets held in protocol vaults in wei. */
  contract_balance?: Maybe<Scalars['Float']['output']>;
  /** Primary key, always 0 for singleton pattern. */
  id?: Maybe<Scalars['Float']['output']>;
  /** Most recent block number indexed by the protocol. */
  last_processed_block_number?: Maybe<Scalars['Float']['output']>;
  /** Total number of accounts created in the protocol. */
  total_accounts?: Maybe<Scalars['Float']['output']>;
  /** Total number of atoms created. */
  total_atoms?: Maybe<Scalars['Float']['output']>;
  /** Cumulative protocol fees collected in wei. */
  total_fees?: Maybe<Scalars['Float']['output']>;
  /** Total number of active positions across all vaults. */
  total_positions?: Maybe<Scalars['Float']['output']>;
  /** Total number of signal events (deposits and redemptions). */
  total_signals?: Maybe<Scalars['Float']['output']>;
  /** Total number of triples created. */
  total_triples?: Maybe<Scalars['Float']['output']>;
};

/** aggregate var_samp on columns */
export type Stats_Var_Samp_Fields = {
  __typename?: 'stats_var_samp_fields';
  /** Current total assets held in protocol vaults in wei. */
  contract_balance?: Maybe<Scalars['Float']['output']>;
  /** Primary key, always 0 for singleton pattern. */
  id?: Maybe<Scalars['Float']['output']>;
  /** Most recent block number indexed by the protocol. */
  last_processed_block_number?: Maybe<Scalars['Float']['output']>;
  /** Total number of accounts created in the protocol. */
  total_accounts?: Maybe<Scalars['Float']['output']>;
  /** Total number of atoms created. */
  total_atoms?: Maybe<Scalars['Float']['output']>;
  /** Cumulative protocol fees collected in wei. */
  total_fees?: Maybe<Scalars['Float']['output']>;
  /** Total number of active positions across all vaults. */
  total_positions?: Maybe<Scalars['Float']['output']>;
  /** Total number of signal events (deposits and redemptions). */
  total_signals?: Maybe<Scalars['Float']['output']>;
  /** Total number of triples created. */
  total_triples?: Maybe<Scalars['Float']['output']>;
};

/** aggregate variance on columns */
export type Stats_Variance_Fields = {
  __typename?: 'stats_variance_fields';
  /** Current total assets held in protocol vaults in wei. */
  contract_balance?: Maybe<Scalars['Float']['output']>;
  /** Primary key, always 0 for singleton pattern. */
  id?: Maybe<Scalars['Float']['output']>;
  /** Most recent block number indexed by the protocol. */
  last_processed_block_number?: Maybe<Scalars['Float']['output']>;
  /** Total number of accounts created in the protocol. */
  total_accounts?: Maybe<Scalars['Float']['output']>;
  /** Total number of atoms created. */
  total_atoms?: Maybe<Scalars['Float']['output']>;
  /** Cumulative protocol fees collected in wei. */
  total_fees?: Maybe<Scalars['Float']['output']>;
  /** Total number of active positions across all vaults. */
  total_positions?: Maybe<Scalars['Float']['output']>;
  /** Total number of signal events (deposits and redemptions). */
  total_signals?: Maybe<Scalars['Float']['output']>;
  /** Total number of triples created. */
  total_triples?: Maybe<Scalars['Float']['output']>;
};

/** Denormalized aggregate of triples grouped by (subject, predicate) for efficient querying. */
export type Subject_Predicates = {
  __typename?: 'subject_predicates';
  opposer_count: Scalars['bigint']['output'];
  /** An object relationship */
  predicate?: Maybe<Atoms>;
  /** Predicate atom ID. */
  predicate_id: Scalars['String']['output'];
  /** An object relationship */
  subject?: Maybe<Atoms>;
  /** Subject atom ID. */
  subject_id: Scalars['String']['output'];
  supporter_count: Scalars['bigint']['output'];
  /** Total market cap across all triples with this combination, in wei. */
  total_market_cap: Scalars['numeric']['output'];
  /** Total positions across all triples with this combination. */
  total_position_count: Scalars['Int']['output'];
  /** Number of triples with this (subject, predicate) combination. */
  triple_count: Scalars['Int']['output'];
  /** An array relationship */
  triples: Array<Triples>;
  /** An aggregate relationship */
  triples_aggregate: Triples_Aggregate;
};


/** Denormalized aggregate of triples grouped by (subject, predicate) for efficient querying. */
export type Subject_PredicatesTriplesArgs = {
  distinct_on?: InputMaybe<Array<Triples_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Triples_Order_By>>;
  where?: InputMaybe<Triples_Bool_Exp>;
};


/** Denormalized aggregate of triples grouped by (subject, predicate) for efficient querying. */
export type Subject_PredicatesTriples_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Triples_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Triples_Order_By>>;
  where?: InputMaybe<Triples_Bool_Exp>;
};

/** aggregated selection of "subject_predicate" */
export type Subject_Predicates_Aggregate = {
  __typename?: 'subject_predicates_aggregate';
  aggregate?: Maybe<Subject_Predicates_Aggregate_Fields>;
  nodes: Array<Subject_Predicates>;
};

/** aggregate fields of "subject_predicate" */
export type Subject_Predicates_Aggregate_Fields = {
  __typename?: 'subject_predicates_aggregate_fields';
  avg?: Maybe<Subject_Predicates_Avg_Fields>;
  count: Scalars['Int']['output'];
  max?: Maybe<Subject_Predicates_Max_Fields>;
  min?: Maybe<Subject_Predicates_Min_Fields>;
  stddev?: Maybe<Subject_Predicates_Stddev_Fields>;
  stddev_pop?: Maybe<Subject_Predicates_Stddev_Pop_Fields>;
  stddev_samp?: Maybe<Subject_Predicates_Stddev_Samp_Fields>;
  sum?: Maybe<Subject_Predicates_Sum_Fields>;
  var_pop?: Maybe<Subject_Predicates_Var_Pop_Fields>;
  var_samp?: Maybe<Subject_Predicates_Var_Samp_Fields>;
  variance?: Maybe<Subject_Predicates_Variance_Fields>;
};


/** aggregate fields of "subject_predicate" */
export type Subject_Predicates_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Subject_Predicates_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
};

/** aggregate avg on columns */
export type Subject_Predicates_Avg_Fields = {
  __typename?: 'subject_predicates_avg_fields';
  opposer_count?: Maybe<Scalars['Float']['output']>;
  supporter_count?: Maybe<Scalars['Float']['output']>;
  /** Total market cap across all triples with this combination, in wei. */
  total_market_cap?: Maybe<Scalars['Float']['output']>;
  /** Total positions across all triples with this combination. */
  total_position_count?: Maybe<Scalars['Float']['output']>;
  /** Number of triples with this (subject, predicate) combination. */
  triple_count?: Maybe<Scalars['Float']['output']>;
};

/** Boolean expression to filter rows from the table "subject_predicate". All fields are combined with a logical 'AND'. */
export type Subject_Predicates_Bool_Exp = {
  _and?: InputMaybe<Array<Subject_Predicates_Bool_Exp>>;
  _not?: InputMaybe<Subject_Predicates_Bool_Exp>;
  _or?: InputMaybe<Array<Subject_Predicates_Bool_Exp>>;
  opposer_count?: InputMaybe<Bigint_Comparison_Exp>;
  predicate?: InputMaybe<Atoms_Bool_Exp>;
  predicate_id?: InputMaybe<String_Comparison_Exp>;
  subject?: InputMaybe<Atoms_Bool_Exp>;
  subject_id?: InputMaybe<String_Comparison_Exp>;
  supporter_count?: InputMaybe<Bigint_Comparison_Exp>;
  total_market_cap?: InputMaybe<Numeric_Comparison_Exp>;
  total_position_count?: InputMaybe<Int_Comparison_Exp>;
  triple_count?: InputMaybe<Int_Comparison_Exp>;
  triples?: InputMaybe<Triples_Bool_Exp>;
  triples_aggregate?: InputMaybe<Triples_Aggregate_Bool_Exp>;
};

/** aggregate max on columns */
export type Subject_Predicates_Max_Fields = {
  __typename?: 'subject_predicates_max_fields';
  opposer_count?: Maybe<Scalars['bigint']['output']>;
  /** Predicate atom ID. */
  predicate_id?: Maybe<Scalars['String']['output']>;
  /** Subject atom ID. */
  subject_id?: Maybe<Scalars['String']['output']>;
  supporter_count?: Maybe<Scalars['bigint']['output']>;
  /** Total market cap across all triples with this combination, in wei. */
  total_market_cap?: Maybe<Scalars['numeric']['output']>;
  /** Total positions across all triples with this combination. */
  total_position_count?: Maybe<Scalars['Int']['output']>;
  /** Number of triples with this (subject, predicate) combination. */
  triple_count?: Maybe<Scalars['Int']['output']>;
};

/** aggregate min on columns */
export type Subject_Predicates_Min_Fields = {
  __typename?: 'subject_predicates_min_fields';
  opposer_count?: Maybe<Scalars['bigint']['output']>;
  /** Predicate atom ID. */
  predicate_id?: Maybe<Scalars['String']['output']>;
  /** Subject atom ID. */
  subject_id?: Maybe<Scalars['String']['output']>;
  supporter_count?: Maybe<Scalars['bigint']['output']>;
  /** Total market cap across all triples with this combination, in wei. */
  total_market_cap?: Maybe<Scalars['numeric']['output']>;
  /** Total positions across all triples with this combination. */
  total_position_count?: Maybe<Scalars['Int']['output']>;
  /** Number of triples with this (subject, predicate) combination. */
  triple_count?: Maybe<Scalars['Int']['output']>;
};

/** Ordering options when selecting data from "subject_predicate". */
export type Subject_Predicates_Order_By = {
  opposer_count?: InputMaybe<Order_By>;
  predicate?: InputMaybe<Atoms_Order_By>;
  predicate_id?: InputMaybe<Order_By>;
  subject?: InputMaybe<Atoms_Order_By>;
  subject_id?: InputMaybe<Order_By>;
  supporter_count?: InputMaybe<Order_By>;
  total_market_cap?: InputMaybe<Order_By>;
  total_position_count?: InputMaybe<Order_By>;
  triple_count?: InputMaybe<Order_By>;
  triples_aggregate?: InputMaybe<Triples_Aggregate_Order_By>;
};

/** select columns of table "subject_predicate" */
export type Subject_Predicates_Select_Column =
  /** column name */
  | 'opposer_count'
  /** column name */
  | 'predicate_id'
  /** column name */
  | 'subject_id'
  /** column name */
  | 'supporter_count'
  /** column name */
  | 'total_market_cap'
  /** column name */
  | 'total_position_count'
  /** column name */
  | 'triple_count';

/** aggregate stddev on columns */
export type Subject_Predicates_Stddev_Fields = {
  __typename?: 'subject_predicates_stddev_fields';
  opposer_count?: Maybe<Scalars['Float']['output']>;
  supporter_count?: Maybe<Scalars['Float']['output']>;
  /** Total market cap across all triples with this combination, in wei. */
  total_market_cap?: Maybe<Scalars['Float']['output']>;
  /** Total positions across all triples with this combination. */
  total_position_count?: Maybe<Scalars['Float']['output']>;
  /** Number of triples with this (subject, predicate) combination. */
  triple_count?: Maybe<Scalars['Float']['output']>;
};

/** aggregate stddev_pop on columns */
export type Subject_Predicates_Stddev_Pop_Fields = {
  __typename?: 'subject_predicates_stddev_pop_fields';
  opposer_count?: Maybe<Scalars['Float']['output']>;
  supporter_count?: Maybe<Scalars['Float']['output']>;
  /** Total market cap across all triples with this combination, in wei. */
  total_market_cap?: Maybe<Scalars['Float']['output']>;
  /** Total positions across all triples with this combination. */
  total_position_count?: Maybe<Scalars['Float']['output']>;
  /** Number of triples with this (subject, predicate) combination. */
  triple_count?: Maybe<Scalars['Float']['output']>;
};

/** aggregate stddev_samp on columns */
export type Subject_Predicates_Stddev_Samp_Fields = {
  __typename?: 'subject_predicates_stddev_samp_fields';
  opposer_count?: Maybe<Scalars['Float']['output']>;
  supporter_count?: Maybe<Scalars['Float']['output']>;
  /** Total market cap across all triples with this combination, in wei. */
  total_market_cap?: Maybe<Scalars['Float']['output']>;
  /** Total positions across all triples with this combination. */
  total_position_count?: Maybe<Scalars['Float']['output']>;
  /** Number of triples with this (subject, predicate) combination. */
  triple_count?: Maybe<Scalars['Float']['output']>;
};

/** Streaming cursor of the table "subject_predicates" */
export type Subject_Predicates_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Subject_Predicates_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Subject_Predicates_Stream_Cursor_Value_Input = {
  opposer_count?: InputMaybe<Scalars['bigint']['input']>;
  /** Predicate atom ID. */
  predicate_id?: InputMaybe<Scalars['String']['input']>;
  /** Subject atom ID. */
  subject_id?: InputMaybe<Scalars['String']['input']>;
  supporter_count?: InputMaybe<Scalars['bigint']['input']>;
  /** Total market cap across all triples with this combination, in wei. */
  total_market_cap?: InputMaybe<Scalars['numeric']['input']>;
  /** Total positions across all triples with this combination. */
  total_position_count?: InputMaybe<Scalars['Int']['input']>;
  /** Number of triples with this (subject, predicate) combination. */
  triple_count?: InputMaybe<Scalars['Int']['input']>;
};

/** aggregate sum on columns */
export type Subject_Predicates_Sum_Fields = {
  __typename?: 'subject_predicates_sum_fields';
  opposer_count?: Maybe<Scalars['bigint']['output']>;
  supporter_count?: Maybe<Scalars['bigint']['output']>;
  /** Total market cap across all triples with this combination, in wei. */
  total_market_cap?: Maybe<Scalars['numeric']['output']>;
  /** Total positions across all triples with this combination. */
  total_position_count?: Maybe<Scalars['Int']['output']>;
  /** Number of triples with this (subject, predicate) combination. */
  triple_count?: Maybe<Scalars['Int']['output']>;
};

/** aggregate var_pop on columns */
export type Subject_Predicates_Var_Pop_Fields = {
  __typename?: 'subject_predicates_var_pop_fields';
  opposer_count?: Maybe<Scalars['Float']['output']>;
  supporter_count?: Maybe<Scalars['Float']['output']>;
  /** Total market cap across all triples with this combination, in wei. */
  total_market_cap?: Maybe<Scalars['Float']['output']>;
  /** Total positions across all triples with this combination. */
  total_position_count?: Maybe<Scalars['Float']['output']>;
  /** Number of triples with this (subject, predicate) combination. */
  triple_count?: Maybe<Scalars['Float']['output']>;
};

/** aggregate var_samp on columns */
export type Subject_Predicates_Var_Samp_Fields = {
  __typename?: 'subject_predicates_var_samp_fields';
  opposer_count?: Maybe<Scalars['Float']['output']>;
  supporter_count?: Maybe<Scalars['Float']['output']>;
  /** Total market cap across all triples with this combination, in wei. */
  total_market_cap?: Maybe<Scalars['Float']['output']>;
  /** Total positions across all triples with this combination. */
  total_position_count?: Maybe<Scalars['Float']['output']>;
  /** Number of triples with this (subject, predicate) combination. */
  triple_count?: Maybe<Scalars['Float']['output']>;
};

/** aggregate variance on columns */
export type Subject_Predicates_Variance_Fields = {
  __typename?: 'subject_predicates_variance_fields';
  opposer_count?: Maybe<Scalars['Float']['output']>;
  supporter_count?: Maybe<Scalars['Float']['output']>;
  /** Total market cap across all triples with this combination, in wei. */
  total_market_cap?: Maybe<Scalars['Float']['output']>;
  /** Total positions across all triples with this combination. */
  total_position_count?: Maybe<Scalars['Float']['output']>;
  /** Number of triples with this (subject, predicate) combination. */
  triple_count?: Maybe<Scalars['Float']['output']>;
};

export type Subscription_Root = {
  __typename?: 'subscription_root';
  /** fetch data from the table: "account" using primary key columns */
  account?: Maybe<Accounts>;
  /** fetch data from the table: "account_pnl_rank" */
  account_pnl_rank: Array<Account_Pnl_Rank>;
  /** fetch aggregated fields from the table: "account_pnl_rank" */
  account_pnl_rank_aggregate: Account_Pnl_Rank_Aggregate;
  /** fetch data from the table in a streaming manner: "account_pnl_rank" */
  account_pnl_rank_stream: Array<Account_Pnl_Rank>;
  /** An array relationship */
  accounts: Array<Accounts>;
  /** An aggregate relationship */
  accounts_aggregate: Accounts_Aggregate;
  /** fetch data from the table in a streaming manner: "account" */
  accounts_stream: Array<Accounts>;
  /** fetch data from the table: "atom" using primary key columns */
  atom?: Maybe<Atoms>;
  /** fetch data from the table: "atom_value" using primary key columns */
  atom_value?: Maybe<Atom_Values>;
  /** fetch data from the table: "atom_value" */
  atom_values: Array<Atom_Values>;
  /** fetch aggregated fields from the table: "atom_value" */
  atom_values_aggregate: Atom_Values_Aggregate;
  /** fetch data from the table in a streaming manner: "atom_value" */
  atom_values_stream: Array<Atom_Values>;
  /** An array relationship */
  atoms: Array<Atoms>;
  /** An aggregate relationship */
  atoms_aggregate: Atoms_Aggregate;
  /** fetch data from the table in a streaming manner: "atom" */
  atoms_stream: Array<Atoms>;
  /** fetch data from the table: "book" using primary key columns */
  book?: Maybe<Books>;
  /** fetch data from the table: "book" */
  books: Array<Books>;
  /** fetch aggregated fields from the table: "book" */
  books_aggregate: Books_Aggregate;
  /** fetch data from the table in a streaming manner: "book" */
  books_stream: Array<Books>;
  /** fetch data from the table: "byte_object" */
  byte_object: Array<Byte_Object>;
  /** fetch aggregated fields from the table: "byte_object" */
  byte_object_aggregate: Byte_Object_Aggregate;
  /** fetch data from the table: "byte_object" using primary key columns */
  byte_object_by_pk?: Maybe<Byte_Object>;
  /** fetch data from the table in a streaming manner: "byte_object" */
  byte_object_stream: Array<Byte_Object>;
  /** fetch data from the table: "cached_images.cached_image" */
  cached_images_cached_image: Array<Cached_Images_Cached_Image>;
  /** fetch data from the table: "cached_images.cached_image" using primary key columns */
  cached_images_cached_image_by_pk?: Maybe<Cached_Images_Cached_Image>;
  /** fetch data from the table in a streaming manner: "cached_images.cached_image" */
  cached_images_cached_image_stream: Array<Cached_Images_Cached_Image>;
  /** fetch data from the table: "caip10" using primary key columns */
  caip10?: Maybe<Caip10>;
  /** fetch aggregated fields from the table: "caip10" */
  caip10_aggregate: Caip10_Aggregate;
  /** fetch data from the table in a streaming manner: "caip10" */
  caip10_stream: Array<Caip10>;
  /** fetch data from the table: "caip10" */
  caip10s: Array<Caip10>;
  /** fetch data from the table: "chainlink_price" using primary key columns */
  chainlink_price?: Maybe<Chainlink_Prices>;
  /** fetch data from the table: "chainlink_price" */
  chainlink_prices: Array<Chainlink_Prices>;
  /** fetch data from the table in a streaming manner: "chainlink_price" */
  chainlink_prices_stream: Array<Chainlink_Prices>;
  /** fetch data from the table: "deposit" using primary key columns */
  deposit?: Maybe<Deposits>;
  /** An array relationship */
  deposits: Array<Deposits>;
  /** An aggregate relationship */
  deposits_aggregate: Deposits_Aggregate;
  /** fetch data from the table in a streaming manner: "deposit" */
  deposits_stream: Array<Deposits>;
  /** fetch data from the table: "event" using primary key columns */
  event?: Maybe<Events>;
  /** fetch data from the table: "event" */
  events: Array<Events>;
  /** fetch aggregated fields from the table: "event" */
  events_aggregate: Events_Aggregate;
  /** fetch data from the table in a streaming manner: "event" */
  events_stream: Array<Events>;
  /** fetch data from the table: "fee_transfer" using primary key columns */
  fee_transfer?: Maybe<Fee_Transfers>;
  /** An array relationship */
  fee_transfers: Array<Fee_Transfers>;
  /** An aggregate relationship */
  fee_transfers_aggregate: Fee_Transfers_Aggregate;
  /** fetch data from the table in a streaming manner: "fee_transfer" */
  fee_transfers_stream: Array<Fee_Transfers>;
  /** execute function "following" which returns "account" */
  following: Array<Accounts>;
  /** execute function "following" and query aggregates on result of table type "account" */
  following_aggregate: Accounts_Aggregate;
  /** execute function "get_account_pnl_rank" which returns "account_pnl_rank" */
  get_account_pnl_rank: Array<Account_Pnl_Rank>;
  /** execute function "get_account_pnl_rank" and query aggregates on result of table type "account_pnl_rank" */
  get_account_pnl_rank_aggregate: Account_Pnl_Rank_Aggregate;
  /** execute function "get_pnl_leaderboard" which returns "pnl_leaderboard_entry" */
  get_pnl_leaderboard: Array<Pnl_Leaderboard_Entry>;
  /** execute function "get_pnl_leaderboard" and query aggregates on result of table type "pnl_leaderboard_entry" */
  get_pnl_leaderboard_aggregate: Pnl_Leaderboard_Entry_Aggregate;
  /** execute function "get_pnl_leaderboard_stats" which returns "pnl_leaderboard_stats" */
  get_pnl_leaderboard_stats: Array<Pnl_Leaderboard_Stats>;
  /** execute function "get_pnl_leaderboard_stats" and query aggregates on result of table type "pnl_leaderboard_stats" */
  get_pnl_leaderboard_stats_aggregate: Pnl_Leaderboard_Stats_Aggregate;
  /** execute function "get_vault_leaderboard" which returns "pnl_leaderboard_entry" */
  get_vault_leaderboard: Array<Pnl_Leaderboard_Entry>;
  /** execute function "get_vault_leaderboard" and query aggregates on result of table type "pnl_leaderboard_entry" */
  get_vault_leaderboard_aggregate: Pnl_Leaderboard_Entry_Aggregate;
  /** fetch data from the table: "json_object" using primary key columns */
  json_object?: Maybe<Json_Objects>;
  /** fetch data from the table: "json_object" */
  json_objects: Array<Json_Objects>;
  /** fetch aggregated fields from the table: "json_object" */
  json_objects_aggregate: Json_Objects_Aggregate;
  /** fetch data from the table in a streaming manner: "json_object" */
  json_objects_stream: Array<Json_Objects>;
  /** fetch data from the table: "organization" using primary key columns */
  organization?: Maybe<Organizations>;
  /** fetch data from the table: "organization" */
  organizations: Array<Organizations>;
  /** fetch aggregated fields from the table: "organization" */
  organizations_aggregate: Organizations_Aggregate;
  /** fetch data from the table in a streaming manner: "organization" */
  organizations_stream: Array<Organizations>;
  /** fetch data from the table: "person" using primary key columns */
  person?: Maybe<Persons>;
  /** fetch data from the table: "person" */
  persons: Array<Persons>;
  /** fetch aggregated fields from the table: "person" */
  persons_aggregate: Persons_Aggregate;
  /** fetch data from the table in a streaming manner: "person" */
  persons_stream: Array<Persons>;
  /** fetch data from the table: "pnl_leaderboard_entry" */
  pnl_leaderboard_entry: Array<Pnl_Leaderboard_Entry>;
  /** fetch aggregated fields from the table: "pnl_leaderboard_entry" */
  pnl_leaderboard_entry_aggregate: Pnl_Leaderboard_Entry_Aggregate;
  /** fetch data from the table in a streaming manner: "pnl_leaderboard_entry" */
  pnl_leaderboard_entry_stream: Array<Pnl_Leaderboard_Entry>;
  /** fetch data from the table: "pnl_leaderboard_stats" */
  pnl_leaderboard_stats: Array<Pnl_Leaderboard_Stats>;
  /** fetch aggregated fields from the table: "pnl_leaderboard_stats" */
  pnl_leaderboard_stats_aggregate: Pnl_Leaderboard_Stats_Aggregate;
  /** fetch data from the table in a streaming manner: "pnl_leaderboard_stats" */
  pnl_leaderboard_stats_stream: Array<Pnl_Leaderboard_Stats>;
  /** fetch data from the table: "position" using primary key columns */
  position?: Maybe<Positions>;
  /** fetch data from the table: "position_change_daily" */
  position_change_daily: Array<Position_Change_Daily>;
  /** fetch data from the table in a streaming manner: "position_change_daily" */
  position_change_daily_stream: Array<Position_Change_Daily>;
  /** fetch data from the table: "position_change_hourly" */
  position_change_hourly: Array<Position_Change_Hourly>;
  /** fetch data from the table in a streaming manner: "position_change_hourly" */
  position_change_hourly_stream: Array<Position_Change_Hourly>;
  /** fetch data from the table: "position_change" */
  position_changes: Array<Position_Changes>;
  /** fetch aggregated fields from the table: "position_change" */
  position_changes_aggregate: Position_Changes_Aggregate;
  /** fetch data from the table in a streaming manner: "position_change" */
  position_changes_stream: Array<Position_Changes>;
  /** An array relationship */
  positions: Array<Positions>;
  /** An aggregate relationship */
  positions_aggregate: Positions_Aggregate;
  /** execute function "positions_from_following" which returns "position" */
  positions_from_following: Array<Positions>;
  /** execute function "positions_from_following" and query aggregates on result of table type "position" */
  positions_from_following_aggregate: Positions_Aggregate;
  /** fetch data from the table in a streaming manner: "position" */
  positions_stream: Array<Positions>;
  /** fetch data from the table: "position_with_value" */
  positions_with_value: Array<Positions_With_Value>;
  /** fetch aggregated fields from the table: "position_with_value" */
  positions_with_value_aggregate: Positions_With_Value_Aggregate;
  /** fetch data from the table in a streaming manner: "position_with_value" */
  positions_with_value_stream: Array<Positions_With_Value>;
  /** fetch data from the table: "predicate_object" */
  predicate_objects: Array<Predicate_Objects>;
  /** fetch aggregated fields from the table: "predicate_object" */
  predicate_objects_aggregate: Predicate_Objects_Aggregate;
  /** fetch data from the table: "predicate_object" using primary key columns */
  predicate_objects_by_pk?: Maybe<Predicate_Objects>;
  /** fetch data from the table in a streaming manner: "predicate_object" */
  predicate_objects_stream: Array<Predicate_Objects>;
  /** fetch data from the table: "protocol_fee_accrued" */
  protocol_fee_accruals: Array<Protocol_Fee_Accruals>;
  /** fetch aggregated fields from the table: "protocol_fee_accrued" */
  protocol_fee_accruals_aggregate: Protocol_Fee_Accruals_Aggregate;
  /** fetch data from the table in a streaming manner: "protocol_fee_accrued" */
  protocol_fee_accruals_stream: Array<Protocol_Fee_Accruals>;
  /** fetch data from the table: "protocol_fee_accrued" using primary key columns */
  protocol_fee_accrued?: Maybe<Protocol_Fee_Accruals>;
  /** fetch data from the table: "redemption" using primary key columns */
  redemption?: Maybe<Redemptions>;
  /** An array relationship */
  redemptions: Array<Redemptions>;
  /** An aggregate relationship */
  redemptions_aggregate: Redemptions_Aggregate;
  /** fetch data from the table in a streaming manner: "redemption" */
  redemptions_stream: Array<Redemptions>;
  /** execute function "search_positions_on_subject" which returns "position" */
  search_positions_on_subject: Array<Positions>;
  /** execute function "search_positions_on_subject" and query aggregates on result of table type "position" */
  search_positions_on_subject_aggregate: Positions_Aggregate;
  /** execute function "search_term" which returns "term" */
  search_term: Array<Terms>;
  /** execute function "search_term" and query aggregates on result of table type "term" */
  search_term_aggregate: Terms_Aggregate;
  /** execute function "search_term_from_following" which returns "term" */
  search_term_from_following: Array<Terms>;
  /** execute function "search_term_from_following" and query aggregates on result of table type "term" */
  search_term_from_following_aggregate: Terms_Aggregate;
  /** execute function "search_term_tsvector" which returns "term" */
  search_term_tsvector: Array<Terms>;
  /** execute function "search_term_tsvector" and query aggregates on result of table type "term" */
  search_term_tsvector_aggregate: Terms_Aggregate;
  /** fetch data from the table: "season2_epoch" using primary key columns */
  season2_epoch?: Maybe<Season2_Epochs>;
  /** fetch data from the table: "season2_epoch_price" using primary key columns */
  season2_epoch_price?: Maybe<Season2_Epoch_Prices>;
  /** fetch data from the table: "season2_epoch_price" */
  season2_epoch_prices: Array<Season2_Epoch_Prices>;
  /** fetch aggregated fields from the table: "season2_epoch_price" */
  season2_epoch_prices_aggregate: Season2_Epoch_Prices_Aggregate;
  /** fetch data from the table in a streaming manner: "season2_epoch_price" */
  season2_epoch_prices_stream: Array<Season2_Epoch_Prices>;
  /** fetch data from the table: "season2_epoch" */
  season2_epochs: Array<Season2_Epochs>;
  /** fetch aggregated fields from the table: "season2_epoch" */
  season2_epochs_aggregate: Season2_Epochs_Aggregate;
  /** fetch data from the table in a streaming manner: "season2_epoch" */
  season2_epochs_stream: Array<Season2_Epochs>;
  /** fetch data from the table: "season2_iq_ledger" using primary key columns */
  season2_iq_ledger?: Maybe<Season2_Iq_Ledger_Entries>;
  /** An array relationship */
  season2_iq_ledger_entries: Array<Season2_Iq_Ledger_Entries>;
  /** An aggregate relationship */
  season2_iq_ledger_entries_aggregate: Season2_Iq_Ledger_Entries_Aggregate;
  /** fetch data from the table in a streaming manner: "season2_iq_ledger" */
  season2_iq_ledger_entries_stream: Array<Season2_Iq_Ledger_Entries>;
  /** fetch data from the table: "season2_leaderboard_payout" using primary key columns */
  season2_leaderboard_payout?: Maybe<Season2_Leaderboard_Payouts>;
  /** fetch data from the table: "season2_leaderboard_payout" */
  season2_leaderboard_payouts: Array<Season2_Leaderboard_Payouts>;
  /** fetch aggregated fields from the table: "season2_leaderboard_payout" */
  season2_leaderboard_payouts_aggregate: Season2_Leaderboard_Payouts_Aggregate;
  /** fetch data from the table in a streaming manner: "season2_leaderboard_payout" */
  season2_leaderboard_payouts_stream: Array<Season2_Leaderboard_Payouts>;
  /** fetch data from the table: "season2_trust_price_snapshot" using primary key columns */
  season2_trust_price_snapshot?: Maybe<Season2_Trust_Price_Snapshots>;
  /** fetch data from the table: "season2_trust_price_snapshot" */
  season2_trust_price_snapshots: Array<Season2_Trust_Price_Snapshots>;
  /** fetch aggregated fields from the table: "season2_trust_price_snapshot" */
  season2_trust_price_snapshots_aggregate: Season2_Trust_Price_Snapshots_Aggregate;
  /** fetch data from the table in a streaming manner: "season2_trust_price_snapshot" */
  season2_trust_price_snapshots_stream: Array<Season2_Trust_Price_Snapshots>;
  /** An array relationship */
  share_price_change_stats_daily: Array<Share_Price_Change_Stats_Daily>;
  /** fetch data from the table in a streaming manner: "share_price_change_stats_daily" */
  share_price_change_stats_daily_stream: Array<Share_Price_Change_Stats_Daily>;
  /** An array relationship */
  share_price_change_stats_hourly: Array<Share_Price_Change_Stats_Hourly>;
  /** fetch data from the table in a streaming manner: "share_price_change_stats_hourly" */
  share_price_change_stats_hourly_stream: Array<Share_Price_Change_Stats_Hourly>;
  /** An array relationship */
  share_price_change_stats_monthly: Array<Share_Price_Change_Stats_Monthly>;
  /** fetch data from the table in a streaming manner: "share_price_change_stats_monthly" */
  share_price_change_stats_monthly_stream: Array<Share_Price_Change_Stats_Monthly>;
  /** An array relationship */
  share_price_change_stats_weekly: Array<Share_Price_Change_Stats_Weekly>;
  /** fetch data from the table in a streaming manner: "share_price_change_stats_weekly" */
  share_price_change_stats_weekly_stream: Array<Share_Price_Change_Stats_Weekly>;
  /** An array relationship */
  share_price_changes: Array<Share_Price_Changes>;
  /** An aggregate relationship */
  share_price_changes_aggregate: Share_Price_Changes_Aggregate;
  /** fetch data from the table in a streaming manner: "share_price_change" */
  share_price_changes_stream: Array<Share_Price_Changes>;
  /** fetch data from the table: "signal_stats_daily" */
  signal_stats_daily: Array<Signal_Stats_Daily>;
  /** fetch data from the table in a streaming manner: "signal_stats_daily" */
  signal_stats_daily_stream: Array<Signal_Stats_Daily>;
  /** fetch data from the table: "signal_stats_hourly" */
  signal_stats_hourly: Array<Signal_Stats_Hourly>;
  /** fetch data from the table in a streaming manner: "signal_stats_hourly" */
  signal_stats_hourly_stream: Array<Signal_Stats_Hourly>;
  /** fetch data from the table: "signal_stats_monthly" */
  signal_stats_monthly: Array<Signal_Stats_Monthly>;
  /** fetch data from the table in a streaming manner: "signal_stats_monthly" */
  signal_stats_monthly_stream: Array<Signal_Stats_Monthly>;
  /** fetch data from the table: "signal_stats_weekly" */
  signal_stats_weekly: Array<Signal_Stats_Weekly>;
  /** fetch data from the table in a streaming manner: "signal_stats_weekly" */
  signal_stats_weekly_stream: Array<Signal_Stats_Weekly>;
  /** An array relationship */
  signals: Array<Signals>;
  /** An aggregate relationship */
  signals_aggregate: Signals_Aggregate;
  /** execute function "signals_from_following" which returns "signal" */
  signals_from_following: Array<Signals>;
  /** execute function "signals_from_following" and query aggregates on result of table type "signal" */
  signals_from_following_aggregate: Signals_Aggregate;
  /** fetch data from the table in a streaming manner: "signal" */
  signals_stream: Array<Signals>;
  /** fetch data from the table: "stats" using primary key columns */
  stat?: Maybe<Stats>;
  /** fetch data from the table: "stats_hour" using primary key columns */
  statHour?: Maybe<StatHours>;
  /** fetch data from the table: "stats_hour" */
  statHours: Array<StatHours>;
  /** fetch data from the table in a streaming manner: "stats_hour" */
  statHours_stream: Array<StatHours>;
  /** fetch data from the table: "stats" */
  stats: Array<Stats>;
  /** fetch aggregated fields from the table: "stats" */
  stats_aggregate: Stats_Aggregate;
  /** fetch data from the table in a streaming manner: "stats" */
  stats_stream: Array<Stats>;
  /** fetch data from the table: "subject_predicate" */
  subject_predicates: Array<Subject_Predicates>;
  /** fetch aggregated fields from the table: "subject_predicate" */
  subject_predicates_aggregate: Subject_Predicates_Aggregate;
  /** fetch data from the table: "subject_predicate" using primary key columns */
  subject_predicates_by_pk?: Maybe<Subject_Predicates>;
  /** fetch data from the table in a streaming manner: "subject_predicate" */
  subject_predicates_stream: Array<Subject_Predicates>;
  /** fetch data from the table: "term" using primary key columns */
  term?: Maybe<Terms>;
  /** fetch data from the table: "term_total_state_change_stats_daily" */
  term_total_state_change_stats_daily: Array<Term_Total_State_Change_Stats_Daily>;
  /** fetch data from the table in a streaming manner: "term_total_state_change_stats_daily" */
  term_total_state_change_stats_daily_stream: Array<Term_Total_State_Change_Stats_Daily>;
  /** fetch data from the table: "term_total_state_change_stats_hourly" */
  term_total_state_change_stats_hourly: Array<Term_Total_State_Change_Stats_Hourly>;
  /** fetch data from the table in a streaming manner: "term_total_state_change_stats_hourly" */
  term_total_state_change_stats_hourly_stream: Array<Term_Total_State_Change_Stats_Hourly>;
  /** fetch data from the table: "term_total_state_change_stats_monthly" */
  term_total_state_change_stats_monthly: Array<Term_Total_State_Change_Stats_Monthly>;
  /** fetch data from the table in a streaming manner: "term_total_state_change_stats_monthly" */
  term_total_state_change_stats_monthly_stream: Array<Term_Total_State_Change_Stats_Monthly>;
  /** fetch data from the table: "term_total_state_change_stats_weekly" */
  term_total_state_change_stats_weekly: Array<Term_Total_State_Change_Stats_Weekly>;
  /** fetch data from the table in a streaming manner: "term_total_state_change_stats_weekly" */
  term_total_state_change_stats_weekly_stream: Array<Term_Total_State_Change_Stats_Weekly>;
  /** An array relationship */
  term_total_state_changes: Array<Term_Total_State_Changes>;
  /** fetch data from the table in a streaming manner: "term_total_state_change" */
  term_total_state_changes_stream: Array<Term_Total_State_Changes>;
  /** fetch data from the table: "term" */
  terms: Array<Terms>;
  /** fetch aggregated fields from the table: "term" */
  terms_aggregate: Terms_Aggregate;
  /** fetch data from the table in a streaming manner: "term" */
  terms_stream: Array<Terms>;
  /** fetch data from the table: "text_object" using primary key columns */
  text_object?: Maybe<Text_Objects>;
  /** fetch data from the table: "text_object" */
  text_objects: Array<Text_Objects>;
  /** fetch aggregated fields from the table: "text_object" */
  text_objects_aggregate: Text_Objects_Aggregate;
  /** fetch data from the table in a streaming manner: "text_object" */
  text_objects_stream: Array<Text_Objects>;
  /** fetch data from the table: "thing" using primary key columns */
  thing?: Maybe<Things>;
  /** fetch data from the table: "thing" */
  things: Array<Things>;
  /** fetch aggregated fields from the table: "thing" */
  things_aggregate: Things_Aggregate;
  /** fetch data from the table in a streaming manner: "thing" */
  things_stream: Array<Things>;
  /** fetch data from the table: "triple" using primary key columns */
  triple?: Maybe<Triples>;
  /** fetch data from the table: "triple_term" using primary key columns */
  triple_term?: Maybe<Triple_Term>;
  /** fetch data from the table in a streaming manner: "triple_term" */
  triple_term_stream: Array<Triple_Term>;
  /** fetch data from the table: "triple_term" */
  triple_terms: Array<Triple_Term>;
  /** fetch data from the table: "triple_vault" using primary key columns */
  triple_vault?: Maybe<Triple_Vault>;
  /** fetch data from the table in a streaming manner: "triple_vault" */
  triple_vault_stream: Array<Triple_Vault>;
  /** fetch data from the table: "triple_vault" */
  triple_vaults: Array<Triple_Vault>;
  /** An array relationship */
  triples: Array<Triples>;
  /** An aggregate relationship */
  triples_aggregate: Triples_Aggregate;
  /** fetch data from the table in a streaming manner: "triple" */
  triples_stream: Array<Triples>;
  /** fetch data from the table: "vault" using primary key columns */
  vault?: Maybe<Vaults>;
  /** An array relationship */
  vaults: Array<Vaults>;
  /** An aggregate relationship */
  vaults_aggregate: Vaults_Aggregate;
  /** fetch data from the table in a streaming manner: "vault" */
  vaults_stream: Array<Vaults>;
};


export type Subscription_RootAccountArgs = {
  id: Scalars['String']['input'];
};


export type Subscription_RootAccount_Pnl_RankArgs = {
  distinct_on?: InputMaybe<Array<Account_Pnl_Rank_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Account_Pnl_Rank_Order_By>>;
  where?: InputMaybe<Account_Pnl_Rank_Bool_Exp>;
};


export type Subscription_RootAccount_Pnl_Rank_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Account_Pnl_Rank_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Account_Pnl_Rank_Order_By>>;
  where?: InputMaybe<Account_Pnl_Rank_Bool_Exp>;
};


export type Subscription_RootAccount_Pnl_Rank_StreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<Account_Pnl_Rank_Stream_Cursor_Input>>;
  where?: InputMaybe<Account_Pnl_Rank_Bool_Exp>;
};


export type Subscription_RootAccountsArgs = {
  distinct_on?: InputMaybe<Array<Accounts_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Accounts_Order_By>>;
  where?: InputMaybe<Accounts_Bool_Exp>;
};


export type Subscription_RootAccounts_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Accounts_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Accounts_Order_By>>;
  where?: InputMaybe<Accounts_Bool_Exp>;
};


export type Subscription_RootAccounts_StreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<Accounts_Stream_Cursor_Input>>;
  where?: InputMaybe<Accounts_Bool_Exp>;
};


export type Subscription_RootAtomArgs = {
  term_id: Scalars['String']['input'];
};


export type Subscription_RootAtom_ValueArgs = {
  id: Scalars['String']['input'];
};


export type Subscription_RootAtom_ValuesArgs = {
  distinct_on?: InputMaybe<Array<Atom_Values_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Atom_Values_Order_By>>;
  where?: InputMaybe<Atom_Values_Bool_Exp>;
};


export type Subscription_RootAtom_Values_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Atom_Values_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Atom_Values_Order_By>>;
  where?: InputMaybe<Atom_Values_Bool_Exp>;
};


export type Subscription_RootAtom_Values_StreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<Atom_Values_Stream_Cursor_Input>>;
  where?: InputMaybe<Atom_Values_Bool_Exp>;
};


export type Subscription_RootAtomsArgs = {
  distinct_on?: InputMaybe<Array<Atoms_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Atoms_Order_By>>;
  where?: InputMaybe<Atoms_Bool_Exp>;
};


export type Subscription_RootAtoms_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Atoms_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Atoms_Order_By>>;
  where?: InputMaybe<Atoms_Bool_Exp>;
};


export type Subscription_RootAtoms_StreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<Atoms_Stream_Cursor_Input>>;
  where?: InputMaybe<Atoms_Bool_Exp>;
};


export type Subscription_RootBookArgs = {
  id: Scalars['String']['input'];
};


export type Subscription_RootBooksArgs = {
  distinct_on?: InputMaybe<Array<Books_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Books_Order_By>>;
  where?: InputMaybe<Books_Bool_Exp>;
};


export type Subscription_RootBooks_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Books_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Books_Order_By>>;
  where?: InputMaybe<Books_Bool_Exp>;
};


export type Subscription_RootBooks_StreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<Books_Stream_Cursor_Input>>;
  where?: InputMaybe<Books_Bool_Exp>;
};


export type Subscription_RootByte_ObjectArgs = {
  distinct_on?: InputMaybe<Array<Byte_Object_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Byte_Object_Order_By>>;
  where?: InputMaybe<Byte_Object_Bool_Exp>;
};


export type Subscription_RootByte_Object_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Byte_Object_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Byte_Object_Order_By>>;
  where?: InputMaybe<Byte_Object_Bool_Exp>;
};


export type Subscription_RootByte_Object_By_PkArgs = {
  id: Scalars['String']['input'];
};


export type Subscription_RootByte_Object_StreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<Byte_Object_Stream_Cursor_Input>>;
  where?: InputMaybe<Byte_Object_Bool_Exp>;
};


export type Subscription_RootCached_Images_Cached_ImageArgs = {
  distinct_on?: InputMaybe<Array<Cached_Images_Cached_Image_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Cached_Images_Cached_Image_Order_By>>;
  where?: InputMaybe<Cached_Images_Cached_Image_Bool_Exp>;
};


export type Subscription_RootCached_Images_Cached_Image_By_PkArgs = {
  url: Scalars['String']['input'];
};


export type Subscription_RootCached_Images_Cached_Image_StreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<Cached_Images_Cached_Image_Stream_Cursor_Input>>;
  where?: InputMaybe<Cached_Images_Cached_Image_Bool_Exp>;
};


export type Subscription_RootCaip10Args = {
  id: Scalars['String']['input'];
};


export type Subscription_RootCaip10_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Caip10_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Caip10_Order_By>>;
  where?: InputMaybe<Caip10_Bool_Exp>;
};


export type Subscription_RootCaip10_StreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<Caip10_Stream_Cursor_Input>>;
  where?: InputMaybe<Caip10_Bool_Exp>;
};


export type Subscription_RootCaip10sArgs = {
  distinct_on?: InputMaybe<Array<Caip10_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Caip10_Order_By>>;
  where?: InputMaybe<Caip10_Bool_Exp>;
};


export type Subscription_RootChainlink_PriceArgs = {
  id: Scalars['numeric']['input'];
};


export type Subscription_RootChainlink_PricesArgs = {
  distinct_on?: InputMaybe<Array<Chainlink_Prices_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Chainlink_Prices_Order_By>>;
  where?: InputMaybe<Chainlink_Prices_Bool_Exp>;
};


export type Subscription_RootChainlink_Prices_StreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<Chainlink_Prices_Stream_Cursor_Input>>;
  where?: InputMaybe<Chainlink_Prices_Bool_Exp>;
};


export type Subscription_RootDepositArgs = {
  id: Scalars['String']['input'];
};


export type Subscription_RootDepositsArgs = {
  distinct_on?: InputMaybe<Array<Deposits_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Deposits_Order_By>>;
  where?: InputMaybe<Deposits_Bool_Exp>;
};


export type Subscription_RootDeposits_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Deposits_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Deposits_Order_By>>;
  where?: InputMaybe<Deposits_Bool_Exp>;
};


export type Subscription_RootDeposits_StreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<Deposits_Stream_Cursor_Input>>;
  where?: InputMaybe<Deposits_Bool_Exp>;
};


export type Subscription_RootEventArgs = {
  id: Scalars['String']['input'];
};


export type Subscription_RootEventsArgs = {
  distinct_on?: InputMaybe<Array<Events_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Events_Order_By>>;
  where?: InputMaybe<Events_Bool_Exp>;
};


export type Subscription_RootEvents_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Events_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Events_Order_By>>;
  where?: InputMaybe<Events_Bool_Exp>;
};


export type Subscription_RootEvents_StreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<Events_Stream_Cursor_Input>>;
  where?: InputMaybe<Events_Bool_Exp>;
};


export type Subscription_RootFee_TransferArgs = {
  id: Scalars['String']['input'];
};


export type Subscription_RootFee_TransfersArgs = {
  distinct_on?: InputMaybe<Array<Fee_Transfers_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Fee_Transfers_Order_By>>;
  where?: InputMaybe<Fee_Transfers_Bool_Exp>;
};


export type Subscription_RootFee_Transfers_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Fee_Transfers_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Fee_Transfers_Order_By>>;
  where?: InputMaybe<Fee_Transfers_Bool_Exp>;
};


export type Subscription_RootFee_Transfers_StreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<Fee_Transfers_Stream_Cursor_Input>>;
  where?: InputMaybe<Fee_Transfers_Bool_Exp>;
};


export type Subscription_RootFollowingArgs = {
  args: Following_Args;
  distinct_on?: InputMaybe<Array<Accounts_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Accounts_Order_By>>;
  where?: InputMaybe<Accounts_Bool_Exp>;
};


export type Subscription_RootFollowing_AggregateArgs = {
  args: Following_Args;
  distinct_on?: InputMaybe<Array<Accounts_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Accounts_Order_By>>;
  where?: InputMaybe<Accounts_Bool_Exp>;
};


export type Subscription_RootGet_Account_Pnl_RankArgs = {
  args: Get_Account_Pnl_Rank_Args;
  distinct_on?: InputMaybe<Array<Account_Pnl_Rank_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Account_Pnl_Rank_Order_By>>;
  where?: InputMaybe<Account_Pnl_Rank_Bool_Exp>;
};


export type Subscription_RootGet_Account_Pnl_Rank_AggregateArgs = {
  args: Get_Account_Pnl_Rank_Args;
  distinct_on?: InputMaybe<Array<Account_Pnl_Rank_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Account_Pnl_Rank_Order_By>>;
  where?: InputMaybe<Account_Pnl_Rank_Bool_Exp>;
};


export type Subscription_RootGet_Pnl_LeaderboardArgs = {
  args?: InputMaybe<Get_Pnl_Leaderboard_Args>;
  distinct_on?: InputMaybe<Array<Pnl_Leaderboard_Entry_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Pnl_Leaderboard_Entry_Order_By>>;
  where?: InputMaybe<Pnl_Leaderboard_Entry_Bool_Exp>;
};


export type Subscription_RootGet_Pnl_Leaderboard_AggregateArgs = {
  args?: InputMaybe<Get_Pnl_Leaderboard_Args>;
  distinct_on?: InputMaybe<Array<Pnl_Leaderboard_Entry_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Pnl_Leaderboard_Entry_Order_By>>;
  where?: InputMaybe<Pnl_Leaderboard_Entry_Bool_Exp>;
};


export type Subscription_RootGet_Pnl_Leaderboard_StatsArgs = {
  args?: InputMaybe<Get_Pnl_Leaderboard_Stats_Args>;
  distinct_on?: InputMaybe<Array<Pnl_Leaderboard_Stats_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Pnl_Leaderboard_Stats_Order_By>>;
  where?: InputMaybe<Pnl_Leaderboard_Stats_Bool_Exp>;
};


export type Subscription_RootGet_Pnl_Leaderboard_Stats_AggregateArgs = {
  args?: InputMaybe<Get_Pnl_Leaderboard_Stats_Args>;
  distinct_on?: InputMaybe<Array<Pnl_Leaderboard_Stats_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Pnl_Leaderboard_Stats_Order_By>>;
  where?: InputMaybe<Pnl_Leaderboard_Stats_Bool_Exp>;
};


export type Subscription_RootGet_Vault_LeaderboardArgs = {
  args: Get_Vault_Leaderboard_Args;
  distinct_on?: InputMaybe<Array<Pnl_Leaderboard_Entry_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Pnl_Leaderboard_Entry_Order_By>>;
  where?: InputMaybe<Pnl_Leaderboard_Entry_Bool_Exp>;
};


export type Subscription_RootGet_Vault_Leaderboard_AggregateArgs = {
  args: Get_Vault_Leaderboard_Args;
  distinct_on?: InputMaybe<Array<Pnl_Leaderboard_Entry_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Pnl_Leaderboard_Entry_Order_By>>;
  where?: InputMaybe<Pnl_Leaderboard_Entry_Bool_Exp>;
};


export type Subscription_RootJson_ObjectArgs = {
  id: Scalars['String']['input'];
};


export type Subscription_RootJson_ObjectsArgs = {
  distinct_on?: InputMaybe<Array<Json_Objects_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Json_Objects_Order_By>>;
  where?: InputMaybe<Json_Objects_Bool_Exp>;
};


export type Subscription_RootJson_Objects_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Json_Objects_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Json_Objects_Order_By>>;
  where?: InputMaybe<Json_Objects_Bool_Exp>;
};


export type Subscription_RootJson_Objects_StreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<Json_Objects_Stream_Cursor_Input>>;
  where?: InputMaybe<Json_Objects_Bool_Exp>;
};


export type Subscription_RootOrganizationArgs = {
  id: Scalars['String']['input'];
};


export type Subscription_RootOrganizationsArgs = {
  distinct_on?: InputMaybe<Array<Organizations_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Organizations_Order_By>>;
  where?: InputMaybe<Organizations_Bool_Exp>;
};


export type Subscription_RootOrganizations_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Organizations_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Organizations_Order_By>>;
  where?: InputMaybe<Organizations_Bool_Exp>;
};


export type Subscription_RootOrganizations_StreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<Organizations_Stream_Cursor_Input>>;
  where?: InputMaybe<Organizations_Bool_Exp>;
};


export type Subscription_RootPersonArgs = {
  id: Scalars['String']['input'];
};


export type Subscription_RootPersonsArgs = {
  distinct_on?: InputMaybe<Array<Persons_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Persons_Order_By>>;
  where?: InputMaybe<Persons_Bool_Exp>;
};


export type Subscription_RootPersons_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Persons_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Persons_Order_By>>;
  where?: InputMaybe<Persons_Bool_Exp>;
};


export type Subscription_RootPersons_StreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<Persons_Stream_Cursor_Input>>;
  where?: InputMaybe<Persons_Bool_Exp>;
};


export type Subscription_RootPnl_Leaderboard_EntryArgs = {
  distinct_on?: InputMaybe<Array<Pnl_Leaderboard_Entry_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Pnl_Leaderboard_Entry_Order_By>>;
  where?: InputMaybe<Pnl_Leaderboard_Entry_Bool_Exp>;
};


export type Subscription_RootPnl_Leaderboard_Entry_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Pnl_Leaderboard_Entry_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Pnl_Leaderboard_Entry_Order_By>>;
  where?: InputMaybe<Pnl_Leaderboard_Entry_Bool_Exp>;
};


export type Subscription_RootPnl_Leaderboard_Entry_StreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<Pnl_Leaderboard_Entry_Stream_Cursor_Input>>;
  where?: InputMaybe<Pnl_Leaderboard_Entry_Bool_Exp>;
};


export type Subscription_RootPnl_Leaderboard_StatsArgs = {
  distinct_on?: InputMaybe<Array<Pnl_Leaderboard_Stats_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Pnl_Leaderboard_Stats_Order_By>>;
  where?: InputMaybe<Pnl_Leaderboard_Stats_Bool_Exp>;
};


export type Subscription_RootPnl_Leaderboard_Stats_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Pnl_Leaderboard_Stats_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Pnl_Leaderboard_Stats_Order_By>>;
  where?: InputMaybe<Pnl_Leaderboard_Stats_Bool_Exp>;
};


export type Subscription_RootPnl_Leaderboard_Stats_StreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<Pnl_Leaderboard_Stats_Stream_Cursor_Input>>;
  where?: InputMaybe<Pnl_Leaderboard_Stats_Bool_Exp>;
};


export type Subscription_RootPositionArgs = {
  id: Scalars['String']['input'];
};


export type Subscription_RootPosition_Change_DailyArgs = {
  distinct_on?: InputMaybe<Array<Position_Change_Daily_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Position_Change_Daily_Order_By>>;
  where?: InputMaybe<Position_Change_Daily_Bool_Exp>;
};


export type Subscription_RootPosition_Change_Daily_StreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<Position_Change_Daily_Stream_Cursor_Input>>;
  where?: InputMaybe<Position_Change_Daily_Bool_Exp>;
};


export type Subscription_RootPosition_Change_HourlyArgs = {
  distinct_on?: InputMaybe<Array<Position_Change_Hourly_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Position_Change_Hourly_Order_By>>;
  where?: InputMaybe<Position_Change_Hourly_Bool_Exp>;
};


export type Subscription_RootPosition_Change_Hourly_StreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<Position_Change_Hourly_Stream_Cursor_Input>>;
  where?: InputMaybe<Position_Change_Hourly_Bool_Exp>;
};


export type Subscription_RootPosition_ChangesArgs = {
  distinct_on?: InputMaybe<Array<Position_Changes_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Position_Changes_Order_By>>;
  where?: InputMaybe<Position_Changes_Bool_Exp>;
};


export type Subscription_RootPosition_Changes_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Position_Changes_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Position_Changes_Order_By>>;
  where?: InputMaybe<Position_Changes_Bool_Exp>;
};


export type Subscription_RootPosition_Changes_StreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<Position_Changes_Stream_Cursor_Input>>;
  where?: InputMaybe<Position_Changes_Bool_Exp>;
};


export type Subscription_RootPositionsArgs = {
  distinct_on?: InputMaybe<Array<Positions_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Positions_Order_By>>;
  where?: InputMaybe<Positions_Bool_Exp>;
};


export type Subscription_RootPositions_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Positions_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Positions_Order_By>>;
  where?: InputMaybe<Positions_Bool_Exp>;
};


export type Subscription_RootPositions_From_FollowingArgs = {
  args: Positions_From_Following_Args;
  distinct_on?: InputMaybe<Array<Positions_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Positions_Order_By>>;
  where?: InputMaybe<Positions_Bool_Exp>;
};


export type Subscription_RootPositions_From_Following_AggregateArgs = {
  args: Positions_From_Following_Args;
  distinct_on?: InputMaybe<Array<Positions_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Positions_Order_By>>;
  where?: InputMaybe<Positions_Bool_Exp>;
};


export type Subscription_RootPositions_StreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<Positions_Stream_Cursor_Input>>;
  where?: InputMaybe<Positions_Bool_Exp>;
};


export type Subscription_RootPositions_With_ValueArgs = {
  distinct_on?: InputMaybe<Array<Positions_With_Value_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Positions_With_Value_Order_By>>;
  where?: InputMaybe<Positions_With_Value_Bool_Exp>;
};


export type Subscription_RootPositions_With_Value_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Positions_With_Value_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Positions_With_Value_Order_By>>;
  where?: InputMaybe<Positions_With_Value_Bool_Exp>;
};


export type Subscription_RootPositions_With_Value_StreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<Positions_With_Value_Stream_Cursor_Input>>;
  where?: InputMaybe<Positions_With_Value_Bool_Exp>;
};


export type Subscription_RootPredicate_ObjectsArgs = {
  distinct_on?: InputMaybe<Array<Predicate_Objects_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Predicate_Objects_Order_By>>;
  where?: InputMaybe<Predicate_Objects_Bool_Exp>;
};


export type Subscription_RootPredicate_Objects_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Predicate_Objects_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Predicate_Objects_Order_By>>;
  where?: InputMaybe<Predicate_Objects_Bool_Exp>;
};


export type Subscription_RootPredicate_Objects_By_PkArgs = {
  object_id: Scalars['String']['input'];
  predicate_id: Scalars['String']['input'];
};


export type Subscription_RootPredicate_Objects_StreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<Predicate_Objects_Stream_Cursor_Input>>;
  where?: InputMaybe<Predicate_Objects_Bool_Exp>;
};


export type Subscription_RootProtocol_Fee_AccrualsArgs = {
  distinct_on?: InputMaybe<Array<Protocol_Fee_Accruals_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Protocol_Fee_Accruals_Order_By>>;
  where?: InputMaybe<Protocol_Fee_Accruals_Bool_Exp>;
};


export type Subscription_RootProtocol_Fee_Accruals_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Protocol_Fee_Accruals_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Protocol_Fee_Accruals_Order_By>>;
  where?: InputMaybe<Protocol_Fee_Accruals_Bool_Exp>;
};


export type Subscription_RootProtocol_Fee_Accruals_StreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<Protocol_Fee_Accruals_Stream_Cursor_Input>>;
  where?: InputMaybe<Protocol_Fee_Accruals_Bool_Exp>;
};


export type Subscription_RootProtocol_Fee_AccruedArgs = {
  id: Scalars['String']['input'];
};


export type Subscription_RootRedemptionArgs = {
  id: Scalars['String']['input'];
};


export type Subscription_RootRedemptionsArgs = {
  distinct_on?: InputMaybe<Array<Redemptions_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Redemptions_Order_By>>;
  where?: InputMaybe<Redemptions_Bool_Exp>;
};


export type Subscription_RootRedemptions_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Redemptions_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Redemptions_Order_By>>;
  where?: InputMaybe<Redemptions_Bool_Exp>;
};


export type Subscription_RootRedemptions_StreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<Redemptions_Stream_Cursor_Input>>;
  where?: InputMaybe<Redemptions_Bool_Exp>;
};


export type Subscription_RootSearch_Positions_On_SubjectArgs = {
  args: Search_Positions_On_Subject_Args;
  distinct_on?: InputMaybe<Array<Positions_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Positions_Order_By>>;
  where?: InputMaybe<Positions_Bool_Exp>;
};


export type Subscription_RootSearch_Positions_On_Subject_AggregateArgs = {
  args: Search_Positions_On_Subject_Args;
  distinct_on?: InputMaybe<Array<Positions_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Positions_Order_By>>;
  where?: InputMaybe<Positions_Bool_Exp>;
};


export type Subscription_RootSearch_TermArgs = {
  args: Search_Term_Args;
  distinct_on?: InputMaybe<Array<Terms_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Terms_Order_By>>;
  where?: InputMaybe<Terms_Bool_Exp>;
};


export type Subscription_RootSearch_Term_AggregateArgs = {
  args: Search_Term_Args;
  distinct_on?: InputMaybe<Array<Terms_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Terms_Order_By>>;
  where?: InputMaybe<Terms_Bool_Exp>;
};


export type Subscription_RootSearch_Term_From_FollowingArgs = {
  args: Search_Term_From_Following_Args;
  distinct_on?: InputMaybe<Array<Terms_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Terms_Order_By>>;
  where?: InputMaybe<Terms_Bool_Exp>;
};


export type Subscription_RootSearch_Term_From_Following_AggregateArgs = {
  args: Search_Term_From_Following_Args;
  distinct_on?: InputMaybe<Array<Terms_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Terms_Order_By>>;
  where?: InputMaybe<Terms_Bool_Exp>;
};


export type Subscription_RootSearch_Term_TsvectorArgs = {
  args: Search_Term_Tsvector_Args;
  distinct_on?: InputMaybe<Array<Terms_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Terms_Order_By>>;
  where?: InputMaybe<Terms_Bool_Exp>;
};


export type Subscription_RootSearch_Term_Tsvector_AggregateArgs = {
  args: Search_Term_Tsvector_Args;
  distinct_on?: InputMaybe<Array<Terms_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Terms_Order_By>>;
  where?: InputMaybe<Terms_Bool_Exp>;
};


export type Subscription_RootSeason2_EpochArgs = {
  epoch: Scalars['Int']['input'];
};


export type Subscription_RootSeason2_Epoch_PriceArgs = {
  epoch: Scalars['Int']['input'];
};


export type Subscription_RootSeason2_Epoch_PricesArgs = {
  distinct_on?: InputMaybe<Array<Season2_Epoch_Prices_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Season2_Epoch_Prices_Order_By>>;
  where?: InputMaybe<Season2_Epoch_Prices_Bool_Exp>;
};


export type Subscription_RootSeason2_Epoch_Prices_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Season2_Epoch_Prices_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Season2_Epoch_Prices_Order_By>>;
  where?: InputMaybe<Season2_Epoch_Prices_Bool_Exp>;
};


export type Subscription_RootSeason2_Epoch_Prices_StreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<Season2_Epoch_Prices_Stream_Cursor_Input>>;
  where?: InputMaybe<Season2_Epoch_Prices_Bool_Exp>;
};


export type Subscription_RootSeason2_EpochsArgs = {
  distinct_on?: InputMaybe<Array<Season2_Epochs_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Season2_Epochs_Order_By>>;
  where?: InputMaybe<Season2_Epochs_Bool_Exp>;
};


export type Subscription_RootSeason2_Epochs_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Season2_Epochs_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Season2_Epochs_Order_By>>;
  where?: InputMaybe<Season2_Epochs_Bool_Exp>;
};


export type Subscription_RootSeason2_Epochs_StreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<Season2_Epochs_Stream_Cursor_Input>>;
  where?: InputMaybe<Season2_Epochs_Bool_Exp>;
};


export type Subscription_RootSeason2_Iq_LedgerArgs = {
  id: Scalars['bigint']['input'];
};


export type Subscription_RootSeason2_Iq_Ledger_EntriesArgs = {
  distinct_on?: InputMaybe<Array<Season2_Iq_Ledger_Entries_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Season2_Iq_Ledger_Entries_Order_By>>;
  where?: InputMaybe<Season2_Iq_Ledger_Entries_Bool_Exp>;
};


export type Subscription_RootSeason2_Iq_Ledger_Entries_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Season2_Iq_Ledger_Entries_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Season2_Iq_Ledger_Entries_Order_By>>;
  where?: InputMaybe<Season2_Iq_Ledger_Entries_Bool_Exp>;
};


export type Subscription_RootSeason2_Iq_Ledger_Entries_StreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<Season2_Iq_Ledger_Entries_Stream_Cursor_Input>>;
  where?: InputMaybe<Season2_Iq_Ledger_Entries_Bool_Exp>;
};


export type Subscription_RootSeason2_Leaderboard_PayoutArgs = {
  rank: Scalars['Int']['input'];
};


export type Subscription_RootSeason2_Leaderboard_PayoutsArgs = {
  distinct_on?: InputMaybe<Array<Season2_Leaderboard_Payouts_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Season2_Leaderboard_Payouts_Order_By>>;
  where?: InputMaybe<Season2_Leaderboard_Payouts_Bool_Exp>;
};


export type Subscription_RootSeason2_Leaderboard_Payouts_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Season2_Leaderboard_Payouts_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Season2_Leaderboard_Payouts_Order_By>>;
  where?: InputMaybe<Season2_Leaderboard_Payouts_Bool_Exp>;
};


export type Subscription_RootSeason2_Leaderboard_Payouts_StreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<Season2_Leaderboard_Payouts_Stream_Cursor_Input>>;
  where?: InputMaybe<Season2_Leaderboard_Payouts_Bool_Exp>;
};


export type Subscription_RootSeason2_Trust_Price_SnapshotArgs = {
  snapshot_at: Scalars['timestamptz']['input'];
};


export type Subscription_RootSeason2_Trust_Price_SnapshotsArgs = {
  distinct_on?: InputMaybe<Array<Season2_Trust_Price_Snapshots_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Season2_Trust_Price_Snapshots_Order_By>>;
  where?: InputMaybe<Season2_Trust_Price_Snapshots_Bool_Exp>;
};


export type Subscription_RootSeason2_Trust_Price_Snapshots_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Season2_Trust_Price_Snapshots_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Season2_Trust_Price_Snapshots_Order_By>>;
  where?: InputMaybe<Season2_Trust_Price_Snapshots_Bool_Exp>;
};


export type Subscription_RootSeason2_Trust_Price_Snapshots_StreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<Season2_Trust_Price_Snapshots_Stream_Cursor_Input>>;
  where?: InputMaybe<Season2_Trust_Price_Snapshots_Bool_Exp>;
};


export type Subscription_RootShare_Price_Change_Stats_DailyArgs = {
  distinct_on?: InputMaybe<Array<Share_Price_Change_Stats_Daily_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Share_Price_Change_Stats_Daily_Order_By>>;
  where?: InputMaybe<Share_Price_Change_Stats_Daily_Bool_Exp>;
};


export type Subscription_RootShare_Price_Change_Stats_Daily_StreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<Share_Price_Change_Stats_Daily_Stream_Cursor_Input>>;
  where?: InputMaybe<Share_Price_Change_Stats_Daily_Bool_Exp>;
};


export type Subscription_RootShare_Price_Change_Stats_HourlyArgs = {
  distinct_on?: InputMaybe<Array<Share_Price_Change_Stats_Hourly_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Share_Price_Change_Stats_Hourly_Order_By>>;
  where?: InputMaybe<Share_Price_Change_Stats_Hourly_Bool_Exp>;
};


export type Subscription_RootShare_Price_Change_Stats_Hourly_StreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<Share_Price_Change_Stats_Hourly_Stream_Cursor_Input>>;
  where?: InputMaybe<Share_Price_Change_Stats_Hourly_Bool_Exp>;
};


export type Subscription_RootShare_Price_Change_Stats_MonthlyArgs = {
  distinct_on?: InputMaybe<Array<Share_Price_Change_Stats_Monthly_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Share_Price_Change_Stats_Monthly_Order_By>>;
  where?: InputMaybe<Share_Price_Change_Stats_Monthly_Bool_Exp>;
};


export type Subscription_RootShare_Price_Change_Stats_Monthly_StreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<Share_Price_Change_Stats_Monthly_Stream_Cursor_Input>>;
  where?: InputMaybe<Share_Price_Change_Stats_Monthly_Bool_Exp>;
};


export type Subscription_RootShare_Price_Change_Stats_WeeklyArgs = {
  distinct_on?: InputMaybe<Array<Share_Price_Change_Stats_Weekly_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Share_Price_Change_Stats_Weekly_Order_By>>;
  where?: InputMaybe<Share_Price_Change_Stats_Weekly_Bool_Exp>;
};


export type Subscription_RootShare_Price_Change_Stats_Weekly_StreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<Share_Price_Change_Stats_Weekly_Stream_Cursor_Input>>;
  where?: InputMaybe<Share_Price_Change_Stats_Weekly_Bool_Exp>;
};


export type Subscription_RootShare_Price_ChangesArgs = {
  distinct_on?: InputMaybe<Array<Share_Price_Changes_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Share_Price_Changes_Order_By>>;
  where?: InputMaybe<Share_Price_Changes_Bool_Exp>;
};


export type Subscription_RootShare_Price_Changes_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Share_Price_Changes_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Share_Price_Changes_Order_By>>;
  where?: InputMaybe<Share_Price_Changes_Bool_Exp>;
};


export type Subscription_RootShare_Price_Changes_StreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<Share_Price_Changes_Stream_Cursor_Input>>;
  where?: InputMaybe<Share_Price_Changes_Bool_Exp>;
};


export type Subscription_RootSignal_Stats_DailyArgs = {
  distinct_on?: InputMaybe<Array<Signal_Stats_Daily_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Signal_Stats_Daily_Order_By>>;
  where?: InputMaybe<Signal_Stats_Daily_Bool_Exp>;
};


export type Subscription_RootSignal_Stats_Daily_StreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<Signal_Stats_Daily_Stream_Cursor_Input>>;
  where?: InputMaybe<Signal_Stats_Daily_Bool_Exp>;
};


export type Subscription_RootSignal_Stats_HourlyArgs = {
  distinct_on?: InputMaybe<Array<Signal_Stats_Hourly_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Signal_Stats_Hourly_Order_By>>;
  where?: InputMaybe<Signal_Stats_Hourly_Bool_Exp>;
};


export type Subscription_RootSignal_Stats_Hourly_StreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<Signal_Stats_Hourly_Stream_Cursor_Input>>;
  where?: InputMaybe<Signal_Stats_Hourly_Bool_Exp>;
};


export type Subscription_RootSignal_Stats_MonthlyArgs = {
  distinct_on?: InputMaybe<Array<Signal_Stats_Monthly_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Signal_Stats_Monthly_Order_By>>;
  where?: InputMaybe<Signal_Stats_Monthly_Bool_Exp>;
};


export type Subscription_RootSignal_Stats_Monthly_StreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<Signal_Stats_Monthly_Stream_Cursor_Input>>;
  where?: InputMaybe<Signal_Stats_Monthly_Bool_Exp>;
};


export type Subscription_RootSignal_Stats_WeeklyArgs = {
  distinct_on?: InputMaybe<Array<Signal_Stats_Weekly_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Signal_Stats_Weekly_Order_By>>;
  where?: InputMaybe<Signal_Stats_Weekly_Bool_Exp>;
};


export type Subscription_RootSignal_Stats_Weekly_StreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<Signal_Stats_Weekly_Stream_Cursor_Input>>;
  where?: InputMaybe<Signal_Stats_Weekly_Bool_Exp>;
};


export type Subscription_RootSignalsArgs = {
  distinct_on?: InputMaybe<Array<Signals_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Signals_Order_By>>;
  where?: InputMaybe<Signals_Bool_Exp>;
};


export type Subscription_RootSignals_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Signals_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Signals_Order_By>>;
  where?: InputMaybe<Signals_Bool_Exp>;
};


export type Subscription_RootSignals_From_FollowingArgs = {
  args: Signals_From_Following_Args;
  distinct_on?: InputMaybe<Array<Signals_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Signals_Order_By>>;
  where?: InputMaybe<Signals_Bool_Exp>;
};


export type Subscription_RootSignals_From_Following_AggregateArgs = {
  args: Signals_From_Following_Args;
  distinct_on?: InputMaybe<Array<Signals_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Signals_Order_By>>;
  where?: InputMaybe<Signals_Bool_Exp>;
};


export type Subscription_RootSignals_StreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<Signals_Stream_Cursor_Input>>;
  where?: InputMaybe<Signals_Bool_Exp>;
};


export type Subscription_RootStatArgs = {
  id: Scalars['Int']['input'];
};


export type Subscription_RootStatHourArgs = {
  id: Scalars['Int']['input'];
};


export type Subscription_RootStatHoursArgs = {
  distinct_on?: InputMaybe<Array<StatHours_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<StatHours_Order_By>>;
  where?: InputMaybe<StatHours_Bool_Exp>;
};


export type Subscription_RootStatHours_StreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<StatHours_Stream_Cursor_Input>>;
  where?: InputMaybe<StatHours_Bool_Exp>;
};


export type Subscription_RootStatsArgs = {
  distinct_on?: InputMaybe<Array<Stats_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Stats_Order_By>>;
  where?: InputMaybe<Stats_Bool_Exp>;
};


export type Subscription_RootStats_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Stats_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Stats_Order_By>>;
  where?: InputMaybe<Stats_Bool_Exp>;
};


export type Subscription_RootStats_StreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<Stats_Stream_Cursor_Input>>;
  where?: InputMaybe<Stats_Bool_Exp>;
};


export type Subscription_RootSubject_PredicatesArgs = {
  distinct_on?: InputMaybe<Array<Subject_Predicates_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Subject_Predicates_Order_By>>;
  where?: InputMaybe<Subject_Predicates_Bool_Exp>;
};


export type Subscription_RootSubject_Predicates_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Subject_Predicates_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Subject_Predicates_Order_By>>;
  where?: InputMaybe<Subject_Predicates_Bool_Exp>;
};


export type Subscription_RootSubject_Predicates_By_PkArgs = {
  predicate_id: Scalars['String']['input'];
  subject_id: Scalars['String']['input'];
};


export type Subscription_RootSubject_Predicates_StreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<Subject_Predicates_Stream_Cursor_Input>>;
  where?: InputMaybe<Subject_Predicates_Bool_Exp>;
};


export type Subscription_RootTermArgs = {
  id: Scalars['String']['input'];
};


export type Subscription_RootTerm_Total_State_Change_Stats_DailyArgs = {
  distinct_on?: InputMaybe<Array<Term_Total_State_Change_Stats_Daily_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Term_Total_State_Change_Stats_Daily_Order_By>>;
  where?: InputMaybe<Term_Total_State_Change_Stats_Daily_Bool_Exp>;
};


export type Subscription_RootTerm_Total_State_Change_Stats_Daily_StreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<Term_Total_State_Change_Stats_Daily_Stream_Cursor_Input>>;
  where?: InputMaybe<Term_Total_State_Change_Stats_Daily_Bool_Exp>;
};


export type Subscription_RootTerm_Total_State_Change_Stats_HourlyArgs = {
  distinct_on?: InputMaybe<Array<Term_Total_State_Change_Stats_Hourly_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Term_Total_State_Change_Stats_Hourly_Order_By>>;
  where?: InputMaybe<Term_Total_State_Change_Stats_Hourly_Bool_Exp>;
};


export type Subscription_RootTerm_Total_State_Change_Stats_Hourly_StreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<Term_Total_State_Change_Stats_Hourly_Stream_Cursor_Input>>;
  where?: InputMaybe<Term_Total_State_Change_Stats_Hourly_Bool_Exp>;
};


export type Subscription_RootTerm_Total_State_Change_Stats_MonthlyArgs = {
  distinct_on?: InputMaybe<Array<Term_Total_State_Change_Stats_Monthly_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Term_Total_State_Change_Stats_Monthly_Order_By>>;
  where?: InputMaybe<Term_Total_State_Change_Stats_Monthly_Bool_Exp>;
};


export type Subscription_RootTerm_Total_State_Change_Stats_Monthly_StreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<Term_Total_State_Change_Stats_Monthly_Stream_Cursor_Input>>;
  where?: InputMaybe<Term_Total_State_Change_Stats_Monthly_Bool_Exp>;
};


export type Subscription_RootTerm_Total_State_Change_Stats_WeeklyArgs = {
  distinct_on?: InputMaybe<Array<Term_Total_State_Change_Stats_Weekly_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Term_Total_State_Change_Stats_Weekly_Order_By>>;
  where?: InputMaybe<Term_Total_State_Change_Stats_Weekly_Bool_Exp>;
};


export type Subscription_RootTerm_Total_State_Change_Stats_Weekly_StreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<Term_Total_State_Change_Stats_Weekly_Stream_Cursor_Input>>;
  where?: InputMaybe<Term_Total_State_Change_Stats_Weekly_Bool_Exp>;
};


export type Subscription_RootTerm_Total_State_ChangesArgs = {
  distinct_on?: InputMaybe<Array<Term_Total_State_Changes_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Term_Total_State_Changes_Order_By>>;
  where?: InputMaybe<Term_Total_State_Changes_Bool_Exp>;
};


export type Subscription_RootTerm_Total_State_Changes_StreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<Term_Total_State_Changes_Stream_Cursor_Input>>;
  where?: InputMaybe<Term_Total_State_Changes_Bool_Exp>;
};


export type Subscription_RootTermsArgs = {
  distinct_on?: InputMaybe<Array<Terms_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Terms_Order_By>>;
  where?: InputMaybe<Terms_Bool_Exp>;
};


export type Subscription_RootTerms_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Terms_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Terms_Order_By>>;
  where?: InputMaybe<Terms_Bool_Exp>;
};


export type Subscription_RootTerms_StreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<Terms_Stream_Cursor_Input>>;
  where?: InputMaybe<Terms_Bool_Exp>;
};


export type Subscription_RootText_ObjectArgs = {
  id: Scalars['String']['input'];
};


export type Subscription_RootText_ObjectsArgs = {
  distinct_on?: InputMaybe<Array<Text_Objects_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Text_Objects_Order_By>>;
  where?: InputMaybe<Text_Objects_Bool_Exp>;
};


export type Subscription_RootText_Objects_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Text_Objects_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Text_Objects_Order_By>>;
  where?: InputMaybe<Text_Objects_Bool_Exp>;
};


export type Subscription_RootText_Objects_StreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<Text_Objects_Stream_Cursor_Input>>;
  where?: InputMaybe<Text_Objects_Bool_Exp>;
};


export type Subscription_RootThingArgs = {
  id: Scalars['String']['input'];
};


export type Subscription_RootThingsArgs = {
  distinct_on?: InputMaybe<Array<Things_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Things_Order_By>>;
  where?: InputMaybe<Things_Bool_Exp>;
};


export type Subscription_RootThings_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Things_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Things_Order_By>>;
  where?: InputMaybe<Things_Bool_Exp>;
};


export type Subscription_RootThings_StreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<Things_Stream_Cursor_Input>>;
  where?: InputMaybe<Things_Bool_Exp>;
};


export type Subscription_RootTripleArgs = {
  term_id: Scalars['String']['input'];
};


export type Subscription_RootTriple_TermArgs = {
  term_id: Scalars['String']['input'];
};


export type Subscription_RootTriple_Term_StreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<Triple_Term_Stream_Cursor_Input>>;
  where?: InputMaybe<Triple_Term_Bool_Exp>;
};


export type Subscription_RootTriple_TermsArgs = {
  distinct_on?: InputMaybe<Array<Triple_Term_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Triple_Term_Order_By>>;
  where?: InputMaybe<Triple_Term_Bool_Exp>;
};


export type Subscription_RootTriple_VaultArgs = {
  curve_id: Scalars['numeric']['input'];
  term_id: Scalars['String']['input'];
};


export type Subscription_RootTriple_Vault_StreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<Triple_Vault_Stream_Cursor_Input>>;
  where?: InputMaybe<Triple_Vault_Bool_Exp>;
};


export type Subscription_RootTriple_VaultsArgs = {
  distinct_on?: InputMaybe<Array<Triple_Vault_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Triple_Vault_Order_By>>;
  where?: InputMaybe<Triple_Vault_Bool_Exp>;
};


export type Subscription_RootTriplesArgs = {
  distinct_on?: InputMaybe<Array<Triples_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Triples_Order_By>>;
  where?: InputMaybe<Triples_Bool_Exp>;
};


export type Subscription_RootTriples_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Triples_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Triples_Order_By>>;
  where?: InputMaybe<Triples_Bool_Exp>;
};


export type Subscription_RootTriples_StreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<Triples_Stream_Cursor_Input>>;
  where?: InputMaybe<Triples_Bool_Exp>;
};


export type Subscription_RootVaultArgs = {
  curve_id: Scalars['numeric']['input'];
  term_id: Scalars['String']['input'];
};


export type Subscription_RootVaultsArgs = {
  distinct_on?: InputMaybe<Array<Vaults_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Vaults_Order_By>>;
  where?: InputMaybe<Vaults_Bool_Exp>;
};


export type Subscription_RootVaults_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Vaults_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Vaults_Order_By>>;
  where?: InputMaybe<Vaults_Bool_Exp>;
};


export type Subscription_RootVaults_StreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<Vaults_Stream_Cursor_Input>>;
  where?: InputMaybe<Vaults_Bool_Exp>;
};

/** Daily market cap statistics rolled up from hourly stats for historical trending. */
export type Term_Total_State_Change_Stats_Daily = {
  __typename?: 'term_total_state_change_stats_daily';
  bucket?: Maybe<Scalars['timestamptz']['output']>;
  difference?: Maybe<Scalars['numeric']['output']>;
  first_total_market_cap?: Maybe<Scalars['numeric']['output']>;
  last_total_market_cap?: Maybe<Scalars['numeric']['output']>;
  term_id?: Maybe<Scalars['String']['output']>;
};

/** order by aggregate values of table "term_total_state_change_stats_daily" */
export type Term_Total_State_Change_Stats_Daily_Aggregate_Order_By = {
  avg?: InputMaybe<Term_Total_State_Change_Stats_Daily_Avg_Order_By>;
  count?: InputMaybe<Order_By>;
  max?: InputMaybe<Term_Total_State_Change_Stats_Daily_Max_Order_By>;
  min?: InputMaybe<Term_Total_State_Change_Stats_Daily_Min_Order_By>;
  stddev?: InputMaybe<Term_Total_State_Change_Stats_Daily_Stddev_Order_By>;
  stddev_pop?: InputMaybe<Term_Total_State_Change_Stats_Daily_Stddev_Pop_Order_By>;
  stddev_samp?: InputMaybe<Term_Total_State_Change_Stats_Daily_Stddev_Samp_Order_By>;
  sum?: InputMaybe<Term_Total_State_Change_Stats_Daily_Sum_Order_By>;
  var_pop?: InputMaybe<Term_Total_State_Change_Stats_Daily_Var_Pop_Order_By>;
  var_samp?: InputMaybe<Term_Total_State_Change_Stats_Daily_Var_Samp_Order_By>;
  variance?: InputMaybe<Term_Total_State_Change_Stats_Daily_Variance_Order_By>;
};

/** order by avg() on columns of table "term_total_state_change_stats_daily" */
export type Term_Total_State_Change_Stats_Daily_Avg_Order_By = {
  difference?: InputMaybe<Order_By>;
  first_total_market_cap?: InputMaybe<Order_By>;
  last_total_market_cap?: InputMaybe<Order_By>;
};

/** Boolean expression to filter rows from the table "term_total_state_change_stats_daily". All fields are combined with a logical 'AND'. */
export type Term_Total_State_Change_Stats_Daily_Bool_Exp = {
  _and?: InputMaybe<Array<Term_Total_State_Change_Stats_Daily_Bool_Exp>>;
  _not?: InputMaybe<Term_Total_State_Change_Stats_Daily_Bool_Exp>;
  _or?: InputMaybe<Array<Term_Total_State_Change_Stats_Daily_Bool_Exp>>;
  bucket?: InputMaybe<Timestamptz_Comparison_Exp>;
  difference?: InputMaybe<Numeric_Comparison_Exp>;
  first_total_market_cap?: InputMaybe<Numeric_Comparison_Exp>;
  last_total_market_cap?: InputMaybe<Numeric_Comparison_Exp>;
  term_id?: InputMaybe<String_Comparison_Exp>;
};

/** order by max() on columns of table "term_total_state_change_stats_daily" */
export type Term_Total_State_Change_Stats_Daily_Max_Order_By = {
  bucket?: InputMaybe<Order_By>;
  difference?: InputMaybe<Order_By>;
  first_total_market_cap?: InputMaybe<Order_By>;
  last_total_market_cap?: InputMaybe<Order_By>;
  term_id?: InputMaybe<Order_By>;
};

/** order by min() on columns of table "term_total_state_change_stats_daily" */
export type Term_Total_State_Change_Stats_Daily_Min_Order_By = {
  bucket?: InputMaybe<Order_By>;
  difference?: InputMaybe<Order_By>;
  first_total_market_cap?: InputMaybe<Order_By>;
  last_total_market_cap?: InputMaybe<Order_By>;
  term_id?: InputMaybe<Order_By>;
};

/** Ordering options when selecting data from "term_total_state_change_stats_daily". */
export type Term_Total_State_Change_Stats_Daily_Order_By = {
  bucket?: InputMaybe<Order_By>;
  difference?: InputMaybe<Order_By>;
  first_total_market_cap?: InputMaybe<Order_By>;
  last_total_market_cap?: InputMaybe<Order_By>;
  term_id?: InputMaybe<Order_By>;
};

/** select columns of table "term_total_state_change_stats_daily" */
export type Term_Total_State_Change_Stats_Daily_Select_Column =
  /** column name */
  | 'bucket'
  /** column name */
  | 'difference'
  /** column name */
  | 'first_total_market_cap'
  /** column name */
  | 'last_total_market_cap'
  /** column name */
  | 'term_id';

/** order by stddev() on columns of table "term_total_state_change_stats_daily" */
export type Term_Total_State_Change_Stats_Daily_Stddev_Order_By = {
  difference?: InputMaybe<Order_By>;
  first_total_market_cap?: InputMaybe<Order_By>;
  last_total_market_cap?: InputMaybe<Order_By>;
};

/** order by stddev_pop() on columns of table "term_total_state_change_stats_daily" */
export type Term_Total_State_Change_Stats_Daily_Stddev_Pop_Order_By = {
  difference?: InputMaybe<Order_By>;
  first_total_market_cap?: InputMaybe<Order_By>;
  last_total_market_cap?: InputMaybe<Order_By>;
};

/** order by stddev_samp() on columns of table "term_total_state_change_stats_daily" */
export type Term_Total_State_Change_Stats_Daily_Stddev_Samp_Order_By = {
  difference?: InputMaybe<Order_By>;
  first_total_market_cap?: InputMaybe<Order_By>;
  last_total_market_cap?: InputMaybe<Order_By>;
};

/** Streaming cursor of the table "term_total_state_change_stats_daily" */
export type Term_Total_State_Change_Stats_Daily_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Term_Total_State_Change_Stats_Daily_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Term_Total_State_Change_Stats_Daily_Stream_Cursor_Value_Input = {
  bucket?: InputMaybe<Scalars['timestamptz']['input']>;
  difference?: InputMaybe<Scalars['numeric']['input']>;
  first_total_market_cap?: InputMaybe<Scalars['numeric']['input']>;
  last_total_market_cap?: InputMaybe<Scalars['numeric']['input']>;
  term_id?: InputMaybe<Scalars['String']['input']>;
};

/** order by sum() on columns of table "term_total_state_change_stats_daily" */
export type Term_Total_State_Change_Stats_Daily_Sum_Order_By = {
  difference?: InputMaybe<Order_By>;
  first_total_market_cap?: InputMaybe<Order_By>;
  last_total_market_cap?: InputMaybe<Order_By>;
};

/** order by var_pop() on columns of table "term_total_state_change_stats_daily" */
export type Term_Total_State_Change_Stats_Daily_Var_Pop_Order_By = {
  difference?: InputMaybe<Order_By>;
  first_total_market_cap?: InputMaybe<Order_By>;
  last_total_market_cap?: InputMaybe<Order_By>;
};

/** order by var_samp() on columns of table "term_total_state_change_stats_daily" */
export type Term_Total_State_Change_Stats_Daily_Var_Samp_Order_By = {
  difference?: InputMaybe<Order_By>;
  first_total_market_cap?: InputMaybe<Order_By>;
  last_total_market_cap?: InputMaybe<Order_By>;
};

/** order by variance() on columns of table "term_total_state_change_stats_daily" */
export type Term_Total_State_Change_Stats_Daily_Variance_Order_By = {
  difference?: InputMaybe<Order_By>;
  first_total_market_cap?: InputMaybe<Order_By>;
  last_total_market_cap?: InputMaybe<Order_By>;
};

/** Hourly market cap statistics showing first, last, and difference per term using TimescaleDB continuous aggregates. */
export type Term_Total_State_Change_Stats_Hourly = {
  __typename?: 'term_total_state_change_stats_hourly';
  bucket?: Maybe<Scalars['timestamptz']['output']>;
  difference?: Maybe<Scalars['numeric']['output']>;
  first_total_market_cap?: Maybe<Scalars['numeric']['output']>;
  last_total_market_cap?: Maybe<Scalars['numeric']['output']>;
  term_id?: Maybe<Scalars['String']['output']>;
};

/** order by aggregate values of table "term_total_state_change_stats_hourly" */
export type Term_Total_State_Change_Stats_Hourly_Aggregate_Order_By = {
  avg?: InputMaybe<Term_Total_State_Change_Stats_Hourly_Avg_Order_By>;
  count?: InputMaybe<Order_By>;
  max?: InputMaybe<Term_Total_State_Change_Stats_Hourly_Max_Order_By>;
  min?: InputMaybe<Term_Total_State_Change_Stats_Hourly_Min_Order_By>;
  stddev?: InputMaybe<Term_Total_State_Change_Stats_Hourly_Stddev_Order_By>;
  stddev_pop?: InputMaybe<Term_Total_State_Change_Stats_Hourly_Stddev_Pop_Order_By>;
  stddev_samp?: InputMaybe<Term_Total_State_Change_Stats_Hourly_Stddev_Samp_Order_By>;
  sum?: InputMaybe<Term_Total_State_Change_Stats_Hourly_Sum_Order_By>;
  var_pop?: InputMaybe<Term_Total_State_Change_Stats_Hourly_Var_Pop_Order_By>;
  var_samp?: InputMaybe<Term_Total_State_Change_Stats_Hourly_Var_Samp_Order_By>;
  variance?: InputMaybe<Term_Total_State_Change_Stats_Hourly_Variance_Order_By>;
};

/** order by avg() on columns of table "term_total_state_change_stats_hourly" */
export type Term_Total_State_Change_Stats_Hourly_Avg_Order_By = {
  difference?: InputMaybe<Order_By>;
  first_total_market_cap?: InputMaybe<Order_By>;
  last_total_market_cap?: InputMaybe<Order_By>;
};

/** Boolean expression to filter rows from the table "term_total_state_change_stats_hourly". All fields are combined with a logical 'AND'. */
export type Term_Total_State_Change_Stats_Hourly_Bool_Exp = {
  _and?: InputMaybe<Array<Term_Total_State_Change_Stats_Hourly_Bool_Exp>>;
  _not?: InputMaybe<Term_Total_State_Change_Stats_Hourly_Bool_Exp>;
  _or?: InputMaybe<Array<Term_Total_State_Change_Stats_Hourly_Bool_Exp>>;
  bucket?: InputMaybe<Timestamptz_Comparison_Exp>;
  difference?: InputMaybe<Numeric_Comparison_Exp>;
  first_total_market_cap?: InputMaybe<Numeric_Comparison_Exp>;
  last_total_market_cap?: InputMaybe<Numeric_Comparison_Exp>;
  term_id?: InputMaybe<String_Comparison_Exp>;
};

/** order by max() on columns of table "term_total_state_change_stats_hourly" */
export type Term_Total_State_Change_Stats_Hourly_Max_Order_By = {
  bucket?: InputMaybe<Order_By>;
  difference?: InputMaybe<Order_By>;
  first_total_market_cap?: InputMaybe<Order_By>;
  last_total_market_cap?: InputMaybe<Order_By>;
  term_id?: InputMaybe<Order_By>;
};

/** order by min() on columns of table "term_total_state_change_stats_hourly" */
export type Term_Total_State_Change_Stats_Hourly_Min_Order_By = {
  bucket?: InputMaybe<Order_By>;
  difference?: InputMaybe<Order_By>;
  first_total_market_cap?: InputMaybe<Order_By>;
  last_total_market_cap?: InputMaybe<Order_By>;
  term_id?: InputMaybe<Order_By>;
};

/** Ordering options when selecting data from "term_total_state_change_stats_hourly". */
export type Term_Total_State_Change_Stats_Hourly_Order_By = {
  bucket?: InputMaybe<Order_By>;
  difference?: InputMaybe<Order_By>;
  first_total_market_cap?: InputMaybe<Order_By>;
  last_total_market_cap?: InputMaybe<Order_By>;
  term_id?: InputMaybe<Order_By>;
};

/** select columns of table "term_total_state_change_stats_hourly" */
export type Term_Total_State_Change_Stats_Hourly_Select_Column =
  /** column name */
  | 'bucket'
  /** column name */
  | 'difference'
  /** column name */
  | 'first_total_market_cap'
  /** column name */
  | 'last_total_market_cap'
  /** column name */
  | 'term_id';

/** order by stddev() on columns of table "term_total_state_change_stats_hourly" */
export type Term_Total_State_Change_Stats_Hourly_Stddev_Order_By = {
  difference?: InputMaybe<Order_By>;
  first_total_market_cap?: InputMaybe<Order_By>;
  last_total_market_cap?: InputMaybe<Order_By>;
};

/** order by stddev_pop() on columns of table "term_total_state_change_stats_hourly" */
export type Term_Total_State_Change_Stats_Hourly_Stddev_Pop_Order_By = {
  difference?: InputMaybe<Order_By>;
  first_total_market_cap?: InputMaybe<Order_By>;
  last_total_market_cap?: InputMaybe<Order_By>;
};

/** order by stddev_samp() on columns of table "term_total_state_change_stats_hourly" */
export type Term_Total_State_Change_Stats_Hourly_Stddev_Samp_Order_By = {
  difference?: InputMaybe<Order_By>;
  first_total_market_cap?: InputMaybe<Order_By>;
  last_total_market_cap?: InputMaybe<Order_By>;
};

/** Streaming cursor of the table "term_total_state_change_stats_hourly" */
export type Term_Total_State_Change_Stats_Hourly_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Term_Total_State_Change_Stats_Hourly_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Term_Total_State_Change_Stats_Hourly_Stream_Cursor_Value_Input = {
  bucket?: InputMaybe<Scalars['timestamptz']['input']>;
  difference?: InputMaybe<Scalars['numeric']['input']>;
  first_total_market_cap?: InputMaybe<Scalars['numeric']['input']>;
  last_total_market_cap?: InputMaybe<Scalars['numeric']['input']>;
  term_id?: InputMaybe<Scalars['String']['input']>;
};

/** order by sum() on columns of table "term_total_state_change_stats_hourly" */
export type Term_Total_State_Change_Stats_Hourly_Sum_Order_By = {
  difference?: InputMaybe<Order_By>;
  first_total_market_cap?: InputMaybe<Order_By>;
  last_total_market_cap?: InputMaybe<Order_By>;
};

/** order by var_pop() on columns of table "term_total_state_change_stats_hourly" */
export type Term_Total_State_Change_Stats_Hourly_Var_Pop_Order_By = {
  difference?: InputMaybe<Order_By>;
  first_total_market_cap?: InputMaybe<Order_By>;
  last_total_market_cap?: InputMaybe<Order_By>;
};

/** order by var_samp() on columns of table "term_total_state_change_stats_hourly" */
export type Term_Total_State_Change_Stats_Hourly_Var_Samp_Order_By = {
  difference?: InputMaybe<Order_By>;
  first_total_market_cap?: InputMaybe<Order_By>;
  last_total_market_cap?: InputMaybe<Order_By>;
};

/** order by variance() on columns of table "term_total_state_change_stats_hourly" */
export type Term_Total_State_Change_Stats_Hourly_Variance_Order_By = {
  difference?: InputMaybe<Order_By>;
  first_total_market_cap?: InputMaybe<Order_By>;
  last_total_market_cap?: InputMaybe<Order_By>;
};

/** Monthly market cap statistics rolled up from daily stats for long-term historical analysis. */
export type Term_Total_State_Change_Stats_Monthly = {
  __typename?: 'term_total_state_change_stats_monthly';
  bucket?: Maybe<Scalars['timestamptz']['output']>;
  difference?: Maybe<Scalars['numeric']['output']>;
  first_total_market_cap?: Maybe<Scalars['numeric']['output']>;
  last_total_market_cap?: Maybe<Scalars['numeric']['output']>;
  term_id?: Maybe<Scalars['String']['output']>;
};

/** order by aggregate values of table "term_total_state_change_stats_monthly" */
export type Term_Total_State_Change_Stats_Monthly_Aggregate_Order_By = {
  avg?: InputMaybe<Term_Total_State_Change_Stats_Monthly_Avg_Order_By>;
  count?: InputMaybe<Order_By>;
  max?: InputMaybe<Term_Total_State_Change_Stats_Monthly_Max_Order_By>;
  min?: InputMaybe<Term_Total_State_Change_Stats_Monthly_Min_Order_By>;
  stddev?: InputMaybe<Term_Total_State_Change_Stats_Monthly_Stddev_Order_By>;
  stddev_pop?: InputMaybe<Term_Total_State_Change_Stats_Monthly_Stddev_Pop_Order_By>;
  stddev_samp?: InputMaybe<Term_Total_State_Change_Stats_Monthly_Stddev_Samp_Order_By>;
  sum?: InputMaybe<Term_Total_State_Change_Stats_Monthly_Sum_Order_By>;
  var_pop?: InputMaybe<Term_Total_State_Change_Stats_Monthly_Var_Pop_Order_By>;
  var_samp?: InputMaybe<Term_Total_State_Change_Stats_Monthly_Var_Samp_Order_By>;
  variance?: InputMaybe<Term_Total_State_Change_Stats_Monthly_Variance_Order_By>;
};

/** order by avg() on columns of table "term_total_state_change_stats_monthly" */
export type Term_Total_State_Change_Stats_Monthly_Avg_Order_By = {
  difference?: InputMaybe<Order_By>;
  first_total_market_cap?: InputMaybe<Order_By>;
  last_total_market_cap?: InputMaybe<Order_By>;
};

/** Boolean expression to filter rows from the table "term_total_state_change_stats_monthly". All fields are combined with a logical 'AND'. */
export type Term_Total_State_Change_Stats_Monthly_Bool_Exp = {
  _and?: InputMaybe<Array<Term_Total_State_Change_Stats_Monthly_Bool_Exp>>;
  _not?: InputMaybe<Term_Total_State_Change_Stats_Monthly_Bool_Exp>;
  _or?: InputMaybe<Array<Term_Total_State_Change_Stats_Monthly_Bool_Exp>>;
  bucket?: InputMaybe<Timestamptz_Comparison_Exp>;
  difference?: InputMaybe<Numeric_Comparison_Exp>;
  first_total_market_cap?: InputMaybe<Numeric_Comparison_Exp>;
  last_total_market_cap?: InputMaybe<Numeric_Comparison_Exp>;
  term_id?: InputMaybe<String_Comparison_Exp>;
};

/** order by max() on columns of table "term_total_state_change_stats_monthly" */
export type Term_Total_State_Change_Stats_Monthly_Max_Order_By = {
  bucket?: InputMaybe<Order_By>;
  difference?: InputMaybe<Order_By>;
  first_total_market_cap?: InputMaybe<Order_By>;
  last_total_market_cap?: InputMaybe<Order_By>;
  term_id?: InputMaybe<Order_By>;
};

/** order by min() on columns of table "term_total_state_change_stats_monthly" */
export type Term_Total_State_Change_Stats_Monthly_Min_Order_By = {
  bucket?: InputMaybe<Order_By>;
  difference?: InputMaybe<Order_By>;
  first_total_market_cap?: InputMaybe<Order_By>;
  last_total_market_cap?: InputMaybe<Order_By>;
  term_id?: InputMaybe<Order_By>;
};

/** Ordering options when selecting data from "term_total_state_change_stats_monthly". */
export type Term_Total_State_Change_Stats_Monthly_Order_By = {
  bucket?: InputMaybe<Order_By>;
  difference?: InputMaybe<Order_By>;
  first_total_market_cap?: InputMaybe<Order_By>;
  last_total_market_cap?: InputMaybe<Order_By>;
  term_id?: InputMaybe<Order_By>;
};

/** select columns of table "term_total_state_change_stats_monthly" */
export type Term_Total_State_Change_Stats_Monthly_Select_Column =
  /** column name */
  | 'bucket'
  /** column name */
  | 'difference'
  /** column name */
  | 'first_total_market_cap'
  /** column name */
  | 'last_total_market_cap'
  /** column name */
  | 'term_id';

/** order by stddev() on columns of table "term_total_state_change_stats_monthly" */
export type Term_Total_State_Change_Stats_Monthly_Stddev_Order_By = {
  difference?: InputMaybe<Order_By>;
  first_total_market_cap?: InputMaybe<Order_By>;
  last_total_market_cap?: InputMaybe<Order_By>;
};

/** order by stddev_pop() on columns of table "term_total_state_change_stats_monthly" */
export type Term_Total_State_Change_Stats_Monthly_Stddev_Pop_Order_By = {
  difference?: InputMaybe<Order_By>;
  first_total_market_cap?: InputMaybe<Order_By>;
  last_total_market_cap?: InputMaybe<Order_By>;
};

/** order by stddev_samp() on columns of table "term_total_state_change_stats_monthly" */
export type Term_Total_State_Change_Stats_Monthly_Stddev_Samp_Order_By = {
  difference?: InputMaybe<Order_By>;
  first_total_market_cap?: InputMaybe<Order_By>;
  last_total_market_cap?: InputMaybe<Order_By>;
};

/** Streaming cursor of the table "term_total_state_change_stats_monthly" */
export type Term_Total_State_Change_Stats_Monthly_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Term_Total_State_Change_Stats_Monthly_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Term_Total_State_Change_Stats_Monthly_Stream_Cursor_Value_Input = {
  bucket?: InputMaybe<Scalars['timestamptz']['input']>;
  difference?: InputMaybe<Scalars['numeric']['input']>;
  first_total_market_cap?: InputMaybe<Scalars['numeric']['input']>;
  last_total_market_cap?: InputMaybe<Scalars['numeric']['input']>;
  term_id?: InputMaybe<Scalars['String']['input']>;
};

/** order by sum() on columns of table "term_total_state_change_stats_monthly" */
export type Term_Total_State_Change_Stats_Monthly_Sum_Order_By = {
  difference?: InputMaybe<Order_By>;
  first_total_market_cap?: InputMaybe<Order_By>;
  last_total_market_cap?: InputMaybe<Order_By>;
};

/** order by var_pop() on columns of table "term_total_state_change_stats_monthly" */
export type Term_Total_State_Change_Stats_Monthly_Var_Pop_Order_By = {
  difference?: InputMaybe<Order_By>;
  first_total_market_cap?: InputMaybe<Order_By>;
  last_total_market_cap?: InputMaybe<Order_By>;
};

/** order by var_samp() on columns of table "term_total_state_change_stats_monthly" */
export type Term_Total_State_Change_Stats_Monthly_Var_Samp_Order_By = {
  difference?: InputMaybe<Order_By>;
  first_total_market_cap?: InputMaybe<Order_By>;
  last_total_market_cap?: InputMaybe<Order_By>;
};

/** order by variance() on columns of table "term_total_state_change_stats_monthly" */
export type Term_Total_State_Change_Stats_Monthly_Variance_Order_By = {
  difference?: InputMaybe<Order_By>;
  first_total_market_cap?: InputMaybe<Order_By>;
  last_total_market_cap?: InputMaybe<Order_By>;
};

/** Weekly market cap statistics rolled up from daily stats for historical trending. */
export type Term_Total_State_Change_Stats_Weekly = {
  __typename?: 'term_total_state_change_stats_weekly';
  bucket?: Maybe<Scalars['timestamptz']['output']>;
  difference?: Maybe<Scalars['numeric']['output']>;
  first_total_market_cap?: Maybe<Scalars['numeric']['output']>;
  last_total_market_cap?: Maybe<Scalars['numeric']['output']>;
  term_id?: Maybe<Scalars['String']['output']>;
};

/** order by aggregate values of table "term_total_state_change_stats_weekly" */
export type Term_Total_State_Change_Stats_Weekly_Aggregate_Order_By = {
  avg?: InputMaybe<Term_Total_State_Change_Stats_Weekly_Avg_Order_By>;
  count?: InputMaybe<Order_By>;
  max?: InputMaybe<Term_Total_State_Change_Stats_Weekly_Max_Order_By>;
  min?: InputMaybe<Term_Total_State_Change_Stats_Weekly_Min_Order_By>;
  stddev?: InputMaybe<Term_Total_State_Change_Stats_Weekly_Stddev_Order_By>;
  stddev_pop?: InputMaybe<Term_Total_State_Change_Stats_Weekly_Stddev_Pop_Order_By>;
  stddev_samp?: InputMaybe<Term_Total_State_Change_Stats_Weekly_Stddev_Samp_Order_By>;
  sum?: InputMaybe<Term_Total_State_Change_Stats_Weekly_Sum_Order_By>;
  var_pop?: InputMaybe<Term_Total_State_Change_Stats_Weekly_Var_Pop_Order_By>;
  var_samp?: InputMaybe<Term_Total_State_Change_Stats_Weekly_Var_Samp_Order_By>;
  variance?: InputMaybe<Term_Total_State_Change_Stats_Weekly_Variance_Order_By>;
};

/** order by avg() on columns of table "term_total_state_change_stats_weekly" */
export type Term_Total_State_Change_Stats_Weekly_Avg_Order_By = {
  difference?: InputMaybe<Order_By>;
  first_total_market_cap?: InputMaybe<Order_By>;
  last_total_market_cap?: InputMaybe<Order_By>;
};

/** Boolean expression to filter rows from the table "term_total_state_change_stats_weekly". All fields are combined with a logical 'AND'. */
export type Term_Total_State_Change_Stats_Weekly_Bool_Exp = {
  _and?: InputMaybe<Array<Term_Total_State_Change_Stats_Weekly_Bool_Exp>>;
  _not?: InputMaybe<Term_Total_State_Change_Stats_Weekly_Bool_Exp>;
  _or?: InputMaybe<Array<Term_Total_State_Change_Stats_Weekly_Bool_Exp>>;
  bucket?: InputMaybe<Timestamptz_Comparison_Exp>;
  difference?: InputMaybe<Numeric_Comparison_Exp>;
  first_total_market_cap?: InputMaybe<Numeric_Comparison_Exp>;
  last_total_market_cap?: InputMaybe<Numeric_Comparison_Exp>;
  term_id?: InputMaybe<String_Comparison_Exp>;
};

/** order by max() on columns of table "term_total_state_change_stats_weekly" */
export type Term_Total_State_Change_Stats_Weekly_Max_Order_By = {
  bucket?: InputMaybe<Order_By>;
  difference?: InputMaybe<Order_By>;
  first_total_market_cap?: InputMaybe<Order_By>;
  last_total_market_cap?: InputMaybe<Order_By>;
  term_id?: InputMaybe<Order_By>;
};

/** order by min() on columns of table "term_total_state_change_stats_weekly" */
export type Term_Total_State_Change_Stats_Weekly_Min_Order_By = {
  bucket?: InputMaybe<Order_By>;
  difference?: InputMaybe<Order_By>;
  first_total_market_cap?: InputMaybe<Order_By>;
  last_total_market_cap?: InputMaybe<Order_By>;
  term_id?: InputMaybe<Order_By>;
};

/** Ordering options when selecting data from "term_total_state_change_stats_weekly". */
export type Term_Total_State_Change_Stats_Weekly_Order_By = {
  bucket?: InputMaybe<Order_By>;
  difference?: InputMaybe<Order_By>;
  first_total_market_cap?: InputMaybe<Order_By>;
  last_total_market_cap?: InputMaybe<Order_By>;
  term_id?: InputMaybe<Order_By>;
};

/** select columns of table "term_total_state_change_stats_weekly" */
export type Term_Total_State_Change_Stats_Weekly_Select_Column =
  /** column name */
  | 'bucket'
  /** column name */
  | 'difference'
  /** column name */
  | 'first_total_market_cap'
  /** column name */
  | 'last_total_market_cap'
  /** column name */
  | 'term_id';

/** order by stddev() on columns of table "term_total_state_change_stats_weekly" */
export type Term_Total_State_Change_Stats_Weekly_Stddev_Order_By = {
  difference?: InputMaybe<Order_By>;
  first_total_market_cap?: InputMaybe<Order_By>;
  last_total_market_cap?: InputMaybe<Order_By>;
};

/** order by stddev_pop() on columns of table "term_total_state_change_stats_weekly" */
export type Term_Total_State_Change_Stats_Weekly_Stddev_Pop_Order_By = {
  difference?: InputMaybe<Order_By>;
  first_total_market_cap?: InputMaybe<Order_By>;
  last_total_market_cap?: InputMaybe<Order_By>;
};

/** order by stddev_samp() on columns of table "term_total_state_change_stats_weekly" */
export type Term_Total_State_Change_Stats_Weekly_Stddev_Samp_Order_By = {
  difference?: InputMaybe<Order_By>;
  first_total_market_cap?: InputMaybe<Order_By>;
  last_total_market_cap?: InputMaybe<Order_By>;
};

/** Streaming cursor of the table "term_total_state_change_stats_weekly" */
export type Term_Total_State_Change_Stats_Weekly_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Term_Total_State_Change_Stats_Weekly_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Term_Total_State_Change_Stats_Weekly_Stream_Cursor_Value_Input = {
  bucket?: InputMaybe<Scalars['timestamptz']['input']>;
  difference?: InputMaybe<Scalars['numeric']['input']>;
  first_total_market_cap?: InputMaybe<Scalars['numeric']['input']>;
  last_total_market_cap?: InputMaybe<Scalars['numeric']['input']>;
  term_id?: InputMaybe<Scalars['String']['input']>;
};

/** order by sum() on columns of table "term_total_state_change_stats_weekly" */
export type Term_Total_State_Change_Stats_Weekly_Sum_Order_By = {
  difference?: InputMaybe<Order_By>;
  first_total_market_cap?: InputMaybe<Order_By>;
  last_total_market_cap?: InputMaybe<Order_By>;
};

/** order by var_pop() on columns of table "term_total_state_change_stats_weekly" */
export type Term_Total_State_Change_Stats_Weekly_Var_Pop_Order_By = {
  difference?: InputMaybe<Order_By>;
  first_total_market_cap?: InputMaybe<Order_By>;
  last_total_market_cap?: InputMaybe<Order_By>;
};

/** order by var_samp() on columns of table "term_total_state_change_stats_weekly" */
export type Term_Total_State_Change_Stats_Weekly_Var_Samp_Order_By = {
  difference?: InputMaybe<Order_By>;
  first_total_market_cap?: InputMaybe<Order_By>;
  last_total_market_cap?: InputMaybe<Order_By>;
};

/** order by variance() on columns of table "term_total_state_change_stats_weekly" */
export type Term_Total_State_Change_Stats_Weekly_Variance_Order_By = {
  difference?: InputMaybe<Order_By>;
  first_total_market_cap?: InputMaybe<Order_By>;
  last_total_market_cap?: InputMaybe<Order_By>;
};

/** TimescaleDB hypertable tracking changes to term total_assets and total_market_cap over time. */
export type Term_Total_State_Changes = {
  __typename?: 'term_total_state_changes';
  /** Timestamp when this state change occurred (TimescaleDB partition column). */
  created_at: Scalars['timestamptz']['output'];
  /** Term ID whose state changed. */
  term_id: Scalars['String']['output'];
  /** Snapshot of total_assets at this point in time, in wei. */
  total_assets: Scalars['numeric']['output'];
  /** Snapshot of total_market_cap at this point in time, in wei. */
  total_market_cap: Scalars['numeric']['output'];
};

/** order by aggregate values of table "term_total_state_change" */
export type Term_Total_State_Changes_Aggregate_Order_By = {
  avg?: InputMaybe<Term_Total_State_Changes_Avg_Order_By>;
  count?: InputMaybe<Order_By>;
  max?: InputMaybe<Term_Total_State_Changes_Max_Order_By>;
  min?: InputMaybe<Term_Total_State_Changes_Min_Order_By>;
  stddev?: InputMaybe<Term_Total_State_Changes_Stddev_Order_By>;
  stddev_pop?: InputMaybe<Term_Total_State_Changes_Stddev_Pop_Order_By>;
  stddev_samp?: InputMaybe<Term_Total_State_Changes_Stddev_Samp_Order_By>;
  sum?: InputMaybe<Term_Total_State_Changes_Sum_Order_By>;
  var_pop?: InputMaybe<Term_Total_State_Changes_Var_Pop_Order_By>;
  var_samp?: InputMaybe<Term_Total_State_Changes_Var_Samp_Order_By>;
  variance?: InputMaybe<Term_Total_State_Changes_Variance_Order_By>;
};

/** order by avg() on columns of table "term_total_state_change" */
export type Term_Total_State_Changes_Avg_Order_By = {
  /** Snapshot of total_assets at this point in time, in wei. */
  total_assets?: InputMaybe<Order_By>;
  /** Snapshot of total_market_cap at this point in time, in wei. */
  total_market_cap?: InputMaybe<Order_By>;
};

/** Boolean expression to filter rows from the table "term_total_state_change". All fields are combined with a logical 'AND'. */
export type Term_Total_State_Changes_Bool_Exp = {
  _and?: InputMaybe<Array<Term_Total_State_Changes_Bool_Exp>>;
  _not?: InputMaybe<Term_Total_State_Changes_Bool_Exp>;
  _or?: InputMaybe<Array<Term_Total_State_Changes_Bool_Exp>>;
  created_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  term_id?: InputMaybe<String_Comparison_Exp>;
  total_assets?: InputMaybe<Numeric_Comparison_Exp>;
  total_market_cap?: InputMaybe<Numeric_Comparison_Exp>;
};

/** order by max() on columns of table "term_total_state_change" */
export type Term_Total_State_Changes_Max_Order_By = {
  /** Timestamp when this state change occurred (TimescaleDB partition column). */
  created_at?: InputMaybe<Order_By>;
  /** Term ID whose state changed. */
  term_id?: InputMaybe<Order_By>;
  /** Snapshot of total_assets at this point in time, in wei. */
  total_assets?: InputMaybe<Order_By>;
  /** Snapshot of total_market_cap at this point in time, in wei. */
  total_market_cap?: InputMaybe<Order_By>;
};

/** order by min() on columns of table "term_total_state_change" */
export type Term_Total_State_Changes_Min_Order_By = {
  /** Timestamp when this state change occurred (TimescaleDB partition column). */
  created_at?: InputMaybe<Order_By>;
  /** Term ID whose state changed. */
  term_id?: InputMaybe<Order_By>;
  /** Snapshot of total_assets at this point in time, in wei. */
  total_assets?: InputMaybe<Order_By>;
  /** Snapshot of total_market_cap at this point in time, in wei. */
  total_market_cap?: InputMaybe<Order_By>;
};

/** Ordering options when selecting data from "term_total_state_change". */
export type Term_Total_State_Changes_Order_By = {
  created_at?: InputMaybe<Order_By>;
  term_id?: InputMaybe<Order_By>;
  total_assets?: InputMaybe<Order_By>;
  total_market_cap?: InputMaybe<Order_By>;
};

/** select columns of table "term_total_state_change" */
export type Term_Total_State_Changes_Select_Column =
  /** column name */
  | 'created_at'
  /** column name */
  | 'term_id'
  /** column name */
  | 'total_assets'
  /** column name */
  | 'total_market_cap';

/** order by stddev() on columns of table "term_total_state_change" */
export type Term_Total_State_Changes_Stddev_Order_By = {
  /** Snapshot of total_assets at this point in time, in wei. */
  total_assets?: InputMaybe<Order_By>;
  /** Snapshot of total_market_cap at this point in time, in wei. */
  total_market_cap?: InputMaybe<Order_By>;
};

/** order by stddev_pop() on columns of table "term_total_state_change" */
export type Term_Total_State_Changes_Stddev_Pop_Order_By = {
  /** Snapshot of total_assets at this point in time, in wei. */
  total_assets?: InputMaybe<Order_By>;
  /** Snapshot of total_market_cap at this point in time, in wei. */
  total_market_cap?: InputMaybe<Order_By>;
};

/** order by stddev_samp() on columns of table "term_total_state_change" */
export type Term_Total_State_Changes_Stddev_Samp_Order_By = {
  /** Snapshot of total_assets at this point in time, in wei. */
  total_assets?: InputMaybe<Order_By>;
  /** Snapshot of total_market_cap at this point in time, in wei. */
  total_market_cap?: InputMaybe<Order_By>;
};

/** Streaming cursor of the table "term_total_state_changes" */
export type Term_Total_State_Changes_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Term_Total_State_Changes_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Term_Total_State_Changes_Stream_Cursor_Value_Input = {
  /** Timestamp when this state change occurred (TimescaleDB partition column). */
  created_at?: InputMaybe<Scalars['timestamptz']['input']>;
  /** Term ID whose state changed. */
  term_id?: InputMaybe<Scalars['String']['input']>;
  /** Snapshot of total_assets at this point in time, in wei. */
  total_assets?: InputMaybe<Scalars['numeric']['input']>;
  /** Snapshot of total_market_cap at this point in time, in wei. */
  total_market_cap?: InputMaybe<Scalars['numeric']['input']>;
};

/** order by sum() on columns of table "term_total_state_change" */
export type Term_Total_State_Changes_Sum_Order_By = {
  /** Snapshot of total_assets at this point in time, in wei. */
  total_assets?: InputMaybe<Order_By>;
  /** Snapshot of total_market_cap at this point in time, in wei. */
  total_market_cap?: InputMaybe<Order_By>;
};

/** order by var_pop() on columns of table "term_total_state_change" */
export type Term_Total_State_Changes_Var_Pop_Order_By = {
  /** Snapshot of total_assets at this point in time, in wei. */
  total_assets?: InputMaybe<Order_By>;
  /** Snapshot of total_market_cap at this point in time, in wei. */
  total_market_cap?: InputMaybe<Order_By>;
};

/** order by var_samp() on columns of table "term_total_state_change" */
export type Term_Total_State_Changes_Var_Samp_Order_By = {
  /** Snapshot of total_assets at this point in time, in wei. */
  total_assets?: InputMaybe<Order_By>;
  /** Snapshot of total_market_cap at this point in time, in wei. */
  total_market_cap?: InputMaybe<Order_By>;
};

/** order by variance() on columns of table "term_total_state_change" */
export type Term_Total_State_Changes_Variance_Order_By = {
  /** Snapshot of total_assets at this point in time, in wei. */
  total_assets?: InputMaybe<Order_By>;
  /** Snapshot of total_market_cap at this point in time, in wei. */
  total_market_cap?: InputMaybe<Order_By>;
};

/** Boolean expression to compare columns of type "term_type". All fields are combined with logical 'AND'. */
export type Term_Type_Comparison_Exp = {
  _eq?: InputMaybe<Scalars['term_type']['input']>;
  _gt?: InputMaybe<Scalars['term_type']['input']>;
  _gte?: InputMaybe<Scalars['term_type']['input']>;
  _in?: InputMaybe<Array<Scalars['term_type']['input']>>;
  _is_null?: InputMaybe<Scalars['Boolean']['input']>;
  _lt?: InputMaybe<Scalars['term_type']['input']>;
  _lte?: InputMaybe<Scalars['term_type']['input']>;
  _neq?: InputMaybe<Scalars['term_type']['input']>;
  _nin?: InputMaybe<Array<Scalars['term_type']['input']>>;
};

/** Unified registry of all terms (atoms, triples, counter-triples) with aggregated market data. */
export type Terms = {
  __typename?: 'terms';
  /** An object relationship */
  atom?: Maybe<Atoms>;
  /** An object relationship */
  atomById?: Maybe<Atoms>;
  /** Reference to atom if this term is an Atom type. */
  atom_id?: Maybe<Scalars['String']['output']>;
  /** Timestamp when this term was created. */
  created_at: Scalars['timestamptz']['output'];
  /** An array relationship */
  deposits: Array<Deposits>;
  /** An aggregate relationship */
  deposits_aggregate: Deposits_Aggregate;
  /** Unique term identifier (vault ID for atoms/triples). */
  id: Scalars['String']['output'];
  /** An array relationship */
  positions: Array<Positions>;
  /** An aggregate relationship */
  positions_aggregate: Positions_Aggregate;
  /** An array relationship */
  redemptions: Array<Redemptions>;
  /** An aggregate relationship */
  redemptions_aggregate: Redemptions_Aggregate;
  /** An array relationship */
  share_price_change_stats_daily: Array<Share_Price_Change_Stats_Daily>;
  /** An array relationship */
  share_price_change_stats_hourly: Array<Share_Price_Change_Stats_Hourly>;
  /** An array relationship */
  share_price_change_stats_monthly: Array<Share_Price_Change_Stats_Monthly>;
  /** An array relationship */
  share_price_change_stats_weekly: Array<Share_Price_Change_Stats_Weekly>;
  /** An array relationship */
  share_price_changes: Array<Share_Price_Changes>;
  /** An aggregate relationship */
  share_price_changes_aggregate: Share_Price_Changes_Aggregate;
  /** An array relationship */
  signals: Array<Signals>;
  /** An aggregate relationship */
  signals_aggregate: Signals_Aggregate;
  /** An array relationship */
  term_total_state_change_daily: Array<Term_Total_State_Change_Stats_Daily>;
  /** An array relationship */
  term_total_state_change_hourly: Array<Term_Total_State_Change_Stats_Hourly>;
  /** An array relationship */
  term_total_state_change_monthly: Array<Term_Total_State_Change_Stats_Monthly>;
  /** An array relationship */
  term_total_state_change_weekly: Array<Term_Total_State_Change_Stats_Weekly>;
  /** An array relationship */
  term_total_state_changes: Array<Term_Total_State_Changes>;
  /** Total assets across all curves for this term, in wei. */
  total_assets?: Maybe<Scalars['numeric']['output']>;
  /** Total market capitalization across all curves for this term, in wei. */
  total_market_cap?: Maybe<Scalars['numeric']['output']>;
  /** An object relationship */
  triple?: Maybe<Triples>;
  /** An object relationship */
  tripleById?: Maybe<Triples>;
  /** Reference to triple if this term is a Triple or CounterTriple type. */
  triple_id?: Maybe<Scalars['String']['output']>;
  /** Type of term: Atom, Triple, or CounterTriple. */
  type: Scalars['term_type']['output'];
  /** Timestamp of last update to this term. */
  updated_at: Scalars['timestamptz']['output'];
  /** An array relationship */
  vaults: Array<Vaults>;
  /** An aggregate relationship */
  vaults_aggregate: Vaults_Aggregate;
};


/** Unified registry of all terms (atoms, triples, counter-triples) with aggregated market data. */
export type TermsDepositsArgs = {
  distinct_on?: InputMaybe<Array<Deposits_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Deposits_Order_By>>;
  where?: InputMaybe<Deposits_Bool_Exp>;
};


/** Unified registry of all terms (atoms, triples, counter-triples) with aggregated market data. */
export type TermsDeposits_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Deposits_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Deposits_Order_By>>;
  where?: InputMaybe<Deposits_Bool_Exp>;
};


/** Unified registry of all terms (atoms, triples, counter-triples) with aggregated market data. */
export type TermsPositionsArgs = {
  distinct_on?: InputMaybe<Array<Positions_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Positions_Order_By>>;
  where?: InputMaybe<Positions_Bool_Exp>;
};


/** Unified registry of all terms (atoms, triples, counter-triples) with aggregated market data. */
export type TermsPositions_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Positions_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Positions_Order_By>>;
  where?: InputMaybe<Positions_Bool_Exp>;
};


/** Unified registry of all terms (atoms, triples, counter-triples) with aggregated market data. */
export type TermsRedemptionsArgs = {
  distinct_on?: InputMaybe<Array<Redemptions_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Redemptions_Order_By>>;
  where?: InputMaybe<Redemptions_Bool_Exp>;
};


/** Unified registry of all terms (atoms, triples, counter-triples) with aggregated market data. */
export type TermsRedemptions_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Redemptions_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Redemptions_Order_By>>;
  where?: InputMaybe<Redemptions_Bool_Exp>;
};


/** Unified registry of all terms (atoms, triples, counter-triples) with aggregated market data. */
export type TermsShare_Price_Change_Stats_DailyArgs = {
  distinct_on?: InputMaybe<Array<Share_Price_Change_Stats_Daily_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Share_Price_Change_Stats_Daily_Order_By>>;
  where?: InputMaybe<Share_Price_Change_Stats_Daily_Bool_Exp>;
};


/** Unified registry of all terms (atoms, triples, counter-triples) with aggregated market data. */
export type TermsShare_Price_Change_Stats_HourlyArgs = {
  distinct_on?: InputMaybe<Array<Share_Price_Change_Stats_Hourly_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Share_Price_Change_Stats_Hourly_Order_By>>;
  where?: InputMaybe<Share_Price_Change_Stats_Hourly_Bool_Exp>;
};


/** Unified registry of all terms (atoms, triples, counter-triples) with aggregated market data. */
export type TermsShare_Price_Change_Stats_MonthlyArgs = {
  distinct_on?: InputMaybe<Array<Share_Price_Change_Stats_Monthly_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Share_Price_Change_Stats_Monthly_Order_By>>;
  where?: InputMaybe<Share_Price_Change_Stats_Monthly_Bool_Exp>;
};


/** Unified registry of all terms (atoms, triples, counter-triples) with aggregated market data. */
export type TermsShare_Price_Change_Stats_WeeklyArgs = {
  distinct_on?: InputMaybe<Array<Share_Price_Change_Stats_Weekly_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Share_Price_Change_Stats_Weekly_Order_By>>;
  where?: InputMaybe<Share_Price_Change_Stats_Weekly_Bool_Exp>;
};


/** Unified registry of all terms (atoms, triples, counter-triples) with aggregated market data. */
export type TermsShare_Price_ChangesArgs = {
  distinct_on?: InputMaybe<Array<Share_Price_Changes_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Share_Price_Changes_Order_By>>;
  where?: InputMaybe<Share_Price_Changes_Bool_Exp>;
};


/** Unified registry of all terms (atoms, triples, counter-triples) with aggregated market data. */
export type TermsShare_Price_Changes_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Share_Price_Changes_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Share_Price_Changes_Order_By>>;
  where?: InputMaybe<Share_Price_Changes_Bool_Exp>;
};


/** Unified registry of all terms (atoms, triples, counter-triples) with aggregated market data. */
export type TermsSignalsArgs = {
  distinct_on?: InputMaybe<Array<Signals_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Signals_Order_By>>;
  where?: InputMaybe<Signals_Bool_Exp>;
};


/** Unified registry of all terms (atoms, triples, counter-triples) with aggregated market data. */
export type TermsSignals_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Signals_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Signals_Order_By>>;
  where?: InputMaybe<Signals_Bool_Exp>;
};


/** Unified registry of all terms (atoms, triples, counter-triples) with aggregated market data. */
export type TermsTerm_Total_State_Change_DailyArgs = {
  distinct_on?: InputMaybe<Array<Term_Total_State_Change_Stats_Daily_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Term_Total_State_Change_Stats_Daily_Order_By>>;
  where?: InputMaybe<Term_Total_State_Change_Stats_Daily_Bool_Exp>;
};


/** Unified registry of all terms (atoms, triples, counter-triples) with aggregated market data. */
export type TermsTerm_Total_State_Change_HourlyArgs = {
  distinct_on?: InputMaybe<Array<Term_Total_State_Change_Stats_Hourly_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Term_Total_State_Change_Stats_Hourly_Order_By>>;
  where?: InputMaybe<Term_Total_State_Change_Stats_Hourly_Bool_Exp>;
};


/** Unified registry of all terms (atoms, triples, counter-triples) with aggregated market data. */
export type TermsTerm_Total_State_Change_MonthlyArgs = {
  distinct_on?: InputMaybe<Array<Term_Total_State_Change_Stats_Monthly_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Term_Total_State_Change_Stats_Monthly_Order_By>>;
  where?: InputMaybe<Term_Total_State_Change_Stats_Monthly_Bool_Exp>;
};


/** Unified registry of all terms (atoms, triples, counter-triples) with aggregated market data. */
export type TermsTerm_Total_State_Change_WeeklyArgs = {
  distinct_on?: InputMaybe<Array<Term_Total_State_Change_Stats_Weekly_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Term_Total_State_Change_Stats_Weekly_Order_By>>;
  where?: InputMaybe<Term_Total_State_Change_Stats_Weekly_Bool_Exp>;
};


/** Unified registry of all terms (atoms, triples, counter-triples) with aggregated market data. */
export type TermsTerm_Total_State_ChangesArgs = {
  distinct_on?: InputMaybe<Array<Term_Total_State_Changes_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Term_Total_State_Changes_Order_By>>;
  where?: InputMaybe<Term_Total_State_Changes_Bool_Exp>;
};


/** Unified registry of all terms (atoms, triples, counter-triples) with aggregated market data. */
export type TermsVaultsArgs = {
  distinct_on?: InputMaybe<Array<Vaults_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Vaults_Order_By>>;
  where?: InputMaybe<Vaults_Bool_Exp>;
};


/** Unified registry of all terms (atoms, triples, counter-triples) with aggregated market data. */
export type TermsVaults_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Vaults_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Vaults_Order_By>>;
  where?: InputMaybe<Vaults_Bool_Exp>;
};

export type Terms_Aggregate = {
  __typename?: 'terms_aggregate';
  aggregate?: Maybe<Terms_Aggregate_Fields>;
  nodes: Array<Terms>;
};

/** aggregate fields of "term" */
export type Terms_Aggregate_Fields = {
  __typename?: 'terms_aggregate_fields';
  avg?: Maybe<Terms_Avg_Fields>;
  count: Scalars['Int']['output'];
  max?: Maybe<Terms_Max_Fields>;
  min?: Maybe<Terms_Min_Fields>;
  stddev?: Maybe<Terms_Stddev_Fields>;
  stddev_pop?: Maybe<Terms_Stddev_Pop_Fields>;
  stddev_samp?: Maybe<Terms_Stddev_Samp_Fields>;
  sum?: Maybe<Terms_Sum_Fields>;
  var_pop?: Maybe<Terms_Var_Pop_Fields>;
  var_samp?: Maybe<Terms_Var_Samp_Fields>;
  variance?: Maybe<Terms_Variance_Fields>;
};


/** aggregate fields of "term" */
export type Terms_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Terms_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
};

/** aggregate avg on columns */
export type Terms_Avg_Fields = {
  __typename?: 'terms_avg_fields';
  /** Total assets across all curves for this term, in wei. */
  total_assets?: Maybe<Scalars['Float']['output']>;
  /** Total market capitalization across all curves for this term, in wei. */
  total_market_cap?: Maybe<Scalars['Float']['output']>;
};

/** Boolean expression to filter rows from the table "term". All fields are combined with a logical 'AND'. */
export type Terms_Bool_Exp = {
  _and?: InputMaybe<Array<Terms_Bool_Exp>>;
  _not?: InputMaybe<Terms_Bool_Exp>;
  _or?: InputMaybe<Array<Terms_Bool_Exp>>;
  atom?: InputMaybe<Atoms_Bool_Exp>;
  atomById?: InputMaybe<Atoms_Bool_Exp>;
  atom_id?: InputMaybe<String_Comparison_Exp>;
  created_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  deposits?: InputMaybe<Deposits_Bool_Exp>;
  deposits_aggregate?: InputMaybe<Deposits_Aggregate_Bool_Exp>;
  id?: InputMaybe<String_Comparison_Exp>;
  positions?: InputMaybe<Positions_Bool_Exp>;
  positions_aggregate?: InputMaybe<Positions_Aggregate_Bool_Exp>;
  redemptions?: InputMaybe<Redemptions_Bool_Exp>;
  redemptions_aggregate?: InputMaybe<Redemptions_Aggregate_Bool_Exp>;
  share_price_change_stats_daily?: InputMaybe<Share_Price_Change_Stats_Daily_Bool_Exp>;
  share_price_change_stats_hourly?: InputMaybe<Share_Price_Change_Stats_Hourly_Bool_Exp>;
  share_price_change_stats_monthly?: InputMaybe<Share_Price_Change_Stats_Monthly_Bool_Exp>;
  share_price_change_stats_weekly?: InputMaybe<Share_Price_Change_Stats_Weekly_Bool_Exp>;
  share_price_changes?: InputMaybe<Share_Price_Changes_Bool_Exp>;
  share_price_changes_aggregate?: InputMaybe<Share_Price_Changes_Aggregate_Bool_Exp>;
  signals?: InputMaybe<Signals_Bool_Exp>;
  signals_aggregate?: InputMaybe<Signals_Aggregate_Bool_Exp>;
  term_total_state_change_daily?: InputMaybe<Term_Total_State_Change_Stats_Daily_Bool_Exp>;
  term_total_state_change_hourly?: InputMaybe<Term_Total_State_Change_Stats_Hourly_Bool_Exp>;
  term_total_state_change_monthly?: InputMaybe<Term_Total_State_Change_Stats_Monthly_Bool_Exp>;
  term_total_state_change_weekly?: InputMaybe<Term_Total_State_Change_Stats_Weekly_Bool_Exp>;
  term_total_state_changes?: InputMaybe<Term_Total_State_Changes_Bool_Exp>;
  total_assets?: InputMaybe<Numeric_Comparison_Exp>;
  total_market_cap?: InputMaybe<Numeric_Comparison_Exp>;
  triple?: InputMaybe<Triples_Bool_Exp>;
  tripleById?: InputMaybe<Triples_Bool_Exp>;
  triple_id?: InputMaybe<String_Comparison_Exp>;
  type?: InputMaybe<Term_Type_Comparison_Exp>;
  updated_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  vaults?: InputMaybe<Vaults_Bool_Exp>;
  vaults_aggregate?: InputMaybe<Vaults_Aggregate_Bool_Exp>;
};

/** aggregate max on columns */
export type Terms_Max_Fields = {
  __typename?: 'terms_max_fields';
  /** Reference to atom if this term is an Atom type. */
  atom_id?: Maybe<Scalars['String']['output']>;
  /** Timestamp when this term was created. */
  created_at?: Maybe<Scalars['timestamptz']['output']>;
  /** Unique term identifier (vault ID for atoms/triples). */
  id?: Maybe<Scalars['String']['output']>;
  /** Total assets across all curves for this term, in wei. */
  total_assets?: Maybe<Scalars['numeric']['output']>;
  /** Total market capitalization across all curves for this term, in wei. */
  total_market_cap?: Maybe<Scalars['numeric']['output']>;
  /** Reference to triple if this term is a Triple or CounterTriple type. */
  triple_id?: Maybe<Scalars['String']['output']>;
  /** Type of term: Atom, Triple, or CounterTriple. */
  type?: Maybe<Scalars['term_type']['output']>;
  /** Timestamp of last update to this term. */
  updated_at?: Maybe<Scalars['timestamptz']['output']>;
};

/** aggregate min on columns */
export type Terms_Min_Fields = {
  __typename?: 'terms_min_fields';
  /** Reference to atom if this term is an Atom type. */
  atom_id?: Maybe<Scalars['String']['output']>;
  /** Timestamp when this term was created. */
  created_at?: Maybe<Scalars['timestamptz']['output']>;
  /** Unique term identifier (vault ID for atoms/triples). */
  id?: Maybe<Scalars['String']['output']>;
  /** Total assets across all curves for this term, in wei. */
  total_assets?: Maybe<Scalars['numeric']['output']>;
  /** Total market capitalization across all curves for this term, in wei. */
  total_market_cap?: Maybe<Scalars['numeric']['output']>;
  /** Reference to triple if this term is a Triple or CounterTriple type. */
  triple_id?: Maybe<Scalars['String']['output']>;
  /** Type of term: Atom, Triple, or CounterTriple. */
  type?: Maybe<Scalars['term_type']['output']>;
  /** Timestamp of last update to this term. */
  updated_at?: Maybe<Scalars['timestamptz']['output']>;
};

/** Ordering options when selecting data from "term". */
export type Terms_Order_By = {
  atom?: InputMaybe<Atoms_Order_By>;
  atomById?: InputMaybe<Atoms_Order_By>;
  atom_id?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  deposits_aggregate?: InputMaybe<Deposits_Aggregate_Order_By>;
  id?: InputMaybe<Order_By>;
  positions_aggregate?: InputMaybe<Positions_Aggregate_Order_By>;
  redemptions_aggregate?: InputMaybe<Redemptions_Aggregate_Order_By>;
  share_price_change_stats_daily_aggregate?: InputMaybe<Share_Price_Change_Stats_Daily_Aggregate_Order_By>;
  share_price_change_stats_hourly_aggregate?: InputMaybe<Share_Price_Change_Stats_Hourly_Aggregate_Order_By>;
  share_price_change_stats_monthly_aggregate?: InputMaybe<Share_Price_Change_Stats_Monthly_Aggregate_Order_By>;
  share_price_change_stats_weekly_aggregate?: InputMaybe<Share_Price_Change_Stats_Weekly_Aggregate_Order_By>;
  share_price_changes_aggregate?: InputMaybe<Share_Price_Changes_Aggregate_Order_By>;
  signals_aggregate?: InputMaybe<Signals_Aggregate_Order_By>;
  term_total_state_change_daily_aggregate?: InputMaybe<Term_Total_State_Change_Stats_Daily_Aggregate_Order_By>;
  term_total_state_change_hourly_aggregate?: InputMaybe<Term_Total_State_Change_Stats_Hourly_Aggregate_Order_By>;
  term_total_state_change_monthly_aggregate?: InputMaybe<Term_Total_State_Change_Stats_Monthly_Aggregate_Order_By>;
  term_total_state_change_weekly_aggregate?: InputMaybe<Term_Total_State_Change_Stats_Weekly_Aggregate_Order_By>;
  term_total_state_changes_aggregate?: InputMaybe<Term_Total_State_Changes_Aggregate_Order_By>;
  total_assets?: InputMaybe<Order_By>;
  total_market_cap?: InputMaybe<Order_By>;
  triple?: InputMaybe<Triples_Order_By>;
  tripleById?: InputMaybe<Triples_Order_By>;
  triple_id?: InputMaybe<Order_By>;
  type?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
  vaults_aggregate?: InputMaybe<Vaults_Aggregate_Order_By>;
};

/** select columns of table "term" */
export type Terms_Select_Column =
  /** column name */
  | 'atom_id'
  /** column name */
  | 'created_at'
  /** column name */
  | 'id'
  /** column name */
  | 'total_assets'
  /** column name */
  | 'total_market_cap'
  /** column name */
  | 'triple_id'
  /** column name */
  | 'type'
  /** column name */
  | 'updated_at';

/** aggregate stddev on columns */
export type Terms_Stddev_Fields = {
  __typename?: 'terms_stddev_fields';
  /** Total assets across all curves for this term, in wei. */
  total_assets?: Maybe<Scalars['Float']['output']>;
  /** Total market capitalization across all curves for this term, in wei. */
  total_market_cap?: Maybe<Scalars['Float']['output']>;
};

/** aggregate stddev_pop on columns */
export type Terms_Stddev_Pop_Fields = {
  __typename?: 'terms_stddev_pop_fields';
  /** Total assets across all curves for this term, in wei. */
  total_assets?: Maybe<Scalars['Float']['output']>;
  /** Total market capitalization across all curves for this term, in wei. */
  total_market_cap?: Maybe<Scalars['Float']['output']>;
};

/** aggregate stddev_samp on columns */
export type Terms_Stddev_Samp_Fields = {
  __typename?: 'terms_stddev_samp_fields';
  /** Total assets across all curves for this term, in wei. */
  total_assets?: Maybe<Scalars['Float']['output']>;
  /** Total market capitalization across all curves for this term, in wei. */
  total_market_cap?: Maybe<Scalars['Float']['output']>;
};

/** Streaming cursor of the table "terms" */
export type Terms_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Terms_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Terms_Stream_Cursor_Value_Input = {
  /** Reference to atom if this term is an Atom type. */
  atom_id?: InputMaybe<Scalars['String']['input']>;
  /** Timestamp when this term was created. */
  created_at?: InputMaybe<Scalars['timestamptz']['input']>;
  /** Unique term identifier (vault ID for atoms/triples). */
  id?: InputMaybe<Scalars['String']['input']>;
  /** Total assets across all curves for this term, in wei. */
  total_assets?: InputMaybe<Scalars['numeric']['input']>;
  /** Total market capitalization across all curves for this term, in wei. */
  total_market_cap?: InputMaybe<Scalars['numeric']['input']>;
  /** Reference to triple if this term is a Triple or CounterTriple type. */
  triple_id?: InputMaybe<Scalars['String']['input']>;
  /** Type of term: Atom, Triple, or CounterTriple. */
  type?: InputMaybe<Scalars['term_type']['input']>;
  /** Timestamp of last update to this term. */
  updated_at?: InputMaybe<Scalars['timestamptz']['input']>;
};

/** aggregate sum on columns */
export type Terms_Sum_Fields = {
  __typename?: 'terms_sum_fields';
  /** Total assets across all curves for this term, in wei. */
  total_assets?: Maybe<Scalars['numeric']['output']>;
  /** Total market capitalization across all curves for this term, in wei. */
  total_market_cap?: Maybe<Scalars['numeric']['output']>;
};

/** aggregate var_pop on columns */
export type Terms_Var_Pop_Fields = {
  __typename?: 'terms_var_pop_fields';
  /** Total assets across all curves for this term, in wei. */
  total_assets?: Maybe<Scalars['Float']['output']>;
  /** Total market capitalization across all curves for this term, in wei. */
  total_market_cap?: Maybe<Scalars['Float']['output']>;
};

/** aggregate var_samp on columns */
export type Terms_Var_Samp_Fields = {
  __typename?: 'terms_var_samp_fields';
  /** Total assets across all curves for this term, in wei. */
  total_assets?: Maybe<Scalars['Float']['output']>;
  /** Total market capitalization across all curves for this term, in wei. */
  total_market_cap?: Maybe<Scalars['Float']['output']>;
};

/** aggregate variance on columns */
export type Terms_Variance_Fields = {
  __typename?: 'terms_variance_fields';
  /** Total assets across all curves for this term, in wei. */
  total_assets?: Maybe<Scalars['Float']['output']>;
  /** Total market capitalization across all curves for this term, in wei. */
  total_market_cap?: Maybe<Scalars['Float']['output']>;
};

/** Plain text storage for atom values containing simple text content. */
export type Text_Objects = {
  __typename?: 'text_objects';
  /** An object relationship */
  atom?: Maybe<Atoms>;
  /** Plain text content. */
  data: Scalars['String']['output'];
  /** Unique identifier for this text object. */
  id: Scalars['String']['output'];
};

/** aggregated selection of "text_object" */
export type Text_Objects_Aggregate = {
  __typename?: 'text_objects_aggregate';
  aggregate?: Maybe<Text_Objects_Aggregate_Fields>;
  nodes: Array<Text_Objects>;
};

/** aggregate fields of "text_object" */
export type Text_Objects_Aggregate_Fields = {
  __typename?: 'text_objects_aggregate_fields';
  count: Scalars['Int']['output'];
  max?: Maybe<Text_Objects_Max_Fields>;
  min?: Maybe<Text_Objects_Min_Fields>;
};


/** aggregate fields of "text_object" */
export type Text_Objects_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Text_Objects_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
};

/** Boolean expression to filter rows from the table "text_object". All fields are combined with a logical 'AND'. */
export type Text_Objects_Bool_Exp = {
  _and?: InputMaybe<Array<Text_Objects_Bool_Exp>>;
  _not?: InputMaybe<Text_Objects_Bool_Exp>;
  _or?: InputMaybe<Array<Text_Objects_Bool_Exp>>;
  atom?: InputMaybe<Atoms_Bool_Exp>;
  data?: InputMaybe<String_Comparison_Exp>;
  id?: InputMaybe<String_Comparison_Exp>;
};

/** aggregate max on columns */
export type Text_Objects_Max_Fields = {
  __typename?: 'text_objects_max_fields';
  /** Plain text content. */
  data?: Maybe<Scalars['String']['output']>;
  /** Unique identifier for this text object. */
  id?: Maybe<Scalars['String']['output']>;
};

/** aggregate min on columns */
export type Text_Objects_Min_Fields = {
  __typename?: 'text_objects_min_fields';
  /** Plain text content. */
  data?: Maybe<Scalars['String']['output']>;
  /** Unique identifier for this text object. */
  id?: Maybe<Scalars['String']['output']>;
};

/** Ordering options when selecting data from "text_object". */
export type Text_Objects_Order_By = {
  atom?: InputMaybe<Atoms_Order_By>;
  data?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
};

/** select columns of table "text_object" */
export type Text_Objects_Select_Column =
  /** column name */
  | 'data'
  /** column name */
  | 'id';

/** Streaming cursor of the table "text_objects" */
export type Text_Objects_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Text_Objects_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Text_Objects_Stream_Cursor_Value_Input = {
  /** Plain text content. */
  data?: InputMaybe<Scalars['String']['input']>;
  /** Unique identifier for this text object. */
  id?: InputMaybe<Scalars['String']['input']>;
};

/** Generic thing entities following schema.org Thing specification for atom values. */
export type Things = {
  __typename?: 'things';
  /** An object relationship */
  atom?: Maybe<Atoms>;
  cached_image?: Maybe<Cached_Images_Cached_Image>;
  /** Description of the thing. */
  description?: Maybe<Scalars['String']['output']>;
  /** Unique identifier for this thing entity. */
  id: Scalars['String']['output'];
  /** Image URL for the thing. */
  image?: Maybe<Scalars['String']['output']>;
  /** Name or title of the thing. */
  name?: Maybe<Scalars['String']['output']>;
  /** External URL or homepage for the thing. */
  url?: Maybe<Scalars['String']['output']>;
};

/** aggregated selection of "thing" */
export type Things_Aggregate = {
  __typename?: 'things_aggregate';
  aggregate?: Maybe<Things_Aggregate_Fields>;
  nodes: Array<Things>;
};

/** aggregate fields of "thing" */
export type Things_Aggregate_Fields = {
  __typename?: 'things_aggregate_fields';
  count: Scalars['Int']['output'];
  max?: Maybe<Things_Max_Fields>;
  min?: Maybe<Things_Min_Fields>;
};


/** aggregate fields of "thing" */
export type Things_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Things_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
};

/** Boolean expression to filter rows from the table "thing". All fields are combined with a logical 'AND'. */
export type Things_Bool_Exp = {
  _and?: InputMaybe<Array<Things_Bool_Exp>>;
  _not?: InputMaybe<Things_Bool_Exp>;
  _or?: InputMaybe<Array<Things_Bool_Exp>>;
  atom?: InputMaybe<Atoms_Bool_Exp>;
  description?: InputMaybe<String_Comparison_Exp>;
  id?: InputMaybe<String_Comparison_Exp>;
  image?: InputMaybe<String_Comparison_Exp>;
  name?: InputMaybe<String_Comparison_Exp>;
  url?: InputMaybe<String_Comparison_Exp>;
};

/** aggregate max on columns */
export type Things_Max_Fields = {
  __typename?: 'things_max_fields';
  /** Description of the thing. */
  description?: Maybe<Scalars['String']['output']>;
  /** Unique identifier for this thing entity. */
  id?: Maybe<Scalars['String']['output']>;
  /** Image URL for the thing. */
  image?: Maybe<Scalars['String']['output']>;
  /** Name or title of the thing. */
  name?: Maybe<Scalars['String']['output']>;
  /** External URL or homepage for the thing. */
  url?: Maybe<Scalars['String']['output']>;
};

/** aggregate min on columns */
export type Things_Min_Fields = {
  __typename?: 'things_min_fields';
  /** Description of the thing. */
  description?: Maybe<Scalars['String']['output']>;
  /** Unique identifier for this thing entity. */
  id?: Maybe<Scalars['String']['output']>;
  /** Image URL for the thing. */
  image?: Maybe<Scalars['String']['output']>;
  /** Name or title of the thing. */
  name?: Maybe<Scalars['String']['output']>;
  /** External URL or homepage for the thing. */
  url?: Maybe<Scalars['String']['output']>;
};

/** Ordering options when selecting data from "thing". */
export type Things_Order_By = {
  atom?: InputMaybe<Atoms_Order_By>;
  description?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  image?: InputMaybe<Order_By>;
  name?: InputMaybe<Order_By>;
  url?: InputMaybe<Order_By>;
};

/** select columns of table "thing" */
export type Things_Select_Column =
  /** column name */
  | 'description'
  /** column name */
  | 'id'
  /** column name */
  | 'image'
  /** column name */
  | 'name'
  /** column name */
  | 'url';

/** Streaming cursor of the table "things" */
export type Things_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Things_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Things_Stream_Cursor_Value_Input = {
  /** Description of the thing. */
  description?: InputMaybe<Scalars['String']['input']>;
  /** Unique identifier for this thing entity. */
  id?: InputMaybe<Scalars['String']['input']>;
  /** Image URL for the thing. */
  image?: InputMaybe<Scalars['String']['input']>;
  /** Name or title of the thing. */
  name?: InputMaybe<Scalars['String']['input']>;
  /** External URL or homepage for the thing. */
  url?: InputMaybe<Scalars['String']['input']>;
};

/** Boolean expression to compare columns of type "timestamptz". All fields are combined with logical 'AND'. */
export type Timestamptz_Comparison_Exp = {
  _eq?: InputMaybe<Scalars['timestamptz']['input']>;
  _gt?: InputMaybe<Scalars['timestamptz']['input']>;
  _gte?: InputMaybe<Scalars['timestamptz']['input']>;
  _in?: InputMaybe<Array<Scalars['timestamptz']['input']>>;
  _is_null?: InputMaybe<Scalars['Boolean']['input']>;
  _lt?: InputMaybe<Scalars['timestamptz']['input']>;
  _lte?: InputMaybe<Scalars['timestamptz']['input']>;
  _neq?: InputMaybe<Scalars['timestamptz']['input']>;
  _nin?: InputMaybe<Array<Scalars['timestamptz']['input']>>;
};

/** Aggregated term-level data for triples, tracking total assets and positions across all curves. */
export type Triple_Term = {
  __typename?: 'triple_term';
  /** An object relationship */
  counter_term?: Maybe<Terms>;
  /** Counter-triple term ID for this triple. */
  counter_term_id: Scalars['String']['output'];
  opposer_count: Scalars['bigint']['output'];
  supporter_count: Scalars['bigint']['output'];
  /** An object relationship */
  term?: Maybe<Terms>;
  /** Triple term ID this aggregated data represents. */
  term_id: Scalars['String']['output'];
  /** Total assets across all curves for this triple, in wei. */
  total_assets: Scalars['numeric']['output'];
  /** Total market cap across all curves for this triple, in wei. */
  total_market_cap: Scalars['numeric']['output'];
  /** Total positions across all curves for this triple. */
  total_position_count: Scalars['bigint']['output'];
  /** Timestamp of last update. */
  updated_at: Scalars['timestamptz']['output'];
};

/** Boolean expression to filter rows from the table "triple_term". All fields are combined with a logical 'AND'. */
export type Triple_Term_Bool_Exp = {
  _and?: InputMaybe<Array<Triple_Term_Bool_Exp>>;
  _not?: InputMaybe<Triple_Term_Bool_Exp>;
  _or?: InputMaybe<Array<Triple_Term_Bool_Exp>>;
  counter_term?: InputMaybe<Terms_Bool_Exp>;
  counter_term_id?: InputMaybe<String_Comparison_Exp>;
  opposer_count?: InputMaybe<Bigint_Comparison_Exp>;
  supporter_count?: InputMaybe<Bigint_Comparison_Exp>;
  term?: InputMaybe<Terms_Bool_Exp>;
  term_id?: InputMaybe<String_Comparison_Exp>;
  total_assets?: InputMaybe<Numeric_Comparison_Exp>;
  total_market_cap?: InputMaybe<Numeric_Comparison_Exp>;
  total_position_count?: InputMaybe<Bigint_Comparison_Exp>;
  updated_at?: InputMaybe<Timestamptz_Comparison_Exp>;
};

/** Ordering options when selecting data from "triple_term". */
export type Triple_Term_Order_By = {
  counter_term?: InputMaybe<Terms_Order_By>;
  counter_term_id?: InputMaybe<Order_By>;
  opposer_count?: InputMaybe<Order_By>;
  supporter_count?: InputMaybe<Order_By>;
  term?: InputMaybe<Terms_Order_By>;
  term_id?: InputMaybe<Order_By>;
  total_assets?: InputMaybe<Order_By>;
  total_market_cap?: InputMaybe<Order_By>;
  total_position_count?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
};

/** select columns of table "triple_term" */
export type Triple_Term_Select_Column =
  /** column name */
  | 'counter_term_id'
  /** column name */
  | 'opposer_count'
  /** column name */
  | 'supporter_count'
  /** column name */
  | 'term_id'
  /** column name */
  | 'total_assets'
  /** column name */
  | 'total_market_cap'
  /** column name */
  | 'total_position_count'
  /** column name */
  | 'updated_at';

/** Streaming cursor of the table "triple_term" */
export type Triple_Term_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Triple_Term_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Triple_Term_Stream_Cursor_Value_Input = {
  /** Counter-triple term ID for this triple. */
  counter_term_id?: InputMaybe<Scalars['String']['input']>;
  opposer_count?: InputMaybe<Scalars['bigint']['input']>;
  supporter_count?: InputMaybe<Scalars['bigint']['input']>;
  /** Triple term ID this aggregated data represents. */
  term_id?: InputMaybe<Scalars['String']['input']>;
  /** Total assets across all curves for this triple, in wei. */
  total_assets?: InputMaybe<Scalars['numeric']['input']>;
  /** Total market cap across all curves for this triple, in wei. */
  total_market_cap?: InputMaybe<Scalars['numeric']['input']>;
  /** Total positions across all curves for this triple. */
  total_position_count?: InputMaybe<Scalars['bigint']['input']>;
  /** Timestamp of last update. */
  updated_at?: InputMaybe<Scalars['timestamptz']['input']>;
};

/** Aggregated vault data for triples, denormalized from vault table for query performance. */
export type Triple_Vault = {
  __typename?: 'triple_vault';
  /** Block number of most recent update. */
  block_number: Scalars['numeric']['output'];
  /** An object relationship */
  counter_term?: Maybe<Terms>;
  /** Counter-triple term ID for this triple. */
  counter_term_id: Scalars['String']['output'];
  /** Bonding curve ID for this vault. */
  curve_id: Scalars['numeric']['output'];
  /** Log index of most recent update. */
  log_index: Scalars['bigint']['output'];
  /** Total market cap across triple and counter-triple vaults, in wei. */
  market_cap: Scalars['numeric']['output'];
  /** Total positions across triple and counter-triple vaults. */
  position_count: Scalars['bigint']['output'];
  /** An object relationship */
  term?: Maybe<Terms>;
  /** Triple term ID this aggregated vault data represents. */
  term_id: Scalars['String']['output'];
  /** Total assets across triple and counter-triple vaults, in wei. */
  total_assets: Scalars['numeric']['output'];
  /** Total shares across triple and counter-triple vaults. */
  total_shares: Scalars['numeric']['output'];
  /** Timestamp of last update. */
  updated_at: Scalars['timestamptz']['output'];
};

/** Boolean expression to filter rows from the table "triple_vault". All fields are combined with a logical 'AND'. */
export type Triple_Vault_Bool_Exp = {
  _and?: InputMaybe<Array<Triple_Vault_Bool_Exp>>;
  _not?: InputMaybe<Triple_Vault_Bool_Exp>;
  _or?: InputMaybe<Array<Triple_Vault_Bool_Exp>>;
  block_number?: InputMaybe<Numeric_Comparison_Exp>;
  counter_term?: InputMaybe<Terms_Bool_Exp>;
  counter_term_id?: InputMaybe<String_Comparison_Exp>;
  curve_id?: InputMaybe<Numeric_Comparison_Exp>;
  log_index?: InputMaybe<Bigint_Comparison_Exp>;
  market_cap?: InputMaybe<Numeric_Comparison_Exp>;
  position_count?: InputMaybe<Bigint_Comparison_Exp>;
  term?: InputMaybe<Terms_Bool_Exp>;
  term_id?: InputMaybe<String_Comparison_Exp>;
  total_assets?: InputMaybe<Numeric_Comparison_Exp>;
  total_shares?: InputMaybe<Numeric_Comparison_Exp>;
  updated_at?: InputMaybe<Timestamptz_Comparison_Exp>;
};

/** Ordering options when selecting data from "triple_vault". */
export type Triple_Vault_Order_By = {
  block_number?: InputMaybe<Order_By>;
  counter_term?: InputMaybe<Terms_Order_By>;
  counter_term_id?: InputMaybe<Order_By>;
  curve_id?: InputMaybe<Order_By>;
  log_index?: InputMaybe<Order_By>;
  market_cap?: InputMaybe<Order_By>;
  position_count?: InputMaybe<Order_By>;
  term?: InputMaybe<Terms_Order_By>;
  term_id?: InputMaybe<Order_By>;
  total_assets?: InputMaybe<Order_By>;
  total_shares?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
};

/** select columns of table "triple_vault" */
export type Triple_Vault_Select_Column =
  /** column name */
  | 'block_number'
  /** column name */
  | 'counter_term_id'
  /** column name */
  | 'curve_id'
  /** column name */
  | 'log_index'
  /** column name */
  | 'market_cap'
  /** column name */
  | 'position_count'
  /** column name */
  | 'term_id'
  /** column name */
  | 'total_assets'
  /** column name */
  | 'total_shares'
  /** column name */
  | 'updated_at';

/** Streaming cursor of the table "triple_vault" */
export type Triple_Vault_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Triple_Vault_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Triple_Vault_Stream_Cursor_Value_Input = {
  /** Block number of most recent update. */
  block_number?: InputMaybe<Scalars['numeric']['input']>;
  /** Counter-triple term ID for this triple. */
  counter_term_id?: InputMaybe<Scalars['String']['input']>;
  /** Bonding curve ID for this vault. */
  curve_id?: InputMaybe<Scalars['numeric']['input']>;
  /** Log index of most recent update. */
  log_index?: InputMaybe<Scalars['bigint']['input']>;
  /** Total market cap across triple and counter-triple vaults, in wei. */
  market_cap?: InputMaybe<Scalars['numeric']['input']>;
  /** Total positions across triple and counter-triple vaults. */
  position_count?: InputMaybe<Scalars['bigint']['input']>;
  /** Triple term ID this aggregated vault data represents. */
  term_id?: InputMaybe<Scalars['String']['input']>;
  /** Total assets across triple and counter-triple vaults, in wei. */
  total_assets?: InputMaybe<Scalars['numeric']['input']>;
  /** Total shares across triple and counter-triple vaults. */
  total_shares?: InputMaybe<Scalars['numeric']['input']>;
  /** Timestamp of last update. */
  updated_at?: InputMaybe<Scalars['timestamptz']['input']>;
};

/** Knowledge claims expressed as subject-predicate-object triples, forming the core knowledge graph. */
export type Triples = {
  __typename?: 'triples';
  /** Block number when this triple was created. */
  block_number: Scalars['numeric']['output'];
  /** An array relationship */
  counter_positions: Array<Positions>;
  /** An aggregate relationship */
  counter_positions_aggregate: Positions_Aggregate;
  /** An object relationship */
  counter_term?: Maybe<Terms>;
  /** Term ID of the opposing CounterTriple for this triple. */
  counter_term_id: Scalars['String']['output'];
  /** Timestamp when this triple was created. */
  created_at: Scalars['timestamptz']['output'];
  /** An object relationship */
  creator?: Maybe<Accounts>;
  /** Account that created this triple via smart contract transaction. */
  creator_id: Scalars['String']['output'];
  /** An object relationship */
  object?: Maybe<Atoms>;
  /** Object atom ID forming the third element of the triple. */
  object_id: Scalars['String']['output'];
  /** An object relationship */
  object_term?: Maybe<Terms>;
  /** An array relationship */
  positions: Array<Positions>;
  /** An aggregate relationship */
  positions_aggregate: Positions_Aggregate;
  /** An object relationship */
  predicate?: Maybe<Atoms>;
  /** Predicate atom ID forming the relationship of the triple. */
  predicate_id: Scalars['String']['output'];
  /** An object relationship */
  predicate_term?: Maybe<Terms>;
  /** An object relationship */
  subject?: Maybe<Atoms>;
  /** Subject atom ID forming the first element of the triple. */
  subject_id: Scalars['String']['output'];
  /** An object relationship */
  subject_term?: Maybe<Terms>;
  /** An object relationship */
  term?: Maybe<Terms>;
  /** Unique identifier linking to the term registry. */
  term_id: Scalars['String']['output'];
  /** Transaction hash of the triple creation event. */
  transaction_hash: Scalars['String']['output'];
  /** An object relationship */
  triple_term?: Maybe<Triple_Term>;
  /** An object relationship */
  triple_vault?: Maybe<Triple_Vault>;
};


/** Knowledge claims expressed as subject-predicate-object triples, forming the core knowledge graph. */
export type TriplesCounter_PositionsArgs = {
  distinct_on?: InputMaybe<Array<Positions_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Positions_Order_By>>;
  where?: InputMaybe<Positions_Bool_Exp>;
};


/** Knowledge claims expressed as subject-predicate-object triples, forming the core knowledge graph. */
export type TriplesCounter_Positions_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Positions_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Positions_Order_By>>;
  where?: InputMaybe<Positions_Bool_Exp>;
};


/** Knowledge claims expressed as subject-predicate-object triples, forming the core knowledge graph. */
export type TriplesPositionsArgs = {
  distinct_on?: InputMaybe<Array<Positions_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Positions_Order_By>>;
  where?: InputMaybe<Positions_Bool_Exp>;
};


/** Knowledge claims expressed as subject-predicate-object triples, forming the core knowledge graph. */
export type TriplesPositions_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Positions_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Positions_Order_By>>;
  where?: InputMaybe<Positions_Bool_Exp>;
};

/** aggregated selection of "triple" */
export type Triples_Aggregate = {
  __typename?: 'triples_aggregate';
  aggregate?: Maybe<Triples_Aggregate_Fields>;
  nodes: Array<Triples>;
};

export type Triples_Aggregate_Bool_Exp = {
  count?: InputMaybe<Triples_Aggregate_Bool_Exp_Count>;
};

export type Triples_Aggregate_Bool_Exp_Count = {
  arguments?: InputMaybe<Array<Triples_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
  filter?: InputMaybe<Triples_Bool_Exp>;
  predicate: Int_Comparison_Exp;
};

/** aggregate fields of "triple" */
export type Triples_Aggregate_Fields = {
  __typename?: 'triples_aggregate_fields';
  avg?: Maybe<Triples_Avg_Fields>;
  count: Scalars['Int']['output'];
  max?: Maybe<Triples_Max_Fields>;
  min?: Maybe<Triples_Min_Fields>;
  stddev?: Maybe<Triples_Stddev_Fields>;
  stddev_pop?: Maybe<Triples_Stddev_Pop_Fields>;
  stddev_samp?: Maybe<Triples_Stddev_Samp_Fields>;
  sum?: Maybe<Triples_Sum_Fields>;
  var_pop?: Maybe<Triples_Var_Pop_Fields>;
  var_samp?: Maybe<Triples_Var_Samp_Fields>;
  variance?: Maybe<Triples_Variance_Fields>;
};


/** aggregate fields of "triple" */
export type Triples_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Triples_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
};

/** order by aggregate values of table "triple" */
export type Triples_Aggregate_Order_By = {
  avg?: InputMaybe<Triples_Avg_Order_By>;
  count?: InputMaybe<Order_By>;
  max?: InputMaybe<Triples_Max_Order_By>;
  min?: InputMaybe<Triples_Min_Order_By>;
  stddev?: InputMaybe<Triples_Stddev_Order_By>;
  stddev_pop?: InputMaybe<Triples_Stddev_Pop_Order_By>;
  stddev_samp?: InputMaybe<Triples_Stddev_Samp_Order_By>;
  sum?: InputMaybe<Triples_Sum_Order_By>;
  var_pop?: InputMaybe<Triples_Var_Pop_Order_By>;
  var_samp?: InputMaybe<Triples_Var_Samp_Order_By>;
  variance?: InputMaybe<Triples_Variance_Order_By>;
};

/** aggregate avg on columns */
export type Triples_Avg_Fields = {
  __typename?: 'triples_avg_fields';
  /** Block number when this triple was created. */
  block_number?: Maybe<Scalars['Float']['output']>;
};

/** order by avg() on columns of table "triple" */
export type Triples_Avg_Order_By = {
  /** Block number when this triple was created. */
  block_number?: InputMaybe<Order_By>;
};

/** Boolean expression to filter rows from the table "triple". All fields are combined with a logical 'AND'. */
export type Triples_Bool_Exp = {
  _and?: InputMaybe<Array<Triples_Bool_Exp>>;
  _not?: InputMaybe<Triples_Bool_Exp>;
  _or?: InputMaybe<Array<Triples_Bool_Exp>>;
  block_number?: InputMaybe<Numeric_Comparison_Exp>;
  counter_positions?: InputMaybe<Positions_Bool_Exp>;
  counter_positions_aggregate?: InputMaybe<Positions_Aggregate_Bool_Exp>;
  counter_term?: InputMaybe<Terms_Bool_Exp>;
  counter_term_id?: InputMaybe<String_Comparison_Exp>;
  created_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  creator?: InputMaybe<Accounts_Bool_Exp>;
  creator_id?: InputMaybe<String_Comparison_Exp>;
  object?: InputMaybe<Atoms_Bool_Exp>;
  object_id?: InputMaybe<String_Comparison_Exp>;
  object_term?: InputMaybe<Terms_Bool_Exp>;
  positions?: InputMaybe<Positions_Bool_Exp>;
  positions_aggregate?: InputMaybe<Positions_Aggregate_Bool_Exp>;
  predicate?: InputMaybe<Atoms_Bool_Exp>;
  predicate_id?: InputMaybe<String_Comparison_Exp>;
  predicate_term?: InputMaybe<Terms_Bool_Exp>;
  subject?: InputMaybe<Atoms_Bool_Exp>;
  subject_id?: InputMaybe<String_Comparison_Exp>;
  subject_term?: InputMaybe<Terms_Bool_Exp>;
  term?: InputMaybe<Terms_Bool_Exp>;
  term_id?: InputMaybe<String_Comparison_Exp>;
  transaction_hash?: InputMaybe<String_Comparison_Exp>;
  triple_term?: InputMaybe<Triple_Term_Bool_Exp>;
  triple_vault?: InputMaybe<Triple_Vault_Bool_Exp>;
};

/** aggregate max on columns */
export type Triples_Max_Fields = {
  __typename?: 'triples_max_fields';
  /** Block number when this triple was created. */
  block_number?: Maybe<Scalars['numeric']['output']>;
  /** Term ID of the opposing CounterTriple for this triple. */
  counter_term_id?: Maybe<Scalars['String']['output']>;
  /** Timestamp when this triple was created. */
  created_at?: Maybe<Scalars['timestamptz']['output']>;
  /** Account that created this triple via smart contract transaction. */
  creator_id?: Maybe<Scalars['String']['output']>;
  /** Object atom ID forming the third element of the triple. */
  object_id?: Maybe<Scalars['String']['output']>;
  /** Predicate atom ID forming the relationship of the triple. */
  predicate_id?: Maybe<Scalars['String']['output']>;
  /** Subject atom ID forming the first element of the triple. */
  subject_id?: Maybe<Scalars['String']['output']>;
  /** Unique identifier linking to the term registry. */
  term_id?: Maybe<Scalars['String']['output']>;
  /** Transaction hash of the triple creation event. */
  transaction_hash?: Maybe<Scalars['String']['output']>;
};

/** order by max() on columns of table "triple" */
export type Triples_Max_Order_By = {
  /** Block number when this triple was created. */
  block_number?: InputMaybe<Order_By>;
  /** Term ID of the opposing CounterTriple for this triple. */
  counter_term_id?: InputMaybe<Order_By>;
  /** Timestamp when this triple was created. */
  created_at?: InputMaybe<Order_By>;
  /** Account that created this triple via smart contract transaction. */
  creator_id?: InputMaybe<Order_By>;
  /** Object atom ID forming the third element of the triple. */
  object_id?: InputMaybe<Order_By>;
  /** Predicate atom ID forming the relationship of the triple. */
  predicate_id?: InputMaybe<Order_By>;
  /** Subject atom ID forming the first element of the triple. */
  subject_id?: InputMaybe<Order_By>;
  /** Unique identifier linking to the term registry. */
  term_id?: InputMaybe<Order_By>;
  /** Transaction hash of the triple creation event. */
  transaction_hash?: InputMaybe<Order_By>;
};

/** aggregate min on columns */
export type Triples_Min_Fields = {
  __typename?: 'triples_min_fields';
  /** Block number when this triple was created. */
  block_number?: Maybe<Scalars['numeric']['output']>;
  /** Term ID of the opposing CounterTriple for this triple. */
  counter_term_id?: Maybe<Scalars['String']['output']>;
  /** Timestamp when this triple was created. */
  created_at?: Maybe<Scalars['timestamptz']['output']>;
  /** Account that created this triple via smart contract transaction. */
  creator_id?: Maybe<Scalars['String']['output']>;
  /** Object atom ID forming the third element of the triple. */
  object_id?: Maybe<Scalars['String']['output']>;
  /** Predicate atom ID forming the relationship of the triple. */
  predicate_id?: Maybe<Scalars['String']['output']>;
  /** Subject atom ID forming the first element of the triple. */
  subject_id?: Maybe<Scalars['String']['output']>;
  /** Unique identifier linking to the term registry. */
  term_id?: Maybe<Scalars['String']['output']>;
  /** Transaction hash of the triple creation event. */
  transaction_hash?: Maybe<Scalars['String']['output']>;
};

/** order by min() on columns of table "triple" */
export type Triples_Min_Order_By = {
  /** Block number when this triple was created. */
  block_number?: InputMaybe<Order_By>;
  /** Term ID of the opposing CounterTriple for this triple. */
  counter_term_id?: InputMaybe<Order_By>;
  /** Timestamp when this triple was created. */
  created_at?: InputMaybe<Order_By>;
  /** Account that created this triple via smart contract transaction. */
  creator_id?: InputMaybe<Order_By>;
  /** Object atom ID forming the third element of the triple. */
  object_id?: InputMaybe<Order_By>;
  /** Predicate atom ID forming the relationship of the triple. */
  predicate_id?: InputMaybe<Order_By>;
  /** Subject atom ID forming the first element of the triple. */
  subject_id?: InputMaybe<Order_By>;
  /** Unique identifier linking to the term registry. */
  term_id?: InputMaybe<Order_By>;
  /** Transaction hash of the triple creation event. */
  transaction_hash?: InputMaybe<Order_By>;
};

/** Ordering options when selecting data from "triple". */
export type Triples_Order_By = {
  block_number?: InputMaybe<Order_By>;
  counter_positions_aggregate?: InputMaybe<Positions_Aggregate_Order_By>;
  counter_term?: InputMaybe<Terms_Order_By>;
  counter_term_id?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  creator?: InputMaybe<Accounts_Order_By>;
  creator_id?: InputMaybe<Order_By>;
  object?: InputMaybe<Atoms_Order_By>;
  object_id?: InputMaybe<Order_By>;
  object_term?: InputMaybe<Terms_Order_By>;
  positions_aggregate?: InputMaybe<Positions_Aggregate_Order_By>;
  predicate?: InputMaybe<Atoms_Order_By>;
  predicate_id?: InputMaybe<Order_By>;
  predicate_term?: InputMaybe<Terms_Order_By>;
  subject?: InputMaybe<Atoms_Order_By>;
  subject_id?: InputMaybe<Order_By>;
  subject_term?: InputMaybe<Terms_Order_By>;
  term?: InputMaybe<Terms_Order_By>;
  term_id?: InputMaybe<Order_By>;
  transaction_hash?: InputMaybe<Order_By>;
  triple_term?: InputMaybe<Triple_Term_Order_By>;
  triple_vault?: InputMaybe<Triple_Vault_Order_By>;
};

/** select columns of table "triple" */
export type Triples_Select_Column =
  /** column name */
  | 'block_number'
  /** column name */
  | 'counter_term_id'
  /** column name */
  | 'created_at'
  /** column name */
  | 'creator_id'
  /** column name */
  | 'object_id'
  /** column name */
  | 'predicate_id'
  /** column name */
  | 'subject_id'
  /** column name */
  | 'term_id'
  /** column name */
  | 'transaction_hash';

/** aggregate stddev on columns */
export type Triples_Stddev_Fields = {
  __typename?: 'triples_stddev_fields';
  /** Block number when this triple was created. */
  block_number?: Maybe<Scalars['Float']['output']>;
};

/** order by stddev() on columns of table "triple" */
export type Triples_Stddev_Order_By = {
  /** Block number when this triple was created. */
  block_number?: InputMaybe<Order_By>;
};

/** aggregate stddev_pop on columns */
export type Triples_Stddev_Pop_Fields = {
  __typename?: 'triples_stddev_pop_fields';
  /** Block number when this triple was created. */
  block_number?: Maybe<Scalars['Float']['output']>;
};

/** order by stddev_pop() on columns of table "triple" */
export type Triples_Stddev_Pop_Order_By = {
  /** Block number when this triple was created. */
  block_number?: InputMaybe<Order_By>;
};

/** aggregate stddev_samp on columns */
export type Triples_Stddev_Samp_Fields = {
  __typename?: 'triples_stddev_samp_fields';
  /** Block number when this triple was created. */
  block_number?: Maybe<Scalars['Float']['output']>;
};

/** order by stddev_samp() on columns of table "triple" */
export type Triples_Stddev_Samp_Order_By = {
  /** Block number when this triple was created. */
  block_number?: InputMaybe<Order_By>;
};

/** Streaming cursor of the table "triples" */
export type Triples_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Triples_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Triples_Stream_Cursor_Value_Input = {
  /** Block number when this triple was created. */
  block_number?: InputMaybe<Scalars['numeric']['input']>;
  /** Term ID of the opposing CounterTriple for this triple. */
  counter_term_id?: InputMaybe<Scalars['String']['input']>;
  /** Timestamp when this triple was created. */
  created_at?: InputMaybe<Scalars['timestamptz']['input']>;
  /** Account that created this triple via smart contract transaction. */
  creator_id?: InputMaybe<Scalars['String']['input']>;
  /** Object atom ID forming the third element of the triple. */
  object_id?: InputMaybe<Scalars['String']['input']>;
  /** Predicate atom ID forming the relationship of the triple. */
  predicate_id?: InputMaybe<Scalars['String']['input']>;
  /** Subject atom ID forming the first element of the triple. */
  subject_id?: InputMaybe<Scalars['String']['input']>;
  /** Unique identifier linking to the term registry. */
  term_id?: InputMaybe<Scalars['String']['input']>;
  /** Transaction hash of the triple creation event. */
  transaction_hash?: InputMaybe<Scalars['String']['input']>;
};

/** aggregate sum on columns */
export type Triples_Sum_Fields = {
  __typename?: 'triples_sum_fields';
  /** Block number when this triple was created. */
  block_number?: Maybe<Scalars['numeric']['output']>;
};

/** order by sum() on columns of table "triple" */
export type Triples_Sum_Order_By = {
  /** Block number when this triple was created. */
  block_number?: InputMaybe<Order_By>;
};

/** aggregate var_pop on columns */
export type Triples_Var_Pop_Fields = {
  __typename?: 'triples_var_pop_fields';
  /** Block number when this triple was created. */
  block_number?: Maybe<Scalars['Float']['output']>;
};

/** order by var_pop() on columns of table "triple" */
export type Triples_Var_Pop_Order_By = {
  /** Block number when this triple was created. */
  block_number?: InputMaybe<Order_By>;
};

/** aggregate var_samp on columns */
export type Triples_Var_Samp_Fields = {
  __typename?: 'triples_var_samp_fields';
  /** Block number when this triple was created. */
  block_number?: Maybe<Scalars['Float']['output']>;
};

/** order by var_samp() on columns of table "triple" */
export type Triples_Var_Samp_Order_By = {
  /** Block number when this triple was created. */
  block_number?: InputMaybe<Order_By>;
};

/** aggregate variance on columns */
export type Triples_Variance_Fields = {
  __typename?: 'triples_variance_fields';
  /** Block number when this triple was created. */
  block_number?: Maybe<Scalars['Float']['output']>;
};

/** order by variance() on columns of table "triple" */
export type Triples_Variance_Order_By = {
  /** Block number when this triple was created. */
  block_number?: InputMaybe<Order_By>;
};

/** Boolean expression to compare columns of type "vault_type". All fields are combined with logical 'AND'. */
export type Vault_Type_Comparison_Exp = {
  _eq?: InputMaybe<Scalars['vault_type']['input']>;
  _gt?: InputMaybe<Scalars['vault_type']['input']>;
  _gte?: InputMaybe<Scalars['vault_type']['input']>;
  _in?: InputMaybe<Array<Scalars['vault_type']['input']>>;
  _is_null?: InputMaybe<Scalars['Boolean']['input']>;
  _lt?: InputMaybe<Scalars['vault_type']['input']>;
  _lte?: InputMaybe<Scalars['vault_type']['input']>;
  _neq?: InputMaybe<Scalars['vault_type']['input']>;
  _nin?: InputMaybe<Array<Scalars['vault_type']['input']>>;
};

/** Bonding curve vaults that hold assets backing atoms or triples, tracking shares and market capitalization. */
export type Vaults = {
  __typename?: 'vaults';
  /** Block number of the most recent vault state update. */
  block_number: Scalars['bigint']['output'];
  /** Timestamp when this vault was created. */
  created_at: Scalars['timestamptz']['output'];
  /** Current price per share in wei. */
  current_share_price: Scalars['numeric']['output'];
  /** Bonding curve configuration ID determining pricing curve. */
  curve_id: Scalars['numeric']['output'];
  /** An array relationship */
  deposits: Array<Deposits>;
  /** An aggregate relationship */
  deposits_aggregate: Deposits_Aggregate;
  /** Log index of the most recent vault state update. */
  log_index: Scalars['bigint']['output'];
  /** Market capitalization (total_shares * current_share_price) in wei. */
  market_cap: Scalars['numeric']['output'];
  /** Number of active positions in this vault. */
  position_count: Scalars['Int']['output'];
  /** An array relationship */
  positions: Array<Positions>;
  /** An aggregate relationship */
  positions_aggregate: Positions_Aggregate;
  /** An array relationship */
  redemptions: Array<Redemptions>;
  /** An aggregate relationship */
  redemptions_aggregate: Redemptions_Aggregate;
  /** An array relationship */
  share_price_change_stats_daily: Array<Share_Price_Change_Stats_Daily>;
  /** An array relationship */
  share_price_change_stats_hourly: Array<Share_Price_Change_Stats_Hourly>;
  /** An array relationship */
  share_price_change_stats_monthly: Array<Share_Price_Change_Stats_Monthly>;
  /** An array relationship */
  share_price_change_stats_weekly: Array<Share_Price_Change_Stats_Weekly>;
  /** An array relationship */
  share_price_changes: Array<Share_Price_Changes>;
  /** An aggregate relationship */
  share_price_changes_aggregate: Share_Price_Changes_Aggregate;
  /** An array relationship */
  signals: Array<Signals>;
  /** An aggregate relationship */
  signals_aggregate: Signals_Aggregate;
  /** An object relationship */
  term?: Maybe<Terms>;
  /** Term ID this vault backs (atom or triple). */
  term_id: Scalars['String']['output'];
  /** Total assets held in this vault in wei. */
  total_assets: Scalars['numeric']['output'];
  /** Total shares issued by this vault. */
  total_shares: Scalars['numeric']['output'];
  /** Transaction hash of the most recent vault state update. */
  transaction_hash: Scalars['String']['output'];
  /** Timestamp of last update to this vault. */
  updated_at: Scalars['timestamptz']['output'];
};


/** Bonding curve vaults that hold assets backing atoms or triples, tracking shares and market capitalization. */
export type VaultsDepositsArgs = {
  distinct_on?: InputMaybe<Array<Deposits_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Deposits_Order_By>>;
  where?: InputMaybe<Deposits_Bool_Exp>;
};


/** Bonding curve vaults that hold assets backing atoms or triples, tracking shares and market capitalization. */
export type VaultsDeposits_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Deposits_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Deposits_Order_By>>;
  where?: InputMaybe<Deposits_Bool_Exp>;
};


/** Bonding curve vaults that hold assets backing atoms or triples, tracking shares and market capitalization. */
export type VaultsPositionsArgs = {
  distinct_on?: InputMaybe<Array<Positions_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Positions_Order_By>>;
  where?: InputMaybe<Positions_Bool_Exp>;
};


/** Bonding curve vaults that hold assets backing atoms or triples, tracking shares and market capitalization. */
export type VaultsPositions_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Positions_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Positions_Order_By>>;
  where?: InputMaybe<Positions_Bool_Exp>;
};


/** Bonding curve vaults that hold assets backing atoms or triples, tracking shares and market capitalization. */
export type VaultsRedemptionsArgs = {
  distinct_on?: InputMaybe<Array<Redemptions_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Redemptions_Order_By>>;
  where?: InputMaybe<Redemptions_Bool_Exp>;
};


/** Bonding curve vaults that hold assets backing atoms or triples, tracking shares and market capitalization. */
export type VaultsRedemptions_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Redemptions_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Redemptions_Order_By>>;
  where?: InputMaybe<Redemptions_Bool_Exp>;
};


/** Bonding curve vaults that hold assets backing atoms or triples, tracking shares and market capitalization. */
export type VaultsShare_Price_Change_Stats_DailyArgs = {
  distinct_on?: InputMaybe<Array<Share_Price_Change_Stats_Daily_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Share_Price_Change_Stats_Daily_Order_By>>;
  where?: InputMaybe<Share_Price_Change_Stats_Daily_Bool_Exp>;
};


/** Bonding curve vaults that hold assets backing atoms or triples, tracking shares and market capitalization. */
export type VaultsShare_Price_Change_Stats_HourlyArgs = {
  distinct_on?: InputMaybe<Array<Share_Price_Change_Stats_Hourly_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Share_Price_Change_Stats_Hourly_Order_By>>;
  where?: InputMaybe<Share_Price_Change_Stats_Hourly_Bool_Exp>;
};


/** Bonding curve vaults that hold assets backing atoms or triples, tracking shares and market capitalization. */
export type VaultsShare_Price_Change_Stats_MonthlyArgs = {
  distinct_on?: InputMaybe<Array<Share_Price_Change_Stats_Monthly_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Share_Price_Change_Stats_Monthly_Order_By>>;
  where?: InputMaybe<Share_Price_Change_Stats_Monthly_Bool_Exp>;
};


/** Bonding curve vaults that hold assets backing atoms or triples, tracking shares and market capitalization. */
export type VaultsShare_Price_Change_Stats_WeeklyArgs = {
  distinct_on?: InputMaybe<Array<Share_Price_Change_Stats_Weekly_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Share_Price_Change_Stats_Weekly_Order_By>>;
  where?: InputMaybe<Share_Price_Change_Stats_Weekly_Bool_Exp>;
};


/** Bonding curve vaults that hold assets backing atoms or triples, tracking shares and market capitalization. */
export type VaultsShare_Price_ChangesArgs = {
  distinct_on?: InputMaybe<Array<Share_Price_Changes_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Share_Price_Changes_Order_By>>;
  where?: InputMaybe<Share_Price_Changes_Bool_Exp>;
};


/** Bonding curve vaults that hold assets backing atoms or triples, tracking shares and market capitalization. */
export type VaultsShare_Price_Changes_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Share_Price_Changes_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Share_Price_Changes_Order_By>>;
  where?: InputMaybe<Share_Price_Changes_Bool_Exp>;
};


/** Bonding curve vaults that hold assets backing atoms or triples, tracking shares and market capitalization. */
export type VaultsSignalsArgs = {
  distinct_on?: InputMaybe<Array<Signals_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Signals_Order_By>>;
  where?: InputMaybe<Signals_Bool_Exp>;
};


/** Bonding curve vaults that hold assets backing atoms or triples, tracking shares and market capitalization. */
export type VaultsSignals_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Signals_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Signals_Order_By>>;
  where?: InputMaybe<Signals_Bool_Exp>;
};

/** aggregated selection of "vault" */
export type Vaults_Aggregate = {
  __typename?: 'vaults_aggregate';
  aggregate?: Maybe<Vaults_Aggregate_Fields>;
  nodes: Array<Vaults>;
};

export type Vaults_Aggregate_Bool_Exp = {
  count?: InputMaybe<Vaults_Aggregate_Bool_Exp_Count>;
};

export type Vaults_Aggregate_Bool_Exp_Count = {
  arguments?: InputMaybe<Array<Vaults_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
  filter?: InputMaybe<Vaults_Bool_Exp>;
  predicate: Int_Comparison_Exp;
};

/** aggregate fields of "vault" */
export type Vaults_Aggregate_Fields = {
  __typename?: 'vaults_aggregate_fields';
  avg?: Maybe<Vaults_Avg_Fields>;
  count: Scalars['Int']['output'];
  max?: Maybe<Vaults_Max_Fields>;
  min?: Maybe<Vaults_Min_Fields>;
  stddev?: Maybe<Vaults_Stddev_Fields>;
  stddev_pop?: Maybe<Vaults_Stddev_Pop_Fields>;
  stddev_samp?: Maybe<Vaults_Stddev_Samp_Fields>;
  sum?: Maybe<Vaults_Sum_Fields>;
  var_pop?: Maybe<Vaults_Var_Pop_Fields>;
  var_samp?: Maybe<Vaults_Var_Samp_Fields>;
  variance?: Maybe<Vaults_Variance_Fields>;
};


/** aggregate fields of "vault" */
export type Vaults_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Vaults_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
};

/** order by aggregate values of table "vault" */
export type Vaults_Aggregate_Order_By = {
  avg?: InputMaybe<Vaults_Avg_Order_By>;
  count?: InputMaybe<Order_By>;
  max?: InputMaybe<Vaults_Max_Order_By>;
  min?: InputMaybe<Vaults_Min_Order_By>;
  stddev?: InputMaybe<Vaults_Stddev_Order_By>;
  stddev_pop?: InputMaybe<Vaults_Stddev_Pop_Order_By>;
  stddev_samp?: InputMaybe<Vaults_Stddev_Samp_Order_By>;
  sum?: InputMaybe<Vaults_Sum_Order_By>;
  var_pop?: InputMaybe<Vaults_Var_Pop_Order_By>;
  var_samp?: InputMaybe<Vaults_Var_Samp_Order_By>;
  variance?: InputMaybe<Vaults_Variance_Order_By>;
};

/** aggregate avg on columns */
export type Vaults_Avg_Fields = {
  __typename?: 'vaults_avg_fields';
  /** Block number of the most recent vault state update. */
  block_number?: Maybe<Scalars['Float']['output']>;
  /** Current price per share in wei. */
  current_share_price?: Maybe<Scalars['Float']['output']>;
  /** Bonding curve configuration ID determining pricing curve. */
  curve_id?: Maybe<Scalars['Float']['output']>;
  /** Log index of the most recent vault state update. */
  log_index?: Maybe<Scalars['Float']['output']>;
  /** Market capitalization (total_shares * current_share_price) in wei. */
  market_cap?: Maybe<Scalars['Float']['output']>;
  /** Number of active positions in this vault. */
  position_count?: Maybe<Scalars['Float']['output']>;
  /** Total assets held in this vault in wei. */
  total_assets?: Maybe<Scalars['Float']['output']>;
  /** Total shares issued by this vault. */
  total_shares?: Maybe<Scalars['Float']['output']>;
};

/** order by avg() on columns of table "vault" */
export type Vaults_Avg_Order_By = {
  /** Block number of the most recent vault state update. */
  block_number?: InputMaybe<Order_By>;
  /** Current price per share in wei. */
  current_share_price?: InputMaybe<Order_By>;
  /** Bonding curve configuration ID determining pricing curve. */
  curve_id?: InputMaybe<Order_By>;
  /** Log index of the most recent vault state update. */
  log_index?: InputMaybe<Order_By>;
  /** Market capitalization (total_shares * current_share_price) in wei. */
  market_cap?: InputMaybe<Order_By>;
  /** Number of active positions in this vault. */
  position_count?: InputMaybe<Order_By>;
  /** Total assets held in this vault in wei. */
  total_assets?: InputMaybe<Order_By>;
  /** Total shares issued by this vault. */
  total_shares?: InputMaybe<Order_By>;
};

/** Boolean expression to filter rows from the table "vault". All fields are combined with a logical 'AND'. */
export type Vaults_Bool_Exp = {
  _and?: InputMaybe<Array<Vaults_Bool_Exp>>;
  _not?: InputMaybe<Vaults_Bool_Exp>;
  _or?: InputMaybe<Array<Vaults_Bool_Exp>>;
  block_number?: InputMaybe<Bigint_Comparison_Exp>;
  created_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  current_share_price?: InputMaybe<Numeric_Comparison_Exp>;
  curve_id?: InputMaybe<Numeric_Comparison_Exp>;
  deposits?: InputMaybe<Deposits_Bool_Exp>;
  deposits_aggregate?: InputMaybe<Deposits_Aggregate_Bool_Exp>;
  log_index?: InputMaybe<Bigint_Comparison_Exp>;
  market_cap?: InputMaybe<Numeric_Comparison_Exp>;
  position_count?: InputMaybe<Int_Comparison_Exp>;
  positions?: InputMaybe<Positions_Bool_Exp>;
  positions_aggregate?: InputMaybe<Positions_Aggregate_Bool_Exp>;
  redemptions?: InputMaybe<Redemptions_Bool_Exp>;
  redemptions_aggregate?: InputMaybe<Redemptions_Aggregate_Bool_Exp>;
  share_price_change_stats_daily?: InputMaybe<Share_Price_Change_Stats_Daily_Bool_Exp>;
  share_price_change_stats_hourly?: InputMaybe<Share_Price_Change_Stats_Hourly_Bool_Exp>;
  share_price_change_stats_monthly?: InputMaybe<Share_Price_Change_Stats_Monthly_Bool_Exp>;
  share_price_change_stats_weekly?: InputMaybe<Share_Price_Change_Stats_Weekly_Bool_Exp>;
  share_price_changes?: InputMaybe<Share_Price_Changes_Bool_Exp>;
  share_price_changes_aggregate?: InputMaybe<Share_Price_Changes_Aggregate_Bool_Exp>;
  signals?: InputMaybe<Signals_Bool_Exp>;
  signals_aggregate?: InputMaybe<Signals_Aggregate_Bool_Exp>;
  term?: InputMaybe<Terms_Bool_Exp>;
  term_id?: InputMaybe<String_Comparison_Exp>;
  total_assets?: InputMaybe<Numeric_Comparison_Exp>;
  total_shares?: InputMaybe<Numeric_Comparison_Exp>;
  transaction_hash?: InputMaybe<String_Comparison_Exp>;
  updated_at?: InputMaybe<Timestamptz_Comparison_Exp>;
};

/** aggregate max on columns */
export type Vaults_Max_Fields = {
  __typename?: 'vaults_max_fields';
  /** Block number of the most recent vault state update. */
  block_number?: Maybe<Scalars['bigint']['output']>;
  /** Timestamp when this vault was created. */
  created_at?: Maybe<Scalars['timestamptz']['output']>;
  /** Current price per share in wei. */
  current_share_price?: Maybe<Scalars['numeric']['output']>;
  /** Bonding curve configuration ID determining pricing curve. */
  curve_id?: Maybe<Scalars['numeric']['output']>;
  /** Log index of the most recent vault state update. */
  log_index?: Maybe<Scalars['bigint']['output']>;
  /** Market capitalization (total_shares * current_share_price) in wei. */
  market_cap?: Maybe<Scalars['numeric']['output']>;
  /** Number of active positions in this vault. */
  position_count?: Maybe<Scalars['Int']['output']>;
  /** Term ID this vault backs (atom or triple). */
  term_id?: Maybe<Scalars['String']['output']>;
  /** Total assets held in this vault in wei. */
  total_assets?: Maybe<Scalars['numeric']['output']>;
  /** Total shares issued by this vault. */
  total_shares?: Maybe<Scalars['numeric']['output']>;
  /** Transaction hash of the most recent vault state update. */
  transaction_hash?: Maybe<Scalars['String']['output']>;
  /** Timestamp of last update to this vault. */
  updated_at?: Maybe<Scalars['timestamptz']['output']>;
};

/** order by max() on columns of table "vault" */
export type Vaults_Max_Order_By = {
  /** Block number of the most recent vault state update. */
  block_number?: InputMaybe<Order_By>;
  /** Timestamp when this vault was created. */
  created_at?: InputMaybe<Order_By>;
  /** Current price per share in wei. */
  current_share_price?: InputMaybe<Order_By>;
  /** Bonding curve configuration ID determining pricing curve. */
  curve_id?: InputMaybe<Order_By>;
  /** Log index of the most recent vault state update. */
  log_index?: InputMaybe<Order_By>;
  /** Market capitalization (total_shares * current_share_price) in wei. */
  market_cap?: InputMaybe<Order_By>;
  /** Number of active positions in this vault. */
  position_count?: InputMaybe<Order_By>;
  /** Term ID this vault backs (atom or triple). */
  term_id?: InputMaybe<Order_By>;
  /** Total assets held in this vault in wei. */
  total_assets?: InputMaybe<Order_By>;
  /** Total shares issued by this vault. */
  total_shares?: InputMaybe<Order_By>;
  /** Transaction hash of the most recent vault state update. */
  transaction_hash?: InputMaybe<Order_By>;
  /** Timestamp of last update to this vault. */
  updated_at?: InputMaybe<Order_By>;
};

/** aggregate min on columns */
export type Vaults_Min_Fields = {
  __typename?: 'vaults_min_fields';
  /** Block number of the most recent vault state update. */
  block_number?: Maybe<Scalars['bigint']['output']>;
  /** Timestamp when this vault was created. */
  created_at?: Maybe<Scalars['timestamptz']['output']>;
  /** Current price per share in wei. */
  current_share_price?: Maybe<Scalars['numeric']['output']>;
  /** Bonding curve configuration ID determining pricing curve. */
  curve_id?: Maybe<Scalars['numeric']['output']>;
  /** Log index of the most recent vault state update. */
  log_index?: Maybe<Scalars['bigint']['output']>;
  /** Market capitalization (total_shares * current_share_price) in wei. */
  market_cap?: Maybe<Scalars['numeric']['output']>;
  /** Number of active positions in this vault. */
  position_count?: Maybe<Scalars['Int']['output']>;
  /** Term ID this vault backs (atom or triple). */
  term_id?: Maybe<Scalars['String']['output']>;
  /** Total assets held in this vault in wei. */
  total_assets?: Maybe<Scalars['numeric']['output']>;
  /** Total shares issued by this vault. */
  total_shares?: Maybe<Scalars['numeric']['output']>;
  /** Transaction hash of the most recent vault state update. */
  transaction_hash?: Maybe<Scalars['String']['output']>;
  /** Timestamp of last update to this vault. */
  updated_at?: Maybe<Scalars['timestamptz']['output']>;
};

/** order by min() on columns of table "vault" */
export type Vaults_Min_Order_By = {
  /** Block number of the most recent vault state update. */
  block_number?: InputMaybe<Order_By>;
  /** Timestamp when this vault was created. */
  created_at?: InputMaybe<Order_By>;
  /** Current price per share in wei. */
  current_share_price?: InputMaybe<Order_By>;
  /** Bonding curve configuration ID determining pricing curve. */
  curve_id?: InputMaybe<Order_By>;
  /** Log index of the most recent vault state update. */
  log_index?: InputMaybe<Order_By>;
  /** Market capitalization (total_shares * current_share_price) in wei. */
  market_cap?: InputMaybe<Order_By>;
  /** Number of active positions in this vault. */
  position_count?: InputMaybe<Order_By>;
  /** Term ID this vault backs (atom or triple). */
  term_id?: InputMaybe<Order_By>;
  /** Total assets held in this vault in wei. */
  total_assets?: InputMaybe<Order_By>;
  /** Total shares issued by this vault. */
  total_shares?: InputMaybe<Order_By>;
  /** Transaction hash of the most recent vault state update. */
  transaction_hash?: InputMaybe<Order_By>;
  /** Timestamp of last update to this vault. */
  updated_at?: InputMaybe<Order_By>;
};

/** Ordering options when selecting data from "vault". */
export type Vaults_Order_By = {
  block_number?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  current_share_price?: InputMaybe<Order_By>;
  curve_id?: InputMaybe<Order_By>;
  deposits_aggregate?: InputMaybe<Deposits_Aggregate_Order_By>;
  log_index?: InputMaybe<Order_By>;
  market_cap?: InputMaybe<Order_By>;
  position_count?: InputMaybe<Order_By>;
  positions_aggregate?: InputMaybe<Positions_Aggregate_Order_By>;
  redemptions_aggregate?: InputMaybe<Redemptions_Aggregate_Order_By>;
  share_price_change_stats_daily_aggregate?: InputMaybe<Share_Price_Change_Stats_Daily_Aggregate_Order_By>;
  share_price_change_stats_hourly_aggregate?: InputMaybe<Share_Price_Change_Stats_Hourly_Aggregate_Order_By>;
  share_price_change_stats_monthly_aggregate?: InputMaybe<Share_Price_Change_Stats_Monthly_Aggregate_Order_By>;
  share_price_change_stats_weekly_aggregate?: InputMaybe<Share_Price_Change_Stats_Weekly_Aggregate_Order_By>;
  share_price_changes_aggregate?: InputMaybe<Share_Price_Changes_Aggregate_Order_By>;
  signals_aggregate?: InputMaybe<Signals_Aggregate_Order_By>;
  term?: InputMaybe<Terms_Order_By>;
  term_id?: InputMaybe<Order_By>;
  total_assets?: InputMaybe<Order_By>;
  total_shares?: InputMaybe<Order_By>;
  transaction_hash?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
};

/** select columns of table "vault" */
export type Vaults_Select_Column =
  /** column name */
  | 'block_number'
  /** column name */
  | 'created_at'
  /** column name */
  | 'current_share_price'
  /** column name */
  | 'curve_id'
  /** column name */
  | 'log_index'
  /** column name */
  | 'market_cap'
  /** column name */
  | 'position_count'
  /** column name */
  | 'term_id'
  /** column name */
  | 'total_assets'
  /** column name */
  | 'total_shares'
  /** column name */
  | 'transaction_hash'
  /** column name */
  | 'updated_at';

/** aggregate stddev on columns */
export type Vaults_Stddev_Fields = {
  __typename?: 'vaults_stddev_fields';
  /** Block number of the most recent vault state update. */
  block_number?: Maybe<Scalars['Float']['output']>;
  /** Current price per share in wei. */
  current_share_price?: Maybe<Scalars['Float']['output']>;
  /** Bonding curve configuration ID determining pricing curve. */
  curve_id?: Maybe<Scalars['Float']['output']>;
  /** Log index of the most recent vault state update. */
  log_index?: Maybe<Scalars['Float']['output']>;
  /** Market capitalization (total_shares * current_share_price) in wei. */
  market_cap?: Maybe<Scalars['Float']['output']>;
  /** Number of active positions in this vault. */
  position_count?: Maybe<Scalars['Float']['output']>;
  /** Total assets held in this vault in wei. */
  total_assets?: Maybe<Scalars['Float']['output']>;
  /** Total shares issued by this vault. */
  total_shares?: Maybe<Scalars['Float']['output']>;
};

/** order by stddev() on columns of table "vault" */
export type Vaults_Stddev_Order_By = {
  /** Block number of the most recent vault state update. */
  block_number?: InputMaybe<Order_By>;
  /** Current price per share in wei. */
  current_share_price?: InputMaybe<Order_By>;
  /** Bonding curve configuration ID determining pricing curve. */
  curve_id?: InputMaybe<Order_By>;
  /** Log index of the most recent vault state update. */
  log_index?: InputMaybe<Order_By>;
  /** Market capitalization (total_shares * current_share_price) in wei. */
  market_cap?: InputMaybe<Order_By>;
  /** Number of active positions in this vault. */
  position_count?: InputMaybe<Order_By>;
  /** Total assets held in this vault in wei. */
  total_assets?: InputMaybe<Order_By>;
  /** Total shares issued by this vault. */
  total_shares?: InputMaybe<Order_By>;
};

/** aggregate stddev_pop on columns */
export type Vaults_Stddev_Pop_Fields = {
  __typename?: 'vaults_stddev_pop_fields';
  /** Block number of the most recent vault state update. */
  block_number?: Maybe<Scalars['Float']['output']>;
  /** Current price per share in wei. */
  current_share_price?: Maybe<Scalars['Float']['output']>;
  /** Bonding curve configuration ID determining pricing curve. */
  curve_id?: Maybe<Scalars['Float']['output']>;
  /** Log index of the most recent vault state update. */
  log_index?: Maybe<Scalars['Float']['output']>;
  /** Market capitalization (total_shares * current_share_price) in wei. */
  market_cap?: Maybe<Scalars['Float']['output']>;
  /** Number of active positions in this vault. */
  position_count?: Maybe<Scalars['Float']['output']>;
  /** Total assets held in this vault in wei. */
  total_assets?: Maybe<Scalars['Float']['output']>;
  /** Total shares issued by this vault. */
  total_shares?: Maybe<Scalars['Float']['output']>;
};

/** order by stddev_pop() on columns of table "vault" */
export type Vaults_Stddev_Pop_Order_By = {
  /** Block number of the most recent vault state update. */
  block_number?: InputMaybe<Order_By>;
  /** Current price per share in wei. */
  current_share_price?: InputMaybe<Order_By>;
  /** Bonding curve configuration ID determining pricing curve. */
  curve_id?: InputMaybe<Order_By>;
  /** Log index of the most recent vault state update. */
  log_index?: InputMaybe<Order_By>;
  /** Market capitalization (total_shares * current_share_price) in wei. */
  market_cap?: InputMaybe<Order_By>;
  /** Number of active positions in this vault. */
  position_count?: InputMaybe<Order_By>;
  /** Total assets held in this vault in wei. */
  total_assets?: InputMaybe<Order_By>;
  /** Total shares issued by this vault. */
  total_shares?: InputMaybe<Order_By>;
};

/** aggregate stddev_samp on columns */
export type Vaults_Stddev_Samp_Fields = {
  __typename?: 'vaults_stddev_samp_fields';
  /** Block number of the most recent vault state update. */
  block_number?: Maybe<Scalars['Float']['output']>;
  /** Current price per share in wei. */
  current_share_price?: Maybe<Scalars['Float']['output']>;
  /** Bonding curve configuration ID determining pricing curve. */
  curve_id?: Maybe<Scalars['Float']['output']>;
  /** Log index of the most recent vault state update. */
  log_index?: Maybe<Scalars['Float']['output']>;
  /** Market capitalization (total_shares * current_share_price) in wei. */
  market_cap?: Maybe<Scalars['Float']['output']>;
  /** Number of active positions in this vault. */
  position_count?: Maybe<Scalars['Float']['output']>;
  /** Total assets held in this vault in wei. */
  total_assets?: Maybe<Scalars['Float']['output']>;
  /** Total shares issued by this vault. */
  total_shares?: Maybe<Scalars['Float']['output']>;
};

/** order by stddev_samp() on columns of table "vault" */
export type Vaults_Stddev_Samp_Order_By = {
  /** Block number of the most recent vault state update. */
  block_number?: InputMaybe<Order_By>;
  /** Current price per share in wei. */
  current_share_price?: InputMaybe<Order_By>;
  /** Bonding curve configuration ID determining pricing curve. */
  curve_id?: InputMaybe<Order_By>;
  /** Log index of the most recent vault state update. */
  log_index?: InputMaybe<Order_By>;
  /** Market capitalization (total_shares * current_share_price) in wei. */
  market_cap?: InputMaybe<Order_By>;
  /** Number of active positions in this vault. */
  position_count?: InputMaybe<Order_By>;
  /** Total assets held in this vault in wei. */
  total_assets?: InputMaybe<Order_By>;
  /** Total shares issued by this vault. */
  total_shares?: InputMaybe<Order_By>;
};

/** Streaming cursor of the table "vaults" */
export type Vaults_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Vaults_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Vaults_Stream_Cursor_Value_Input = {
  /** Block number of the most recent vault state update. */
  block_number?: InputMaybe<Scalars['bigint']['input']>;
  /** Timestamp when this vault was created. */
  created_at?: InputMaybe<Scalars['timestamptz']['input']>;
  /** Current price per share in wei. */
  current_share_price?: InputMaybe<Scalars['numeric']['input']>;
  /** Bonding curve configuration ID determining pricing curve. */
  curve_id?: InputMaybe<Scalars['numeric']['input']>;
  /** Log index of the most recent vault state update. */
  log_index?: InputMaybe<Scalars['bigint']['input']>;
  /** Market capitalization (total_shares * current_share_price) in wei. */
  market_cap?: InputMaybe<Scalars['numeric']['input']>;
  /** Number of active positions in this vault. */
  position_count?: InputMaybe<Scalars['Int']['input']>;
  /** Term ID this vault backs (atom or triple). */
  term_id?: InputMaybe<Scalars['String']['input']>;
  /** Total assets held in this vault in wei. */
  total_assets?: InputMaybe<Scalars['numeric']['input']>;
  /** Total shares issued by this vault. */
  total_shares?: InputMaybe<Scalars['numeric']['input']>;
  /** Transaction hash of the most recent vault state update. */
  transaction_hash?: InputMaybe<Scalars['String']['input']>;
  /** Timestamp of last update to this vault. */
  updated_at?: InputMaybe<Scalars['timestamptz']['input']>;
};

/** aggregate sum on columns */
export type Vaults_Sum_Fields = {
  __typename?: 'vaults_sum_fields';
  /** Block number of the most recent vault state update. */
  block_number?: Maybe<Scalars['bigint']['output']>;
  /** Current price per share in wei. */
  current_share_price?: Maybe<Scalars['numeric']['output']>;
  /** Bonding curve configuration ID determining pricing curve. */
  curve_id?: Maybe<Scalars['numeric']['output']>;
  /** Log index of the most recent vault state update. */
  log_index?: Maybe<Scalars['bigint']['output']>;
  /** Market capitalization (total_shares * current_share_price) in wei. */
  market_cap?: Maybe<Scalars['numeric']['output']>;
  /** Number of active positions in this vault. */
  position_count?: Maybe<Scalars['Int']['output']>;
  /** Total assets held in this vault in wei. */
  total_assets?: Maybe<Scalars['numeric']['output']>;
  /** Total shares issued by this vault. */
  total_shares?: Maybe<Scalars['numeric']['output']>;
};

/** order by sum() on columns of table "vault" */
export type Vaults_Sum_Order_By = {
  /** Block number of the most recent vault state update. */
  block_number?: InputMaybe<Order_By>;
  /** Current price per share in wei. */
  current_share_price?: InputMaybe<Order_By>;
  /** Bonding curve configuration ID determining pricing curve. */
  curve_id?: InputMaybe<Order_By>;
  /** Log index of the most recent vault state update. */
  log_index?: InputMaybe<Order_By>;
  /** Market capitalization (total_shares * current_share_price) in wei. */
  market_cap?: InputMaybe<Order_By>;
  /** Number of active positions in this vault. */
  position_count?: InputMaybe<Order_By>;
  /** Total assets held in this vault in wei. */
  total_assets?: InputMaybe<Order_By>;
  /** Total shares issued by this vault. */
  total_shares?: InputMaybe<Order_By>;
};

/** aggregate var_pop on columns */
export type Vaults_Var_Pop_Fields = {
  __typename?: 'vaults_var_pop_fields';
  /** Block number of the most recent vault state update. */
  block_number?: Maybe<Scalars['Float']['output']>;
  /** Current price per share in wei. */
  current_share_price?: Maybe<Scalars['Float']['output']>;
  /** Bonding curve configuration ID determining pricing curve. */
  curve_id?: Maybe<Scalars['Float']['output']>;
  /** Log index of the most recent vault state update. */
  log_index?: Maybe<Scalars['Float']['output']>;
  /** Market capitalization (total_shares * current_share_price) in wei. */
  market_cap?: Maybe<Scalars['Float']['output']>;
  /** Number of active positions in this vault. */
  position_count?: Maybe<Scalars['Float']['output']>;
  /** Total assets held in this vault in wei. */
  total_assets?: Maybe<Scalars['Float']['output']>;
  /** Total shares issued by this vault. */
  total_shares?: Maybe<Scalars['Float']['output']>;
};

/** order by var_pop() on columns of table "vault" */
export type Vaults_Var_Pop_Order_By = {
  /** Block number of the most recent vault state update. */
  block_number?: InputMaybe<Order_By>;
  /** Current price per share in wei. */
  current_share_price?: InputMaybe<Order_By>;
  /** Bonding curve configuration ID determining pricing curve. */
  curve_id?: InputMaybe<Order_By>;
  /** Log index of the most recent vault state update. */
  log_index?: InputMaybe<Order_By>;
  /** Market capitalization (total_shares * current_share_price) in wei. */
  market_cap?: InputMaybe<Order_By>;
  /** Number of active positions in this vault. */
  position_count?: InputMaybe<Order_By>;
  /** Total assets held in this vault in wei. */
  total_assets?: InputMaybe<Order_By>;
  /** Total shares issued by this vault. */
  total_shares?: InputMaybe<Order_By>;
};

/** aggregate var_samp on columns */
export type Vaults_Var_Samp_Fields = {
  __typename?: 'vaults_var_samp_fields';
  /** Block number of the most recent vault state update. */
  block_number?: Maybe<Scalars['Float']['output']>;
  /** Current price per share in wei. */
  current_share_price?: Maybe<Scalars['Float']['output']>;
  /** Bonding curve configuration ID determining pricing curve. */
  curve_id?: Maybe<Scalars['Float']['output']>;
  /** Log index of the most recent vault state update. */
  log_index?: Maybe<Scalars['Float']['output']>;
  /** Market capitalization (total_shares * current_share_price) in wei. */
  market_cap?: Maybe<Scalars['Float']['output']>;
  /** Number of active positions in this vault. */
  position_count?: Maybe<Scalars['Float']['output']>;
  /** Total assets held in this vault in wei. */
  total_assets?: Maybe<Scalars['Float']['output']>;
  /** Total shares issued by this vault. */
  total_shares?: Maybe<Scalars['Float']['output']>;
};

/** order by var_samp() on columns of table "vault" */
export type Vaults_Var_Samp_Order_By = {
  /** Block number of the most recent vault state update. */
  block_number?: InputMaybe<Order_By>;
  /** Current price per share in wei. */
  current_share_price?: InputMaybe<Order_By>;
  /** Bonding curve configuration ID determining pricing curve. */
  curve_id?: InputMaybe<Order_By>;
  /** Log index of the most recent vault state update. */
  log_index?: InputMaybe<Order_By>;
  /** Market capitalization (total_shares * current_share_price) in wei. */
  market_cap?: InputMaybe<Order_By>;
  /** Number of active positions in this vault. */
  position_count?: InputMaybe<Order_By>;
  /** Total assets held in this vault in wei. */
  total_assets?: InputMaybe<Order_By>;
  /** Total shares issued by this vault. */
  total_shares?: InputMaybe<Order_By>;
};

/** aggregate variance on columns */
export type Vaults_Variance_Fields = {
  __typename?: 'vaults_variance_fields';
  /** Block number of the most recent vault state update. */
  block_number?: Maybe<Scalars['Float']['output']>;
  /** Current price per share in wei. */
  current_share_price?: Maybe<Scalars['Float']['output']>;
  /** Bonding curve configuration ID determining pricing curve. */
  curve_id?: Maybe<Scalars['Float']['output']>;
  /** Log index of the most recent vault state update. */
  log_index?: Maybe<Scalars['Float']['output']>;
  /** Market capitalization (total_shares * current_share_price) in wei. */
  market_cap?: Maybe<Scalars['Float']['output']>;
  /** Number of active positions in this vault. */
  position_count?: Maybe<Scalars['Float']['output']>;
  /** Total assets held in this vault in wei. */
  total_assets?: Maybe<Scalars['Float']['output']>;
  /** Total shares issued by this vault. */
  total_shares?: Maybe<Scalars['Float']['output']>;
};

/** order by variance() on columns of table "vault" */
export type Vaults_Variance_Order_By = {
  /** Block number of the most recent vault state update. */
  block_number?: InputMaybe<Order_By>;
  /** Current price per share in wei. */
  current_share_price?: InputMaybe<Order_By>;
  /** Bonding curve configuration ID determining pricing curve. */
  curve_id?: InputMaybe<Order_By>;
  /** Log index of the most recent vault state update. */
  log_index?: InputMaybe<Order_By>;
  /** Market capitalization (total_shares * current_share_price) in wei. */
  market_cap?: InputMaybe<Order_By>;
  /** Number of active positions in this vault. */
  position_count?: InputMaybe<Order_By>;
  /** Total assets held in this vault in wei. */
  total_assets?: InputMaybe<Order_By>;
  /** Total shares issued by this vault. */
  total_shares?: InputMaybe<Order_By>;
};

export type PositionFieldsFragment = { __typename?: 'positions', shares: any, account?: { __typename?: 'accounts', id: string, label: string } | null, vault?: { __typename?: 'vaults', term_id: string, total_shares: any, current_share_price: any } | null };

export type PositionWithVaultDetailsFragment = { __typename?: 'positions', shares: any, term_id: string, curve_id: any, vault?: { __typename?: 'vaults', term_id: string, total_shares: any, current_share_price: any, term?: { __typename?: 'terms', atom?: { __typename?: 'atoms', label?: string | null, term_id: string, type: any, value?: { __typename?: 'atom_values', thing?: { __typename?: 'things', url?: string | null, name?: string | null } | null, account?: { __typename?: 'accounts', id: string, label: string } | null } | null } | null, triple?: { __typename?: 'triples', term_id: string, subject?: { __typename?: 'atoms', label?: string | null, term_id: string } | null, predicate?: { __typename?: 'atoms', label?: string | null, term_id: string } | null, object?: { __typename?: 'atoms', label?: string | null, term_id: string, value?: { __typename?: 'atom_values', thing?: { __typename?: 'things', url?: string | null, name?: string | null } | null } | null } | null } | null } | null } | null };

export type GetAllActivityQueryVariables = Exact<{
  proxy: Scalars['String']['input'];
  limit: Scalars['Int']['input'];
  offset: Scalars['Int']['input'];
}>;


export type GetAllActivityQuery = { __typename?: 'query_root', events: Array<{ __typename?: 'events', id: string, created_at: any, deposit?: { __typename?: 'deposits', receiver?: { __typename?: 'accounts', id: string, label: string, image?: string | null } | null } | null, triple?: { __typename?: 'triples', term_id: string, counter_term_id: string, predicate?: { __typename?: 'atoms', label?: string | null, term_id: string } | null, object?: { __typename?: 'atoms', label?: string | null, value?: { __typename?: 'atom_values', thing?: { __typename?: 'things', url?: string | null, name?: string | null } | null } | null } | null } | null }> };

export type GetUserActivityQueryVariables = Exact<{
  proxy: Scalars['String']['input'];
  receiver: Scalars['String']['input'];
  limit: Scalars['Int']['input'];
  offset: Scalars['Int']['input'];
}>;


export type GetUserActivityQuery = { __typename?: 'query_root', events: Array<{ __typename?: 'events', id: string, created_at: any, deposit?: { __typename?: 'deposits', receiver?: { __typename?: 'accounts', id: string, label: string, image?: string | null } | null } | null, triple?: { __typename?: 'triples', term_id: string, counter_term_id: string, predicate?: { __typename?: 'atoms', label?: string | null, term_id: string } | null, object?: { __typename?: 'atoms', label?: string | null, value?: { __typename?: 'atom_values', thing?: { __typename?: 'things', url?: string | null, name?: string | null } | null } | null } | null } | null }> };

export type GetCircleFeedQueryVariables = Exact<{
  address: Scalars['String']['input'];
}>;


export type GetCircleFeedQuery = { __typename?: 'query_root', positions_from_following: Array<{ __typename?: 'positions', id: string, created_at: any, account?: { __typename?: 'accounts', id: string, label: string } | null, vault?: { __typename?: 'vaults', term?: { __typename?: 'terms', triple?: { __typename?: 'triples', term_id: string, object?: { __typename?: 'atoms', label?: string | null, value?: { __typename?: 'atom_values', thing?: { __typename?: 'things', url?: string | null, name?: string | null, image?: string | null } | null } | null } | null, predicate?: { __typename?: 'atoms', term_id: string, label?: string | null } | null, subject?: { __typename?: 'atoms', label?: string | null, term_id: string } | null } | null } | null } | null }> };

export type GetFollowingCountQueryVariables = Exact<{
  address: Scalars['String']['input'];
}>;


export type GetFollowingCountQuery = { __typename?: 'query_root', following_aggregate: { __typename?: 'accounts_aggregate', aggregate?: { __typename?: 'accounts_aggregate_fields', count: number } | null } };

export type GetTrustCircleAccountsQueryVariables = Exact<{
  subjectId: Scalars['String']['input'];
  predicateId: Scalars['String']['input'];
  walletAddress: Scalars['String']['input'];
}>;


export type GetTrustCircleAccountsQuery = { __typename?: 'query_root', triples: Array<{ __typename?: 'triples', object?: { __typename?: 'atoms', term_id: string, label?: string | null, type: any, accounts: Array<{ __typename?: 'accounts', id: string, label: string, image?: string | null }> } | null, term?: { __typename?: 'terms', vaults: Array<{ __typename?: 'vaults', positions: Array<{ __typename?: 'positions', account_id: string, shares: any }> }> } | null }> };

export type GetMyTrustCircleQueryVariables = Exact<{
  subjectId: Scalars['String']['input'];
  predicateId: Scalars['String']['input'];
  walletAddress: Scalars['String']['input'];
}>;


export type GetMyTrustCircleQuery = { __typename?: 'query_root', triples: Array<{ __typename?: 'triples', term_id: string, created_at: any, object?: { __typename?: 'atoms', term_id: string, data?: string | null, image?: string | null, label?: string | null, type: any, wallet_id: string, accounts: Array<{ __typename?: 'accounts', id: string }> } | null, term?: { __typename?: 'terms', vaults: Array<{ __typename?: 'vaults', curve_id: any, positions: Array<{ __typename?: 'positions', account_id: string, shares: any, created_at: any }> }> } | null }> };

export type GetSofiaTrustedActivityQueryVariables = Exact<{
  trustedWallets: Array<Scalars['String']['input']> | Scalars['String']['input'];
  proxy: Scalars['String']['input'];
  limit: Scalars['Int']['input'];
  offset: Scalars['Int']['input'];
}>;


export type GetSofiaTrustedActivityQuery = { __typename?: 'query_root', events: Array<{ __typename?: 'events', id: string, type: any, created_at: any, deposit?: { __typename?: 'deposits', sender_id: string, assets_after_fees: any, shares: any, sender?: { __typename?: 'accounts', id: string, label: string, image?: string | null } | null, receiver?: { __typename?: 'accounts', id: string, label: string, image?: string | null } | null } | null, redemption?: { __typename?: 'redemptions', sender_id: string, assets: any, shares: any, sender?: { __typename?: 'accounts', id: string, label: string, image?: string | null } | null } | null, triple?: { __typename?: 'triples', term_id: string, counter_term_id: string, subject?: { __typename?: 'atoms', label?: string | null, term_id: string } | null, predicate?: { __typename?: 'atoms', label?: string | null, term_id: string } | null, object?: { __typename?: 'atoms', label?: string | null, term_id: string, value?: { __typename?: 'atom_values', thing?: { __typename?: 'things', url?: string | null, name?: string | null } | null } | null } | null } | null }> };

export type GetClaimsByTermIdsQueryVariables = Exact<{
  termIds: Array<Scalars['String']['input']> | Scalars['String']['input'];
  address?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetClaimsByTermIdsQuery = { __typename?: 'query_root', triples: Array<{ __typename?: 'triples', term_id: string, counter_term_id: string, created_at: any, subject?: { __typename?: 'atoms', term_id: string, label?: string | null, image?: string | null, cached_image?: { __typename?: 'cached_images_cached_image', url: string } | null, value?: { __typename?: 'atom_values', thing?: { __typename?: 'things', image?: string | null, url?: string | null } | null, person?: { __typename?: 'persons', image?: string | null } | null, organization?: { __typename?: 'organizations', image?: string | null } | null } | null } | null, predicate?: { __typename?: 'atoms', term_id: string, label?: string | null } | null, object?: { __typename?: 'atoms', term_id: string, label?: string | null, image?: string | null, cached_image?: { __typename?: 'cached_images_cached_image', url: string } | null, value?: { __typename?: 'atom_values', thing?: { __typename?: 'things', image?: string | null, url?: string | null } | null, person?: { __typename?: 'persons', image?: string | null } | null, organization?: { __typename?: 'organizations', image?: string | null } | null } | null } | null, term?: { __typename?: 'terms', vaults: Array<{ __typename?: 'vaults', market_cap: any, total_shares: any, position_count: number, current_share_price: any, positions: Array<{ __typename?: 'positions', shares: any, total_deposit_assets_after_total_fees: any, account?: { __typename?: 'accounts', id: string } | null }> }> } | null, counter_term?: { __typename?: 'terms', vaults: Array<{ __typename?: 'vaults', market_cap: any, total_shares: any, position_count: number, current_share_price: any, positions: Array<{ __typename?: 'positions', shares: any, total_deposit_assets_after_total_fees: any, account?: { __typename?: 'accounts', id: string } | null }> }> } | null }> };

export type GetEthccPositionsQueryVariables = Exact<{
  address: Scalars['String']['input'];
  termIds: Array<Scalars['String']['input']> | Scalars['String']['input'];
}>;


export type GetEthccPositionsQuery = { __typename?: 'query_root', positions: Array<{ __typename?: 'positions', shares: any, vault?: { __typename?: 'vaults', term_id: string } | null }> };

export type GetSeasonPoolPositionsQueryVariables = Exact<{
  termId: Scalars['String']['input'];
  curveId: Scalars['numeric']['input'];
}>;


export type GetSeasonPoolPositionsQuery = { __typename?: 'query_root', vaults: Array<{ __typename?: 'vaults', current_share_price: any, total_shares: any, total_assets: any, position_count: number, positions: Array<{ __typename?: 'positions', account_id: string, shares: any, total_deposit_assets_after_total_fees: any, total_redeem_assets_for_receiver: any }> }> };

export type GetAccountLabelsQueryVariables = Exact<{
  ids: Array<Scalars['String']['input']> | Scalars['String']['input'];
}>;


export type GetAccountLabelsQuery = { __typename?: 'query_root', accounts: Array<{ __typename?: 'accounts', id: string, label: string, image?: string | null, atom?: { __typename?: 'atoms', label?: string | null, image?: string | null } | null }> };

export type GetUserPositionsQueryVariables = Exact<{
  accountId: Scalars['String']['input'];
}>;


export type GetUserPositionsQuery = { __typename?: 'query_root', total: { __typename?: 'positions_aggregate', aggregate?: { __typename?: 'positions_aggregate_fields', count: number } | null }, positions: Array<{ __typename?: 'positions', shares: any, term_id: string, curve_id: any, vault?: { __typename?: 'vaults', term_id: string, total_shares: any, current_share_price: any, term?: { __typename?: 'terms', atom?: { __typename?: 'atoms', label?: string | null, term_id: string, type: any, value?: { __typename?: 'atom_values', thing?: { __typename?: 'things', url?: string | null, name?: string | null } | null, account?: { __typename?: 'accounts', id: string, label: string } | null } | null } | null, triple?: { __typename?: 'triples', term_id: string, subject?: { __typename?: 'atoms', label?: string | null, term_id: string } | null, predicate?: { __typename?: 'atoms', label?: string | null, term_id: string } | null, object?: { __typename?: 'atoms', label?: string | null, term_id: string, value?: { __typename?: 'atom_values', thing?: { __typename?: 'things', url?: string | null, name?: string | null } | null } | null } | null } | null } | null } | null }> };

export type GetUserPositionsCountQueryVariables = Exact<{
  accountId: Scalars['String']['input'];
}>;


export type GetUserPositionsCountQuery = { __typename?: 'query_root', positions_aggregate: { __typename?: 'positions_aggregate', aggregate?: { __typename?: 'positions_aggregate_fields', count: number } | null } };

export type GetUserSignalsCountQueryVariables = Exact<{
  accountId: Scalars['String']['input'];
  subjectId: Scalars['String']['input'];
}>;


export type GetUserSignalsCountQuery = { __typename?: 'query_root', signalsCount: { __typename?: 'terms_aggregate', aggregate?: { __typename?: 'terms_aggregate_fields', count: number } | null } };

export type GetUserCertificationsQueryVariables = Exact<{
  accountId: Scalars['String']['input'];
  predicateIds: Array<Scalars['String']['input']> | Scalars['String']['input'];
}>;


export type GetUserCertificationsQuery = { __typename?: 'query_root', positions: Array<{ __typename?: 'positions', shares: any, term_id: string, curve_id: any, vault?: { __typename?: 'vaults', term_id: string, total_shares: any, current_share_price: any, term?: { __typename?: 'terms', atom?: { __typename?: 'atoms', label?: string | null, term_id: string, type: any, value?: { __typename?: 'atom_values', thing?: { __typename?: 'things', url?: string | null, name?: string | null } | null, account?: { __typename?: 'accounts', id: string, label: string } | null } | null } | null, triple?: { __typename?: 'triples', term_id: string, subject?: { __typename?: 'atoms', label?: string | null, term_id: string } | null, predicate?: { __typename?: 'atoms', label?: string | null, term_id: string } | null, object?: { __typename?: 'atoms', label?: string | null, term_id: string, value?: { __typename?: 'atom_values', thing?: { __typename?: 'things', url?: string | null, name?: string | null } | null } | null } | null } | null } | null } | null }> };

export type GetProxyDepositDaysQueryVariables = Exact<{
  senderId: Scalars['String']['input'];
  termId: Scalars['String']['input'];
}>;


export type GetProxyDepositDaysQuery = { __typename?: 'query_root', deposits: Array<{ __typename?: 'deposits', receiver_id: string, created_at: any }> };

export type GetStreakVaultPositionsQueryVariables = Exact<{
  termId: Scalars['String']['input'];
  curveId: Scalars['numeric']['input'];
  limit: Scalars['Int']['input'];
}>;


export type GetStreakVaultPositionsQuery = { __typename?: 'query_root', positions: Array<{ __typename?: 'positions', shares: any, account?: { __typename?: 'accounts', id: string, label: string } | null }> };

export type GetTrendingByPredicateQueryVariables = Exact<{
  predicateId: Scalars['String']['input'];
  limit: Scalars['Int']['input'];
}>;


export type GetTrendingByPredicateQuery = { __typename?: 'query_root', triples: Array<{ __typename?: 'triples', term_id: string, counter_term_id: string, object?: { __typename?: 'atoms', label?: string | null, value?: { __typename?: 'atom_values', thing?: { __typename?: 'things', url?: string | null } | null } | null } | null, all_positions: Array<{ __typename?: 'positions', account?: { __typename?: 'accounts', id: string } | null }> }> };

export type GetTrendingByPredicateLabelQueryVariables = Exact<{
  predicateLabel: Scalars['String']['input'];
  limit: Scalars['Int']['input'];
}>;


export type GetTrendingByPredicateLabelQuery = { __typename?: 'query_root', triples: Array<{ __typename?: 'triples', term_id: string, counter_term_id: string, object?: { __typename?: 'atoms', label?: string | null, value?: { __typename?: 'atom_values', thing?: { __typename?: 'things', url?: string | null } | null } | null } | null, all_positions: Array<{ __typename?: 'positions', account?: { __typename?: 'accounts', id: string } | null }> }> };

export type GetTripleVaultStatsQueryVariables = Exact<{
  termId: Scalars['String']['input'];
  address?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetTripleVaultStatsQuery = { __typename?: 'query_root', triples: Array<{ __typename?: 'triples', term_id: string, term?: { __typename?: 'terms', vaults: Array<{ __typename?: 'vaults', market_cap: any, total_shares: any, position_count: number, current_share_price: any, positions: Array<{ __typename?: 'positions', shares: any, total_deposit_assets_after_total_fees: any }> }> } | null, counter_term?: { __typename?: 'terms', vaults: Array<{ __typename?: 'vaults', market_cap: any, total_shares: any, position_count: number, current_share_price: any, positions: Array<{ __typename?: 'positions', shares: any, total_deposit_assets_after_total_fees: any }> }> } | null }> };

export type GetBatchTripleVaultStatsQueryVariables = Exact<{
  termIds: Array<Scalars['String']['input']> | Scalars['String']['input'];
  address?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetBatchTripleVaultStatsQuery = { __typename?: 'query_root', triples: Array<{ __typename?: 'triples', term_id: string, subject?: { __typename?: 'atoms', label?: string | null, term_id: string } | null, predicate?: { __typename?: 'atoms', label?: string | null, term_id: string } | null, object?: { __typename?: 'atoms', label?: string | null, term_id: string, value?: { __typename?: 'atom_values', thing?: { __typename?: 'things', url?: string | null, name?: string | null } | null } | null } | null, term?: { __typename?: 'terms', vaults: Array<{ __typename?: 'vaults', market_cap: any, total_shares: any, position_count: number, current_share_price: any, positions: Array<{ __typename?: 'positions', shares: any, total_deposit_assets_after_total_fees: any }> }> } | null, counter_term?: { __typename?: 'terms', vaults: Array<{ __typename?: 'vaults', market_cap: any, total_shares: any, position_count: number, current_share_price: any, positions: Array<{ __typename?: 'positions', shares: any, total_deposit_assets_after_total_fees: any }> }> } | null }> };

export type WatchUserPositionsSubscriptionVariables = Exact<{
  accountId: Scalars['String']['input'];
}>;


export type WatchUserPositionsSubscription = { __typename?: 'subscription_root', positions: Array<{ __typename?: 'positions', shares: any, term_id: string, curve_id: any, vault?: { __typename?: 'vaults', term_id: string, total_shares: any, current_share_price: any, term?: { __typename?: 'terms', atom?: { __typename?: 'atoms', label?: string | null, term_id: string, type: any, value?: { __typename?: 'atom_values', thing?: { __typename?: 'things', url?: string | null, name?: string | null } | null, account?: { __typename?: 'accounts', id: string, label: string } | null } | null } | null, triple?: { __typename?: 'triples', term_id: string, subject?: { __typename?: 'atoms', label?: string | null, term_id: string } | null, predicate?: { __typename?: 'atoms', label?: string | null, term_id: string } | null, object?: { __typename?: 'atoms', label?: string | null, term_id: string, value?: { __typename?: 'atom_values', thing?: { __typename?: 'things', url?: string | null, name?: string | null } | null } | null } | null } | null } | null } | null }> };

export type WatchUserTrackedPositionsSubscriptionVariables = Exact<{
  accountId: Scalars['String']['input'];
  termIds: Array<Scalars['String']['input']> | Scalars['String']['input'];
}>;


export type WatchUserTrackedPositionsSubscription = { __typename?: 'subscription_root', positions: Array<{ __typename?: 'positions', shares: any, term_id: string, curve_id: any, vault?: { __typename?: 'vaults', term_id: string, total_shares: any, current_share_price: any, term?: { __typename?: 'terms', atom?: { __typename?: 'atoms', label?: string | null, term_id: string, type: any, value?: { __typename?: 'atom_values', thing?: { __typename?: 'things', url?: string | null, name?: string | null } | null, account?: { __typename?: 'accounts', id: string, label: string } | null } | null } | null, triple?: { __typename?: 'triples', term_id: string, subject?: { __typename?: 'atoms', label?: string | null, term_id: string } | null, predicate?: { __typename?: 'atoms', label?: string | null, term_id: string } | null, object?: { __typename?: 'atoms', label?: string | null, term_id: string, value?: { __typename?: 'atom_values', thing?: { __typename?: 'things', url?: string | null, name?: string | null } | null } | null } | null } | null } | null } | null }> };


export const PositionFieldsFragmentDoc = `
    fragment PositionFields on positions {
  account {
    id
    label
  }
  shares
  vault {
    term_id
    total_shares
    current_share_price
  }
}
    `;
export const PositionWithVaultDetailsFragmentDoc = `
    fragment PositionWithVaultDetails on positions {
  shares
  term_id
  curve_id
  vault {
    term_id
    total_shares
    current_share_price
    term {
      atom {
        label
        term_id
        type
        value {
          thing {
            url
            name
          }
          account {
            id
            label
          }
        }
      }
      triple {
        term_id
        subject {
          label
          term_id
        }
        predicate {
          label
          term_id
        }
        object {
          label
          term_id
          value {
            thing {
              url
              name
            }
          }
        }
      }
    }
  }
}
    `;
export const GetAllActivityDocument = `
    query GetAllActivity($proxy: String!, $limit: Int!, $offset: Int!) {
  events(
    limit: $limit
    offset: $offset
    order_by: {created_at: desc}
    where: {type: {_eq: "Deposited"}, deposit: {sender_id: {_ilike: $proxy}, assets_after_fees: {_neq: "0"}}}
  ) {
    id
    created_at
    deposit {
      receiver {
        id
        label
        image
      }
    }
    triple {
      term_id
      counter_term_id
      predicate {
        label
        term_id
      }
      object {
        label
        value {
          thing {
            url
            name
          }
        }
      }
    }
  }
}
    `;

export const useGetAllActivityQuery = <
      TData = GetAllActivityQuery,
      TError = unknown
    >(
      variables: GetAllActivityQueryVariables,
      options?: Omit<UseQueryOptions<GetAllActivityQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<GetAllActivityQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useQuery<GetAllActivityQuery, TError, TData>(
      {
    queryKey: ['GetAllActivity', variables],
    queryFn: fetcher<GetAllActivityQuery, GetAllActivityQueryVariables>(GetAllActivityDocument, variables),
    ...options
  }
    )};

useGetAllActivityQuery.document = GetAllActivityDocument;

useGetAllActivityQuery.getKey = (variables: GetAllActivityQueryVariables) => ['GetAllActivity', variables];

export const useInfiniteGetAllActivityQuery = <
      TData = InfiniteData<GetAllActivityQuery>,
      TError = unknown
    >(
      variables: GetAllActivityQueryVariables,
      options: Omit<UseInfiniteQueryOptions<GetAllActivityQuery, TError, TData>, 'queryKey'> & { queryKey?: UseInfiniteQueryOptions<GetAllActivityQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useInfiniteQuery<GetAllActivityQuery, TError, TData>(
      (() => {
    const { queryKey: optionsQueryKey, ...restOptions } = options;
    return {
      queryKey: optionsQueryKey ?? ['GetAllActivity.infinite', variables],
      queryFn: (metaData) => fetcher<GetAllActivityQuery, GetAllActivityQueryVariables>(GetAllActivityDocument, {...variables, ...(metaData.pageParam ?? {})})(),
      ...restOptions
    }
  })()
    )};

useInfiniteGetAllActivityQuery.getKey = (variables: GetAllActivityQueryVariables) => ['GetAllActivity.infinite', variables];


useGetAllActivityQuery.fetcher = (variables: GetAllActivityQueryVariables, options?: RequestInit['headers']) => fetcher<GetAllActivityQuery, GetAllActivityQueryVariables>(GetAllActivityDocument, variables, options);

export const GetUserActivityDocument = `
    query GetUserActivity($proxy: String!, $receiver: String!, $limit: Int!, $offset: Int!) {
  events(
    limit: $limit
    offset: $offset
    order_by: {created_at: desc}
    where: {type: {_eq: "Deposited"}, deposit: {sender_id: {_ilike: $proxy}, receiver_id: {_ilike: $receiver}, assets_after_fees: {_neq: "0"}}}
  ) {
    id
    created_at
    deposit {
      receiver {
        id
        label
        image
      }
    }
    triple {
      term_id
      counter_term_id
      predicate {
        label
        term_id
      }
      object {
        label
        value {
          thing {
            url
            name
          }
        }
      }
    }
  }
}
    `;

export const useGetUserActivityQuery = <
      TData = GetUserActivityQuery,
      TError = unknown
    >(
      variables: GetUserActivityQueryVariables,
      options?: Omit<UseQueryOptions<GetUserActivityQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<GetUserActivityQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useQuery<GetUserActivityQuery, TError, TData>(
      {
    queryKey: ['GetUserActivity', variables],
    queryFn: fetcher<GetUserActivityQuery, GetUserActivityQueryVariables>(GetUserActivityDocument, variables),
    ...options
  }
    )};

useGetUserActivityQuery.document = GetUserActivityDocument;

useGetUserActivityQuery.getKey = (variables: GetUserActivityQueryVariables) => ['GetUserActivity', variables];

export const useInfiniteGetUserActivityQuery = <
      TData = InfiniteData<GetUserActivityQuery>,
      TError = unknown
    >(
      variables: GetUserActivityQueryVariables,
      options: Omit<UseInfiniteQueryOptions<GetUserActivityQuery, TError, TData>, 'queryKey'> & { queryKey?: UseInfiniteQueryOptions<GetUserActivityQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useInfiniteQuery<GetUserActivityQuery, TError, TData>(
      (() => {
    const { queryKey: optionsQueryKey, ...restOptions } = options;
    return {
      queryKey: optionsQueryKey ?? ['GetUserActivity.infinite', variables],
      queryFn: (metaData) => fetcher<GetUserActivityQuery, GetUserActivityQueryVariables>(GetUserActivityDocument, {...variables, ...(metaData.pageParam ?? {})})(),
      ...restOptions
    }
  })()
    )};

useInfiniteGetUserActivityQuery.getKey = (variables: GetUserActivityQueryVariables) => ['GetUserActivity.infinite', variables];


useGetUserActivityQuery.fetcher = (variables: GetUserActivityQueryVariables, options?: RequestInit['headers']) => fetcher<GetUserActivityQuery, GetUserActivityQueryVariables>(GetUserActivityDocument, variables, options);

export const GetCircleFeedDocument = `
    query GetCircleFeed($address: String!) {
  positions_from_following(
    args: {address: $address}
    order_by: {created_at: desc}
    limit: 50
    where: {vault: {term: {triple: {predicate_id: {_is_null: false}}}}}
  ) {
    id
    created_at
    account {
      id
      label
    }
    vault {
      term {
        triple {
          term_id
          object {
            label
            value {
              thing {
                url
                name
                image
              }
            }
          }
          predicate {
            term_id
            label
          }
          subject {
            label
            term_id
          }
        }
      }
    }
  }
}
    `;

export const useGetCircleFeedQuery = <
      TData = GetCircleFeedQuery,
      TError = unknown
    >(
      variables: GetCircleFeedQueryVariables,
      options?: Omit<UseQueryOptions<GetCircleFeedQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<GetCircleFeedQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useQuery<GetCircleFeedQuery, TError, TData>(
      {
    queryKey: ['GetCircleFeed', variables],
    queryFn: fetcher<GetCircleFeedQuery, GetCircleFeedQueryVariables>(GetCircleFeedDocument, variables),
    ...options
  }
    )};

useGetCircleFeedQuery.document = GetCircleFeedDocument;

useGetCircleFeedQuery.getKey = (variables: GetCircleFeedQueryVariables) => ['GetCircleFeed', variables];

export const useInfiniteGetCircleFeedQuery = <
      TData = InfiniteData<GetCircleFeedQuery>,
      TError = unknown
    >(
      variables: GetCircleFeedQueryVariables,
      options: Omit<UseInfiniteQueryOptions<GetCircleFeedQuery, TError, TData>, 'queryKey'> & { queryKey?: UseInfiniteQueryOptions<GetCircleFeedQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useInfiniteQuery<GetCircleFeedQuery, TError, TData>(
      (() => {
    const { queryKey: optionsQueryKey, ...restOptions } = options;
    return {
      queryKey: optionsQueryKey ?? ['GetCircleFeed.infinite', variables],
      queryFn: (metaData) => fetcher<GetCircleFeedQuery, GetCircleFeedQueryVariables>(GetCircleFeedDocument, {...variables, ...(metaData.pageParam ?? {})})(),
      ...restOptions
    }
  })()
    )};

useInfiniteGetCircleFeedQuery.getKey = (variables: GetCircleFeedQueryVariables) => ['GetCircleFeed.infinite', variables];


useGetCircleFeedQuery.fetcher = (variables: GetCircleFeedQueryVariables, options?: RequestInit['headers']) => fetcher<GetCircleFeedQuery, GetCircleFeedQueryVariables>(GetCircleFeedDocument, variables, options);

export const GetFollowingCountDocument = `
    query GetFollowingCount($address: String!) {
  following_aggregate(args: {address: $address}) {
    aggregate {
      count
    }
  }
}
    `;

export const useGetFollowingCountQuery = <
      TData = GetFollowingCountQuery,
      TError = unknown
    >(
      variables: GetFollowingCountQueryVariables,
      options?: Omit<UseQueryOptions<GetFollowingCountQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<GetFollowingCountQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useQuery<GetFollowingCountQuery, TError, TData>(
      {
    queryKey: ['GetFollowingCount', variables],
    queryFn: fetcher<GetFollowingCountQuery, GetFollowingCountQueryVariables>(GetFollowingCountDocument, variables),
    ...options
  }
    )};

useGetFollowingCountQuery.document = GetFollowingCountDocument;

useGetFollowingCountQuery.getKey = (variables: GetFollowingCountQueryVariables) => ['GetFollowingCount', variables];

export const useInfiniteGetFollowingCountQuery = <
      TData = InfiniteData<GetFollowingCountQuery>,
      TError = unknown
    >(
      variables: GetFollowingCountQueryVariables,
      options: Omit<UseInfiniteQueryOptions<GetFollowingCountQuery, TError, TData>, 'queryKey'> & { queryKey?: UseInfiniteQueryOptions<GetFollowingCountQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useInfiniteQuery<GetFollowingCountQuery, TError, TData>(
      (() => {
    const { queryKey: optionsQueryKey, ...restOptions } = options;
    return {
      queryKey: optionsQueryKey ?? ['GetFollowingCount.infinite', variables],
      queryFn: (metaData) => fetcher<GetFollowingCountQuery, GetFollowingCountQueryVariables>(GetFollowingCountDocument, {...variables, ...(metaData.pageParam ?? {})})(),
      ...restOptions
    }
  })()
    )};

useInfiniteGetFollowingCountQuery.getKey = (variables: GetFollowingCountQueryVariables) => ['GetFollowingCount.infinite', variables];


useGetFollowingCountQuery.fetcher = (variables: GetFollowingCountQueryVariables, options?: RequestInit['headers']) => fetcher<GetFollowingCountQuery, GetFollowingCountQueryVariables>(GetFollowingCountDocument, variables, options);

export const GetTrustCircleAccountsDocument = `
    query GetTrustCircleAccounts($subjectId: String!, $predicateId: String!, $walletAddress: String!) {
  triples(
    where: {_and: [{subject_id: {_eq: $subjectId}}, {predicate_id: {_eq: $predicateId}}, {object: {type: {_eq: "Account"}}}]}
  ) {
    object {
      term_id
      label
      type
      accounts {
        id
        label
        image
      }
    }
    term {
      vaults(where: {curve_id: {_eq: "2"}}, order_by: {curve_id: asc}) {
        positions(where: {account_id: {_ilike: $walletAddress}}) {
          account_id
          shares
        }
      }
    }
  }
}
    `;

export const useGetTrustCircleAccountsQuery = <
      TData = GetTrustCircleAccountsQuery,
      TError = unknown
    >(
      variables: GetTrustCircleAccountsQueryVariables,
      options?: Omit<UseQueryOptions<GetTrustCircleAccountsQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<GetTrustCircleAccountsQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useQuery<GetTrustCircleAccountsQuery, TError, TData>(
      {
    queryKey: ['GetTrustCircleAccounts', variables],
    queryFn: fetcher<GetTrustCircleAccountsQuery, GetTrustCircleAccountsQueryVariables>(GetTrustCircleAccountsDocument, variables),
    ...options
  }
    )};

useGetTrustCircleAccountsQuery.document = GetTrustCircleAccountsDocument;

useGetTrustCircleAccountsQuery.getKey = (variables: GetTrustCircleAccountsQueryVariables) => ['GetTrustCircleAccounts', variables];

export const useInfiniteGetTrustCircleAccountsQuery = <
      TData = InfiniteData<GetTrustCircleAccountsQuery>,
      TError = unknown
    >(
      variables: GetTrustCircleAccountsQueryVariables,
      options: Omit<UseInfiniteQueryOptions<GetTrustCircleAccountsQuery, TError, TData>, 'queryKey'> & { queryKey?: UseInfiniteQueryOptions<GetTrustCircleAccountsQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useInfiniteQuery<GetTrustCircleAccountsQuery, TError, TData>(
      (() => {
    const { queryKey: optionsQueryKey, ...restOptions } = options;
    return {
      queryKey: optionsQueryKey ?? ['GetTrustCircleAccounts.infinite', variables],
      queryFn: (metaData) => fetcher<GetTrustCircleAccountsQuery, GetTrustCircleAccountsQueryVariables>(GetTrustCircleAccountsDocument, {...variables, ...(metaData.pageParam ?? {})})(),
      ...restOptions
    }
  })()
    )};

useInfiniteGetTrustCircleAccountsQuery.getKey = (variables: GetTrustCircleAccountsQueryVariables) => ['GetTrustCircleAccounts.infinite', variables];


useGetTrustCircleAccountsQuery.fetcher = (variables: GetTrustCircleAccountsQueryVariables, options?: RequestInit['headers']) => fetcher<GetTrustCircleAccountsQuery, GetTrustCircleAccountsQueryVariables>(GetTrustCircleAccountsDocument, variables, options);

export const GetMyTrustCircleDocument = `
    query GetMyTrustCircle($subjectId: String!, $predicateId: String!, $walletAddress: String!) {
  triples(
    where: {_and: [{subject_id: {_eq: $subjectId}}, {predicate_id: {_eq: $predicateId}}, {object: {type: {_eq: "Account"}}}, {positions: {account_id: {_eq: $walletAddress}, shares: {_gt: "0"}}}]}
  ) {
    term_id
    created_at
    object {
      term_id
      data
      image
      label
      type
      wallet_id
      accounts {
        id
      }
    }
    term {
      vaults(order_by: {curve_id: asc}) {
        curve_id
        positions(where: {account_id: {_eq: $walletAddress}, shares: {_gt: "0"}}) {
          account_id
          shares
          created_at
        }
      }
    }
  }
}
    `;

export const useGetMyTrustCircleQuery = <
      TData = GetMyTrustCircleQuery,
      TError = unknown
    >(
      variables: GetMyTrustCircleQueryVariables,
      options?: Omit<UseQueryOptions<GetMyTrustCircleQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<GetMyTrustCircleQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useQuery<GetMyTrustCircleQuery, TError, TData>(
      {
    queryKey: ['GetMyTrustCircle', variables],
    queryFn: fetcher<GetMyTrustCircleQuery, GetMyTrustCircleQueryVariables>(GetMyTrustCircleDocument, variables),
    ...options
  }
    )};

useGetMyTrustCircleQuery.document = GetMyTrustCircleDocument;

useGetMyTrustCircleQuery.getKey = (variables: GetMyTrustCircleQueryVariables) => ['GetMyTrustCircle', variables];

export const useInfiniteGetMyTrustCircleQuery = <
      TData = InfiniteData<GetMyTrustCircleQuery>,
      TError = unknown
    >(
      variables: GetMyTrustCircleQueryVariables,
      options: Omit<UseInfiniteQueryOptions<GetMyTrustCircleQuery, TError, TData>, 'queryKey'> & { queryKey?: UseInfiniteQueryOptions<GetMyTrustCircleQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useInfiniteQuery<GetMyTrustCircleQuery, TError, TData>(
      (() => {
    const { queryKey: optionsQueryKey, ...restOptions } = options;
    return {
      queryKey: optionsQueryKey ?? ['GetMyTrustCircle.infinite', variables],
      queryFn: (metaData) => fetcher<GetMyTrustCircleQuery, GetMyTrustCircleQueryVariables>(GetMyTrustCircleDocument, {...variables, ...(metaData.pageParam ?? {})})(),
      ...restOptions
    }
  })()
    )};

useInfiniteGetMyTrustCircleQuery.getKey = (variables: GetMyTrustCircleQueryVariables) => ['GetMyTrustCircle.infinite', variables];


useGetMyTrustCircleQuery.fetcher = (variables: GetMyTrustCircleQueryVariables, options?: RequestInit['headers']) => fetcher<GetMyTrustCircleQuery, GetMyTrustCircleQueryVariables>(GetMyTrustCircleDocument, variables, options);

export const GetSofiaTrustedActivityDocument = `
    query GetSofiaTrustedActivity($trustedWallets: [String!]!, $proxy: String!, $limit: Int!, $offset: Int!) {
  events(
    limit: $limit
    offset: $offset
    order_by: {created_at: desc}
    where: {_and: [{type: {_neq: "FeesTransfered"}}, {_or: [{_and: [{type: {_eq: "Deposited"}}, {deposit: {sender_id: {_eq: $proxy}}}, {deposit: {receiver: {id: {_in: $trustedWallets}}}}, {deposit: {assets_after_fees: {_neq: "0"}}}]}, {_and: [{type: {_eq: "Redeemed"}}, {redemption: {sender_id: {_in: $trustedWallets}}}, {_or: [{_and: [{triple_id: {_is_null: false}}, {triple: {creator: {id: {_eq: $proxy}}}}]}, {_and: [{atom_id: {_is_null: false}}, {atom: {creator: {id: {_eq: $proxy}}}}]}]}]}]}]}
  ) {
    id
    type
    created_at
    deposit {
      sender_id
      assets_after_fees
      shares
      sender {
        id
        label
        image
      }
      receiver {
        id
        label
        image
      }
    }
    redemption {
      sender_id
      assets
      shares
      sender {
        id
        label
        image
      }
    }
    triple {
      term_id
      counter_term_id
      subject {
        label
        term_id
      }
      predicate {
        label
        term_id
      }
      object {
        label
        term_id
        value {
          thing {
            url
            name
          }
        }
      }
    }
  }
}
    `;

export const useGetSofiaTrustedActivityQuery = <
      TData = GetSofiaTrustedActivityQuery,
      TError = unknown
    >(
      variables: GetSofiaTrustedActivityQueryVariables,
      options?: Omit<UseQueryOptions<GetSofiaTrustedActivityQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<GetSofiaTrustedActivityQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useQuery<GetSofiaTrustedActivityQuery, TError, TData>(
      {
    queryKey: ['GetSofiaTrustedActivity', variables],
    queryFn: fetcher<GetSofiaTrustedActivityQuery, GetSofiaTrustedActivityQueryVariables>(GetSofiaTrustedActivityDocument, variables),
    ...options
  }
    )};

useGetSofiaTrustedActivityQuery.document = GetSofiaTrustedActivityDocument;

useGetSofiaTrustedActivityQuery.getKey = (variables: GetSofiaTrustedActivityQueryVariables) => ['GetSofiaTrustedActivity', variables];

export const useInfiniteGetSofiaTrustedActivityQuery = <
      TData = InfiniteData<GetSofiaTrustedActivityQuery>,
      TError = unknown
    >(
      variables: GetSofiaTrustedActivityQueryVariables,
      options: Omit<UseInfiniteQueryOptions<GetSofiaTrustedActivityQuery, TError, TData>, 'queryKey'> & { queryKey?: UseInfiniteQueryOptions<GetSofiaTrustedActivityQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useInfiniteQuery<GetSofiaTrustedActivityQuery, TError, TData>(
      (() => {
    const { queryKey: optionsQueryKey, ...restOptions } = options;
    return {
      queryKey: optionsQueryKey ?? ['GetSofiaTrustedActivity.infinite', variables],
      queryFn: (metaData) => fetcher<GetSofiaTrustedActivityQuery, GetSofiaTrustedActivityQueryVariables>(GetSofiaTrustedActivityDocument, {...variables, ...(metaData.pageParam ?? {})})(),
      ...restOptions
    }
  })()
    )};

useInfiniteGetSofiaTrustedActivityQuery.getKey = (variables: GetSofiaTrustedActivityQueryVariables) => ['GetSofiaTrustedActivity.infinite', variables];


useGetSofiaTrustedActivityQuery.fetcher = (variables: GetSofiaTrustedActivityQueryVariables, options?: RequestInit['headers']) => fetcher<GetSofiaTrustedActivityQuery, GetSofiaTrustedActivityQueryVariables>(GetSofiaTrustedActivityDocument, variables, options);

export const GetClaimsByTermIdsDocument = `
    query GetClaimsByTermIds($termIds: [String!]!, $address: String) {
  triples(where: {term_id: {_in: $termIds}}) {
    term_id
    counter_term_id
    created_at
    subject {
      term_id
      label
      image
      cached_image {
        url
      }
      value {
        thing {
          image
          url
        }
        person {
          image
        }
        organization {
          image
        }
      }
    }
    predicate {
      term_id
      label
    }
    object {
      term_id
      label
      image
      cached_image {
        url
      }
      value {
        thing {
          image
          url
        }
        person {
          image
        }
        organization {
          image
        }
      }
    }
    term {
      vaults {
        market_cap
        total_shares
        position_count
        current_share_price
        positions(where: {account_id: {_ilike: $address}}) {
          shares
          total_deposit_assets_after_total_fees
          account {
            id
          }
        }
      }
    }
    counter_term {
      vaults {
        market_cap
        total_shares
        position_count
        current_share_price
        positions(where: {account_id: {_ilike: $address}}) {
          shares
          total_deposit_assets_after_total_fees
          account {
            id
          }
        }
      }
    }
  }
}
    `;

export const useGetClaimsByTermIdsQuery = <
      TData = GetClaimsByTermIdsQuery,
      TError = unknown
    >(
      variables: GetClaimsByTermIdsQueryVariables,
      options?: Omit<UseQueryOptions<GetClaimsByTermIdsQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<GetClaimsByTermIdsQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useQuery<GetClaimsByTermIdsQuery, TError, TData>(
      {
    queryKey: ['GetClaimsByTermIds', variables],
    queryFn: fetcher<GetClaimsByTermIdsQuery, GetClaimsByTermIdsQueryVariables>(GetClaimsByTermIdsDocument, variables),
    ...options
  }
    )};

useGetClaimsByTermIdsQuery.document = GetClaimsByTermIdsDocument;

useGetClaimsByTermIdsQuery.getKey = (variables: GetClaimsByTermIdsQueryVariables) => ['GetClaimsByTermIds', variables];

export const useInfiniteGetClaimsByTermIdsQuery = <
      TData = InfiniteData<GetClaimsByTermIdsQuery>,
      TError = unknown
    >(
      variables: GetClaimsByTermIdsQueryVariables,
      options: Omit<UseInfiniteQueryOptions<GetClaimsByTermIdsQuery, TError, TData>, 'queryKey'> & { queryKey?: UseInfiniteQueryOptions<GetClaimsByTermIdsQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useInfiniteQuery<GetClaimsByTermIdsQuery, TError, TData>(
      (() => {
    const { queryKey: optionsQueryKey, ...restOptions } = options;
    return {
      queryKey: optionsQueryKey ?? ['GetClaimsByTermIds.infinite', variables],
      queryFn: (metaData) => fetcher<GetClaimsByTermIdsQuery, GetClaimsByTermIdsQueryVariables>(GetClaimsByTermIdsDocument, {...variables, ...(metaData.pageParam ?? {})})(),
      ...restOptions
    }
  })()
    )};

useInfiniteGetClaimsByTermIdsQuery.getKey = (variables: GetClaimsByTermIdsQueryVariables) => ['GetClaimsByTermIds.infinite', variables];


useGetClaimsByTermIdsQuery.fetcher = (variables: GetClaimsByTermIdsQueryVariables, options?: RequestInit['headers']) => fetcher<GetClaimsByTermIdsQuery, GetClaimsByTermIdsQueryVariables>(GetClaimsByTermIdsDocument, variables, options);

export const GetEthccPositionsDocument = `
    query GetEthccPositions($address: String!, $termIds: [String!]!) {
  positions(
    where: {account_id: {_ilike: $address}, vault: {term_id: {_in: $termIds}}, shares: {_gt: "0"}}
  ) {
    vault {
      term_id
    }
    shares
  }
}
    `;

export const useGetEthccPositionsQuery = <
      TData = GetEthccPositionsQuery,
      TError = unknown
    >(
      variables: GetEthccPositionsQueryVariables,
      options?: Omit<UseQueryOptions<GetEthccPositionsQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<GetEthccPositionsQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useQuery<GetEthccPositionsQuery, TError, TData>(
      {
    queryKey: ['GetEthccPositions', variables],
    queryFn: fetcher<GetEthccPositionsQuery, GetEthccPositionsQueryVariables>(GetEthccPositionsDocument, variables),
    ...options
  }
    )};

useGetEthccPositionsQuery.document = GetEthccPositionsDocument;

useGetEthccPositionsQuery.getKey = (variables: GetEthccPositionsQueryVariables) => ['GetEthccPositions', variables];

export const useInfiniteGetEthccPositionsQuery = <
      TData = InfiniteData<GetEthccPositionsQuery>,
      TError = unknown
    >(
      variables: GetEthccPositionsQueryVariables,
      options: Omit<UseInfiniteQueryOptions<GetEthccPositionsQuery, TError, TData>, 'queryKey'> & { queryKey?: UseInfiniteQueryOptions<GetEthccPositionsQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useInfiniteQuery<GetEthccPositionsQuery, TError, TData>(
      (() => {
    const { queryKey: optionsQueryKey, ...restOptions } = options;
    return {
      queryKey: optionsQueryKey ?? ['GetEthccPositions.infinite', variables],
      queryFn: (metaData) => fetcher<GetEthccPositionsQuery, GetEthccPositionsQueryVariables>(GetEthccPositionsDocument, {...variables, ...(metaData.pageParam ?? {})})(),
      ...restOptions
    }
  })()
    )};

useInfiniteGetEthccPositionsQuery.getKey = (variables: GetEthccPositionsQueryVariables) => ['GetEthccPositions.infinite', variables];


useGetEthccPositionsQuery.fetcher = (variables: GetEthccPositionsQueryVariables, options?: RequestInit['headers']) => fetcher<GetEthccPositionsQuery, GetEthccPositionsQueryVariables>(GetEthccPositionsDocument, variables, options);

export const GetSeasonPoolPositionsDocument = `
    query GetSeasonPoolPositions($termId: String!, $curveId: numeric!) {
  vaults(where: {term_id: {_eq: $termId}, curve_id: {_eq: $curveId}}) {
    current_share_price
    total_shares
    total_assets
    position_count
    positions(order_by: {shares: desc}) {
      account_id
      shares
      total_deposit_assets_after_total_fees
      total_redeem_assets_for_receiver
    }
  }
}
    `;

export const useGetSeasonPoolPositionsQuery = <
      TData = GetSeasonPoolPositionsQuery,
      TError = unknown
    >(
      variables: GetSeasonPoolPositionsQueryVariables,
      options?: Omit<UseQueryOptions<GetSeasonPoolPositionsQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<GetSeasonPoolPositionsQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useQuery<GetSeasonPoolPositionsQuery, TError, TData>(
      {
    queryKey: ['GetSeasonPoolPositions', variables],
    queryFn: fetcher<GetSeasonPoolPositionsQuery, GetSeasonPoolPositionsQueryVariables>(GetSeasonPoolPositionsDocument, variables),
    ...options
  }
    )};

useGetSeasonPoolPositionsQuery.document = GetSeasonPoolPositionsDocument;

useGetSeasonPoolPositionsQuery.getKey = (variables: GetSeasonPoolPositionsQueryVariables) => ['GetSeasonPoolPositions', variables];

export const useInfiniteGetSeasonPoolPositionsQuery = <
      TData = InfiniteData<GetSeasonPoolPositionsQuery>,
      TError = unknown
    >(
      variables: GetSeasonPoolPositionsQueryVariables,
      options: Omit<UseInfiniteQueryOptions<GetSeasonPoolPositionsQuery, TError, TData>, 'queryKey'> & { queryKey?: UseInfiniteQueryOptions<GetSeasonPoolPositionsQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useInfiniteQuery<GetSeasonPoolPositionsQuery, TError, TData>(
      (() => {
    const { queryKey: optionsQueryKey, ...restOptions } = options;
    return {
      queryKey: optionsQueryKey ?? ['GetSeasonPoolPositions.infinite', variables],
      queryFn: (metaData) => fetcher<GetSeasonPoolPositionsQuery, GetSeasonPoolPositionsQueryVariables>(GetSeasonPoolPositionsDocument, {...variables, ...(metaData.pageParam ?? {})})(),
      ...restOptions
    }
  })()
    )};

useInfiniteGetSeasonPoolPositionsQuery.getKey = (variables: GetSeasonPoolPositionsQueryVariables) => ['GetSeasonPoolPositions.infinite', variables];


useGetSeasonPoolPositionsQuery.fetcher = (variables: GetSeasonPoolPositionsQueryVariables, options?: RequestInit['headers']) => fetcher<GetSeasonPoolPositionsQuery, GetSeasonPoolPositionsQueryVariables>(GetSeasonPoolPositionsDocument, variables, options);

export const GetAccountLabelsDocument = `
    query GetAccountLabels($ids: [String!]!) {
  accounts(where: {id: {_in: $ids}}) {
    id
    label
    image
    atom {
      label
      image
    }
  }
}
    `;

export const useGetAccountLabelsQuery = <
      TData = GetAccountLabelsQuery,
      TError = unknown
    >(
      variables: GetAccountLabelsQueryVariables,
      options?: Omit<UseQueryOptions<GetAccountLabelsQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<GetAccountLabelsQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useQuery<GetAccountLabelsQuery, TError, TData>(
      {
    queryKey: ['GetAccountLabels', variables],
    queryFn: fetcher<GetAccountLabelsQuery, GetAccountLabelsQueryVariables>(GetAccountLabelsDocument, variables),
    ...options
  }
    )};

useGetAccountLabelsQuery.document = GetAccountLabelsDocument;

useGetAccountLabelsQuery.getKey = (variables: GetAccountLabelsQueryVariables) => ['GetAccountLabels', variables];

export const useInfiniteGetAccountLabelsQuery = <
      TData = InfiniteData<GetAccountLabelsQuery>,
      TError = unknown
    >(
      variables: GetAccountLabelsQueryVariables,
      options: Omit<UseInfiniteQueryOptions<GetAccountLabelsQuery, TError, TData>, 'queryKey'> & { queryKey?: UseInfiniteQueryOptions<GetAccountLabelsQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useInfiniteQuery<GetAccountLabelsQuery, TError, TData>(
      (() => {
    const { queryKey: optionsQueryKey, ...restOptions } = options;
    return {
      queryKey: optionsQueryKey ?? ['GetAccountLabels.infinite', variables],
      queryFn: (metaData) => fetcher<GetAccountLabelsQuery, GetAccountLabelsQueryVariables>(GetAccountLabelsDocument, {...variables, ...(metaData.pageParam ?? {})})(),
      ...restOptions
    }
  })()
    )};

useInfiniteGetAccountLabelsQuery.getKey = (variables: GetAccountLabelsQueryVariables) => ['GetAccountLabels.infinite', variables];


useGetAccountLabelsQuery.fetcher = (variables: GetAccountLabelsQueryVariables, options?: RequestInit['headers']) => fetcher<GetAccountLabelsQuery, GetAccountLabelsQueryVariables>(GetAccountLabelsDocument, variables, options);

export const GetUserPositionsDocument = `
    query GetUserPositions($accountId: String!) {
  total: positions_aggregate(where: {account_id: {_ilike: $accountId}}) {
    aggregate {
      count
    }
  }
  positions(
    where: {account_id: {_ilike: $accountId}}
    order_by: {shares: desc}
    limit: 200
  ) {
    ...PositionWithVaultDetails
  }
}
    ${PositionWithVaultDetailsFragmentDoc}`;

export const useGetUserPositionsQuery = <
      TData = GetUserPositionsQuery,
      TError = unknown
    >(
      variables: GetUserPositionsQueryVariables,
      options?: Omit<UseQueryOptions<GetUserPositionsQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<GetUserPositionsQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useQuery<GetUserPositionsQuery, TError, TData>(
      {
    queryKey: ['GetUserPositions', variables],
    queryFn: fetcher<GetUserPositionsQuery, GetUserPositionsQueryVariables>(GetUserPositionsDocument, variables),
    ...options
  }
    )};

useGetUserPositionsQuery.document = GetUserPositionsDocument;

useGetUserPositionsQuery.getKey = (variables: GetUserPositionsQueryVariables) => ['GetUserPositions', variables];

export const useInfiniteGetUserPositionsQuery = <
      TData = InfiniteData<GetUserPositionsQuery>,
      TError = unknown
    >(
      variables: GetUserPositionsQueryVariables,
      options: Omit<UseInfiniteQueryOptions<GetUserPositionsQuery, TError, TData>, 'queryKey'> & { queryKey?: UseInfiniteQueryOptions<GetUserPositionsQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useInfiniteQuery<GetUserPositionsQuery, TError, TData>(
      (() => {
    const { queryKey: optionsQueryKey, ...restOptions } = options;
    return {
      queryKey: optionsQueryKey ?? ['GetUserPositions.infinite', variables],
      queryFn: (metaData) => fetcher<GetUserPositionsQuery, GetUserPositionsQueryVariables>(GetUserPositionsDocument, {...variables, ...(metaData.pageParam ?? {})})(),
      ...restOptions
    }
  })()
    )};

useInfiniteGetUserPositionsQuery.getKey = (variables: GetUserPositionsQueryVariables) => ['GetUserPositions.infinite', variables];


useGetUserPositionsQuery.fetcher = (variables: GetUserPositionsQueryVariables, options?: RequestInit['headers']) => fetcher<GetUserPositionsQuery, GetUserPositionsQueryVariables>(GetUserPositionsDocument, variables, options);

export const GetUserPositionsCountDocument = `
    query GetUserPositionsCount($accountId: String!) {
  positions_aggregate(where: {account_id: {_ilike: $accountId}}) {
    aggregate {
      count
    }
  }
}
    `;

export const useGetUserPositionsCountQuery = <
      TData = GetUserPositionsCountQuery,
      TError = unknown
    >(
      variables: GetUserPositionsCountQueryVariables,
      options?: Omit<UseQueryOptions<GetUserPositionsCountQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<GetUserPositionsCountQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useQuery<GetUserPositionsCountQuery, TError, TData>(
      {
    queryKey: ['GetUserPositionsCount', variables],
    queryFn: fetcher<GetUserPositionsCountQuery, GetUserPositionsCountQueryVariables>(GetUserPositionsCountDocument, variables),
    ...options
  }
    )};

useGetUserPositionsCountQuery.document = GetUserPositionsCountDocument;

useGetUserPositionsCountQuery.getKey = (variables: GetUserPositionsCountQueryVariables) => ['GetUserPositionsCount', variables];

export const useInfiniteGetUserPositionsCountQuery = <
      TData = InfiniteData<GetUserPositionsCountQuery>,
      TError = unknown
    >(
      variables: GetUserPositionsCountQueryVariables,
      options: Omit<UseInfiniteQueryOptions<GetUserPositionsCountQuery, TError, TData>, 'queryKey'> & { queryKey?: UseInfiniteQueryOptions<GetUserPositionsCountQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useInfiniteQuery<GetUserPositionsCountQuery, TError, TData>(
      (() => {
    const { queryKey: optionsQueryKey, ...restOptions } = options;
    return {
      queryKey: optionsQueryKey ?? ['GetUserPositionsCount.infinite', variables],
      queryFn: (metaData) => fetcher<GetUserPositionsCountQuery, GetUserPositionsCountQueryVariables>(GetUserPositionsCountDocument, {...variables, ...(metaData.pageParam ?? {})})(),
      ...restOptions
    }
  })()
    )};

useInfiniteGetUserPositionsCountQuery.getKey = (variables: GetUserPositionsCountQueryVariables) => ['GetUserPositionsCount.infinite', variables];


useGetUserPositionsCountQuery.fetcher = (variables: GetUserPositionsCountQueryVariables, options?: RequestInit['headers']) => fetcher<GetUserPositionsCountQuery, GetUserPositionsCountQueryVariables>(GetUserPositionsCountDocument, variables, options);

export const GetUserSignalsCountDocument = `
    query GetUserSignalsCount($accountId: String!, $subjectId: String!) {
  signalsCount: terms_aggregate(
    where: {_and: [{type: {_eq: Triple}}, {triple: {subject: {term_id: {_eq: $subjectId}}}}, {positions: {account: {id: {_eq: $accountId}}}}]}
  ) {
    aggregate {
      count
    }
  }
}
    `;

export const useGetUserSignalsCountQuery = <
      TData = GetUserSignalsCountQuery,
      TError = unknown
    >(
      variables: GetUserSignalsCountQueryVariables,
      options?: Omit<UseQueryOptions<GetUserSignalsCountQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<GetUserSignalsCountQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useQuery<GetUserSignalsCountQuery, TError, TData>(
      {
    queryKey: ['GetUserSignalsCount', variables],
    queryFn: fetcher<GetUserSignalsCountQuery, GetUserSignalsCountQueryVariables>(GetUserSignalsCountDocument, variables),
    ...options
  }
    )};

useGetUserSignalsCountQuery.document = GetUserSignalsCountDocument;

useGetUserSignalsCountQuery.getKey = (variables: GetUserSignalsCountQueryVariables) => ['GetUserSignalsCount', variables];

export const useInfiniteGetUserSignalsCountQuery = <
      TData = InfiniteData<GetUserSignalsCountQuery>,
      TError = unknown
    >(
      variables: GetUserSignalsCountQueryVariables,
      options: Omit<UseInfiniteQueryOptions<GetUserSignalsCountQuery, TError, TData>, 'queryKey'> & { queryKey?: UseInfiniteQueryOptions<GetUserSignalsCountQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useInfiniteQuery<GetUserSignalsCountQuery, TError, TData>(
      (() => {
    const { queryKey: optionsQueryKey, ...restOptions } = options;
    return {
      queryKey: optionsQueryKey ?? ['GetUserSignalsCount.infinite', variables],
      queryFn: (metaData) => fetcher<GetUserSignalsCountQuery, GetUserSignalsCountQueryVariables>(GetUserSignalsCountDocument, {...variables, ...(metaData.pageParam ?? {})})(),
      ...restOptions
    }
  })()
    )};

useInfiniteGetUserSignalsCountQuery.getKey = (variables: GetUserSignalsCountQueryVariables) => ['GetUserSignalsCount.infinite', variables];


useGetUserSignalsCountQuery.fetcher = (variables: GetUserSignalsCountQueryVariables, options?: RequestInit['headers']) => fetcher<GetUserSignalsCountQuery, GetUserSignalsCountQueryVariables>(GetUserSignalsCountDocument, variables, options);

export const GetUserCertificationsDocument = `
    query GetUserCertifications($accountId: String!, $predicateIds: [String!]!) {
  positions(
    where: {account_id: {_ilike: $accountId}, vault: {term: {triple: {predicate: {term_id: {_in: $predicateIds}}}}}}
    order_by: {shares: desc}
    limit: 100
  ) {
    ...PositionWithVaultDetails
  }
}
    ${PositionWithVaultDetailsFragmentDoc}`;

export const useGetUserCertificationsQuery = <
      TData = GetUserCertificationsQuery,
      TError = unknown
    >(
      variables: GetUserCertificationsQueryVariables,
      options?: Omit<UseQueryOptions<GetUserCertificationsQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<GetUserCertificationsQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useQuery<GetUserCertificationsQuery, TError, TData>(
      {
    queryKey: ['GetUserCertifications', variables],
    queryFn: fetcher<GetUserCertificationsQuery, GetUserCertificationsQueryVariables>(GetUserCertificationsDocument, variables),
    ...options
  }
    )};

useGetUserCertificationsQuery.document = GetUserCertificationsDocument;

useGetUserCertificationsQuery.getKey = (variables: GetUserCertificationsQueryVariables) => ['GetUserCertifications', variables];

export const useInfiniteGetUserCertificationsQuery = <
      TData = InfiniteData<GetUserCertificationsQuery>,
      TError = unknown
    >(
      variables: GetUserCertificationsQueryVariables,
      options: Omit<UseInfiniteQueryOptions<GetUserCertificationsQuery, TError, TData>, 'queryKey'> & { queryKey?: UseInfiniteQueryOptions<GetUserCertificationsQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useInfiniteQuery<GetUserCertificationsQuery, TError, TData>(
      (() => {
    const { queryKey: optionsQueryKey, ...restOptions } = options;
    return {
      queryKey: optionsQueryKey ?? ['GetUserCertifications.infinite', variables],
      queryFn: (metaData) => fetcher<GetUserCertificationsQuery, GetUserCertificationsQueryVariables>(GetUserCertificationsDocument, {...variables, ...(metaData.pageParam ?? {})})(),
      ...restOptions
    }
  })()
    )};

useInfiniteGetUserCertificationsQuery.getKey = (variables: GetUserCertificationsQueryVariables) => ['GetUserCertifications.infinite', variables];


useGetUserCertificationsQuery.fetcher = (variables: GetUserCertificationsQueryVariables, options?: RequestInit['headers']) => fetcher<GetUserCertificationsQuery, GetUserCertificationsQueryVariables>(GetUserCertificationsDocument, variables, options);

export const GetProxyDepositDaysDocument = `
    query GetProxyDepositDays($senderId: String!, $termId: String!) {
  deposits(
    where: {sender_id: {_ilike: $senderId}, term_id: {_ilike: $termId}, assets_after_fees: {_neq: "0"}}
    order_by: {created_at: desc}
  ) {
    receiver_id
    created_at
  }
}
    `;

export const useGetProxyDepositDaysQuery = <
      TData = GetProxyDepositDaysQuery,
      TError = unknown
    >(
      variables: GetProxyDepositDaysQueryVariables,
      options?: Omit<UseQueryOptions<GetProxyDepositDaysQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<GetProxyDepositDaysQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useQuery<GetProxyDepositDaysQuery, TError, TData>(
      {
    queryKey: ['GetProxyDepositDays', variables],
    queryFn: fetcher<GetProxyDepositDaysQuery, GetProxyDepositDaysQueryVariables>(GetProxyDepositDaysDocument, variables),
    ...options
  }
    )};

useGetProxyDepositDaysQuery.document = GetProxyDepositDaysDocument;

useGetProxyDepositDaysQuery.getKey = (variables: GetProxyDepositDaysQueryVariables) => ['GetProxyDepositDays', variables];

export const useInfiniteGetProxyDepositDaysQuery = <
      TData = InfiniteData<GetProxyDepositDaysQuery>,
      TError = unknown
    >(
      variables: GetProxyDepositDaysQueryVariables,
      options: Omit<UseInfiniteQueryOptions<GetProxyDepositDaysQuery, TError, TData>, 'queryKey'> & { queryKey?: UseInfiniteQueryOptions<GetProxyDepositDaysQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useInfiniteQuery<GetProxyDepositDaysQuery, TError, TData>(
      (() => {
    const { queryKey: optionsQueryKey, ...restOptions } = options;
    return {
      queryKey: optionsQueryKey ?? ['GetProxyDepositDays.infinite', variables],
      queryFn: (metaData) => fetcher<GetProxyDepositDaysQuery, GetProxyDepositDaysQueryVariables>(GetProxyDepositDaysDocument, {...variables, ...(metaData.pageParam ?? {})})(),
      ...restOptions
    }
  })()
    )};

useInfiniteGetProxyDepositDaysQuery.getKey = (variables: GetProxyDepositDaysQueryVariables) => ['GetProxyDepositDays.infinite', variables];


useGetProxyDepositDaysQuery.fetcher = (variables: GetProxyDepositDaysQueryVariables, options?: RequestInit['headers']) => fetcher<GetProxyDepositDaysQuery, GetProxyDepositDaysQueryVariables>(GetProxyDepositDaysDocument, variables, options);

export const GetStreakVaultPositionsDocument = `
    query GetStreakVaultPositions($termId: String!, $curveId: numeric!, $limit: Int!) {
  positions(
    where: {vault: {term_id: {_ilike: $termId}, curve_id: {_eq: $curveId}}, shares: {_gt: "0"}}
    order_by: {shares: desc}
    limit: $limit
  ) {
    account {
      id
      label
    }
    shares
  }
}
    `;

export const useGetStreakVaultPositionsQuery = <
      TData = GetStreakVaultPositionsQuery,
      TError = unknown
    >(
      variables: GetStreakVaultPositionsQueryVariables,
      options?: Omit<UseQueryOptions<GetStreakVaultPositionsQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<GetStreakVaultPositionsQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useQuery<GetStreakVaultPositionsQuery, TError, TData>(
      {
    queryKey: ['GetStreakVaultPositions', variables],
    queryFn: fetcher<GetStreakVaultPositionsQuery, GetStreakVaultPositionsQueryVariables>(GetStreakVaultPositionsDocument, variables),
    ...options
  }
    )};

useGetStreakVaultPositionsQuery.document = GetStreakVaultPositionsDocument;

useGetStreakVaultPositionsQuery.getKey = (variables: GetStreakVaultPositionsQueryVariables) => ['GetStreakVaultPositions', variables];

export const useInfiniteGetStreakVaultPositionsQuery = <
      TData = InfiniteData<GetStreakVaultPositionsQuery>,
      TError = unknown
    >(
      variables: GetStreakVaultPositionsQueryVariables,
      options: Omit<UseInfiniteQueryOptions<GetStreakVaultPositionsQuery, TError, TData>, 'queryKey'> & { queryKey?: UseInfiniteQueryOptions<GetStreakVaultPositionsQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useInfiniteQuery<GetStreakVaultPositionsQuery, TError, TData>(
      (() => {
    const { queryKey: optionsQueryKey, ...restOptions } = options;
    return {
      queryKey: optionsQueryKey ?? ['GetStreakVaultPositions.infinite', variables],
      queryFn: (metaData) => fetcher<GetStreakVaultPositionsQuery, GetStreakVaultPositionsQueryVariables>(GetStreakVaultPositionsDocument, {...variables, ...(metaData.pageParam ?? {})})(),
      ...restOptions
    }
  })()
    )};

useInfiniteGetStreakVaultPositionsQuery.getKey = (variables: GetStreakVaultPositionsQueryVariables) => ['GetStreakVaultPositions.infinite', variables];


useGetStreakVaultPositionsQuery.fetcher = (variables: GetStreakVaultPositionsQueryVariables, options?: RequestInit['headers']) => fetcher<GetStreakVaultPositionsQuery, GetStreakVaultPositionsQueryVariables>(GetStreakVaultPositionsDocument, variables, options);

export const GetTrendingByPredicateDocument = `
    query GetTrendingByPredicate($predicateId: String!, $limit: Int!) {
  triples(
    where: {predicate_id: {_eq: $predicateId}}
    order_by: [{positions_aggregate: {count: desc}}, {created_at: desc}]
    limit: $limit
  ) {
    term_id
    counter_term_id
    object {
      label
      value {
        thing {
          url
        }
      }
    }
    all_positions: positions(where: {shares: {_gt: "0"}}) {
      account {
        id
      }
    }
  }
}
    `;

export const useGetTrendingByPredicateQuery = <
      TData = GetTrendingByPredicateQuery,
      TError = unknown
    >(
      variables: GetTrendingByPredicateQueryVariables,
      options?: Omit<UseQueryOptions<GetTrendingByPredicateQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<GetTrendingByPredicateQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useQuery<GetTrendingByPredicateQuery, TError, TData>(
      {
    queryKey: ['GetTrendingByPredicate', variables],
    queryFn: fetcher<GetTrendingByPredicateQuery, GetTrendingByPredicateQueryVariables>(GetTrendingByPredicateDocument, variables),
    ...options
  }
    )};

useGetTrendingByPredicateQuery.document = GetTrendingByPredicateDocument;

useGetTrendingByPredicateQuery.getKey = (variables: GetTrendingByPredicateQueryVariables) => ['GetTrendingByPredicate', variables];

export const useInfiniteGetTrendingByPredicateQuery = <
      TData = InfiniteData<GetTrendingByPredicateQuery>,
      TError = unknown
    >(
      variables: GetTrendingByPredicateQueryVariables,
      options: Omit<UseInfiniteQueryOptions<GetTrendingByPredicateQuery, TError, TData>, 'queryKey'> & { queryKey?: UseInfiniteQueryOptions<GetTrendingByPredicateQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useInfiniteQuery<GetTrendingByPredicateQuery, TError, TData>(
      (() => {
    const { queryKey: optionsQueryKey, ...restOptions } = options;
    return {
      queryKey: optionsQueryKey ?? ['GetTrendingByPredicate.infinite', variables],
      queryFn: (metaData) => fetcher<GetTrendingByPredicateQuery, GetTrendingByPredicateQueryVariables>(GetTrendingByPredicateDocument, {...variables, ...(metaData.pageParam ?? {})})(),
      ...restOptions
    }
  })()
    )};

useInfiniteGetTrendingByPredicateQuery.getKey = (variables: GetTrendingByPredicateQueryVariables) => ['GetTrendingByPredicate.infinite', variables];


useGetTrendingByPredicateQuery.fetcher = (variables: GetTrendingByPredicateQueryVariables, options?: RequestInit['headers']) => fetcher<GetTrendingByPredicateQuery, GetTrendingByPredicateQueryVariables>(GetTrendingByPredicateDocument, variables, options);

export const GetTrendingByPredicateLabelDocument = `
    query GetTrendingByPredicateLabel($predicateLabel: String!, $limit: Int!) {
  triples(
    where: {predicate: {label: {_eq: $predicateLabel}}}
    order_by: [{positions_aggregate: {count: desc}}, {created_at: desc}]
    limit: $limit
  ) {
    term_id
    counter_term_id
    object {
      label
      value {
        thing {
          url
        }
      }
    }
    all_positions: positions(where: {shares: {_gt: "0"}}) {
      account {
        id
      }
    }
  }
}
    `;

export const useGetTrendingByPredicateLabelQuery = <
      TData = GetTrendingByPredicateLabelQuery,
      TError = unknown
    >(
      variables: GetTrendingByPredicateLabelQueryVariables,
      options?: Omit<UseQueryOptions<GetTrendingByPredicateLabelQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<GetTrendingByPredicateLabelQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useQuery<GetTrendingByPredicateLabelQuery, TError, TData>(
      {
    queryKey: ['GetTrendingByPredicateLabel', variables],
    queryFn: fetcher<GetTrendingByPredicateLabelQuery, GetTrendingByPredicateLabelQueryVariables>(GetTrendingByPredicateLabelDocument, variables),
    ...options
  }
    )};

useGetTrendingByPredicateLabelQuery.document = GetTrendingByPredicateLabelDocument;

useGetTrendingByPredicateLabelQuery.getKey = (variables: GetTrendingByPredicateLabelQueryVariables) => ['GetTrendingByPredicateLabel', variables];

export const useInfiniteGetTrendingByPredicateLabelQuery = <
      TData = InfiniteData<GetTrendingByPredicateLabelQuery>,
      TError = unknown
    >(
      variables: GetTrendingByPredicateLabelQueryVariables,
      options: Omit<UseInfiniteQueryOptions<GetTrendingByPredicateLabelQuery, TError, TData>, 'queryKey'> & { queryKey?: UseInfiniteQueryOptions<GetTrendingByPredicateLabelQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useInfiniteQuery<GetTrendingByPredicateLabelQuery, TError, TData>(
      (() => {
    const { queryKey: optionsQueryKey, ...restOptions } = options;
    return {
      queryKey: optionsQueryKey ?? ['GetTrendingByPredicateLabel.infinite', variables],
      queryFn: (metaData) => fetcher<GetTrendingByPredicateLabelQuery, GetTrendingByPredicateLabelQueryVariables>(GetTrendingByPredicateLabelDocument, {...variables, ...(metaData.pageParam ?? {})})(),
      ...restOptions
    }
  })()
    )};

useInfiniteGetTrendingByPredicateLabelQuery.getKey = (variables: GetTrendingByPredicateLabelQueryVariables) => ['GetTrendingByPredicateLabel.infinite', variables];


useGetTrendingByPredicateLabelQuery.fetcher = (variables: GetTrendingByPredicateLabelQueryVariables, options?: RequestInit['headers']) => fetcher<GetTrendingByPredicateLabelQuery, GetTrendingByPredicateLabelQueryVariables>(GetTrendingByPredicateLabelDocument, variables, options);

export const GetTripleVaultStatsDocument = `
    query GetTripleVaultStats($termId: String!, $address: String) {
  triples(where: {term_id: {_eq: $termId}}) {
    term_id
    term {
      vaults {
        market_cap
        total_shares
        position_count
        current_share_price
        positions(where: {account_id: {_ilike: $address}}) {
          shares
          total_deposit_assets_after_total_fees
        }
      }
    }
    counter_term {
      vaults {
        market_cap
        total_shares
        position_count
        current_share_price
        positions(where: {account_id: {_ilike: $address}}) {
          shares
          total_deposit_assets_after_total_fees
        }
      }
    }
  }
}
    `;

export const useGetTripleVaultStatsQuery = <
      TData = GetTripleVaultStatsQuery,
      TError = unknown
    >(
      variables: GetTripleVaultStatsQueryVariables,
      options?: Omit<UseQueryOptions<GetTripleVaultStatsQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<GetTripleVaultStatsQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useQuery<GetTripleVaultStatsQuery, TError, TData>(
      {
    queryKey: ['GetTripleVaultStats', variables],
    queryFn: fetcher<GetTripleVaultStatsQuery, GetTripleVaultStatsQueryVariables>(GetTripleVaultStatsDocument, variables),
    ...options
  }
    )};

useGetTripleVaultStatsQuery.document = GetTripleVaultStatsDocument;

useGetTripleVaultStatsQuery.getKey = (variables: GetTripleVaultStatsQueryVariables) => ['GetTripleVaultStats', variables];

export const useInfiniteGetTripleVaultStatsQuery = <
      TData = InfiniteData<GetTripleVaultStatsQuery>,
      TError = unknown
    >(
      variables: GetTripleVaultStatsQueryVariables,
      options: Omit<UseInfiniteQueryOptions<GetTripleVaultStatsQuery, TError, TData>, 'queryKey'> & { queryKey?: UseInfiniteQueryOptions<GetTripleVaultStatsQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useInfiniteQuery<GetTripleVaultStatsQuery, TError, TData>(
      (() => {
    const { queryKey: optionsQueryKey, ...restOptions } = options;
    return {
      queryKey: optionsQueryKey ?? ['GetTripleVaultStats.infinite', variables],
      queryFn: (metaData) => fetcher<GetTripleVaultStatsQuery, GetTripleVaultStatsQueryVariables>(GetTripleVaultStatsDocument, {...variables, ...(metaData.pageParam ?? {})})(),
      ...restOptions
    }
  })()
    )};

useInfiniteGetTripleVaultStatsQuery.getKey = (variables: GetTripleVaultStatsQueryVariables) => ['GetTripleVaultStats.infinite', variables];


useGetTripleVaultStatsQuery.fetcher = (variables: GetTripleVaultStatsQueryVariables, options?: RequestInit['headers']) => fetcher<GetTripleVaultStatsQuery, GetTripleVaultStatsQueryVariables>(GetTripleVaultStatsDocument, variables, options);

export const GetBatchTripleVaultStatsDocument = `
    query GetBatchTripleVaultStats($termIds: [String!]!, $address: String) {
  triples(where: {term_id: {_in: $termIds}}) {
    term_id
    subject {
      label
      term_id
    }
    predicate {
      label
      term_id
    }
    object {
      label
      term_id
      value {
        thing {
          url
          name
        }
      }
    }
    term {
      vaults {
        market_cap
        total_shares
        position_count
        current_share_price
        positions(where: {account_id: {_ilike: $address}}) {
          shares
          total_deposit_assets_after_total_fees
        }
      }
    }
    counter_term {
      vaults {
        market_cap
        total_shares
        position_count
        current_share_price
        positions(where: {account_id: {_ilike: $address}}) {
          shares
          total_deposit_assets_after_total_fees
        }
      }
    }
  }
}
    `;

export const useGetBatchTripleVaultStatsQuery = <
      TData = GetBatchTripleVaultStatsQuery,
      TError = unknown
    >(
      variables: GetBatchTripleVaultStatsQueryVariables,
      options?: Omit<UseQueryOptions<GetBatchTripleVaultStatsQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<GetBatchTripleVaultStatsQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useQuery<GetBatchTripleVaultStatsQuery, TError, TData>(
      {
    queryKey: ['GetBatchTripleVaultStats', variables],
    queryFn: fetcher<GetBatchTripleVaultStatsQuery, GetBatchTripleVaultStatsQueryVariables>(GetBatchTripleVaultStatsDocument, variables),
    ...options
  }
    )};

useGetBatchTripleVaultStatsQuery.document = GetBatchTripleVaultStatsDocument;

useGetBatchTripleVaultStatsQuery.getKey = (variables: GetBatchTripleVaultStatsQueryVariables) => ['GetBatchTripleVaultStats', variables];

export const useInfiniteGetBatchTripleVaultStatsQuery = <
      TData = InfiniteData<GetBatchTripleVaultStatsQuery>,
      TError = unknown
    >(
      variables: GetBatchTripleVaultStatsQueryVariables,
      options: Omit<UseInfiniteQueryOptions<GetBatchTripleVaultStatsQuery, TError, TData>, 'queryKey'> & { queryKey?: UseInfiniteQueryOptions<GetBatchTripleVaultStatsQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useInfiniteQuery<GetBatchTripleVaultStatsQuery, TError, TData>(
      (() => {
    const { queryKey: optionsQueryKey, ...restOptions } = options;
    return {
      queryKey: optionsQueryKey ?? ['GetBatchTripleVaultStats.infinite', variables],
      queryFn: (metaData) => fetcher<GetBatchTripleVaultStatsQuery, GetBatchTripleVaultStatsQueryVariables>(GetBatchTripleVaultStatsDocument, {...variables, ...(metaData.pageParam ?? {})})(),
      ...restOptions
    }
  })()
    )};

useInfiniteGetBatchTripleVaultStatsQuery.getKey = (variables: GetBatchTripleVaultStatsQueryVariables) => ['GetBatchTripleVaultStats.infinite', variables];


useGetBatchTripleVaultStatsQuery.fetcher = (variables: GetBatchTripleVaultStatsQueryVariables, options?: RequestInit['headers']) => fetcher<GetBatchTripleVaultStatsQuery, GetBatchTripleVaultStatsQueryVariables>(GetBatchTripleVaultStatsDocument, variables, options);

export const WatchUserPositionsDocument = `
    subscription WatchUserPositions($accountId: String!) {
  positions(
    where: {account_id: {_ilike: $accountId}}
    order_by: {shares: desc}
    limit: 500
  ) {
    ...PositionWithVaultDetails
  }
}
    ${PositionWithVaultDetailsFragmentDoc}`;
export const WatchUserTrackedPositionsDocument = `
    subscription WatchUserTrackedPositions($accountId: String!, $termIds: [String!]!) {
  positions(
    where: {account_id: {_ilike: $accountId}, term_id: {_in: $termIds}}
    order_by: {shares: desc}
    limit: 500
  ) {
    ...PositionWithVaultDetails
  }
}
    ${PositionWithVaultDetailsFragmentDoc}`;
export const PositionFields = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PositionFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"positions"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"account"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}}]}},{"kind":"Field","name":{"kind":"Name","value":"shares"}},{"kind":"Field","name":{"kind":"Name","value":"vault"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"term_id"}},{"kind":"Field","name":{"kind":"Name","value":"total_shares"}},{"kind":"Field","name":{"kind":"Name","value":"current_share_price"}}]}}]}}]} as unknown as DocumentNode;
export const PositionWithVaultDetails = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PositionWithVaultDetails"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"positions"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"shares"}},{"kind":"Field","name":{"kind":"Name","value":"term_id"}},{"kind":"Field","name":{"kind":"Name","value":"curve_id"}},{"kind":"Field","name":{"kind":"Name","value":"vault"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"term_id"}},{"kind":"Field","name":{"kind":"Name","value":"total_shares"}},{"kind":"Field","name":{"kind":"Name","value":"current_share_price"}},{"kind":"Field","name":{"kind":"Name","value":"term"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"atom"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"term_id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"value"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"thing"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"account"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"triple"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"term_id"}},{"kind":"Field","name":{"kind":"Name","value":"subject"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"term_id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"predicate"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"term_id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"object"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"term_id"}},{"kind":"Field","name":{"kind":"Name","value":"value"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"thing"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode;
export const GetAllActivity = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetAllActivity"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"proxy"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"offset"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"events"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"offset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"offset"}}},{"kind":"Argument","name":{"kind":"Name","value":"order_by"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"created_at"},"value":{"kind":"EnumValue","value":"desc"}}]}},{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"type"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"_eq"},"value":{"kind":"StringValue","value":"Deposited","block":false}}]}},{"kind":"ObjectField","name":{"kind":"Name","value":"deposit"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"sender_id"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"_ilike"},"value":{"kind":"Variable","name":{"kind":"Name","value":"proxy"}}}]}},{"kind":"ObjectField","name":{"kind":"Name","value":"assets_after_fees"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"_neq"},"value":{"kind":"StringValue","value":"0","block":false}}]}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"deposit"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"receiver"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"image"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"triple"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"term_id"}},{"kind":"Field","name":{"kind":"Name","value":"counter_term_id"}},{"kind":"Field","name":{"kind":"Name","value":"predicate"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"term_id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"object"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"value"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"thing"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode;
export const GetUserActivity = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetUserActivity"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"proxy"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"receiver"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"offset"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"events"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"offset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"offset"}}},{"kind":"Argument","name":{"kind":"Name","value":"order_by"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"created_at"},"value":{"kind":"EnumValue","value":"desc"}}]}},{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"type"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"_eq"},"value":{"kind":"StringValue","value":"Deposited","block":false}}]}},{"kind":"ObjectField","name":{"kind":"Name","value":"deposit"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"sender_id"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"_ilike"},"value":{"kind":"Variable","name":{"kind":"Name","value":"proxy"}}}]}},{"kind":"ObjectField","name":{"kind":"Name","value":"receiver_id"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"_ilike"},"value":{"kind":"Variable","name":{"kind":"Name","value":"receiver"}}}]}},{"kind":"ObjectField","name":{"kind":"Name","value":"assets_after_fees"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"_neq"},"value":{"kind":"StringValue","value":"0","block":false}}]}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"deposit"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"receiver"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"image"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"triple"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"term_id"}},{"kind":"Field","name":{"kind":"Name","value":"counter_term_id"}},{"kind":"Field","name":{"kind":"Name","value":"predicate"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"term_id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"object"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"value"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"thing"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode;
export const GetCircleFeed = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetCircleFeed"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"address"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"positions_from_following"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"args"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"address"},"value":{"kind":"Variable","name":{"kind":"Name","value":"address"}}}]}},{"kind":"Argument","name":{"kind":"Name","value":"order_by"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"created_at"},"value":{"kind":"EnumValue","value":"desc"}}]}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"50"}},{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"vault"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"term"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"triple"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"predicate_id"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"_is_null"},"value":{"kind":"BooleanValue","value":false}}]}}]}}]}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"account"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}}]}},{"kind":"Field","name":{"kind":"Name","value":"vault"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"term"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"triple"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"term_id"}},{"kind":"Field","name":{"kind":"Name","value":"object"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"value"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"thing"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"image"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"predicate"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"term_id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}}]}},{"kind":"Field","name":{"kind":"Name","value":"subject"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"term_id"}}]}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode;
export const GetFollowingCount = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetFollowingCount"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"address"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"following_aggregate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"args"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"address"},"value":{"kind":"Variable","name":{"kind":"Name","value":"address"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"aggregate"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"count"}}]}}]}}]}}]} as unknown as DocumentNode;
export const GetTrustCircleAccounts = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetTrustCircleAccounts"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"subjectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"predicateId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"walletAddress"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"triples"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"_and"},"value":{"kind":"ListValue","values":[{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"subject_id"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"_eq"},"value":{"kind":"Variable","name":{"kind":"Name","value":"subjectId"}}}]}}]},{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"predicate_id"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"_eq"},"value":{"kind":"Variable","name":{"kind":"Name","value":"predicateId"}}}]}}]},{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"object"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"type"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"_eq"},"value":{"kind":"StringValue","value":"Account","block":false}}]}}]}}]}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"object"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"term_id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"accounts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"image"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"term"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"vaults"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"curve_id"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"_eq"},"value":{"kind":"StringValue","value":"2","block":false}}]}}]}},{"kind":"Argument","name":{"kind":"Name","value":"order_by"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"curve_id"},"value":{"kind":"EnumValue","value":"asc"}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"positions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"account_id"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"_ilike"},"value":{"kind":"Variable","name":{"kind":"Name","value":"walletAddress"}}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"account_id"}},{"kind":"Field","name":{"kind":"Name","value":"shares"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode;
export const GetMyTrustCircle = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetMyTrustCircle"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"subjectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"predicateId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"walletAddress"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"triples"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"_and"},"value":{"kind":"ListValue","values":[{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"subject_id"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"_eq"},"value":{"kind":"Variable","name":{"kind":"Name","value":"subjectId"}}}]}}]},{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"predicate_id"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"_eq"},"value":{"kind":"Variable","name":{"kind":"Name","value":"predicateId"}}}]}}]},{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"object"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"type"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"_eq"},"value":{"kind":"StringValue","value":"Account","block":false}}]}}]}}]},{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"positions"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"account_id"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"_eq"},"value":{"kind":"Variable","name":{"kind":"Name","value":"walletAddress"}}}]}},{"kind":"ObjectField","name":{"kind":"Name","value":"shares"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"_gt"},"value":{"kind":"StringValue","value":"0","block":false}}]}}]}}]}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"term_id"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"object"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"term_id"}},{"kind":"Field","name":{"kind":"Name","value":"data"}},{"kind":"Field","name":{"kind":"Name","value":"image"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"wallet_id"}},{"kind":"Field","name":{"kind":"Name","value":"accounts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"term"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"vaults"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"order_by"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"curve_id"},"value":{"kind":"EnumValue","value":"asc"}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"curve_id"}},{"kind":"Field","name":{"kind":"Name","value":"positions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"account_id"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"_eq"},"value":{"kind":"Variable","name":{"kind":"Name","value":"walletAddress"}}}]}},{"kind":"ObjectField","name":{"kind":"Name","value":"shares"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"_gt"},"value":{"kind":"StringValue","value":"0","block":false}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"account_id"}},{"kind":"Field","name":{"kind":"Name","value":"shares"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode;
export const GetSofiaTrustedActivity = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetSofiaTrustedActivity"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"trustedWallets"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"proxy"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"offset"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"events"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"offset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"offset"}}},{"kind":"Argument","name":{"kind":"Name","value":"order_by"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"created_at"},"value":{"kind":"EnumValue","value":"desc"}}]}},{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"_and"},"value":{"kind":"ListValue","values":[{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"type"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"_neq"},"value":{"kind":"StringValue","value":"FeesTransfered","block":false}}]}}]},{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"_or"},"value":{"kind":"ListValue","values":[{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"_and"},"value":{"kind":"ListValue","values":[{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"type"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"_eq"},"value":{"kind":"StringValue","value":"Deposited","block":false}}]}}]},{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"deposit"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"sender_id"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"_eq"},"value":{"kind":"Variable","name":{"kind":"Name","value":"proxy"}}}]}}]}}]},{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"deposit"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"receiver"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"_in"},"value":{"kind":"Variable","name":{"kind":"Name","value":"trustedWallets"}}}]}}]}}]}}]},{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"deposit"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"assets_after_fees"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"_neq"},"value":{"kind":"StringValue","value":"0","block":false}}]}}]}}]}]}}]},{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"_and"},"value":{"kind":"ListValue","values":[{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"type"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"_eq"},"value":{"kind":"StringValue","value":"Redeemed","block":false}}]}}]},{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"redemption"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"sender_id"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"_in"},"value":{"kind":"Variable","name":{"kind":"Name","value":"trustedWallets"}}}]}}]}}]},{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"_or"},"value":{"kind":"ListValue","values":[{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"_and"},"value":{"kind":"ListValue","values":[{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"triple_id"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"_is_null"},"value":{"kind":"BooleanValue","value":false}}]}}]},{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"triple"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"creator"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"_eq"},"value":{"kind":"Variable","name":{"kind":"Name","value":"proxy"}}}]}}]}}]}}]}]}}]},{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"_and"},"value":{"kind":"ListValue","values":[{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"atom_id"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"_is_null"},"value":{"kind":"BooleanValue","value":false}}]}}]},{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"atom"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"creator"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"_eq"},"value":{"kind":"Variable","name":{"kind":"Name","value":"proxy"}}}]}}]}}]}}]}]}}]}]}}]}]}}]}]}}]}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"deposit"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sender_id"}},{"kind":"Field","name":{"kind":"Name","value":"assets_after_fees"}},{"kind":"Field","name":{"kind":"Name","value":"shares"}},{"kind":"Field","name":{"kind":"Name","value":"sender"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"image"}}]}},{"kind":"Field","name":{"kind":"Name","value":"receiver"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"image"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"redemption"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sender_id"}},{"kind":"Field","name":{"kind":"Name","value":"assets"}},{"kind":"Field","name":{"kind":"Name","value":"shares"}},{"kind":"Field","name":{"kind":"Name","value":"sender"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"image"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"triple"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"term_id"}},{"kind":"Field","name":{"kind":"Name","value":"counter_term_id"}},{"kind":"Field","name":{"kind":"Name","value":"subject"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"term_id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"predicate"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"term_id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"object"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"term_id"}},{"kind":"Field","name":{"kind":"Name","value":"value"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"thing"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode;
export const GetClaimsByTermIds = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetClaimsByTermIds"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"termIds"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"address"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"triples"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"term_id"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"_in"},"value":{"kind":"Variable","name":{"kind":"Name","value":"termIds"}}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"term_id"}},{"kind":"Field","name":{"kind":"Name","value":"counter_term_id"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}},{"kind":"Field","name":{"kind":"Name","value":"subject"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"term_id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"image"}},{"kind":"Field","name":{"kind":"Name","value":"cached_image"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}}]}},{"kind":"Field","name":{"kind":"Name","value":"value"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"thing"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"image"}},{"kind":"Field","name":{"kind":"Name","value":"url"}}]}},{"kind":"Field","name":{"kind":"Name","value":"person"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"image"}}]}},{"kind":"Field","name":{"kind":"Name","value":"organization"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"image"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"predicate"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"term_id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}}]}},{"kind":"Field","name":{"kind":"Name","value":"object"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"term_id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"image"}},{"kind":"Field","name":{"kind":"Name","value":"cached_image"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}}]}},{"kind":"Field","name":{"kind":"Name","value":"value"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"thing"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"image"}},{"kind":"Field","name":{"kind":"Name","value":"url"}}]}},{"kind":"Field","name":{"kind":"Name","value":"person"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"image"}}]}},{"kind":"Field","name":{"kind":"Name","value":"organization"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"image"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"term"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"vaults"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"market_cap"}},{"kind":"Field","name":{"kind":"Name","value":"total_shares"}},{"kind":"Field","name":{"kind":"Name","value":"position_count"}},{"kind":"Field","name":{"kind":"Name","value":"current_share_price"}},{"kind":"Field","name":{"kind":"Name","value":"positions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"account_id"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"_ilike"},"value":{"kind":"Variable","name":{"kind":"Name","value":"address"}}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"shares"}},{"kind":"Field","name":{"kind":"Name","value":"total_deposit_assets_after_total_fees"}},{"kind":"Field","name":{"kind":"Name","value":"account"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"counter_term"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"vaults"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"market_cap"}},{"kind":"Field","name":{"kind":"Name","value":"total_shares"}},{"kind":"Field","name":{"kind":"Name","value":"position_count"}},{"kind":"Field","name":{"kind":"Name","value":"current_share_price"}},{"kind":"Field","name":{"kind":"Name","value":"positions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"account_id"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"_ilike"},"value":{"kind":"Variable","name":{"kind":"Name","value":"address"}}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"shares"}},{"kind":"Field","name":{"kind":"Name","value":"total_deposit_assets_after_total_fees"}},{"kind":"Field","name":{"kind":"Name","value":"account"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode;
export const GetEthccPositions = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetEthccPositions"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"address"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"termIds"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"positions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"account_id"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"_ilike"},"value":{"kind":"Variable","name":{"kind":"Name","value":"address"}}}]}},{"kind":"ObjectField","name":{"kind":"Name","value":"vault"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"term_id"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"_in"},"value":{"kind":"Variable","name":{"kind":"Name","value":"termIds"}}}]}}]}},{"kind":"ObjectField","name":{"kind":"Name","value":"shares"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"_gt"},"value":{"kind":"StringValue","value":"0","block":false}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"vault"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"term_id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"shares"}}]}}]}}]} as unknown as DocumentNode;
export const GetSeasonPoolPositions = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetSeasonPoolPositions"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"termId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"curveId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"numeric"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"vaults"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"term_id"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"_eq"},"value":{"kind":"Variable","name":{"kind":"Name","value":"termId"}}}]}},{"kind":"ObjectField","name":{"kind":"Name","value":"curve_id"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"_eq"},"value":{"kind":"Variable","name":{"kind":"Name","value":"curveId"}}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"current_share_price"}},{"kind":"Field","name":{"kind":"Name","value":"total_shares"}},{"kind":"Field","name":{"kind":"Name","value":"total_assets"}},{"kind":"Field","name":{"kind":"Name","value":"position_count"}},{"kind":"Field","name":{"kind":"Name","value":"positions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"order_by"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"shares"},"value":{"kind":"EnumValue","value":"desc"}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"account_id"}},{"kind":"Field","name":{"kind":"Name","value":"shares"}},{"kind":"Field","name":{"kind":"Name","value":"total_deposit_assets_after_total_fees"}},{"kind":"Field","name":{"kind":"Name","value":"total_redeem_assets_for_receiver"}}]}}]}}]}}]} as unknown as DocumentNode;
export const GetAccountLabels = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetAccountLabels"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"ids"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accounts"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"_in"},"value":{"kind":"Variable","name":{"kind":"Name","value":"ids"}}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"image"}},{"kind":"Field","name":{"kind":"Name","value":"atom"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"image"}}]}}]}}]}}]} as unknown as DocumentNode;
export const GetUserPositions = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetUserPositions"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"accountId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","alias":{"kind":"Name","value":"total"},"name":{"kind":"Name","value":"positions_aggregate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"account_id"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"_ilike"},"value":{"kind":"Variable","name":{"kind":"Name","value":"accountId"}}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"aggregate"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"count"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"positions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"account_id"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"_ilike"},"value":{"kind":"Variable","name":{"kind":"Name","value":"accountId"}}}]}}]}},{"kind":"Argument","name":{"kind":"Name","value":"order_by"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"shares"},"value":{"kind":"EnumValue","value":"desc"}}]}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"200"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PositionWithVaultDetails"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PositionWithVaultDetails"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"positions"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"shares"}},{"kind":"Field","name":{"kind":"Name","value":"term_id"}},{"kind":"Field","name":{"kind":"Name","value":"curve_id"}},{"kind":"Field","name":{"kind":"Name","value":"vault"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"term_id"}},{"kind":"Field","name":{"kind":"Name","value":"total_shares"}},{"kind":"Field","name":{"kind":"Name","value":"current_share_price"}},{"kind":"Field","name":{"kind":"Name","value":"term"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"atom"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"term_id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"value"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"thing"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"account"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"triple"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"term_id"}},{"kind":"Field","name":{"kind":"Name","value":"subject"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"term_id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"predicate"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"term_id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"object"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"term_id"}},{"kind":"Field","name":{"kind":"Name","value":"value"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"thing"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode;
export const GetUserPositionsCount = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetUserPositionsCount"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"accountId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"positions_aggregate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"account_id"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"_ilike"},"value":{"kind":"Variable","name":{"kind":"Name","value":"accountId"}}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"aggregate"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"count"}}]}}]}}]}}]} as unknown as DocumentNode;
export const GetUserSignalsCount = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetUserSignalsCount"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"accountId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"subjectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","alias":{"kind":"Name","value":"signalsCount"},"name":{"kind":"Name","value":"terms_aggregate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"_and"},"value":{"kind":"ListValue","values":[{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"type"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"_eq"},"value":{"kind":"EnumValue","value":"Triple"}}]}}]},{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"triple"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"subject"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"term_id"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"_eq"},"value":{"kind":"Variable","name":{"kind":"Name","value":"subjectId"}}}]}}]}}]}}]},{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"positions"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"account"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"_eq"},"value":{"kind":"Variable","name":{"kind":"Name","value":"accountId"}}}]}}]}}]}}]}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"aggregate"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"count"}}]}}]}}]}}]} as unknown as DocumentNode;
export const GetUserCertifications = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetUserCertifications"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"accountId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"predicateIds"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"positions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"account_id"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"_ilike"},"value":{"kind":"Variable","name":{"kind":"Name","value":"accountId"}}}]}},{"kind":"ObjectField","name":{"kind":"Name","value":"vault"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"term"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"triple"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"predicate"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"term_id"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"_in"},"value":{"kind":"Variable","name":{"kind":"Name","value":"predicateIds"}}}]}}]}}]}}]}}]}}]}},{"kind":"Argument","name":{"kind":"Name","value":"order_by"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"shares"},"value":{"kind":"EnumValue","value":"desc"}}]}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"100"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PositionWithVaultDetails"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PositionWithVaultDetails"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"positions"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"shares"}},{"kind":"Field","name":{"kind":"Name","value":"term_id"}},{"kind":"Field","name":{"kind":"Name","value":"curve_id"}},{"kind":"Field","name":{"kind":"Name","value":"vault"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"term_id"}},{"kind":"Field","name":{"kind":"Name","value":"total_shares"}},{"kind":"Field","name":{"kind":"Name","value":"current_share_price"}},{"kind":"Field","name":{"kind":"Name","value":"term"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"atom"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"term_id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"value"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"thing"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"account"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"triple"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"term_id"}},{"kind":"Field","name":{"kind":"Name","value":"subject"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"term_id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"predicate"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"term_id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"object"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"term_id"}},{"kind":"Field","name":{"kind":"Name","value":"value"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"thing"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode;
export const GetProxyDepositDays = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetProxyDepositDays"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"senderId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"termId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deposits"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"sender_id"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"_ilike"},"value":{"kind":"Variable","name":{"kind":"Name","value":"senderId"}}}]}},{"kind":"ObjectField","name":{"kind":"Name","value":"term_id"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"_ilike"},"value":{"kind":"Variable","name":{"kind":"Name","value":"termId"}}}]}},{"kind":"ObjectField","name":{"kind":"Name","value":"assets_after_fees"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"_neq"},"value":{"kind":"StringValue","value":"0","block":false}}]}}]}},{"kind":"Argument","name":{"kind":"Name","value":"order_by"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"created_at"},"value":{"kind":"EnumValue","value":"desc"}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"receiver_id"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}}]}}]}}]} as unknown as DocumentNode;
export const GetStreakVaultPositions = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetStreakVaultPositions"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"termId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"curveId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"numeric"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"positions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"vault"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"term_id"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"_ilike"},"value":{"kind":"Variable","name":{"kind":"Name","value":"termId"}}}]}},{"kind":"ObjectField","name":{"kind":"Name","value":"curve_id"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"_eq"},"value":{"kind":"Variable","name":{"kind":"Name","value":"curveId"}}}]}}]}},{"kind":"ObjectField","name":{"kind":"Name","value":"shares"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"_gt"},"value":{"kind":"StringValue","value":"0","block":false}}]}}]}},{"kind":"Argument","name":{"kind":"Name","value":"order_by"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"shares"},"value":{"kind":"EnumValue","value":"desc"}}]}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"account"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}}]}},{"kind":"Field","name":{"kind":"Name","value":"shares"}}]}}]}}]} as unknown as DocumentNode;
export const GetTrendingByPredicate = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetTrendingByPredicate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"predicateId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"triples"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"predicate_id"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"_eq"},"value":{"kind":"Variable","name":{"kind":"Name","value":"predicateId"}}}]}}]}},{"kind":"Argument","name":{"kind":"Name","value":"order_by"},"value":{"kind":"ListValue","values":[{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"positions_aggregate"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"count"},"value":{"kind":"EnumValue","value":"desc"}}]}}]},{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"created_at"},"value":{"kind":"EnumValue","value":"desc"}}]}]}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"term_id"}},{"kind":"Field","name":{"kind":"Name","value":"counter_term_id"}},{"kind":"Field","name":{"kind":"Name","value":"object"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"value"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"thing"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}}]}}]}}]}},{"kind":"Field","alias":{"kind":"Name","value":"all_positions"},"name":{"kind":"Name","value":"positions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"shares"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"_gt"},"value":{"kind":"StringValue","value":"0","block":false}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"account"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]}}]} as unknown as DocumentNode;
export const GetTrendingByPredicateLabel = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetTrendingByPredicateLabel"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"predicateLabel"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"triples"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"predicate"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"label"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"_eq"},"value":{"kind":"Variable","name":{"kind":"Name","value":"predicateLabel"}}}]}}]}}]}},{"kind":"Argument","name":{"kind":"Name","value":"order_by"},"value":{"kind":"ListValue","values":[{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"positions_aggregate"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"count"},"value":{"kind":"EnumValue","value":"desc"}}]}}]},{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"created_at"},"value":{"kind":"EnumValue","value":"desc"}}]}]}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"term_id"}},{"kind":"Field","name":{"kind":"Name","value":"counter_term_id"}},{"kind":"Field","name":{"kind":"Name","value":"object"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"value"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"thing"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}}]}}]}}]}},{"kind":"Field","alias":{"kind":"Name","value":"all_positions"},"name":{"kind":"Name","value":"positions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"shares"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"_gt"},"value":{"kind":"StringValue","value":"0","block":false}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"account"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]}}]} as unknown as DocumentNode;
export const GetTripleVaultStats = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetTripleVaultStats"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"termId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"address"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"triples"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"term_id"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"_eq"},"value":{"kind":"Variable","name":{"kind":"Name","value":"termId"}}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"term_id"}},{"kind":"Field","name":{"kind":"Name","value":"term"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"vaults"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"market_cap"}},{"kind":"Field","name":{"kind":"Name","value":"total_shares"}},{"kind":"Field","name":{"kind":"Name","value":"position_count"}},{"kind":"Field","name":{"kind":"Name","value":"current_share_price"}},{"kind":"Field","name":{"kind":"Name","value":"positions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"account_id"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"_ilike"},"value":{"kind":"Variable","name":{"kind":"Name","value":"address"}}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"shares"}},{"kind":"Field","name":{"kind":"Name","value":"total_deposit_assets_after_total_fees"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"counter_term"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"vaults"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"market_cap"}},{"kind":"Field","name":{"kind":"Name","value":"total_shares"}},{"kind":"Field","name":{"kind":"Name","value":"position_count"}},{"kind":"Field","name":{"kind":"Name","value":"current_share_price"}},{"kind":"Field","name":{"kind":"Name","value":"positions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"account_id"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"_ilike"},"value":{"kind":"Variable","name":{"kind":"Name","value":"address"}}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"shares"}},{"kind":"Field","name":{"kind":"Name","value":"total_deposit_assets_after_total_fees"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode;
export const GetBatchTripleVaultStats = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetBatchTripleVaultStats"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"termIds"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"address"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"triples"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"term_id"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"_in"},"value":{"kind":"Variable","name":{"kind":"Name","value":"termIds"}}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"term_id"}},{"kind":"Field","name":{"kind":"Name","value":"subject"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"term_id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"predicate"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"term_id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"object"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"term_id"}},{"kind":"Field","name":{"kind":"Name","value":"value"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"thing"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"term"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"vaults"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"market_cap"}},{"kind":"Field","name":{"kind":"Name","value":"total_shares"}},{"kind":"Field","name":{"kind":"Name","value":"position_count"}},{"kind":"Field","name":{"kind":"Name","value":"current_share_price"}},{"kind":"Field","name":{"kind":"Name","value":"positions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"account_id"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"_ilike"},"value":{"kind":"Variable","name":{"kind":"Name","value":"address"}}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"shares"}},{"kind":"Field","name":{"kind":"Name","value":"total_deposit_assets_after_total_fees"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"counter_term"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"vaults"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"market_cap"}},{"kind":"Field","name":{"kind":"Name","value":"total_shares"}},{"kind":"Field","name":{"kind":"Name","value":"position_count"}},{"kind":"Field","name":{"kind":"Name","value":"current_share_price"}},{"kind":"Field","name":{"kind":"Name","value":"positions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"account_id"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"_ilike"},"value":{"kind":"Variable","name":{"kind":"Name","value":"address"}}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"shares"}},{"kind":"Field","name":{"kind":"Name","value":"total_deposit_assets_after_total_fees"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode;
export const WatchUserPositions = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"WatchUserPositions"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"accountId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"positions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"account_id"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"_ilike"},"value":{"kind":"Variable","name":{"kind":"Name","value":"accountId"}}}]}}]}},{"kind":"Argument","name":{"kind":"Name","value":"order_by"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"shares"},"value":{"kind":"EnumValue","value":"desc"}}]}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"500"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PositionWithVaultDetails"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PositionWithVaultDetails"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"positions"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"shares"}},{"kind":"Field","name":{"kind":"Name","value":"term_id"}},{"kind":"Field","name":{"kind":"Name","value":"curve_id"}},{"kind":"Field","name":{"kind":"Name","value":"vault"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"term_id"}},{"kind":"Field","name":{"kind":"Name","value":"total_shares"}},{"kind":"Field","name":{"kind":"Name","value":"current_share_price"}},{"kind":"Field","name":{"kind":"Name","value":"term"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"atom"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"term_id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"value"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"thing"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"account"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"triple"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"term_id"}},{"kind":"Field","name":{"kind":"Name","value":"subject"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"term_id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"predicate"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"term_id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"object"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"term_id"}},{"kind":"Field","name":{"kind":"Name","value":"value"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"thing"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode;
export const WatchUserTrackedPositions = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"WatchUserTrackedPositions"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"accountId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"termIds"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"positions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"account_id"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"_ilike"},"value":{"kind":"Variable","name":{"kind":"Name","value":"accountId"}}}]}},{"kind":"ObjectField","name":{"kind":"Name","value":"term_id"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"_in"},"value":{"kind":"Variable","name":{"kind":"Name","value":"termIds"}}}]}}]}},{"kind":"Argument","name":{"kind":"Name","value":"order_by"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"shares"},"value":{"kind":"EnumValue","value":"desc"}}]}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"500"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PositionWithVaultDetails"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PositionWithVaultDetails"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"positions"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"shares"}},{"kind":"Field","name":{"kind":"Name","value":"term_id"}},{"kind":"Field","name":{"kind":"Name","value":"curve_id"}},{"kind":"Field","name":{"kind":"Name","value":"vault"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"term_id"}},{"kind":"Field","name":{"kind":"Name","value":"total_shares"}},{"kind":"Field","name":{"kind":"Name","value":"current_share_price"}},{"kind":"Field","name":{"kind":"Name","value":"term"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"atom"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"term_id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"value"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"thing"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"account"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"triple"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"term_id"}},{"kind":"Field","name":{"kind":"Name","value":"subject"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"term_id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"predicate"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"term_id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"object"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"term_id"}},{"kind":"Field","name":{"kind":"Name","value":"value"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"thing"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode;
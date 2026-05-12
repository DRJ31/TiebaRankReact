import type { Dayjs } from "dayjs";

export interface UserRecord {
  rank: number;
  name: string;
  nickname?: string;
  link: string;
  member?: boolean;
  level: number;
  exp: number;
}

export interface UserDetail {
  avatar: string;
  nickname: string;
}

export interface Anniversary {
  event: string;
  date: string;
  description?: string;
  adj?: string;
}

export interface EventRecord {
  event: string;
  date: string;
  description: string;
  adj: string;
}

export interface DistributionRecord {
  level: number;
  rank: number;
  delta: number;
  count?: number;
}

export interface PostRecord {
  date: number;
  total: number;
  posts: number;
}

export interface IncomeRecord {
  name: string;
  short: string;
  date: string | number;
  income: number;
  max: number;
}

export interface MonthlyIncomeRecord {
  date: string | number;
  income: number;
}

export interface IncomeChartRecord {
  date: string | number;
  income: number;
  type: string;
}

export interface CharacterIncomeRecord {
  name: string;
  type: string;
  income: number;
}

export interface DateRange {
  start: Dayjs;
  end: Dayjs;
}

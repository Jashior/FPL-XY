export interface Filter {
  min_minutes: number;
  min_tsb: number;
  max_tsb: number;
  min_price: number;
  max_price: number;
  teams: string[];
  positions: string[];
}

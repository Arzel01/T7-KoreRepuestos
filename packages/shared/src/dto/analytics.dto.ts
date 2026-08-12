export interface SearchTermEntry {
  termino: string;
  count: number;
}

export interface SearchAnalyticsResponse {
  topTerms: SearchTermEntry[];
  zeroResultTerms: SearchTermEntry[];
}

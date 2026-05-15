export interface PageResponse<T> {
  content: T[];          // La liste de tes chansons (Song[])
  pageNumber: number;    // Numéro de la page actuelle
  pageSize: number;      // Taille de la page
  totalElements: number; // Nombre total de chansons en base
  totalPages: number;    // Nombre total de pages disponibles
  last: boolean;         // Est-ce la dernière page ?
}
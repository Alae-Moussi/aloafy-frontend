export interface Song {
  id: number;
  title: string;
  artist: string;
  songUrl: string;
  imageUrl: string;
  createdAt: string;
  appUserId: number;
  appUserName: string;
}

export interface SongRequest {
  title: string;
  artist: string;
}

export interface AiSongData {
  analysis: string;
  moods: string[];
  genre: string;
  tempo: number;
  key: string;
  energy: number;
  similarArtists: string[];
  recommendedFor: string;
}
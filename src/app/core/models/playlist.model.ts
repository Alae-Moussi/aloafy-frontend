export interface Playlist {
    id: number;
    name: string;
    description: string;
    isPublic: boolean;
    imageUrl: string;
    createdAt: string;
    updatedAt: string;
    appUserId: number;
    appUserName: string;
}

export interface PlaylistWithSongs extends Playlist {
    songCount: number;
    songs: SongInPlaylist[];
}

export interface SongInPlaylist {
    songId: number;
    title: string;
    artist: string;
    songUrl: string;
    imageUrl: string;
    position: number;
    addedAt: string;
}
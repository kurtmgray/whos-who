import { Injectable } from '@angular/core';
import fetchFromSpotify from './api';

@Injectable({
  providedIn: 'root'
})
export class GameService {

  constructor() { }

  fetchGenres = async (token: string) => {
    const response = await fetchFromSpotify({
      token,
      endpoint: "recommendations/available-genre-seeds",
    });
    console.log(response);
    return response.genres;
  }
  
  fetchPlaylistsByGenre = async (token: string, genre: string) => {
    const response = await fetchFromSpotify({
      token,
      endpoint: "search",
      params: {
        q: genre,
        type: "playlist",
        limit: 3,
      },
    });
    return response.playlists.items.map((item: { id: string }) => item.id);
  }

  fetchArtistsFromPlaylist = async (token: string, playlistIds: string[]) => {
    const artists: Artist[] = [];
    const artistIds = new Set<string>();
    
    const allResponses = await Promise.all(playlistIds.map(playlistId => 
      fetchFromSpotify({
          token,
          endpoint: `playlists/${playlistId}`,
          params: {
              fields: "tracks.items.track",
              limit: 1,
          },
      })
  ));
    for (let response of allResponses) {
      // Prevent duplicates
      for (const item of response.tracks.items) {
        const artist = {
          name: item.track.artists[0].name,
          id: item.track.artists[0].id,
          img: item.track.album.images[0].url || null,

        };

        if (!artistIds.has(artist.id)) {
          artistIds.add(artist.id);
          artists.push(artist);
        }
      }
    }
    return artists.sort(() => 0.5 - Math.random());
  }

  fetchTracksFromArtists = async (token: string, genreArtists: Artist[], numSongs: number, numQuestions: number) => {
    const artistTracks: ArtistData[] = []
    
    for (let artist of genreArtists) {
      const response = await fetchFromSpotify({
        token,
        endpoint: `artists/${artist.id}/top-tracks`,
        params: {
          limit: 3,
          market: 'US',
        },
      })
    
      const previews = response.tracks
        .filter((track: any) => track.preview_url)
        .map((track: any) => track.preview_url)
        .slice(0, numSongs)
      
      if (previews.length >= numSongs) {
        // Set fallback image is album cover
        const artistData = {
          name: response.tracks[0].artists[0].name,
          img: response.tracks[0].album.images[0].url || null,
          previews
        };
        artistTracks.push(artistData);
      }
      if (artistTracks.length >= numQuestions) {
        break;
      }
    }

    return artistTracks
  }

  fetchArtistImage = async (token: string, artistId: string) => {
    const response = await fetchFromSpotify({
      token,
      endpoint: `artists/${artistId}`,
      params: {
        fields: "images",
      },
    });

    if (response.images.length > 0) {
      return response.images[0].url;
    }
  }

}

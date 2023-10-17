import { Component, OnInit, Output } from "@angular/core";
import fetchFromSpotify, { request } from "../../services/api";
import { environment } from "src/environments/environment";
import { Router, NavigationExtras } from "@angular/router";

const AUTH_ENDPOINT = "https://accounts.spotify.com/api/token";
const TOKEN_KEY = "whos-who-access-token";
const CLIENT_ID = environment['SPOTIFY_CLIENT_ID'];
const CLIENT_SECRET = environment['SPOTIFY_CLIENT_SECRET'];


type Artist = {
  name: string,
  id: string
}

type ArtistData = {
  name: any;
  topTracks: any;
  preview: any;
}

type Question = {
  text: string;
  options: string[];
  correctAnswer: string;
  preview: string[];
}

@Component({
  selector: "app-home",
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.css"],
})
export class HomeComponent implements OnInit {
  constructor(private router: Router) { }

  @Output() questions: Question[] = [];

  genres: string[] = ["House", "Alternative", "J-Rock", "R&B"];
  selectedGenre: string = "";
  authLoading: boolean = false;
  configLoading: boolean = false;
  token: string = "";

  numOfQuestions: number = 5;
  numOfOptionsPerQuestion: number = 2;
  numOfSongsPerQuestion: number = 1;

  genreArtists: Artist[] = [];

  ngOnInit(): void {
    this.authLoading = true;
    const storedTokenString = localStorage.getItem(TOKEN_KEY);
    if (storedTokenString) {
      const storedToken = JSON.parse(storedTokenString);
      if (storedToken.expiration > Date.now()) {
        console.log("Token found in localstorage");
        this.authLoading = false;
        this.token = storedToken.value;
        this.loadGenres(storedToken.value);
        return;
      }
    }
    console.log("Sending request to AWS endpoint");
    request(AUTH_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `grant_type=client_credentials&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}`
    }
    ).then(({ access_token, expires_in }) => {
      const newToken = {
        value: access_token,
        expiration: Date.now() + (expires_in - 20) * 1000,
      };
      localStorage.setItem(TOKEN_KEY, JSON.stringify(newToken));
      this.authLoading = false;
      this.token = newToken.value;
      this.loadGenres(newToken.value);
    });
  }

  loadGenres = async (t: string) => {
    this.configLoading = true;
    const response = await fetchFromSpotify({
      token: t,
      endpoint: "recommendations/available-genre-seeds",
    });
    console.log(response);
    this.genres = response.genres;
    this.configLoading = false;
  };

  setGenre = async (selectedGenre: string) => {
    this.selectedGenre = selectedGenre;
    const playlistIds = await this.fetchPlaylistsByGenre()
    this.genreArtists = await this.fetchArtistsFromPlaylist(playlistIds)
  }

  fetchPlaylistsByGenre = async () => {
    const response = await fetchFromSpotify({
      token: this.token,
      endpoint: "search",
      params: {
        q: this.selectedGenre,
        type: "playlist",
        limit: 1,
      },
    });
    return response.playlists.items.map((item: { id: string }) => item.id);
  }

  fetchArtistsFromPlaylist = async (playlistIds: string[]) => {
    const artists: Artist[] = [];
    const artistIds = new Set<string>();

    for (let playlistId of playlistIds) {
      const response = await fetchFromSpotify({
        token: this.token,
        endpoint: `playlists/${playlistId}`,
        params: {
          fields: "tracks.items.track.artists",
          limit: 1,
        },
      });

      // Prevent duplicates
      for (const item of response.tracks.items) {
        const artist = {
          name: item.track.artists[0].name,
          id: item.track.artists[0].id
        };

        if (!artistIds.has(artist.id)) {
          artistIds.add(artist.id);
          artists.push(artist);
        }
      }
    }
    return artists;
  }

  fetchTracksFromArtists = async () => {
    const artistTracks: ArtistData[] = []
    for (let artist of this.genreArtists.slice(0, this.numOfQuestions)) {
      const response = await fetchFromSpotify({
        token: this.token,
        endpoint: `artists/${artist.id}/top-tracks`,
        params: {
          limit: 3,
          market: 'US',
        },
      });

      const topTracks: string[] = []
      const preview: string[] = []
      for (let track of response.tracks) {
        if (track.id && track.preview_url) {
          topTracks.push(track.id)
          preview.push(track.preview_url)
        }
      }
      const artistData = {
        name: response.tracks[0].artists[0].name,
        topTracks,
        preview
      }
      artistTracks.push(artistData)
    }
    return artistTracks
  }

  createQuestions = async () => {
    const artistTracks = await this.fetchTracksFromArtists()
    const usedArtist = new Set<string>();
    const questions: Question[] = [];

    for (let artistData of artistTracks) {
      const correctArtist = artistData;

      // TODO: refactor shuffle
      const wrongArtists = this.genreArtists
        .filter(artist => {
          if (artist.name !== correctArtist.name && !usedArtist.has(artist.id)) {
            usedArtist.add(artist.id);
            return true;
          }
          return false;
        })
        .sort(() => 0.5 - Math.random())
        .slice(0, this.numOfOptionsPerQuestion - 1);

      const options = [
        ...wrongArtists.map(artist => artist.name),
        correctArtist.name
      ].sort(() => 0.5 - Math.random());

      questions.push({
        text: `Who is the artist of this track?`,
        options,
        correctAnswer: correctArtist.name,
        preview: correctArtist.preview.slice(0, this.numOfSongsPerQuestion)
      });
    }
    console.log(questions);
    // I added this below in order to pass questions to Game
    const navigationExtras: NavigationExtras = { state: { questions: questions } };
    this.router.navigate(['/game'], navigationExtras);

    return questions;
  }
}

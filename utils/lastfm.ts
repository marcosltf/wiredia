const API_KEY = process.env.LASTFM_API_KEY || "babc1e1de565c80d95983aa7c4e28f76";
const BASE_URL = "http://ws.audioscrobbler.com/2.0/";

interface LastFmTrack {
  title: string;
  artist: string;
  album?: string;
  nowPlaying: boolean;
}

interface LastFmApiResponse {
  recenttracks?: {
    track?: Array<{
      name: string;
      artist: { "#text": string };
      album: { "#text": string };
      "@attr"?: { nowplaying?: string };
    }>;
  };
}

export async function getLatestTrack(username: string): Promise<LastFmTrack> {
  const url = `${BASE_URL}?method=user.getrecenttracks&user=${username}&api_key=${API_KEY}&format=json&limit=1`;
  const response = await fetch(url);
  const data = (await response.json()) as LastFmApiResponse; // ✅ cast to our type

  const track = data.recenttracks?.track?.[0];
  if (!track) throw new Error("Não foi possível encontrar a última track do usuário");

  return {
    title: track.name,
    artist: track.artist["#text"],
    album: track.album["#text"] || undefined,
    nowPlaying: track["@attr"]?.nowplaying === "true" || false,
  };
}

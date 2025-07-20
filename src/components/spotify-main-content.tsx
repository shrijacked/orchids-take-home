"use client"

import { Play, User } from "lucide-react"
import { useState, useEffect } from "react"

interface Track {
  id: string
  title: string
  artist: string
  album: string
  albumArt: string
  duration: number
}

interface MusicCardProps {
  title: string
  artist: string
  image?: string
  size?: "small" | "medium" | "large"
  className?: string
  onPlay?: () => void
}

function MusicCard({ title, artist, image, size = "medium", className = "", onPlay }: MusicCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const sizeClasses = {
    small: "w-[180px] h-[180px]",
    medium: "w-full aspect-square",
    large: "w-full aspect-square"
  }

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onPlay?.()
  }

  return (
    <div 
      className={`group cursor-pointer p-4 rounded-lg transition-all duration-300 hover:bg-[var(--color-interactive-hover)] border border-transparent hover:border-gray-600/50 ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`relative ${sizeClasses[size]} mb-4`}>
        <div className="w-full h-full bg-[var(--color-muted)] rounded-lg flex items-center justify-center overflow-hidden">
          {image ? (
            <img 
              src={image} 
              alt={title}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-chart-1)] opacity-20 rounded-lg"></div>
          )}
        </div>
        
        {/* Play button overlay */}
        <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}>
          <div 
            onClick={handlePlayClick}
            className="w-12 h-12 bg-[var(--color-primary)] rounded-full flex items-center justify-center shadow-lg transform transition-transform duration-300 hover:scale-110 cursor-pointer"
          >
            <Play className="w-5 h-5 text-black fill-black ml-1" />
          </div>
        </div>
      </div>
      
      <div className="space-y-1">
        <h3 className="font-medium text-[var(--color-text-primary)] text-sm truncate">{title}</h3>
        <p className="text-[var(--color-text-secondary)] text-xs truncate">{artist}</p>
      </div>
    </div>
  )
}

interface SpotifyMainContentProps {
  onPlayTrack?: (track: Track) => void
}

export default function SpotifyMainContent({ onPlayTrack }: SpotifyMainContentProps) {
  const [recentlyPlayed, setRecentlyPlayed] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [madeForYou, setMadeForYou] = useState<Track[]>([]);
  const [madeForYouLoading, setMadeForYouLoading] = useState(true);
  const [madeForYouError, setMadeForYouError] = useState<string | null>(null);

  const [popularAlbums, setPopularAlbums] = useState<Track[]>([]);
  const [popularAlbumsLoading, setPopularAlbumsLoading] = useState(true);
  const [popularAlbumsError, setPopularAlbumsError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch("/api/recently-played")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data) => {
        setRecentlyPlayed(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    setMadeForYouLoading(true);
    fetch("/api/made-for-you")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data) => {
        setMadeForYou(data);
        setMadeForYouLoading(false);
      })
      .catch((err) => {
        setMadeForYouError(err.message);
        setMadeForYouLoading(false);
      });
  }, []);

  useEffect(() => {
    setPopularAlbumsLoading(true);
    fetch("/api/popular-albums")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data) => {
        setPopularAlbums(data);
        setPopularAlbumsLoading(false);
      })
      .catch((err) => {
        setPopularAlbumsError(err.message);
        setPopularAlbumsLoading(false);
      });
  }, []);

  const handlePlayTrack = (item: any) => {
    const track: Track = {
      id: item.id,
      title: item.title,
      artist: item.artist,
      album: item.album,
      albumArt: item.image || '/api/placeholder/56/56',
      duration: item.duration
    }
    onPlayTrack?.(track)
  }

  return (
    <div className="bg-[var(--color-background-primary)] text-[var(--color-text-primary)] min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between p-6 pb-0">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Good afternoon</h1>
        </div>
        <div className="w-8 h-8 bg-[var(--color-muted)] rounded-full flex items-center justify-center">
          <User className="w-4 h-4 text-[var(--color-text-secondary)]" />
        </div>
      </div>

      {/* Recently Played Section */}
      <h2 className="text-2xl font-bold mb-4">Recently Played</h2>
      {loading && <div>Loading...</div>}
      {error && <div className="text-red-500">Error: {error}</div>}
      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-10">
          {recentlyPlayed.map((track) => (
              <MusicCard 
              key={track.id}
              title={track.title}
              artist={track.artist}
              image={track.albumArt}
              onPlay={() => onPlayTrack?.(track)}
              />
          ))}
        </div>
      )}

      {/* Made For You Section */}
      <h2 className="text-2xl font-bold mb-4">Made for You</h2>
      {madeForYouLoading && <div>Loading...</div>}
      {madeForYouError && <div className="text-red-500">Error: {madeForYouError}</div>}
      {!madeForYouLoading && !madeForYouError && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-10">
          {madeForYou.map((track) => (
            <MusicCard 
              key={track.id}
              title={track.title}
              artist={track.artist}
              image={track.albumArt}
              onPlay={() => onPlayTrack?.(track)}
            />
          ))}
        </div>
      )}

      {/* Popular Albums Section */}
      <h2 className="text-2xl font-bold mb-4">Popular Albums</h2>
      {popularAlbumsLoading && <div>Loading...</div>}
      {popularAlbumsError && <div className="text-red-500">Error: {popularAlbumsError}</div>}
      {!popularAlbumsLoading && !popularAlbumsError && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-10">
          {popularAlbums.map((track) => (
            <MusicCard 
              key={track.id}
              title={track.title}
              artist={track.artist}
              image={track.albumArt}
              onPlay={() => onPlayTrack?.(track)}
            />
          ))}
        </div>
      )}

      <style jsx>{`
        .scrollbar-hide {
          /* Hide scrollbar for Chrome, Safari and Opera */
          -webkit-scrollbar: hidden;
        }
        
        .scrollbar-hide {
          /* Hide scrollbar for IE, Edge and Firefox */
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  )
}
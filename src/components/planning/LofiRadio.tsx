import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { 
  Play, Pause, SkipForward, Volume2, VolumeX, Radio, 
  Music, Coffee, Moon, Waves
} from 'lucide-react';

interface Station {
  id: string;
  name: string;
  icon: typeof Music;
  url: string;
  color: string;
}

const stations: Station[] = [
  { id: 'lofi-girl', name: 'Lofi Girl', icon: Coffee, url: 'https://play.streamafrica.net/lofiradio', color: '#E879F9' },
  { id: 'chillhop', name: 'Chillhop', icon: Music, url: 'https://streams.ilovemusic.de/iloveradio17.mp3', color: '#F97316' },
  { id: 'sleep', name: 'Sleep Sounds', icon: Moon, url: 'https://stream.zeno.fm/0r0xa792kwzuv', color: '#6366F1' },
  { id: 'nature', name: 'Nature Sounds', icon: Waves, url: 'https://stream.zeno.fm/f3wvbbqmdg8uv', color: '#10B981' },
  { id: 'jazz', name: 'Jazz Study', icon: Music, url: 'https://stream.zeno.fm/fyn8eh3h5bzuv', color: '#D97706' },
  { id: 'classical', name: 'Classical Focus', icon: Music, url: 'https://stream.zeno.fm/4d6622rd8wzuv', color: '#8B5CF6' },
  { id: 'ambient', name: 'Ambient Space', icon: Moon, url: 'https://stream.zeno.fm/cgmyn72m3xzuv', color: '#0EA5E9' },
  { id: 'rain', name: 'Rain Sounds', icon: Waves, url: 'https://stream.zeno.fm/6ry05p4h9xzuv', color: '#64748B' },
  { id: 'piano', name: 'Piano Chill', icon: Music, url: 'https://stream.zeno.fm/nd3chr3h5bzuv', color: '#EC4899' },
  { id: 'deep-focus', name: 'Deep Focus', icon: Radio, url: 'https://streams.ilovemusic.de/iloveradio21.mp3', color: '#14B8A6' },
  { id: 'cafe', name: 'Cafe Vibes', icon: Coffee, url: 'https://stream.zeno.fm/qw5s004h9xzuv', color: '#A16207' },
  { id: 'white-noise', name: 'White Noise', icon: Waves, url: 'https://stream.zeno.fm/4r304v02ttzuv', color: '#94A3B8' },
];

const LofiRadio = () => {
  const [currentStation, setCurrentStation] = useState<Station | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(50);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.volume = volume / 100;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume / 100;
    }
  }, [volume, isMuted]);

  const playStation = (station: Station) => {
    if (!audioRef.current) return;

    if (currentStation?.id === station.id) {
      // Toggle play/pause for same station
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    } else {
      // Switch to new station
      audioRef.current.src = station.url;
      audioRef.current.play().catch(console.error);
      setCurrentStation(station);
      setIsPlaying(true);
    }
  };

  const skipStation = () => {
    if (!currentStation) return;
    const currentIndex = stations.findIndex(s => s.id === currentStation.id);
    const nextIndex = (currentIndex + 1) % stations.length;
    playStation(stations[nextIndex]);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Radio className="w-5 h-5 text-primary" />
        <h3 className="font-display font-semibold">Focus Radio</h3>
      </div>

      {/* Now Playing */}
      {currentStation && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 rounded-xl border border-border"
          style={{ backgroundColor: `${currentStation.color}10` }}
        >
          <div className="flex items-center gap-4">
            <div 
              className="w-14 h-14 rounded-xl flex items-center justify-center relative overflow-hidden"
              style={{ backgroundColor: `${currentStation.color}30` }}
            >
              <currentStation.icon 
                className="w-7 h-7" 
                style={{ color: currentStation.color }} 
              />
              {isPlaying && (
                <motion.div
                  className="absolute inset-0 rounded-xl"
                  style={{ 
                    border: `2px solid ${currentStation.color}`,
                    borderRadius: '0.75rem',
                  }}
                  animate={{ scale: [1, 1.1, 1], opacity: [1, 0.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
            </div>
            <div className="flex-1">
              <p className="font-medium">{currentStation.name}</p>
              <p className="text-sm text-muted-foreground">
                {isPlaying ? 'Now Playing' : 'Paused'}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-3 mt-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMute}
              className="rounded-full"
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </Button>
            
            <Button
              size="icon"
              className="rounded-full w-12 h-12"
              style={{ backgroundColor: currentStation.color }}
              onClick={() => playStation(currentStation)}
            >
              {isPlaying ? (
                <Pause className="w-6 h-6 text-white" />
              ) : (
                <Play className="w-6 h-6 text-white ml-0.5" />
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={skipStation}
              className="rounded-full"
            >
              <SkipForward className="w-5 h-5" />
            </Button>
          </div>

          {/* Volume Slider */}
          <div className="flex items-center gap-3 mt-4">
            <VolumeX className="w-4 h-4 text-muted-foreground" />
            <Slider
              value={[volume]}
              onValueChange={([v]) => setVolume(v)}
              max={100}
              step={1}
              className="flex-1"
            />
            <Volume2 className="w-4 h-4 text-muted-foreground" />
          </div>
        </motion.div>
      )}

      {/* Station Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {stations.map((station) => {
          const isActive = currentStation?.id === station.id;
          const Icon = station.icon;

          return (
            <motion.button
              key={station.id}
              onClick={() => playStation(station)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`p-4 rounded-xl border transition-all ${
                isActive 
                  ? 'border-primary shadow-lg' 
                  : 'border-border hover:border-primary/50'
              }`}
              style={{ 
                backgroundColor: isActive ? `${station.color}15` : 'var(--card)' 
              }}
            >
              <div 
                className="w-10 h-10 mx-auto rounded-lg flex items-center justify-center mb-2"
                style={{ backgroundColor: `${station.color}20` }}
              >
                <Icon className="w-5 h-5" style={{ color: station.color }} />
              </div>
              <p className="text-sm font-medium text-center">{station.name}</p>
              {isActive && isPlaying && (
                <div className="flex items-center justify-center gap-1 mt-2">
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-1 rounded-full"
                      style={{ backgroundColor: station.color }}
                      animate={{ height: [4, 12, 4] }}
                      transition={{ 
                        duration: 0.5, 
                        repeat: Infinity, 
                        delay: i * 0.1 
                      }}
                    />
                  ))}
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      <p className="text-xs text-center text-muted-foreground">
        Free streaming radio for focused studying
      </p>
    </div>
  );
};

export default LofiRadio;

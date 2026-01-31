import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Loader2, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { type PostResponse } from "@shared/schema";

interface Post {
  id: string;
  url: string;
  title: string;
  cleanTitle: string;
  imageUrl: string | null;
  whatsapp: string | null;
  hashtags: string[] | null;
  category: string;
  lastUpdated: string;
}

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

const PostSlide = ({ post, isActive }: { post: Post; isActive: boolean }) => {
  const formatWhatsApp = (whatsapp: string | null) => {
    if (!whatsapp) return "(24) 9 8841 8058";
    
    // Remove all non-digits
    const digits = whatsapp.replace(/\D/g, '');
    
    // If it's 10 digits (DDD + 8 digits), add the 9 after DDD
    if (digits.length === 10) {
      const ddd = digits.substring(0, 2);
      const number = digits.substring(2);
      return `(${ddd}) 9 ${number.substring(0, 4)}-${number.substring(4)}`;
    }
    
    // If it's already 11 digits (DDD + 9 + 8 digits), format correctly
    if (digits.length === 11) {
      const ddd = digits.substring(0, 2);
      const nine = digits.substring(2, 3);
      const number = digits.substring(3);
      return `(${ddd}) ${nine} ${number.substring(0, 4)}-${number.substring(4)}`;
    }
    
    // Return as is if format is unexpected
    return whatsapp;
  };

  const getWhatsAppLink = (whatsapp: string | null) => {
    const phone = whatsapp || "(24) 9 8841 8058";
    // Remove all non-digits
    let cleanPhone = phone.replace(/\D/g, '');
    
    // If it's 10 digits, add the 9 after DDD
    if (cleanPhone.length === 10) {
      cleanPhone = cleanPhone.substring(0, 2) + '9' + cleanPhone.substring(2);
    }
    
    return `https://wa.me/+55${cleanPhone}`;
  };

  return (
    <div 
      className={`post-slide ${isActive ? 'active' : ''}`}
      data-testid={isActive ? 'post-slide-active' : undefined}
      aria-hidden={!isActive}
    >
      <div className="flex flex-col justify-center items-center flex-1" style={{ padding: 'calc(0.75em) calc(1.25em)' }}>
        {/* Profession/Title - WhatsApp Style Box */}
        <div 
          className="rounded-2xl max-w-5xl"
          style={{ 
            backgroundColor: '#25D366',
            padding: 'calc(0.25em) calc(0.5em)',
            marginBottom: 'calc(0.5em)'
          }}
          data-testid={isActive ? 'post-profession-box' : undefined}
        >
          <h2 
            className="font-bold text-white text-center leading-tight"
            style={{ fontSize: 'calc(1em)' }}
            data-testid={isActive ? 'post-profession' : undefined}
          >
            {post.cleanTitle}
          </h2>
        </div>

        {/* Post Image with Google and Facebook Logos */}
        <div 
          className="flex items-center justify-center"
          style={{ 
            gap: 'calc(0.4375em)', // 7px distance
            marginBottom: 'calc(0.75em)'
          }}
        >
          {/* Google Logo - Left Side */}
          <div
            className="flex items-center justify-center"
            style={{
              width: 'calc(4.46875em)',
              height: 'calc(4.46875em)',
            }}
            data-testid={isActive ? 'google-logo' : undefined}
          >
            <img
              src="/logos/google.png"
              alt="Google"
              className="w-full h-full object-contain"
            />
          </div>

          {/* Post Image - Center */}
          <div 
            className="rounded-3xl overflow-hidden border-led-primary bg-led-dark/50 led-shadow-primary"
            style={{ 
              width: 'calc(8.125em)',
              height: 'calc(8.125em)',
              borderWidth: 'calc(0.0625em)'
            }}
            data-testid={isActive ? 'post-image-container' : undefined}
          >
            {post.imageUrl ? (
              <img
                src={post.imageUrl}
                alt={post.cleanTitle}
                className="w-full h-full object-cover"
                data-testid={isActive ? 'post-image' : undefined}
                onError={(e) => {
                  // Fallback to placeholder if image fails to load
                  const target = e.target as HTMLImageElement;
                  target.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzI1IiBoZWlnaHQ9IjMyNSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzI1IiBoZWlnaHQ9IjMyNSIgZmlsbD0iIzJhMzE0MiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZW0gSW5kaXNwb27DrXZlbDwvdGV4dD48L3N2Zz4=";
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-led-dark/50">
                <span className="text-led-primary text-2xl font-medium">
                  Imagem Indisponível
                </span>
              </div>
            )}
          </div>

          {/* Facebook Logo - Right Side */}
          <div
            className="flex items-center justify-center"
            style={{
              width: 'calc(4.46875em)',
              height: 'calc(4.46875em)',
            }}
            data-testid={isActive ? 'facebook-logo' : undefined}
          >
            <img
              src="/logos/facebook.png"
              alt="Facebook"
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        {/* Profession Hashtags */}
        {post.hashtags && post.hashtags.length > 0 && (
          <div 
            className="font-bold text-center"
            style={{ 
              fontSize: 'calc(1em)',
              color: '#FFD700',
              marginBottom: 'calc(0.5em)',
              textShadow: '0 0 calc(0.625em) rgba(255, 215, 0, 0.5)'
            }}
            data-testid={isActive ? 'profession-hashtags' : undefined}
          >
            {post.hashtags.slice(0, 3).join(' ')}
          </div>
        )}

        {/* WhatsApp Contact */}
        <a
          href={getWhatsAppLink(post.whatsapp)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center rounded-full text-white font-bold led-gradient-success led-shadow-success transition-transform hover:scale-105"
          style={{
            gap: 'calc(0.3125em)',
            padding: 'calc(0.375em) calc(0.75em)',
            fontSize: 'calc(1em)'
          }}
          data-testid={isActive ? 'whatsapp-contact' : undefined}
        >
          <WhatsAppIcon className="responsive-whatsapp-icon" />
          <span>{formatWhatsApp(post.whatsapp)}</span>
        </a>
      </div>
    </div>
  );
};

// Shuffle array function
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export default function LEDPanel() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [randomizedPosts, setRandomizedPosts] = useState<Post[]>([]);

  // Fetch posts
  const category = 'Profissionais & Empresas';
  const { data, isLoading, error, refetch } = useQuery<PostResponse>({
    queryKey: ['/api/posts', category],
    queryFn: async () => {
      const response = await fetch(`/api/posts?category=${encodeURIComponent(category)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }
      return response.json();
    },
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  const posts = useMemo(() => data?.posts || [], [data?.posts]);

  // Refresh posts function
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await apiRequest('POST', '/api/posts/refresh');
      await refetch();
    } catch (error) {
      console.error('Error refreshing posts:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch]);

  // Auto-refresh posts on initial load - ALWAYS AUTOMATIC
  useEffect(() => {
    const refreshKey = 'led-panel-refreshed';
    
    const doRefresh = async () => {
      // Check if already refreshed in this session
      if (sessionStorage.getItem(refreshKey)) {
        return;
      }
      
      // Mark as refreshed before starting to prevent concurrent calls
      sessionStorage.setItem(refreshKey, 'true');
      
      try {
        await apiRequest('POST', '/api/posts/refresh');
        await refetch();
      } catch (error) {
        console.error('Error refreshing posts:', error);
        // Remove flag on error so it can retry
        sessionStorage.removeItem(refreshKey);
      }
    };
    
    doRefresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  // Randomize posts whenever they change
  useEffect(() => {
    if (posts.length > 0) {
      setRandomizedPosts(shuffleArray(posts));
      setCurrentSlide(0); // Reset to first slide when posts change
    } else {
      setRandomizedPosts([]); // Clear randomized posts when there are no posts
    }
  }, [posts]);

  // Auto-rotate slides every 6 seconds
  useEffect(() => {
    if (randomizedPosts.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % randomizedPosts.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [randomizedPosts.length]);

  // Loading state
  if (isLoading) {
    return (
      <div className="led-container">
        {/* Header Unificado */}
        <div className="led-gradient-primary text-center led-shadow-primary" style={{ padding: 'calc(0.375em) calc(0.5em)' }}>
          <h1 className="font-black text-white uppercase tracking-wider led-text-shadow" style={{ fontSize: 'calc(0.75em)' }}>
            CADASTRE-SE (24) 9.8841.8058 - É GRÁTIS
          </h1>
        </div>

        {/* Loading Content */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <Loader2 className="animate-spin text-led-primary" style={{ width: 'calc(1.5em)', height: 'calc(1.5em)', marginBottom: 'calc(0.5em)' }} data-testid="loading-spinner" />
          <p className="font-bold text-white led-text-shadow-sm" style={{ fontSize: 'calc(0.46875em)' }}>
            Carregando profissionais...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !data?.success) {
    return (
      <div className="led-container">
        {/* Header Unificado */}
        <div className="led-gradient-primary text-center led-shadow-primary" style={{ padding: 'calc(0.375em) calc(0.5em)' }}>
          <h1 className="font-black text-white uppercase tracking-wider led-text-shadow" style={{ fontSize: 'calc(0.75em)' }}>
            CADASTRE-SE (24) 9.8841.8058 - É GRÁTIS
          </h1>
        </div>

        {/* Error Content */}
        <div className="flex-1 flex flex-col items-center justify-center" style={{ padding: '0 calc(2em)' }}>
          <AlertCircle className="text-red-500" style={{ width: 'calc(1.5em)', height: 'calc(1.5em)', marginBottom: 'calc(0.5em)' }} data-testid="error-icon" />
          <p className="font-bold text-white text-center led-text-shadow-sm" style={{ fontSize: 'calc(0.46875em)', marginBottom: 'calc(0.5em)' }}>
            Erro ao carregar profissionais
          </p>
          <p className="text-led-primary text-center" style={{ fontSize: 'calc(0.3125em)', marginBottom: 'calc(0.5em)' }}>
            {data?.error || error?.message || 'Erro desconhecido'}
          </p>
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="font-bold led-gradient-primary"
            style={{ padding: 'calc(0.25em) calc(0.5em)', fontSize: 'calc(0.3125em)' }}
            data-testid="refresh-button"
          >
            {isRefreshing ? (
              <>
                <Loader2 className="animate-spin" style={{ width: 'calc(0.375em)', height: 'calc(0.375em)', marginRight: 'calc(0.125em)' }} />
                Atualizando...
              </>
            ) : (
              <>
                <RefreshCw style={{ width: 'calc(0.375em)', height: 'calc(0.375em)', marginRight: 'calc(0.125em)' }} />
                Tentar Novamente
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  // Empty state - show loading instead of button
  if (randomizedPosts.length === 0) {
    return (
      <div className="led-container">
        {/* Header Unificado */}
        <div className="led-gradient-primary text-center led-shadow-primary" style={{ padding: 'calc(0.375em) calc(0.5em)' }}>
          <h1 className="font-black text-white uppercase tracking-wider led-text-shadow" style={{ fontSize: 'calc(0.75em)' }}>
            CADASTRE-SE (24) 9.8841.8058 - É GRÁTIS
          </h1>
        </div>

        {/* Loading Content */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <Loader2 className="animate-spin text-led-primary" style={{ width: 'calc(1.5em)', height: 'calc(1.5em)', marginBottom: 'calc(0.5em)' }} data-testid="loading-spinner" />
          <p className="font-bold text-white led-text-shadow-sm" style={{ fontSize: 'calc(0.46875em)' }}>
            Carregando profissionais...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="led-container" data-testid="led-panel">
      {/* Header e Footer UNIFICADOS em UMA LINHA */}
      <div className="led-gradient-primary text-center led-shadow-primary" style={{ padding: 'calc(0.375em) calc(0.5em)' }}>
        <h1 className="font-black text-white uppercase tracking-wider led-text-shadow" style={{ fontSize: 'calc(0.75em)' }}>
          CADASTRE-SE (24) 9.8841.8058 - É GRÁTIS
        </h1>
      </div>

      {/* Posts Rotation Container */}
      <div className="relative flex-1" data-testid="posts-container">
        {randomizedPosts.map((post, index) => (
          <PostSlide
            key={post.id}
            post={post}
            isActive={index === currentSlide}
          />
        ))}
        
        {/* Manual refresh button (hidden, for debugging) */}
        <Button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="absolute top-4 right-4 z-10 opacity-0 hover:opacity-100 transition-opacity"
          size="sm"
          data-testid="hidden-refresh-button"
        >
          {isRefreshing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  );
}

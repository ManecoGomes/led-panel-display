import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Loader2, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { type PropertyResponse } from "@shared/schema";

interface Property {
  id: string;
  url: string;
  title: string;
  imageUrl: string | null;
  transactionType: string;
  lastUpdated: string;
}

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

const PropertySlide = ({ property, isActive }: { property: Property; isActive: boolean }) => {
  return (
    <div 
      className={`post-slide ${isActive ? 'active' : ''}`}
      data-testid={`property-slide-${property.id}`}
    >
      <div className="flex flex-col justify-center items-center flex-1" style={{ padding: 'calc(0.5em) calc(1.25em)' }}>
        {/* Transaction Type Badge */}
        <div 
          className="rounded-full"
          style={{ 
            backgroundColor: property.transactionType === 'VENDE' ? '#DC2626' : '#2563EB',
            padding: 'calc(0.3em) calc(1em)',
            marginBottom: 'calc(0.5em)'
          }}
          data-testid="transaction-badge"
        >
          <span className="font-black text-white uppercase tracking-wider" style={{ fontSize: 'calc(1.33em)' }}>
            {property.transactionType}
          </span>
        </div>

        {/* Property Title */}
        <h2 
          className="font-bold text-white text-center leading-tight led-text-shadow-sm max-w-5xl"
          style={{ 
            fontSize: 'calc(1.25em)',
            marginBottom: 'calc(0.5em)'
          }}
          data-testid="property-title"
        >
          {property.title}
        </h2>

        {/* Property Image with Logos - 70% larger (60% + 10%) */}
        <div 
          className="flex items-center justify-center"
          style={{ 
            gap: 'calc(0.4375em)', // 7px distance
            marginBottom: 'calc(0.5em)'
          }}
        >
          {/* Zap Imóveis Logo - Left Side */}
          <div
            className="flex items-center justify-center"
            style={{
              width: 'calc(7.007em)',
              height: 'calc(7.007em)',
            }}
            data-testid="zap-imoveis-logo"
          >
            <img
              src="/logos/zap-imoveis.svg"
              alt="Zap Imóveis"
              className="w-full h-full object-contain"
            />
          </div>

          {/* Property Image - Center */}
          <div 
            className="rounded-3xl overflow-hidden border-led-primary bg-led-dark/50 led-shadow-primary"
            style={{ 
              width: 'calc(10.725em)',
              height: 'calc(10.725em)',
              borderWidth: 'calc(0.0625em)'
            }}
            data-testid="property-image-container"
          >
            {property.imageUrl ? (
              <img
                src={property.imageUrl}
                alt={property.title}
                className="w-full h-full object-cover"
                data-testid="property-image"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzkwIiBoZWlnaHQ9IjM5MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzkwIiBoZWlnaHQ9IjM5MCIgZmlsbD0iIzJhMzE0MiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZW0gSW5kaXNwb27DrXZlbDwvdGV4dD48L3N2Zz4=";
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

          {/* OLX Logo - Right Side */}
          <div
            className="flex items-center justify-center"
            style={{
              width: 'calc(5.39em)',
              height: 'calc(5.39em)',
            }}
            data-testid="olx-logo"
          >
            <img
              src="/logos/olx.svg"
              alt="OLX"
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        {/* Footer with Website and WhatsApp */}
        <div className="flex flex-col items-center justify-center font-bold text-white led-text-shadow-sm" style={{ fontSize: 'calc(1.25em)', gap: 'calc(0.25em)' }}>
          <span>www.manecogomes.com.br</span>
          <div className="flex items-center" style={{ gap: 'calc(0.3em)' }}>
            <div style={{ width: 'calc(1.25em)', height: 'calc(1.25em)', display: 'flex', alignItems: 'center' }}>
              <WhatsAppIcon className="w-full h-full" />
            </div>
            <span>(24)9.8841.8058</span>
          </div>
        </div>
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

export default function LEDProperties() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [randomizedProperties, setRandomizedProperties] = useState<Property[]>([]);

  // Fetch properties
  const { data, isLoading, error, refetch } = useQuery<PropertyResponse>({
    queryKey: ['/api/properties'],
    queryFn: async () => {
      const response = await fetch('/api/properties');
      if (!response.ok) {
        throw new Error('Failed to fetch properties');
      }
      return response.json();
    },
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  // Filter properties to only show those with images
  const properties = useMemo(() => {
    const allProperties = data?.properties || [];
    return allProperties.filter(property => property.imageUrl && property.imageUrl.trim() !== '');
  }, [data?.properties]);

  // Refresh properties function
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await apiRequest('POST', '/api/properties/refresh');
      await refetch();
    } catch (error) {
      console.error('Error refreshing properties:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch]);

  // Auto-refresh properties on initial load - ALWAYS AUTOMATIC
  const hasRefreshedRef = useRef(false);
  
  useEffect(() => {
    if (hasRefreshedRef.current) return;
    hasRefreshedRef.current = true;
    
    let isMounted = true;
    
    (async () => {
      try {
        await apiRequest('POST', '/api/properties/refresh');
        if (isMounted) {
          await refetch();
        }
      } catch (error) {
        console.error('Error refreshing properties:', error);
      }
    })();
    
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  // Randomize properties whenever they change
  useEffect(() => {
    if (properties.length > 0) {
      setRandomizedProperties(shuffleArray(properties));
      setCurrentSlide(0);
    } else {
      setRandomizedProperties([]);
    }
  }, [properties]);

  // Auto-rotate slides every 6 seconds
  useEffect(() => {
    if (randomizedProperties.length === 0) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % randomizedProperties.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [randomizedProperties.length]);

  // Loading state
  if (isLoading) {
    return (
      <div className="led-container">
        {/* Header */}
        <div className="text-center led-shadow-primary" style={{ 
          background: 'linear-gradient(135deg, #DC2626 0%, #F59E0B 50%, #10B981 100%)',
          padding: 'calc(0.375em) calc(0.5em)'
        }}>
          <h1 className="font-black text-white uppercase tracking-wider led-text-shadow" style={{ fontSize: 'calc(0.75em)' }}>
            Imobiliária Maneco Gomes Empreendimentos <span style={{ fontSize: '0.3em' }}>CRECI7973RJ</span>
          </h1>
        </div>

        {/* Loading Content */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <Loader2 className="animate-spin text-led-primary" style={{ width: 'calc(1.5em)', height: 'calc(1.5em)', marginBottom: 'calc(0.5em)' }} data-testid="loading-spinner" />
          <p className="font-bold text-white led-text-shadow-sm" style={{ fontSize: 'calc(0.46875em)' }}>
            Carregando imóveis...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !data?.success) {
    return (
      <div className="led-container">
        {/* Header */}
        <div className="text-center led-shadow-primary" style={{ 
          background: 'linear-gradient(135deg, #DC2626 0%, #F59E0B 50%, #10B981 100%)',
          padding: 'calc(0.375em) calc(0.5em)'
        }}>
          <h1 className="font-black text-white uppercase tracking-wider led-text-shadow" style={{ fontSize: 'calc(0.75em)' }}>
            Imobiliária Maneco Gomes Empreendimentos <span style={{ fontSize: '0.3em' }}>CRECI7973RJ</span>
          </h1>
        </div>

        {/* Error Content */}
        <div className="flex-1 flex flex-col items-center justify-center" style={{ padding: '0 calc(2em)' }}>
          <AlertCircle className="text-red-500" style={{ width: 'calc(1.5em)', height: 'calc(1.5em)', marginBottom: 'calc(0.5em)' }} data-testid="error-icon" />
          <p className="font-bold text-white text-center led-text-shadow-sm" style={{ fontSize: 'calc(0.46875em)', marginBottom: 'calc(0.5em)' }}>
            Erro ao carregar imóveis
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
  if (randomizedProperties.length === 0) {
    return (
      <div className="led-container">
        {/* Header */}
        <div className="text-center led-shadow-primary" style={{ 
          background: 'linear-gradient(135deg, #DC2626 0%, #F59E0B 50%, #10B981 100%)',
          padding: 'calc(0.375em) calc(0.5em)'
        }}>
          <h1 className="font-black text-white uppercase tracking-wider led-text-shadow" style={{ fontSize: 'calc(0.75em)' }}>
            Imobiliária Maneco Gomes Empreendimentos <span style={{ fontSize: '0.3em' }}>CRECI7973RJ</span>
          </h1>
        </div>

        {/* Loading Content */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <Loader2 className="animate-spin text-led-primary" style={{ width: 'calc(1.5em)', height: 'calc(1.5em)', marginBottom: 'calc(0.5em)' }} data-testid="loading-spinner" />
          <p className="font-bold text-white led-text-shadow-sm" style={{ fontSize: 'calc(0.46875em)' }}>
            Carregando imóveis...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="led-container" data-testid="led-properties">
      {/* Header with Gradient */}
      <div className="text-center led-shadow-primary" style={{ 
        background: 'linear-gradient(135deg, #DC2626 0%, #F59E0B 50%, #10B981 100%)',
        padding: 'calc(0.375em) calc(0.5em)'
      }}>
        <h1 className="font-black text-white uppercase tracking-wider led-text-shadow" style={{ fontSize: 'calc(0.75em)' }}>
          Imobiliária Maneco Gomes Empreendimentos <span style={{ fontSize: '0.3em' }}>CRECI7973RJ</span>
        </h1>
      </div>

      {/* Properties Rotation Container */}
      <div className="relative flex-1" data-testid="properties-container">
        {randomizedProperties.map((property, index) => (
          <PropertySlide
            key={property.id}
            property={property}
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

import { WorldMap } from "@/components/WorldMap";
import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "@/services/api/analytics.api";
import { Loader2 } from "lucide-react";

interface MarketMapWithForecastsProps {
  productId: string;
}

// Helper function to get coordinates from city and country
function getCoordinates(city: string | undefined, country: string): [number, number] | null {
  // Common city coordinates mapping
  const cityCoordinates: Record<string, [number, number]> = {
    // Major cities
    'Tokyo': [139.6917, 35.6895],
    'New York': [-74.0060, 40.7128],
    'London': [-0.1276, 51.5074],
    'Paris': [2.3522, 48.8566],
    'Berlin': [13.4050, 52.5200],
    'Sydney': [151.2093, -33.8688],
    'Toronto': [-79.3832, 43.6532],
    'Los Angeles': [-118.2437, 34.0522],
    'Chicago': [-87.6298, 41.8781],
    'San Francisco': [-122.4194, 37.7749],
    'Miami': [-80.1918, 25.7617],
    'Seattle': [-122.3321, 47.6062],
    'Boston': [-71.0589, 42.3601],
    'Vancouver': [-123.1216, 49.2827],
    'Montreal': [-73.5673, 45.5017],
    'Amsterdam': [4.9041, 52.3676],
    'Madrid': [-3.7038, 40.4168],
    'Rome': [12.4964, 41.9028],
    'Milan': [9.1859, 45.4642],
    'Barcelona': [2.1734, 41.3851],
    'Munich': [11.5820, 48.1351],
    'Frankfurt': [8.6821, 50.1109],
    'Zurich': [8.5417, 47.3769],
    'Stockholm': [18.0686, 59.3293],
    'Copenhagen': [12.5683, 55.6761],
    'Oslo': [10.7522, 59.9139],
    'Dublin': [-6.2603, 53.3498],
    'Brussels': [4.3517, 50.8503],
    'Vienna': [16.3738, 48.2082],
    'Warsaw': [21.0122, 52.2297],
    'Prague': [14.4378, 50.0755],
    'Budapest': [19.0402, 47.4979],
    'Athens': [23.7275, 37.9838],
    'Lisbon': [-9.1393, 38.7223],
    'Dubai': [55.2708, 25.2048],
    'Singapore': [103.8198, 1.3521],
    'Hong Kong': [114.1694, 22.3193],
    'Shanghai': [121.4737, 31.2304],
    'Beijing': [116.4074, 39.9042],
    'Seoul': [126.9780, 37.5665],
    'Bangkok': [100.5018, 13.7563],
    'Jakarta': [106.8451, -6.2088],
    'Manila': [120.9842, 14.5995],
    'Mumbai': [72.8777, 19.0760],
    'Delhi': [77.2090, 28.6139],
    'Bangalore': [77.5946, 12.9716],
    'Melbourne': [144.9631, -37.8136],
    'Auckland': [174.7633, -36.8485],
    'São Paulo': [-46.6333, -23.5505],
    'Rio de Janeiro': [-43.1729, -22.9068],
    'Buenos Aires': [-58.3816, -34.6037],
    'Mexico City': [-99.1332, 19.4326],
    'Cairo': [31.2357, 30.0444],
    'Johannesburg': [28.0473, -26.2041],
    'Lagos': [3.3792, 6.5244],
    'Nairobi': [36.8219, -1.2921],
  };

  // Try to find by city first
  if (city) {
    const cityKey = city.split(',')[0].trim();
    if (cityCoordinates[cityKey]) {
      return cityCoordinates[cityKey];
    }
  }

  // Fallback to country capital coordinates
  const countryCapitals: Record<string, [number, number]> = {
    'United States': [-95.7129, 37.0902], // Center of US
    'Canada': [-106.3468, 56.1304], // Center of Canada
    'United Kingdom': [-2.5879, 54.7024], // Center of UK
    'Germany': [10.4515, 51.1657], // Center of Germany
    'France': [2.2137, 46.2276], // Center of France
    'Italy': [12.5674, 41.8719], // Center of Italy
    'Spain': [-3.7492, 40.4637], // Center of Spain
    'Japan': [138.2529, 36.2048], // Center of Japan
    'China': [104.1954, 35.8617], // Center of China
    'India': [78.9629, 20.5937], // Center of India
    'Australia': [133.7751, -25.2744], // Center of Australia
    'Brazil': [-51.9253, -14.2350], // Center of Brazil
    'Mexico': [-102.5528, 23.6345], // Center of Mexico
    'South Korea': [127.7669, 35.9078], // Center of South Korea
    'Singapore': [103.8198, 1.3521],
    'Thailand': [100.9925, 15.8700], // Center of Thailand
    'Indonesia': [113.9213, -0.7893], // Center of Indonesia
    'Philippines': [121.7740, 12.8797], // Center of Philippines
    'Vietnam': [108.2772, 14.0583], // Center of Vietnam
    'Malaysia': [101.9758, 4.2105], // Center of Malaysia
  };

  const countryKey = country.split(',')[0].trim();
  if (countryCapitals[countryKey]) {
    return countryCapitals[countryKey];
  }

  return null;
}

export function MarketMapWithForecasts({ productId }: MarketMapWithForecastsProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['marketForecasts', productId],
    queryFn: () => analyticsApi.getMarketForecasts(productId),
  });

  const forecasts = data?.data?.forecasts || [];

  // Helper function to get demand level
  const getDemandLevel = (demand: number): string => {
    if (demand >= 85) return "Very High";
    if (demand >= 70) return "High";
    if (demand >= 50) return "Medium";
    return "Low";
  };

  // Transform forecasts to map locations
  const marketLocations = forecasts
    .map((forecast) => {
      const coords = getCoordinates(forecast.city, forecast.country);
      if (!coords) return null;

      const marketName = forecast.city ? `${forecast.city} Market` : `${forecast.country} Market`;
      const demandLevel = getDemandLevel(forecast.demand);
      const avgPrice = forecast.avgPrice || "N/A";
      const marketSize = forecast.marketSize || `Growth: ${forecast.growth.toFixed(0)}%`;

      return {
        name: marketName,
        coordinates: coords as [number, number],
        city: forecast.city || '',
        country: forecast.country,
        type: 'market' as const,
        details: `${demandLevel} Demand | ${avgPrice} avg`,
        value: marketSize,
      };
    })
    .filter((loc): loc is NonNullable<typeof loc> => loc !== null);

  if (isLoading) {
    return (
      <div className="h-[450px] flex items-center justify-center bg-gradient-to-br from-muted/30 to-muted/10 rounded-xl border border-border/50">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading market data...</p>
        </div>
      </div>
    );
  }

  if (marketLocations.length === 0) {
    return (
      <div className="h-[450px] flex items-center justify-center bg-gradient-to-br from-muted/30 to-muted/10 rounded-xl border border-border/50">
        <div className="text-center space-y-2">
          <p className="text-muted-foreground">No market data available</p>
          <p className="text-xs text-muted-foreground">
            Market forecasts will be generated to show where you can sell your product
          </p>
        </div>
      </div>
    );
  }

  return <WorldMap locations={marketLocations} height={450} />;
}


import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from "react-simple-maps";
import { Tooltip } from "react-tooltip";
import { MapPin } from "lucide-react";

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface MapLocation {
  name: string;
  coordinates: [number, number];
  city: string;
  country: string;
  type: "supplier" | "market";
  details?: string;
  value?: string;
}

interface WorldMapProps {
  locations: MapLocation[];
  height?: number;
}

export const WorldMap = ({ locations, height = 500 }: WorldMapProps) => {
  return (
    <div className="relative w-full bg-gradient-to-br from-muted/30 to-muted/10 rounded-xl border border-border/50 overflow-hidden">
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: 147,
          center: [0, 20],
        }}
        height={height}
        className="w-full"
      >
        <ZoomableGroup center={[0, 20]} zoom={1}>
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="hsl(var(--muted))"
                  stroke="hsl(var(--border))"
                  strokeWidth={0.5}
                  style={{
                    default: { outline: "none" },
                    hover: { 
                      fill: "hsl(var(--accent))",
                      outline: "none",
                      transition: "all 0.3s ease"
                    },
                    pressed: { outline: "none" },
                  }}
                />
              ))
            }
          </Geographies>
          
          {locations.map((location, index) => (
            <Marker key={index} coordinates={location.coordinates}>
              <g
                data-tooltip-id="map-tooltip"
                data-tooltip-content={`${location.name} - ${location.city}, ${location.country}${location.details ? ` | ${location.details}` : ''}${location.value ? ` | ${location.value}` : ''}`}
                className="cursor-pointer group"
              >
                {/* Pulsing circle background */}
                <circle
                  r={8}
                  fill={location.type === "supplier" ? "hsl(var(--primary))" : "hsl(var(--success))"}
                  opacity={0.2}
                  className="animate-ping"
                />
                
                {/* Main marker */}
                <circle
                  r={6}
                  fill={location.type === "supplier" ? "hsl(var(--primary))" : "hsl(var(--success))"}
                  stroke="hsl(var(--background))"
                  strokeWidth={2}
                  className="group-hover:r-8 transition-all duration-300"
                />
                
                {/* Icon */}
                <circle
                  r={3}
                  fill="hsl(var(--background))"
                  className="pointer-events-none"
                />
              </g>
            </Marker>
          ))}
        </ZoomableGroup>
      </ComposableMap>
      
      <Tooltip
        id="map-tooltip"
        className="!bg-card !text-card-foreground !border !border-border/50 !rounded-lg !px-3 !py-2 !text-sm !shadow-lg z-50"
        style={{ 
          backgroundColor: "hsl(var(--card))",
          color: "hsl(var(--card-foreground))",
          borderColor: "hsl(var(--border))",
        }}
      />
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur border border-border/50 rounded-lg p-3 space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary"></div>
          <span className="text-xs text-muted-foreground">Suppliers</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-success"></div>
          <span className="text-xs text-muted-foreground">Markets</span>
        </div>
      </div>
      
      {/* Zoom hint */}
      <div className="absolute top-4 right-4 bg-card/90 backdrop-blur border border-border/50 rounded-lg px-3 py-2">
        <p className="text-xs text-muted-foreground">Scroll to zoom • Drag to pan</p>
      </div>
    </div>
  );
};

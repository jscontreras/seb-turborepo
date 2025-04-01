import { Suspense } from "react";
import WorldMap from "./world-map";
import GeoPanel from "./geo-panel";

export default function GeolocationPage() {
  return (
    <div className="container mx-auto py-8 px-4 relative">
      <h1 className="text-3xl font-bold mb-6">Geo Location Headers</h1>

      <div className="mb-8 flex justify-center">
        <WorldMap />
      </div>

      <Suspense
        fallback={
          <div className="text-center py-4">Loading location data...</div>
        }
      >
        <GeoPanel />
      </Suspense>
    </div>
  );
}

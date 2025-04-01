"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import { MapPin } from "lucide-react";

interface GeoLocation {
  country: string;
  city: string;
}

export default function GeoPanel() {
  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFallback, setIsFallback] = useState(false);
  const [opacity, setOpacity] = useState(0); // Start with opacity 0

  useEffect(() => {
    async function fetchGeoLocation() {
      try {
        console.log("Fetching geolocation data...");
        // First try the middleware route
        let response = await fetch("/get-geo");

        if (!response.ok) {
          console.log("Middleware route failed, trying API route");
          // If that fails, try the API route
          response = await fetch("/api/get-geo");
          setIsFallback(true);

          if (!response.ok) {
            throw new Error(
              `Failed to fetch location data: ${response.status}`,
            );
          }
        }

        const data = await response.json();
        console.log("Received geolocation data:", data);

        // Check if we got an empty object or missing data
        if (!data || Object.keys(data).length === 0) {
          console.log("Empty data received, using fallback");
          setLocation({
            country: "Country?",
            city: "City?",
          });
          setIsFallback(true);
        } else {
          setLocation(data);
        }
      } catch (err) {
        console.error("Error fetching location:", err);
        setError("Could not retrieve location information");
        // Use fallback values
        setLocation({
          country: "Default",
          city: "Location",
        });
        setIsFallback(true);
      } finally {
        setLoading(false);

        // After data is loaded, wait a moment then start the fade-in animation
        setTimeout(() => {
          setOpacity(1);
        }, 100);
      }
    }

    fetchGeoLocation();
  }, []);

  return (
    <div
      className="border rounded-lg shadow-sm p-6 bg-card max-w-xl mx-auto absolute left-0 right-0 inset-x-20 inset-y-90 h-48 transition-opacity duration-1000 ease-in-out"
      style={{ opacity: opacity }}
    >
      <div>
        <Card className="backdrop-blur-md bg-background/80 shadow-lg border-2 p-4">
          <CardHeader className="pb-2">
            <CardTitle>Geo Location Detection</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
            ) : (
              <>
                {error ? (
                  <div className="text-destructive mb-4">{error}</div>
                ) : null}

                <div className="flex items-center gap-4">
                  <MapPin className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-xl font-medium">
                      {location?.city || "Dallas"}
                    </p>
                    <p className="text-muted-foreground">
                      {location?.country || "USA"}
                    </p>
                    {isFallback && (
                      <p className="text-xs text-muted-foreground mt-2">
                        (Using fallback location - Vercel Edge Network
                        geolocation is only available in production)
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

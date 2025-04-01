import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Only run middleware on the /get-geo route
  if (request.nextUrl.pathname === "/get-geo") {
    try {
      // Access geo data directly from the request object
      const geo = request.geo

      // Log the geo data for debugging
      console.log("Geo data from request:", geo)

      // If geolocation data is not available, return default values
      if (!geo || !geo.country || !geo.city) {
        console.log("Geo data not available, using default values")
        return NextResponse.json({
          country: "USA",
          city: "Dallas",
        })
      }

      // Return the geolocation data
      return NextResponse.json({
        country: geo.country,
        city: geo.city,
      })
    } catch (error) {
      console.error("Error getting geolocation:", error)

      // Return default values if there's an error
      return NextResponse.json({
        country: "USA",
        city: "Dallas",
      })
    }
  }

  // Continue the request for other routes
  return NextResponse.next()
}

// Configure the middleware to run only on the /get-geo route
export const config = {
  matcher: "/get-geo",
}


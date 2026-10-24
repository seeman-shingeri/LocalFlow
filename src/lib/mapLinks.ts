export interface AddressComponents {
  venueName?: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
}

export interface NavigationLinks {
  fullAddressString: string;
  googleMapsUrl: string;
  googleNavigationUri: string;
  appleMapsUrl: string;
  isValid: boolean;
}

/**
 * Builds formatted addresses and deep navigation links across mobile platforms for event delivery crews.
 */
export function buildNavigationLinks(address: AddressComponents): NavigationLinks {
  const hasCoordinates =
    typeof address.latitude === 'number' &&
    typeof address.longitude === 'number' &&
    !isNaN(address.latitude) &&
    !isNaN(address.longitude);

  const hasCoreAddress = Boolean(
    address.venueName || address.streetAddress || address.city || address.postalCode
  );

  const parts = [
    address.venueName,
    address.streetAddress,
    address.city,
    address.state,
    address.postalCode,
    address.country || (hasCoreAddress ? 'India' : undefined),
  ].filter((p): p is string => typeof p === 'string' && p.trim().length > 0);

  const fullAddressString = parts.join(', ');

  if (!hasCoordinates && fullAddressString.length === 0) {
    return {
      fullAddressString: '',
      googleMapsUrl: '',
      googleNavigationUri: '',
      appleMapsUrl: '',
      isValid: false,
    };
  }

  const query = hasCoordinates
    ? `${address.latitude},${address.longitude}`
    : fullAddressString;

  const encodedQuery = encodeURIComponent(query);

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedQuery}`;
  const googleNavigationUri = `google.navigation:q=${encodedQuery}`;
  const appleMapsUrl = `https://maps.apple.com/?q=${encodedQuery}`;

  return {
    fullAddressString,
    googleMapsUrl,
    googleNavigationUri,
    appleMapsUrl,
    isValid: true,
  };
}

export type PostalCodeCoordinates = {
  latitude: number;
  longitude: number;
};

const coordinatePromiseCache = new Map<string, Promise<PostalCodeCoordinates | null>>();

export async function resolvePostalCodeCoordinates({
  city,
  postalCode,
  state,
}: {
  city?: string | null;
  postalCode: string | null | undefined;
  state?: string | null;
}) {
  const normalizedPostalCode = sanitizePostalCode(postalCode);

  if (!normalizedPostalCode) {
    return null;
  }

  const cacheKey = [
    normalizedPostalCode,
    sanitizeText(city)?.toLowerCase() ?? '',
    sanitizeText(state)?.toUpperCase() ?? '',
  ].join(':');

  const cachedPromise = coordinatePromiseCache.get(cacheKey);

  if (cachedPromise) {
    return cachedPromise;
  }

  const requestPromise = fetchPostalCodeCoordinates({
    city: sanitizeText(city),
    postalCode: normalizedPostalCode,
    state: sanitizeText(state),
  })
    .catch(() => null)
    .then((result) => result);

  coordinatePromiseCache.set(cacheKey, requestPromise);
  return requestPromise;
}

export async function resolvePostalCodeCoordinatesBatch(
  entries: Array<{
    city?: string | null;
    key: string;
    postalCode: string | null | undefined;
    state?: string | null;
  }>,
) {
  const coordinateEntries = (await Promise.all(
    entries.map(async (entry) => [
      entry.key,
      await resolvePostalCodeCoordinates({
        city: entry.city,
        postalCode: entry.postalCode,
        state: entry.state,
      }),
    ] as const),
  )) as ReadonlyArray<readonly [string, PostalCodeCoordinates | null]>;

  return new Map<string, PostalCodeCoordinates | null>(coordinateEntries);
}

export function calculateDistanceKm(
  from: PostalCodeCoordinates | null | undefined,
  to: PostalCodeCoordinates | null | undefined,
) {
  if (!from || !to) {
    return null;
  }

  const earthRadiusKm = 6371;
  const latitudeDelta = degreesToRadians(to.latitude - from.latitude);
  const longitudeDelta = degreesToRadians(to.longitude - from.longitude);
  const fromLatitude = degreesToRadians(from.latitude);
  const toLatitude = degreesToRadians(to.latitude);

  const a =
    Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2) +
    Math.cos(fromLatitude) *
      Math.cos(toLatitude) *
      Math.sin(longitudeDelta / 2) *
      Math.sin(longitudeDelta / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((earthRadiusKm * c).toFixed(1));
}

export function formatDistanceKm(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return null;
  }

  return `${value.toFixed(1).replace('.', ',')} km`;
}

function degreesToRadians(value: number) {
  return (value * Math.PI) / 180;
}

async function fetchPostalCodeCoordinates({
  city,
  postalCode,
  state,
}: {
  city: string | null;
  postalCode: string;
  state: string | null;
}) {
  const structuredResult = await fetchNominatimSearch({
    city,
    country: 'Brazil',
    postalCode,
    state,
  });

  if (structuredResult) {
    return structuredResult;
  }

  return fetchNominatimSearch({
    query: [postalCode, city, state, 'Brazil'].filter(Boolean).join(', '),
  });
}

async function fetchNominatimSearch({
  city,
  country,
  postalCode,
  query,
  state,
}: {
  city?: string | null;
  country?: string | null;
  postalCode?: string | null;
  query?: string | null;
  state?: string | null;
}) {
  const params = new URLSearchParams({
    addressdetails: '0',
    format: 'jsonv2',
    limit: '1',
  });

  if (query) {
    params.set('q', query);
  } else {
    if (postalCode) {
      params.set('postalcode', postalCode);
    }

    if (city) {
      params.set('city', city);
    }

    if (state) {
      params.set('state', state);
    }

    if (country) {
      params.set('country', country);
    }
  }

  const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
    headers: {
      'Accept-Language': 'pt-BR',
      'User-Agent': 'TocaAI/1.0',
    },
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as Array<{
    lat?: string;
    lon?: string;
  }>;

  const firstResult = data[0];
  const latitude = firstResult?.lat ? Number(firstResult.lat) : Number.NaN;
  const longitude = firstResult?.lon ? Number(firstResult.lon) : Number.NaN;

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return {
    latitude,
    longitude,
  } satisfies PostalCodeCoordinates;
}

function sanitizePostalCode(value: string | null | undefined) {
  const normalized = value?.replace(/\D+/g, '') ?? '';
  return normalized.length === 8 ? normalized : null;
}

function sanitizeText(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

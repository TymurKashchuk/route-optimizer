using RouteWise.Api.Models;

namespace RouteWise.Api.Providers.Geocoding
{
    public class StaticGeocodingProvider : IGeocodingProvider
    {
        private readonly Dictionary<string, LocationPoint> _knownAddresses = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Zhytomyr Central Square"] = new LocationPoint
            {
                Latitude = 50.25465,
                Longitude = 28.65867
            },
            ["Zhytomyr Railway Station"] = new LocationPoint
            {
                Latitude = 50.26407,
                Longitude = 28.67669
            },
            ["Zhytomyr City Hospital"] = new LocationPoint
            {
                Latitude = 50.25007,
                Longitude = 28.67011
            },
            ["майдан Соборний, Житомир"] = new LocationPoint
            {
                Latitude = 50.255318,
                Longitude = 28.659181
            },
            ["майдан Перемоги, Житомир"] = new LocationPoint
            {
                Latitude = 50.257481,
                Longitude = 28.659194
            },
            ["вулиця Покровська, Житомир"] = new LocationPoint
            {
                Latitude = 50.264250,
                Longitude = 28.666830
            },
            ["вулиця Київська, Житомир"] = new LocationPoint
            {
                Latitude = 50.255577,
                Longitude = 28.659561
            },
            ["вулиця Шевченка, Житомир"] = new LocationPoint
            {
                Latitude = 50.250500,
                Longitude = 28.675000
            },
            ["вулиця Велика Бердичівська, Житомир"] = new LocationPoint
            {
                Latitude = 50.251200,
                Longitude = 28.665000
            },
            ["вулиця Лесі Українки, Житомир"] = new LocationPoint
            {
                Latitude = 50.262000,
                Longitude = 28.662000
            },
            ["проспект Миру, Житомир"] = new LocationPoint
            {
                Latitude = 50.278000,
                Longitude = 28.632000
            },
            ["вулиця Михайлівська, Житомир"] = new LocationPoint
            {
                Latitude = 50.254800,
                Longitude = 28.662100
            },
            ["вулиця Чуднівська, Житомир"] = new LocationPoint
            {
                Latitude = 50.245000,
                Longitude = 28.641000
            },
            ["вулиця Хрещатик, Київ"] = new LocationPoint
            {
                Latitude = 50.44704,
                Longitude = 30.52220
            },
            ["майдан Незалежності, Київ"] = new LocationPoint
            {
                Latitude = 50.45010,
                Longitude = 30.52340
            },
            ["бульвар Тараса Шевченка, Київ"] = new LocationPoint
            {
                Latitude = 50.44350,
                Longitude = 30.50850
            },
            ["вулиця Володимирська, Київ"] = new LocationPoint
            {
                Latitude = 50.44850,
                Longitude = 30.51650
            },
            ["проспект Перемоги, Київ"] = new LocationPoint
            {
                Latitude = 50.45500,
                Longitude = 30.45000
            },
            ["вулиця Богдана Хмельницького, Київ"] = new LocationPoint
            {
                Latitude = 50.44600,
                Longitude = 30.51300
            },
            ["Золоті ворота, Київ"] = new LocationPoint
            {
                Latitude = 50.44585,
                Longitude = 30.51519
            },
            ["Золоті ворота, Kyiv, Ukraine"] = new LocationPoint
            {
                Latitude = 50.44585,
                Longitude = 30.51519
            },
            ["Golden Gate, Kyiv, Ukraine"] = new LocationPoint
            {
                Latitude = 50.44585,
                Longitude = 30.51519
            },
            ["площа Ринок, Львів"] = new LocationPoint
            {
                Latitude = 49.84190,
                Longitude = 24.03150
            },
            ["проспект Свободи, Львів"] = new LocationPoint
            {
                Latitude = 49.84360,
                Longitude = 24.02670
            },
            ["вулиця Івана Франка, Львів"] = new LocationPoint
            {
                Latitude = 49.83500,
                Longitude = 24.03500
            },
            ["вулиця Городоцька, Львів"] = new LocationPoint
            {
                Latitude = 49.83900,
                Longitude = 24.01500
            },
            ["вулиця Личаківська, Львів"] = new LocationPoint
            {
                Latitude = 49.84000,
                Longitude = 24.04500
            },
            ["вулиця Соборна, Вінниця"] = new LocationPoint
            {
                Latitude = 49.23300,
                Longitude = 28.46800
            },
            ["проспект Коцюбинського, Вінниця"] = new LocationPoint
            {
                Latitude = 49.23900,
                Longitude = 28.49000
            },
            ["вулиця Пирогова, Вінниця"] = new LocationPoint
            {
                Latitude = 49.22500,
                Longitude = 28.45000
            },
            ["проспект Дмитра Яворницького, Дніпро"] = new LocationPoint
            {
                Latitude = 48.46400,
                Longitude = 35.04600
            },
            ["вулиця Набережна Перемоги, Дніпро"] = new LocationPoint
            {
                Latitude = 48.44000,
                Longitude = 35.07500
            },
            ["вулиця Дерибасівська, Одеса"] = new LocationPoint
            {
                Latitude = 46.48400,
                Longitude = 30.73800
            },
            ["Приморський бульвар, Одеса"] = new LocationPoint
            {
                Latitude = 46.48800,
                Longitude = 30.74100
            },
            ["вулиця Сумська, Харків"] = new LocationPoint
            {
                Latitude = 49.99800,
                Longitude = 36.23500
            },
            ["майдан Свободи, Харків"] = new LocationPoint
            {
                Latitude = 50.00500,
                Longitude = 36.22800
            }
        };

        public LocationPoint Geocode(string address) {
            if (_knownAddresses.TryGetValue(address, out var location)) { 
                return location;
            }

            var trimmed = address.Trim();
            var partialMatch = _knownAddresses
                .FirstOrDefault(kvp => kvp.Key.Contains(trimmed, StringComparison.OrdinalIgnoreCase) ||
                                       trimmed.Contains(kvp.Key, StringComparison.OrdinalIgnoreCase));
            if (!string.IsNullOrEmpty(partialMatch.Key))
            {
                return partialMatch.Value;
            }

            var availableAddresses = string.Join(",", _knownAddresses.Keys);

            throw new InvalidOperationException($"Unknown address: {address}. Available demo addresses: {availableAddresses}");
        }

        public Task<LocationPoint> GeocodeAsync(
            string address,
            CancellationToken cancellationToken = default)
        {
            return Task.FromResult(Geocode(address));
        }

        public Task<IReadOnlyList<AddressSearchResult>> SearchAsync(
            string query,
            int limit = 5,
            string? city = null,
            CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(query))
            {
                return Task.FromResult<IReadOnlyList<AddressSearchResult>>(Array.Empty<AddressSearchResult>());
            }

            var trimmedQuery = query.Trim();
            var matches = _knownAddresses.AsEnumerable();

            if (!string.IsNullOrWhiteSpace(city))
            {
                var trimmedCity = city.Trim();
                matches = matches.Where(kvp => kvp.Key.Contains(trimmedCity, StringComparison.OrdinalIgnoreCase));
            }

            var results = matches
                .Where(kvp => kvp.Key.Contains(trimmedQuery, StringComparison.OrdinalIgnoreCase))
                .Take(limit)
                .Select(kvp => new AddressSearchResult
                {
                    Address = kvp.Key,
                    DisplayName = kvp.Key,
                    Coordinates = kvp.Value,
                    Confidence = 1.0
                })
                .ToList();

            return Task.FromResult<IReadOnlyList<AddressSearchResult>>(results);
        }

        public Task<AddressSearchResult?> ReverseGeocodeAsync(
            double latitude,
            double longitude,
            CancellationToken cancellationToken = default)
        {
            var closest = _knownAddresses
                .OrderBy(kvp => Math.Pow(kvp.Value.Latitude - latitude, 2) + Math.Pow(kvp.Value.Longitude - longitude, 2))
                .FirstOrDefault();

            if (string.IsNullOrEmpty(closest.Key))
            {
                return Task.FromResult<AddressSearchResult?>(null);
            }

            var result = new AddressSearchResult
            {
                Address = closest.Key,
                DisplayName = closest.Key,
                Coordinates = closest.Value,
                Confidence = 1.0
            };

            return Task.FromResult<AddressSearchResult?>(result);
        }
    }
}

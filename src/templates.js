/**
 * Static template data: trip types and traveler-type defaults.
 *
 * Each template item is { name, category, to, qty?, scale? } where:
 *  - `to` is the target section: 'family' (shared Family/Car section),
 *    a traveler type ('adult' | 'kid' | 'toddler' | 'baby'), or a group alias
 *    (see TARGET_GROUPS).
 *  - `scale` is an optional [perDay, extra] pair. When auto-scaling is on,
 *    quantity = ceil(days * perDay) + extra (e.g. socks = days + 1 -> [1, 1]).
 */

export const CATEGORIES = [
  'Clothing',
  'Toiletries',
  'Electronics',
  'Car kit',
  'Snacks',
  'Documents',
  'Meds',
  'Entertainment',
  'Other'
];

export const TRAVELER_TYPES = [
  { id: 'adult', label: 'Adult' },
  { id: 'kid', label: 'Kid' },
  { id: 'toddler', label: 'Toddler' },
  { id: 'baby', label: 'Baby' }
];

/** Group aliases so templates can target several traveler types at once. */
export const TARGET_GROUPS = {
  all: ['adult', 'kid', 'toddler', 'baby'],
  walkers: ['adult', 'kid', 'toddler'], // everyone except babies
  child: ['kid', 'toddler'],
  little: ['toddler', 'baby'],
  bigs: ['adult', 'kid']
};

/** Compact item constructor to keep the data tables readable. */
const i = (name, category, to = 'family', qty = 1, scale) => ({ name, category, to, qty, ...(scale ? { scale } : {}) });

/** Items every road trip benefits from; reused by both road-trip templates. */
const ROAD_BASICS = [
  i('Phone chargers', 'Electronics', 'family', 2),
  i('Car phone mount', 'Electronics'),
  i("Driver's license", 'Documents', 'adult'),
  i('Car registration & insurance card', 'Documents'),
  i('Roadside emergency kit', 'Car kit'),
  i('Paper towels', 'Car kit'),
  i('Trash bags', 'Car kit', 'family', 3),
  i('Hand sanitizer', 'Toiletries'),
  i('First-aid kit', 'Meds'),
  i('Pain reliever', 'Meds'),
  i('Water bottles', 'Snacks', 'walkers'),
  i('Road snacks', 'Snacks', 'family', 1),
  i('Underwear', 'Clothing', 'walkers', 3, [1, 1]),
  i('Socks', 'Clothing', 'walkers', 3, [1, 1]),
  i('Shirts', 'Clothing', 'walkers', 2, [1, 0]),
  i('Pants / shorts', 'Clothing', 'walkers', 2, [0.5, 1]),
  i('Pajamas', 'Clothing', 'all'),
  i('Jacket / sweater', 'Clothing', 'walkers'),
  i('Toothbrush', 'Toiletries', 'walkers'),
  i('Toothpaste', 'Toiletries'),
  i('Road trip playlist downloaded', 'Entertainment')
];

export const TRIP_TEMPLATES = [
  {
    id: 'weekend',
    label: 'Weekend road trip',
    items: [...ROAD_BASICS]
  },
  {
    id: 'week',
    label: 'Week-long road trip',
    items: [
      ...ROAD_BASICS,
      i('Laundry bag', 'Clothing'),
      i('Travel detergent pods', 'Toiletries'),
      i('Shampoo & conditioner', 'Toiletries'),
      i('Deodorant', 'Toiletries', 'adult'),
      i('Cooler', 'Car kit'),
      i('Tire pressure gauge', 'Car kit'),
      i('Jumper cables', 'Car kit'),
      i('Power bank', 'Electronics'),
      i('Headphones', 'Electronics', 'bigs'),
      i('Audiobooks / podcasts downloaded', 'Entertainment'),
      i('Prescription medications', 'Meds', 'adult'),
      i('Reusable shopping bags', 'Other', 'family', 2)
    ]
  },
  {
    id: 'beach',
    label: 'Beach',
    items: [
      i('Swimsuit', 'Clothing', 'all', 2),
      i('Beach towel', 'Other', 'walkers'),
      i('Sunglasses', 'Clothing', 'walkers'),
      i('Sun hat', 'Clothing', 'all'),
      i('Flip-flops / water shoes', 'Clothing', 'walkers'),
      i('Sunscreen', 'Toiletries', 'family', 2),
      i('After-sun / aloe', 'Toiletries'),
      i('Beach umbrella or tent', 'Car kit'),
      i('Cooler', 'Car kit'),
      i('Waterproof phone pouch', 'Electronics'),
      i('Sand toys', 'Entertainment', 'child'),
      i('Swim diapers', 'Clothing', 'baby', 4, [2, 0])
    ]
  },
  {
    id: 'camping',
    label: 'Camping',
    items: [
      i('Tent', 'Car kit'),
      i('Sleeping bag', 'Other', 'all'),
      i('Sleeping pad', 'Other', 'walkers'),
      i('Headlamp', 'Electronics', 'bigs'),
      i('Camp stove & fuel', 'Car kit'),
      i('Lighter / matches', 'Car kit'),
      i('Camp chairs', 'Car kit'),
      i('Water filter', 'Car kit'),
      i('Multi-tool', 'Car kit'),
      i('Bug spray', 'Toiletries'),
      i('Rain jacket', 'Clothing', 'walkers'),
      i('Hiking boots', 'Clothing', 'walkers'),
      i('Warm layers', 'Clothing', 'all'),
      i("S'mores supplies", 'Snacks'),
      i('Playing cards', 'Entertainment')
    ]
  },
  {
    id: 'winter',
    label: 'Winter / ski',
    items: [
      i('Ski / snow jacket', 'Clothing', 'all'),
      i('Snow pants', 'Clothing', 'walkers'),
      i('Thermal base layers', 'Clothing', 'all', 2),
      i('Wool socks', 'Clothing', 'walkers', 3, [1, 0]),
      i('Gloves / mittens', 'Clothing', 'all'),
      i('Beanie', 'Clothing', 'all'),
      i('Goggles', 'Clothing', 'bigs'),
      i('SPF lip balm', 'Toiletries'),
      i('Moisturizer', 'Toiletries'),
      i('Hand warmers', 'Other', 'family', 6, [2, 0]),
      i('Ice scraper & snow brush', 'Car kit'),
      i('Tire chains', 'Car kit'),
      i('Lift tickets / passes', 'Documents')
    ]
  },
  {
    id: 'themepark',
    label: 'Theme park',
    items: [
      i('Park tickets / app', 'Documents'),
      i('Comfortable walking shoes', 'Clothing', 'walkers'),
      i('Rain poncho', 'Clothing', 'walkers'),
      i('Refillable water bottle', 'Snacks', 'walkers'),
      i('Sunscreen', 'Toiletries'),
      i('Power bank', 'Electronics'),
      i('Zip-top bags', 'Other', 'family', 5),
      i('Cooling towel', 'Other', 'bigs'),
      i('Stroller', 'Car kit', 'little'),
      i('Autograph book & pen', 'Entertainment', 'kid')
    ]
  },
  {
    id: 'family',
    label: 'Visiting family',
    items: [
      i('Host gift', 'Other'),
      i('Gifts for family', 'Other'),
      i('Nice outfit', 'Clothing', 'all'),
      i('Slippers', 'Clothing', 'walkers'),
      i('Earplugs', 'Toiletries', 'adult'),
      i('Board game', 'Entertainment'),
      i('Photos to share', 'Entertainment'),
      i('Portable crib', 'Other', 'baby')
    ]
  }
];

/** Defaults every traveler of a given type gets, regardless of trip template. */
export const TYPE_DEFAULTS = {
  adult: [
    i('Wallet', 'Documents', 'adult'),
    i('Phone', 'Electronics', 'adult'),
    i('Glasses / contacts', 'Toiletries', 'adult'),
    i('Personal medications', 'Meds', 'adult')
  ],
  kid: [
    i('Car games', 'Entertainment', 'kid'),
    i('Books', 'Entertainment', 'kid', 2),
    i('Tablet & headphones', 'Electronics', 'kid'),
    i('Travel pillow', 'Other', 'kid'),
    i('Stuffed animal', 'Entertainment', 'kid'),
    i('Activity book & crayons', 'Entertainment', 'kid')
  ],
  toddler: [
    i('Diapers / pull-ups', 'Toiletries', 'toddler', 10, [5, 4]),
    i('Wipes', 'Toiletries', 'toddler', 2),
    i('Sippy cup', 'Snacks', 'toddler'),
    i('Snack cup', 'Snacks', 'toddler'),
    i('Spare outfits', 'Clothing', 'toddler', 3, [1, 1]),
    i('Car seat', 'Car kit', 'toddler'),
    i('Potty seat', 'Toiletries', 'toddler'),
    i('Favorite toy', 'Entertainment', 'toddler'),
    i('Children\'s fever reducer', 'Meds', 'toddler')
  ],
  baby: [
    i('Diapers', 'Toiletries', 'baby', 20, [8, 4]),
    i('Wipes', 'Toiletries', 'baby', 3),
    i('Diaper cream', 'Toiletries', 'baby'),
    i('Changing pad', 'Toiletries', 'baby'),
    i('Bottles', 'Snacks', 'baby', 4),
    i('Formula / milk', 'Snacks', 'baby'),
    i('Burp cloths', 'Clothing', 'baby', 3),
    i('Onesies', 'Clothing', 'baby', 5, [2, 1]),
    i('Sleep sack', 'Clothing', 'baby'),
    i('Pacifiers', 'Other', 'baby', 2),
    i('Infant car seat', 'Car kit', 'baby'),
    i('Baby carrier', 'Other', 'baby'),
    i('Infant fever reducer', 'Meds', 'baby')
  ]
};

export const templateById = (id) => TRIP_TEMPLATES.find((t) => t.id === id);
export const typeLabel = (id) => TRAVELER_TYPES.find((t) => t.id === id)?.label ?? id;

const MAX_QUERY_PARTS = 12;

const CATEGORY_OPTIONS = {
  'samsung-mobile': [
    {key: 'samsung-chargers-cables', label: 'Samsung Chargers & Cables'},
    {key: 'samsung-charging-stations', label: 'Samsung Charging Stations'},
    {key: 'samsung-phone-covers', label: 'Samsung Phone Covers'},
    {key: 'samsung-phone-stands', label: 'Samsung Phone Stands'},
    {key: 'samsung-phone-holders', label: 'Samsung Phone Holders'},
    {
      key: 'samsung-screen-camera-protectors',
      label: 'Samsung Screen & Camera Protectors',
    },
    {key: 'samsung-smarttag', label: 'Samsung SmartTag'},
  ],
  'apple-mobile': [
    {key: 'iphone-covers', label: 'iPhone Covers'},
    {key: 'iphone-chargers', label: 'iPhone Chargers'},
    {key: 'iphone-charging-stations', label: 'iPhone Charging Stations'},
    {
      key: 'iphone-screen-camera-protectors',
      label: 'iPhone Screen & Camera Protectors',
    },
    {key: 'iphone-holders', label: 'iPhone Holders'},
  ],
  'gaming-laptop': [
    {key: 'gaming-mice', label: 'Gaming Mice'},
    {key: 'gaming-keyboards', label: 'Gaming Keyboards'},
    {key: 'gaming-headphones', label: 'Gaming Headphones'},
    {key: 'mousepads', label: 'Mousepads'},
    {key: 'gaming-speakers', label: 'Gaming Speakers'},
    {key: 'backpacks', label: 'Backpacks'},
  ],
  laptop: [
    {key: 'backpacks', label: 'Backpacks'},
    {key: 'sleeves', label: 'Sleeves'},
    {key: 'adapters-hubs', label: 'Adapters & Hubs'},
    {key: 'mouse', label: 'Mouse'},
    {key: 'keyboards', label: 'Keyboards'},
    {key: 'mousepads', label: 'Mousepads'},
    {key: 'external-storage', label: 'External Storage'},
  ],
  mobile: [
    {key: 'covers', label: 'Covers'},
    {key: 'chargers', label: 'Chargers'},
    {key: 'charging-stations', label: 'Charging Stations'},
    {key: 'phone-holders', label: 'Phone Holders'},
    {key: 'screen-protectors', label: 'Screen Protectors'},
  ],
};

const CATEGORY_QUERY_TERMS = {
  'gaming-mice': ['gaming mouse', 'gaming mice'],
  'gaming-keyboards': ['gaming keyboard', 'gaming keyboards'],
  'gaming-headphones': [
    'gaming headphones',
    'gaming headset',
    'gaming headsets',
    'headphones',
    'headset',
  ],
  mousepads: ['mousepad', 'mouse pad'],
  'gaming-speakers': ['gaming speaker', 'gaming speakers', 'speaker', 'speakers'],
  backpacks: ['backpack', 'laptop backpack'],
  sleeves: ['laptop sleeve', 'sleeve'],
  'adapters-hubs': ['hub', 'adapter', 'adaptor', 'dock', 'docking station'],
  mouse: ['mouse'],
  keyboards: ['keyboard', 'keyboards'],
  'external-storage': [
    'external storage',
    'external ssd',
    'external hard drive',
    'portable ssd',
    'portable hard drive',
  ],
  covers: ['cover', 'covers', 'case', 'cases'],
  chargers: ['charger', 'wall charger', 'fast charger', 'power adapter'],
  'charging-stations': [
    'charging station',
    'wireless charger',
    'magsafe charger',
    'magsafe stand',
  ],
  'phone-holders': ['phone holder', 'phone stand', 'car mount', 'phone mount'],
  'screen-protectors': [
    'screen protector',
    'tempered glass',
    'privacy glass',
    'glass protector',
  ],
};

export function normalizeComplementaryText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getProductText(product) {
  return normalizeComplementaryText(
    [
      product?.title,
      product?.productType,
      product?.vendor,
      ...(product?.tags || []),
    ]
      .filter(Boolean)
      .join(' '),
  );
}

function getTitleText(product) {
  return normalizeComplementaryText(product?.title);
}

function hasTag(product, matcher) {
  return (product?.tags || [])
    .map(normalizeComplementaryText)
    .some(matcher);
}

export function isAppleMobilePhone(product) {
  return (
    normalizeComplementaryText(product?.vendor) === 'apple' &&
    normalizeComplementaryText(product?.productType) === 'mobile phones'
  );
}

export function isSamsungMobilePhone(product) {
  return (
    normalizeComplementaryText(product?.vendor) === 'samsung' &&
    normalizeComplementaryText(product?.productType) === 'mobile phones'
  );
}

export function getComplementarySourceMode(product) {
  const text = getProductText(product);

  if (isSamsungMobilePhone(product)) return 'samsung-mobile';
  if (isAppleMobilePhone(product)) return 'apple-mobile';
  if (hasTag(product, (tag) => tag === 'mobile phones')) return 'mobile';
  if (hasTag(product, (tag) => tag.includes('gaming laptop'))) {
    return 'gaming-laptop';
  }
  if (text.includes('gaming laptop')) return 'gaming-laptop';
  if (hasTag(product, (tag) => tag.includes('laptop'))) return 'laptop';
  if (text.includes('laptop') || text.includes('macbook')) return 'laptop';

  return '';
}

function normalizeIphoneVariant(value) {
  const variant = normalizeComplementaryText(value);
  if (variant === 'pm' || variant === 'promax' || variant === 'pro max') {
    return 'pro max';
  }

  return variant;
}

function extractIphoneModels(value) {
  const models = [];
  const text = String(value || '');
  const pattern =
    /\biphone\s*(\d{1,2}|se)\s*(pro\s*max|promax|pm|pro|max|plus|mini|air)?\b/gi;
  let match;

  while ((match = pattern.exec(text))) {
    const generation = normalizeComplementaryText(match[1]);
    const variant = normalizeIphoneVariant(match[2]);
    models.push({
      generation,
      variant,
      phrase: normalizeComplementaryText(
        ['iphone', generation, variant].filter(Boolean).join(' '),
      ),
    });
  }

  return models;
}

export function extractIphoneModel(product) {
  const values = [product?.title, ...(product?.tags || [])];

  for (const value of values) {
    const [model] = extractIphoneModels(value);
    if (model) return model;
  }

  return null;
}

export function productMatchesIphoneCoverModel(candidate, sourceProduct) {
  const sourceModel = extractIphoneModel(sourceProduct);
  if (!sourceModel) return false;

  const candidateValues = [candidate?.title, ...(candidate?.tags || [])];
  const candidateModels = candidateValues.flatMap(extractIphoneModels);

  if (
    candidateModels.some(
      (model) =>
        model.generation === sourceModel.generation &&
        model.variant === sourceModel.variant,
    )
  ) {
    return true;
  }

  const candidateText = normalizeComplementaryText(candidateValues.join(' '));
  const hasSourcePhrase = candidateText.includes(sourceModel.phrase);
  const hasIphoneFamily = candidateText.includes('iphone');
  const hasGeneration = candidateText.includes(sourceModel.generation);
  const hasVariant = sourceModel.variant
    ? candidateText.includes(sourceModel.variant)
    : !containsAny(candidateText, ['pro max', 'promax', 'pro', 'max', 'plus', 'mini']);

  return hasSourcePhrase || (hasIphoneFamily && hasGeneration && hasVariant);
}

function normalizeSamsungVariant(value) {
  const variant = normalizeComplementaryText(value);
  if (variant === '+') return 'plus';
  if (variant === '5g') return '';

  return variant;
}

function extractSamsungModels(value) {
  const models = [];
  const text = String(value || '');
  const pattern =
    /\b(?:samsung\s*)?galaxy\s+(s\d{1,2}|a\d{1,2}|note\s*\d{1,2}|z\s*(?:fold|flip)\s*\d{1,2})(?:\s*(ultra|plus|\+|fe|5g))?\b/gi;
  let match;

  while ((match = pattern.exec(text))) {
    const model = normalizeComplementaryText(match[1]);
    const variant = normalizeSamsungVariant(match[2]);
    models.push({
      model,
      variant,
      phrase: normalizeComplementaryText(
        ['galaxy', model, variant].filter(Boolean).join(' '),
      ),
    });
  }

  return models;
}

export function extractSamsungModel(product) {
  const values = [product?.title, ...(product?.tags || [])];

  for (const value of values) {
    const [model] = extractSamsungModels(value);
    if (model) return model;
  }

  return null;
}

export function productMatchesSamsungPhoneModel(candidate, sourceProduct) {
  const sourceModel = extractSamsungModel(sourceProduct);
  if (!sourceModel) return false;

  const candidateValues = [candidate?.title, ...(candidate?.tags || [])];
  const candidateModels = candidateValues.flatMap(extractSamsungModels);

  if (
    candidateModels.some(
      (model) =>
        model.model === sourceModel.model &&
        model.variant === sourceModel.variant,
    )
  ) {
    return true;
  }

  const candidateText = normalizeComplementaryText(candidateValues.join(' '));
  const hasGalaxyFamily =
    candidateText.includes('samsung') || candidateText.includes('galaxy');
  const hasModel = candidateText.includes(sourceModel.model);
  const hasVariant = sourceModel.variant
    ? candidateText.includes(sourceModel.variant)
    : !containsAny(candidateText, ['ultra', 'plus', 'fe']);

  return hasGalaxyFamily && hasModel && hasVariant;
}

export function getComplementaryCategoryOptions(product) {
  return CATEGORY_OPTIONS[getComplementarySourceMode(product)] || [];
}

export function isValidComplementaryCategory(product, categoryKey) {
  return getComplementaryCategoryOptions(product).some(
    (category) => category.key === categoryKey,
  );
}

function escapeSearchValue(value) {
  return String(value || '')
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"');
}

function quotedPhrase(value) {
  const normalized = normalizeComplementaryText(value);
  if (!normalized) return '';
  return `"${escapeSearchValue(normalized)}"`;
}

function quotedField(field, value) {
  const normalized = normalizeComplementaryText(value);
  if (!normalized) return '';
  return `${field}:"${escapeSearchValue(normalized)}"`;
}

function uniq(values) {
  const seen = new Set();
  const out = [];

  for (const value of values) {
    const normalized = normalizeComplementaryText(value);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    out.push(value);
  }

  return out;
}

function extractMobileModel(product) {
  const values = [product?.title, ...(product?.tags || [])];
  const patterns = [
    /\biphone\s+(?:1[1-9]|[2-9][0-9]?|se)(?:\s+(?:pro\s+max|pro|max|plus|mini|air|pm|promax))?\b/i,
    /\bgalaxy\s+s\d{1,2}(?:\s+(?:ultra|plus|fe))?\b/i,
    /\bgalaxy\s+z\s+(?:fold|flip)\s*\d{1,2}\b/i,
    /\bgalaxy\s+a\d{1,2}\b/i,
  ];

  for (const value of values) {
    const text = String(value || '');
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match?.[0]) return normalizeComplementaryText(match[0]);
    }
  }

  return '';
}

function getMobileFamily(product) {
  const text = getProductText(product);
  if (text.includes('iphone')) return 'iphone';
  if (text.includes('galaxy') || text.includes('samsung')) return 'samsung';
  return '';
}

export function buildComplementaryCategoryQueries(product, categoryKey) {
  if (!isValidComplementaryCategory(product, categoryKey)) return [];

  const mode = getComplementarySourceMode(product);
  const terms = CATEGORY_QUERY_TERMS[categoryKey] || [];
  const model = mode === 'mobile' ? extractMobileModel(product) : '';
  const family = mode === 'mobile' ? getMobileFamily(product) : '';
  const exactParts = [];
  const broadParts = [];

  if (model) {
    for (const term of terms) {
      exactParts.push(quotedPhrase(`${model} ${term}`));
      exactParts.push(quotedField('tag', `${model} ${term}`));
    }
  }

  if (family) {
    for (const term of terms.slice(0, 4)) {
      broadParts.push(quotedPhrase(`${family} ${term}`));
      broadParts.push(quotedField('tag', `${family} accessories`));
    }
  }

  for (const term of terms) {
    broadParts.push(quotedPhrase(term));
    broadParts.push(quotedField('tag', term));
  }

  if (mode === 'mobile') {
    broadParts.push(quotedField('tag', 'mobile accessories'));
  }

  if (['gaming-laptop', 'laptop'].includes(mode)) {
    broadParts.push(quotedField('tag', 'computer accessories'));
  }

  return uniq([
    uniq(exactParts).slice(0, MAX_QUERY_PARTS).join(' OR '),
    uniq(broadParts).slice(0, MAX_QUERY_PARTS).join(' OR '),
  ]).filter(Boolean);
}

function isAppleProduct(product) {
  const text = getProductText(product);
  return (
    text.includes('apple') ||
    text.includes('macbook') ||
    text.includes('imac') ||
    text.includes('magic mouse') ||
    text.includes('magic keyboard') ||
    text.includes('magic trackpad')
  );
}

function containsAny(text, terms) {
  return terms.some((term) => text.includes(term));
}

function matchesMobileCompatibility(candidate, sourceProduct, strictModel) {
  const candidateText = getProductText(candidate);
  const model = extractMobileModel(sourceProduct);
  const family = getMobileFamily(sourceProduct);

  if (model && candidateText.includes(model)) return true;
  if (strictModel && model) return false;
  if (family && candidateText.includes(family)) return true;

  if (!strictModel) {
    if (
      containsAny(candidateText, [
        'laptop',
        'macbook',
        'notebook',
        'computer charger',
      ])
    ) {
      return false;
    }

    return containsAny(candidateText, [
      'mobile accessories',
      'phone',
      'smartphone',
      'magsafe',
      'wireless charger',
      'usb c',
      'wall charger',
      'fast charger',
      'power adapter',
    ]);
  }

  return (
    candidateText.includes('mobile accessories') ||
    candidateText.includes('phone')
  );
}

export function productMatchesComplementaryCategory(
  candidate,
  sourceProduct,
  categoryKey,
) {
  if (!isValidComplementaryCategory(sourceProduct, categoryKey)) return false;
  if (!candidate?.id || candidate.id === sourceProduct?.id) return false;

  const mode = getComplementarySourceMode(sourceProduct);
  const text = getProductText(candidate);
  const title = getTitleText(candidate);

  if (mode === 'gaming-laptop') {
    if (isAppleProduct(candidate)) return false;

    switch (categoryKey) {
      case 'gaming-mice':
        return text.includes('gaming') && text.includes('mouse');
      case 'gaming-keyboards':
        return text.includes('gaming') && text.includes('keyboard');
      case 'gaming-headphones':
        return (
          containsAny(text, ['gaming', 'computer accessories']) &&
          containsAny(text, ['headphone', 'headset'])
        );
      case 'mousepads':
        return text.includes('mousepad') || text.includes('mouse pad');
      case 'gaming-speakers':
        return (
          containsAny(text, ['gaming', 'computer accessories']) &&
          text.includes('speaker')
        );
      case 'backpacks':
        return text.includes('backpack');
      default:
        return false;
    }
  }

  if (mode === 'laptop') {
    if (isAppleProduct(candidate)) return false;

    switch (categoryKey) {
      case 'backpacks':
        return text.includes('backpack');
      case 'sleeves':
        return text.includes('sleeve');
      case 'adapters-hubs':
        return containsAny(text, ['hub', 'adapter', 'adaptor', 'dock']);
      case 'mouse':
        return text.includes('mouse') && !text.includes('mousepad');
      case 'keyboards':
        return text.includes('keyboard');
      case 'mousepads':
        return (
          (text.includes('mousepad') || text.includes('mouse pad')) &&
          !title.includes('gaming')
        );
      case 'external-storage':
        return containsAny(text, [
          'external storage',
          'external ssd',
          'external hard drive',
          'portable ssd',
          'portable hard drive',
        ]);
      default:
        return false;
    }
  }

  if (mode === 'mobile') {
    switch (categoryKey) {
      case 'covers':
        return (
          containsAny(text, ['cover', 'covers', 'case', 'cases']) &&
          matchesMobileCompatibility(candidate, sourceProduct, true)
        );
      case 'chargers':
        return (
          containsAny(text, ['charger', 'wall charger', 'fast charger']) &&
          matchesMobileCompatibility(candidate, sourceProduct, false)
        );
      case 'charging-stations':
        return (
          containsAny(text, [
            'charging station',
            'wireless charger',
            'magsafe charger',
            'magsafe stand',
          ]) && matchesMobileCompatibility(candidate, sourceProduct, false)
        );
      case 'phone-holders':
        return (
          containsAny(text, [
            'phone holder',
            'phone stand',
            'car mount',
            'phone mount',
          ]) && matchesMobileCompatibility(candidate, sourceProduct, false)
        );
      case 'screen-protectors':
        return (
          containsAny(text, [
            'screen protector',
            'tempered glass',
            'privacy glass',
            'glass protector',
          ]) && matchesMobileCompatibility(candidate, sourceProduct, true)
        );
      default:
        return false;
    }
  }

  return false;
}

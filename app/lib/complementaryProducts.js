const MAX_QUERY_PARTS = 16;
const DEFAULT_OPENAI_MODEL = 'gpt-5.4-nano-2026-03-17';
const AI_PLAN_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const aiSearchPlanCache = new Map();

const STOP_WORDS = new Set([
  'and',
  'apple',
  'black',
  'blue',
  'for',
  'gb',
  'green',
  'inch',
  'new',
  'of',
  'pink',
  'red',
  'silver',
  'the',
  'to',
  'white',
  'with',
]);

const IGNORED_TAGS = new Set([
  'as',
  'new',
  'new arrivals',
  'r1',
  'sale',
  'sd',
  'best seller',
  'featured',
  'temp',
  'preorder',
  'pre order',
]);

const ACCESSORY_TERMS = [
  'accessories',
  'accessory',
  'adapter',
  'bag',
  'cable',
  'case',
  'charger',
  'controller',
  'cover',
  'glass',
  'headset',
  'hub',
  'keyboard',
  'lens',
  'mount',
  'mouse',
  'power bank',
  'protector',
  'screen protector',
  'sleeve',
  'stand',
  'tempered',
  'tripod',
];

const MODEL_SENSITIVE_TERMS = [
  'case',
  'cover',
  'glass',
  'lens protector',
  'privacy glass',
  'protector',
  'screen protector',
  'tempered',
];

const DEVICE_FAMILIES = [
  {
    key: 'iphone',
    aliases: ['iphone'],
    accessoryTag: 'iphone accessories',
    modelPattern:
      /\biphone\s+(?:1[1-9]|[2-9][0-9]?|se)(?:\s+(?:pro\s+max|pro|max|plus|mini|air|pm|promax))?\b/,
  },
  {
    key: 'ipad',
    aliases: ['ipad'],
    accessoryTag: 'ipad accessories',
    modelPattern:
      /\bipad(?:\s+(?:pro|air|mini))?(?:\s+(?:1[0-9]|[2-9])(?:th|st|nd|rd)?\s*gen(?:eration)?)?\b/,
  },
  {
    key: 'macbook',
    aliases: ['macbook'],
    accessoryTag: 'macbook accessories',
    modelPattern: /\bmacbook(?:\s+(?:air|pro))?(?:\s+\d{2})?\b/,
  },
  {
    key: 'laptop',
    aliases: ['laptop', 'notebook'],
    accessoryTag: 'laptop accessories',
  },
  {
    key: 'ps5',
    aliases: ['ps5', 'playstation 5'],
    accessoryTag: 'ps5 accessories',
  },
  {
    key: 'nintendo switch',
    aliases: ['nintendo switch', 'switch'],
    accessoryTag: 'nintendo switch accessories',
  },
  {
    key: 'camera',
    aliases: ['camera', 'photography'],
    accessoryTag: 'camera accessories',
  },
  {
    key: 'monitor',
    aliases: ['monitor'],
    accessoryTag: 'monitor accessories',
  },
];

const MIN_COMPATIBILITY_SCORE = 35;

const CATEGORY_PROFILES = [
  {
    key: 'computer',
    sourceTerms: [
      'laptop',
      'laptops',
      'desktop',
      'desktops',
      'gaming laptop',
      'gaming laptops',
      'gaming desktop',
      'gaming desktops',
      'macbook',
      'notebook',
      'computer',
      'workstation',
    ],
    accessoryTags: [
      'computer accessories',
      'laptop accessories',
      'backpacks',
      'bags',
    ],
    queryTerms: [
      'gaming mouse',
      'gaming keyboard',
      'gaming speaker',
      'gaming microphone',
      'gaming mic',
      'mouse',
      'keyboard',
      'hub',
      'usb hub',
      'hubs adapters',
      'mousepad',
      'mouse pad',
      'cable',
      'adapter',
      'backpack',
      'laptop bag',
      'laptop sleeve',
      'laptop stand',
      'laptop cooler',
      'docking station',
      'magic mouse',
      'magic trackpad',
      'magic keyboard',
      'apple adapter',
    ],
    candidateTerms: [
      'mouse',
      'keyboard',
      'gaming mouse',
      'gaming keyboard',
      'gaming speaker',
      'gaming microphone',
      'gaming mic',
      'hub',
      'hubs adapters',
      'mousepad',
      'mouse pad',
      'cable',
      'adapter',
      'backpack',
      'bag',
      'sleeve',
      'stand',
      'cooler',
      'laptop cooler',
      'dock',
      'docking station',
      'magic mouse',
      'magic trackpad',
      'magic keyboard',
    ],
  },
  {
    key: 'mobile',
    sourceTerms: [
      'mobile phone',
      'mobile phones',
      'phone',
      'phones',
      'smartphone',
      'smartphones',
      'iphone',
      'samsung mobile',
    ],
    accessoryTags: [
      'mobile accessories',
      'adapters',
      'charging cables',
    ],
    queryTerms: [
      'mobile accessories',
      'adapters',
      'charging cables',
      'covers',
      'charging cable',
      'adapter',
      'cover',
    ],
    candidateTerms: [
      'mobile accessories',
      'adapters',
      'charging cables',
      'covers',
      'cover',
      'charging cable',
      'cable',
      'adapter',
    ],
  },
  {
    key: 'tablet',
    sourceTerms: ['tablet', 'tablets', 'ipad'],
    accessoryTags: ['tablet accessories', 'ipad accessories'],
    queryTerms: ['case', 'cover', 'keyboard', 'stylus', 'pencil', 'charger'],
    candidateTerms: ['case', 'cover', 'keyboard', 'stylus', 'pencil', 'charger'],
  },
  {
    key: 'gaming',
    sourceTerms: ['gaming console', 'console', 'ps5', 'playstation', 'xbox', 'nintendo switch'],
    accessoryTags: ['gaming accessories', 'ps5 accessories', 'xbox accessories', 'nintendo switch accessories'],
    queryTerms: ['controller', 'headset', 'charger', 'charging station', 'cable', 'stand'],
    candidateTerms: ['controller', 'headset', 'charger', 'charging station', 'cable', 'stand'],
  },
  {
    key: 'camera',
    sourceTerms: ['camera', 'cameras', 'photography'],
    accessoryTags: ['camera accessories', 'photography accessories'],
    queryTerms: ['tripod', 'lens', 'mount', 'bag', 'memory card', 'sd card', 'cable'],
    candidateTerms: ['tripod', 'lens', 'mount', 'bag', 'memory card', 'sd card', 'cable'],
  },
  {
    key: 'audio',
    sourceTerms: ['headphone', 'headphones', 'headset', 'speaker', 'microphone', 'audio'],
    accessoryTags: ['audio accessories'],
    queryTerms: ['cable', 'adapter', 'stand', 'mount', 'case', 'charger'],
    candidateTerms: ['cable', 'adapter', 'stand', 'mount', 'case', 'charger'],
  },
  {
    key: 'monitor',
    sourceTerms: ['monitor', 'monitors', 'display'],
    accessoryTags: ['monitor accessories', 'computer accessories'],
    queryTerms: ['hdmi cable', 'displayport cable', 'stand', 'mount', 'adapter', 'hub'],
    candidateTerms: ['hdmi', 'displayport', 'stand', 'mount', 'adapter', 'hub', 'cable'],
  },
  {
    key: 'watch',
    sourceTerms: ['smart watch', 'smartwatch', 'fitness watch', 'apple watch', 'garmin watch'],
    accessoryTags: ['watch accessories', 'apple watch accessories'],
    queryTerms: ['strap', 'band', 'charger', 'cable', 'protector'],
    candidateTerms: ['strap', 'band', 'charger', 'cable', 'protector'],
  },
  {
    key: 'networking',
    sourceTerms: ['router', 'networking', 'switch', 'access point', 'range extender', 'mesh'],
    accessoryTags: ['networking accessories'],
    queryTerms: ['ethernet cable', 'lan cable', 'patch cable', 'adapter', 'poe injector'],
    candidateTerms: ['ethernet', 'lan cable', 'patch cable', 'adapter', 'poe'],
  },
];

function getProductMode(product) {
  const text = getProductSearchText(product);

  if (text.includes('macbook') || text.includes('imac')) {
    return 'apple-computer';
  }
  if (text.includes('gaming laptop')) return 'gaming-laptop';
  if (text.includes('laptop')) return 'laptop';

  return '';
}

export function normalizeSearchText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeSearchValue(value) {
  return String(value || '')
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"');
}

function quotedField(field, value) {
  const normalized = normalizeSearchText(value);
  if (!normalized) return '';
  return `${field}:"${escapeSearchValue(normalized)}"`;
}

function quotedPhrase(value) {
  const normalized = normalizeSearchText(value);
  if (!normalized) return '';
  return `"${escapeSearchValue(normalized)}"`;
}

function uniq(values) {
  const seen = new Set();
  const out = [];

  for (const value of values) {
    const normalized = normalizeSearchText(value);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    out.push(normalized);
  }

  return out;
}

function uniqRaw(values) {
  const seen = new Set();
  const out = [];

  for (const value of values) {
    if (!value || seen.has(value)) continue;
    seen.add(value);
    out.push(value);
  }

  return out;
}

function normalizeSecret(raw) {
  if (raw == null) return '';
  if (typeof raw === 'object' && 'value' in raw) {
    return normalizeSecret(raw.value);
  }

  const trimmed = String(raw).trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }

  return trimmed;
}

function extractOutputText(openaiJson) {
  if (typeof openaiJson?.output_text === 'string' && openaiJson.output_text) {
    return openaiJson.output_text.trim();
  }

  const out = openaiJson?.output;
  if (!Array.isArray(out)) return '';

  let text = '';
  for (const item of out) {
    const content = item?.content;
    if (!Array.isArray(content)) continue;

    for (const block of content) {
      if (block?.type === 'output_text' && typeof block?.text === 'string') {
        text += block.text;
      } else if (block?.type === 'text' && typeof block?.text === 'string') {
        text += block.text;
      }
    }
  }

  return text.trim();
}

function parseJsonObject(text) {
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;

    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

function sanitizeShopifyQuery(query) {
  return String(query || '')
    .replace(/\s+/g, ' ')
    .replace(/[{}[\]]/g, '')
    .trim()
    .slice(0, 700);
}

function normalizeTermList(values, maxItems = 20) {
  if (!Array.isArray(values)) return [];

  return uniq(
    values
      .map((value) => normalizeSearchText(value))
      .filter((value) => value.length >= 2),
  ).slice(0, maxItems);
}

function getCacheKey(product) {
  return [
    product?.handle,
    product?.title,
    product?.vendor,
    product?.productType,
    ...(product?.tags || []),
  ]
    .map(normalizeSearchText)
    .filter(Boolean)
    .join('|');
}

function getUsefulTags(product) {
  return (product?.tags || [])
    .map(normalizeSearchText)
    .filter(Boolean)
    .filter((tag) => !IGNORED_TAGS.has(tag));
}

function getTitleTokens(product) {
  return normalizeSearchText(product?.title)
    .split(' ')
    .filter((token) => token.length >= 2)
    .filter((token) => !STOP_WORDS.has(token));
}

function getProductSearchText(product) {
  return normalizeSearchText(
    [
      product?.title,
      product?.vendor,
      product?.productType,
      ...(product?.tags || []),
    ]
      .filter(Boolean)
      .join(' '),
  );
}

function getFamily(product) {
  const searchText = getProductSearchText(product);
  return DEVICE_FAMILIES.find((family) =>
    family.aliases.some((alias) => searchText.includes(alias)),
  );
}

function textIncludesAny(searchText, terms) {
  return terms.some((term) => searchText.includes(normalizeSearchText(term)));
}

function getCategoryProfile(product) {
  const searchText = getProductSearchText(product);
  return CATEGORY_PROFILES.find((profile) =>
    textIncludesAny(searchText, profile.sourceTerms),
  );
}

function getModelPhrase(product, family) {
  const searchValues = [product?.title, ...(product?.tags || [])];

  if (family?.modelPattern) {
    for (const value of searchValues) {
      const match = normalizeSearchText(value).match(family.modelPattern);
      if (match?.[0]) return normalizeSearchText(match[0]);
    }
  }

  const titleTokens = getTitleTokens(product);
  const familyIndex = titleTokens.findIndex((token) =>
    family?.aliases.some(
      (alias) => normalizeSearchText(alias).split(' ')[0] === token,
    ),
  );

  if (familyIndex >= 0) {
    return titleTokens.slice(familyIndex, familyIndex + 4).join(' ');
  }

  return titleTokens.slice(0, 4).join(' ');
}

function hasAccessorySignal(product) {
  const searchText = getProductSearchText(product);
  return ACCESSORY_TERMS.some((term) => searchText.includes(term));
}

function isModelSensitive(product) {
  const searchText = getProductSearchText(product);
  return MODEL_SENSITIVE_TERMS.some((term) => searchText.includes(term));
}

function extractFamilyModels(product, family) {
  if (!family?.modelPattern) return [];
  const searchText = getProductSearchText(product);
  const globalPattern = new RegExp(family.modelPattern.source, 'g');
  return Array.from(searchText.matchAll(globalPattern), (match) =>
    normalizeSearchText(match[0]),
  );
}

function getSourceProfile(product) {
  const family = getFamily(product);
  const modelPhrase = getModelPhrase(product, family);

  return {
    family,
    modelPhrase,
    mode: getProductMode(product),
    category: getCategoryProfile(product),
    usefulTags: getUsefulTags(product),
    titleTokens: getTitleTokens(product),
  };
}

export function buildNativeComplementaryQuery(product) {
  return buildNativeComplementaryQueries(product)[0] || '';
}

function createFallbackSearchPlan(product) {
  const profile = getSourceProfile(product);
  const sourceProductRole = hasAccessorySignal(product) ? 'accessory' : 'main';
  const queries =
    sourceProductRole === 'accessory'
      ? buildMainProductQueriesForAccessory(profile)
      : buildNativeComplementaryQueries(product);

  return {
    source: 'rules',
    sourceProductRole,
    category: profile.category?.key || profile.family?.key || 'other',
    queries,
    mustInclude: normalizeTermList([
      ...(profile.category?.candidateTerms || []),
      ...(profile.family?.aliases || []),
      profile.modelPhrase,
    ]),
    avoid: [],
  };
}

function buildMainProductQueriesForAccessory(profile) {
  const queryStages = [];

  if (profile.modelPhrase) {
    queryStages.push(
      uniqRaw([
        quotedField('title', profile.modelPhrase),
        quotedPhrase(profile.modelPhrase),
        ...profile.usefulTags
          .filter((tag) => profile.modelPhrase.includes(tag) || tag.includes(profile.modelPhrase))
          .map((tag) => quotedField('tag', tag)),
      ])
        .slice(0, MAX_QUERY_PARTS)
        .join(' OR '),
    );
  }

  if (profile.category?.key === 'mobile') {
    queryStages.push(
      uniqRaw([
        quotedField('product_type', 'mobile phones'),
        quotedField('product_type', 'phones'),
        quotedPhrase('mobile phone'),
        quotedPhrase('smartphone'),
        ...(profile.family?.aliases || []).map((alias) => quotedPhrase(alias)),
      ])
        .slice(0, MAX_QUERY_PARTS)
        .join(' OR '),
    );
  } else if (profile.category?.key === 'computer') {
    queryStages.push(
      uniqRaw([
        quotedField('product_type', 'laptops'),
        quotedField('product_type', 'desktops'),
        quotedField('product_type', 'gaming laptops'),
        quotedField('product_type', 'gaming desktops'),
        quotedPhrase('laptop'),
        quotedPhrase('desktop'),
        quotedPhrase('gaming laptop'),
      ])
        .slice(0, MAX_QUERY_PARTS)
        .join(' OR '),
    );
  } else if (profile.category) {
    queryStages.push(
      uniqRaw([
        ...profile.category.sourceTerms.map((term) => quotedPhrase(term)),
        ...profile.usefulTags.slice(0, 4).map((tag) => quotedField('tag', tag)),
      ])
        .slice(0, MAX_QUERY_PARTS)
        .join(' OR '),
    );
  }

  return uniqRaw(queryStages).filter(Boolean);
}

function normalizeAISearchPlan(rawPlan, fallbackPlan) {
  const rawQueries = Array.isArray(rawPlan?.shopifyQueries)
    ? rawPlan.shopifyQueries
    : Array.isArray(rawPlan?.queries)
    ? rawPlan.queries
    : [];
  const aiQueries = uniqRaw(
    rawQueries.map(sanitizeShopifyQuery).filter(Boolean),
  ).slice(0, 5);

  return {
    source: aiQueries.length ? 'openai' : fallbackPlan.source,
    sourceProductRole: ['accessory', 'main'].includes(
      normalizeSearchText(rawPlan?.sourceProductRole),
    )
      ? normalizeSearchText(rawPlan.sourceProductRole)
      : fallbackPlan.sourceProductRole,
    category:
      normalizeSearchText(rawPlan?.category) || fallbackPlan.category || 'other',
    queries: uniqRaw([...aiQueries, ...fallbackPlan.queries]).slice(0, 8),
    mustInclude: normalizeTermList(
      [...(rawPlan?.mustInclude || []), ...fallbackPlan.mustInclude],
      30,
    ),
    avoid: normalizeTermList(rawPlan?.avoid || [], 30),
  };
}

export async function resolveComplementarySearchPlan(product, context) {
  const fallbackPlan = createFallbackSearchPlan(product);
  const openaiKey = normalizeSecret(context?.env?.OPENAI_API_KEY);

  if (!openaiKey) return fallbackPlan;

  const cacheKey = getCacheKey(product);
  const cached = aiSearchPlanCache.get(cacheKey);
  if (cached && Date.now() - cached.createdAt < AI_PLAN_CACHE_TTL_MS) {
    return cached.plan;
  }

  const productPayload = {
    title: product?.title || '',
    vendor: product?.vendor || '',
    productType: product?.productType || '',
    tags: product?.tags || [],
    deterministicFallbackQueries: fallbackPlan.queries,
  };

  try {
    const payload = {
      model: DEFAULT_OPENAI_MODEL,
      reasoning: {effort: 'none'},
      instructions: [
        'You generate Shopify Storefront product search queries for complementary products.',
        'Return strict JSON only. No markdown.',
        'Use Shopify query syntax with quoted phrases and fields like tag:"...", product_type:"...", vendor:"...".',
        'First decide whether the source product is a main product or an accessory.',
        'If the source product is an accessory, search for the main products/devices/categories that this accessory is compatible with.',
        'If the source product is a main product, search for accessories that fit or pair with it.',
        'For gaming laptops, search only for gaming mouse, gaming keyboards, mousepads, gaming speakers, gaming mics. Exclude Apple products and exclude hubs/adapters.',
        'For non-Apple laptops, search for backpacks, sleeves, mouse, keyboards, mousepads, hubs and adapters. Exclude Apple-made products and Apple-specific products.',
        'For Apple MacBooks and iMacs, search for Apple adapters, sleeves, backpacks, Magic Mouse, Magic Trackpad, Magic Keyboard, and hubs.',
        'For mobile phones/phones, focus on exact-model cases/covers/protectors, charging cables, chargers, adapters, MagSafe, and mobile accessories.',
        'For other categories, infer practical accessories from product type, title, vendor, and tags.',
        'The final query should be broad enough to avoid an empty section while staying compatible with the source product role.',
      ].join(' '),
      input: `Product JSON:
${JSON.stringify(productPayload)}

Return this JSON shape:
{
  "sourceProductRole": "main|accessory",
  "category": "computer|mobile|tablet|gaming|camera|audio|monitor|watch|networking|home|other",
  "shopifyQueries": ["query 1", "query 2", "query 3"],
  "mustInclude": ["terms that compatible products should contain"],
  "avoid": ["terms that indicate incompatible products"]
}

Rules:
- Max 5 shopifyQueries.
- Max 700 characters per query.
- Prefer tags and exact model phrases when available.
- If sourceProductRole is "accessory", shopifyQueries must search for compatible main products, not more accessories.
- If sourceProductRole is "main", shopifyQueries must search for compatible accessories, not alternate main products.
- For gaming laptops, avoid Apple, MacBook, iMac, hubs, adapters, docks, and USB hubs.
- For non-Apple laptops, avoid Apple, MacBook, iMac, Magic Mouse, Magic Keyboard, and Magic Trackpad.
- For Apple MacBooks/iMacs, Apple accessories are preferred.
- Do not include the source product itself.
- Do not include unrelated product categories.`,
      max_output_tokens: 900,
    };

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify(payload),
    });
    const json = await response.json().catch(() => null);

    if (!response.ok || json?.status === 'incomplete') {
      console.warn('[complementary][openai] plan-fallback', {
        status: response.status,
        responseStatus: json?.status || null,
        error: json?.error?.message || null,
      });
      return fallbackPlan;
    }

    const parsed = parseJsonObject(extractOutputText(json));
    const plan = normalizeAISearchPlan(parsed, fallbackPlan);

    aiSearchPlanCache.set(cacheKey, {
      createdAt: Date.now(),
      plan,
    });

    console.info('[complementary][openai] plan-ready', {
      title: product?.title,
      category: plan.category,
      queryCount: plan.queries.length,
      source: plan.source,
      queries: plan.queries,
      mustInclude: plan.mustInclude,
      avoid: plan.avoid,
    });

    return plan;
  } catch (error) {
    console.warn('[complementary][openai] plan-error', {
      title: product?.title,
      message: error?.message,
    });
    return fallbackPlan;
  }
}

export function buildNativeComplementaryQueries(product) {
  const profile = getSourceProfile(product);
  const productMode = getProductMode(product);
  const queryStages = [];
  const isProfiledSource = Boolean(profile.family || profile.category);

  if (
    profile.family &&
    profile.modelPhrase &&
    profile.category?.key !== 'computer'
  ) {
    const exactModelParts = [];
    exactModelParts.push(quotedField('title', profile.modelPhrase));
    exactModelParts.push(quotedPhrase(profile.modelPhrase));
    exactModelParts.push(quotedField('tag', `${profile.modelPhrase} cover`));
    exactModelParts.push(quotedField('tag', `${profile.modelPhrase} covers`));
    exactModelParts.push(
      quotedField('tag', `${profile.modelPhrase} accessories`),
    );
    exactModelParts.push(quotedPhrase(`${profile.modelPhrase} accessories`));
    exactModelParts.push(quotedPhrase(`${profile.modelPhrase} case`));
    exactModelParts.push(quotedPhrase(`${profile.modelPhrase} cover`));
    exactModelParts.push(quotedPhrase(`${profile.modelPhrase} protector`));

    queryStages.push(
      uniqRaw(exactModelParts).slice(0, MAX_QUERY_PARTS).join(' OR '),
    );
  }

  if (profile.category) {
    let categoryParts = [
      ...profile.category.accessoryTags.map((tag) => quotedField('tag', tag)),
      ...profile.category.queryTerms.map((term) => quotedPhrase(term)),
    ];

    if (productMode === 'gaming-laptop') {
      categoryParts = [
        quotedPhrase('gaming mouse'),
        quotedPhrase('gaming keyboard'),
        quotedPhrase('mousepad'),
        quotedPhrase('mouse pad'),
        quotedPhrase('gaming speaker'),
        quotedPhrase('gaming mic'),
        quotedPhrase('gaming microphone'),
      ];
    } else if (productMode === 'laptop') {
      categoryParts = [
        quotedPhrase('backpack'),
        quotedPhrase('laptop sleeve'),
        quotedPhrase('mouse'),
        quotedPhrase('keyboard'),
        quotedPhrase('mousepad'),
        quotedPhrase('mouse pad'),
        quotedPhrase('hub'),
        quotedPhrase('adapter'),
        quotedPhrase('hubs adapters'),
      ];
    } else if (productMode === 'apple-computer') {
      categoryParts = [
        quotedPhrase('apple adapter'),
        quotedPhrase('macbook sleeve'),
        quotedPhrase('backpack'),
        quotedPhrase('magic mouse'),
        quotedPhrase('magic trackpad'),
        quotedPhrase('magic keyboard'),
        quotedPhrase('hub'),
        quotedPhrase('usb c hub'),
      ];
    }

    if (profile.modelPhrase && profile.category.key === 'mobile') {
      categoryParts.unshift(quotedPhrase(`${profile.modelPhrase} charger`));
      categoryParts.unshift(quotedPhrase(`${profile.modelPhrase} cable`));
      categoryParts.unshift(quotedPhrase(`${profile.modelPhrase} adapter`));
      categoryParts.unshift(quotedPhrase(`${profile.modelPhrase} magsafe`));
    }

    queryStages.push(
      uniqRaw(categoryParts).slice(0, MAX_QUERY_PARTS).join(' OR '),
    );
  } else if (profile.family?.accessoryTag) {
    queryStages.push(quotedField('tag', profile.family.accessoryTag));
  }

  if (!isProfiledSource) {
    const queryParts = [];

    for (const tag of profile.usefulTags.slice(0, 5)) {
      queryParts.push(quotedField('tag', tag));
    }

    for (const token of profile.titleTokens.slice(0, 4)) {
      queryParts.push(quotedField('title', token));
    }

    if (product?.productType) {
      queryParts.push(quotedField('product_type', product.productType));
    }

    if (product?.vendor) {
      queryParts.push(quotedField('vendor', product.vendor));
    }

    queryStages.push(
      uniqRaw(queryParts).slice(0, MAX_QUERY_PARTS).join(' OR '),
    );
  }

  return uniqRaw(queryStages).filter(Boolean);
}

export function buildNativeComplementaryQueryLegacy(product) {
  const profile = getSourceProfile(product);
  const queryParts = [];
  const isDeviceSource = Boolean(profile.family);

  if (profile.family?.accessoryTag && !profile.modelPhrase) {
    queryParts.push(quotedField('tag', profile.family.accessoryTag));
  }

  if (profile.modelPhrase) {
    queryParts.push(quotedField('title', profile.modelPhrase));
    queryParts.push(quotedPhrase(profile.modelPhrase));
    queryParts.push(quotedField('tag', `${profile.modelPhrase} cover`));
    queryParts.push(quotedField('tag', `${profile.modelPhrase} covers`));
    queryParts.push(quotedField('tag', `${profile.modelPhrase} accessories`));
    queryParts.push(quotedPhrase(`${profile.modelPhrase} accessories`));
    queryParts.push(quotedPhrase(`${profile.modelPhrase} case`));
    queryParts.push(quotedPhrase(`${profile.modelPhrase} cover`));
    queryParts.push(quotedPhrase(`${profile.modelPhrase} charger`));
    queryParts.push(quotedPhrase(`${profile.modelPhrase} protector`));
  }

  if (!isDeviceSource) {
    for (const tag of profile.usefulTags.slice(0, 5)) {
      queryParts.push(quotedField('tag', tag));
    }

    for (const token of profile.titleTokens.slice(0, 4)) {
      queryParts.push(quotedField('title', token));
    }

    if (product?.productType) {
      queryParts.push(quotedField('product_type', product.productType));
    }

    if (product?.vendor) {
      queryParts.push(quotedField('vendor', product.vendor));
    }
  }

  return uniqRaw(queryParts).slice(0, MAX_QUERY_PARTS).join(' OR ');
}

function countSharedTerms(a, b) {
  const aSet = new Set(uniq(a));
  const bSet = new Set(uniq(b));
  let count = 0;

  for (const term of aSet) {
    if (bSet.has(term)) count++;
  }

  return count;
}

function candidateMatchesDeviceSource(candidate, sourceProfile) {
  const candidateText = getProductSearchText(candidate);
  const family = sourceProfile.family;

  if (!family) return true;
  if (
    sourceProfile.category &&
    !['mobile', 'tablet'].includes(sourceProfile.category.key)
  ) {
    return true;
  }

  const familyMatch = family.aliases.some((alias) =>
    candidateText.includes(alias),
  );
  const accessoryMatch = hasAccessorySignal(candidate);

  if (!familyMatch || !accessoryMatch) return false;

  const candidateModels = extractFamilyModels(candidate, family);
  const modelPhrase = sourceProfile.modelPhrase;

  if (!modelPhrase || !candidateModels.length) {
    return !isModelSensitive(candidate);
  }

  if (isModelSensitive(candidate)) {
    return candidateModels.includes(modelPhrase);
  }

  return true;
}

function candidateMatchesCategorySource(candidate, sourceProfile) {
  const category = sourceProfile.category;
  if (!category) return true;

  const candidateText = getProductSearchText(candidate);
  const sourceMode =
    sourceProfile.category?.key === 'computer' ? sourceProfile.mode : '';

  if (
    ['gaming-laptop', 'laptop'].includes(sourceMode) &&
    (candidateText.includes('apple') ||
      candidateText.includes('macbook') ||
      candidateText.includes('imac') ||
      candidateText.includes('magic mouse') ||
      candidateText.includes('magic keyboard') ||
      candidateText.includes('magic trackpad'))
  ) {
    return false;
  }

  if (
    sourceMode === 'gaming-laptop' &&
    (candidateText.includes('hub') ||
      candidateText.includes('adapter') ||
      candidateText.includes('adaptor') ||
      candidateText.includes('dock'))
  ) {
    return false;
  }

  const hasCategoryTag = category.accessoryTags.some((tag) =>
    candidateText.includes(normalizeSearchText(tag)),
  );
  const hasCategoryTerm = textIncludesAny(candidateText, category.candidateTerms);

  if (!hasCategoryTag && !hasCategoryTerm) return false;

  if (sourceProfile.modelPhrase && isModelSensitive(candidate)) {
    const candidateModels = sourceProfile.family
      ? extractFamilyModels(candidate, sourceProfile.family)
      : [];

    if (candidateModels.length) {
      return candidateModels.includes(sourceProfile.modelPhrase);
    }

    return candidateText.includes(sourceProfile.modelPhrase);
  }

  return true;
}

function candidateMatchesAISearchPlan(product, searchPlan) {
  if (!searchPlan || searchPlan.source !== 'openai') return true;

  const productText = getProductSearchText(product);
  if (
    searchPlan.avoid?.some((term) =>
      productText.includes(normalizeSearchText(term)),
    )
  ) {
    return false;
  }

  if (!searchPlan.mustInclude?.length) return true;

  return searchPlan.mustInclude.some((term) =>
    productText.includes(normalizeSearchText(term)),
  );
}

export function productMatchesComplementaryRules(
  product,
  sourceProduct,
  searchPlan = null,
) {
  if (!product?.id || product.id === sourceProduct?.id) return false;
  if (!candidateMatchesAISearchPlan(product, searchPlan)) return false;
  if (searchPlan?.sourceProductRole === 'accessory') {
    return !hasAccessorySignal(product);
  }

  const sourceProfile = getSourceProfile(sourceProduct);
  if (!candidateMatchesCategorySource(product, sourceProfile)) return false;
  if (!candidateMatchesDeviceSource(product, sourceProfile)) return false;

  const sharedTags = countSharedTerms(
    sourceProfile.usefulTags,
    getUsefulTags(product),
  );
  const sharedTitleTokens = countSharedTerms(
    sourceProfile.titleTokens,
    getTitleTokens(product),
  );

  const hasBasicRelationship =
    sourceProfile.family && hasAccessorySignal(product)
      ? true
      : sharedTags > 0 || sharedTitleTokens > 0;

  if (!hasBasicRelationship) return false;

  return getCompatibilityScore(product, sourceProduct) >= MIN_COMPATIBILITY_SCORE;
}

function getCompatibilityScore(product, sourceProduct) {
  const sourceProfile = getSourceProfile(sourceProduct);
  const productTags = getUsefulTags(product);
  const productTokens = getTitleTokens(product);
  const productText = getProductSearchText(product);
  let score = 0;

  if (
    sourceProfile.modelPhrase &&
    productText.includes(sourceProfile.modelPhrase)
  ) {
    score += 100;
  }

  if (hasAccessorySignal(product)) score += 50;
  score += countSharedTerms(sourceProfile.usefulTags, productTags) * 20;
  score += countSharedTerms(sourceProfile.titleTokens, productTokens) * 8;

  if (
    sourceProduct?.vendor &&
    normalizeSearchText(sourceProduct.vendor) ===
      normalizeSearchText(product?.vendor)
  ) {
    score += 4;
  }

  return score;
}

export function sortComplementaryProducts(products, sourceProduct) {
  return [...products].sort(
    (a, b) =>
      getCompatibilityScore(b, sourceProduct) -
      getCompatibilityScore(a, sourceProduct),
  );
}

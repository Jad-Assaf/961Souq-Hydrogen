/* eslint-disable no-console */
import 'dotenv/config';
import Typesense from 'typesense';

const TYPESENSE_HOST = process.env.TYPESENSE_HOST;
const TYPESENSE_PORT = Number(process.env.TYPESENSE_PORT || 443);
const TYPESENSE_PROTOCOL = process.env.TYPESENSE_PROTOCOL || 'https';
const TYPESENSE_ADMIN_API_KEY = process.env.TYPESENSE_ADMIN_API_KEY;
const COLLECTION_NAME = 'products';

if (!TYPESENSE_HOST || !TYPESENSE_ADMIN_API_KEY) {
  console.error(
    'Missing TYPESENSE_HOST or TYPESENSE_ADMIN_API_KEY in .env for create script',
  );
  process.exit(1);
}

const client = new Typesense.Client({
  nodes: [
    {
      host: TYPESENSE_HOST,
      port: TYPESENSE_PORT,
      protocol: TYPESENSE_PROTOCOL,
    },
  ],
  apiKey: TYPESENSE_ADMIN_API_KEY,
  connectionTimeoutSeconds: 10,
});

async function recreateProductsCollection() {
  console.log(
    `Using Typesense at ${TYPESENSE_PROTOCOL}://${TYPESENSE_HOST}:${TYPESENSE_PORT}`,
  );
  console.log(`Recreating collection "${COLLECTION_NAME}"...`);

  // 1) Drop existing collection if it exists
  try {
    await client.collections(COLLECTION_NAME).delete();
    console.log(`Dropped existing collection "${COLLECTION_NAME}".`);
  } catch (err) {
    if (err?.httpStatus === 404) {
      console.log(
        `No existing collection "${COLLECTION_NAME}" to drop, continuing...`,
      );
    } else {
      console.warn('Error dropping collection (continuing):', err.message);
    }
  }

  // 2) Create schema with partial matching fields
  const schema = {
    name: COLLECTION_NAME,
    enable_nested_fields: false,
    default_sorting_field: 'price',
    fields: [
      // Explicit id field (string)
      {
        name: 'id',
        type: 'string',
        facet: false,
        optional: false,
        index: true,
        sort: false,
        store: true,
      },

      // Text fields
      {
        facet: false,
        index: true,
        infix: true, // partial matching on title
        locale: '',
        name: 'title',
        optional: false,
        sort: false,
        stem: false,
        stem_dictionary: '',
        store: true,
        type: 'string',
      },
      {
        facet: false,
        index: true,
        infix: true, // partial matching on handle
        locale: '',
        name: 'handle',
        optional: false,
        sort: false,
        stem: false,
        stem_dictionary: '',
        store: true,
        type: 'string',
      },

      // NEW: SKUs (all variant SKUs as string[])
      {
        facet: false,
        index: true,
        infix: true, // partial matching on sku if you ever add it to query_by
        locale: '',
        name: 'sku',
        optional: true,
        sort: false,
        stem: false,
        stem_dictionary: '',
        store: true,
        type: 'string[]',
      },

      {
        facet: false,
        index: true,
        infix: false, // leave description without infix for performance
        locale: '',
        name: 'description',
        optional: false,
        sort: false,
        stem: false,
        stem_dictionary: '',
        store: true,
        type: 'string',
      },

      // Facet fields
      {
        facet: true,
        index: true,
        infix: false,
        locale: '',
        name: 'vendor',
        optional: false,
        sort: false,
        stem: false,
        stem_dictionary: '',
        store: true,
        type: 'string',
      },
      {
        facet: true,
        index: true,
        infix: false,
        locale: '',
        name: 'product_type',
        optional: false,
        sort: false,
        stem: false,
        stem_dictionary: '',
        store: true,
        type: 'string',
      },
      {
        facet: true,
        index: true,
        infix: true, // partial matching on tags
        locale: '',
        name: 'tags',
        optional: false,
        sort: false,
        stem: false,
        stem_dictionary: '',
        store: true,
        type: 'string[]',
      },
      {
        facet: true,
        index: true,
        infix: false,
        locale: '',
        name: 'price',
        optional: false,
        sort: true,
        stem: false,
        stem_dictionary: '',
        store: true,
        type: 'float',
      },
      {
        facet: true,
        index: true,
        infix: false,
        locale: '',
        name: 'available',
        optional: false,
        sort: true,
        stem: false,
        stem_dictionary: '',
        store: true,
        type: 'bool',
      },
      {
        facet: true,
        index: true,
        infix: false,
        locale: '',
        name: 'status',
        optional: true,
        sort: false,
        stem: false,
        stem_dictionary: '',
        store: true,
        type: 'string',
      },
      {
        facet: true,
        index: true,
        infix: true, // partial matching on collections
        locale: '',
        name: 'collections',
        optional: false,
        sort: false,
        stem: false,
        stem_dictionary: '',
        store: true,
        type: 'string[]',
      },

      // Non-searchable stored fields
      {
        facet: false,
        index: false,
        infix: false,
        locale: '',
        name: 'image',
        optional: true,
        sort: false,
        stem: false,
        stem_dictionary: '',
        store: true,
        type: 'string',
      },
      {
        facet: false,
        index: false,
        infix: false,
        locale: '',
        name: 'url',
        optional: true,
        sort: false,
        stem: false,
        stem_dictionary: '',
        store: true,
        type: 'string',
      },
    ],
    symbols_to_index: [],
    token_separators: [],
  };

  const created = await client.collections().create(schema);
  console.log('Created Typesense collection:');
  console.dir(created, {depth: null});
}

recreateProductsCollection().catch((err) => {
  console.error('Fatal error creating collection:', err);
  process.exit(1);
});

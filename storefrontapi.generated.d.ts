/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable eslint-comments/no-unlimited-disable */
/* eslint-disable */
import type * as StorefrontAPI from '@shopify/hydrogen/storefront-api-types';

export type ArticleQueryVariables = StorefrontAPI.Exact<{
  articleHandle: StorefrontAPI.Scalars['String']['input'];
  blogHandle: StorefrontAPI.Scalars['String']['input'];
  country?: StorefrontAPI.InputMaybe<StorefrontAPI.CountryCode>;
  language?: StorefrontAPI.InputMaybe<StorefrontAPI.LanguageCode>;
}>;

export type ArticleQuery = {
  blog?: StorefrontAPI.Maybe<{
    articleByHandle?: StorefrontAPI.Maybe<
      Pick<StorefrontAPI.Article, 'title' | 'contentHtml' | 'publishedAt'> & {
        author?: StorefrontAPI.Maybe<Pick<StorefrontAPI.ArticleAuthor, 'name'>>;
        image?: StorefrontAPI.Maybe<
          Pick<
            StorefrontAPI.Image,
            'id' | 'altText' | 'url' | 'width' | 'height'
          >
        >;
        seo?: StorefrontAPI.Maybe<
          Pick<StorefrontAPI.Seo, 'description' | 'title'>
        >;
      }
    >;
  }>;
};

export type BlogIndexQueryQueryVariables = StorefrontAPI.Exact<{
  language?: StorefrontAPI.InputMaybe<StorefrontAPI.LanguageCode>;
  blogHandle: StorefrontAPI.Scalars['String']['input'];
  first?: StorefrontAPI.InputMaybe<StorefrontAPI.Scalars['Int']['input']>;
  last?: StorefrontAPI.InputMaybe<StorefrontAPI.Scalars['Int']['input']>;
  startCursor?: StorefrontAPI.InputMaybe<
    StorefrontAPI.Scalars['String']['input']
  >;
  endCursor?: StorefrontAPI.InputMaybe<
    StorefrontAPI.Scalars['String']['input']
  >;
}>;

export type BlogIndexQueryQuery = {
  blog?: StorefrontAPI.Maybe<
    Pick<StorefrontAPI.Blog, 'title'> & {
      seo?: StorefrontAPI.Maybe<
        Pick<StorefrontAPI.Seo, 'title' | 'description'>
      >;
      articles: {
        nodes: Array<
          Pick<
            StorefrontAPI.Article,
            'contentHtml' | 'handle' | 'id' | 'publishedAt' | 'title'
          > & {
            author?: StorefrontAPI.Maybe<
              Pick<StorefrontAPI.ArticleAuthor, 'name'>
            >;
            image?: StorefrontAPI.Maybe<
              Pick<
                StorefrontAPI.Image,
                'id' | 'altText' | 'url' | 'width' | 'height'
              >
            >;
            blog: Pick<StorefrontAPI.Blog, 'handle'>;
          }
        >;
        pageInfo: Pick<
          StorefrontAPI.PageInfo,
          'hasPreviousPage' | 'hasNextPage' | 'endCursor' | 'startCursor'
        >;
      };
    }
  >;
};

export type ArticleItemFragment = Pick<
  StorefrontAPI.Article,
  'contentHtml' | 'handle' | 'id' | 'publishedAt' | 'title'
> & {
  author?: StorefrontAPI.Maybe<Pick<StorefrontAPI.ArticleAuthor, 'name'>>;
  image?: StorefrontAPI.Maybe<
    Pick<StorefrontAPI.Image, 'id' | 'altText' | 'url' | 'width' | 'height'>
  >;
  blog: Pick<StorefrontAPI.Blog, 'handle'>;
};

export type BlogsQueryVariables = StorefrontAPI.Exact<{
  country?: StorefrontAPI.InputMaybe<StorefrontAPI.CountryCode>;
  endCursor?: StorefrontAPI.InputMaybe<
    StorefrontAPI.Scalars['String']['input']
  >;
  first?: StorefrontAPI.InputMaybe<StorefrontAPI.Scalars['Int']['input']>;
  language?: StorefrontAPI.InputMaybe<StorefrontAPI.LanguageCode>;
  last?: StorefrontAPI.InputMaybe<StorefrontAPI.Scalars['Int']['input']>;
  startCursor?: StorefrontAPI.InputMaybe<
    StorefrontAPI.Scalars['String']['input']
  >;
}>;

export type BlogsQuery = {
  blogs: {
    pageInfo: Pick<
      StorefrontAPI.PageInfo,
      'hasNextPage' | 'hasPreviousPage' | 'startCursor' | 'endCursor'
    >;
    nodes: Array<
      Pick<StorefrontAPI.Blog, 'title' | 'handle'> & {
        seo?: StorefrontAPI.Maybe<
          Pick<StorefrontAPI.Seo, 'title' | 'description'>
        >;
      }
    >;
  };
};

export type MoneyProductItemFragment = Pick<
  StorefrontAPI.MoneyV2,
  'amount' | 'currencyCode'
>;

export type AllCollectionsProductItemFragment = Pick<
  StorefrontAPI.Product,
  'id' | 'handle' | 'title' | 'description'
> & {
  featuredImage?: StorefrontAPI.Maybe<
    Pick<StorefrontAPI.Image, 'id' | 'altText' | 'url' | 'width' | 'height'>
  >;
  options: Array<Pick<StorefrontAPI.ProductOption, 'name' | 'values'>>;
  priceRange: {
    minVariantPrice: Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>;
    maxVariantPrice: Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>;
  };
  compareAtPriceRange: {
    minVariantPrice: Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>;
    maxVariantPrice: Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>;
  };
  variants: {
    nodes: Array<
      Pick<
        StorefrontAPI.ProductVariant,
        'id' | 'availableForSale' | 'sku' | 'title'
      > & {
        selectedOptions: Array<
          Pick<StorefrontAPI.SelectedOption, 'name' | 'value'>
        >;
        image?: StorefrontAPI.Maybe<
          Pick<
            StorefrontAPI.Image,
            'id' | 'url' | 'altText' | 'width' | 'height'
          >
        >;
        price: Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>;
        compareAtPrice?: StorefrontAPI.Maybe<
          Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>
        >;
        unitPrice?: StorefrontAPI.Maybe<
          Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>
        >;
      }
    >;
  };
};

export type CatalogQueryVariables = StorefrontAPI.Exact<{
  country?: StorefrontAPI.InputMaybe<StorefrontAPI.CountryCode>;
  language?: StorefrontAPI.InputMaybe<StorefrontAPI.LanguageCode>;
  first?: StorefrontAPI.InputMaybe<StorefrontAPI.Scalars['Int']['input']>;
  last?: StorefrontAPI.InputMaybe<StorefrontAPI.Scalars['Int']['input']>;
  startCursor?: StorefrontAPI.InputMaybe<
    StorefrontAPI.Scalars['String']['input']
  >;
  endCursor?: StorefrontAPI.InputMaybe<
    StorefrontAPI.Scalars['String']['input']
  >;
}>;

export type CatalogQuery = {
  products: {
    nodes: Array<
      Pick<StorefrontAPI.Product, 'id' | 'handle' | 'title' | 'description'> & {
        featuredImage?: StorefrontAPI.Maybe<
          Pick<
            StorefrontAPI.Image,
            'id' | 'altText' | 'url' | 'width' | 'height'
          >
        >;
        options: Array<Pick<StorefrontAPI.ProductOption, 'name' | 'values'>>;
        priceRange: {
          minVariantPrice: Pick<
            StorefrontAPI.MoneyV2,
            'amount' | 'currencyCode'
          >;
          maxVariantPrice: Pick<
            StorefrontAPI.MoneyV2,
            'amount' | 'currencyCode'
          >;
        };
        compareAtPriceRange: {
          minVariantPrice: Pick<
            StorefrontAPI.MoneyV2,
            'amount' | 'currencyCode'
          >;
          maxVariantPrice: Pick<
            StorefrontAPI.MoneyV2,
            'amount' | 'currencyCode'
          >;
        };
        variants: {
          nodes: Array<
            Pick<
              StorefrontAPI.ProductVariant,
              'id' | 'availableForSale' | 'sku' | 'title'
            > & {
              selectedOptions: Array<
                Pick<StorefrontAPI.SelectedOption, 'name' | 'value'>
              >;
              image?: StorefrontAPI.Maybe<
                Pick<
                  StorefrontAPI.Image,
                  'id' | 'url' | 'altText' | 'width' | 'height'
                >
              >;
              price: Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>;
              compareAtPrice?: StorefrontAPI.Maybe<
                Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>
              >;
              unitPrice?: StorefrontAPI.Maybe<
                Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>
              >;
            }
          >;
        };
      }
    >;
    pageInfo: Pick<
      StorefrontAPI.PageInfo,
      'hasPreviousPage' | 'hasNextPage' | 'startCursor' | 'endCursor'
    >;
  };
};

type Media_ExternalVideo_Fragment = {__typename: 'ExternalVideo'} & Pick<
  StorefrontAPI.ExternalVideo,
  'id' | 'embedUrl' | 'host' | 'mediaContentType' | 'alt'
> & {previewImage?: StorefrontAPI.Maybe<Pick<StorefrontAPI.Image, 'url'>>};

type Media_MediaImage_Fragment = {__typename: 'MediaImage'} & Pick<
  StorefrontAPI.MediaImage,
  'id' | 'mediaContentType' | 'alt'
> & {
    image?: StorefrontAPI.Maybe<
      Pick<StorefrontAPI.Image, 'id' | 'url' | 'width' | 'height'>
    >;
    previewImage?: StorefrontAPI.Maybe<Pick<StorefrontAPI.Image, 'url'>>;
  };

type Media_Model3d_Fragment = {__typename: 'Model3d'} & Pick<
  StorefrontAPI.Model3d,
  'id' | 'mediaContentType' | 'alt'
> & {
    sources: Array<Pick<StorefrontAPI.Model3dSource, 'mimeType' | 'url'>>;
    previewImage?: StorefrontAPI.Maybe<Pick<StorefrontAPI.Image, 'url'>>;
  };

type Media_Video_Fragment = {__typename: 'Video'} & Pick<
  StorefrontAPI.Video,
  'id' | 'mediaContentType' | 'alt'
> & {
    sources: Array<Pick<StorefrontAPI.VideoSource, 'mimeType' | 'url'>>;
    previewImage?: StorefrontAPI.Maybe<Pick<StorefrontAPI.Image, 'url'>>;
  };

export type MediaFragment =
  | Media_ExternalVideo_Fragment
  | Media_MediaImage_Fragment
  | Media_Model3d_Fragment
  | Media_Video_Fragment;

export type ProductCardFragment = Pick<
  StorefrontAPI.Product,
  'id' | 'title' | 'publishedAt' | 'handle' | 'vendor'
> & {
  variants: {
    nodes: Array<
      Pick<StorefrontAPI.ProductVariant, 'id' | 'availableForSale' | 'sku'> & {
        image?: StorefrontAPI.Maybe<
          Pick<StorefrontAPI.Image, 'url' | 'altText' | 'width' | 'height'>
        >;
        price: Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>;
        compareAtPrice?: StorefrontAPI.Maybe<
          Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>
        >;
        selectedOptions: Array<
          Pick<StorefrontAPI.SelectedOption, 'name' | 'value'>
        >;
        product: Pick<StorefrontAPI.Product, 'handle' | 'title'>;
      }
    >;
  };
};

export type FeaturedCollectionDetailsFragment = Pick<
  StorefrontAPI.Collection,
  'id' | 'title' | 'handle'
> & {
  image?: StorefrontAPI.Maybe<
    Pick<StorefrontAPI.Image, 'altText' | 'width' | 'height' | 'url'>
  >;
};

export type CollectionContentFragment = Pick<
  StorefrontAPI.Collection,
  'id' | 'handle' | 'title' | 'descriptionHtml'
> & {
  heading?: StorefrontAPI.Maybe<Pick<StorefrontAPI.Metafield, 'value'>>;
  byline?: StorefrontAPI.Maybe<Pick<StorefrontAPI.Metafield, 'value'>>;
  cta?: StorefrontAPI.Maybe<Pick<StorefrontAPI.Metafield, 'value'>>;
  spread?: StorefrontAPI.Maybe<{
    reference?: StorefrontAPI.Maybe<
      | ({__typename: 'MediaImage'} & Pick<
          StorefrontAPI.MediaImage,
          'id' | 'mediaContentType' | 'alt'
        > & {
            image?: StorefrontAPI.Maybe<
              Pick<StorefrontAPI.Image, 'id' | 'url' | 'width' | 'height'>
            >;
            previewImage?: StorefrontAPI.Maybe<
              Pick<StorefrontAPI.Image, 'url'>
            >;
          })
      | ({__typename: 'Model3d'} & Pick<
          StorefrontAPI.Model3d,
          'id' | 'mediaContentType' | 'alt'
        > & {
            sources: Array<
              Pick<StorefrontAPI.Model3dSource, 'mimeType' | 'url'>
            >;
            previewImage?: StorefrontAPI.Maybe<
              Pick<StorefrontAPI.Image, 'url'>
            >;
          })
      | ({__typename: 'Video'} & Pick<
          StorefrontAPI.Video,
          'id' | 'mediaContentType' | 'alt'
        > & {
            sources: Array<Pick<StorefrontAPI.VideoSource, 'mimeType' | 'url'>>;
            previewImage?: StorefrontAPI.Maybe<
              Pick<StorefrontAPI.Image, 'url'>
            >;
          })
    >;
  }>;
  spreadSecondary?: StorefrontAPI.Maybe<{
    reference?: StorefrontAPI.Maybe<
      | ({__typename: 'MediaImage'} & Pick<
          StorefrontAPI.MediaImage,
          'id' | 'mediaContentType' | 'alt'
        > & {
            image?: StorefrontAPI.Maybe<
              Pick<StorefrontAPI.Image, 'id' | 'url' | 'width' | 'height'>
            >;
            previewImage?: StorefrontAPI.Maybe<
              Pick<StorefrontAPI.Image, 'url'>
            >;
          })
      | ({__typename: 'Model3d'} & Pick<
          StorefrontAPI.Model3d,
          'id' | 'mediaContentType' | 'alt'
        > & {
            sources: Array<
              Pick<StorefrontAPI.Model3dSource, 'mimeType' | 'url'>
            >;
            previewImage?: StorefrontAPI.Maybe<
              Pick<StorefrontAPI.Image, 'url'>
            >;
          })
      | ({__typename: 'Video'} & Pick<
          StorefrontAPI.Video,
          'id' | 'mediaContentType' | 'alt'
        > & {
            sources: Array<Pick<StorefrontAPI.VideoSource, 'mimeType' | 'url'>>;
            previewImage?: StorefrontAPI.Maybe<
              Pick<StorefrontAPI.Image, 'url'>
            >;
          })
    >;
  }>;
};

export type ProductVariantFragmentFragment = Pick<
  StorefrontAPI.ProductVariant,
  'id' | 'availableForSale' | 'quantityAvailable' | 'sku' | 'title'
> & {
  selectedOptions: Array<Pick<StorefrontAPI.SelectedOption, 'name' | 'value'>>;
  image?: StorefrontAPI.Maybe<
    Pick<StorefrontAPI.Image, 'id' | 'url' | 'altText' | 'width' | 'height'>
  >;
  price: Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>;
  compareAtPrice?: StorefrontAPI.Maybe<
    Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>
  >;
  unitPrice?: StorefrontAPI.Maybe<
    Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>
  >;
  product: Pick<StorefrontAPI.Product, 'title' | 'handle'>;
};

export type MoneyFragment = Pick<
  StorefrontAPI.MoneyV2,
  'currencyCode' | 'amount'
>;

export type CartLineFragment = Pick<
  StorefrontAPI.CartLine,
  'id' | 'quantity'
> & {
  attributes: Array<Pick<StorefrontAPI.Attribute, 'key' | 'value'>>;
  cost: {
    totalAmount: Pick<StorefrontAPI.MoneyV2, 'currencyCode' | 'amount'>;
    amountPerQuantity: Pick<StorefrontAPI.MoneyV2, 'currencyCode' | 'amount'>;
    compareAtAmountPerQuantity?: StorefrontAPI.Maybe<
      Pick<StorefrontAPI.MoneyV2, 'currencyCode' | 'amount'>
    >;
  };
  sellingPlanAllocation?: StorefrontAPI.Maybe<{
    sellingPlan: Pick<StorefrontAPI.SellingPlan, 'name'>;
  }>;
  merchandise: Pick<
    StorefrontAPI.ProductVariant,
    'id' | 'availableForSale' | 'requiresShipping' | 'title'
  > & {
    compareAtPrice?: StorefrontAPI.Maybe<
      Pick<StorefrontAPI.MoneyV2, 'currencyCode' | 'amount'>
    >;
    price: Pick<StorefrontAPI.MoneyV2, 'currencyCode' | 'amount'>;
    image?: StorefrontAPI.Maybe<
      Pick<StorefrontAPI.Image, 'id' | 'url' | 'altText' | 'width' | 'height'>
    >;
    product: Pick<StorefrontAPI.Product, 'handle' | 'title' | 'id' | 'vendor'>;
    selectedOptions: Array<
      Pick<StorefrontAPI.SelectedOption, 'name' | 'value'>
    >;
  };
};

export type CartApiQueryFragment = Pick<
  StorefrontAPI.Cart,
  'updatedAt' | 'id' | 'checkoutUrl' | 'totalQuantity' | 'note'
> & {
  buyerIdentity: Pick<
    StorefrontAPI.CartBuyerIdentity,
    'countryCode' | 'email' | 'phone'
  > & {
    customer?: StorefrontAPI.Maybe<
      Pick<
        StorefrontAPI.Customer,
        'id' | 'email' | 'firstName' | 'lastName' | 'displayName'
      >
    >;
  };
  lines: {
    nodes: Array<
      Pick<StorefrontAPI.CartLine, 'id' | 'quantity'> & {
        attributes: Array<Pick<StorefrontAPI.Attribute, 'key' | 'value'>>;
        cost: {
          totalAmount: Pick<StorefrontAPI.MoneyV2, 'currencyCode' | 'amount'>;
          amountPerQuantity: Pick<
            StorefrontAPI.MoneyV2,
            'currencyCode' | 'amount'
          >;
          compareAtAmountPerQuantity?: StorefrontAPI.Maybe<
            Pick<StorefrontAPI.MoneyV2, 'currencyCode' | 'amount'>
          >;
        };
        sellingPlanAllocation?: StorefrontAPI.Maybe<{
          sellingPlan: Pick<StorefrontAPI.SellingPlan, 'name'>;
        }>;
        merchandise: Pick<
          StorefrontAPI.ProductVariant,
          'id' | 'availableForSale' | 'requiresShipping' | 'title'
        > & {
          compareAtPrice?: StorefrontAPI.Maybe<
            Pick<StorefrontAPI.MoneyV2, 'currencyCode' | 'amount'>
          >;
          price: Pick<StorefrontAPI.MoneyV2, 'currencyCode' | 'amount'>;
          image?: StorefrontAPI.Maybe<
            Pick<
              StorefrontAPI.Image,
              'id' | 'url' | 'altText' | 'width' | 'height'
            >
          >;
          product: Pick<
            StorefrontAPI.Product,
            'handle' | 'title' | 'id' | 'vendor'
          >;
          selectedOptions: Array<
            Pick<StorefrontAPI.SelectedOption, 'name' | 'value'>
          >;
        };
      }
    >;
  };
  cost: {
    subtotalAmount: Pick<StorefrontAPI.MoneyV2, 'currencyCode' | 'amount'>;
    totalAmount: Pick<StorefrontAPI.MoneyV2, 'currencyCode' | 'amount'>;
    totalDutyAmount?: StorefrontAPI.Maybe<
      Pick<StorefrontAPI.MoneyV2, 'currencyCode' | 'amount'>
    >;
    totalTaxAmount?: StorefrontAPI.Maybe<
      Pick<StorefrontAPI.MoneyV2, 'currencyCode' | 'amount'>
    >;
  };
  attributes: Array<Pick<StorefrontAPI.Attribute, 'key' | 'value'>>;
  discountCodes: Array<
    Pick<StorefrontAPI.CartDiscountCode, 'code' | 'applicable'>
  >;
};

export type ShopQueryQueryVariables = StorefrontAPI.Exact<{
  country?: StorefrontAPI.InputMaybe<StorefrontAPI.CountryCode>;
  language?: StorefrontAPI.InputMaybe<StorefrontAPI.LanguageCode>;
}>;

export type ShopQueryQuery = {
  shop: Pick<StorefrontAPI.Shop, 'name' | 'description'>;
};

export type SeoCollectionContentQueryVariables = StorefrontAPI.Exact<{
  handle?: StorefrontAPI.InputMaybe<StorefrontAPI.Scalars['String']['input']>;
  country?: StorefrontAPI.InputMaybe<StorefrontAPI.CountryCode>;
  language?: StorefrontAPI.InputMaybe<StorefrontAPI.LanguageCode>;
}>;

export type SeoCollectionContentQuery = {
  hero?: StorefrontAPI.Maybe<
    Pick<
      StorefrontAPI.Collection,
      'id' | 'handle' | 'title' | 'descriptionHtml'
    > & {
      heading?: StorefrontAPI.Maybe<Pick<StorefrontAPI.Metafield, 'value'>>;
      byline?: StorefrontAPI.Maybe<Pick<StorefrontAPI.Metafield, 'value'>>;
      cta?: StorefrontAPI.Maybe<Pick<StorefrontAPI.Metafield, 'value'>>;
      spread?: StorefrontAPI.Maybe<{
        reference?: StorefrontAPI.Maybe<
          | ({__typename: 'MediaImage'} & Pick<
              StorefrontAPI.MediaImage,
              'id' | 'mediaContentType' | 'alt'
            > & {
                image?: StorefrontAPI.Maybe<
                  Pick<StorefrontAPI.Image, 'id' | 'url' | 'width' | 'height'>
                >;
                previewImage?: StorefrontAPI.Maybe<
                  Pick<StorefrontAPI.Image, 'url'>
                >;
              })
          | ({__typename: 'Model3d'} & Pick<
              StorefrontAPI.Model3d,
              'id' | 'mediaContentType' | 'alt'
            > & {
                sources: Array<
                  Pick<StorefrontAPI.Model3dSource, 'mimeType' | 'url'>
                >;
                previewImage?: StorefrontAPI.Maybe<
                  Pick<StorefrontAPI.Image, 'url'>
                >;
              })
          | ({__typename: 'Video'} & Pick<
              StorefrontAPI.Video,
              'id' | 'mediaContentType' | 'alt'
            > & {
                sources: Array<
                  Pick<StorefrontAPI.VideoSource, 'mimeType' | 'url'>
                >;
                previewImage?: StorefrontAPI.Maybe<
                  Pick<StorefrontAPI.Image, 'url'>
                >;
              })
        >;
      }>;
      spreadSecondary?: StorefrontAPI.Maybe<{
        reference?: StorefrontAPI.Maybe<
          | ({__typename: 'MediaImage'} & Pick<
              StorefrontAPI.MediaImage,
              'id' | 'mediaContentType' | 'alt'
            > & {
                image?: StorefrontAPI.Maybe<
                  Pick<StorefrontAPI.Image, 'id' | 'url' | 'width' | 'height'>
                >;
                previewImage?: StorefrontAPI.Maybe<
                  Pick<StorefrontAPI.Image, 'url'>
                >;
              })
          | ({__typename: 'Model3d'} & Pick<
              StorefrontAPI.Model3d,
              'id' | 'mediaContentType' | 'alt'
            > & {
                sources: Array<
                  Pick<StorefrontAPI.Model3dSource, 'mimeType' | 'url'>
                >;
                previewImage?: StorefrontAPI.Maybe<
                  Pick<StorefrontAPI.Image, 'url'>
                >;
              })
          | ({__typename: 'Video'} & Pick<
              StorefrontAPI.Video,
              'id' | 'mediaContentType' | 'alt'
            > & {
                sources: Array<
                  Pick<StorefrontAPI.VideoSource, 'mimeType' | 'url'>
                >;
                previewImage?: StorefrontAPI.Maybe<
                  Pick<StorefrontAPI.Image, 'url'>
                >;
              })
        >;
      }>;
    }
  >;
  shop: Pick<StorefrontAPI.Shop, 'name' | 'description'>;
};

export type ProductInfoQueryVariables = StorefrontAPI.Exact<{
  country?: StorefrontAPI.InputMaybe<StorefrontAPI.CountryCode>;
  language?: StorefrontAPI.InputMaybe<StorefrontAPI.LanguageCode>;
  handle: StorefrontAPI.Scalars['String']['input'];
}>;

export type ProductInfoQuery = {
  product?: StorefrontAPI.Maybe<
    Pick<StorefrontAPI.Product, 'id' | 'title' | 'vendor' | 'handle'>
  >;
};

export type ProductQueryVariables = StorefrontAPI.Exact<{
  country?: StorefrontAPI.InputMaybe<StorefrontAPI.CountryCode>;
  language?: StorefrontAPI.InputMaybe<StorefrontAPI.LanguageCode>;
  handle: StorefrontAPI.Scalars['String']['input'];
  selectedOptions:
    | Array<StorefrontAPI.SelectedOptionInput>
    | StorefrontAPI.SelectedOptionInput;
}>;

export type ProductQuery = {
  product?: StorefrontAPI.Maybe<
    Pick<
      StorefrontAPI.Product,
      | 'id'
      | 'title'
      | 'vendor'
      | 'handle'
      | 'publishedAt'
      | 'descriptionHtml'
      | 'description'
    > & {summary: StorefrontAPI.Product['description']} & {
      options: Array<Pick<StorefrontAPI.ProductOption, 'name' | 'values'>>;
      selectedVariant?: StorefrontAPI.Maybe<
        Pick<
          StorefrontAPI.ProductVariant,
          'id' | 'availableForSale' | 'quantityAvailable' | 'sku' | 'title'
        > & {
          selectedOptions: Array<
            Pick<StorefrontAPI.SelectedOption, 'name' | 'value'>
          >;
          image?: StorefrontAPI.Maybe<
            Pick<
              StorefrontAPI.Image,
              'id' | 'url' | 'altText' | 'width' | 'height'
            >
          >;
          price: Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>;
          compareAtPrice?: StorefrontAPI.Maybe<
            Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>
          >;
          unitPrice?: StorefrontAPI.Maybe<
            Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>
          >;
          product: Pick<StorefrontAPI.Product, 'title' | 'handle'>;
        }
      >;
      media: {
        nodes: Array<
          | ({__typename: 'ExternalVideo'} & Pick<
              StorefrontAPI.ExternalVideo,
              'id' | 'embedUrl' | 'host' | 'mediaContentType' | 'alt'
            > & {
                previewImage?: StorefrontAPI.Maybe<
                  Pick<StorefrontAPI.Image, 'url'>
                >;
              })
          | ({__typename: 'MediaImage'} & Pick<
              StorefrontAPI.MediaImage,
              'id' | 'mediaContentType' | 'alt'
            > & {
                image?: StorefrontAPI.Maybe<
                  Pick<StorefrontAPI.Image, 'id' | 'url' | 'width' | 'height'>
                >;
                previewImage?: StorefrontAPI.Maybe<
                  Pick<StorefrontAPI.Image, 'url'>
                >;
              })
          | ({__typename: 'Model3d'} & Pick<
              StorefrontAPI.Model3d,
              'id' | 'mediaContentType' | 'alt'
            > & {
                sources: Array<
                  Pick<StorefrontAPI.Model3dSource, 'mimeType' | 'url'>
                >;
                previewImage?: StorefrontAPI.Maybe<
                  Pick<StorefrontAPI.Image, 'url'>
                >;
              })
          | ({__typename: 'Video'} & Pick<
              StorefrontAPI.Video,
              'id' | 'mediaContentType' | 'alt'
            > & {
                sources: Array<
                  Pick<StorefrontAPI.VideoSource, 'mimeType' | 'url'>
                >;
                previewImage?: StorefrontAPI.Maybe<
                  Pick<StorefrontAPI.Image, 'url'>
                >;
              })
        >;
      };
      variants: {
        nodes: Array<
          Pick<
            StorefrontAPI.ProductVariant,
            'id' | 'availableForSale' | 'quantityAvailable' | 'sku' | 'title'
          > & {
            selectedOptions: Array<
              Pick<StorefrontAPI.SelectedOption, 'name' | 'value'>
            >;
            image?: StorefrontAPI.Maybe<
              Pick<
                StorefrontAPI.Image,
                'id' | 'url' | 'altText' | 'width' | 'height'
              >
            >;
            price: Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>;
            compareAtPrice?: StorefrontAPI.Maybe<
              Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>
            >;
            unitPrice?: StorefrontAPI.Maybe<
              Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>
            >;
            product: Pick<StorefrontAPI.Product, 'title' | 'handle'>;
          }
        >;
      };
      seo: Pick<StorefrontAPI.Seo, 'description' | 'title'>;
    }
  >;
  shop: Pick<StorefrontAPI.Shop, 'name'> & {
    primaryDomain: Pick<StorefrontAPI.Domain, 'url'>;
    shippingPolicy?: StorefrontAPI.Maybe<
      Pick<StorefrontAPI.ShopPolicy, 'body' | 'handle'>
    >;
    refundPolicy?: StorefrontAPI.Maybe<
      Pick<StorefrontAPI.ShopPolicy, 'body' | 'handle'>
    >;
  };
};

export type ProductRecommendationsQueryVariables = StorefrontAPI.Exact<{
  productId: StorefrontAPI.Scalars['ID']['input'];
  count?: StorefrontAPI.InputMaybe<StorefrontAPI.Scalars['Int']['input']>;
  country?: StorefrontAPI.InputMaybe<StorefrontAPI.CountryCode>;
  language?: StorefrontAPI.InputMaybe<StorefrontAPI.LanguageCode>;
}>;

export type ProductRecommendationsQuery = {
  recommended?: StorefrontAPI.Maybe<
    Array<
      Pick<
        StorefrontAPI.Product,
        'id' | 'title' | 'publishedAt' | 'handle' | 'vendor'
      > & {
        variants: {
          nodes: Array<
            Pick<
              StorefrontAPI.ProductVariant,
              'id' | 'availableForSale' | 'sku'
            > & {
              image?: StorefrontAPI.Maybe<
                Pick<
                  StorefrontAPI.Image,
                  'url' | 'altText' | 'width' | 'height'
                >
              >;
              price: Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>;
              compareAtPrice?: StorefrontAPI.Maybe<
                Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>
              >;
              selectedOptions: Array<
                Pick<StorefrontAPI.SelectedOption, 'name' | 'value'>
              >;
              product: Pick<StorefrontAPI.Product, 'handle' | 'title'>;
            }
          >;
        };
      }
    >
  >;
  additional: {
    nodes: Array<
      Pick<
        StorefrontAPI.Product,
        'id' | 'title' | 'publishedAt' | 'handle' | 'vendor'
      > & {
        variants: {
          nodes: Array<
            Pick<
              StorefrontAPI.ProductVariant,
              'id' | 'availableForSale' | 'sku'
            > & {
              image?: StorefrontAPI.Maybe<
                Pick<
                  StorefrontAPI.Image,
                  'url' | 'altText' | 'width' | 'height'
                >
              >;
              price: Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>;
              compareAtPrice?: StorefrontAPI.Maybe<
                Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>
              >;
              selectedOptions: Array<
                Pick<StorefrontAPI.SelectedOption, 'name' | 'value'>
              >;
              product: Pick<StorefrontAPI.Product, 'handle' | 'title'>;
            }
          >;
        };
      }
    >;
  };
};

export type CollectionInfoQueryVariables = StorefrontAPI.Exact<{
  handle: StorefrontAPI.Scalars['String']['input'];
  country?: StorefrontAPI.InputMaybe<StorefrontAPI.CountryCode>;
  language?: StorefrontAPI.InputMaybe<StorefrontAPI.LanguageCode>;
}>;

export type CollectionInfoQuery = {
  collection?: StorefrontAPI.Maybe<
    Pick<
      StorefrontAPI.Collection,
      'id' | 'handle' | 'title' | 'description'
    > & {
      seo: Pick<StorefrontAPI.Seo, 'description' | 'title'>;
      image?: StorefrontAPI.Maybe<
        Pick<StorefrontAPI.Image, 'id' | 'url' | 'width' | 'height' | 'altText'>
      >;
    }
  >;
};

export type CollectionDetailsQueryVariables = StorefrontAPI.Exact<{
  handle: StorefrontAPI.Scalars['String']['input'];
  country?: StorefrontAPI.InputMaybe<StorefrontAPI.CountryCode>;
  language?: StorefrontAPI.InputMaybe<StorefrontAPI.LanguageCode>;
  filters?: StorefrontAPI.InputMaybe<
    Array<StorefrontAPI.ProductFilter> | StorefrontAPI.ProductFilter
  >;
  sortKey: StorefrontAPI.ProductCollectionSortKeys;
  reverse?: StorefrontAPI.InputMaybe<StorefrontAPI.Scalars['Boolean']['input']>;
  first?: StorefrontAPI.InputMaybe<StorefrontAPI.Scalars['Int']['input']>;
  last?: StorefrontAPI.InputMaybe<StorefrontAPI.Scalars['Int']['input']>;
  startCursor?: StorefrontAPI.InputMaybe<
    StorefrontAPI.Scalars['String']['input']
  >;
  endCursor?: StorefrontAPI.InputMaybe<
    StorefrontAPI.Scalars['String']['input']
  >;
}>;

export type CollectionDetailsQuery = {
  collection?: StorefrontAPI.Maybe<
    Pick<
      StorefrontAPI.Collection,
      'id' | 'handle' | 'title' | 'description'
    > & {
      seo: Pick<StorefrontAPI.Seo, 'description' | 'title'>;
      image?: StorefrontAPI.Maybe<
        Pick<StorefrontAPI.Image, 'id' | 'url' | 'width' | 'height' | 'altText'>
      >;
      products: {
        filters: Array<
          Pick<StorefrontAPI.Filter, 'id' | 'label' | 'type'> & {
            values: Array<
              Pick<
                StorefrontAPI.FilterValue,
                'id' | 'label' | 'count' | 'input'
              >
            >;
          }
        >;
        nodes: Array<
          Pick<
            StorefrontAPI.Product,
            'id' | 'title' | 'publishedAt' | 'handle' | 'vendor'
          > & {
            variants: {
              nodes: Array<
                Pick<
                  StorefrontAPI.ProductVariant,
                  'id' | 'availableForSale' | 'sku'
                > & {
                  image?: StorefrontAPI.Maybe<
                    Pick<
                      StorefrontAPI.Image,
                      'url' | 'altText' | 'width' | 'height'
                    >
                  >;
                  price: Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>;
                  compareAtPrice?: StorefrontAPI.Maybe<
                    Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>
                  >;
                  selectedOptions: Array<
                    Pick<StorefrontAPI.SelectedOption, 'name' | 'value'>
                  >;
                  product: Pick<StorefrontAPI.Product, 'handle' | 'title'>;
                }
              >;
            };
          }
        >;
        pageInfo: Pick<
          StorefrontAPI.PageInfo,
          'hasPreviousPage' | 'hasNextPage' | 'endCursor' | 'startCursor'
        >;
      };
    }
  >;
  collections: {
    edges: Array<{node: Pick<StorefrontAPI.Collection, 'title' | 'handle'>}>;
  };
};

export type CollectionsQueryVariables = StorefrontAPI.Exact<{
  country?: StorefrontAPI.InputMaybe<StorefrontAPI.CountryCode>;
  language?: StorefrontAPI.InputMaybe<StorefrontAPI.LanguageCode>;
  first?: StorefrontAPI.InputMaybe<StorefrontAPI.Scalars['Int']['input']>;
  last?: StorefrontAPI.InputMaybe<StorefrontAPI.Scalars['Int']['input']>;
  startCursor?: StorefrontAPI.InputMaybe<
    StorefrontAPI.Scalars['String']['input']
  >;
  endCursor?: StorefrontAPI.InputMaybe<
    StorefrontAPI.Scalars['String']['input']
  >;
}>;

export type CollectionsQuery = {
  collections: {
    nodes: Array<
      Pick<
        StorefrontAPI.Collection,
        'id' | 'title' | 'description' | 'handle'
      > & {
        seo: Pick<StorefrontAPI.Seo, 'description' | 'title'>;
        image?: StorefrontAPI.Maybe<
          Pick<
            StorefrontAPI.Image,
            'id' | 'url' | 'width' | 'height' | 'altText'
          >
        >;
      }
    >;
    pageInfo: Pick<
      StorefrontAPI.PageInfo,
      'hasPreviousPage' | 'hasNextPage' | 'startCursor' | 'endCursor'
    >;
  };
};

export type PaginatedProductsSearchQueryVariables = StorefrontAPI.Exact<{
  country?: StorefrontAPI.InputMaybe<StorefrontAPI.CountryCode>;
  endCursor?: StorefrontAPI.InputMaybe<
    StorefrontAPI.Scalars['String']['input']
  >;
  first?: StorefrontAPI.InputMaybe<StorefrontAPI.Scalars['Int']['input']>;
  language?: StorefrontAPI.InputMaybe<StorefrontAPI.LanguageCode>;
  last?: StorefrontAPI.InputMaybe<StorefrontAPI.Scalars['Int']['input']>;
  searchTerm?: StorefrontAPI.InputMaybe<
    StorefrontAPI.Scalars['String']['input']
  >;
  startCursor?: StorefrontAPI.InputMaybe<
    StorefrontAPI.Scalars['String']['input']
  >;
}>;

export type PaginatedProductsSearchQuery = {
  products: {
    nodes: Array<
      Pick<
        StorefrontAPI.Product,
        'id' | 'title' | 'publishedAt' | 'handle' | 'vendor'
      > & {
        variants: {
          nodes: Array<
            Pick<
              StorefrontAPI.ProductVariant,
              'id' | 'availableForSale' | 'sku'
            > & {
              image?: StorefrontAPI.Maybe<
                Pick<
                  StorefrontAPI.Image,
                  'url' | 'altText' | 'width' | 'height'
                >
              >;
              price: Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>;
              compareAtPrice?: StorefrontAPI.Maybe<
                Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>
              >;
              selectedOptions: Array<
                Pick<StorefrontAPI.SelectedOption, 'name' | 'value'>
              >;
              product: Pick<StorefrontAPI.Product, 'handle' | 'title'>;
            }
          >;
        };
      }
    >;
    pageInfo: Pick<
      StorefrontAPI.PageInfo,
      'startCursor' | 'endCursor' | 'hasNextPage' | 'hasPreviousPage'
    >;
  };
};

export type BlogQueryVariables = StorefrontAPI.Exact<{
  language?: StorefrontAPI.InputMaybe<StorefrontAPI.LanguageCode>;
  blogHandle: StorefrontAPI.Scalars['String']['input'];
  pageBy: StorefrontAPI.Scalars['Int']['input'];
  cursor?: StorefrontAPI.InputMaybe<StorefrontAPI.Scalars['String']['input']>;
}>;

export type BlogQuery = {
  blog?: StorefrontAPI.Maybe<
    Pick<StorefrontAPI.Blog, 'title' | 'handle'> & {
      seo?: StorefrontAPI.Maybe<
        Pick<StorefrontAPI.Seo, 'title' | 'description'>
      >;
      articles: {
        edges: Array<{
          node: Pick<
            StorefrontAPI.Article,
            | 'contentHtml'
            | 'excerpt'
            | 'excerptHtml'
            | 'handle'
            | 'id'
            | 'publishedAt'
            | 'title'
          > & {
            author?: StorefrontAPI.Maybe<
              Pick<StorefrontAPI.ArticleAuthor, 'name'>
            >;
            image?: StorefrontAPI.Maybe<
              Pick<
                StorefrontAPI.Image,
                'id' | 'altText' | 'url' | 'width' | 'height'
              >
            >;
          };
        }>;
      };
    }
  >;
};

export type ArticleFragment = Pick<
  StorefrontAPI.Article,
  | 'contentHtml'
  | 'excerpt'
  | 'excerptHtml'
  | 'handle'
  | 'id'
  | 'publishedAt'
  | 'title'
> & {
  author?: StorefrontAPI.Maybe<Pick<StorefrontAPI.ArticleAuthor, 'name'>>;
  image?: StorefrontAPI.Maybe<
    Pick<StorefrontAPI.Image, 'id' | 'altText' | 'url' | 'width' | 'height'>
  >;
};

export type ArticleDetailsQueryVariables = StorefrontAPI.Exact<{
  language?: StorefrontAPI.InputMaybe<StorefrontAPI.LanguageCode>;
  blogHandle: StorefrontAPI.Scalars['String']['input'];
  articleHandle: StorefrontAPI.Scalars['String']['input'];
}>;

export type ArticleDetailsQuery = {
  blog?: StorefrontAPI.Maybe<{
    articleByHandle?: StorefrontAPI.Maybe<
      Pick<
        StorefrontAPI.Article,
        'title' | 'contentHtml' | 'publishedAt' | 'tags'
      > & {
        author?: StorefrontAPI.Maybe<Pick<StorefrontAPI.ArticleAuthor, 'name'>>;
        image?: StorefrontAPI.Maybe<
          Pick<
            StorefrontAPI.Image,
            'id' | 'altText' | 'url' | 'width' | 'height'
          >
        >;
        seo?: StorefrontAPI.Maybe<
          Pick<StorefrontAPI.Seo, 'description' | 'title'>
        >;
      }
    >;
    articles: {
      nodes: Array<
        Pick<
          StorefrontAPI.Article,
          | 'contentHtml'
          | 'excerpt'
          | 'excerptHtml'
          | 'handle'
          | 'id'
          | 'publishedAt'
          | 'title'
        > & {
          author?: StorefrontAPI.Maybe<
            Pick<StorefrontAPI.ArticleAuthor, 'name'>
          >;
          image?: StorefrontAPI.Maybe<
            Pick<
              StorefrontAPI.Image,
              'id' | 'altText' | 'url' | 'width' | 'height'
            >
          >;
        }
      >;
    };
  }>;
};

export type AllProductsQueryVariables = StorefrontAPI.Exact<{
  country?: StorefrontAPI.InputMaybe<StorefrontAPI.CountryCode>;
  language?: StorefrontAPI.InputMaybe<StorefrontAPI.LanguageCode>;
  first?: StorefrontAPI.InputMaybe<StorefrontAPI.Scalars['Int']['input']>;
  last?: StorefrontAPI.InputMaybe<StorefrontAPI.Scalars['Int']['input']>;
  startCursor?: StorefrontAPI.InputMaybe<
    StorefrontAPI.Scalars['String']['input']
  >;
  endCursor?: StorefrontAPI.InputMaybe<
    StorefrontAPI.Scalars['String']['input']
  >;
}>;

export type AllProductsQuery = {
  products: {
    nodes: Array<
      Pick<
        StorefrontAPI.Product,
        'id' | 'title' | 'publishedAt' | 'handle' | 'vendor'
      > & {
        variants: {
          nodes: Array<
            Pick<
              StorefrontAPI.ProductVariant,
              'id' | 'availableForSale' | 'sku'
            > & {
              image?: StorefrontAPI.Maybe<
                Pick<
                  StorefrontAPI.Image,
                  'url' | 'altText' | 'width' | 'height'
                >
              >;
              price: Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>;
              compareAtPrice?: StorefrontAPI.Maybe<
                Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>
              >;
              selectedOptions: Array<
                Pick<StorefrontAPI.SelectedOption, 'name' | 'value'>
              >;
              product: Pick<StorefrontAPI.Product, 'handle' | 'title'>;
            }
          >;
        };
      }
    >;
    pageInfo: Pick<
      StorefrontAPI.PageInfo,
      'hasPreviousPage' | 'hasNextPage' | 'startCursor' | 'endCursor'
    >;
  };
};

export type VariantsQueryVariables = StorefrontAPI.Exact<{
  country?: StorefrontAPI.InputMaybe<StorefrontAPI.CountryCode>;
  language?: StorefrontAPI.InputMaybe<StorefrontAPI.LanguageCode>;
  handle: StorefrontAPI.Scalars['String']['input'];
}>;

export type VariantsQuery = {
  product?: StorefrontAPI.Maybe<{
    variants: {
      nodes: Array<
        Pick<
          StorefrontAPI.ProductVariant,
          'id' | 'availableForSale' | 'quantityAvailable' | 'sku' | 'title'
        > & {
          selectedOptions: Array<
            Pick<StorefrontAPI.SelectedOption, 'name' | 'value'>
          >;
          image?: StorefrontAPI.Maybe<
            Pick<
              StorefrontAPI.Image,
              'id' | 'url' | 'altText' | 'width' | 'height'
            >
          >;
          price: Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>;
          compareAtPrice?: StorefrontAPI.Maybe<
            Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>
          >;
          unitPrice?: StorefrontAPI.Maybe<
            Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>
          >;
          product: Pick<StorefrontAPI.Product, 'title' | 'handle'>;
        }
      >;
    };
  }>;
};

export type GetCollectionByHandleQueryVariables = StorefrontAPI.Exact<{
  handle: StorefrontAPI.Scalars['String']['input'];
}>;

export type GetCollectionByHandleQuery = {
  collectionByHandle?: StorefrontAPI.Maybe<
    Pick<StorefrontAPI.Collection, 'id' | 'title' | 'handle'> & {
      image?: StorefrontAPI.Maybe<Pick<StorefrontAPI.Image, 'url' | 'altText'>>;
      products: {
        nodes: Array<
          Pick<
            StorefrontAPI.Product,
            'id' | 'title' | 'handle' | 'tags' | 'descriptionHtml'
          > & {
            priceRange: {
              minVariantPrice: Pick<
                StorefrontAPI.MoneyV2,
                'amount' | 'currencyCode'
              >;
            };
            compareAtPriceRange: {
              minVariantPrice: Pick<
                StorefrontAPI.MoneyV2,
                'amount' | 'currencyCode'
              >;
            };
            images: {
              nodes: Array<Pick<StorefrontAPI.Image, 'url' | 'altText'>>;
            };
            variants: {
              nodes: Array<
                Pick<
                  StorefrontAPI.ProductVariant,
                  'id' | 'availableForSale'
                > & {
                  price: Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>;
                  compareAtPrice?: StorefrontAPI.Maybe<
                    Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>
                  >;
                  selectedOptions: Array<
                    Pick<StorefrontAPI.SelectedOption, 'name' | 'value'>
                  >;
                }
              >;
            };
          }
        >;
      };
    }
  >;
};

export type GetHomepageCollectionByHandleQueryVariables = StorefrontAPI.Exact<{
  handle: StorefrontAPI.Scalars['String']['input'];
}>;

export type GetHomepageCollectionByHandleQuery = {
  collectionByHandle?: StorefrontAPI.Maybe<
    Pick<StorefrontAPI.Collection, 'id' | 'title' | 'handle'> & {
      image?: StorefrontAPI.Maybe<Pick<StorefrontAPI.Image, 'url' | 'altText'>>;
      products: {
        nodes: Array<
          Pick<StorefrontAPI.Product, 'id' | 'title' | 'handle' | 'tags'> & {
            images: {
              nodes: Array<Pick<StorefrontAPI.Image, 'url' | 'altText'>>;
            };
            variants: {
              nodes: Array<
                Pick<
                  StorefrontAPI.ProductVariant,
                  'id' | 'title' | 'availableForSale'
                > & {
                  price: Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>;
                  compareAtPrice?: StorefrontAPI.Maybe<
                    Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>
                  >;
                  selectedOptions: Array<
                    Pick<StorefrontAPI.SelectedOption, 'name' | 'value'>
                  >;
                  image?: StorefrontAPI.Maybe<
                    Pick<StorefrontAPI.Image, 'url' | 'altText'>
                  >;
                }
              >;
            };
          }
        >;
      };
    }
  >;
};

export type GetHomepageCollectionMobileByHandleQueryVariables =
  StorefrontAPI.Exact<{
    handle: StorefrontAPI.Scalars['String']['input'];
  }>;

export type GetHomepageCollectionMobileByHandleQuery = {
  collectionByHandle?: StorefrontAPI.Maybe<
    Pick<StorefrontAPI.Collection, 'id' | 'title' | 'handle'> & {
      image?: StorefrontAPI.Maybe<Pick<StorefrontAPI.Image, 'url' | 'altText'>>;
      products: {
        nodes: Array<
          Pick<StorefrontAPI.Product, 'id' | 'title' | 'handle' | 'tags'> & {
            images: {
              nodes: Array<Pick<StorefrontAPI.Image, 'url' | 'altText'>>;
            };
            variants: {
              nodes: Array<
                Pick<
                  StorefrontAPI.ProductVariant,
                  'id' | 'title' | 'availableForSale'
                > & {
                  price: Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>;
                  compareAtPrice?: StorefrontAPI.Maybe<
                    Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>
                  >;
                  selectedOptions: Array<
                    Pick<StorefrontAPI.SelectedOption, 'name' | 'value'>
                  >;
                  image?: StorefrontAPI.Maybe<
                    Pick<StorefrontAPI.Image, 'url' | 'altText'>
                  >;
                }
              >;
            };
          }
        >;
      };
    }
  >;
};

export type GetHomeProductByHandleQueryVariables = StorefrontAPI.Exact<{
  handle: StorefrontAPI.Scalars['String']['input'];
}>;

export type GetHomeProductByHandleQuery = {
  product?: StorefrontAPI.Maybe<
    Pick<
      StorefrontAPI.Product,
      'id' | 'title' | 'handle' | 'descriptionHtml' | 'tags'
    > & {
      images: {nodes: Array<Pick<StorefrontAPI.Image, 'url' | 'altText'>>};
      variants: {
        nodes: Array<
          Pick<StorefrontAPI.ProductVariant, 'id' | 'availableForSale'> & {
            price: Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>;
            compareAtPrice?: StorefrontAPI.Maybe<
              Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>
            >;
            selectedOptions: Array<
              Pick<StorefrontAPI.SelectedOption, 'name' | 'value'>
            >;
            image?: StorefrontAPI.Maybe<
              Pick<StorefrontAPI.Image, 'url' | 'altText'>
            >;
          }
        >;
      };
    }
  >;
};

export type GetHomeProductMobileByHandleQueryVariables = StorefrontAPI.Exact<{
  handle: StorefrontAPI.Scalars['String']['input'];
}>;

export type GetHomeProductMobileByHandleQuery = {
  product?: StorefrontAPI.Maybe<
    Pick<
      StorefrontAPI.Product,
      'id' | 'title' | 'handle' | 'descriptionHtml' | 'tags'
    > & {
      images: {nodes: Array<Pick<StorefrontAPI.Image, 'url' | 'altText'>>};
      variants: {
        nodes: Array<
          Pick<StorefrontAPI.ProductVariant, 'id' | 'availableForSale'> & {
            price: Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>;
            compareAtPrice?: StorefrontAPI.Maybe<
              Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>
            >;
            selectedOptions: Array<
              Pick<StorefrontAPI.SelectedOption, 'name' | 'value'>
            >;
            image?: StorefrontAPI.Maybe<
              Pick<StorefrontAPI.Image, 'url' | 'altText'>
            >;
          }
        >;
      };
    }
  >;
};

export type GetSimpleCollectionQueryVariables = StorefrontAPI.Exact<{
  handle: StorefrontAPI.Scalars['String']['input'];
}>;

export type GetSimpleCollectionQuery = {
  collectionByHandle?: StorefrontAPI.Maybe<
    Pick<StorefrontAPI.Collection, 'id' | 'title' | 'handle'> & {
      image?: StorefrontAPI.Maybe<Pick<StorefrontAPI.Image, 'url' | 'altText'>>;
      products: {nodes: Array<Pick<StorefrontAPI.Product, 'id'>>};
    }
  >;
};

export type LibCartLineFragment = Pick<
  StorefrontAPI.CartLine,
  'id' | 'quantity'
> & {
  attributes: Array<Pick<StorefrontAPI.Attribute, 'key' | 'value'>>;
  cost: {
    totalAmount: Pick<StorefrontAPI.MoneyV2, 'currencyCode' | 'amount'>;
    amountPerQuantity: Pick<StorefrontAPI.MoneyV2, 'currencyCode' | 'amount'>;
    compareAtAmountPerQuantity?: StorefrontAPI.Maybe<
      Pick<StorefrontAPI.MoneyV2, 'currencyCode' | 'amount'>
    >;
  };
  merchandise: Pick<
    StorefrontAPI.ProductVariant,
    'id' | 'availableForSale' | 'requiresShipping' | 'title'
  > & {
    compareAtPrice?: StorefrontAPI.Maybe<
      Pick<StorefrontAPI.MoneyV2, 'currencyCode' | 'amount'>
    >;
    price: Pick<StorefrontAPI.MoneyV2, 'currencyCode' | 'amount'>;
    image?: StorefrontAPI.Maybe<
      Pick<StorefrontAPI.Image, 'id' | 'url' | 'altText' | 'width' | 'height'>
    >;
    product: Pick<StorefrontAPI.Product, 'handle' | 'title' | 'id' | 'vendor'>;
    selectedOptions: Array<
      Pick<StorefrontAPI.SelectedOption, 'name' | 'value'>
    >;
  };
};

export type LibCartApiQueryFragment = Pick<
  StorefrontAPI.Cart,
  'updatedAt' | 'id' | 'checkoutUrl' | 'totalQuantity' | 'note'
> & {
  appliedGiftCards: Array<
    Pick<StorefrontAPI.AppliedGiftCard, 'lastCharacters'> & {
      amountUsed: Pick<StorefrontAPI.MoneyV2, 'currencyCode' | 'amount'>;
    }
  >;
  buyerIdentity: Pick<
    StorefrontAPI.CartBuyerIdentity,
    'countryCode' | 'email' | 'phone'
  > & {
    customer?: StorefrontAPI.Maybe<
      Pick<
        StorefrontAPI.Customer,
        'id' | 'email' | 'firstName' | 'lastName' | 'displayName'
      >
    >;
  };
  lines: {
    nodes: Array<
      Pick<StorefrontAPI.CartLine, 'id' | 'quantity'> & {
        attributes: Array<Pick<StorefrontAPI.Attribute, 'key' | 'value'>>;
        cost: {
          totalAmount: Pick<StorefrontAPI.MoneyV2, 'currencyCode' | 'amount'>;
          amountPerQuantity: Pick<
            StorefrontAPI.MoneyV2,
            'currencyCode' | 'amount'
          >;
          compareAtAmountPerQuantity?: StorefrontAPI.Maybe<
            Pick<StorefrontAPI.MoneyV2, 'currencyCode' | 'amount'>
          >;
        };
        merchandise: Pick<
          StorefrontAPI.ProductVariant,
          'id' | 'availableForSale' | 'requiresShipping' | 'title'
        > & {
          compareAtPrice?: StorefrontAPI.Maybe<
            Pick<StorefrontAPI.MoneyV2, 'currencyCode' | 'amount'>
          >;
          price: Pick<StorefrontAPI.MoneyV2, 'currencyCode' | 'amount'>;
          image?: StorefrontAPI.Maybe<
            Pick<
              StorefrontAPI.Image,
              'id' | 'url' | 'altText' | 'width' | 'height'
            >
          >;
          product: Pick<
            StorefrontAPI.Product,
            'handle' | 'title' | 'id' | 'vendor'
          >;
          selectedOptions: Array<
            Pick<StorefrontAPI.SelectedOption, 'name' | 'value'>
          >;
        };
      }
    >;
  };
  cost: {
    subtotalAmount: Pick<StorefrontAPI.MoneyV2, 'currencyCode' | 'amount'>;
    totalAmount: Pick<StorefrontAPI.MoneyV2, 'currencyCode' | 'amount'>;
    totalDutyAmount?: StorefrontAPI.Maybe<
      Pick<StorefrontAPI.MoneyV2, 'currencyCode' | 'amount'>
    >;
    totalTaxAmount?: StorefrontAPI.Maybe<
      Pick<StorefrontAPI.MoneyV2, 'currencyCode' | 'amount'>
    >;
  };
  attributes: Array<Pick<StorefrontAPI.Attribute, 'key' | 'value'>>;
  discountCodes: Array<
    Pick<StorefrontAPI.CartDiscountCode, 'code' | 'applicable'>
  >;
};

export type MenuItemFragment = Pick<
  StorefrontAPI.MenuItem,
  'id' | 'resourceId' | 'tags' | 'title' | 'type' | 'url'
> & {
  resource?: StorefrontAPI.Maybe<
    {__typename: 'Collection'} & Pick<
      StorefrontAPI.Collection,
      'id' | 'handle' | 'title'
    > & {
        image?: StorefrontAPI.Maybe<
          Pick<StorefrontAPI.Image, 'src' | 'url' | 'altText'>
        >;
      }
  >;
};

export type LeafMenuItemFragment = Pick<
  StorefrontAPI.MenuItem,
  'id' | 'resourceId' | 'tags' | 'title' | 'type' | 'url'
> & {
  resource?: StorefrontAPI.Maybe<
    {__typename: 'Collection'} & Pick<
      StorefrontAPI.Collection,
      'id' | 'handle' | 'title'
    > & {
        image?: StorefrontAPI.Maybe<
          Pick<StorefrontAPI.Image, 'src' | 'url' | 'altText'>
        >;
      }
  >;
};

export type GrandChildMenuItemFragment = Pick<
  StorefrontAPI.MenuItem,
  'id' | 'resourceId' | 'tags' | 'title' | 'type' | 'url'
> & {
  items: Array<
    Pick<
      StorefrontAPI.MenuItem,
      'id' | 'resourceId' | 'tags' | 'title' | 'type' | 'url'
    > & {
      resource?: StorefrontAPI.Maybe<
        {__typename: 'Collection'} & Pick<
          StorefrontAPI.Collection,
          'id' | 'handle' | 'title'
        > & {
            image?: StorefrontAPI.Maybe<
              Pick<StorefrontAPI.Image, 'src' | 'url' | 'altText'>
            >;
          }
      >;
    }
  >;
  resource?: StorefrontAPI.Maybe<
    {__typename: 'Collection'} & Pick<
      StorefrontAPI.Collection,
      'id' | 'handle' | 'title'
    > & {
        image?: StorefrontAPI.Maybe<
          Pick<StorefrontAPI.Image, 'src' | 'url' | 'altText'>
        >;
      }
  >;
};

export type ChildMenuItemFragment = Pick<
  StorefrontAPI.MenuItem,
  'id' | 'resourceId' | 'tags' | 'title' | 'type' | 'url'
> & {
  items: Array<
    Pick<
      StorefrontAPI.MenuItem,
      'id' | 'resourceId' | 'tags' | 'title' | 'type' | 'url'
    > & {
      items: Array<
        Pick<
          StorefrontAPI.MenuItem,
          'id' | 'resourceId' | 'tags' | 'title' | 'type' | 'url'
        > & {
          resource?: StorefrontAPI.Maybe<
            {__typename: 'Collection'} & Pick<
              StorefrontAPI.Collection,
              'id' | 'handle' | 'title'
            > & {
                image?: StorefrontAPI.Maybe<
                  Pick<StorefrontAPI.Image, 'src' | 'url' | 'altText'>
                >;
              }
          >;
        }
      >;
      resource?: StorefrontAPI.Maybe<
        {__typename: 'Collection'} & Pick<
          StorefrontAPI.Collection,
          'id' | 'handle' | 'title'
        > & {
            image?: StorefrontAPI.Maybe<
              Pick<StorefrontAPI.Image, 'src' | 'url' | 'altText'>
            >;
          }
      >;
    }
  >;
  resource?: StorefrontAPI.Maybe<
    {__typename: 'Collection'} & Pick<
      StorefrontAPI.Collection,
      'id' | 'handle' | 'title'
    > & {
        image?: StorefrontAPI.Maybe<
          Pick<StorefrontAPI.Image, 'src' | 'url' | 'altText'>
        >;
      }
  >;
};

export type ParentMenuItemFragment = Pick<
  StorefrontAPI.MenuItem,
  'id' | 'resourceId' | 'tags' | 'title' | 'type' | 'url'
> & {
  items: Array<
    Pick<
      StorefrontAPI.MenuItem,
      'id' | 'resourceId' | 'tags' | 'title' | 'type' | 'url'
    > & {
      items: Array<
        Pick<
          StorefrontAPI.MenuItem,
          'id' | 'resourceId' | 'tags' | 'title' | 'type' | 'url'
        > & {
          items: Array<
            Pick<
              StorefrontAPI.MenuItem,
              'id' | 'resourceId' | 'tags' | 'title' | 'type' | 'url'
            > & {
              resource?: StorefrontAPI.Maybe<
                {__typename: 'Collection'} & Pick<
                  StorefrontAPI.Collection,
                  'id' | 'handle' | 'title'
                > & {
                    image?: StorefrontAPI.Maybe<
                      Pick<StorefrontAPI.Image, 'src' | 'url' | 'altText'>
                    >;
                  }
              >;
            }
          >;
          resource?: StorefrontAPI.Maybe<
            {__typename: 'Collection'} & Pick<
              StorefrontAPI.Collection,
              'id' | 'handle' | 'title'
            > & {
                image?: StorefrontAPI.Maybe<
                  Pick<StorefrontAPI.Image, 'src' | 'url' | 'altText'>
                >;
              }
          >;
        }
      >;
      resource?: StorefrontAPI.Maybe<
        {__typename: 'Collection'} & Pick<
          StorefrontAPI.Collection,
          'id' | 'handle' | 'title'
        > & {
            image?: StorefrontAPI.Maybe<
              Pick<StorefrontAPI.Image, 'src' | 'url' | 'altText'>
            >;
          }
      >;
    }
  >;
  resource?: StorefrontAPI.Maybe<
    {__typename: 'Collection'} & Pick<
      StorefrontAPI.Collection,
      'id' | 'handle' | 'title'
    > & {
        image?: StorefrontAPI.Maybe<
          Pick<StorefrontAPI.Image, 'src' | 'url' | 'altText'>
        >;
      }
  >;
};

export type MenuFragment = Pick<StorefrontAPI.Menu, 'id'> & {
  items: Array<
    Pick<
      StorefrontAPI.MenuItem,
      'id' | 'resourceId' | 'tags' | 'title' | 'type' | 'url'
    > & {
      items: Array<
        Pick<
          StorefrontAPI.MenuItem,
          'id' | 'resourceId' | 'tags' | 'title' | 'type' | 'url'
        > & {
          items: Array<
            Pick<
              StorefrontAPI.MenuItem,
              'id' | 'resourceId' | 'tags' | 'title' | 'type' | 'url'
            > & {
              items: Array<
                Pick<
                  StorefrontAPI.MenuItem,
                  'id' | 'resourceId' | 'tags' | 'title' | 'type' | 'url'
                > & {
                  resource?: StorefrontAPI.Maybe<
                    {__typename: 'Collection'} & Pick<
                      StorefrontAPI.Collection,
                      'id' | 'handle' | 'title'
                    > & {
                        image?: StorefrontAPI.Maybe<
                          Pick<StorefrontAPI.Image, 'src' | 'url' | 'altText'>
                        >;
                      }
                  >;
                }
              >;
              resource?: StorefrontAPI.Maybe<
                {__typename: 'Collection'} & Pick<
                  StorefrontAPI.Collection,
                  'id' | 'handle' | 'title'
                > & {
                    image?: StorefrontAPI.Maybe<
                      Pick<StorefrontAPI.Image, 'src' | 'url' | 'altText'>
                    >;
                  }
              >;
            }
          >;
          resource?: StorefrontAPI.Maybe<
            {__typename: 'Collection'} & Pick<
              StorefrontAPI.Collection,
              'id' | 'handle' | 'title'
            > & {
                image?: StorefrontAPI.Maybe<
                  Pick<StorefrontAPI.Image, 'src' | 'url' | 'altText'>
                >;
              }
          >;
        }
      >;
      resource?: StorefrontAPI.Maybe<
        {__typename: 'Collection'} & Pick<
          StorefrontAPI.Collection,
          'id' | 'handle' | 'title'
        > & {
            image?: StorefrontAPI.Maybe<
              Pick<StorefrontAPI.Image, 'src' | 'url' | 'altText'>
            >;
          }
      >;
    }
  >;
};

export type ShopFragment = Pick<
  StorefrontAPI.Shop,
  'id' | 'name' | 'description'
> & {
  primaryDomain: Pick<StorefrontAPI.Domain, 'url'>;
  brand?: StorefrontAPI.Maybe<{
    logo?: StorefrontAPI.Maybe<{
      image?: StorefrontAPI.Maybe<Pick<StorefrontAPI.Image, 'url'>>;
    }>;
  }>;
};

export type HeaderQueryVariables = StorefrontAPI.Exact<{
  country?: StorefrontAPI.InputMaybe<StorefrontAPI.CountryCode>;
  headerMenuHandle: StorefrontAPI.Scalars['String']['input'];
  language?: StorefrontAPI.InputMaybe<StorefrontAPI.LanguageCode>;
}>;

export type HeaderQuery = {
  shop: Pick<StorefrontAPI.Shop, 'id' | 'name' | 'description'> & {
    primaryDomain: Pick<StorefrontAPI.Domain, 'url'>;
    brand?: StorefrontAPI.Maybe<{
      logo?: StorefrontAPI.Maybe<{
        image?: StorefrontAPI.Maybe<Pick<StorefrontAPI.Image, 'url'>>;
      }>;
    }>;
  };
  menu?: StorefrontAPI.Maybe<
    Pick<StorefrontAPI.Menu, 'id'> & {
      items: Array<
        Pick<
          StorefrontAPI.MenuItem,
          'id' | 'resourceId' | 'tags' | 'title' | 'type' | 'url'
        > & {
          items: Array<
            Pick<
              StorefrontAPI.MenuItem,
              'id' | 'resourceId' | 'tags' | 'title' | 'type' | 'url'
            > & {
              items: Array<
                Pick<
                  StorefrontAPI.MenuItem,
                  'id' | 'resourceId' | 'tags' | 'title' | 'type' | 'url'
                > & {
                  items: Array<
                    Pick<
                      StorefrontAPI.MenuItem,
                      'id' | 'resourceId' | 'tags' | 'title' | 'type' | 'url'
                    > & {
                      resource?: StorefrontAPI.Maybe<
                        {__typename: 'Collection'} & Pick<
                          StorefrontAPI.Collection,
                          'id' | 'handle' | 'title'
                        > & {
                            image?: StorefrontAPI.Maybe<
                              Pick<
                                StorefrontAPI.Image,
                                'src' | 'url' | 'altText'
                              >
                            >;
                          }
                      >;
                    }
                  >;
                  resource?: StorefrontAPI.Maybe<
                    {__typename: 'Collection'} & Pick<
                      StorefrontAPI.Collection,
                      'id' | 'handle' | 'title'
                    > & {
                        image?: StorefrontAPI.Maybe<
                          Pick<StorefrontAPI.Image, 'src' | 'url' | 'altText'>
                        >;
                      }
                  >;
                }
              >;
              resource?: StorefrontAPI.Maybe<
                {__typename: 'Collection'} & Pick<
                  StorefrontAPI.Collection,
                  'id' | 'handle' | 'title'
                > & {
                    image?: StorefrontAPI.Maybe<
                      Pick<StorefrontAPI.Image, 'src' | 'url' | 'altText'>
                    >;
                  }
              >;
            }
          >;
          resource?: StorefrontAPI.Maybe<
            {__typename: 'Collection'} & Pick<
              StorefrontAPI.Collection,
              'id' | 'handle' | 'title'
            > & {
                image?: StorefrontAPI.Maybe<
                  Pick<StorefrontAPI.Image, 'src' | 'url' | 'altText'>
                >;
              }
          >;
        }
      >;
    }
  >;
};

export type FooterQueryVariables = StorefrontAPI.Exact<{
  shopMenuHandle: StorefrontAPI.Scalars['String']['input'];
  policiesMenuHandle: StorefrontAPI.Scalars['String']['input'];
}>;

export type FooterQuery = {
  shopMenu?: StorefrontAPI.Maybe<
    Pick<StorefrontAPI.Menu, 'id'> & {
      items: Array<Pick<StorefrontAPI.MenuItem, 'id' | 'title' | 'url'>>;
    }
  >;
  policiesMenu?: StorefrontAPI.Maybe<
    Pick<StorefrontAPI.Menu, 'id'> & {
      items: Array<Pick<StorefrontAPI.MenuItem, 'id' | 'title' | 'url'>>;
    }
  >;
};

export type ProductRecommendationsQueryVariables = StorefrontAPI.Exact<{
  productId: StorefrontAPI.Scalars['ID']['input'];
  country?: StorefrontAPI.InputMaybe<StorefrontAPI.CountryCode>;
  language?: StorefrontAPI.InputMaybe<StorefrontAPI.LanguageCode>;
}>;

export type ProductRecommendationsQuery = {
  productRecommendations?: StorefrontAPI.Maybe<
    Array<
      Pick<StorefrontAPI.Product, 'id' | 'title' | 'handle'> & {
        images: {
          edges: Array<{node: Pick<StorefrontAPI.Image, 'url' | 'altText'>}>;
        };
        priceRange: {
          minVariantPrice: Pick<
            StorefrontAPI.MoneyV2,
            'amount' | 'currencyCode'
          >;
        };
        compareAtPriceRange: {
          minVariantPrice: Pick<
            StorefrontAPI.MoneyV2,
            'amount' | 'currencyCode'
          >;
        };
        variants: {
          nodes: Array<
            Pick<StorefrontAPI.ProductVariant, 'id'> & {
              price: Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>;
              compareAtPrice?: StorefrontAPI.Maybe<
                Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>
              >;
            }
          >;
        };
      }
    >
  >;
};

export type MerchantCenterProductsQueryVariables = StorefrontAPI.Exact<{
  first: StorefrontAPI.Scalars['Int']['input'];
  after?: StorefrontAPI.InputMaybe<StorefrontAPI.Scalars['String']['input']>;
}>;

export type MerchantCenterProductsQuery = {
  products: {
    pageInfo: Pick<StorefrontAPI.PageInfo, 'hasNextPage' | 'endCursor'>;
    nodes: Array<
      Pick<
        StorefrontAPI.Product,
        'id' | 'handle' | 'title' | 'description' | 'vendor' | 'updatedAt'
      > & {
        images: {nodes: Array<Pick<StorefrontAPI.Image, 'url' | 'altText'>>};
        variants: {
          nodes: Array<
            Pick<
              StorefrontAPI.ProductVariant,
              'id' | 'title' | 'availableForSale'
            > & {
              priceV2: Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>;
            }
          >;
        };
      }
    >;
  };
};

export type MetaSitemapProductsQueryVariables = StorefrontAPI.Exact<{
  first: StorefrontAPI.Scalars['Int']['input'];
  after?: StorefrontAPI.InputMaybe<StorefrontAPI.Scalars['String']['input']>;
}>;

export type MetaSitemapProductsQuery = {
  products: {
    pageInfo: Pick<StorefrontAPI.PageInfo, 'hasNextPage' | 'endCursor'>;
    nodes: Array<
      Pick<
        StorefrontAPI.Product,
        'id' | 'handle' | 'title' | 'description' | 'vendor' | 'updatedAt'
      > & {
        category?: StorefrontAPI.Maybe<
          Pick<StorefrontAPI.TaxonomyCategory, 'id' | 'name'>
        >;
        images: {nodes: Array<Pick<StorefrontAPI.Image, 'url' | 'altText'>>};
        variants: {
          nodes: Array<
            Pick<
              StorefrontAPI.ProductVariant,
              'id' | 'title' | 'availableForSale'
            > & {
              priceV2: Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>;
              image?: StorefrontAPI.Maybe<Pick<StorefrontAPI.Image, 'url'>>;
              selectedOptions: Array<
                Pick<StorefrontAPI.SelectedOption, 'name' | 'value'>
              >;
            }
          >;
        };
      }
    >;
  };
};

export type StoreRobotsQueryVariables = StorefrontAPI.Exact<{
  country?: StorefrontAPI.InputMaybe<StorefrontAPI.CountryCode>;
  language?: StorefrontAPI.InputMaybe<StorefrontAPI.LanguageCode>;
}>;

export type StoreRobotsQuery = {shop: Pick<StorefrontAPI.Shop, 'id'>};

export type SitemapProductsQueryVariables = StorefrontAPI.Exact<{
  first: StorefrontAPI.Scalars['Int']['input'];
  after?: StorefrontAPI.InputMaybe<StorefrontAPI.Scalars['String']['input']>;
}>;

export type SitemapProductsQuery = {
  products: {
    pageInfo: Pick<StorefrontAPI.PageInfo, 'hasNextPage' | 'endCursor'>;
    nodes: Array<
      Pick<
        StorefrontAPI.Product,
        'id' | 'handle' | 'createdAt' | 'updatedAt'
      > & {
        featuredImage?: StorefrontAPI.Maybe<
          Pick<StorefrontAPI.Image, 'url' | 'altText'>
        >;
      }
    >;
  };
};

export type SitemapCollectionsQueryVariables = StorefrontAPI.Exact<{
  first: StorefrontAPI.Scalars['Int']['input'];
  after?: StorefrontAPI.InputMaybe<StorefrontAPI.Scalars['String']['input']>;
}>;

export type SitemapCollectionsQuery = {
  collections: {
    pageInfo: Pick<StorefrontAPI.PageInfo, 'hasNextPage' | 'endCursor'>;
    nodes: Array<Pick<StorefrontAPI.Collection, 'id' | 'handle' | 'updatedAt'>>;
  };
};

export type PagesQueryVariables = StorefrontAPI.Exact<{
  first: StorefrontAPI.Scalars['Int']['input'];
  after?: StorefrontAPI.InputMaybe<StorefrontAPI.Scalars['String']['input']>;
}>;

export type PagesQuery = {
  pages: {
    pageInfo: Pick<StorefrontAPI.PageInfo, 'hasNextPage' | 'endCursor'>;
    nodes: Array<Pick<StorefrontAPI.Page, 'id' | 'handle' | 'updatedAt'>>;
  };
};

export type ShopDetailsQueryVariables = StorefrontAPI.Exact<{
  [key: string]: never;
}>;

export type ShopDetailsQuery = {
  shop: Pick<StorefrontAPI.Shop, 'name' | 'description'>;
};

export type ChatbotProductDetailsQueryVariables = StorefrontAPI.Exact<{
  handle: StorefrontAPI.Scalars['String']['input'];
}>;

export type ChatbotProductDetailsQuery = {
  product?: StorefrontAPI.Maybe<
    Pick<
      StorefrontAPI.Product,
      | 'id'
      | 'handle'
      | 'title'
      | 'vendor'
      | 'productType'
      | 'description'
      | 'descriptionHtml'
      | 'onlineStoreUrl'
    > & {
      featuredImage?: StorefrontAPI.Maybe<
        Pick<StorefrontAPI.Image, 'url' | 'altText'>
      >;
      priceRange: {
        minVariantPrice: Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>;
        maxVariantPrice: Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>;
      };
      options: Array<Pick<StorefrontAPI.ProductOption, 'name' | 'values'>>;
      variants: {
        nodes: Array<
          Pick<
            StorefrontAPI.ProductVariant,
            'id' | 'title' | 'availableForSale'
          > & {
            price: Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>;
            compareAtPrice?: StorefrontAPI.Maybe<
              Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>
            >;
            selectedOptions: Array<
              Pick<StorefrontAPI.SelectedOption, 'name' | 'value'>
            >;
          }
        >;
      };
    }
  >;
};

export type ComplementarySourceProductQueryVariables = StorefrontAPI.Exact<{
  handle: StorefrontAPI.Scalars['String']['input'];
}>;

export type ComplementarySourceProductQuery = {
  product?: StorefrontAPI.Maybe<
    Pick<
      StorefrontAPI.Product,
      'id' | 'title' | 'vendor' | 'productType' | 'tags'
    >
  >;
};

export type ComplementaryCollectionProductsQueryVariables =
  StorefrontAPI.Exact<{
    handle: StorefrontAPI.Scalars['String']['input'];
    first: StorefrontAPI.Scalars['Int']['input'];
    after?: StorefrontAPI.InputMaybe<StorefrontAPI.Scalars['String']['input']>;
  }>;

export type ComplementaryCollectionProductsQuery = {
  collection?: StorefrontAPI.Maybe<{
    products: {
      pageInfo: Pick<StorefrontAPI.PageInfo, 'hasNextPage' | 'endCursor'>;
      nodes: Array<
        Pick<
          StorefrontAPI.Product,
          'id' | 'title' | 'handle' | 'availableForSale' | 'tags'
        > & {
          images: {
            edges: Array<{node: Pick<StorefrontAPI.Image, 'url' | 'altText'>}>;
          };
          priceRange: {
            minVariantPrice: Pick<
              StorefrontAPI.MoneyV2,
              'amount' | 'currencyCode'
            >;
          };
          compareAtPriceRange: {
            minVariantPrice: Pick<
              StorefrontAPI.MoneyV2,
              'amount' | 'currencyCode'
            >;
          };
          variants: {
            nodes: Array<
              Pick<StorefrontAPI.ProductVariant, 'id' | 'title'> & {
                image?: StorefrontAPI.Maybe<
                  Pick<StorefrontAPI.Image, 'url' | 'altText'>
                >;
                selectedOptions: Array<
                  Pick<StorefrontAPI.SelectedOption, 'name' | 'value'>
                >;
                price: Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>;
                compareAtPrice?: StorefrontAPI.Maybe<
                  Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>
                >;
              }
            >;
          };
        }
      >;
    };
  }>;
};

export type ProductQuestionsQueryVariables = StorefrontAPI.Exact<{
  id: StorefrontAPI.Scalars['ID']['input'];
}>;

export type ProductQuestionsQuery = {
  product?: StorefrontAPI.Maybe<{
    metafield?: StorefrontAPI.Maybe<
      Pick<StorefrontAPI.Metafield, 'id' | 'value'>
    >;
  }>;
};

export type GetFaqsByProductQueryVariables = StorefrontAPI.Exact<{
  type: StorefrontAPI.Scalars['String']['input'];
  first: StorefrontAPI.Scalars['Int']['input'];
}>;

export type GetFaqsByProductQuery = {
  metaobjects: {
    nodes: Array<
      Pick<StorefrontAPI.Metaobject, 'id'> & {
        fields: Array<Pick<StorefrontAPI.MetaobjectField, 'key' | 'value'>>;
      }
    >;
  };
};

export type MenuSubmenuWithCollectionsQueryVariables = StorefrontAPI.Exact<{
  handle: StorefrontAPI.Scalars['String']['input'];
}>;

export type MenuSubmenuWithCollectionsQuery = {
  menu?: StorefrontAPI.Maybe<
    Pick<StorefrontAPI.Menu, 'id' | 'title'> & {
      items: Array<
        Pick<StorefrontAPI.MenuItem, 'id' | 'title' | 'url'> & {
          resource?: StorefrontAPI.Maybe<
            | {
                __typename:
                  | 'Article'
                  | 'Blog'
                  | 'Metaobject'
                  | 'Page'
                  | 'Product'
                  | 'ShopPolicy';
              }
            | ({__typename: 'Collection'} & Pick<
                StorefrontAPI.Collection,
                'id' | 'handle' | 'title' | 'description'
              > & {
                  image?: StorefrontAPI.Maybe<
                    Pick<StorefrontAPI.Image, 'url' | 'altText'>
                  >;
                  products: {
                    nodes: Array<
                      Pick<
                        StorefrontAPI.Product,
                        'id' | 'handle' | 'title' | 'availableForSale'
                      > & {
                        featuredImage?: StorefrontAPI.Maybe<
                          Pick<
                            StorefrontAPI.Image,
                            'id' | 'url' | 'altText' | 'width' | 'height'
                          >
                        >;
                        priceRange: {
                          minVariantPrice: Pick<
                            StorefrontAPI.MoneyV2,
                            'amount' | 'currencyCode'
                          >;
                        };
                      }
                    >;
                  };
                })
          >;
        }
      >;
    }
  >;
};

export type ProductForContextQueryVariables = StorefrontAPI.Exact<{
  id: StorefrontAPI.Scalars['ID']['input'];
}>;

export type ProductForContextQuery = {
  product?: StorefrontAPI.Maybe<
    Pick<
      StorefrontAPI.Product,
      | 'id'
      | 'handle'
      | 'title'
      | 'vendor'
      | 'description'
      | 'descriptionHtml'
      | 'productType'
    > & {
      priceRange: {
        minVariantPrice: Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>;
        maxVariantPrice: Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>;
      };
    }
  >;
};

export type ReadSummaryQueryVariables = StorefrontAPI.Exact<{
  id: StorefrontAPI.Scalars['ID']['input'];
}>;

export type ReadSummaryQuery = {
  product?: StorefrontAPI.Maybe<
    Pick<StorefrontAPI.Product, 'id'> & {
      metafield?: StorefrontAPI.Maybe<
        Pick<StorefrontAPI.Metafield, 'id' | 'value'>
      >;
    }
  >;
};

export type ProductForSummaryQueryVariables = StorefrontAPI.Exact<{
  id: StorefrontAPI.Scalars['ID']['input'];
}>;

export type ProductForSummaryQuery = {
  product?: StorefrontAPI.Maybe<
    Pick<StorefrontAPI.Product, 'id' | 'title' | 'vendor' | 'description'>
  >;
};

export type TrackViewCustomerFromTokenQueryVariables = StorefrontAPI.Exact<{
  token: StorefrontAPI.Scalars['String']['input'];
}>;

export type TrackViewCustomerFromTokenQuery = {
  customer?: StorefrontAPI.Maybe<Pick<StorefrontAPI.Customer, 'id' | 'email'>>;
};

export type GetProdQueryVariables = StorefrontAPI.Exact<{
  handle: StorefrontAPI.Scalars['String']['input'];
}>;

export type GetProdQuery = {
  product?: StorefrontAPI.Maybe<Pick<StorefrontAPI.Product, 'id'>>;
};

export type UserHistoryCustomerFromTokenQueryVariables = StorefrontAPI.Exact<{
  token: StorefrontAPI.Scalars['String']['input'];
}>;

export type UserHistoryCustomerFromTokenQuery = {
  customer?: StorefrontAPI.Maybe<Pick<StorefrontAPI.Customer, 'id'>>;
};

export type CartGetCollectionByHandleQueryVariables = StorefrontAPI.Exact<{
  handle: StorefrontAPI.Scalars['String']['input'];
}>;

export type CartGetCollectionByHandleQuery = {
  collectionByHandle?: StorefrontAPI.Maybe<
    Pick<StorefrontAPI.Collection, 'id' | 'title' | 'handle'> & {
      image?: StorefrontAPI.Maybe<Pick<StorefrontAPI.Image, 'url' | 'altText'>>;
      products: {
        nodes: Array<
          Pick<StorefrontAPI.Product, 'id' | 'title' | 'handle'> & {
            priceRange: {
              minVariantPrice: Pick<
                StorefrontAPI.MoneyV2,
                'amount' | 'currencyCode'
              >;
            };
            compareAtPriceRange: {
              minVariantPrice: Pick<
                StorefrontAPI.MoneyV2,
                'amount' | 'currencyCode'
              >;
            };
            images: {
              nodes: Array<Pick<StorefrontAPI.Image, 'url' | 'altText'>>;
            };
            variants: {
              nodes: Array<
                Pick<
                  StorefrontAPI.ProductVariant,
                  'id' | 'availableForSale'
                > & {
                  price: Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>;
                  compareAtPrice?: StorefrontAPI.Maybe<
                    Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>
                  >;
                  selectedOptions: Array<
                    Pick<StorefrontAPI.SelectedOption, 'name' | 'value'>
                  >;
                }
              >;
            };
          }
        >;
      };
    }
  >;
};

export type GetMenuQueryVariables = StorefrontAPI.Exact<{
  handle: StorefrontAPI.Scalars['String']['input'];
}>;

export type GetMenuQuery = {
  menu?: StorefrontAPI.Maybe<{
    items: Array<
      Pick<StorefrontAPI.MenuItem, 'title' | 'url'> & {
        resource?: StorefrontAPI.Maybe<
          | {
              __typename:
                | 'Article'
                | 'Blog'
                | 'Metaobject'
                | 'Page'
                | 'Product'
                | 'ShopPolicy';
            }
          | ({__typename: 'Collection'} & Pick<
              StorefrontAPI.Collection,
              'id' | 'title' | 'description' | 'handle'
            > & {
                image?: StorefrontAPI.Maybe<
                  Pick<StorefrontAPI.Image, 'url' | 'altText'>
                >;
                products: {nodes: Array<Pick<StorefrontAPI.Product, 'id'>>};
              })
        >;
      }
    >;
  }>;
};

export type ProductItemFragment = Pick<
  StorefrontAPI.Product,
  | 'id'
  | 'handle'
  | 'title'
  | 'vendor'
  | 'productType'
  | 'tags'
  | 'description'
  | 'availableForSale'
> & {
  featuredImage?: StorefrontAPI.Maybe<
    Pick<StorefrontAPI.Image, 'altText' | 'url'>
  >;
  variants: {
    nodes: Array<
      Pick<
        StorefrontAPI.ProductVariant,
        'id' | 'availableForSale' | 'title'
      > & {
        selectedOptions: Array<
          Pick<StorefrontAPI.SelectedOption, 'name' | 'value'>
        >;
        image?: StorefrontAPI.Maybe<
          Pick<StorefrontAPI.Image, 'url' | 'altText'>
        >;
        price: Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>;
        compareAtPrice?: StorefrontAPI.Maybe<
          Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>
        >;
      }
    >;
  };
};

export type CollectionQueryVariables = StorefrontAPI.Exact<{
  handle: StorefrontAPI.Scalars['String']['input'];
  first?: StorefrontAPI.InputMaybe<StorefrontAPI.Scalars['Int']['input']>;
  last?: StorefrontAPI.InputMaybe<StorefrontAPI.Scalars['Int']['input']>;
  startCursor?: StorefrontAPI.InputMaybe<
    StorefrontAPI.Scalars['String']['input']
  >;
  endCursor?: StorefrontAPI.InputMaybe<
    StorefrontAPI.Scalars['String']['input']
  >;
  filters?: StorefrontAPI.InputMaybe<
    Array<StorefrontAPI.ProductFilter> | StorefrontAPI.ProductFilter
  >;
  sortKey?: StorefrontAPI.InputMaybe<StorefrontAPI.ProductCollectionSortKeys>;
  reverse?: StorefrontAPI.InputMaybe<StorefrontAPI.Scalars['Boolean']['input']>;
}>;

export type CollectionQuery = {
  collection?: StorefrontAPI.Maybe<
    Pick<
      StorefrontAPI.Collection,
      'id' | 'handle' | 'title' | 'description'
    > & {
      seo: Pick<StorefrontAPI.Seo, 'title' | 'description'>;
      image?: StorefrontAPI.Maybe<Pick<StorefrontAPI.Image, 'url' | 'altText'>>;
      products: {
        filters: Array<
          Pick<StorefrontAPI.Filter, 'id' | 'label' | 'type'> & {
            values: Array<
              Pick<
                StorefrontAPI.FilterValue,
                'id' | 'label' | 'count' | 'input'
              >
            >;
          }
        >;
        nodes: Array<
          Pick<
            StorefrontAPI.Product,
            | 'id'
            | 'handle'
            | 'title'
            | 'vendor'
            | 'productType'
            | 'tags'
            | 'description'
            | 'availableForSale'
          > & {
            featuredImage?: StorefrontAPI.Maybe<
              Pick<StorefrontAPI.Image, 'altText' | 'url'>
            >;
            variants: {
              nodes: Array<
                Pick<
                  StorefrontAPI.ProductVariant,
                  'id' | 'availableForSale' | 'title'
                > & {
                  selectedOptions: Array<
                    Pick<StorefrontAPI.SelectedOption, 'name' | 'value'>
                  >;
                  image?: StorefrontAPI.Maybe<
                    Pick<StorefrontAPI.Image, 'url' | 'altText'>
                  >;
                  price: Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>;
                  compareAtPrice?: StorefrontAPI.Maybe<
                    Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>
                  >;
                }
              >;
            };
          }
        >;
        pageInfo: Pick<
          StorefrontAPI.PageInfo,
          'hasPreviousPage' | 'hasNextPage' | 'endCursor' | 'startCursor'
        >;
      };
    }
  >;
};

export type CollectionFragment = Pick<
  StorefrontAPI.Collection,
  'id' | 'title' | 'handle'
> & {
  products: {nodes: Array<Pick<StorefrontAPI.Product, 'id'>>};
  image?: StorefrontAPI.Maybe<
    Pick<StorefrontAPI.Image, 'id' | 'url' | 'altText' | 'width' | 'height'>
  >;
};

export type StoreCollectionsQueryVariables = StorefrontAPI.Exact<{
  country?: StorefrontAPI.InputMaybe<StorefrontAPI.CountryCode>;
  endCursor?: StorefrontAPI.InputMaybe<
    StorefrontAPI.Scalars['String']['input']
  >;
  first?: StorefrontAPI.InputMaybe<StorefrontAPI.Scalars['Int']['input']>;
  language?: StorefrontAPI.InputMaybe<StorefrontAPI.LanguageCode>;
  last?: StorefrontAPI.InputMaybe<StorefrontAPI.Scalars['Int']['input']>;
  startCursor?: StorefrontAPI.InputMaybe<
    StorefrontAPI.Scalars['String']['input']
  >;
}>;

export type StoreCollectionsQuery = {
  collections: {
    nodes: Array<
      Pick<StorefrontAPI.Collection, 'id' | 'title' | 'handle'> & {
        products: {nodes: Array<Pick<StorefrontAPI.Product, 'id'>>};
        image?: StorefrontAPI.Maybe<
          Pick<
            StorefrontAPI.Image,
            'id' | 'url' | 'altText' | 'width' | 'height'
          >
        >;
      }
    >;
    pageInfo: Pick<
      StorefrontAPI.PageInfo,
      'hasNextPage' | 'hasPreviousPage' | 'startCursor' | 'endCursor'
    >;
  };
};

export type PageQueryVariables = StorefrontAPI.Exact<{
  language?: StorefrontAPI.InputMaybe<StorefrontAPI.LanguageCode>;
  country?: StorefrontAPI.InputMaybe<StorefrontAPI.CountryCode>;
  handle: StorefrontAPI.Scalars['String']['input'];
}>;

export type PageQuery = {
  page?: StorefrontAPI.Maybe<
    Pick<StorefrontAPI.Page, 'id' | 'title' | 'body'> & {
      seo?: StorefrontAPI.Maybe<
        Pick<StorefrontAPI.Seo, 'description' | 'title'>
      >;
    }
  >;
};

export type PolicyFragment = Pick<
  StorefrontAPI.ShopPolicy,
  'body' | 'handle' | 'id' | 'title' | 'url'
>;

export type PolicyQueryVariables = StorefrontAPI.Exact<{
  country?: StorefrontAPI.InputMaybe<StorefrontAPI.CountryCode>;
  language?: StorefrontAPI.InputMaybe<StorefrontAPI.LanguageCode>;
  privacyPolicy: StorefrontAPI.Scalars['Boolean']['input'];
  refundPolicy: StorefrontAPI.Scalars['Boolean']['input'];
  shippingPolicy: StorefrontAPI.Scalars['Boolean']['input'];
  termsOfService: StorefrontAPI.Scalars['Boolean']['input'];
}>;

export type PolicyQuery = {
  shop: {
    privacyPolicy?: StorefrontAPI.Maybe<
      Pick<StorefrontAPI.ShopPolicy, 'body' | 'handle' | 'id' | 'title' | 'url'>
    >;
    shippingPolicy?: StorefrontAPI.Maybe<
      Pick<StorefrontAPI.ShopPolicy, 'body' | 'handle' | 'id' | 'title' | 'url'>
    >;
    termsOfService?: StorefrontAPI.Maybe<
      Pick<StorefrontAPI.ShopPolicy, 'body' | 'handle' | 'id' | 'title' | 'url'>
    >;
    refundPolicy?: StorefrontAPI.Maybe<
      Pick<StorefrontAPI.ShopPolicy, 'body' | 'handle' | 'id' | 'title' | 'url'>
    >;
  };
};

export type PolicyItemFragment = Pick<
  StorefrontAPI.ShopPolicy,
  'id' | 'title' | 'handle'
>;

export type PoliciesQueryVariables = StorefrontAPI.Exact<{
  country?: StorefrontAPI.InputMaybe<StorefrontAPI.CountryCode>;
  language?: StorefrontAPI.InputMaybe<StorefrontAPI.LanguageCode>;
}>;

export type PoliciesQuery = {
  shop: {
    privacyPolicy?: StorefrontAPI.Maybe<
      Pick<StorefrontAPI.ShopPolicy, 'id' | 'title' | 'handle'>
    >;
    shippingPolicy?: StorefrontAPI.Maybe<
      Pick<StorefrontAPI.ShopPolicy, 'id' | 'title' | 'handle'>
    >;
    termsOfService?: StorefrontAPI.Maybe<
      Pick<StorefrontAPI.ShopPolicy, 'id' | 'title' | 'handle'>
    >;
    refundPolicy?: StorefrontAPI.Maybe<
      Pick<StorefrontAPI.ShopPolicy, 'id' | 'title' | 'handle'>
    >;
    subscriptionPolicy?: StorefrontAPI.Maybe<
      Pick<StorefrontAPI.ShopPolicyWithDefault, 'id' | 'title' | 'handle'>
    >;
  };
};

export type ProductVariantFragment = Pick<
  StorefrontAPI.ProductVariant,
  'availableForSale' | 'quantityAvailable' | 'taxable' | 'id' | 'sku' | 'title'
> & {
  compareAtPrice?: StorefrontAPI.Maybe<
    Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>
  >;
  image?: StorefrontAPI.Maybe<
    {__typename: 'Image'} & Pick<
      StorefrontAPI.Image,
      'id' | 'url' | 'altText' | 'width' | 'height'
    >
  >;
  price: Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>;
  selectedOptions: Array<Pick<StorefrontAPI.SelectedOption, 'name' | 'value'>>;
  unitPrice?: StorefrontAPI.Maybe<
    Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>
  >;
};

export type ProductFragment = Pick<
  StorefrontAPI.Product,
  | 'id'
  | 'title'
  | 'vendor'
  | 'handle'
  | 'descriptionHtml'
  | 'description'
  | 'productType'
  | 'tags'
> & {
  collections: {
    edges: Array<{
      node: Pick<StorefrontAPI.Collection, 'id' | 'handle' | 'title'>;
    }>;
  };
  priceRange: {
    minVariantPrice: Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>;
    maxVariantPrice: Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>;
  };
  images: {
    edges: Array<{
      node: {__typename: 'Image'} & Pick<
        StorefrontAPI.Image,
        'id' | 'url' | 'altText' | 'width' | 'height'
      >;
    }>;
  };
  media: {
    edges: Array<{
      node:
        | ({__typename: 'ExternalVideo'} & Pick<
            StorefrontAPI.ExternalVideo,
            'id' | 'embedUrl' | 'host' | 'mediaContentType' | 'alt'
          >)
        | ({__typename: 'MediaImage'} & Pick<
            StorefrontAPI.MediaImage,
            'id' | 'mediaContentType' | 'alt'
          > & {
              image?: StorefrontAPI.Maybe<
                Pick<
                  StorefrontAPI.Image,
                  'url' | 'altText' | 'width' | 'height'
                >
              >;
            })
        | ({__typename: 'Model3d'} & Pick<
            StorefrontAPI.Model3d,
            'id' | 'mediaContentType' | 'alt'
          > & {sources: Array<Pick<StorefrontAPI.Model3dSource, 'url'>>})
        | ({__typename: 'Video'} & Pick<
            StorefrontAPI.Video,
            'id' | 'mediaContentType' | 'alt'
          > & {
              sources: Array<
                Pick<StorefrontAPI.VideoSource, 'url' | 'mimeType'>
              >;
            });
    }>;
  };
  options: Array<
    Pick<StorefrontAPI.ProductOption, 'name'> & {
      optionValues: Array<Pick<StorefrontAPI.ProductOptionValue, 'name'>>;
    }
  >;
  selectedVariant?: StorefrontAPI.Maybe<
    Pick<
      StorefrontAPI.ProductVariant,
      | 'availableForSale'
      | 'quantityAvailable'
      | 'taxable'
      | 'id'
      | 'sku'
      | 'title'
    > & {
      compareAtPrice?: StorefrontAPI.Maybe<
        Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>
      >;
      image?: StorefrontAPI.Maybe<
        {__typename: 'Image'} & Pick<
          StorefrontAPI.Image,
          'id' | 'url' | 'altText' | 'width' | 'height'
        >
      >;
      price: Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>;
      selectedOptions: Array<
        Pick<StorefrontAPI.SelectedOption, 'name' | 'value'>
      >;
      unitPrice?: StorefrontAPI.Maybe<
        Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>
      >;
    }
  >;
  variants: {
    nodes: Array<
      Pick<
        StorefrontAPI.ProductVariant,
        | 'availableForSale'
        | 'quantityAvailable'
        | 'taxable'
        | 'id'
        | 'sku'
        | 'title'
      > & {
        compareAtPrice?: StorefrontAPI.Maybe<
          Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>
        >;
        image?: StorefrontAPI.Maybe<
          {__typename: 'Image'} & Pick<
            StorefrontAPI.Image,
            'id' | 'url' | 'altText' | 'width' | 'height'
          >
        >;
        price: Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>;
        selectedOptions: Array<
          Pick<StorefrontAPI.SelectedOption, 'name' | 'value'>
        >;
        unitPrice?: StorefrontAPI.Maybe<
          Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>
        >;
      }
    >;
  };
  seo: Pick<StorefrontAPI.Seo, 'description' | 'title'>;
  metafieldOfficialProductLink?: StorefrontAPI.Maybe<
    Pick<StorefrontAPI.Metafield, 'value'>
  >;
  metafieldCondition?: StorefrontAPI.Maybe<
    Pick<StorefrontAPI.Metafield, 'value'>
  >;
  metafieldWarranty?: StorefrontAPI.Maybe<
    Pick<StorefrontAPI.Metafield, 'value'>
  >;
  metafieldShipping?: StorefrontAPI.Maybe<
    Pick<StorefrontAPI.Metafield, 'value'>
  >;
  metafieldVat?: StorefrontAPI.Maybe<Pick<StorefrontAPI.Metafield, 'value'>>;
  metafieldSubscription?: StorefrontAPI.Maybe<
    Pick<StorefrontAPI.Metafield, 'value'>
  >;
  metafieldAiSummary?: StorefrontAPI.Maybe<
    Pick<StorefrontAPI.Metafield, 'value'>
  >;
};

export type ProductPageProductQueryVariables = StorefrontAPI.Exact<{
  country?: StorefrontAPI.InputMaybe<StorefrontAPI.CountryCode>;
  handle: StorefrontAPI.Scalars['String']['input'];
  language?: StorefrontAPI.InputMaybe<StorefrontAPI.LanguageCode>;
  selectedOptions:
    | Array<StorefrontAPI.SelectedOptionInput>
    | StorefrontAPI.SelectedOptionInput;
}>;

export type ProductPageProductQuery = {
  product?: StorefrontAPI.Maybe<
    Pick<
      StorefrontAPI.Product,
      | 'id'
      | 'title'
      | 'vendor'
      | 'handle'
      | 'descriptionHtml'
      | 'description'
      | 'productType'
      | 'tags'
    > & {
      collections: {
        edges: Array<{
          node: Pick<StorefrontAPI.Collection, 'id' | 'handle' | 'title'>;
        }>;
      };
      priceRange: {
        minVariantPrice: Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>;
        maxVariantPrice: Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>;
      };
      images: {
        edges: Array<{
          node: {__typename: 'Image'} & Pick<
            StorefrontAPI.Image,
            'id' | 'url' | 'altText' | 'width' | 'height'
          >;
        }>;
      };
      media: {
        edges: Array<{
          node:
            | ({__typename: 'ExternalVideo'} & Pick<
                StorefrontAPI.ExternalVideo,
                'id' | 'embedUrl' | 'host' | 'mediaContentType' | 'alt'
              >)
            | ({__typename: 'MediaImage'} & Pick<
                StorefrontAPI.MediaImage,
                'id' | 'mediaContentType' | 'alt'
              > & {
                  image?: StorefrontAPI.Maybe<
                    Pick<
                      StorefrontAPI.Image,
                      'url' | 'altText' | 'width' | 'height'
                    >
                  >;
                })
            | ({__typename: 'Model3d'} & Pick<
                StorefrontAPI.Model3d,
                'id' | 'mediaContentType' | 'alt'
              > & {sources: Array<Pick<StorefrontAPI.Model3dSource, 'url'>>})
            | ({__typename: 'Video'} & Pick<
                StorefrontAPI.Video,
                'id' | 'mediaContentType' | 'alt'
              > & {
                  sources: Array<
                    Pick<StorefrontAPI.VideoSource, 'url' | 'mimeType'>
                  >;
                });
        }>;
      };
      options: Array<
        Pick<StorefrontAPI.ProductOption, 'name'> & {
          optionValues: Array<Pick<StorefrontAPI.ProductOptionValue, 'name'>>;
        }
      >;
      selectedVariant?: StorefrontAPI.Maybe<
        Pick<
          StorefrontAPI.ProductVariant,
          | 'availableForSale'
          | 'quantityAvailable'
          | 'taxable'
          | 'id'
          | 'sku'
          | 'title'
        > & {
          compareAtPrice?: StorefrontAPI.Maybe<
            Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>
          >;
          image?: StorefrontAPI.Maybe<
            {__typename: 'Image'} & Pick<
              StorefrontAPI.Image,
              'id' | 'url' | 'altText' | 'width' | 'height'
            >
          >;
          price: Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>;
          selectedOptions: Array<
            Pick<StorefrontAPI.SelectedOption, 'name' | 'value'>
          >;
          unitPrice?: StorefrontAPI.Maybe<
            Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>
          >;
        }
      >;
      variants: {
        nodes: Array<
          Pick<
            StorefrontAPI.ProductVariant,
            | 'availableForSale'
            | 'quantityAvailable'
            | 'taxable'
            | 'id'
            | 'sku'
            | 'title'
          > & {
            compareAtPrice?: StorefrontAPI.Maybe<
              Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>
            >;
            image?: StorefrontAPI.Maybe<
              {__typename: 'Image'} & Pick<
                StorefrontAPI.Image,
                'id' | 'url' | 'altText' | 'width' | 'height'
              >
            >;
            price: Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>;
            selectedOptions: Array<
              Pick<StorefrontAPI.SelectedOption, 'name' | 'value'>
            >;
            unitPrice?: StorefrontAPI.Maybe<
              Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>
            >;
          }
        >;
      };
      seo: Pick<StorefrontAPI.Seo, 'description' | 'title'>;
      metafieldOfficialProductLink?: StorefrontAPI.Maybe<
        Pick<StorefrontAPI.Metafield, 'value'>
      >;
      metafieldCondition?: StorefrontAPI.Maybe<
        Pick<StorefrontAPI.Metafield, 'value'>
      >;
      metafieldWarranty?: StorefrontAPI.Maybe<
        Pick<StorefrontAPI.Metafield, 'value'>
      >;
      metafieldShipping?: StorefrontAPI.Maybe<
        Pick<StorefrontAPI.Metafield, 'value'>
      >;
      metafieldVat?: StorefrontAPI.Maybe<
        Pick<StorefrontAPI.Metafield, 'value'>
      >;
      metafieldSubscription?: StorefrontAPI.Maybe<
        Pick<StorefrontAPI.Metafield, 'value'>
      >;
      metafieldAiSummary?: StorefrontAPI.Maybe<
        Pick<StorefrontAPI.Metafield, 'value'>
      >;
    }
  >;
};

export type SearchOldOldProductsWithFiltersQueryVariables =
  StorefrontAPI.Exact<{
    query: StorefrontAPI.Scalars['String']['input'];
    first?: StorefrontAPI.InputMaybe<StorefrontAPI.Scalars['Int']['input']>;
    last?: StorefrontAPI.InputMaybe<StorefrontAPI.Scalars['Int']['input']>;
    after?: StorefrontAPI.InputMaybe<StorefrontAPI.Scalars['String']['input']>;
    before?: StorefrontAPI.InputMaybe<StorefrontAPI.Scalars['String']['input']>;
    prefix?: StorefrontAPI.InputMaybe<StorefrontAPI.SearchPrefixQueryType>;
    productFilters?: StorefrontAPI.InputMaybe<
      Array<StorefrontAPI.ProductFilter> | StorefrontAPI.ProductFilter
    >;
    sortKey?: StorefrontAPI.InputMaybe<StorefrontAPI.SearchSortKeys>;
    reverse?: StorefrontAPI.InputMaybe<
      StorefrontAPI.Scalars['Boolean']['input']
    >;
  }>;

export type SearchOldOldProductsWithFiltersQuery = {
  search: Pick<StorefrontAPI.SearchResultItemConnection, 'totalCount'> & {
    edges: Array<{
      node: Pick<
        StorefrontAPI.Product,
        | 'id'
        | 'title'
        | 'handle'
        | 'vendor'
        | 'productType'
        | 'tags'
        | 'description'
      > & {
        images: {nodes: Array<Pick<StorefrontAPI.Image, 'url' | 'altText'>>};
        priceRange: {
          minVariantPrice: Pick<
            StorefrontAPI.MoneyV2,
            'amount' | 'currencyCode'
          >;
        };
        variants: {
          nodes: Array<
            Pick<
              StorefrontAPI.ProductVariant,
              'id' | 'sku' | 'availableForSale'
            > & {
              price: Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>;
              image?: StorefrontAPI.Maybe<
                Pick<StorefrontAPI.Image, 'url' | 'altText'>
              >;
              compareAtPrice?: StorefrontAPI.Maybe<
                Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>
              >;
              selectedOptions: Array<
                Pick<StorefrontAPI.SelectedOption, 'name' | 'value'>
              >;
            }
          >;
        };
      };
    }>;
    productFilters: Array<
      Pick<StorefrontAPI.Filter, 'id' | 'label' | 'type'> & {
        values: Array<
          Pick<StorefrontAPI.FilterValue, 'id' | 'label' | 'count' | 'input'>
        >;
      }
    >;
    pageInfo: Pick<
      StorefrontAPI.PageInfo,
      'hasNextPage' | 'hasPreviousPage' | 'startCursor' | 'endCursor'
    >;
  };
};

export type PredictiveArticleFragment = {__typename: 'Article'} & Pick<
  StorefrontAPI.Article,
  'id' | 'title' | 'handle' | 'trackingParameters'
> & {
    blog: Pick<StorefrontAPI.Blog, 'handle'>;
    image?: StorefrontAPI.Maybe<
      Pick<StorefrontAPI.Image, 'url' | 'altText' | 'width' | 'height'>
    >;
  };

export type PredictiveCollectionFragment = {__typename: 'Collection'} & Pick<
  StorefrontAPI.Collection,
  'id' | 'title' | 'handle' | 'trackingParameters'
> & {
    image?: StorefrontAPI.Maybe<
      Pick<StorefrontAPI.Image, 'url' | 'altText' | 'width' | 'height'>
    >;
  };

export type PredictivePageFragment = {__typename: 'Page'} & Pick<
  StorefrontAPI.Page,
  'id' | 'title' | 'handle' | 'trackingParameters'
>;

export type PredictiveProductFragment = {__typename: 'Product'} & Pick<
  StorefrontAPI.Product,
  | 'id'
  | 'title'
  | 'vendor'
  | 'productType'
  | 'tags'
  | 'description'
  | 'handle'
  | 'trackingParameters'
> & {
    variants: {
      nodes: Array<
        Pick<StorefrontAPI.ProductVariant, 'id' | 'sku'> & {
          image?: StorefrontAPI.Maybe<
            Pick<StorefrontAPI.Image, 'url' | 'altText' | 'width' | 'height'>
          >;
          price: Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>;
          compareAtPrice?: StorefrontAPI.Maybe<
            Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>
          >;
        }
      >;
    };
  };

export type PredictiveQueryFragment = {
  __typename: 'SearchQuerySuggestion';
} & Pick<
  StorefrontAPI.SearchQuerySuggestion,
  'text' | 'styledText' | 'trackingParameters'
>;

export type PredictiveSearchQueryVariables = StorefrontAPI.Exact<{
  country?: StorefrontAPI.InputMaybe<StorefrontAPI.CountryCode>;
  language?: StorefrontAPI.InputMaybe<StorefrontAPI.LanguageCode>;
  limitScope: StorefrontAPI.PredictiveSearchLimitScope;
  term: StorefrontAPI.Scalars['String']['input'];
  types?: StorefrontAPI.InputMaybe<
    | Array<StorefrontAPI.PredictiveSearchType>
    | StorefrontAPI.PredictiveSearchType
  >;
}>;

export type PredictiveSearchQuery = {
  predictiveSearch?: StorefrontAPI.Maybe<{
    articles: Array<
      {__typename: 'Article'} & Pick<
        StorefrontAPI.Article,
        'id' | 'title' | 'handle' | 'trackingParameters'
      > & {
          blog: Pick<StorefrontAPI.Blog, 'handle'>;
          image?: StorefrontAPI.Maybe<
            Pick<StorefrontAPI.Image, 'url' | 'altText' | 'width' | 'height'>
          >;
        }
    >;
    collections: Array<
      {__typename: 'Collection'} & Pick<
        StorefrontAPI.Collection,
        'id' | 'title' | 'handle' | 'trackingParameters'
      > & {
          image?: StorefrontAPI.Maybe<
            Pick<StorefrontAPI.Image, 'url' | 'altText' | 'width' | 'height'>
          >;
        }
    >;
    pages: Array<
      {__typename: 'Page'} & Pick<
        StorefrontAPI.Page,
        'id' | 'title' | 'handle' | 'trackingParameters'
      >
    >;
    products: Array<
      {__typename: 'Product'} & Pick<
        StorefrontAPI.Product,
        | 'id'
        | 'title'
        | 'vendor'
        | 'productType'
        | 'tags'
        | 'description'
        | 'handle'
        | 'trackingParameters'
      > & {
          variants: {
            nodes: Array<
              Pick<StorefrontAPI.ProductVariant, 'id' | 'sku'> & {
                image?: StorefrontAPI.Maybe<
                  Pick<
                    StorefrontAPI.Image,
                    'url' | 'altText' | 'width' | 'height'
                  >
                >;
                price: Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>;
                compareAtPrice?: StorefrontAPI.Maybe<
                  Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>
                >;
              }
            >;
          };
        }
    >;
    queries: Array<
      {__typename: 'SearchQuerySuggestion'} & Pick<
        StorefrontAPI.SearchQuerySuggestion,
        'text' | 'styledText' | 'trackingParameters'
      >
    >;
  }>;
};

export type SearchOldOldProductsBasicQueryVariables = StorefrontAPI.Exact<{
  query: StorefrontAPI.Scalars['String']['input'];
  first?: StorefrontAPI.InputMaybe<StorefrontAPI.Scalars['Int']['input']>;
  last?: StorefrontAPI.InputMaybe<StorefrontAPI.Scalars['Int']['input']>;
  after?: StorefrontAPI.InputMaybe<StorefrontAPI.Scalars['String']['input']>;
  before?: StorefrontAPI.InputMaybe<StorefrontAPI.Scalars['String']['input']>;
  prefix?: StorefrontAPI.InputMaybe<StorefrontAPI.SearchPrefixQueryType>;
}>;

export type SearchOldOldProductsBasicQuery = {
  search: Pick<StorefrontAPI.SearchResultItemConnection, 'totalCount'> & {
    edges: Array<{
      node: Pick<
        StorefrontAPI.Product,
        | 'id'
        | 'title'
        | 'handle'
        | 'vendor'
        | 'productType'
        | 'tags'
        | 'description'
      > & {
        images: {nodes: Array<Pick<StorefrontAPI.Image, 'url' | 'altText'>>};
        priceRange: {
          minVariantPrice: Pick<
            StorefrontAPI.MoneyV2,
            'amount' | 'currencyCode'
          >;
        };
        variants: {
          nodes: Array<
            Pick<
              StorefrontAPI.ProductVariant,
              'id' | 'sku' | 'availableForSale'
            > & {
              price: Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>;
              image?: StorefrontAPI.Maybe<
                Pick<StorefrontAPI.Image, 'url' | 'altText'>
              >;
              compareAtPrice?: StorefrontAPI.Maybe<
                Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>
              >;
              selectedOptions: Array<
                Pick<StorefrontAPI.SelectedOption, 'name' | 'value'>
              >;
            }
          >;
        };
      };
    }>;
    pageInfo: Pick<
      StorefrontAPI.PageInfo,
      'hasNextPage' | 'hasPreviousPage' | 'startCursor' | 'endCursor'
    >;
  };
};

export type SearchAndPredictiveQueryVariables = StorefrontAPI.Exact<{
  query: StorefrontAPI.Scalars['String']['input'];
  limit: StorefrontAPI.Scalars['Int']['input'];
  country?: StorefrontAPI.InputMaybe<StorefrontAPI.CountryCode>;
  language?: StorefrontAPI.InputMaybe<StorefrontAPI.LanguageCode>;
  searchAfter?: StorefrontAPI.InputMaybe<
    StorefrontAPI.Scalars['String']['input']
  >;
  searchBefore?: StorefrontAPI.InputMaybe<
    StorefrontAPI.Scalars['String']['input']
  >;
  searchFirst?: StorefrontAPI.InputMaybe<StorefrontAPI.Scalars['Int']['input']>;
  searchLast?: StorefrontAPI.InputMaybe<StorefrontAPI.Scalars['Int']['input']>;
}>;

export type SearchAndPredictiveQuery = {
  predictiveSearch?: StorefrontAPI.Maybe<{
    products: Array<
      Pick<
        StorefrontAPI.Product,
        'id' | 'handle' | 'title' | 'availableForSale'
      > & {
        featuredImage?: StorefrontAPI.Maybe<
          Pick<StorefrontAPI.Image, 'url' | 'altText' | 'width' | 'height'>
        >;
        priceRange: {
          minVariantPrice: Pick<
            StorefrontAPI.MoneyV2,
            'amount' | 'currencyCode'
          >;
        };
      }
    >;
    collections: Array<
      Pick<StorefrontAPI.Collection, 'id' | 'handle' | 'title'> & {
        image?: StorefrontAPI.Maybe<
          Pick<StorefrontAPI.Image, 'url' | 'altText' | 'width' | 'height'>
        >;
      }
    >;
    pages: Array<Pick<StorefrontAPI.Page, 'id' | 'handle' | 'title'>>;
    articles: Array<Pick<StorefrontAPI.Article, 'id' | 'handle' | 'title'>>;
    queries: Array<Pick<StorefrontAPI.SearchQuerySuggestion, 'text'>>;
  }>;
  search: {
    edges: Array<
      Pick<StorefrontAPI.SearchResultItemEdge, 'cursor'> & {
        node:
          | {__typename: 'Article' | 'Page'}
          | ({__typename: 'Product'} & Pick<
              StorefrontAPI.Product,
              'id' | 'handle' | 'title' | 'availableForSale'
            > & {
                featuredImage?: StorefrontAPI.Maybe<
                  Pick<
                    StorefrontAPI.Image,
                    'url' | 'altText' | 'width' | 'height'
                  >
                >;
                priceRange: {
                  minVariantPrice: Pick<
                    StorefrontAPI.MoneyV2,
                    'amount' | 'currencyCode'
                  >;
                };
              });
      }
    >;
    pageInfo: Pick<StorefrontAPI.PageInfo, 'hasNextPage' | 'hasPreviousPage'>;
  };
};

export type WishlistThumbsQueryVariables = StorefrontAPI.Exact<{
  query: StorefrontAPI.Scalars['String']['input'];
  country?: StorefrontAPI.InputMaybe<StorefrontAPI.CountryCode>;
  language?: StorefrontAPI.InputMaybe<StorefrontAPI.LanguageCode>;
}>;

export type WishlistThumbsQuery = {
  products: {
    nodes: Array<
      Pick<StorefrontAPI.Product, 'handle'> & {
        featuredImage?: StorefrontAPI.Maybe<Pick<StorefrontAPI.Image, 'url'>>;
        images: {edges: Array<{node: Pick<StorefrontAPI.Image, 'url'>}>};
        priceRange: {
          minVariantPrice: Pick<
            StorefrontAPI.MoneyV2,
            'amount' | 'currencyCode'
          >;
          maxVariantPrice: Pick<
            StorefrontAPI.MoneyV2,
            'amount' | 'currencyCode'
          >;
        };
        variants: {
          nodes: Array<
            Pick<StorefrontAPI.ProductVariant, 'id' | 'availableForSale'> & {
              image?: StorefrontAPI.Maybe<Pick<StorefrontAPI.Image, 'url'>>;
              price: Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>;
              compareAtPrice?: StorefrontAPI.Maybe<
                Pick<StorefrontAPI.MoneyV2, 'amount' | 'currencyCode'>
              >;
            }
          >;
        };
      }
    >;
  };
};

interface GeneratedQueryTypes {
  '#graphql\n  query Article(\n    $articleHandle: String!\n    $blogHandle: String!\n    $country: CountryCode\n    $language: LanguageCode\n  ) @inContext(language: $language, country: $country) {\n    blog(handle: $blogHandle) {\n      articleByHandle(handle: $articleHandle) {\n        title\n        contentHtml\n        publishedAt\n        author: authorV2 {\n          name\n        }\n        image {\n          id\n          altText\n          url\n          width\n          height\n        }\n        seo {\n          description\n          title\n        }\n      }\n    }\n  }\n': {
    return: ArticleQuery;
    variables: ArticleQueryVariables;
  };
  '#graphql\n  query BlogIndexQuery(\n    $language: LanguageCode\n    $blogHandle: String!\n    $first: Int\n    $last: Int\n    $startCursor: String\n    $endCursor: String\n  ) @inContext(language: $language) {\n    blog(handle: $blogHandle) {\n      title\n      seo {\n        title\n        description\n      }\n      articles(\n        first: $first,\n        last: $last,\n        before: $startCursor,\n        after: $endCursor\n      ) {\n        nodes {\n          ...ArticleItem\n        }\n        pageInfo {\n          hasPreviousPage\n          hasNextPage\n          hasNextPage\n          endCursor\n          startCursor\n        }\n\n      }\n    }\n  }\n  fragment ArticleItem on Article {\n    author: authorV2 {\n      name\n    }\n    contentHtml\n    handle\n    id\n    image {\n      id\n      altText\n      url\n      width\n      height\n    }\n    publishedAt\n    title\n    blog {\n      handle\n    }\n  }\n': {
    return: BlogIndexQueryQuery;
    variables: BlogIndexQueryQueryVariables;
  };
  '#graphql\n  query Blogs(\n    $country: CountryCode\n    $endCursor: String\n    $first: Int\n    $language: LanguageCode\n    $last: Int\n    $startCursor: String\n  ) @inContext(country: $country, language: $language) {\n    blogs(\n      first: $first,\n      last: $last,\n      before: $startCursor,\n      after: $endCursor\n    ) {\n      pageInfo {\n        hasNextPage\n        hasPreviousPage\n        startCursor\n        endCursor\n      }\n      nodes {\n        title\n        handle\n        seo {\n          title\n          description\n        }\n      }\n    }\n  }\n': {
    return: BlogsQuery;
    variables: BlogsQueryVariables;
  };
  '#graphql\n  query Catalog(\n    $country: CountryCode\n    $language: LanguageCode\n    $first: Int\n    $last: Int\n    $startCursor: String\n    $endCursor: String\n  ) @inContext(country: $country, language: $language) {\n    products(first: $first, last: $last, before: $startCursor, after: $endCursor) {\n      nodes {\n        ...AllCollectionsProductItem\n      }\n      pageInfo {\n        hasPreviousPage\n        hasNextPage\n        startCursor\n        endCursor\n      }\n    }\n  }\n  #graphql\n  fragment ProductItem on Product {\n    id\n    handle\n    title\n    vendor\n    productType\n    tags\n    description\n    availableForSale\n    featuredImage {\n      altText\n      url\n    }\n    variants(first: 2) {\n      nodes {\n        id\n        availableForSale\n        selectedOptions {\n          name\n          value\n        }\n        image {\n          url\n          altText\n        }\n        price {\n          amount\n          currencyCode\n        }\n        compareAtPrice {\n          amount\n          currencyCode\n        }\n        title\n      }\n    }\n  }\n\n': {
    return: CatalogQuery;
    variables: CatalogQueryVariables;
  };
  '#graphql\n  query shopQuery($country: CountryCode, $language: LanguageCode)\n  @inContext(country: $country, language: $language) {\n    shop {\n      name\n      description\n    }\n  }\n': {
    return: ShopQueryQuery;
    variables: ShopQueryQueryVariables;
  };
  '#graphql\n  query seoCollectionContent($handle: String, $country: CountryCode, $language: LanguageCode)\n  @inContext(country: $country, language: $language) {\n    hero: collection(handle: $handle) {\n      ...CollectionContent\n    }\n    shop {\n      name\n      description\n    }\n  }\n  #graphql\n  fragment CollectionContent on Collection {\n    id\n    handle\n    title\n    descriptionHtml\n    heading: metafield(namespace: "hero", key: "title") {\n      value\n    }\n    byline: metafield(namespace: "hero", key: "byline") {\n      value\n    }\n    cta: metafield(namespace: "hero", key: "cta") {\n      value\n    }\n    spread: metafield(namespace: "hero", key: "spread") {\n      reference {\n        ...Media\n      }\n    }\n    spreadSecondary: metafield(namespace: "hero", key: "spread_secondary") {\n      reference {\n        ...Media\n      }\n    }\n  }\n#graphql\n  fragment Media on Media {\n    __typename\n    mediaContentType\n    alt\n    previewImage {\n      url\n    }\n    ... on MediaImage {\n      id\n      image {\n        id\n        url\n        width\n        height\n      }\n    }\n    ... on Video {\n      id\n      sources {\n        mimeType\n        url\n      }\n    }\n    ... on Model3d {\n      id\n      sources {\n        mimeType\n        url\n      }\n    }\n    ... on ExternalVideo {\n      id\n      embedUrl\n      host\n    }\n  }\n\n\n': {
    return: SeoCollectionContentQuery;
    variables: SeoCollectionContentQueryVariables;
  };
  '#graphql\n  query ProductInfo(\n    $country: CountryCode\n    $language: LanguageCode\n    $handle: String!\n  ) @inContext(country: $country, language: $language) {\n    product(handle: $handle) {\n      id\n      title\n      vendor\n      handle\n    }\n  }\n': {
    return: ProductInfoQuery;
    variables: ProductInfoQueryVariables;
  };
  '#graphql\n  query Product(\n    $country: CountryCode\n    $language: LanguageCode\n    $handle: String!\n    $selectedOptions: [SelectedOptionInput!]!\n  ) @inContext(country: $country, language: $language) {\n    product(handle: $handle) {\n      id\n      title\n      vendor\n      handle\n      publishedAt\n      descriptionHtml\n      description\n      summary: description(truncateAt: 200)\n      options {\n        name\n        values\n      }\n      selectedVariant: variantBySelectedOptions(selectedOptions: $selectedOptions, ignoreUnknownOptions: true, caseInsensitiveMatch: true) {\n        ...ProductVariantFragment\n      }\n      media(first: 7) {\n        nodes {\n          ...Media\n        }\n      }\n      variants(first: 1) {\n        nodes {\n          ...ProductVariantFragment\n        }\n      }\n      seo {\n        description\n        title\n      }\n    }\n    shop {\n      name\n      primaryDomain {\n        url\n      }\n      shippingPolicy {\n        body\n        handle\n      }\n      refundPolicy {\n        body\n        handle\n      }\n    }\n  }\n  #graphql\n  fragment Media on Media {\n    __typename\n    mediaContentType\n    alt\n    previewImage {\n      url\n    }\n    ... on MediaImage {\n      id\n      image {\n        id\n        url\n        width\n        height\n      }\n    }\n    ... on Video {\n      id\n      sources {\n        mimeType\n        url\n      }\n    }\n    ... on Model3d {\n      id\n      sources {\n        mimeType\n        url\n      }\n    }\n    ... on ExternalVideo {\n      id\n      embedUrl\n      host\n    }\n  }\n\n  #graphql\n  fragment ProductVariant on ProductVariant {\n    availableForSale\n    quantityAvailable\n    taxable\n    compareAtPrice {\n      amount\n      currencyCode\n    }\n    id\n    image {\n      __typename\n      id\n      url\n      altText\n      width\n      height\n    }\n    price {\n      amount\n      currencyCode\n    }\n    selectedOptions {\n      name\n      value\n    }\n    sku\n    title\n    unitPrice {\n      amount\n      currencyCode\n    }\n  }\n\n': {
    return: ProductQuery;
    variables: ProductQueryVariables;
  };
  '#graphql\n  query productRecommendations(\n    $productId: ID!\n    $count: Int\n    $country: CountryCode\n    $language: LanguageCode\n  ) @inContext(country: $country, language: $language) {\n    recommended: productRecommendations(productId: $productId) {\n      ...ProductCard\n    }\n    additional: products(first: $count, sortKey: BEST_SELLING) {\n      nodes {\n        ...ProductCard\n      }\n    }\n  }\n  #graphql\n  fragment ProductCard on Product {\n    id\n    title\n    publishedAt\n    handle\n    vendor\n    variants(first: 10) {\n      nodes {\n        id\n        availableForSale\n        image {\n          url\n          altText\n          width\n          height\n        }\n        price {\n          amount\n          currencyCode\n        }\n        compareAtPrice {\n          amount\n          currencyCode\n        }\n        selectedOptions {\n          name\n          value\n        }\n        product {\n          handle\n          title\n        }\n        sku\n      }\n    }\n  }\n\n': {
    return: ProductRecommendationsQuery;
    variables: ProductRecommendationsQueryVariables;
  };
  '#graphql\n  query CollectionInfo(\n    $handle: String!,\n    $country: CountryCode,\n    $language: LanguageCode\n  ) @inContext(country: $country, language: $language) {\n    collection(handle: $handle) {\n      id\n      handle\n      title\n      description\n      seo {\n        description\n        title\n      }\n      image {\n        id\n        url\n        width\n        height\n        altText\n      }\n    }\n  }\n': {
    return: CollectionInfoQuery;
    variables: CollectionInfoQueryVariables;
  };
  '#graphql\n  query CollectionDetails(\n    $handle: String!\n    $country: CountryCode\n    $language: LanguageCode\n    $filters: [ProductFilter!]\n    $sortKey: ProductCollectionSortKeys!\n    $reverse: Boolean\n    $first: Int\n    $last: Int\n    $startCursor: String\n    $endCursor: String\n  ) @inContext(country: $country, language: $language) {\n    collection(handle: $handle) {\n      id\n      handle\n      title\n      description\n      seo {\n        description\n        title\n      }\n      image {\n        id\n        url\n        width\n        height\n        altText\n      }\n      products(\n        first: $first,\n        last: $last,\n        before: $startCursor,\n        after: $endCursor,\n        filters: $filters,\n        sortKey: $sortKey,\n        reverse: $reverse\n      ) {\n        filters {\n          id\n          label\n          type\n          values {\n            id\n            label\n            count\n            input\n          }\n        }\n        nodes {\n          ...ProductCard\n        }\n        pageInfo {\n          hasPreviousPage\n          hasNextPage\n          endCursor\n          startCursor\n        }\n      }\n    }\n    collections(first: 100) {\n      edges {\n        node {\n          title\n          handle\n        }\n      }\n    }\n  }\n  #graphql\n  fragment ProductCard on Product {\n    id\n    title\n    publishedAt\n    handle\n    vendor\n    variants(first: 10) {\n      nodes {\n        id\n        availableForSale\n        image {\n          url\n          altText\n          width\n          height\n        }\n        price {\n          amount\n          currencyCode\n        }\n        compareAtPrice {\n          amount\n          currencyCode\n        }\n        selectedOptions {\n          name\n          value\n        }\n        product {\n          handle\n          title\n        }\n        sku\n      }\n    }\n  }\n\n': {
    return: CollectionDetailsQuery;
    variables: CollectionDetailsQueryVariables;
  };
  '#graphql\n  query Collections(\n    $country: CountryCode\n    $language: LanguageCode\n    $first: Int\n    $last: Int\n    $startCursor: String\n    $endCursor: String\n  ) @inContext(country: $country, language: $language) {\n    collections(first: $first, last: $last, before: $startCursor, after: $endCursor) {\n      nodes {\n        id\n        title\n        description\n        handle\n        seo {\n          description\n          title\n        }\n        image {\n          id\n          url\n          width\n          height\n          altText\n        }\n      }\n      pageInfo {\n        hasPreviousPage\n        hasNextPage\n        startCursor\n        endCursor\n      }\n    }\n  }\n': {
    return: CollectionsQuery;
    variables: CollectionsQueryVariables;
  };
  '#graphql\n  query PaginatedProductsSearch(\n    $country: CountryCode\n    $endCursor: String\n    $first: Int\n    $language: LanguageCode\n    $last: Int\n    $searchTerm: String\n    $startCursor: String\n  ) @inContext(country: $country, language: $language) {\n    products(\n      first: $first,\n      last: $last,\n      before: $startCursor,\n      after: $endCursor,\n      sortKey: RELEVANCE,\n      query: $searchTerm\n    ) {\n      nodes {\n        ...ProductCard\n      }\n      pageInfo {\n        startCursor\n        endCursor\n        hasNextPage\n        hasPreviousPage\n      }\n    }\n  }\n\n  #graphql\n  fragment ProductCard on Product {\n    id\n    title\n    publishedAt\n    handle\n    vendor\n    variants(first: 10) {\n      nodes {\n        id\n        availableForSale\n        image {\n          url\n          altText\n          width\n          height\n        }\n        price {\n          amount\n          currencyCode\n        }\n        compareAtPrice {\n          amount\n          currencyCode\n        }\n        selectedOptions {\n          name\n          value\n        }\n        product {\n          handle\n          title\n        }\n        sku\n      }\n    }\n  }\n\n': {
    return: PaginatedProductsSearchQuery;
    variables: PaginatedProductsSearchQueryVariables;
  };
  '#graphql\n  query Blog(\n    $language: LanguageCode\n    $blogHandle: String!\n    $pageBy: Int!\n    $cursor: String\n  ) @inContext(language: $language) {\n    blog(handle: $blogHandle) {\n      title\n      handle\n      seo {\n        title\n        description\n      }\n      articles(first: $pageBy, after: $cursor) {\n        edges {\n          node {\n            ...Article\n          }\n        }\n      }\n    }\n  }\n\n  fragment Article on Article {\n    author: authorV2 {\n      name\n    }\n    contentHtml\n    excerpt\n    excerptHtml\n    handle\n    id\n    image {\n      id\n      altText\n      url\n      width\n      height\n    }\n    publishedAt\n    title\n  }\n': {
    return: BlogQuery;
    variables: BlogQueryVariables;
  };
  '#graphql\n  query ArticleDetails(\n    $language: LanguageCode\n    $blogHandle: String!\n    $articleHandle: String!\n  ) @inContext(language: $language) {\n    blog(handle: $blogHandle) {\n      articleByHandle(handle: $articleHandle) {\n        title\n        contentHtml\n        publishedAt\n        tags\n        author: authorV2 {\n          name\n        }\n        image {\n          id\n          altText\n          url\n          width\n          height\n        }\n        seo {\n          description\n          title\n        }\n      }\n      articles (first: 20) {\n        nodes {\n            ...Article\n        }\n      }\n    }\n  }\n  fragment Article on Article {\n    author: authorV2 {\n      name\n    }\n    contentHtml\n    excerpt\n    excerptHtml\n    handle\n    id\n    image {\n      id\n      altText\n      url\n      width\n      height\n    }\n    publishedAt\n    title\n  }\n': {
    return: ArticleDetailsQuery;
    variables: ArticleDetailsQueryVariables;
  };
  '#graphql\n  query AllProducts(\n    $country: CountryCode\n    $language: LanguageCode\n    $first: Int\n    $last: Int\n    $startCursor: String\n    $endCursor: String\n  ) @inContext(country: $country, language: $language) {\n    products(first: $first, last: $last, before: $startCursor, after: $endCursor) {\n      nodes {\n        ...ProductCard\n      }\n      pageInfo {\n        hasPreviousPage\n        hasNextPage\n        startCursor\n        endCursor\n      }\n    }\n  }\n  #graphql\n  fragment ProductCard on Product {\n    id\n    title\n    publishedAt\n    handle\n    vendor\n    variants(first: 10) {\n      nodes {\n        id\n        availableForSale\n        image {\n          url\n          altText\n          width\n          height\n        }\n        price {\n          amount\n          currencyCode\n        }\n        compareAtPrice {\n          amount\n          currencyCode\n        }\n        selectedOptions {\n          name\n          value\n        }\n        product {\n          handle\n          title\n        }\n        sku\n      }\n    }\n  }\n\n': {
    return: AllProductsQuery;
    variables: AllProductsQueryVariables;
  };
  '#graphql\n  query variants(\n    $country: CountryCode\n    $language: LanguageCode\n    $handle: String!\n  ) @inContext(country: $country, language: $language) {\n    product(handle: $handle) {\n      variants(first: 250) {\n        nodes {\n          ...ProductVariantFragment\n        }\n      }\n    }\n  }\n  #graphql\n  fragment ProductVariant on ProductVariant {\n    availableForSale\n    quantityAvailable\n    taxable\n    compareAtPrice {\n      amount\n      currencyCode\n    }\n    id\n    image {\n      __typename\n      id\n      url\n      altText\n      width\n      height\n    }\n    price {\n      amount\n      currencyCode\n    }\n    selectedOptions {\n      name\n      value\n    }\n    sku\n    title\n    unitPrice {\n      amount\n      currencyCode\n    }\n  }\n\n': {
    return: VariantsQuery;
    variables: VariantsQueryVariables;
  };
  '#graphql\n  query GetCollectionByHandle($handle: String!) {\n    collectionByHandle(handle: $handle) {\n      id\n      title\n      handle\n      image {\n        url\n        altText\n      }\n      products(first: 10) {\n        nodes {\n          id\n          title\n          handle\n          tags\n          descriptionHtml\n          priceRange {\n            minVariantPrice {\n              amount\n              currencyCode\n            }\n          }\n          compareAtPriceRange {\n            minVariantPrice {\n              amount\n              currencyCode\n            }\n          }\n          images(first: 3) {\n            nodes {\n              url\n              altText\n            }\n          }\n          variants(first: 5) {\n            nodes {\n              id\n              availableForSale\n              price {\n                amount\n                currencyCode\n              }\n              compareAtPrice {\n                amount\n                currencyCode\n              }\n              selectedOptions {\n                name\n                value\n              }\n            }\n          }\n        }\n      }\n    }\n  }\n': {
    return: GetCollectionByHandleQuery;
    variables: GetCollectionByHandleQueryVariables;
  };
  '#graphql\n  query GetHomepageCollectionByHandle($handle: String!) {\n    collectionByHandle(handle: $handle) {\n      id\n      title\n      handle\n      image {\n        url\n        altText\n      }\n      products(first: 10) {\n        nodes {\n          id\n          title\n          handle\n          tags\n          images(first: 2) {\n            nodes {\n              url\n              altText\n            }\n          }\n          variants(first: 3) {\n            nodes {\n              id\n              title\n              availableForSale\n              price {\n                amount\n                currencyCode\n              }\n              compareAtPrice {\n                amount\n                currencyCode\n              }\n              selectedOptions {\n                name\n                value\n              }\n              image {\n                url\n                altText\n              }\n            }\n          }\n        }\n      }\n    }\n  }\n': {
    return: GetHomepageCollectionByHandleQuery;
    variables: GetHomepageCollectionByHandleQueryVariables;
  };
  '#graphql\n  query GetHomepageCollectionMobileByHandle($handle: String!) {\n    collectionByHandle(handle: $handle) {\n      id\n      title\n      handle\n      image {\n        url\n        altText\n      }\n      products(first: 8) {\n        nodes {\n          id\n          title\n          handle\n          tags\n          images(first: 1) {\n            nodes {\n              url\n              altText\n            }\n          }\n          variants(first: 2) {\n            nodes {\n              id\n              title\n              availableForSale\n              price {\n                amount\n                currencyCode\n              }\n              compareAtPrice {\n                amount\n                currencyCode\n              }\n              selectedOptions {\n                name\n                value\n              }\n              image {\n                url\n                altText\n              }\n            }\n          }\n        }\n      }\n    }\n  }\n': {
    return: GetHomepageCollectionMobileByHandleQuery;
    variables: GetHomepageCollectionMobileByHandleQueryVariables;
  };
  '#graphql\n  query GetHomeProductByHandle($handle: String!) {\n    product(handle: $handle) {\n      id\n      title\n      handle\n      descriptionHtml\n      tags\n      images(first: 8) {\n        nodes {\n          url\n          altText\n        }\n      }\n      variants(first: 50) {\n        nodes {\n          id\n          availableForSale\n          price {\n            amount\n            currencyCode\n          }\n          compareAtPrice {\n            amount\n            currencyCode\n          }\n          selectedOptions {\n            name\n            value\n          }\n          image {\n            url\n            altText\n          }\n        }\n      }\n    }\n  }\n': {
    return: GetHomeProductByHandleQuery;
    variables: GetHomeProductByHandleQueryVariables;
  };
  '#graphql\n  query GetHomeProductMobileByHandle($handle: String!) {\n    product(handle: $handle) {\n      id\n      title\n      handle\n      descriptionHtml\n      tags\n      images(first: 3) {\n        nodes {\n          url\n          altText\n        }\n      }\n      variants(first: 10) {\n        nodes {\n          id\n          availableForSale\n          price {\n            amount\n            currencyCode\n          }\n          compareAtPrice {\n            amount\n            currencyCode\n          }\n          selectedOptions {\n            name\n            value\n          }\n          image {\n            url\n            altText\n          }\n        }\n      }\n    }\n  }\n': {
    return: GetHomeProductMobileByHandleQuery;
    variables: GetHomeProductMobileByHandleQueryVariables;
  };
  '#graphql\n  query GetSimpleCollection($handle: String!) {\n    collectionByHandle(handle: $handle) {\n      id\n      title\n      handle\n      image {\n        url\n        altText\n      }\n      products(first: 1) {\n        nodes {\n          id\n        }\n      }\n    }\n  }\n': {
    return: GetSimpleCollectionQuery;
    variables: GetSimpleCollectionQueryVariables;
  };
  '#graphql\n  fragment Shop on Shop {\n    id\n    name\n    description\n    primaryDomain {\n      url\n    }\n    brand {\n      logo {\n        image {\n          url\n        }\n      }\n    }\n  }\n  query Header(\n    $country: CountryCode\n    $headerMenuHandle: String!\n    $language: LanguageCode\n  ) @inContext(language: $language, country: $country) {\n    shop {\n      ...Shop\n    }\n    menu(handle: $headerMenuHandle) {\n      ...Menu\n    }\n  }\n  #graphql\n  fragment MenuItem on MenuItem {\n    id\n    resourceId\n    tags\n    title\n    type\n    url\n    resource {\n      ... on Collection {\n        __typename\n        id\n        handle\n        title\n        image {\n          src\n          url\n          altText\n        }\n      }\n    }\n  }\n  fragment LeafMenuItem on MenuItem {\n    ...MenuItem\n  }\n  fragment GrandChildMenuItem on MenuItem {\n    ...MenuItem\n    items {\n      ...LeafMenuItem\n    }\n  }\n  fragment ChildMenuItem on MenuItem {\n    ...MenuItem\n    items {\n      ...GrandChildMenuItem\n    }\n  }\n  fragment ParentMenuItem on MenuItem {\n    ...MenuItem\n    items {\n      ...ChildMenuItem\n    }\n  }\n  fragment Menu on Menu {\n    id\n    items {\n      ...ParentMenuItem\n    }\n  }\n\n': {
    return: HeaderQuery;
    variables: HeaderQueryVariables;
  };
  '#graphql\n  query Footer($shopMenuHandle: String!, $policiesMenuHandle: String!) {\n    shopMenu: menu(handle: $shopMenuHandle) {\n      id\n      items {\n        id\n        title\n        url\n      }\n    }\n    policiesMenu: menu(handle: $policiesMenuHandle) {\n      id\n      items {\n        id\n        title\n        url\n      }\n    }\n  }\n': {
    return: FooterQuery;
    variables: FooterQueryVariables;
  };
  '#graphql\n  query ProductRecommendations(\n    $productId: ID!,\n    $country: CountryCode,\n    $language: LanguageCode\n  ) @inContext(country: $country, language: $language) {\n    productRecommendations(productId: $productId) {\n      id\n      title\n      handle\n      images(first: 1) {\n        edges {\n          node {\n            url\n            altText\n          }\n        }\n      }\n      priceRange {\n        minVariantPrice {\n          amount\n          currencyCode\n        }\n      }\n      compareAtPriceRange {\n        minVariantPrice {\n          amount\n          currencyCode\n        }\n      }\n      variants(first: 1) {\n        nodes {\n          id\n          price {\n            amount\n            currencyCode\n          }\n          compareAtPrice {\n            amount\n            currencyCode\n          }\n        }\n      }\n    }\n  }\n': {
    return: ProductRecommendationsQuery;
    variables: ProductRecommendationsQueryVariables;
  };
  '#graphql\n  query MerchantCenterProducts($first: Int!, $after: String) {\n    products(first: $first, after: $after, query: "published_status:\'online_store:visible\'") {\n      pageInfo {\n        hasNextPage\n        endCursor\n      }\n      nodes {\n        id\n        handle\n        title\n        description\n        vendor\n        updatedAt\n        images(first: 20) {\n          nodes {\n            url\n            altText\n          }\n        }\n        variants(first: 100) {\n          nodes {\n            id\n            title\n            availableForSale\n            priceV2 {\n              amount\n              currencyCode\n            }\n          }\n        }\n      }\n    }\n  }\n': {
    return: MerchantCenterProductsQuery;
    variables: MerchantCenterProductsQueryVariables;
  };
  '#graphql\n  query MetaSitemapProducts($first: Int!, $after: String) {\n  products(first: $first, after: $after, query: "published_status:\'online_store:visible\'") {\n    pageInfo {\n      hasNextPage\n      endCursor\n    }\n    nodes {\n      id\n      handle\n      title\n      description\n      vendor\n      updatedAt\n      category {\n        id\n        name\n      }\n      images(first: 5) {\n        nodes {\n          url\n          altText\n        }\n      }\n      variants(first: 30) {\n        nodes {\n          id\n          title\n          availableForSale\n          priceV2 {\n            amount\n            currencyCode\n          }\n          image {\n            url\n          }\n          selectedOptions {\n            name\n            value\n          }\n        }\n      }\n    }\n  }\n}\n': {
    return: MetaSitemapProductsQuery;
    variables: MetaSitemapProductsQueryVariables;
  };
  '#graphql\n  query StoreRobots($country: CountryCode, $language: LanguageCode)\n   @inContext(country: $country, language: $language) {\n    shop {\n      id\n    }\n  }\n': {
    return: StoreRobotsQuery;
    variables: StoreRobotsQueryVariables;
  };
  '#graphql\n  query SitemapProducts($first: Int!, $after: String) {\n    products(first: $first, after: $after, query: "status:active AND published_status:\'online_store:visible\'") {\n      pageInfo {\n        hasNextPage\n        endCursor\n      }\n      nodes {\n        id\n        handle\n        createdAt\n        updatedAt\n        featuredImage {\n          url\n          altText\n        }\n      }\n    }\n  }\n': {
    return: SitemapProductsQuery;
    variables: SitemapProductsQueryVariables;
  };
  '#graphql\n  query SitemapCollections($first: Int!, $after: String) {\n    collections(first: $first, after: $after, query: "published_status:\'online_store:visible\'") {\n      pageInfo {\n        hasNextPage\n        endCursor\n      }\n      nodes {\n        id\n        handle\n        updatedAt\n      }\n    }\n  }\n': {
    return: SitemapCollectionsQuery;
    variables: SitemapCollectionsQueryVariables;
  };
  '#graphql\n  query Pages($first: Int!, $after: String) {\n    pages(first: $first, after: $after, query: "published_status:\'published\'") {\n      pageInfo {\n        hasNextPage\n        endCursor\n      }\n      nodes {\n        id\n        handle\n        updatedAt\n      }\n    }\n  }\n': {
    return: PagesQuery;
    variables: PagesQueryVariables;
  };
  '#graphql\n      query ShopDetails {\n        shop {\n          name\n          description\n        }\n      }\n    ': {
    return: ShopDetailsQuery;
    variables: ShopDetailsQueryVariables;
  };
  '#graphql\n  query ChatbotProductDetails($handle: String!) {\n    product(handle: $handle) {\n      id\n      handle\n      title\n      vendor\n      productType\n      description\n      descriptionHtml\n      onlineStoreUrl\n      featuredImage {\n        url\n        altText\n      }\n      priceRange {\n        minVariantPrice {\n          amount\n          currencyCode\n        }\n        maxVariantPrice {\n          amount\n          currencyCode\n        }\n      }\n      options {\n        name\n        values\n      }\n      variants(first: 12) {\n        nodes {\n          id\n          title\n          availableForSale\n          price {\n            amount\n            currencyCode\n          }\n          compareAtPrice {\n            amount\n            currencyCode\n          }\n          selectedOptions {\n            name\n            value\n          }\n        }\n      }\n    }\n  }\n': {
    return: ChatbotProductDetailsQuery;
    variables: ChatbotProductDetailsQueryVariables;
  };
  '#graphql\n  query ComplementarySourceProduct($handle: String!) {\n    product(handle: $handle) {\n      id\n      title\n      vendor\n      productType\n      tags\n    }\n  }\n': {
    return: ComplementarySourceProductQuery;
    variables: ComplementarySourceProductQueryVariables;
  };
  '#graphql\n  query ComplementaryCollectionProducts($handle: String!, $first: Int!, $after: String) {\n    collection(handle: $handle) {\n      products(first: $first, after: $after) {\n        pageInfo {\n          hasNextPage\n          endCursor\n        }\n        nodes {\n          id\n          title\n          handle\n          availableForSale\n          tags\n          images(first: 1) {\n            edges {\n              node {\n                url\n                altText\n              }\n            }\n          }\n          priceRange {\n            minVariantPrice {\n              amount\n              currencyCode\n            }\n          }\n          compareAtPriceRange {\n            minVariantPrice {\n              amount\n              currencyCode\n            }\n          }\n          variants(first: 1) {\n            nodes {\n              id\n              title\n              image {\n                url\n                altText\n              }\n              selectedOptions {\n                name\n                value\n              }\n              price {\n                amount\n                currencyCode\n              }\n              compareAtPrice {\n                amount\n                currencyCode\n              }\n            }\n          }\n        }\n      }\n    }\n  }\n': {
    return: ComplementaryCollectionProductsQuery;
    variables: ComplementaryCollectionProductsQueryVariables;
  };
  '#graphql\n      query ProductQuestions($id: ID!) {\n        product(id: $id) {\n          metafield(namespace: "custom", key: "questions") {\n            id\n            value\n          }\n        }\n      }\n    ': {
    return: ProductQuestionsQuery;
    variables: ProductQuestionsQueryVariables;
  };
  '#graphql\n    query GetFaqsByProduct($type: String!, $first: Int!) {\n      metaobjects(type: $type, first: $first) {\n        nodes {\n          id\n          fields {\n            key\n            value\n          }\n        }\n      }\n    }\n  ': {
    return: GetFaqsByProductQuery;
    variables: GetFaqsByProductQueryVariables;
  };
  '#graphql\n  query MenuSubmenuWithCollections($handle: String!) {\n    menu(handle: $handle) {\n      id\n      title\n      items {\n        id\n        title\n        url\n        resource {\n          __typename\n          ... on Collection {\n            id\n            handle\n            title\n            description\n            image {\n              url\n              altText\n            }\n            products(first: 50) {\n              nodes {\n                id\n                handle\n                title\n                availableForSale\n                featuredImage {\n                  id\n                  url\n                  altText\n                  width\n                  height\n                }\n                priceRange {\n                  minVariantPrice {\n                    amount\n                    currencyCode\n                  }\n                }\n              }\n            }\n          }\n        }\n      }\n    }\n  }\n': {
    return: MenuSubmenuWithCollectionsQuery;
    variables: MenuSubmenuWithCollectionsQueryVariables;
  };
  '#graphql\n    query ProductForContext($id: ID!) {\n      product(id: $id) {\n        id\n        handle\n        title\n        vendor\n        description\n        descriptionHtml\n        productType\n        priceRange {\n          minVariantPrice { amount currencyCode }\n          maxVariantPrice { amount currencyCode }\n        }\n      }\n    }\n  ': {
    return: ProductForContextQuery;
    variables: ProductForContextQueryVariables;
  };
  '#graphql\n      query ReadSummary($id: ID!) {\n        product(id: $id) {\n          id\n          metafield(namespace: "custom", key: "ai_summary") {\n            id\n            value\n          }\n        }\n      }\n    ': {
    return: ReadSummaryQuery;
    variables: ReadSummaryQueryVariables;
  };
  '#graphql\n      query ProductForSummary($id: ID!) {\n        product(id: $id) {\n          id\n          title\n          vendor\n          description\n        }\n      }\n    ': {
    return: ProductForSummaryQuery;
    variables: ProductForSummaryQueryVariables;
  };
  '#graphql\n      query TrackViewCustomerFromToken($token: String!) {\n        customer(customerAccessToken: $token) { id email }\n      }\n    ': {
    return: TrackViewCustomerFromTokenQuery;
    variables: TrackViewCustomerFromTokenQueryVariables;
  };
  '#graphql\n      query GetProd($handle: String!) {\n        product(handle: $handle) { id }\n      }\n    ': {
    return: GetProdQuery;
    variables: GetProdQueryVariables;
  };
  '#graphql\n      query UserHistoryCustomerFromToken($token: String!) {\n        customer(customerAccessToken: $token) { id }\n      }\n    ': {
    return: UserHistoryCustomerFromTokenQuery;
    variables: UserHistoryCustomerFromTokenQueryVariables;
  };
  '#graphql\n  query CartGetCollectionByHandle($handle: String!) {\n    collectionByHandle(handle: $handle) {\n      id\n      title\n      handle\n      image {\n        url\n        altText\n      }\n      products(first: 10) {\n        nodes {\n          id\n          title\n          handle\n          priceRange {\n            minVariantPrice {\n              amount\n              currencyCode\n            }\n          }\n          compareAtPriceRange {\n            minVariantPrice {\n              amount\n              currencyCode\n            }\n          }\n          images(first: 2) {\n            nodes {\n              url\n              altText\n            }\n          }\n          variants(first: 5) {\n            nodes {\n              id\n              availableForSale\n              price {\n                amount\n                currencyCode\n              }\n              compareAtPrice {\n                amount\n                currencyCode\n              }\n              selectedOptions {\n                name\n                value\n              }\n            }\n          }\n        }\n      }\n    }\n  }\n': {
    return: CartGetCollectionByHandleQuery;
    variables: CartGetCollectionByHandleQueryVariables;
  };
  '#graphql\n  query GetMenu($handle: String!) {\n    menu(handle: $handle) {\n      items {\n        title\n        url\n        resource {\n          __typename\n          ... on Collection {\n            id\n            title\n            description\n            handle\n            image {\n              url\n              altText\n            }\n            products(first: 1) {\n              nodes {\n                id\n              }\n            }\n          }\n        }\n      }\n    }\n  }\n': {
    return: GetMenuQuery;
    variables: GetMenuQueryVariables;
  };
  '#graphql\n  #graphql\n  fragment ProductItem on Product {\n    id\n    handle\n    title\n    vendor\n    productType\n    tags\n    description\n    availableForSale\n    featuredImage {\n      altText\n      url\n    }\n    variants(first: 2) {\n      nodes {\n        id\n        availableForSale\n        selectedOptions {\n          name\n          value\n        }\n        image {\n          url\n          altText\n        }\n        price {\n          amount\n          currencyCode\n        }\n        compareAtPrice {\n          amount\n          currencyCode\n        }\n        title\n      }\n    }\n  }\n\n  query Collection(\n    $handle: String!\n    $first: Int\n    $last: Int\n    $startCursor: String\n    $endCursor: String\n    $filters: [ProductFilter!]\n    $sortKey: ProductCollectionSortKeys\n    $reverse: Boolean\n  ) {\n    collection(handle: $handle) {\n      id\n      handle\n      title\n      description\n      seo {\n        title\n        description\n      }\n      image {\n        url\n        altText\n      }\n      products(\n        first: $first,\n        last: $last,\n        before: $startCursor,\n        after: $endCursor,\n        filters: $filters,\n        sortKey: $sortKey,\n        reverse: $reverse\n      ) {\n        filters {\n          id\n          label\n          type\n          values {\n            id\n            label\n            count\n            input\n          }\n        }\n        nodes {\n          ...ProductItem\n        }\n        pageInfo {\n          hasPreviousPage\n          hasNextPage\n          endCursor\n          startCursor\n        }\n      }\n    }\n  }\n': {
    return: CollectionQuery;
    variables: CollectionQueryVariables;
  };
  '#graphql\n  fragment Collection on Collection {\n    id\n    title\n    handle\n    products(first: 1) {\n      nodes {\n        id\n      }\n    }\n    image {\n      id\n      url\n      altText\n      width\n      height\n    }\n  }\n  query StoreCollections(\n    $country: CountryCode\n    $endCursor: String\n    $first: Int\n    $language: LanguageCode\n    $last: Int\n    $startCursor: String\n  ) @inContext(country: $country, language: $language) {\n    collections(\n      first: $first,\n      last: $last,\n      before: $startCursor,\n      after: $endCursor\n    ) {\n      nodes {\n        ...Collection\n      }\n      pageInfo {\n        hasNextPage\n        hasPreviousPage\n        startCursor\n        endCursor\n      }\n    }\n  }\n': {
    return: StoreCollectionsQuery;
    variables: StoreCollectionsQueryVariables;
  };
  '#graphql\n  query Page(\n    $language: LanguageCode,\n    $country: CountryCode,\n    $handle: String!\n  )\n  @inContext(language: $language, country: $country) {\n    page(handle: $handle) {\n      id\n      title\n      body\n      seo {\n        description\n        title\n      }\n    }\n  }\n': {
    return: PageQuery;
    variables: PageQueryVariables;
  };
  '#graphql\n  fragment Policy on ShopPolicy {\n    body\n    handle\n    id\n    title\n    url\n  }\n  query Policy(\n    $country: CountryCode\n    $language: LanguageCode\n    $privacyPolicy: Boolean!\n    $refundPolicy: Boolean!\n    $shippingPolicy: Boolean!\n    $termsOfService: Boolean!\n  ) @inContext(language: $language, country: $country) {\n    shop {\n      privacyPolicy @include(if: $privacyPolicy) {\n        ...Policy\n      }\n      shippingPolicy @include(if: $shippingPolicy) {\n        ...Policy\n      }\n      termsOfService @include(if: $termsOfService) {\n        ...Policy\n      }\n      refundPolicy @include(if: $refundPolicy) {\n        ...Policy\n      }\n    }\n  }\n': {
    return: PolicyQuery;
    variables: PolicyQueryVariables;
  };
  '#graphql\n  fragment PolicyItem on ShopPolicy {\n    id\n    title\n    handle\n  }\n  query Policies ($country: CountryCode, $language: LanguageCode)\n    @inContext(country: $country, language: $language) {\n    shop {\n      privacyPolicy {\n        ...PolicyItem\n      }\n      shippingPolicy {\n        ...PolicyItem\n      }\n      termsOfService {\n        ...PolicyItem\n      }\n      refundPolicy {\n        ...PolicyItem\n      }\n      subscriptionPolicy {\n        id\n        title\n        handle\n      }\n    }\n  }\n': {
    return: PoliciesQuery;
    variables: PoliciesQueryVariables;
  };
  '#graphql\n  query ProductPageProduct(\n    $country: CountryCode\n    $handle: String!\n    $language: LanguageCode\n    $selectedOptions: [SelectedOptionInput!]!\n  ) @inContext(country: $country, language: $language) {\n    product(handle: $handle) {\n      ...Product\n    }\n  }\n  #graphql\n  fragment Product on Product {\n    id\n    title\n    vendor\n    handle\n    descriptionHtml\n    description\n    productType\n    tags\n    collections(first: 1) {\n      edges {\n        node {\n          id\n          handle\n          title\n        }\n      }\n    }\n\n    priceRange {\n      minVariantPrice {\n        amount\n        currencyCode\n      }\n      maxVariantPrice {\n        amount\n        currencyCode\n      }\n    }\n\n    # Fetch product images for SEO or fallback usage\n    images(first: 100) {\n      edges {\n        node {\n          __typename\n          id\n          url\n          altText\n          width\n          height\n        }\n      }\n    }\n\n    # Add media for images / video (YouTube) / 3D, etc.\n    media(first: 100) {\n      edges {\n        node {\n          __typename\n          mediaContentType\n          alt\n          ... on MediaImage {\n            id\n            image {\n              url\n              altText\n              width\n              height\n            }\n          }\n          ... on Video {\n            id\n            sources {\n              url\n              mimeType\n            }\n          }\n          ... on ExternalVideo {\n            id\n            embedUrl\n            host\n          }\n          ... on Model3d {\n            id\n            sources {\n              url\n            }\n          }\n        }\n      }\n    }\n\n    options {\n      name\n      optionValues {\n        name\n      }\n    }\n    selectedVariant: variantBySelectedOptions(selectedOptions: $selectedOptions) {\n      ...ProductVariant\n    }\n    variants(first: 250) {\n      nodes {\n        ...ProductVariant\n      }\n    }\n    seo {\n      description\n      title\n    }\n    metafieldOfficialProductLink: metafield(namespace: "custom", key: "official_product_link") {\n      value\n    }\n    metafieldCondition: metafield(namespace: "custom", key: "condition") {\n      value\n    }\n    metafieldWarranty: metafield(namespace: "custom", key: "warranty") {\n      value\n    }\n    metafieldShipping: metafield(namespace: "custom", key: "shipping") {\n      value\n    }\n    metafieldVat: metafield(namespace: "custom", key: "vat") {\n      value\n    }\n    metafieldSubscription: metafield(namespace: "custom", key: "subscription") {\n      value\n    }\n\n    # AI SUMMARY (added)\n    metafieldAiSummary: metafield(namespace: "custom", key: "ai_summary") {\n      value\n    }\n  }\n  #graphql\n  fragment ProductVariant on ProductVariant {\n    availableForSale\n    quantityAvailable\n    taxable\n    compareAtPrice {\n      amount\n      currencyCode\n    }\n    id\n    image {\n      __typename\n      id\n      url\n      altText\n      width\n      height\n    }\n    price {\n      amount\n      currencyCode\n    }\n    selectedOptions {\n      name\n      value\n    }\n    sku\n    title\n    unitPrice {\n      amount\n      currencyCode\n    }\n  }\n\n\n': {
    return: ProductPageProductQuery;
    variables: ProductPageProductQueryVariables;
  };
  '#graphql\n    query SearchOldOldProductsWithFilters(\n      $query: String!,\n      $first: Int,\n      $last: Int,\n      $after: String,\n      $before: String,\n      $prefix: SearchPrefixQueryType,\n      $productFilters: [ProductFilter!],\n      $sortKey: SearchSortKeys,\n      $reverse: Boolean\n    ) {\n      search(\n        query: $query,\n        first: $first,\n        last: $last,\n        after: $after,\n        before: $before,\n        prefix: $prefix,\n        productFilters: $productFilters,\n        sortKey: $sortKey,\n        reverse: $reverse,\n        types: PRODUCT\n      ) {\n        edges {\n          node {\n            ... on Product {\n              id\n              title\n              handle\n              vendor\n              productType\n              tags\n              description\n              images(first: 3) {\n                nodes {\n                  url\n                  altText\n                }\n              }\n              priceRange {\n                minVariantPrice {\n                  amount\n                  currencyCode\n                }\n              }\n              variants(first: 1) {\n                nodes {\n                  id\n                  sku\n                  price {\n                    amount\n                    currencyCode\n                  }\n                  image {\n                    url\n                    altText\n                  }\n                  availableForSale\n                  compareAtPrice {\n                    amount\n                    currencyCode\n                  }\n                  selectedOptions {\n                    name\n                    value\n                  }\n                }\n              }\n            }\n          }\n        }\n        productFilters {\n          id\n          label\n          type\n          values {\n            id\n            label\n            count\n            input\n          }\n        }\n        pageInfo {\n          hasNextPage\n          hasPreviousPage\n          startCursor\n          endCursor\n        }\n        totalCount\n      }\n    }\n  ': {
    return: SearchOldOldProductsWithFiltersQuery;
    variables: SearchOldOldProductsWithFiltersQueryVariables;
  };
  '#graphql\n  query PredictiveSearch(\n    $country: CountryCode\n    $language: LanguageCode\n    $limitScope: PredictiveSearchLimitScope!\n    $term: String!\n    $types: [PredictiveSearchType!]\n  ) @inContext(country: $country, language: $language) {\n    predictiveSearch(\n      limitScope: $limitScope,\n      query: $term,\n      types: $types\n    ) {\n      articles {\n        ...PredictiveArticle\n      }\n      collections {\n        ...PredictiveCollection\n      }\n      pages {\n        ...PredictivePage\n      }\n      products {\n        ...PredictiveProduct\n      }\n      queries {\n        ...PredictiveQuery\n      }\n    }\n  }\n  #graphql\n  fragment PredictiveArticle on Article {\n    __typename\n    id\n    title\n    handle\n    blog {\n      handle\n    }\n    image {\n      url\n      altText\n      width\n      height\n    }\n    trackingParameters\n  }\n\n  #graphql\n  fragment PredictiveCollection on Collection {\n    __typename\n    id\n    title\n    handle\n    image {\n      url\n      altText\n      width\n      height\n    }\n    trackingParameters\n  }\n\n  #graphql\n  fragment PredictivePage on Page {\n    __typename\n    id\n    title\n    handle\n    trackingParameters\n  }\n\n  #graphql\n  fragment PredictiveProduct on Product {\n    __typename\n    id\n    title\n    vendor\n    productType\n    tags\n    description\n    handle\n    trackingParameters\n    variants(first: 1) {\n      nodes {\n        id\n        sku\n        image {\n          url\n          altText\n          width\n          height\n        }\n        price {\n          amount\n          currencyCode\n        }\n        compareAtPrice {\n          amount\n          currencyCode\n        }\n      }\n    }\n  }\n\n  #graphql\n  fragment PredictiveQuery on SearchQuerySuggestion {\n    __typename\n    text\n    styledText\n    trackingParameters\n  }\n\n': {
    return: PredictiveSearchQuery;
    variables: PredictiveSearchQueryVariables;
  };
  '#graphql\n    query SearchOldOldProductsBasic(\n      $query: String!,\n      $first: Int,\n      $last: Int,\n      $after: String,\n      $before: String,\n      $prefix: SearchPrefixQueryType\n    ) {\n      search(\n        query: $query,\n        first: $first,\n        last: $last,\n        after: $after,\n        before: $before,\n        prefix: $prefix,\n        types: PRODUCT\n      ) {\n        edges {\n          node {\n            ... on Product {\n              id\n              title\n              handle\n              vendor\n              productType\n              tags\n              description\n              images(first: 3) {\n                nodes {\n                  url\n                  altText\n                }\n              }\n              priceRange {\n                minVariantPrice {\n                  amount\n                  currencyCode\n                }\n              }\n              variants(first: 1) {\n                nodes {\n                  id\n                  sku\n                  price {\n                    amount\n                    currencyCode\n                  }\n                  image {\n                    url\n                    altText\n                  }\n                  availableForSale\n                  compareAtPrice {\n                    amount\n                    currencyCode\n                  }\n                  selectedOptions {\n                    name\n                    value\n                  }\n                }\n              }\n            }\n          }\n        }\n        pageInfo {\n          hasNextPage\n          hasPreviousPage\n          startCursor\n          endCursor\n        }\n        totalCount\n      }\n    }\n  ': {
    return: SearchOldOldProductsBasicQuery;
    variables: SearchOldOldProductsBasicQueryVariables;
  };
  '#graphql\n  query SearchAndPredictive(\n    $query: String!\n    $limit: Int!\n    $country: CountryCode\n    $language: LanguageCode\n    $searchAfter: String\n    $searchBefore: String\n    $searchFirst: Int\n    $searchLast: Int\n  ) @inContext(country: $country, language: $language) {\n    predictiveSearch(\n      query: $query\n      limit: $limit\n      limitScope: EACH\n      searchableFields: [\n        TITLE\n        PRODUCT_TYPE\n        VARIANTS_TITLE\n        VENDOR\n        VARIANTS_SKU\n        TAG\n      ]\n    ) {\n      products {\n        id\n        handle\n        title\n        availableForSale\n        featuredImage {\n          url\n          altText\n          width\n          height\n        }\n        priceRange {\n          minVariantPrice {\n            amount\n            currencyCode\n          }\n        }\n      }\n      collections {\n        id\n        handle\n        title\n        image {\n          url\n          altText\n          width\n          height\n        }\n      }\n      pages {\n        id\n        handle\n        title\n      }\n      articles {\n        id\n        handle\n        title\n      }\n      queries {\n        text\n      }\n    }\n\n    search(\n      query: $query\n      types: [PRODUCT]\n      first: $searchFirst\n      last: $searchLast\n      after: $searchAfter\n      before: $searchBefore\n    ) {\n      edges {\n        cursor\n        node {\n          __typename\n          ... on Product {\n            id\n            handle\n            title\n            availableForSale\n            featuredImage {\n              url\n              altText\n              width\n              height\n            }\n            priceRange {\n              minVariantPrice {\n                amount\n                currencyCode\n              }\n            }\n          }\n        }\n      }\n      pageInfo {\n        hasNextPage\n        hasPreviousPage\n      }\n    }\n  }\n': {
    return: SearchAndPredictiveQuery;
    variables: SearchAndPredictiveQueryVariables;
  };
  '#graphql\n  query WishlistThumbs($query: String!, $country: CountryCode, $language: LanguageCode)\n  @inContext(country: $country, language: $language) {\n    products(first: 50, query: $query) {\n      nodes {\n        handle\n\n        featuredImage { url }\n        images(first: 1) { edges { node { url } } }\n\n        priceRange {\n          minVariantPrice { amount currencyCode }\n          maxVariantPrice { amount currencyCode }\n        }\n\n        variants(first: 250) {\n          nodes {\n            id\n            availableForSale\n            image { url }\n            price { amount currencyCode }\n            compareAtPrice { amount currencyCode }\n          }\n        }\n      }\n    }\n  }\n': {
    return: WishlistThumbsQuery;
    variables: WishlistThumbsQueryVariables;
  };
}

interface GeneratedMutationTypes {}

declare module '@shopify/hydrogen' {
  interface StorefrontQueries extends GeneratedQueryTypes {}
  interface StorefrontMutations extends GeneratedMutationTypes {}
}

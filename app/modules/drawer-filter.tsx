import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
} from "@headlessui/react";
import { CaretDown, Sliders } from "@phosphor-icons/react";
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "@remix-run/react";
import type {
  Filter,
  ProductFilter,
} from "@shopify/hydrogen/storefront-api-types";
import clsx from "clsx";
import type { SyntheticEvent } from "react";
import React, { useState, useEffect, useCallback } from "react";
import Button from "../components/button";
import { Checkbox } from "../components/checkbox";
import { IconCaretDown, IconCaretRight } from "../components/icons";
import { FILTER_URL_PREFIX } from "../lib/const";
import type { AppliedFilter, SortParam } from "../lib/filter";
import { getAppliedFilterLink, getFilterLink, getSortLink } from "../lib/filter";
import { Drawer, useDrawer } from "./drawer";
import { IconFourGrid, IconOneGrid, IconThreeGrid, IconTwoGrid } from "./icon";
import { Input } from "./input";

type DrawerFilterProps = {
  productNumber?: number;
  filters: Filter[];
  appliedFilters?: AppliedFilter[];
  collections?: Array<{ handle: string; title: string }>;
  showSearchSort?: boolean;
  numberInRow?: number;
  onLayoutChange: (number: number) => void;
};

function ListItemFilter({
  option,
  appliedFilters,
}: {
  option: Filter["values"][0];
  appliedFilters: AppliedFilter[];
}) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const location = useLocation();

  const isChecked = useCallback(() => {
    return appliedFilters.some(
      (filter) => JSON.stringify(filter.filter) === option.input
    );
  }, [appliedFilters, option.input]);

  const [checked, setChecked] = useState(isChecked());

  useEffect(() => {
    setChecked(isChecked());
  }, [appliedFilters, isChecked]);

  const handleCheckedChange = (checked: boolean) => {
    setChecked(checked);
    if (checked) {
      const link = getFilterLink(option.input as string, params, location);
      navigate(link);
    } else {
      const filter = appliedFilters.find(
        (filter) => JSON.stringify(filter.filter) === option.input
      );
      if (filter) {
        let link = getAppliedFilterLink(filter, params, location);
        navigate(link);
      }
    }
  };

  return (
    <div className="flex gap-2 fltr-btn">
      <Checkbox
        checked={checked}
        onCheckedChange={handleCheckedChange}
      >
        {option.label}
      </Checkbox>
      <span>({option.count})</span>
    </div>
  );
}

export function FiltersDrawer({
  filters = [],
  appliedFilters = [],
  onRemoveFilter,
}: Omit<DrawerFilterProps, "children"> & { onRemoveFilter: (filter: AppliedFilter) => void }) {
  const [params] = useSearchParams();
  const location = useLocation();

  const filterMarkup = (filter: Filter, option: Filter["values"][0]) => {
    switch (filter.type) {
      case "PRICE_RANGE": {
        let priceFilter = params.get(`${FILTER_URL_PREFIX}price`);
        let price = priceFilter
          ? (JSON.parse(priceFilter) as ProductFilter["price"])
          : undefined;
        let min = Number.isNaN(Number(price?.min))
          ? undefined
          : Number(price?.min);
        let max = Number.isNaN(Number(price?.max))
          ? undefined
          : Number(price?.max);
        return <PriceRangeFilter min={min} max={max} />;
      }

      default:
        return (
          <ListItemFilter appliedFilters={appliedFilters} option={option} />
        );
    }
  };

  return (
    <div className="text-sm">
      {appliedFilters.length > 0 && (
        <div className="applied-filters">
          <h3>Applied Filters:</h3>
          {appliedFilters.map((filter, index) => (
            <div key={`${filter.label}-${index}`} className="applied-filter">
              <span>{filter.label}</span>
              <button
                type="button"
                onClick={() => {
                  if (typeof onRemoveFilter === 'function') {
                    onRemoveFilter(filter);
                  }
                }}
              >
                X
              </button>
            </div>
          ))}
        </div>
      )}
      {filters.map((filter: Filter) => (
        <Disclosure
          as="div"
          key={filter.id}
          className="w-full pb-6 pt-7 border-b"
        >
          {({ open }) => (
            <>
              <DisclosureButton as="div" className="cursor-pointer">
                <div className="flex w-full justify-between items-center">
                  <span className="text-sm">{filter.label}</span>
                  {open ? (
                    <IconCaretDown className="w-4 h-4" />
                  ) : (
                    <IconCaretRight className="w-4 h-4" />
                  )}
                </div>
              </DisclosureButton>
              <DisclosurePanel key={filter.id}>
                <ul key={filter.id} className="space-y-5 filter-list">
                  {filter.values?.map((option) => (
                    <li key={option.id}>{filterMarkup(filter, option)}</li>
                  ))}
                </ul>
              </DisclosurePanel>
            </>
          )}
        </Disclosure>
      ))}
    </div>
  );
}

const PRICE_RANGE_FILTER_DEBOUNCE = 500;

function PriceRangeFilter({ max, min }: { max?: number; min?: number }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const [minPrice, setMinPrice] = useState(min);
  const [maxPrice, setMaxPrice] = useState(max);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (minPrice === undefined && maxPrice === undefined) {
        params.delete(`${FILTER_URL_PREFIX}price`);
      } else {
        const price = {
          ...(minPrice === undefined ? {} : { min: minPrice }),
          ...(maxPrice === undefined ? {} : { max: maxPrice }),
        };
        params.set(`${FILTER_URL_PREFIX}price`, JSON.stringify(price));
      }
      navigate(`${location.pathname}?${params.toString()}`);
    }, PRICE_RANGE_FILTER_DEBOUNCE);

    return () => clearTimeout(timer);
  }, [minPrice, maxPrice, navigate, location.pathname, params]);

  const onChangeMax = (event: SyntheticEvent) => {
    const value = (event.target as HTMLInputElement).value;
    const newMaxPrice = Number.isNaN(Number.parseFloat(value))
      ? undefined
      : Number.parseFloat(value);
    setMaxPrice(newMaxPrice);
  };

  const onChangeMin = (event: SyntheticEvent) => {
    const value = (event.target as HTMLInputElement).value;
    const newMinPrice = Number.isNaN(Number.parseFloat(value))
      ? undefined
      : Number.parseFloat(value);
    setMinPrice(newMinPrice);
  };

  return (
    <div className="flex gap-6">
      <label className="flex items-center gap-1" htmlFor="minPrice">
        <span>$</span>
        <Input
          name="minPrice "
          type="number"
          value={minPrice ?? ""}
          placeholder="From"
          onChange={onChangeMin}
        />
      </label>
      <label className="flex items-center gap-1" htmlFor="maxPrice">
        <span>$</span>
        <Input
          name="maxPrice"
          type="number"
          value={maxPrice ?? ""}
          placeholder="To"
          onChange={onChangeMax}
        />
      </label>
    </div>
  );
}

export function DrawerFilter({
  filters,
  numberInRow,
  onLayoutChange = () => { }, // Default to a no-op function
  appliedFilters = [],
  productNumber = 0,
  showSearchSort = false,
  isDesktop = false,
}: DrawerFilterProps & { isDesktop: boolean }) {
  const { openDrawer, isOpen, closeDrawer } = useDrawer();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const location = useLocation();

  const handleRemoveFilter = (filter: AppliedFilter) => {
    console.log("Removing filter:", filter);
    const updatedParams = new URLSearchParams(params.toString());

    // Use the getAppliedFilterLink utility function instead
    const newUrl = getAppliedFilterLink(filter, params, location);
    navigate(newUrl);
  };

  return (
    <div className="border border-line/30 py-4 z-10 bg-white/10 sticky top-[15px] rounded-full backdrop-blur-lg max-w-[1500px] m-auto">
      <div className="gap-4 md:gap-8 flex w-full items-center justify-between">
        <div className="flex gap-2 justify-between flex-row-reverse m-auto w-11/12 rounded-3xl">
          <SortMenu showSearchSort={showSearchSort} />
          {!isDesktop && (
            <Button
              onClick={openDrawer}
              variant="outline"
              className="flex items-center gap-4 border py-2 rounded-3xl"
            >
              <Sliders size={18} />
              <span>Filter</span>
            </Button>
          )}
          {!isDesktop && (
            <Drawer
              open={isOpen}
              onClose={closeDrawer}
              openFrom="left"
              heading="Filter"
            >
              <div className="px-5 w-[360px] rounded-3xl">
                <FiltersDrawer
                  filters={filters}
                  appliedFilters={appliedFilters}
                  onRemoveFilter={handleRemoveFilter}
                  onLayoutChange={onLayoutChange}
                />
              </div>
            </Drawer>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SortMenu({
  showSearchSort = false,
}: {
  showSearchSort?: boolean;
}) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const location = useLocation();

  const productSortItems: { label: string; key: SortParam }[] = [
    { label: "Featured", key: "featured" },
    { label: "Price: Low - High", key: "price-low-high" },
    { label: "Price: High - Low", key: "price-high-low" },
    { label: "Best Selling", key: "best-selling" },
    { label: "Newest", key: "newest" },
  ];

  const searchSortItems: { label: string; key: SortParam }[] = [
    { label: "Price: Low - High", key: "price-low-high" },
    { label: "Price: High - Low", key: "price-high-low" },
    { label: "Relevance", key: "relevance" },
  ];

  const items = showSearchSort ? searchSortItems : productSortItems;
  const activeItem = items.find((item) => item.key === params.get("sort")) || items[0];

  const handleSort = (sortKey: SortParam) => {
    const newUrl = getSortLink(sortKey, params, location);
    navigate(newUrl);
  };

  return (
    <Menu as="div" className="relative z-10">
      <MenuButton className="flex items-center gap-1.5 h-10 border px-4 py-2.5">
        <span className="font-medium">Sort by: {activeItem.label}</span>
        <CaretDown />
      </MenuButton>
      <MenuItems
        as="nav"
        className="absolute right-0 top-12 flex h-fit w-40 flex-col gap-2 border border-line/75 bg-background p-5"
      >
        {items.map((item) => (
          <MenuItem key={item.label}>
            {() => (
              <button
                onClick={() => handleSort(item.key)}
                className={clsx(
                  "block w-full text-left text-base hover:underline underline-offset-4",
                  activeItem.key === item.key ? "font-bold" : "font-normal"
                )}
              >
                {item.label}
              </button>
            )}
          </MenuItem>
        ))}
      </MenuItems>
    </Menu>
  );
}
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
import React, { useMemo, useState } from "react";
import Button from "../components/button";
import { Checkbox } from "../components/checkbox";
import { IconCaretDown, IconCaretRight } from "../components/icons";
import { FILTER_URL_PREFIX } from "../lib/const";
import type { AppliedFilter, SortParam } from "../lib/filter";
import { getAppliedFilterLink, getFilterLink, getSortLink } from "../lib/filter";
import { Drawer, useDrawer } from "./drawer";
import { IconCaret, IconFourGrid, IconOneGrid, IconThreeGrid, IconTwoGrid, IconXMark } from "./icon";
import { Input } from "./input";
import { Props } from "@headlessui/react/dist/types";
import { useDebounce } from "react-use";

type SortFilterProps = {
  filters: Filter[];
  appliedFilters?: AppliedFilter[];
  children: React.ReactNode;
  collections?: Array<{ handle: string; title: string }>;
};

export function SortFilter({
  filters,
  appliedFilters = [],
  children,
}: SortFilterProps) {
  const { openDrawer, isOpen, closeDrawer } = useDrawer();
  const [numberInRow, setNumberInRow] = useState(4);
  const onLayoutChange = (number: number) => {
    setNumberInRow(number);
  };

  return (
    <div className="border-y border-line/30 py-4">
      <div className="gap-4 md:gap-8 flex w-full items-center justify-between">
        <div className="flex gap-1 flex-1">
          <button
            type="button"
            className={clsx(
              "border cursor-pointer hidden lg:block",
              numberInRow === 4 && " bg-gray-200"
            )}
            onClick={() => onLayoutChange(4)}
          >
            <IconFourGrid className="w-10 h-10" />
          </button>
          <button
            type="button"
            className={clsx(
              "border cursor-pointer hidden lg:block",
              numberInRow === 3 && " bg-gray-200"
            )}
            onClick={() => onLayoutChange(3)}
          >
            <IconThreeGrid className="w-10 h-10" />
          </button>
          <button
            type="button"
            className={clsx(
              "border cursor-pointer lg:hidden",
              numberInRow === 4 && "bg-gray-200"
            )}
            onClick={() => onLayoutChange(4)}
          >
            <IconTwoGrid className="w-10 h-10" />
          </button>
          <button
            type="button"
            className={clsx(
              "border cursor-pointer lg:hidden",
              numberInRow === 3 && "bg-gray-200"
            )}
            onClick={() => onLayoutChange(3)}
          >
            <IconOneGrid className="w-10 h-10" />
          </button>
        </div>
        <span className="flex-1 text-center">{children.length} Products</span>
        <div className="flex gap-2 flex-1 justify-end">
          <SortMenu />
          <Button
            onClick={openDrawer}
            variant="outline"
            className="flex items-center gap-1.5 border py-2"
          >
            <Sliders size={18} />
            <span>Filter</span>
          </Button>
          <Drawer
            open={isOpen}
            onClose={closeDrawer}
            openFrom="left"
            heading="Filter"
          >
            <div className="px-5 w-[360px]">
              <FiltersDrawer
                filters={filters}
                appliedFilters={appliedFilters}
              />
            </div>
          </Drawer>
        </div>
      </div>
      <div className="flex flex-col flex-wrap md:flex-row">
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}

export function FiltersDrawer({
  filters = [],
  appliedFilters = [],
}: Omit<Props, "children">) {
  const [params] = useSearchParams();
  const location = useLocation();

  const filterMarkup = (filter: Filter, option: Filter["values"][0]) => {
    switch (filter.type) {
      case "PRICE_RANGE": {
        const priceFilter = params.get(`${FILTER_URL_PREFIX}price`);
        const price = priceFilter
          ? (JSON.parse(priceFilter) as ProductFilter["price"])
          : undefined;
        const min = Number.isNaN(Number(price?.min))
          ? undefined
          : Number(price?.min);
        const max = Number.isNaN(Number(price?.max))
          ? undefined
          : Number(price?.max);

        return <PriceRangeFilter min={min} max={max} />;
      }

      default: {
        const to = getFilterLink(option.input as string, params, location);
        return (
          <Link
            className="focus:underline hover:underline"
            prefetch="intent"
            to={to}
          >
            {option.label}
          </Link>
        );
      }
    }
  };

  return (
    <>
      <nav className="py-8">
        {appliedFilters.length > 0 ? (
          <div className="pb-8">
            <AppliedFilters filters={appliedFilters} />
          </div>
        ) : null}

        <Heading as="h4" size="lead" className="pb-4">
          Filter By
        </Heading>
        <div className="divide-y">
          {filters.map((filter: Filter) => (
            <Disclosure as="div" key={filter.id} className="w-full">
              {({ open }) => (
                <>
                  <Disclosure.Button className="flex justify-between w-full py-4">
                    <Text size="lead">{filter.label}</Text>
                    <IconCaret direction={open ? "up" : "down"} />
                  </Disclosure.Button>
                  <Disclosure.Panel key={filter.id}>
                    <ul key={filter.id} className="py-2">
                      {filter.values?.map((option) => {
                        return (
                          <li key={option.id} className="pb-4">
                            {filterMarkup(filter, option)}
                          </li>
                        );
                      })}
                    </ul>
                  </Disclosure.Panel>
                </>
              )}
            </Disclosure>
          ))}
        </div>
      </nav>
    </>
  );
}

function AppliedFilters({ filters = [] }: { filters: AppliedFilter[] }) {
  const [params] = useSearchParams();
  const location = useLocation();
  return (
    <>
      <Heading as="h4" size="lead" className="pb-4">
        Applied filters
      </Heading>
      <div className="flex flex-wrap gap-2">
        {filters.map((filter: AppliedFilter) => {
          return (
            <Link
              to={getAppliedFilterLink(filter, params, location)}
              className="flex px-2 border rounded-full gap"
              key={`${filter.label}-${JSON.stringify(filter.filter)}`}
            >
              <span className="flex-grow">{filter.label}</span>
              <span>
                <IconXMark />
              </span>
            </Link>
          );
        })}
      </div>
    </>
  );
}

function getAppliedFilterLink(
  filter: AppliedFilter,
  params: URLSearchParams,
  location: Location,
) {
  let paramsClone = new URLSearchParams(params);
  for (let [key, value] of Object.entries(filter.filter)) {
    let fullKey = FILTER_URL_PREFIX + key;
    paramsClone.delete(fullKey, JSON.stringify(value));
  }
  return `${location.pathname}?${paramsClone.toString()}`;
}

function getSortLink(
  sort: SortParam,
  params: URLSearchParams,
  location: Location,
) {
  params.set("sort", sort);
  return `${location.pathname}?${params.toString()}`;
}

function getFilterLink(
  rawInput: string | ProductFilter,
  params: URLSearchParams,
  location: ReturnType<typeof useLocation>,
) {
  const paramsClone = new URLSearchParams(params);
  const newParams = filterInputToParams(rawInput, paramsClone);
  return `${location.pathname}?${newParams.toString()}`;
}

const PRICE_RANGE_FILTER_DEBOUNCE = 500;

function PriceRangeFilter({ max, min }: { max?: number; min?: number }) {
  const location = useLocation();
  const params = useMemo(
    () => new URLSearchParams(location.search),
    [location.search],
  );
  const navigate = useNavigate();

  const [minPrice, setMinPrice] = useState(min);
  const [maxPrice, setMaxPrice] = useState(max);

  useDebounce(
    () => {
      if (minPrice === undefined && maxPrice === undefined) {
        params.delete(`${FILTER_URL_PREFIX}price`);
        navigate(`${location.pathname}?${params.toString()}`);
        return;
      }

      const price = {
        ...(minPrice === undefined ? {} : { min: minPrice }),
        ...(maxPrice === undefined ? {} : { max: maxPrice }),
      };
      const newParams = filterInputToParams({ price }, params);
      navigate(`${location.pathname}?${newParams.toString()}`);
    },
    PRICE_RANGE_FILTER_DEBOUNCE,
    [minPrice, maxPrice],
  );

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
    <div className="flex flex-col">
      <label className="mb-4">
        <span>from</span>
        <input
          name="minPrice"
          className="text-black"
          type="number"
          value={minPrice ?? ""}
          placeholder={"$"}
          onChange={onChangeMin}
        />
      </label>
      <label>
        <span>to</span>
        <input
          name="maxPrice"
          className="text-black"
          type="number"
          value={maxPrice ?? ""}
          placeholder={"$"}
          onChange={onChangeMax}
        />
      </label>
    </div>
  );
}

function filterInputToParams(
  rawInput: string | ProductFilter,
  params: URLSearchParams,
) {
  let input =
    typeof rawInput === "string"
      ? (JSON.parse(rawInput) as ProductFilter)
      : rawInput;

  for (let [key, value] of Object.entries(input)) {
    if (params.has(`${FILTER_URL_PREFIX}${key}`, JSON.stringify(value))) {
      continue;
    }
    if (key === "price") {
      // For price, we want to overwrite
      params.set(`${FILTER_URL_PREFIX}${key}`, JSON.stringify(value));
    } else {
      params.append(`${FILTER_URL_PREFIX}${key}`, JSON.stringify(value));
    }
  }

  return params;
}

function SortMenu() {
  const items: { label: string; key: SortParam }[] = [
    { label: "Featured", key: "featured" },
    { label: "Price: Low - High", key: "price-low-high" },
    { label: "Price: High - Low", key: "price-high-low" },
    { label: "Best Selling", key: "best-selling" },
    { label: "Newest", key: "newest" },
  ];
  const [params] = useSearchParams();
  const location = useLocation();
  const activeItem = items.find((item) => item.key === params.get("sort")) || items[0];

  return (
    <Menu as="div" className="relative z-10">
      <MenuButton className="flex items-center gap-1.5 h-10 border px-4 py-2.5">
        <span className="font-medium">Sort by</span>
        <CaretDown />
      </MenuButton>
      <MenuItems
        as="nav"
        className="absolute right-0 top-12 flex h-fit w-40 flex-col gap-2 border border-line/75 bg-background p-5"
      >
        {items.map((item) => (
          <MenuItem key={item.label}>
            {() => (
              <Link to={getSortLink(item.key, params, location)}>
                <p
                  className={clsx(
                    "block text-base hover:underline underline-offset-4",
                    activeItem.key === item.key ? "font-bold" : "font-normal"
                  )}
                >
                  {item.label}
                </p>
              </Link>
            )}
          </MenuItem>
        ))}
      </MenuItems>
    </Menu>
  );
}

// Export the component
export default SortFilter;

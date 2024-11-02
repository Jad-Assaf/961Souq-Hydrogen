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
import { useState } from "react";
import Button from "../components/button";
import { Checkbox } from "../components/checkbox";
import { IconCaretDown, IconCaretRight } from "../components/icons";
import { FILTER_URL_PREFIX } from "../lib/const";
import type { AppliedFilter, SortParam } from "../lib/filter";
import { getAppliedFilterLink, getFilterLink, getSortLink } from "../lib/filter";
import { Drawer, useDrawer } from "./drawer";
import { IconFourGrid, IconOneGrid, IconThreeGrid, IconTwoGrid } from "./icon";
import { Input } from "./input";
import React from "react";
import { FiltersDrawer } from "./drawer-filter";


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
                appliedFilters={appliedFilters} onLayoutChange={function (number: number): void {
                  throw new Error("Function not implemented.");
                } }              />
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

// ... (keep the rest of your components like FiltersDrawer, ListItemFilter, PriceRangeFilter, etc.)

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
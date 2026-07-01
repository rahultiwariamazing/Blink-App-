// ============================================================================
// FILE: src/viewmodels/useHomeVM.ts
//
// PURPOSE OF THIS VIEWMODEL
// ----------------------------------------------------------------------------
// This hook acts as the **Home ViewModel**, providing all data + logic required
// by the Home screen UI. The Home screen displays:
//
//   ✔ Categories
//   ✔ Subcategories filtered by category
//   ✔ Items filtered by subcategory
//
// Responsibilities:
//   • Load categories on first mount
//   • Auto-select the first category
//   • Load subcategories + items when category changes
//   • Expose stable derived lists: filteredSubcats, filteredItems
//   • Expose actions to update catId / subId
//
// CLEAN ARCHITECTURE ROLE
// ----------------------------------------------------------------------------
// ✔ VIEWMODEL LAYER (MVVM)
//    - Contains all business logic for the Home page
//    - Handles async loading, sequencing, fallback states
//    - Keeps UI dumb (UI only renders based on this state)
//
// ✔ SERVICE LAYER (catalogService/homeService)
//    - Provides fetchCategories(), fetchSubcategories(), fetchItems()
//
// ✔ UI LAYER
//    - Reads homeVM.state.*
//    - Triggers homeVM.actions.*
//
// MAUI EQUIVALENT (For Learning)
// ----------------------------------------------------------------------------
// This matches a **HomePageViewModel** with:
//
//   public ObservableCollection<Category> Categories { get; }
//   public ObservableCollection<Subcategory> Subcategories { get; }
//   public ObservableCollection<Item> Items { get; }
//
//   public string SelectedCategoryId { get; set; }
//   public string SelectedSubcategoryId { get; set; }
//
// Lifecycle:
//   OnAppearing → LoadCategoriesAsync()
//   When Category changes → LoadSubcategories() + LoadItems()
//
// LOADING STATES
// ----------------------------------------------------------------------------
// initialLoading:
//   - For very first load (page-level loader)
//
// listLoading:
//   - When switching category/subcategory (only list reloads)
//
// RESPONSE ORDER SAFETY
// ----------------------------------------------------------------------------
// loadSeq + useRef:
//   - Prevents outdated async responses from overwriting new state
//   - Similar to CancellationToken in MAUI async methods
//
// LOGGING STRATEGY (Non-invasive, console-only)
// ----------------------------------------------------------------------------
// Tag: [HomeVM]
// - Logs lifecycle (mount/unmount) and loading flags
// - Logs sequence IDs to guard against race conditions
// - Logs counts returned by services and selection changes
//
// BEHAVIOR GUARANTEE
// ----------------------------------------------------------------------------
// - No logic or behavior changes. Only documentation + safe logs added.
// ============================================================================

import { useEffect, useMemo, useRef, useState } from "react";
import { fetchCategories, fetchSubcategories, fetchItems } from "../services/homeService";
import { Category, Subcategory, Item } from "../models/HomeModels";

export function useHomeVM() {
  // ---------------------------------------------------------------------------
  // LOADING STATES
  // ---------------------------------------------------------------------------
  // initialLoading: first-time load of categories
  // listLoading: triggered when switching category/subcategory
  const [initialLoading, setInitialLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);

  // ---------------------------------------------------------------------------
  // DATA STATE
  // ---------------------------------------------------------------------------
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcats, setSubcats] = useState<Subcategory[]>([]);
  const [items, setItems] = useState<Item[]>([]);

  // Active selected filters (category + subcategory)
  const [catId, setCatId] = useState<string | null>(null);
  const [subId, setSubId] = useState<string | null>(null);

  // Sequence ID to avoid outdated async overwrites
  const loadSeq = useRef(0);

  // Lifecycle logs
  useEffect(() => {
    console.log("[HomeVM] mounted");
    return () => console.log("[HomeVM] unmounted");
  }, []);

  // Loading flag logs
  useEffect(() => {
    console.log("[HomeVM] initialLoading:", initialLoading);
  }, [initialLoading]);

  useEffect(() => {
    console.log("[HomeVM] listLoading:", listLoading);
  }, [listLoading]);

  // Selection logs
  useEffect(() => {
    console.log("[HomeVM] catId changed →", catId);
  }, [catId]);

  useEffect(() => {
    console.log("[HomeVM] subId changed →", subId);
  }, [subId]);

  // ==========================================================================
  // 1) LOAD CATEGORIES ONCE
  // --------------------------------------------------------------------------
  // Sets default catId = first category
  // Similar to OnAppearing in MAUI ViewModel.
  // ==========================================================================
  useEffect(() => {
    let mounted = true;

    (async () => {
      const seq = ++loadSeq.current;
      console.log("[HomeVM] load categories start (seq):", seq);
      setInitialLoading(true);

      try {
        const c = await fetchCategories();
        if (!mounted || seq !== loadSeq.current) {
          console.log("[HomeVM] load categories stale/aborted (seq):", seq);
          return;
        }

        console.log("[HomeVM] categories fetched:", c.length);
        setCategories(c);

        const defaultCatId = c[0]?.id ?? null;
        console.log("[HomeVM] defaultCatId:", defaultCatId);
        setCatId(defaultCatId);
      } catch (e) {
        console.log("[HomeVM] load categories error:", e);
        // Keep state stable; UI will show empty with initialLoading false
      } finally {
        if (mounted && seq === loadSeq.current) {
          setInitialLoading(false);
          console.log("[HomeVM] load categories end (seq):", seq);
        }
      }
    })();

    return () => {
      mounted = false;
      console.log("[HomeVM] categories effect cleanup");
    };
  }, []);

  // ==========================================================================
  // 2) WHEN catId CHANGES → LOAD SUBCATEGORIES + ITEMS
  // --------------------------------------------------------------------------
  // Ensures only list reloads (not whole page).
  // loadSeq prevents race conditions on slow networks.
  // ==========================================================================
  useEffect(() => {
    let mounted = true;

    (async () => {
      if (!catId) {
        console.log("[HomeVM] catId empty → clearing lists");
        setSubcats([]);
        setItems([]);
        setSubId(null);
        return;
      }

      const seq = ++loadSeq.current;
      console.log("[HomeVM] load subcats+items start (seq):", seq, "catId:", catId);
      setListLoading(true);

      try {
        const [s, i] = await Promise.all([
          fetchSubcategories(catId),
          fetchItems(catId),
        ]);

        if (!mounted || seq !== loadSeq.current) {
          console.log("[HomeVM] subcats+items stale/aborted (seq):", seq);
          return;
        }

        console.log("[HomeVM] subcategories fetched:", s.length);
        console.log("[HomeVM] items fetched:", i.length);

        setSubcats(s);
        setItems(i);

        // Auto-select first subcategory within that category
        const firstSub = s[0]?.id ?? null;
        console.log("[HomeVM] auto-select subId:", firstSub);
        setSubId(firstSub);
      } catch (e) {
        console.log("[HomeVM] load subcats+items error:", e);
        // Preserve prior lists or clear if needed; current behavior keeps previous if error
      } finally {
        if (mounted && seq === loadSeq.current) {
          setListLoading(false);
          console.log("[HomeVM] load subcats+items end (seq):", seq);
        }
      }
    })();

    return () => {
      mounted = false;
      console.log("[HomeVM] subcats+items effect cleanup");
    };
  }, [catId]);

  // ==========================================================================
  // FILTERED LISTS
  // --------------------------------------------------------------------------
  // Only return subcategories and items belonging to selected category/subcat.
  // ==========================================================================
  const filteredSubcats = useMemo(
    () => subcats.filter((x) => x.categoryId === catId),
    [subcats, catId]
  );

  const filteredItems = useMemo(
    () => items.filter((x) => x.subcategoryId === subId),
    [items, subId]
  );

  useEffect(() => {
    console.log("[HomeVM] filteredSubcats count:", filteredSubcats.length);
  }, [filteredSubcats.length]);

  useEffect(() => {
    console.log("[HomeVM] filteredItems count:", filteredItems.length);
  }, [filteredItems.length]);

  // ==========================================================================
  // EXPOSED VIEWMODEL API
  // --------------------------------------------------------------------------
  // state: data & UI flags
  // actions: setters that screens can bind to
  // ==========================================================================
  return {
    state: {
      initialLoading,
      listLoading,

      categories,
      filteredSubcats,
      filteredItems,
      catId,
      subId,
    },
    actions: {
      setCatId: (id: string | null) => {
        console.log("[HomeVM] action setCatId:", id);
        setCatId(id);
      },
      setSubId: (id: string | null) => {
        console.log("[HomeVM] action setSubId:", id);
        setSubId(id);
      },
    },
  };
}
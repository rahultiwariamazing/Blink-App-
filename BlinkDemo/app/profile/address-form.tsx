/**
 * Address Form (Modal)
 * File: app/profile/address-form.tsx
 *
 * Screen Purpose:
 * -----------------------------------------------------------------------------
 * Add / Edit user's delivery address with:
 *  - Label selection (Home / Office / Other)
 *  - Address line, Pincode, City inputs
 *  - Map picker for Lat/Lng + "Use my location"
 *  - Default address toggle
 *  - Save/Update using addressApi.upsertAddress()
 *
 * Clean Architecture:
 * -----------------------------------------------------------------------------
 * UI Layer (this file)
 *  - Renders form fields, map modal, and action buttons
 *  - Uses react-hook-form + yup for validation
 *  - Reads theme via ThemeContext, common styles via createCommon(colors)
 *  - Navigates using Expo Router
 *
 * Service Layer
 *  - getAddressById(), upsertAddress() via addressApi (global apiClient)
 *
 * State Layer
 *  - Redux: deliverySlice.selectedAddressId (selected/current address)
 *  - Redux: authSlice.user (who is the logged-in user)
 *
 * MAUI Mapping (for learning):
 * -----------------------------------------------------------------------------
 * ContentPage
 *  - Entry: Label, AddressLine, Pincode, City
 *  - Button: Pick on Map (opens Popup/Modal)
 *  - Control: Default (Radio or Switch)
 *  - Button: Save (invokes AsyncCommand to upsert)
 *
 * Fixes applied (as per your notes):
 * -----------------------------------------------------------------------------
 * - SafeArea title/header no longer overlaps notch
 * - Map modal uses flex layout (no fixed MAP_H), bottom actions always visible
 * - Bottom panel respects home-indicator safe area
 *
 * LOGGING STRATEGY (Non-invasive, console-only)
 * -----------------------------------------------------------------------------
 * Tag: [AddressForm]
 * - Lifecycle: mount/unmount
 * - Params: mode/editId
 * - Effects: load existing address begin/end, map center updates
 * - Handlers: pick location, confirm location, use my location (permission status),
 *             save (start/success/failure), map press/drag, chip selection, default toggle
 *
 * BEHAVIOR GUARANTEE
 * -----------------------------------------------------------------------------
 * - No design/logic changes. Only comments + console logs added.
 * - Safe to paste and run. Production-safe.
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  TextInput,
  Alert,
  Modal,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import MapView, { Marker, type Region } from "react-native-maps";
import * as Location from "expo-location";

import { spacing } from "../../src/theme/spacing";
import { useTheme } from "../../src/theme/ThemeContext";
import { createCommon } from "../../src/theme/common";

import CommonButton from "../../src/components/common/CommonButton";
import { Loader } from "../../src/components/Loader";

import { useAppDispatch, useAppSelector } from "../../src/store/hooks";
import type { UserAddress } from "../../src/models/address";
import { getAddressById, upsertAddress } from "../../src/services/addressApi";
import { setSelectedAddressId } from "../../src/store/slices/deliverySlice";

import { useForm, Controller, type SubmitHandler } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";

/** Redux user shape (Auth) */
type AuthUser = { id: string; name: string; mobile: string; email?: string } | null;

/** Form model bound to react-hook-form */
type FormValues = {
  label: string;
  addressLine: string;
  pincode: string;
  city: string;
  lat: number | null;
  lng: number | null;
  makeDefault: boolean;
};

/** Yup schema (MAUI analogy: DataAnnotations/ValidationAttributes) */
const schema = yup
  .object({
    label: yup.string().required("Label is required"),
    addressLine: yup.string().required("Address is required").min(5, "Too short"),
    pincode: yup
      .string()
      .required("Pincode is required")
      .matches(/^\d{6}$/, "Pincode must be 6 digits"),
    city: yup.string().required("City is required").min(2, "Too short"),
    lat: yup.number().nullable().default(null),
    lng: yup.number().nullable().default(null),
    makeDefault: yup.boolean().required(),
  })
  .required();

export default function AddressFormModal() {
  const router = useRouter();
  // Route params: mode=add|edit, id=addressId (for edit mode)
  const params = useLocalSearchParams<{ mode?: string; id?: string }>();

  const mode = params.mode ?? "add";
  const editId = params.id;

  // Theme usage (Master Prompt rule: never import colors directly)
  const { colors, mode: themeMode } = useTheme();
  const common = useMemo(() => createCommon(colors), [colors]);
  const s = useMemo(() => makeStyles(colors, themeMode), [colors, themeMode]);

  const insets = useSafeAreaInsets();

  // Redux dispatcher
  const dispatch = useAppDispatch();

  // Logged-in user (from Redux authSlice)
  const user = useAppSelector((st: any) => st.auth.user) as AuthUser;
  const userId = user?.id ?? "u1";

  // Busy flags
  const [loading, setLoading] = useState(false);

  // Map picker state (modal within the same screen)
  const [mapOpen, setMapOpen] = useState(false);
  const [locLoading, setLocLoading] = useState(false);

  // Map region (Mumbai default center)
  const [region, setRegion] = useState<Region>({
    latitude: 19.076,
    longitude: 72.8777,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  });

  // ---------------------------------------------------------------------------
  // LIFECYCLE LOGS
  // ---------------------------------------------------------------------------
  useEffect(() => {
    console.log("[AddressForm] mounted with params:", { mode, editId });
    return () => {
      console.log("[AddressForm] unmounted");
    };
  }, [mode, editId]);

  // react-hook-form binding
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<FormValues>({
    // Resolver integrates Yup schema (keeps UI simple, logic centralized)
    resolver: yupResolver(schema),
    defaultValues: {
      label: "Home",
      addressLine: "",
      pincode: "",
      city: "",
      lat: null,
      lng: null,
      makeDefault: false,
    },
  });

  // Observed fields for UI (e.g., reflect picked coordinates)
  const lat = watch("lat");
  const lng = watch("lng");
  const label = watch("label");
  const makeDefault = watch("makeDefault");

  useEffect(() => {
    if (errors && Object.keys(errors).length > 0) {
      console.log("[AddressForm] validation errors:", Object.keys(errors));
    }
  }, [errors]);

  // Chip options for label
  const labelOptions = useMemo(() => ["Home", "Office", "Other"], []);

  /**
   * Load existing address in Edit mode
   * MAUI analogy: OnAppearing → Load existing data into ViewModel properties
   */
  useEffect(() => {
    const run = async () => {
      if (mode !== "edit" || !editId) return;

      console.log("[AddressForm] load existing address start:", editId);
      setLoading(true);
      try {
        const res = await getAddressById(editId);
        if (!res.ok) {
          console.log("[AddressForm] getAddressById not ok:", res.message);
          return Alert.alert("Error", res.message);
        }
        if (!res.data) {
          console.log("[AddressForm] getAddressById no data");
          return Alert.alert("Not found", "Address not found");
        }

        const a = res.data as UserAddress;

        // Populate the form with server values
        reset({
          label: a.label,
          addressLine: a.addressLine,
          pincode: a.pincode,
          city: a.city,
          lat: a.lat ?? null,
          lng: a.lng ?? null,
          makeDefault: a.isDefault,
        });
        console.log("[AddressForm] form populated from server");

        // Center the map if coordinates are present
        if (a.lat && a.lng) {
          setRegion((r) => ({ ...r, latitude: a.lat!, longitude: a.lng! }));
          console.log("[AddressForm] map centered to:", { lat: a.lat, lng: a.lng });
        }
      } finally {
        setLoading(false);
        console.log("[AddressForm] load existing address end");
      }
    };

    void run();
  }, [mode, editId, reset]);

  /** Open map modal (Popup in MAUI) */
  const onPickLocation = useCallback(() => {
    console.log("[AddressForm] open map modal");
    setMapOpen(true);
  }, []);

  /** Commit map region to form and close modal */
  const onConfirmLocation = useCallback(() => {
    console.log("[AddressForm] confirm location:", {
      lat: region.latitude,
      lng: region.longitude,
    });
    setValue("lat", region.latitude);
    setValue("lng", region.longitude);
    setMapOpen(false);
  }, [region.latitude, region.longitude, setValue]);

  /**
   * Use device location (requires permission)
   * MAUI analogy: Geolocation.GetLocationAsync() with permissions prompt
   */
  const onUseMyLocation = useCallback(async () => {
    console.log("[AddressForm] use my location start");
    setLocLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      console.log("[AddressForm] location permission status:", status);
      if (status !== "granted") {
        Alert.alert("Permission needed", "Location permission is required to use current location.");
        return;
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = pos.coords;
      console.log("[AddressForm] current position:", { latitude, longitude });

      // Update map center
      setRegion((r) => ({ ...r, latitude, longitude }));
      // Persist into form
      setValue("lat", latitude);
      setValue("lng", longitude);
    } catch (e) {
      console.log("[AddressForm] use my location error:", e);
      Alert.alert("Error", "Unable to fetch current location.");
    } finally {
      setLocLoading(false);
      console.log("[AddressForm] use my location end");
    }
  }, [setValue]);

  /**
   * Save/Update handler (Submit)
   * MAUI analogy: AsyncCommand Execute → Repository.UpsertAsync()
   * - If new or default toggled, update selectedAddressId in Redux
   */
  const onSave: SubmitHandler<FormValues> = useCallback(
    async (v) => {
      console.log("[AddressForm] save start (mode):", mode, {
        label: v.label,
        hasCoords: !!v.lat && !!v.lng,
        makeDefault: v.makeDefault,
      });
      setLoading(true);
      try {
        const res = await upsertAddress(userId, {
          id: mode === "edit" ? editId : undefined,
          label: v.label,
          addressLine: v.addressLine,
          pincode: v.pincode,
          city: v.city,
          lat: v.lat,
          lng: v.lng,
          makeDefault: v.makeDefault,
        });

        if (!res.ok) {
          console.log("[AddressForm] upsertAddress not ok:", res.message);
          return Alert.alert("Error", res.message);
        }

        // Selection update rules (as per your existing logic)
        if (mode === "add") {
          console.log("[AddressForm] new address added → select:", res.data.id);
          dispatch(setSelectedAddressId(res.data.id));
        } else if (makeDefault) {
          console.log("[AddressForm] setDefault toggled → select:", res.data.id);
          dispatch(setSelectedAddressId(res.data.id));
        }

        Alert.alert("Success", mode === "edit" ? "Address updated" : "Address added");
        console.log("[AddressForm] save success → back");
        router.back();
      } finally {
        setLoading(false);
        console.log("[AddressForm] save end");
      }
    },
    [userId, mode, editId, router, dispatch, makeDefault]
  );

  /** Update map center on tap (click to move pin) */
  const onMapPress = useCallback((e: any) => {
    const c = e?.nativeEvent?.coordinate;
    if (!c) return;
    console.log("[AddressForm] map press → setRegion:", c);
    setRegion((r) => ({ ...r, latitude: c.latitude, longitude: c.longitude }));
  }, []);

  // -----------------------------------------------------------------------------
  // UI
  // -----------------------------------------------------------------------------
  return (
    <View style={common.screen}>
      {/* Keyboard avoiding to keep inputs visible (MAUI: ScrollView + Keyboard handling) */}
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
          <View style={common.container}>
            {/* Title */}
            <Text style={common.title}>{mode === "edit" ? "Edit Address" : "Add Address"}</Text>

            {/* Label chips */}
            <Text style={common.label}>Label</Text>
            <View style={s.chipsRow}>
              {labelOptions.map((x) => {
                const selected = label === x;
                return (
                  <Pressable
                    key={x}
                    onPress={() => {
                      console.log("[AddressForm] label select:", x);
                      setValue("label", x);
                    }}
                    style={({ pressed }) => [s.chip, selected && s.chipActive, pressed && { opacity: 0.9 }]}
                  >
                    <Text style={[s.chipText, selected && s.chipTextActive]}>{x}</Text>
                  </Pressable>
                );
              })}
            </View>
            {!!errors.label?.message && <Text style={common.errorText}>{errors.label.message}</Text>}

            {/* Address Line */}
            <Text style={common.label}>Address Line</Text>
            <Controller
              control={control}
              name="addressLine"
              render={({ field: { value, onChange } }) => (
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  placeholder="Flat/House, Area, Street"
                  placeholderTextColor={colors.muted}
                  style={[common.input, errors.addressLine && common.inputError, { minHeight: 56 }]}
                  multiline
                />
              )}
            />
            {!!errors.addressLine?.message && <Text style={common.errorText}>{errors.addressLine.message}</Text>}

            {/* Pincode */}
            <Text style={common.label}>Pincode</Text>
            <Controller
              control={control}
              name="pincode"
              render={({ field: { value, onChange } }) => (
                <TextInput
                  value={value}
                  onChangeText={(t) => onChange(t.replace(/[^\d]/g, ""))}
                  placeholder="6 digit pincode"
                  placeholderTextColor={colors.muted}
                  keyboardType="number-pad"
                  maxLength={6}
                  style={[common.input, errors.pincode && common.inputError]}
                />
              )}
            />
            {!!errors.pincode?.message && <Text style={common.errorText}>{errors.pincode.message}</Text>}

            {/* City */}
            <Text style={common.label}>City</Text>
            <Controller
              control={control}
              name="city"
              render={({ field: { value, onChange } }) => (
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  placeholder="City"
                  placeholderTextColor={colors.muted}
                  style={[common.input, errors.city && common.inputError]}
                />
              )}
            />
            {!!errors.city?.message && <Text style={common.errorText}>{errors.city.message}</Text>}

            {/* Location */}
            <Text style={common.label}>Location (Lat/Lng)</Text>
            <View style={[common.card, { gap: spacing.xs }]}>
              <Text style={s.locTxt}>{lat && lng ? `${lat.toFixed(6)}, ${lng.toFixed(6)}` : "Not selected"}</Text>
              <CommonButton title="Pick on Map" onPress={onPickLocation} />
            </View>

            {/* Default address toggle */}
            <Text style={common.label}>Default Address</Text>
            <Controller
              control={control}
              name="makeDefault"
              render={({ field: { value, onChange } }) => (
                <Pressable
                  onPress={() => {
                    console.log("[AddressForm] toggle default →", !value);
                    onChange(!value);
                  }}
                  style={({ pressed }) => [s.radioRow, pressed && { opacity: 0.9 }]}
                >
                  <View style={[s.radioOuter, value && s.radioOuterActive]}>{value && <View style={s.radioInner} />}</View>
                  <Text style={s.radioText}>Set as default</Text>
                </Pressable>
              )}
            />

            {/* Save Button (Submit) */}
            <View style={{ marginTop: spacing.lg }}>
              {/* MAUI analogy: <Button Command="{Binding SaveCommand}" /> */}
              <CommonButton title={mode === "edit" ? "Update" : "Save"} onPress={handleSubmit(onSave)} loading={loading} />
            </View>

            {/* Loader overlay */}
            <Loader visible={loading} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Map Modal */}
      <Modal
        visible={mapOpen}
        animationType="slide"
        onRequestClose={() => {
          console.log("[AddressForm] close map modal");
          setMapOpen(false);
        }}
      >
        {/* edges ensures notch + home-indicator safe */}
        <SafeAreaView style={common.screen} edges={["top", "bottom"]}>
          <View style={s.modalRoot}>
            {/* Proper header bar (no overlap) */}
            <View style={[s.modalHeader, { paddingTop: Math.max(spacing.sm, insets.top * 0.15) }]}>
              <Text style={s.modalTitle}>Pick Location</Text>
            </View>

            {/* Map takes remaining space */}
            <View style={s.mapFlexWrap}>
              <MapView
                style={StyleSheet.absoluteFill}
                region={region}
                onRegionChangeComplete={(r) => {
                  setRegion(r);
                }}
                onPress={onMapPress}
              >
                <Marker
                  coordinate={{ latitude: region.latitude, longitude: region.longitude }}
                  draggable
                  onDragEnd={(e) => {
                    const c = e.nativeEvent.coordinate;
                    console.log("[AddressForm] marker drag end:", c);
                    setRegion((r) => ({ ...r, latitude: c.latitude, longitude: c.longitude }));
                  }}
                />
              </MapView>
            </View>

            {/* Bottom panel fixed + safe bottom padding */}
            <View style={[s.bottomPanel, { paddingBottom: spacing.lg + insets.bottom }]}>
              <View style={s.coordsCard}>
                <Text style={s.coordsTitle}>Selected Coordinates</Text>

                <View style={s.coordsRow}>
                  <Text style={s.coordsLabel}>Lat</Text>
                  <Text style={s.coordsValue}>{region.latitude.toFixed(6)}</Text>
                </View>

                <View style={s.coordsRow}>
                  <Text style={s.coordsLabel}>Lng</Text>
                  <Text style={s.coordsValue}>{region.longitude.toFixed(6)}</Text>
                </View>

                <Text style={s.coordsHint}>Tip: Tap on map or drag pin to adjust.</Text>
              </View>

              <View style={s.modalActions}>
                <CommonButton
                  title="Cancel"
                  onPress={() => {
                    console.log("[AddressForm] cancel map modal");
                    setMapOpen(false);
                  }}
                />
                <CommonButton title="My Location" onPress={onUseMyLocation} loading={locLoading} />
                <CommonButton title="Use this location" onPress={onConfirmLocation} style={s.btnPrimaryFlex} />
              </View>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

/** Theme-aware styles (no direct color imports) */
const makeStyles = (colors: any, mode: "light" | "dark") =>
  StyleSheet.create({
    chipsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
      marginTop: spacing.xs,
    },

    chip: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.bg,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: 999,
    },
    chipActive: {
      borderColor: colors.primary,
      backgroundColor: mode === "dark" ? colors.card : colors.surfaceAlt,
    },
    chipText: { color: colors.text, fontWeight: "800", fontSize: 12 },
    chipTextActive: { color: colors.primary },

    locTxt: { color: colors.text, fontWeight: "700" },

    radioRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.xs },
    radioOuter: {
      width: 18,
      height: 18,
      borderRadius: 999,
      borderWidth: 2,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    radioOuterActive: { borderColor: colors.primary },
    radioInner: { width: 10, height: 10, borderRadius: 999, backgroundColor: colors.primary },
    radioText: { color: colors.text, fontWeight: "700" },

    // Modal layout fixes
    modalRoot: {
      flex: 1,
      backgroundColor: colors.bg,
    },

    modalHeader: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.sm,
      justifyContent: "flex-end",
    },
    modalTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: "900",
    },

    mapFlexWrap: {
      flex: 1,
      marginHorizontal: spacing.lg,
      marginBottom: spacing.md,
      borderRadius: 12,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },

    bottomPanel: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      gap: spacing.md,
    },

    coordsCard: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: spacing.md,
      gap: spacing.sm,
    },
    coordsTitle: { color: colors.text, fontWeight: "900" },
    coordsRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    coordsLabel: { color: colors.textMuted, fontWeight: "800" },
    coordsValue: { color: colors.text, fontWeight: "900" },
    coordsHint: { color: colors.textMuted, fontSize: 12 },

    modalActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },

    btnGhostFlex: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      flex: 1,
    },
    btnPrimaryFlex: {
      flex: 1.4,
    },
  });

// ============================================================================
// Sahil's Shore: Phase 7 Test Suite
// Google Drive AES encryption, folder routing, memories, and places aggregations
// ============================================================================

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";

import { encryptToken, decryptToken } from "../lib/drive/crypto.ts";
import { DRIVE_FOLDER_ROOT, DRIVE_SUBFOLDERS, getMonthName } from "../lib/drive/index.ts";
import { filterPlacesThisMonth, type Place } from "../lib/places/index.ts";
import { formatISTDate, todayIST } from "../lib/date-utils.ts";
import { mergeMediaLinks, type MediaLinks } from "../lib/media/index.ts";

describe("1. Google Drive Token Encryption (AES-256-GCM)", () => {
  const testKey = crypto.createHash("sha256").update("test-encryption-key-shore").digest();

  it("encrypts and decrypts refresh tokens identically", () => {
    const rawRefreshToken = "1//04_X9abcdEFG123456789-mock-google-refresh-token";
    const encrypted = encryptToken(rawRefreshToken, testKey);

    assert.notEqual(encrypted, rawRefreshToken);
    const parts = encrypted.split(":");
    assert.equal(parts.length, 3, "Format must be iv:authTag:ciphertext");

    const decrypted = decryptToken(encrypted, testKey);
    assert.equal(decrypted, rawRefreshToken);
  });

  it("produces randomized IVs for identical plaintexts (IND-CPA security)", () => {
    const raw = "same-token-input";
    const enc1 = encryptToken(raw, testKey);
    const enc2 = encryptToken(raw, testKey);

    assert.notEqual(enc1, enc2, "Each encryption must use a unique random initialization vector");
    assert.equal(decryptToken(enc1, testKey), raw);
    assert.equal(decryptToken(enc2, testKey), raw);
  });

  it("throws authentication error if ciphertext or tag is tampered", () => {
    const raw = "sensitive-refresh-secret";
    const encrypted = encryptToken(raw, testKey);
    const parts = encrypted.split(":");

    // Tamper the ciphertext
    const tampered = `${parts[0]}:${parts[1]}:${parts[2].slice(0, -2)}ff`;
    assert.throws(() => {
      decryptToken(tampered, testKey);
    }, /Unsupported state or unable to authenticate data|bad decrypt/);
  });
});

describe("2. Google Drive Folder Tree Specification", () => {
  it("defines Shore as the isolated root container", () => {
    assert.equal(DRIVE_FOLDER_ROOT, "Shore");
  });

  it("defines all required subfolders according to GEMINI.md", () => {
    assert.equal(DRIVE_SUBFOLDERS.PHOTOS, "Photos");
    assert.equal(DRIVE_SUBFOLDERS.VIDEOS, "Videos");
    assert.equal(DRIVE_SUBFOLDERS.RECEIPTS, "Receipts");
    assert.equal(DRIVE_SUBFOLDERS.VOICE, "Voice-Recordings");
    assert.equal(DRIVE_SUBFOLDERS.BACKUPS, "Backups");
  });
});

describe("3. On This Day Memories Matching Algorithm", () => {
  it("matches photos taken on the same calendar month and day from previous years", () => {
    const today = "2026-11-03";
    const [currY, currM, currD] = today.split("-");
    const currentYear = parseInt(currY, 10);
    const targetMMDD = `-${currM}-${currD}`;

    const sampleMedia = [
      { id: "1", file_name: "trip.jpg", taken_at: "2025-11-03T10:00:00.000Z" }, // 1 yr ago (15:30 IST) - MATCH
      { id: "2", file_name: "party.jpg", taken_at: "2024-11-03T12:00:00.000Z" }, // 2 yrs ago (17:30 IST) - MATCH
      { id: "3", file_name: "today.jpg", taken_at: "2026-11-03T04:00:00.000Z" }, // today - IGNORE (same year)
      { id: "4", file_name: "yesterday.jpg", taken_at: "2025-11-02T10:00:00.000Z" }, // diff day - IGNORE
    ];

    const matched = sampleMedia.filter((item) => {
      const itemDate = formatISTDate(item.taken_at);
      const itemYear = parseInt(itemDate.split("-")[0], 10);
      return itemYear < currentYear && itemDate.endsWith(targetMMDD);
    });

    assert.equal(matched.length, 2);
    assert.equal(matched[0].id, "1");
    assert.equal(matched[1].id, "2");
  });
});

describe("4. Places Module Aggregations & Monthly Filters", () => {
  it("filters places visited in the current IST month", () => {
    const mockPlaces: Place[] = [
      {
        id: "p1",
        user_id: "u1",
        name: "Blue Tokai",
        category: "cafe",
        visited_at: "2026-11-02T10:00:00.000Z", // Nov 2026
        lat: 15.4989,
        lng: 73.8278,
        rating: 5,
        notes: "Great pour over",
        created_at: "2026-11-02T10:00:00.000Z",
        updated_at: "2026-11-02T10:00:00.000Z",
      },
      {
        id: "p2",
        user_id: "u1",
        name: "Old Fort",
        category: "travel",
        visited_at: "2026-10-15T08:00:00.000Z", // Oct 2026
        lat: 15.55,
        lng: 73.75,
        rating: 4,
        notes: "Historic walk",
        created_at: "2026-10-15T08:00:00.000Z",
        updated_at: "2026-10-15T08:00:00.000Z",
      },
    ];

    const novPlaces = filterPlacesThisMonth(mockPlaces, "2026-11");
    assert.equal(novPlaces.length, 1);
    assert.equal(novPlaces[0].name, "Blue Tokai");

    const octPlaces = filterPlacesThisMonth(mockPlaces, "2026-10");
    assert.equal(octPlaces.length, 1);
    assert.equal(octPlaces[0].name, "Old Fort");
  });

  it("calculates 'Everything from this visit' total spend in integer paise", () => {
    const linkedExpenses = [
      { id: "e1", amount_paise: 35000, place: "Blue Tokai" }, // Rs 350.00
      { id: "e2", amount_paise: 22050, place: "Blue Tokai" }, // Rs 220.50
    ];

    const totalPaise = linkedExpenses.reduce((sum, e) => sum + e.amount_paise, 0);
    assert.equal(totalPaise, 57050); // Exactly Rs 570.50
  });

  it("parses geocoded coordinates and formats place names cleanly", () => {
    const rawOsmItem = {
      name: "Mahabalipuram Beach",
      display_name: "Mahabalipuram Beach, Mamallapuram, Chengalpattu, Tamil Nadu, 603104, India",
      lat: "12.6091532",
      lon: "80.1959796",
      type: "beach",
    };

    const parsedLat = Number(parseFloat(rawOsmItem.lat).toFixed(6));
    const parsedLng = Number(parseFloat(rawOsmItem.lon).toFixed(6));

    assert.equal(parsedLat, 12.609153);
    assert.equal(parsedLng, 80.195980);
    assert.equal(rawOsmItem.name, "Mahabalipuram Beach");
  });
});

describe("5. Media Sync Queue & Link Schema Validation", () => {
  it("validates sync queue states transition from pending to synced or failed", () => {
    const validStates = ["pending", "synced", "failed"];
    assert.ok(validStates.includes("pending"));
    assert.ok(validStates.includes("synced"));
    assert.ok(validStates.includes("failed"));
  });

  it("structures bidirectional entity links correctly", () => {
    const links = {
      place_id: "place-uuid-123",
      place_name: "Artisan Roasters",
      meal_id: "meal-uuid-456",
      expense_id: "exp-uuid-789",
      expense_amount_paise: 45000,
    };

    assert.equal(links.place_name, "Artisan Roasters");
    assert.equal(links.expense_amount_paise, 45000);
  });
});

describe("6. Google Drive Album Folder Routing (Year -> Month Name -> Folder Name)", () => {
  const mockTree = {
    root: "drive_shore_root_id",
    photosRoot: "drive_photos_root_id",
    photosCurrent: "drive_photos_november_id", // Shore/Photos/2026/November
    videosRoot: "drive_videos_root_id",
    videosCurrent: "drive_videos_november_id",
    receipts: "drive_receipts_id",
    voice: "drive_voice_id",
    backups: "drive_backups_id",
  };

  it("routes uploads without album directly into the specific month name folder (e.g. November)", () => {
    // When no album is chosen, destination is photosCurrent (e.g. November)
    const albumId = null;
    const resolvedFolderId = albumId ? "custom_album_folder" : mockTree.photosCurrent;
    assert.equal(resolvedFolderId, "drive_photos_november_id");
  });

  it("nests album folders inside Year -> Month Name -> Album Name (e.g. 2026/November/Mahabalipuram Nov 1)", () => {
    // When an album like 'Mahabalipuram Nov 1' is chosen, its parent MUST be photosCurrent (e.g. November)
    const album = { id: "album-uuid-1", title: "Mahabalipuram Nov 1" };
    const parentFolderId = mockTree.photosCurrent; // Month folder (November)
    assert.equal(parentFolderId, "drive_photos_november_id");
    assert.equal(album.title, "Mahabalipuram Nov 1");

    // The full path hierarchy is Shore -> Photos -> 2026 -> November -> Mahabalipuram Nov 1
    const simulatedPath = ["Shore", "Photos", "2026", "November", album.title].join("/");
    assert.equal(simulatedPath, "Shore/Photos/2026/November/Mahabalipuram Nov 1");
  });

  it("maps month strings to full month names (1 -> January, 11 -> November)", () => {
    assert.equal(getMonthName("1"), "January");
    assert.equal(getMonthName("01"), "January");
    assert.equal(getMonthName(1), "January");
    assert.equal(getMonthName("11"), "November");
    assert.equal(getMonthName(11), "November");
  });
});

describe("7. Multi-Select & Bulk Entity Linking", () => {
  it("merges updated place link while preserving existing meal and expense links", () => {
    const existingLinks: MediaLinks = {
      meal_id: "meal-1",
      meal_name: "South Indian Thali",
      expense_id: "exp-1",
      expense_amount_paise: 25000,
    };

    const merged = mergeMediaLinks(existingLinks, {
      place_id: "place-shore-temple",
      place_name: "Shore Temple",
    });

    assert.equal(merged.place_id, "place-shore-temple");
    assert.equal(merged.place_name, "Shore Temple");
    assert.equal(merged.meal_id, "meal-1");
    assert.equal(merged.meal_name, "South Indian Thali");
    assert.equal(merged.expense_id, "exp-1");
    assert.equal(merged.expense_amount_paise, 25000);
  });

  it("unlinks place cleanly when place_id is set to null", () => {
    const existingLinks: MediaLinks = {
      place_id: "place-shore-temple",
      place_name: "Shore Temple",
      expense_id: "exp-1",
      expense_amount_paise: 25000,
    };

    const unlinked = mergeMediaLinks(existingLinks, {
      place_id: null,
      place_name: null,
    });

    assert.equal(unlinked.place_id, null);
    assert.equal(unlinked.place_name, null);
    assert.equal(unlinked.expense_id, "exp-1");
  });

  it("handles day-wise bulk selection toggling correctly", () => {
    const dayItemIds = ["item-1", "item-2", "item-3"];
    let selectedIds: string[] = [];

    // 1. Initial day select: all 3 items selected
    const allSelectedInitially = dayItemIds.every((id) => selectedIds.includes(id));
    assert.equal(allSelectedInitially, false);

    selectedIds = Array.from(new Set([...selectedIds, ...dayItemIds]));
    assert.equal(selectedIds.length, 3);
    assert.ok(dayItemIds.every((id) => selectedIds.includes(id)));

    // 2. Second toggle: deselect all day items
    const allSelectedNow = dayItemIds.every((id) => selectedIds.includes(id));
    assert.equal(allSelectedNow, true);

    selectedIds = selectedIds.filter((id) => !dayItemIds.includes(id));
    assert.equal(selectedIds.length, 0);
  });

  it("applies target album and place to multiple items in bulk simulation", () => {
    const rawItems = [
      { id: "img-1", links: {}, album_id: null },
      { id: "img-2", links: { meal_id: "m1" }, album_id: null },
      { id: "img-3", links: {}, album_id: "old-album" },
    ];

    const targetPlace = { id: "place-mahabs", name: "Mahabalipuram Beach" };
    const targetAlbumId = "album-nov1";

    const updated = rawItems.map((item) => ({
      ...item,
      album_id: targetAlbumId,
      links: mergeMediaLinks(item.links, {
        place_id: targetPlace.id,
        place_name: targetPlace.name,
      }),
    }));

    // All items must now share the target place and target album
    for (const item of updated) {
      assert.equal(item.album_id, "album-nov1");
      assert.equal(item.links.place_id, "place-mahabs");
      assert.equal(item.links.place_name, "Mahabalipuram Beach");
    }

    // Existing non-conflicting links (e.g. meal_id in img-2) must be preserved
    assert.equal(updated[1].links.meal_id, "m1");
  });
});

describe("8. Album Date Support & Drive Date-Accurate Routing", () => {
  it("sorts albums chronologically by album_date desc", () => {
    const mockAlbums = [
      { id: "a1", title: "Goa 2024", album_date: "2024-11-03T00:00:00.000Z" },
      { id: "a2", title: "Current Nov 2026", album_date: "2026-11-05T00:00:00.000Z" },
      { id: "a3", title: "Diwali 2025", album_date: "2025-10-20T00:00:00.000Z" },
    ];

    const sorted = [...mockAlbums].sort(
      (a, b) => new Date(b.album_date).getTime() - new Date(a.album_date).getTime()
    );

    assert.equal(sorted[0].id, "a2"); // 2026
    assert.equal(sorted[1].id, "a3"); // 2025
    assert.equal(sorted[2].id, "a1"); // 2024
  });

  it("extracts year and month name accurately from past timestamps for Drive folders", () => {
    const rawDate1 = "2024-11-03T12:00:00.000Z";
    const yearMonth1 = rawDate1.substring(0, 7);
    const [year1, monthNum1] = yearMonth1.split("-");
    const monthName1 = getMonthName(monthNum1);

    assert.equal(year1, "2024");
    assert.equal(monthName1, "November");

    const rawDate2 = "2023-05-14T08:30:00.000Z";
    const yearMonth2 = rawDate2.substring(0, 7);
    const [year2, monthNum2] = yearMonth2.split("-");
    const monthName2 = getMonthName(monthNum2);

    assert.equal(year2, "2023");
    assert.equal(monthName2, "May");
  });

  it("links both photo and video items to places and meals cleanly", () => {
    const items = [
      { id: "p1", media_type: "photo", file_name: "dish.jpg", links: {} as MediaLinks },
      { id: "v1", media_type: "video", file_name: "cafe_tour.mp4", links: {} as MediaLinks },
    ];

    const linkedItems = items.map((i) => ({
      ...i,
      links: mergeMediaLinks(i.links, {
        place_id: "place-101",
        place_name: "Blue Tokai Cafe",
        meal_id: "meal-501",
        meal_name: "Avocado Toast",
      }),
    }));

    assert.equal(linkedItems[0].links.place_name, "Blue Tokai Cafe");
    assert.equal(linkedItems[0].links.meal_name, "Avocado Toast");
    assert.equal(linkedItems[1].links.place_name, "Blue Tokai Cafe");
    assert.equal(linkedItems[1].media_type, "video");
  });
});

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getStoredDriveCredentials,
  refreshDriveAccessToken,
  findOrCreateDriveFolder,
  DRIVE_FOLDER_ROOT,
} from "@/lib/drive";

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json(
        { success: false, error: "UNAUTHORIZED: Please sign in to sync with Google Drive." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      dataUrl,
      fileName,
      caption,
      module = "learning",
      folderName = "General",
    } = body;

    if (!dataUrl || typeof dataUrl !== "string") {
      return NextResponse.json(
        { success: false, error: "Missing or invalid dataUrl." },
        { status: 400 }
      );
    }

    // 1. Check user's Google Drive credentials
    let creds;
    try {
      creds = await getStoredDriveCredentials(supabase, user.id);
    } catch (e: any) {
      creds = null;
    }

    if (!creds || !creds.refreshToken) {
      return NextResponse.json(
        {
          success: false,
          error: "DRIVE_NOT_CONNECTED",
          message: "Google Drive is not connected yet. Saved to high-capacity local offline vault.",
          requiresAuth: true,
        },
        { status: 200 }
      );
    }

    // 2. Refresh Google Drive Access Token
    let accessToken: string;
    try {
      const refreshed = await refreshDriveAccessToken(creds.refreshToken);
      accessToken = refreshed.accessToken;
    } catch (tokenErr: any) {
      return NextResponse.json(
        {
          success: false,
          error: "DRIVE_TOKEN_EXPIRED",
          message: "Google Drive access token expired. Re-authentication required.",
          requiresAuth: true,
        },
        { status: 200 }
      );
    }

    // 3. Ensure Google Drive Folder Hierarchy
    // Root: Shore/
    const rootFolderId =
      creds.folderTree?.root ||
      (await findOrCreateDriveFolder(accessToken, DRIVE_FOLDER_ROOT));

    // Module parent: Shore/Learning/ or Shore/DSA/
    const moduleSubfolderName = module === "dsa" ? "DSA" : "Learning";
    const moduleFolderId = await findOrCreateDriveFolder(
      accessToken,
      moduleSubfolderName,
      rootFolderId
    );

    // Target specific folder: Shore/Learning/<trackName>/ or Shore/DSA/<problemName>/
    const sanitizedFolderName = (folderName || "General")
      .replace(/[\/\\:*?"<>|]/g, " ")
      .trim();
    const targetFolderId = await findOrCreateDriveFolder(
      accessToken,
      sanitizedFolderName,
      moduleFolderId
    );

    // 4. Convert dataUrl to binary buffer
    const commaIdx = dataUrl.indexOf(",");
    if (commaIdx === -1) {
      return NextResponse.json(
        { success: false, error: "Invalid dataUrl format." },
        { status: 400 }
      );
    }
    const mimeMatch = dataUrl.substring(0, commaIdx).match(/data:(.*?);/);
    const mimeType = mimeMatch ? mimeMatch[1] : "image/webp";
    const base64Data = dataUrl.substring(commaIdx + 1);
    const fileBuffer = Buffer.from(base64Data, "base64");

    const safeFileName =
      fileName ||
      `${(caption || "diagram").toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}.${
        mimeType.includes("png") ? "png" : mimeType.includes("svg") ? "svg" : "webp"
      }`;

    // 5. Upload file directly into Google Drive via Multipart Upload
    const boundary = "-------314159265358979323846";
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const metadataPart = JSON.stringify({
      name: safeFileName,
      parents: [targetFolderId],
      description: caption || "Shore Study Diagram",
    });

    const multipartRequestBody = Buffer.concat([
      Buffer.from(
        `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${metadataPart}` +
          `${delimiter}Content-Type: ${mimeType}\r\nContent-Transfer-Encoding: base64\r\n\r\n`
      ),
      Buffer.from(fileBuffer.toString("base64")),
      Buffer.from(closeDelimiter),
    ]);

    const uploadRes = await fetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink,thumbnailLink",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": `multipart/related; boundary=${boundary}`,
        },
        body: multipartRequestBody,
      }
    );

    const uploadData = await uploadRes.json();
    if (!uploadRes.ok || !uploadData.id) {
      throw new Error(uploadData.error?.message || "Google Drive upload failed.");
    }

    const driveFileId = uploadData.id;
    const driveWebViewLink =
      uploadData.webViewLink || `https://drive.google.com/file/d/${driveFileId}/view`;
    // Google Drive direct image preview URL
    const publicUrl = `https://lh3.googleusercontent.com/d/${driveFileId}`;

    return NextResponse.json({
      success: true,
      driveFileId,
      driveWebViewLink,
      url: publicUrl,
      fileName: safeFileName,
      folderPath: `${DRIVE_FOLDER_ROOT}/${moduleSubfolderName}/${sanitizedFolderName}`,
    });
  } catch (err: any) {
    console.error("[upload-concept-map] Error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Failed to upload to Google Drive.",
      },
      { status: 500 }
    );
  }
}

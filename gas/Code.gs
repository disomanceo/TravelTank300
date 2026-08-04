function doGet() {
  return jsonResponse_({
    success: true,
    service: 'TravelTank300 Drive API',
    version: '1.2.0',
    timestamp: new Date().toISOString()
  });
}

function doPost(e) {
  try {
    var action = String((e && e.parameter && e.parameter.action) || '');
    var token = String((e && e.parameter && e.parameter.token) || '');
    verifyToken_(token);

    if (action === 'ping') return jsonResponse_({ success: true, action: 'ping', message: 'POST OK' });

    if (action === 'uploadBatchV2') {
      var payloadV2 = JSON.parse(String(e.parameter.data || '{}'));
      return jsonResponse_({ success: true, files: uploadBatchV2_(payloadV2) });
    }

    if (action === 'uploadBatch') {
      var payload = JSON.parse(String(e.parameter.data || '{}'));
      return jsonResponse_({ success: true, files: uploadBatchLegacy_(payload) });
    }

    if (action === 'getImage') {
      var imagePayload = JSON.parse(String(e.parameter.data || '{}'));
      return jsonResponse_(getImage_(imagePayload.fileId));
    }

    if (action === 'delete') {
      var deletePayload = JSON.parse(String(e.parameter.data || '{}'));
      return jsonResponse_({ success: true, deleted: deleteImage_(deletePayload.fileId) });
    }

    return jsonResponse_({ success: false, message: 'Unknown action', receivedAction: action || null });
  } catch (error) {
    return jsonResponse_({ success: false, message: error && error.message ? error.message : String(error) });
  }
}

function uploadBatchV2_(payload) {
  var pairs = Array.isArray(payload.pairs) ? payload.pairs : [];
  if (!pairs.length) throw new Error('No photo pairs received');

  var root = DriveApp.getFolderById(TRAVEL_CONFIG.ROOT_FOLDER_ID);
  var collection = getOrCreateFolder_(root, sanitizeName_(payload.collectionId || Utilities.getUuid()));
  var originalsFolder = getOrCreateFolder_(collection, 'originals');
  var previewsFolder = getOrCreateFolder_(collection, 'previews');

  return pairs.map(function (pair) {
    var original = createFile_(originalsFolder, pair.original);
    var preview = createFile_(previewsFolder, pair.preview);
    original.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    preview.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    return {
      driveFileId: original.getId(),
      driveUrl: directImageUrl_(original.getId()),
      previewDriveFileId: preview.getId(),
      thumbnailUrl: thumbnailUrl_(preview.getId(), 1600),
      fileName: original.getName(),
      mimeType: original.getMimeType()
    };
  });
}

function uploadBatchLegacy_(payload) {
  var files = Array.isArray(payload.files) ? payload.files : [];
  if (!files.length) throw new Error('No files received');
  var root = DriveApp.getFolderById(TRAVEL_CONFIG.ROOT_FOLDER_ID);
  var folder = getOrCreateFolder_(root, sanitizeName_(payload.collectionId || Utilities.getUuid()));
  return files.map(function (item) {
    var file = createFile_(folder, item);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return {
      driveFileId: file.getId(),
      driveUrl: directImageUrl_(file.getId()),
      thumbnailUrl: thumbnailUrl_(file.getId(), 1600),
      fileName: file.getName(),
      mimeType: file.getMimeType()
    };
  });
}

function createFile_(folder, item) {
  if (!item || !item.base64 || !item.fileName || !item.mimeType) throw new Error('Missing file data');
  var blob = Utilities.newBlob(Utilities.base64Decode(item.base64), item.mimeType, sanitizeName_(item.fileName));
  return folder.createFile(blob);
}

function directImageUrl_(fileId) {
  return 'https://drive.google.com/uc?export=view&id=' + encodeURIComponent(fileId);
}

function thumbnailUrl_(fileId, width) {
  return 'https://drive.google.com/thumbnail?id=' + encodeURIComponent(fileId) + '&sz=w' + String(width || 1600);
}

function getImage_(fileId) {
  if (!fileId) throw new Error('Missing fileId');
  var file = DriveApp.getFileById(fileId);
  var blob = file.getBlob();
  var bytes = blob.getBytes();
  if (bytes.length > 15 * 1024 * 1024) throw new Error('Image exceeds 15 MB');
  return {
    success: true,
    fileName: file.getName(),
    mimeType: blob.getContentType() || file.getMimeType(),
    base64: Utilities.base64Encode(bytes)
  };
}

function deleteImage_(fileId) {
  if (!fileId) throw new Error('Missing fileId');
  DriveApp.getFileById(fileId).setTrashed(true);
  return true;
}

function verifyToken_(token) {
  var expected = PropertiesService.getScriptProperties().getProperty(TRAVEL_CONFIG.TOKEN_PROPERTY);
  if (!expected) throw new Error('ยังไม่ได้ตั้งค่า Script Property: ' + TRAVEL_CONFIG.TOKEN_PROPERTY);
  if (!token || token !== expected) throw new Error('Unauthorized');
}

function getOrCreateFolder_(parent, name) {
  var iterator = parent.getFoldersByName(name);
  return iterator.hasNext() ? iterator.next() : parent.createFolder(name);
}

function sanitizeName_(name) {
  return String(name || 'file').replace(/[\\/:*?"<>|#%{}]/g, '-').slice(0, 120);
}

function jsonResponse_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

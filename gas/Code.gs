/** TravelTank300 GAS upload service — Step 32 */
function doGet() {
  return jsonResponse_({ success: true, service: 'TravelTank300 Upload', version: '1.6.0' });
}

function doPost(e) {
  try {
    var request = parseRequest_(e);
    var action = String(request.action || '');
    var token = String(request.token || '');
    var properties = PropertiesService.getScriptProperties();

    if (!token || token !== properties.getProperty('UPLOAD_TOKEN')) {
      throw new Error('Unauthorized');
    }

    var data = request.data || {};
    if (action === 'uploadBatchV2' || action === 'uploadBatch') {
      return jsonResponse_({ success: true, files: uploadBatchV2_(data) });
    }
    if (action === 'delete') {
      return jsonResponse_({ success: true, deleted: deleteImage_(data.fileId) });
    }
    if (action === 'getImage') {
      var image = getImage_(data.fileId);
      return jsonResponse_({ success: true, base64: image.base64, mimeType: image.mimeType, image: image });
    }
    throw new Error('Unknown action: ' + action);
  } catch (error) {
    return jsonResponse_({ success: false, message: String(error && error.message ? error.message : error) });
  }
}

function parseRequest_(e) {
  var contentType = String((e && e.postData && e.postData.type) || '').toLowerCase();
  var raw = String((e && e.postData && e.postData.contents) || '');
  if (contentType.indexOf('application/json') !== -1 && raw) {
    var parsed = JSON.parse(raw);
    return { action: parsed.action, token: parsed.token, data: parsed.data || {} };
  }
  var parameters = (e && e.parameter) || {};
  return { action: parameters.action, token: parameters.token, data: JSON.parse(String(parameters.data || '{}')) };
}

function normalizePhotoPairs_(payload) {
  if (!payload) return [];
  if (Array.isArray(payload.files) && payload.files.length) return payload.files;
  if (Array.isArray(payload.photoPairs) && payload.photoPairs.length) return payload.photoPairs;
  if (Array.isArray(payload.pairs) && payload.pairs.length) return payload.pairs;
  if (Array.isArray(payload) && payload.length) return payload;
  return [];
}

function uploadBatchV2_(payload) {
  var pairs = normalizePhotoPairs_(payload);
  if (!pairs.length) throw new Error('No photo pairs received');
  if (pairs.length > 1) throw new Error('Upload a maximum of 1 photo pair per request');

  var properties = PropertiesService.getScriptProperties();
  var rootFolderId = properties.getProperty('ROOT_FOLDER_ID');
  if (!rootFolderId) throw new Error('Missing ROOT_FOLDER_ID in Script Properties');

  var root = DriveApp.getFolderById(rootFolderId);
  var groupId = sanitizeFolderName_(String(payload.groupId || new Date().getTime()));
  var placeName = sanitizeFolderName_(String(payload.placeName || 'สถานที่ไม่ระบุชื่อ'));
  var placeFolder = getOrCreatePlaceFolder_(root, placeName, groupId);
  var originalsFolder = getOrCreateFolder_(placeFolder, 'originals');
  var previewsFolder = getOrCreateFolder_(placeFolder, 'previews');
  ensurePlaceMetadata_(placeFolder, placeName, groupId);

  return pairs.map(function(item, index) {
    validatePhotoPair_(item, index);
    var mimeType = String(item.mimeType || 'image/jpeg');
    var fileName = sanitizeFileName_(String(item.fileName || ('travel-photo-' + (index + 1) + '.jpg')));
    var originalBytes = Utilities.base64Decode(String(item.originalBase64));
    var previewBytes = Utilities.base64Decode(String(item.previewBase64));

    if (originalBytes.length + previewBytes.length > 3 * 1024 * 1024) {
      throw new Error('Photo pair is too large after decoding');
    }

    var original = originalsFolder.createFile(Utilities.newBlob(originalBytes, mimeType, fileName));
    var previewName = 'preview-' + fileName.replace(/\.[^.]+$/, '') + '.jpg';
    var preview = previewsFolder.createFile(Utilities.newBlob(previewBytes, 'image/jpeg', previewName));

    original.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    preview.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    return {
      driveFileId: original.getId(),
      driveUrl: 'https://drive.google.com/uc?export=view&id=' + original.getId(),
      thumbnailUrl: 'https://drive.google.com/thumbnail?id=' + preview.getId() + '&sz=w1120',
      fileName: fileName,
      mimeType: mimeType,
      folderId: placeFolder.getId(),
      originalFolderId: originalsFolder.getId(),
      previewFolderId: previewsFolder.getId()
    };
  });
}

function getOrCreatePlaceFolder_(root, placeName, groupId) {
  var folders = root.getFoldersByName(placeName);
  if (folders.hasNext()) return folders.next();
  var folder = root.createFolder(placeName);
  folder.setDescription('TravelTank300 placeId: ' + groupId);
  return folder;
}

function ensurePlaceMetadata_(folder, placeName, groupId) {
  var files = folder.getFilesByName('place-info.json');
  if (files.hasNext()) return;
  var payload = {
    app: 'TravelTank300',
    placeName: placeName,
    placeId: groupId,
    createdAt: new Date().toISOString()
  };
  folder.createFile('place-info.json', JSON.stringify(payload, null, 2), MimeType.PLAIN_TEXT);
}

function validatePhotoPair_(item, index) {
  if (!item || !item.originalBase64 || !item.previewBase64) throw new Error('Photo pair ' + (index + 1) + ' is incomplete');
}
function sanitizeFileName_(name) { return name.replace(/[\\/:*?"<>|]/g, '-').slice(0, 180); }
function sanitizeFolderName_(name) { return name.replace(/[\\/:*?"<>|]/g, '-').trim().slice(0, 100) || 'สถานที่ไม่ระบุชื่อ'; }
function deleteImage_(fileId) { if (!fileId) throw new Error('Missing fileId'); DriveApp.getFileById(fileId).setTrashed(true); return true; }
function getImage_(fileId) {
  if (!fileId) throw new Error('Missing fileId');
  var blob = DriveApp.getFileById(fileId).getBlob();
  var bytes = blob.getBytes();
  if (bytes.length > 15 * 1024 * 1024) throw new Error('Image exceeds 15 MB');
  return { base64: Utilities.base64Encode(bytes), mimeType: blob.getContentType() };
}
function getOrCreateFolder_(parent, name) { var folders = parent.getFoldersByName(name); return folders.hasNext() ? folders.next() : parent.createFolder(name); }
function jsonResponse_(payload) { return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON); }

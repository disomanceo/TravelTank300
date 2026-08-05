export function extractDriveFileId(value:string|null|undefined){if(!value)return null;const v=value.trim();const direct=v.match(/^[\w-]{20,}$/);if(direct)return direct[0];for(const r of [/\/d\/([\w-]{20,})/,/[?&]id=([\w-]{20,})/,/thumbnail\?id=([\w-]{20,})/]){const m=v.match(r);if(m)return m[1]}return null}
export function imageProxyUrl(id:string,w=960,original=false){return `/api/images/${encodeURIComponent(id)}?w=${w}${original?"&original=1":""}`}
export function coverPreviewUrl(url:string|null|undefined,w=640){const id=extractDriveFileId(url);return id?imageProxyUrl(id,w):url||"/places/forest.svg"}
export function drivePreviewUrl(id:string|null,url:string|null|undefined,w=960){const fileId=id||extractDriveFileId(url);return fileId?imageProxyUrl(fileId,w):url||"/places/forest.svg"}
export function driveOriginalUrl(id:string|null,url:string|null|undefined){const fileId=id||extractDriveFileId(url);return fileId?imageProxyUrl(fileId,2400,true):url||"/places/forest.svg"}

// A non-personal change marker invalidates already-open Pages tabs after restore/delete.
export const DEVICE_PRIVACY_EPOCH='mochi-days:privacy-epoch:v1';
let observed:string|null|undefined;
export function rememberDeviceEpoch(){
 if(observed===undefined)observed=localStorage.getItem(DEVICE_PRIVACY_EPOCH);
 return observed;
}
export function assertDeviceWriteAllowed(){
 if(localStorage.getItem(DEVICE_PRIVACY_EPOCH)!==rememberDeviceEpoch())throw new Error('別の画面で記録の復元・削除が行われました。開き直してからお使いください。');
}
export function deviceStorageWritable(){try{assertDeviceWriteAllowed();return true}catch{return false}}
export function rotateDeviceEpoch(){
 assertDeviceWriteAllowed();const epoch=crypto.randomUUID();
 try{localStorage.setItem(DEVICE_PRIVACY_EPOCH,epoch)}catch{throw new Error('記録を変更する準備ができませんでした。保存設定と空き容量を確認してください。')}
 return epoch;
}
// Only the tab whose failed operation issued this exact marker may resume its unchanged data.
export function acknowledgeFailedDeviceChange(epoch:string){
 if(localStorage.getItem(DEVICE_PRIVACY_EPOCH)===epoch)observed=epoch;
}

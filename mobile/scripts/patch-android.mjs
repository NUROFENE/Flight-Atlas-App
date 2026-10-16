import { readFile, writeFile } from 'node:fs/promises';
const android = new URL('../android/', import.meta.url);
const manifest = new URL('app/src/main/AndroidManifest.xml', android);
let text = await readFile(manifest, 'utf8');
const intent = [
  '',
  '            <!-- Supabase Discord OAuth redirects back into the Android app. -->',
  '            <intent-filter android:autoVerify="false">',
  '                <action android:name="android.intent.action.VIEW" />',
  '                <category android:name="android.intent.category.DEFAULT" />',
  '                <category android:name="android.intent.category.BROWSABLE" />',
  '                <data android:scheme="flightatlas" android:host="auth" android:pathPrefix="/callback" />',
  '            </intent-filter>'
].join('\n');
if (!text.includes('android:scheme="flightatlas"')) {
  if (!text.includes('</activity>')) throw new Error('Expected MainActivity in AndroidManifest.xml');
  text = text.replace('</activity>', intent + '\n        </activity>');
  await writeFile(manifest, text);
}
const vpath = new URL('variables.gradle', android);
const gradle = await readFile(vpath, 'utf8');
if (!/compileSdkVersion\s*=\s*36/.test(gradle) || !/targetSdkVersion\s*=\s*36/.test(gradle)) {
  throw new Error('Android must target API 36 (Google Play requirement from 2026-08-31).');
}
console.log('Android OAuth app-link installed; targetSdkVersion 36 confirmed.');

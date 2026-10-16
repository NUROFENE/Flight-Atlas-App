import { readFile, writeFile, copyFile } from 'node:fs/promises';
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
// The official radar runs as a native Android Activity inside Flight Atlas, not Chrome.
if (!text.includes('android:name=".RadarActivity"')) {
  text = text.replace('</application>', '    <activity android:name=".RadarActivity" android:exported="false" android:theme="@android:style/Theme.Material.NoActionBar" />\n    </application>');
  await writeFile(manifest, text);
}
const javaDir = new URL('app/src/main/java/com/flightatlas/mobile/', android);
await copyFile(new URL('../native/RadarPlugin.java', import.meta.url), new URL('RadarPlugin.java', javaDir));
await copyFile(new URL('../native/RadarActivity.java', import.meta.url), new URL('RadarActivity.java', javaDir));
const mainJava = new URL('MainActivity.java', javaDir);
let mainSource = await readFile(mainJava, 'utf8');
if (!mainSource.includes('registerPlugin(RadarPlugin.class)')) {
  if (!mainSource.includes('extends BridgeActivity')) throw new Error('Unexpected Capacitor MainActivity');
  mainSource = mainSource.replace(/(public class MainActivity extends BridgeActivity\s*\{)/, '$1\n    @Override\n    public void onCreate(android.os.Bundle state) {\n        registerPlugin(RadarPlugin.class);\n        super.onCreate(state);\n    }\n');
  if (!mainSource.includes('registerPlugin(RadarPlugin.class)')) throw new Error('Could not register Android radar plugin');
  await writeFile(mainJava, mainSource);
}
const appGradle = new URL('app/build.gradle', android);
let appBuild = await readFile(appGradle, 'utf8');
appBuild = appBuild.replace(/versionCode\s+1\b/, 'versionCode 2').replace(/versionName\s+"1.0"/, 'versionName "0.2.0"');
await writeFile(appGradle, appBuild);
const vpath = new URL('variables.gradle', android);
const gradle = await readFile(vpath, 'utf8');
if (!/compileSdkVersion\s*=\s*36/.test(gradle) || !/targetSdkVersion\s*=\s*36/.test(gradle)) {
  throw new Error('Android must target API 36 (Google Play requirement from 2026-08-31).');
}
console.log('Android OAuth + native VATSIM Radar registered; targetSdkVersion 36 confirmed.');

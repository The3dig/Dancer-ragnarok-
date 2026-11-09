// Ajustes no projeto Android gerado: tela cheia deitada e tela sempre ligada.
const fs = require('fs');
const f = 'android/app/src/main/AndroidManifest.xml';
let s = fs.readFileSync(f, 'utf8');
if (!s.includes('screenOrientation')) s = s.replace('<activity', '<activity\n            android:screenOrientation="sensorLandscape"');
fs.writeFileSync(f, s);
const st = 'android/app/src/main/res/values/styles.xml';
let y = fs.readFileSync(st, 'utf8');
if (!y.includes('windowFullscreen')) y = y.replace(/(<style name="AppTheme.NoActionBar"[^>]*>)/, '$1\n        <item name="android:windowFullscreen">true</item>');
fs.writeFileSync(st, y);
const act = 'android/app/src/main/java/com/lyra/dancarina/MainActivity.java';
fs.writeFileSync(act, `package com.lyra.dancarina;

import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            getWindow().getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY | View.SYSTEM_UI_FLAG_FULLSCREEN
                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN);
        }
    }
}
`);
console.log('Android ajustado: landscape, tela cheia, tela sempre ligada.');

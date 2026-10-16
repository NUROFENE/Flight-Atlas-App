package com.flightatlas.mobile;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.graphics.Color;
import android.os.Bundle;
import android.webkit.CookieManager;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;

public class RadarActivity extends Activity {
    private static final String RADAR_URL = "https://vatsim-radar.com/";
    private WebView radar;
    private ProgressBar progress;

    private int dp(float dp) {
        return Math.round(dp * getResources().getDisplayMetrics().density);
    }

    private Button action(String label, Runnable callback) {
        Button button = new Button(this);
        button.setAllCaps(false);
        button.setText(label);
        button.setTextSize(14);
        button.setTextColor(Color.WHITE);
        button.setBackgroundColor(Color.TRANSPARENT);
        button.setOnClickListener(v -> callback.run());
        return button;
    }

    @Override
    @SuppressLint("SetJavaScriptEnabled")
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().setStatusBarColor(Color.rgb(24, 24, 25));
        getWindow().setNavigationBarColor(Color.rgb(24, 24, 25));

        LinearLayout container = new LinearLayout(this);
        container.setOrientation(LinearLayout.VERTICAL);
        container.setBackgroundColor(Color.rgb(24, 24, 25));

        LinearLayout top = new LinearLayout(this);
        top.setGravity(Gravity.CENTER_VERTICAL);
        top.setBackgroundColor(Color.rgb(24, 24, 25));

        Button back = action("‹", this::onBackPressed);
        top.addView(back, new LinearLayout.LayoutParams(dp(48), dp(52)));

        TextView title = new TextView(this);
        title.setText("VATSIM RADAR");
        title.setTextSize(16);
        title.setLetterSpacing(.08f);
        title.setTextColor(Color.WHITE);
        title.setGravity(Gravity.CENTER_VERTICAL);
        top.addView(title, new LinearLayout.LayoutParams(0, dp(52), 1));

        Button refresh = action("↻", () -> { if (radar != null) radar.reload(); });
        top.addView(refresh, new LinearLayout.LayoutParams(dp(52), dp(52)));
        container.addView(top);

        progress = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        progress.setIndeterminate(false);
        progress.setMax(100);
        container.addView(progress, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(3)));

        radar = new WebView(this);
        radar.setBackgroundColor(Color.rgb(24, 24, 25));
        radar.getSettings().setJavaScriptEnabled(true);
        radar.getSettings().setDomStorageEnabled(true);
        radar.getSettings().setJavaScriptCanOpenWindowsAutomatically(false);
        radar.getSettings().setSupportMultipleWindows(false);
        radar.getSettings().setAllowFileAccess(false);
        radar.getSettings().setAllowContentAccess(false);
        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(radar, true);
        radar.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                String scheme = request.getUrl().getScheme();
                return !"https".equalsIgnoreCase(scheme) && !"http".equalsIgnoreCase(scheme);
            }
            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (request.isForMainFrame()) {
                    Toast.makeText(RadarActivity.this,
                        "Сайт VATSIM Radar недоступен. Проверь подключение.", Toast.LENGTH_LONG).show();
                }
            }
        });
        radar.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int progressPercent) {
                progress.setProgress(progressPercent);
                progress.setVisibility(progressPercent >= 100 ? View.GONE : View.VISIBLE);
            }
        });
        container.addView(radar, new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, 0, 1));
        setContentView(container);
        radar.loadUrl(RADAR_URL);
    }

    @Override
    public void onBackPressed() {
        if (radar != null && radar.canGoBack()) {
            radar.goBack();
        } else {
            finish();
        }
    }

    @Override
    protected void onDestroy() {
        if (radar != null) {
            ((ViewGroup) radar.getParent()).removeView(radar);
            radar.destroy();
            radar = null;
        }
        super.onDestroy();
    }
}

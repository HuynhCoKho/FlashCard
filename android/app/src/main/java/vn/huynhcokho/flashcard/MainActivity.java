package vn.huynhcokho.flashcard;

import android.content.Context;
import android.content.SharedPreferences;
import android.content.pm.PackageInfo;
import android.os.Bundle;
import android.webkit.WebView;
import androidx.core.content.pm.PackageInfoCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final String PREFS_NAME = "flashcard-shell";
    private static final String KEY_WEB_VERSION = "web-version";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(NativeTextToSpeechPlugin.class);
        registerPlugin(AppControlPlugin.class);

        boolean cleared = clearWebCacheAfterUpgrade();
        super.onCreate(savedInstanceState);

        // Dựng WebView trước super.onCreate() không phải máy nào cũng cho phép. Hỏng thì
        // xoá bằng WebView của bridge rồi nạp lại trang, đổi lại là chớp một cái khi mở.
        if (!cleared) clearWebCacheAfterLoad();
    }

    /**
     * Xoá bộ nhớ đệm của WebView mỗi khi cài bản mới.
     *
     * Capacitor phục vụ giao diện qua https://localhost/index.html — địa chỉ y hệt nhau
     * ở mọi phiên bản. WebView thấy trùng địa chỉ nên lấy lại bản đã đệm, và người dùng
     * cập nhật xong vẫn thấy giao diện cũ. Tham số ?v= trong index.html chỉ cứu được
     * styles.css và script.js, còn chính index.html thì không.
     *
     * Phải xoá trước super.onCreate() vì Capacitor nạp trang ngay trong đó; xoá sau thì
     * lần mở này vẫn còn thấy bản cũ.
     */
    private boolean clearWebCacheAfterUpgrade() {
        try {
            if (!isUpgrade()) return true;

            // clearCache(true) xoá cả thư mục đệm dùng chung của ứng dụng, nên một
            // WebView tạm cũng đủ và không cần đợi bridge dựng xong.
            new WebView(this).clearCache(true);
            rememberVersion();
            return true;
        } catch (Exception error) {
            return false;
        }
    }

    private void clearWebCacheAfterLoad() {
        try {
            if (bridge == null || bridge.getWebView() == null) return;
            bridge.getWebView().clearCache(true);
            bridge.getWebView().reload();
            rememberVersion();
        } catch (Exception ignored) {
            // Hết cách thì thôi, thà giao diện chậm đổi còn hơn treo app.
        }
    }

    private boolean isUpgrade() throws Exception {
        PackageInfo info = getPackageManager().getPackageInfo(getPackageName(), 0);
        long installed = PackageInfoCompat.getLongVersionCode(info);
        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        return prefs.getLong(KEY_WEB_VERSION, -1L) != installed;
    }

    private void rememberVersion() {
        try {
            PackageInfo info = getPackageManager().getPackageInfo(getPackageName(), 0);
            getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                .edit()
                .putLong(KEY_WEB_VERSION, PackageInfoCompat.getLongVersionCode(info))
                .apply();
        } catch (Exception ignored) {
        }
    }
}

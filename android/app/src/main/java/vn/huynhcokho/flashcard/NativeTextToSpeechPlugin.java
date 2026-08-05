package vn.huynhcokho.flashcard;

import android.content.Intent;
import android.content.pm.ResolveInfo;
import android.provider.Settings;
import android.speech.tts.TextToSpeech;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@CapacitorPlugin(name = "NativeTextToSpeech")
public class NativeTextToSpeechPlugin extends Plugin {
    /** Engine của Google phủ nhiều thứ tiếng nhất; engine cài sẵn của hãng thường chỉ có vài tiếng châu Âu. */
    private static final String GOOGLE_ENGINE = "com.google.android.tts";

    private TextToSpeech textToSpeech;
    private String engineInUse;
    private boolean ready = false;
    private boolean initializationFailed = false;
    private final List<PendingSpeech> pending = new ArrayList<>();

    private static class PendingSpeech {
        final String text;
        final List<String> languages;
        final float rate;
        final PluginCall call;

        PendingSpeech(String text, List<String> languages, float rate, PluginCall call) {
            this.text = text;
            this.languages = languages;
            this.rate = rate;
            this.call = call;
        }
    }

    @Override
    public void load() {
        startEngine(pickEngine());
    }

    /**
     * Chọn engine trước khi khởi tạo, thay vì để hệ thống đưa engine mặc định.
     *
     * Đây là chỗ bản trước hỏng: máy có Google TTS với đủ giọng Trung, Nhật, Hàn, Thái
     * nhưng engine mặc định lại là của hãng và chỉ đọc được tiếng Anh, nên mọi ngoại ngữ
     * khác đều câm dù mã ngôn ngữ gửi xuống hoàn toàn đúng.
     */
    private String pickEngine() {
        List<String> engines = installedEngines();
        if (engines.contains(GOOGLE_ENGINE)) return GOOGLE_ENGINE;
        return null; // không có Google TTS thì đành dùng mặc định
    }

    private List<String> installedEngines() {
        List<String> packages = new ArrayList<>();
        try {
            Intent intent = new Intent(TextToSpeech.Engine.INTENT_ACTION_TTS_SERVICE);
            List<ResolveInfo> services = getContext().getPackageManager().queryIntentServices(intent, 0);
            for (ResolveInfo info : services) {
                if (info.serviceInfo != null && !packages.contains(info.serviceInfo.packageName)) {
                    packages.add(info.serviceInfo.packageName);
                }
            }
        } catch (Exception ignored) {
            // Máy chặn truy vấn gói thì coi như không biết engine nào, dùng mặc định.
        }
        return packages;
    }

    private void startEngine(String enginePackage) {
        engineInUse = enginePackage;
        TextToSpeech.OnInitListener listener = status -> {
            ready = status == TextToSpeech.SUCCESS;
            initializationFailed = !ready;
            List<PendingSpeech> waiting = new ArrayList<>(pending);
            pending.clear();
            for (PendingSpeech item : waiting) {
                if (ready) speakNow(item);
                else item.call.reject("Thiết bị không khởi tạo được bộ phát âm.");
            }
        };

        textToSpeech = enginePackage == null
            ? new TextToSpeech(getContext(), listener)
            : new TextToSpeech(getContext(), listener, enginePackage);
    }

    @PluginMethod
    public void speak(PluginCall call) {
        String text = call.getString("text", "").trim();
        Float requestedRate = call.getFloat("rate", 0.92f);
        float rate = requestedRate == null ? 0.92f : requestedRate;

        if (text.isEmpty()) {
            call.reject("Thiếu nội dung cần phát âm.");
            return;
        }

        PendingSpeech item = new PendingSpeech(text, requestedLanguages(call), rate, call);
        getActivity().runOnUiThread(() -> {
            if (ready) speakNow(item);
            else if (initializationFailed) call.reject("Thiết bị không có bộ phát âm khả dụng.");
            else pending.add(item);
        });
    }

    /**
     * Mở màn hình cài giọng đọc, thử lần lượt nhiều đường vì không máy nào giống máy nào.
     *
     * Android đời mới để Google TTS tự tải giọng nên màn hình INSTALL_TTS_DATA có thể
     * không còn tồn tại; khi đó đưa thẳng người dùng vào phần cài đặt phát âm của hệ thống.
     */
    @PluginMethod
    public void installVoices(PluginCall call) {
        List<Intent> attempts = new ArrayList<>();

        Intent engineSpecific = new Intent(TextToSpeech.Engine.ACTION_INSTALL_TTS_DATA);
        if (engineInUse != null) engineSpecific.setPackage(engineInUse);
        attempts.add(engineSpecific);
        attempts.add(new Intent(TextToSpeech.Engine.ACTION_INSTALL_TTS_DATA));
        attempts.add(new Intent("com.android.settings.TTS_SETTINGS"));
        attempts.add(new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS));

        for (Intent intent : attempts) {
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            try {
                getContext().startActivity(intent);
                JSObject out = new JSObject();
                out.put("opened", intent.getAction());
                call.resolve(out);
                return;
            } catch (Exception ignored) {
                // Máy không có màn hình này, thử đường kế tiếp.
            }
        }

        call.reject("Máy không mở được màn hình cài giọng đọc nào.");
    }

    /** Báo cáo engine đang dùng và danh sách ngôn ngữ máy thực sự có, để dò lỗi phát âm. */
    @PluginMethod
    public void diagnostics(PluginCall call) {
        JSObject out = new JSObject();
        out.put("engine", engineInUse == null ? "(mặc định)" : engineInUse);
        out.put("ready", ready);

        JSArray engines = new JSArray();
        for (String name : installedEngines()) engines.put(name);
        out.put("engines", engines);

        JSArray languages = new JSArray();
        try {
            Set<Locale> available = textToSpeech.getAvailableLanguages();
            if (available != null) {
                for (Locale locale : available) languages.put(locale.toLanguageTag());
            }
        } catch (Exception ignored) {
            // Một số engine ném lỗi ở đây.
        }
        out.put("languages", languages);
        call.resolve(out);
    }

    /**
     * Danh sách ngôn ngữ ứng viên, ưu tiên theo thứ tự trang web gửi xuống.
     * Nhận cả "langs" dạng "zh-CN,zh-TW" lẫn "lang" đơn lẻ của bản cũ.
     */
    private List<String> requestedLanguages(PluginCall call) {
        List<String> languages = new ArrayList<>();
        String list = call.getString("langs", "");
        for (String tag : list.split(",")) {
            String trimmed = tag.trim();
            if (!trimmed.isEmpty() && !languages.contains(trimmed)) languages.add(trimmed);
        }
        String single = call.getString("lang", "").trim();
        if (!single.isEmpty() && !languages.contains(single)) languages.add(single);
        if (languages.isEmpty()) languages.add("en-US");
        return languages;
    }

    private void speakNow(PendingSpeech item) {
        Locale chosen = chooseLocale(item.languages);
        String engineName = engineInUse == null ? "(mặc định)" : engineInUse;

        // Đọc tiếng Trung bằng giọng Anh chỉ ra tiếng lảm nhảm, nên thà không đọc và
        // báo về để trang web xin bản đọc thật từ máy chủ.
        if (chosen == null) {
            JSObject payload = new JSObject();
            payload.put("engine", engineName);
            payload.put("fallback", true);
            payload.put("spoken", false);
            item.call.resolve(payload);
            return;
        }

        textToSpeech.setSpeechRate(Math.max(0.5f, Math.min(1.5f, item.rate)));
        int result = textToSpeech.speak(item.text, TextToSpeech.QUEUE_FLUSH, null, UUID.randomUUID().toString());
        if (result == TextToSpeech.SUCCESS) {
            JSObject payload = new JSObject();
            payload.put("language", chosen.toLanguageTag());
            payload.put("engine", engineName);
            payload.put("fallback", false);
            payload.put("spoken", true);
            item.call.resolve(payload);
        } else {
            item.call.reject("Không phát âm được nội dung này.");
        }
    }

    /**
     * Trả về locale đã được nạp vào bộ đọc, hoặc null nếu không ngôn ngữ nào dùng được.
     *
     * setLanguage() là phép thử đáng tin duy nhất: isLanguageAvailable() báo theo dữ liệu
     * giọng đã tải sẵn trong máy nên trả về LANG_MISSING_DATA cho cả những thứ tiếng mà
     * engine vẫn đọc được bằng giọng mạng.
     */
    private Locale chooseLocale(List<String> tags) {
        for (String tag : tags) {
            Locale locale = Locale.forLanguageTag(tag);
            if (apply(locale)) return locale;
        }

        // Bỏ mã quốc gia: máy có thể chỉ khai báo "zh" chứ không có đúng "zh-CN".
        for (String tag : tags) {
            String base = Locale.forLanguageTag(tag).getLanguage();
            if (base.isEmpty()) continue;

            Locale loose = new Locale(base);
            if (apply(loose)) return loose;

            Locale installed = firstInstalledFor(base);
            if (installed != null && apply(installed)) return installed;
        }

        return null;
    }

    private boolean apply(Locale locale) {
        int result = textToSpeech.setLanguage(locale);
        return result >= TextToSpeech.LANG_AVAILABLE;
    }

    /** Quét danh sách ngôn ngữ engine thực sự có, để bắt các biến thể như cmn-Hans-CN. */
    private Locale firstInstalledFor(String base) {
        try {
            Set<Locale> available = textToSpeech.getAvailableLanguages();
            if (available != null) {
                for (Locale locale : available) {
                    if (base.equalsIgnoreCase(locale.getLanguage())) return locale;
                }
            }
        } catch (Exception ignored) {
            // Một vài engine ném lỗi ở đây; coi như không tìm được gì.
        }
        return null;
    }

    @Override
    protected void handleOnDestroy() {
        if (textToSpeech != null) {
            textToSpeech.stop();
            textToSpeech.shutdown();
        }
        pending.clear();
        super.handleOnDestroy();
    }
}

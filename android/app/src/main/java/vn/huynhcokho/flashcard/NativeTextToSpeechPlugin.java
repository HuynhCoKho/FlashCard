package vn.huynhcokho.flashcard;

import android.speech.tts.TextToSpeech;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@CapacitorPlugin(name = "NativeTextToSpeech")
public class NativeTextToSpeechPlugin extends Plugin {
    private TextToSpeech textToSpeech;
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
        textToSpeech = new TextToSpeech(getContext(), status -> {
            ready = status == TextToSpeech.SUCCESS;
            initializationFailed = !ready;
            List<PendingSpeech> waiting = new ArrayList<>(pending);
            pending.clear();
            for (PendingSpeech item : waiting) {
                if (ready) speakNow(item);
                else item.call.reject("Thiết bị không khởi tạo được bộ phát âm.");
            }
        });
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
        boolean usingFallback = chosen == null;
        if (usingFallback) {
            // Không tìm được giọng đúng thì vẫn đọc bằng giọng mặc định, im lặng hoàn toàn còn khó hiểu hơn.
            chosen = Locale.US;
            textToSpeech.setLanguage(chosen);
        }

        textToSpeech.setSpeechRate(Math.max(0.5f, Math.min(1.5f, item.rate)));
        int result = textToSpeech.speak(item.text, TextToSpeech.QUEUE_FLUSH, null, UUID.randomUUID().toString());
        if (result == TextToSpeech.SUCCESS) {
            JSObject payload = new JSObject();
            payload.put("language", chosen.toLanguageTag());
            payload.put("fallback", usingFallback);
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
            for (Locale locale : textToSpeech.getAvailableLanguages()) {
                if (base.equalsIgnoreCase(locale.getLanguage())) return locale;
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

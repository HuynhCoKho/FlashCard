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
        final String language;
        final float rate;
        final PluginCall call;

        PendingSpeech(String text, String language, float rate, PluginCall call) {
            this.text = text;
            this.language = language;
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
        String language = call.getString("lang", "en-US");
        Float requestedRate = call.getFloat("rate", 0.92f);
        float rate = requestedRate == null ? 0.92f : requestedRate;

        if (text.isEmpty()) {
            call.reject("Thiếu nội dung cần phát âm.");
            return;
        }

        PendingSpeech item = new PendingSpeech(text, language, rate, call);
        getActivity().runOnUiThread(() -> {
            if (ready) speakNow(item);
            else if (initializationFailed) call.reject("Thiết bị không có bộ phát âm khả dụng.");
            else pending.add(item);
        });
    }

    private void speakNow(PendingSpeech item) {
        Locale locale = Locale.forLanguageTag(item.language);
        int languageResult = textToSpeech.setLanguage(locale);
        if (languageResult == TextToSpeech.LANG_MISSING_DATA || languageResult == TextToSpeech.LANG_NOT_SUPPORTED) {
            textToSpeech.setLanguage(Locale.US);
        }
        textToSpeech.setSpeechRate(Math.max(0.5f, Math.min(1.5f, item.rate)));
        int result = textToSpeech.speak(item.text, TextToSpeech.QUEUE_FLUSH, null, UUID.randomUUID().toString());
        if (result == TextToSpeech.SUCCESS) {
            item.call.resolve(new JSObject());
        } else {
            item.call.reject("Không phát âm được nội dung này.");
        }
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

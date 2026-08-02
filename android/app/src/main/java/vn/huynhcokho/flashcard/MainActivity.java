package vn.huynhcokho.flashcard;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(NativeTextToSpeechPlugin.class);
        super.onCreate(savedInstanceState);
    }
}

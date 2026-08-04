package vn.huynhcokho.flashcard;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "AppControl")
public class AppControlPlugin extends Plugin {
    @PluginMethod
    public void exitApp(PluginCall call) {
        call.resolve(new JSObject());
        getActivity().runOnUiThread(() -> getActivity().finishAffinity());
    }
}
